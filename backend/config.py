import base64
import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR.parent / "data"
UPLOAD_DIR = BASE_DIR / "secure_uploads"
DATA_DIR.mkdir(parents=True, exist_ok=True)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

JWT_SECRET = os.getenv("LENDSWIFT_SECRET_KEY", "dev-only-change-this-secret-key")
AES_SECRET = os.getenv("LENDSWIFT_AES_KEY")
if AES_SECRET:
    AES_KEY = AES_SECRET.encode("utf-8")[:32].ljust(32, b"0")
else:
    AES_KEY = JWT_SECRET.encode("utf-8")[:32].ljust(32, b"0")

CSRF_COOKIE_NAME = "lend_sft_csrf"
JWT_COOKIE_NAME = "lend_sft_token"
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_SECONDS = 3600
OTP_EXPIRATION_SECONDS = 300
OTP_MAX_REQUESTS_PER_HOUR = 5
OTP_RESEND_COOLDOWN_SECONDS = 30
OTP_MAX_ATTEMPTS = 3
PASSWORD_MIN_LENGTH = 8
LOGIN_MAX_ATTEMPTS = 5
LOCK_DURATION_SECONDS = 900
MAX_CONTENT_LENGTH = 5 * 1024 * 1024

SMS_PROVIDER = os.getenv("SMS_PROVIDER", "console").lower()
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN", "")
TWILIO_FROM_NUMBER = os.getenv("TWILIO_FROM_NUMBER", "")

ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "application/pdf"}
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".pdf"}

CORS_ORIGINS = ["http://127.0.0.1:8000", "http://localhost:8000", "http://127.0.0.1:5173", "http://localhost:5173"]
