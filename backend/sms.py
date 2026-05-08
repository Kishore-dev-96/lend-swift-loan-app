import os


def send_sms(mobile: str, message: str) -> dict:
    provider = os.getenv("SMS_PROVIDER", "console").lower()

    # Production integration point:
    # - Twilio: use TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER
    # - SMS must be sent only to the user-provided mobile number.
    if provider == "twilio":
        try:
            from twilio.rest import Client
        except ImportError:
            return {
                "provider": "twilio",
                "sent": False,
                "warning": "Twilio SDK is missing. Install the twilio package to send SMS.",
            }

        account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        from_number = os.getenv("TWILIO_FROM_NUMBER")
        if not account_sid or not auth_token or not from_number:
            return {
                "provider": "twilio",
                "sent": False,
                "warning": "Twilio credentials are not configured.",
            }

        client = Client(account_sid, auth_token)
        try:
            message_resp = client.messages.create(
                body=message,
                from_=from_number,
                to=f"+91{mobile}",
            )
            return {"provider": "twilio", "sent": True, "sid": message_resp.sid}
        except Exception as exc:
            return {"provider": "twilio", "sent": False, "warning": str(exc)}

    if provider == "console":
        print(f"[DEV SMS] To {mobile}: {message}")
        return {"provider": "console", "sent": True}

    return {
        "provider": provider,
        "sent": False,
        "warning": "SMS provider is not configured or unsupported; OTP stored for demo only.",
    }
