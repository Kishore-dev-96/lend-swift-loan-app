# LendSwift KYC Backend

Safe OCR-based KYC demo backend for a fintech project. It does not connect to UIDAI, PAN, or any government database.

## Run on Windows

```powershell
cd C:\Users\middi\Documents\Codex\2026-05-08\files-mentioned-by-the-user-my
python -m pip install -r backend\requirements.txt
python -m backend.run
```

Open:

```text
http://127.0.0.1:8000/
```

## OCR Notes

- PDF text extraction uses `pypdf`.
- Image OCR uses `pytesseract`, which requires the Tesseract OCR executable installed on Windows.
- If OCR cannot read a document, the API returns `Unable to read document`.

## Security Notes

- Aadhaar images are processed only after consent and deleted after OCR.
- Full Aadhaar is not stored; only the last 4 digits are stored.
- PAN is stored as a salted PBKDF2 hash.
- OTPs are stored as salted PBKDF2 hashes and expire after 5 minutes.
- SMS delivery defaults to console/dev mode. Configure Twilio or MSG91 in `backend/sms.py` for production.
- Deploy only behind HTTPS in production.
