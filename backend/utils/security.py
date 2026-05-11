import base64
import hashlib
import hmac
import json
import os
import secrets
import time
from typing import Any, Dict, Optional

import bcrypt
import jwt
from cryptography.fernet import Fernet, InvalidToken

from ..config import AES_KEY, JWT_ALGORITHM, JWT_COOKIE_NAME, JWT_EXPIRATION_SECONDS, JWT_SECRET


def _get_cipher() -> Fernet:
    key = base64.urlsafe_b64encode(AES_KEY)
    return Fernet(key)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))
    except Exception:
        return False


def encrypt_pan(pan: str) -> str:
    cipher = _get_cipher()
    return cipher.encrypt(pan.encode("utf-8")).decode("utf-8")


def decrypt_pan(value: str) -> str:
    cipher = _get_cipher()
    try:
        return cipher.decrypt(value.encode("utf-8")).decode("utf-8")
    except InvalidToken:
        return ""


def generate_jwt(payload: Dict[str, Any], expires_in: int = JWT_EXPIRATION_SECONDS) -> str:
    payload = {**payload, "exp": int(time.time()) + expires_in}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def verify_jwt(token: str) -> Optional[Dict[str, Any]]:
    try:
        data = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return data
    except Exception:
        return None


def mask_aadhaar(value: str) -> str:
    digits = "".join([c for c in value if c.isdigit()])
    if len(digits) < 4:
        return ""
    return f"XXXX-XXXX-{digits[-4:]}"


def mask_pan(value: str) -> str:
    value = value.strip().upper()
    if len(value) != 10:
        return ""
    return f"XXXXXX{value[-4:]}"


def generate_csrf_token() -> str:
    return secrets.token_urlsafe(32)


def hash_value(value: str) -> str:
    return hash_password(value)


def verify_hash(value: str, hash: str) -> bool:
    return verify_password(value, hash)
