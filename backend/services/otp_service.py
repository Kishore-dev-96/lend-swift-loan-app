from datetime import datetime, timedelta, timezone
import secrets

from ..config import (
    OTP_EXPIRATION_SECONDS,
    OTP_MAX_ATTEMPTS,
    OTP_MAX_REQUESTS_PER_HOUR,
    OTP_RESEND_COOLDOWN_SECONDS,
)
from ..database import get_connection
from ..utils.security import hash_value, verify_hash
from ..sms import send_sms


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _parse_time(value: str | None) -> datetime | None:
    if not value:
        return None
    return datetime.fromisoformat(value)


def send_login_otp(mobile: str, ip_address: str) -> dict:
    mobile = mobile.strip()
    with get_connection() as conn:
        recent_count = conn.execute(
            """
            SELECT COUNT(*) as count FROM otp_logs
            WHERE mobile = ? AND created_at >= datetime('now', '-1 hour')
            """,
            (mobile,),
        ).fetchone()["count"]

        if recent_count >= OTP_MAX_REQUESTS_PER_HOUR:
            raise ValueError("OTP request limit exceeded. Try again after one hour.")

        last_row = conn.execute(
            """
            SELECT created_at FROM otp_logs
            WHERE mobile = ?
            ORDER BY created_at DESC
            LIMIT 1
            """,
            (mobile,),
        ).fetchone()

        if last_row:
            last_sent = datetime.fromisoformat(last_row["created_at"])
            if (_now() - last_sent).total_seconds() < OTP_RESEND_COOLDOWN_SECONDS:
                raise ValueError("Please wait 30 seconds before requesting another OTP.")

        otp = f"{secrets.randbelow(1_000_000):06d}"
        otp_hash = hash_value(otp)
        expires_at = (_now() + timedelta(seconds=OTP_EXPIRATION_SECONDS)).isoformat()
        conn.execute(
            """
            INSERT INTO otp_logs (mobile, otp_hash, expires_at, request_ip)
            VALUES (?, ?, ?, ?)
            """,
            (mobile, otp_hash, expires_at, ip_address),
        )

    sms_result = send_sms(mobile, f"Your LendSwift OTP is {otp}. It expires in 5 minutes.")
    return {"sent": sms_result.get("sent", False), "provider": sms_result.get("provider"), "dev_otp": otp if sms_result.get("provider") == "console" else None}


def verify_login_otp(mobile: str, otp: str, ip_address: str) -> None:
    mobile = mobile.strip()
    with get_connection() as conn:
        row = conn.execute(
            """
            SELECT * FROM otp_logs
            WHERE mobile = ? AND verified = 0
            ORDER BY created_at DESC
            LIMIT 1
            """,
            (mobile,),
        ).fetchone()

        if not row:
            raise ValueError("OTP expired or not found.")

        expires_at = datetime.fromisoformat(row["expires_at"])
        if expires_at < _now():
            raise ValueError("OTP expired.")

        if row["attempts"] >= OTP_MAX_ATTEMPTS:
            raise ValueError("Maximum OTP attempts exceeded.")

        if not verify_hash(otp, row["otp_hash"]):
            conn.execute(
                "UPDATE otp_logs SET attempts = attempts + 1 WHERE id = ?",
                (row["id"],),
            )
            raise ValueError("Invalid OTP.")

        conn.execute(
            "UPDATE otp_logs SET verified = 1 WHERE id = ?",
            (row["id"],),
        )
