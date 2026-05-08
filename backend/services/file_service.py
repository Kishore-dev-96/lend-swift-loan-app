import io
import secrets
from pathlib import Path

from PIL import Image
from pypdf import PdfReader
from werkzeug.utils import secure_filename

from ..config import ALLOWED_EXTENSIONS, ALLOWED_MIME_TYPES, MAX_CONTENT_LENGTH, UPLOAD_DIR


def _validate_extension(filename: str) -> str:
    sanitized = secure_filename(filename or "")
    ext = Path(sanitized).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError("Unsupported file type.")
    return ext


def _validate_content(file_bytes: bytes, ext: str) -> None:
    if len(file_bytes) > MAX_CONTENT_LENGTH:
        raise ValueError("File exceeds maximum allowed size of 5MB.")

    if ext == ".pdf":
        try:
            PdfReader(io.BytesIO(file_bytes))
        except Exception:
            raise ValueError("Invalid PDF document.")
    else:
        try:
            Image.open(io.BytesIO(file_bytes)).verify()
        except Exception:
            raise ValueError("Invalid image file.")


def save_upload(file_storage) -> Path:
    ext = _validate_extension(file_storage.filename)
    content_type = file_storage.mimetype or ""
    if content_type not in ALLOWED_MIME_TYPES:
        raise ValueError("Unsupported MIME type.")

    file_bytes = file_storage.read()
    _validate_content(file_bytes, ext)
    filename = f"{secrets.token_hex(16)}{ext}"
    target = UPLOAD_DIR / filename
    target.write_bytes(file_bytes)
    return target


def cleanup_files(paths: list[Path]) -> None:
    for path in paths:
        try:
            path.unlink()
        except FileNotFoundError:
            pass
