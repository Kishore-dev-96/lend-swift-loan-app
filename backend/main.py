from datetime import datetime, timedelta, timezone
from pathlib import Path
import secrets
from typing import Annotated

from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from .database import BASE_DIR, get_connection, init_db
from .ocr import OcrError, extract_aadhaar, extract_pan
from .security import (
    MAX_FILE_SIZE,
    aadhaar_last4,
    create_token,
    hash_otp,
    hash_password,
    hash_value,
    safe_upload_name,
    validate_email,
    validate_mobile,
    validate_pan,
    verify_otp_hash,
    verify_password,
)
from .sms import send_sms

FRONTEND_DIR = BASE_DIR.parent / "frontend"
TEMP_UPLOAD_DIR = BASE_DIR / "secure_uploads"

# NOTE: In production, serve this FastAPI app behind HTTPS/TLS.
# This demo implementation is built for local Windows development only.
app = FastAPI(
    title="LendSwift KYC API",
    description="Safe OCR-based demo KYC API. Does not connect to UIDAI or government databases.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173", "http://localhost:5173", "http://127.0.0.1:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    init_db()
    TEMP_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


class SendOtpRequest(BaseModel):
    mobile: str = Field(..., min_length=10, max_length=10)


class VerifyOtpRequest(BaseModel):
    mobile: str = Field(..., min_length=10, max_length=10)
    otp: str = Field(..., min_length=6, max_length=6)
    user_id: int | None = None


class RegisterRequest(BaseModel):
    email: str
    password: str = Field(..., min_length=8)
    name: str | None = None


class LoginRequest(BaseModel):
    email: str
    password: str


class MobileLoginRequest(BaseModel):
    mobile: str = Field(..., min_length=10, max_length=10)
    otp: str = Field(..., min_length=6, max_length=6)


def utc_now():
    return datetime.now(timezone.utc)


async def persist_upload(file: UploadFile) -> Path:
    filename = safe_upload_name(file.filename or "")
    target = TEMP_UPLOAD_DIR / filename
    total = 0
    with target.open("wb") as handle:
        while chunk := await file.read(1024 * 1024):
            total += len(chunk)
            if total > MAX_FILE_SIZE:
                target.unlink(missing_ok=True)
                raise HTTPException(status_code=413, detail="File size exceeds 5MB")
            handle.write(chunk)
    return target


def delete_files(paths: list[Path]):
    for path in paths:
        path.unlink(missing_ok=True)


@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "compliance": "OCR-only demo; no UIDAI or government database integration.",
    }


@app.post("/api/kyc/upload")
async def upload_kyc_documents(
    consent: Annotated[bool, Form()],
    aadhaar_file: Annotated[UploadFile, File()],
    pan_file: Annotated[UploadFile, File()],
):
    if not consent:
        raise HTTPException(status_code=400, detail="Consent is required before document processing")

    saved_files: list[Path] = []
    try:
        aadhaar_path = await persist_upload(aadhaar_file)
        pan_path = await persist_upload(pan_file)
        saved_files.extend([aadhaar_path, pan_path])

        aadhaar = extract_aadhaar(aadhaar_path)
        pan = extract_pan(pan_path)

        if not aadhaar.get("aadhaar_last4"):
            raise HTTPException(status_code=422, detail="Unable to read document")
        if not pan.get("pan_number"):
            raise HTTPException(status_code=422, detail="Incorrect PAN format")

        name = pan.get("name") or aadhaar.get("name")
        with get_connection() as conn:
            cursor = conn.execute(
                """
                INSERT INTO users
                (name, dob, pan_number, aadhaar_last4, address, profile_status)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (
                    name,
                    aadhaar.get("dob"),
                    hash_value(pan["pan_number"]),
                    aadhaar["aadhaar_last4"],
                    aadhaar.get("address"),
                    "partial",
                ),
            )
            user_id = cursor.lastrowid

        return {
            "user_id": user_id,
            "profile_status": "Partially Verified Profile",
            "completion": 70,
            "profile": {
                "full_name": name,
                "date_of_birth": aadhaar.get("dob"),
                "pan_number": pan["pan_number"],
                "masked_aadhaar_number": aadhaar["aadhaar_masked"],
                "address": aadhaar.get("address"),
            },
            "disclaimer": "OCR-based demo only. No UIDAI or government database connection was used.",
        }
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except OcrError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    finally:
        delete_files(saved_files)


@app.post("/api/send-otp")
def send_otp(payload: SendOtpRequest):
    if not validate_mobile(payload.mobile):
        raise HTTPException(status_code=400, detail="Invalid mobile number")

    otp = f"{secrets.randbelow(1_000_000):06d}"
    expiry = utc_now() + timedelta(minutes=5)
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO otp_logs (mobile, otp_hash, expiry_time)
            VALUES (?, ?, ?)
            """,
            (payload.mobile, hash_otp(otp), expiry.isoformat()),
        )

    sms_result = send_sms(payload.mobile, f"Your LendSwift OTP is {otp}. It expires in 5 minutes.")
    return {
        "message": "OTP sent",
        "expires_in_seconds": 300,
        "delivery": sms_result,
        "dev_otp": otp if sms_result.get("provider") == "console" else None,
    }


