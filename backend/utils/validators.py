import re

from .config import PASSWORD_MIN_LENGTH


def validate_email(value: str) -> bool:
    return bool(re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", (value or "").strip()))


def validate_mobile(value: str) -> bool:
    return bool(re.fullmatch(r"[6-9][0-9]{9}", (value or "").strip()))


def validate_pan(value: str) -> bool:
    return bool(re.fullmatch(r"[A-Z]{5}[0-9]{4}[A-Z]", (value or "").strip().upper()))


def validate_password(value: str) -> tuple[bool, str]:
    value = value or ""
    if len(value) < PASSWORD_MIN_LENGTH:
        return False, f"Password must be at least {PASSWORD_MIN_LENGTH} characters."
    if not re.search(r"[A-Z]", value):
        return False, "Password must include at least one uppercase letter."
    if not re.search(r"[0-9]", value):
        return False, "Password must include at least one number."
    return True, ""


def validate_aadhaar_masked(value: str) -> bool:
    return bool(re.fullmatch(r"XXXX-XXXX-\d{4}", (value or "").strip()))
