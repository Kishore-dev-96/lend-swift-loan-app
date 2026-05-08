import base64
import hashlib
import hmac
import json
import os
import re
import secrets
import time
from pathlib import Path

import bcrypt

SECRET_KEY = os.getenv("LENDSWIFT_SECRET_KEY", "dev-only-change-this-secret-key")
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".pdf"}
MAX_FILE_SIZE = 5 * 1024 * 1024


def validate_mobile(mobile: str) -> bool:
    return bool(re.fullmatch(r"[6-9]\d{9}", mobile or ""))


def validate_email(email: str) -> bool:
    return bool(re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email or ""))


def validate_pan(pan: str) -> bool:
    return bool(re.fullmatch(r"[A-Z]{5}[0-9]{4}[A-Z]", (pan or "").upper()))


def mask_aadhaar(value: str) -> str:
    digits = re.sub(r"\D", "", value or "")
    if len(digits) < 4:
        return ""
    return f"XXXX-XXXX-{digits[-4:]}"


def aadhaar_last4(value: str) -> str:
    digits = re.sub(r"\D", "", value or "")
    return digits[-4:] if len(digits) >= 4 else ""


def hash_value(value: str, salt: str | None = None) -> str:
    salt = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", (value or "").encode(), salt.encode(), 120_000)
    return f"pbkdf2_sha256${salt}${base64.b64encode(digest).decode()}"


def verify_hash(value: str, encoded: str) -> bool:
    try:
        algorithm, salt, digest = encoded.split("$", 2)
    except ValueError:
        return False
    if algorithm != "pbkdf2_sha256":
        return False
    expected = hash_value(value, salt).split("$", 2)[2]
    return hmac.compare_digest(expected, digest)


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(password: str, encoded: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), encoded.encode("utf-8"))
    except Exception:
        return False


def hash_otp(otp: str) -> str:
    return hash_value(otp)


def verify_otp_hash(otp: str, encoded: str) -> bool:
    return verify_hash(otp, encoded)


def safe_upload_name(original_name: str) -> str:
    suffix = Path(original_name or "").suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise ValueError("Invalid document type")
    return f"{secrets.token_hex(16)}{suffix}"


def create_token(payload: dict, expires_in: int = 3600) -> str:
    body = {**payload, "exp": int(time.time()) + expires_in}
    raw = base64.urlsafe_b64encode(json.dumps(body, separators=(",", ":")).encode()).decode()
    signature = hmac.new(SECRET_KEY.encode(), raw.encode(), hashlib.sha256).hexdigest()
    return f"{raw}.{signature}"


def verify_token(token: str) -> dict | None:
    try:
        raw, signature = token.rsplit(".", 1)
    except ValueError:
        return None
    expected = hmac.new(SECRET_KEY.encode(), raw.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, signature):
        return None
    payload = json.loads(base64.urlsafe_b64decode(raw.encode()).decode())
    if payload.get("exp", 0) < time.time():
        return None
    return payload