@app.post("/api/verify-otp")
def verify_otp(payload: VerifyOtpRequest):
    if not validate_mobile(payload.mobile):
        raise HTTPException(status_code=400, detail="Invalid mobile number")

    with get_connection() as conn:
        row = conn.execute(
            """
            SELECT * FROM otp_logs
            WHERE mobile = ? AND verified = 0
            ORDER BY created_at DESC, id DESC
            LIMIT 1
            """,
            (payload.mobile,),
        ).fetchone()

        if not row:
            raise HTTPException(status_code=400, detail="OTP expired")

        expiry = datetime.fromisoformat(row["expiry_time"])
        if expiry < utc_now():
            raise HTTPException(status_code=400, detail="OTP expired")
        if row["attempts"] >= 3:
            raise HTTPException(status_code=429, detail="Maximum OTP attempts exceeded")

        if not verify_otp_hash(payload.otp, row["otp_hash"]):
            attempts = row["attempts"] + 1
            conn.execute("UPDATE otp_logs SET attempts = ? WHERE id = ?", (attempts, row["id"]))
            raise HTTPException(status_code=400, detail="Invalid OTP")

        conn.execute("UPDATE otp_logs SET verified = 1, attempts = ? WHERE id = ?", (row["attempts"], row["id"]))
        if payload.user_id:
            conn.execute(
                """
                UPDATE users
                SET mobile = ?, mobile_verified = 1,
                    profile_status = CASE WHEN profile_status = 'partial' THEN 'complete' ELSE profile_status END
                WHERE id = ?
                """,
                (payload.mobile, payload.user_id),
            )

    return {"message": "Mobile verified", "mobile_verified": True}


@app.post("/api/auth/register")
def register(payload: RegisterRequest):
    if not validate_email(payload.email):
        raise HTTPException(status_code=400, detail="Invalid email address")
    with get_connection() as conn:
        try:
            cursor = conn.execute(
                """
                INSERT INTO users (name, email, password_hash, profile_status)
                VALUES (?, ?, ?, ?)
                """,
                (payload.name, payload.email.lower(), hash_password(payload.password), "partial"),
            )
        except Exception as exc:
            raise HTTPException(status_code=409, detail="Email already registered") from exc
    token = create_token({"sub": cursor.lastrowid, "email": payload.email.lower()})
    return {"message": "Registered", "token": token}


@app.post("/api/auth/login")
def login(payload: LoginRequest):
    if not validate_email(payload.email):
        raise HTTPException(status_code=400, detail="Invalid email address")
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM users WHERE email = ?", (payload.email.lower(),)).fetchone()
    if not row or not row["password_hash"] or not verify_password(payload.password, row["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_token({"sub": row["id"], "email": row["email"]})
    return {"message": "Logged in", "token": token}


@app.post("/api/auth/mobile-login")
def mobile_login(payload: MobileLoginRequest):
    verify_otp(VerifyOtpRequest(mobile=payload.mobile, otp=payload.otp))
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM users WHERE mobile = ?", (payload.mobile,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="No profile found for this mobile number")
    token = create_token({"sub": row["id"], "mobile": payload.mobile})
    return {"message": "Logged in", "token": token}


@app.get("/api/users/{user_id}")
def get_user_profile(user_id: int):
    with get_connection() as conn:
        row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Profile not found")
    return {
        "id": row["id"],
        "name": row["name"],
        "dob": row["dob"],
        "pan_number": "Stored as hash",
        "masked_aadhaar_number": f"XXXX-XXXX-{row['aadhaar_last4']}" if row["aadhaar_last4"] else None,
        "address": row["address"],
        "mobile": row["mobile"],
        "mobile_verified": bool(row["mobile_verified"]),
        "profile_status": row["profile_status"],
        "created_at": row["created_at"],
    }


@app.get("/")
def serve_upload_page():
    return FileResponse(FRONTEND_DIR / "kyc-upload.html")


if FRONTEND_DIR.exists():
    app.mount("/", StaticFiles(directory=FRONTEND_DIR, html=True), name="frontend")
