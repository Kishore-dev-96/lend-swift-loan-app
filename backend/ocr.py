import re
import shutil
import subprocess
from pathlib import Path

from pypdf import PdfReader
from PIL import Image, ImageFilter, ImageOps

from .security import mask_aadhaar, validate_pan

try:
    import pytesseract
except Exception:  # pragma: no cover - optional local dependency
    pytesseract = None


class OcrError(RuntimeError):
    pass


def clean_text(text: str) -> str:
    text = re.sub(r"[ \t]+", " ", text or "")
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def image_to_text(path: Path) -> str:
    image = Image.open(path)
    image = ImageOps.grayscale(image)
    image = image.filter(ImageFilter.SHARPEN)

    if pytesseract is not None:
      return clean_text(pytesseract.image_to_string(image))

    tesseract = shutil.which("tesseract")
    if not tesseract:
        raise OcrError("Unable to read document")

    result = subprocess.run(
        [tesseract, str(path), "stdout", "--psm", "6"],
        check=False,
        capture_output=True,
        text=True,
        timeout=20,
    )
    if result.returncode != 0:
        raise OcrError("Unable to read document")
    return clean_text(result.stdout)


def pdf_to_text(path: Path) -> str:
    reader = PdfReader(str(path))
    text = "\n".join(page.extract_text() or "" for page in reader.pages[:3])
    return clean_text(text)


def extract_text(path: Path) -> str:
    suffix = path.suffix.lower()
    if suffix == ".pdf":
        text = pdf_to_text(path)
    elif suffix in {".jpg", ".jpeg", ".png"}:
        text = image_to_text(path)
    else:
        raise OcrError("Unable to read document")
    if not text:
        raise OcrError("Unable to read document")
    return text


def find_name(lines: list[str]) -> str:
    noise = ("government", "india", "income", "tax", "aadhaar", "permanent", "account", "dob")
    for line in lines:
        candidate = line.strip()
        if len(candidate) < 3 or any(item in candidate.lower() for item in noise):
            continue
        if re.search(r"[A-Za-z]", candidate) and not re.search(r"\d{4,}", candidate):
            return candidate.title()
    return ""


def extract_dob(text: str) -> str:
    patterns = [
        r"(?:DOB|Date of Birth|Birth)[:\s-]*(\d{2}[/-]\d{2}[/-]\d{4})",
        r"\b(\d{2}[/-]\d{2}[/-]\d{4})\b",
        r"\b(\d{4}[/-]\d{2}[/-]\d{2})\b",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            return match.group(1).replace("/", "-")
    return ""


def extract_address(text: str) -> str:
    match = re.search(r"Address[:\s-]*(.+)", text, re.IGNORECASE | re.DOTALL)
    if not match:
        return ""
    address = re.sub(r"\s+", " ", match.group(1)).strip()
    return address[:240]


def extract_aadhaar(path: Path) -> dict:
    text = extract_text(path)
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    number_match = re.search(r"\b(?:\d{4}\s?\d{4}\s?\d{4}|[Xx]{4}[-\s]?[Xx]{4}[-\s]?\d{4})\b", text)
    masked = mask_aadhaar(number_match.group(0)) if number_match else ""
    return {
        "name": find_name(lines),
        "dob": extract_dob(text),
        "aadhaar_masked": masked,
        "aadhaar_last4": masked[-4:] if masked else "",
        "address": extract_address(text),
        "raw_text": text,
    }


def extract_pan(path: Path) -> dict:
    text = extract_text(path).upper()
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    match = re.search(r"\b[A-Z]{5}[0-9]{4}[A-Z]\b", text)
    pan = match.group(0) if match else ""
    if pan and not validate_pan(pan):
        pan = ""
    return {
        "name": find_name(lines),
        "pan_number": pan,
        "raw_text": text,
    }
