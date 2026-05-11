from datetime import datetime, timedelta, timezone

from ..database import get_connection
from ..utils.security import encrypt_pan


def create_user(name: str, email: str, password_hash: str) -> int:
    with get_connection() as conn:
        cursor = conn.execute(
            """
            INSERT INTO users (name, email, password_hash, profile_status)
            VALUES (?, ?, ?, ?)
            """,
            (name, email.lower().strip(), password_hash, "incomplete"),
        )
        return cursor.lastrowid


def create_user_mobile(name: str, email: str, mobile: str) -> int:
    with get_connection() as conn:
        cursor = conn.execute(
            """
            INSERT INTO users (name, email, mobile, mobile_verified, profile_status)
            VALUES (?, ?, ?, ?, ?)
            """,
            (name, email.lower().strip(), mobile.strip(), 1, "partial"),
        )
        return cursor.lastrowid


def get_user_by_email(email: str):
    with get_connection() as conn:
        return conn.execute("SELECT * FROM users WHERE email = ?", (email.lower().strip(),)).fetchone()


def get_user_by_mobile(mobile: str):
    with get_connection() as conn:
        return conn.execute("SELECT * FROM users WHERE mobile = ?", (mobile.strip(),)).fetchone()


def get_user_by_id(user_id: int):
    with get_connection() as conn:
        return conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()


def update_user_profile(user_id: int, profile_data: dict) -> None:
    fields = []
    values = []
    allowed = {
        "name",
        "dob",
        "address",
        "aadhaar_last4",
        "pan_encrypted",
        "pan_last4",
        "profile_status",
    }
    for key, value in profile_data.items():
        if key in allowed and value is not None:
            fields.append(f"{key} = ?")
            values.append(value)
    if not fields:
        return
    values.append(user_id)
    query = f"UPDATE users SET {', '.join(fields)} WHERE id = ?"
    with get_connection() as conn:
        conn.execute(query, tuple(values))


def set_mobile_verified(user_id: int, mobile: str) -> None:
    with get_connection() as conn:
        conn.execute(
            """
            UPDATE users
            SET mobile = ?, mobile_verified = 1,
                profile_status = CASE WHEN profile_status = 'incomplete' THEN 'partial' ELSE profile_status END
            WHERE id = ?
            """,
            (mobile.strip(), user_id),
        )


def build_user_response(user_row):
    if not user_row:
        return None
    return {
        "id": user_row["id"],
        "name": user_row["name"],
        "email": user_row["email"],
        "mobile": user_row["mobile"],
        "mobile_verified": bool(user_row["mobile_verified"]),
        "profile_status": user_row["profile_status"],
        "aadhaar_last4": user_row["aadhaar_last4"],
        "pan_last4": user_row["pan_last4"],
        "address": user_row["address"],
        "dob": user_row["dob"],
        "failed_login_count": user_row["failed_login_count"],
        "locked_until": user_row["locked_until"],
        "created_at": user_row["created_at"],
    }


def is_account_locked(user_row) -> bool:
    locked_until = user_row.get("locked_until")
    if not locked_until:
        return False
    return datetime.fromisoformat(locked_until) > datetime.now(timezone.utc)


def increment_failed_login(user_id: int) -> None:
    lock_until = (datetime.now(timezone.utc) + timedelta(seconds=900)).isoformat()
    with get_connection() as conn:
        conn.execute(
            """
            UPDATE users
            SET failed_login_count = failed_login_count + 1,
                locked_until = CASE WHEN failed_login_count + 1 >= ? THEN ? ELSE locked_until END
            WHERE id = ?
            """,
            (5, lock_until, user_id),
        )


def reset_login_failures(user_id: int) -> None:
    with get_connection() as conn:
        conn.execute(
            """
            UPDATE users
            SET failed_login_count = 0, locked_until = NULL
            WHERE id = ?
            """,
            (user_id,),
        )


def record_activity(user_id, action, ip_address):
    with get_connection() as conn:
        conn.execute(
            """
            INSERT INTO user_activity_logs (user_id, action, ip_address)
            VALUES (?, ?, ?)
            """,
            (user_id, action, ip_address),
        )
