import re
import shutil
import subprocess
from pathlib import Path

from PIL import Image, ImageFilter, ImageOps
from pypdf import PdfReader

try:
    import pytesseract
    from pytesseract import Output
except ImportError:
    pytesseract = None
    Output = None


def clean_text(value: str) -> str:
    text = re.sub(r"[ \t]+", " ", value or "")
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def image_to_text(path: Path) -> tuple[str, float]:
    image = Image.open(path)
    image = ImageOps.grayscale(image)
    image = image.filter(ImageFilter.SHARPEN)

    if pytesseract is not None:
        data = pytesseract.image_to_data(image, output_type=Output.DICT)
        words = [int(conf) for conf in data.get("conf", []) if conf.isdigit() and int(conf) >= 0]
        confidence = float(sum(words) / len(words)) if words else 0.0
        return clean_text(pytesseract.image_to_string(image)), confidence

    tesseract = shutil.which("tesseract")
    if not tesseract:
        raise RuntimeError("Tesseract OCR is not installed.")
    result = subprocess.run(
        [tesseract, str(path), "stdout", "--psm", "6"],
        capture_output=True,
        text=True,
        timeout=30,
    )
    if result.returncode != 0:
        raise RuntimeError("Unable to read document.")
    return clean_text(result.stdout), 0.0


def pdf_to_text(path: Path) -> tuple[str, float]:
    reader = PdfReader(str(path))
    text = "\n".join(page.extract_text() or "" for page in reader.pages[:3])
    return clean_text(text), 0.0


def extract_text(path: Path) -> tuple[str, float]:
    suffix = path.suffix.lower()
    if suffix == ".pdf":
        return pdf_to_text(path)
    if suffix in {".jpg", ".jpeg", ".png"}:
        return image_to_text(path)
    raise RuntimeError("Unsupported OCR file type.")


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
    text, confidence = extract_text(path)
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    number_match = re.search(r"\b(\d{4}\s?\d{4}\s?\d{4}|[Xx]{4}[-\s]?[Xx]{4}[-\s]?\d{4})\b", text)
    masked = number_match.group(0) if number_match else ""
    if masked and not masked.startswith("XXXX"):
        digits = re.sub(r"\D", "", masked)
        masked = f"XXXX-XXXX-{digits[-4:]}"
    return {
        "name": find_name(lines),
        "dob": extract_dob(text),
        "aadhaar_masked": masked,
        "aadhaar_last4": masked[-4:] if masked else "",
        "address": extract_address(text),
        "confidence": round(confidence, 1),
        "raw_text": text,
    }


def extract_pan(path: Path) -> dict:
    text, confidence = extract_text(path)
    text = text.upper()
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    match = re.search(r"\b[A-Z]{5}[0-9]{4}[A-Z]\b", text)
    return {
        "name": find_name(lines),
        "pan_number": match.group(0) if match else "",
        "confidence": round(confidence, 1),
        "raw_text": text,
    }


def extract_profile(aadhaar_path: Path, pan_path: Path) -> dict:
    aadhaar = extract_aadhaar(aadhaar_path)
    pan = extract_pan(pan_path)
    return {
        "name": pan.get("name") or aadhaar.get("name"),
        "dob": aadhaar.get("dob"),
        "pan_number": pan.get("pan_number"),
        "masked_aadhaar_number": aadhaar.get("aadhaar_masked"),
        "aadhaar_last4": aadhaar.get("aadhaar_last4"),
        "address": aadhaar.get("address"),
        "confidence": round(min(aadhaar.get("confidence", 0), pan.get("confidence", 0)), 1),
        "details": {
            "aadhaar": aadhaar,
            "pan": pan,
        },
    }
