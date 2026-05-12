import os


def send_sms(mobile: str, message: str) -> dict:
    """
    Send SMS via configured provider.
    
    Supported providers:
    - console: Print to terminal (development)
    - twilio: Twilio Verify API
    - fast2sms: Fast2SMS API (recommended for India)
    
    Args:
        mobile: 10-digit Indian mobile number (without +91)
        message: SMS message text
        
    Returns:
        Dict with 'sent' (bool), 'provider', and optional 'dev_otp' for console mode
    """
    provider = os.getenv("SMS_PROVIDER", "console").lower()

    # TWILIO PROVIDER
    if provider == "twilio":
        try:
            from twilio.rest import Client
        except ImportError:
            return {
                "provider": "twilio",
                "sent": False,
                "warning": "Twilio SDK is missing. Install: pip install twilio",
            }

        account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        from_number = os.getenv("TWILIO_FROM_NUMBER")
        
        if not account_sid or not auth_token or not from_number:
            return {
                "provider": "twilio",
                "sent": False,
                "warning": "Twilio credentials not configured. Set: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER",
            }

        try:
            client = Client(account_sid, auth_token)
            message_resp = client.messages.create(
                body=message,
                from_=from_number,
                to=f"+91{mobile}",
            )
            print(f"[SMS] Twilio sent to +91{mobile} (SID: {message_resp.sid})")
            return {"provider": "twilio", "sent": True, "sid": message_resp.sid}
        except Exception as exc:
            print(f"[SMS ERROR] Twilio failed: {exc}")
            return {"provider": "twilio", "sent": False, "error": str(exc)}

    # FAST2SMS PROVIDER (Recommended for India)
    if provider == "fast2sms":
        try:
            import requests
        except ImportError:
            return {
                "provider": "fast2sms",
                "sent": False,
                "warning": "requests library missing. Install: pip install requests",
            }

        api_key = os.getenv("FAST2SMS_API_KEY")
        if not api_key:
            return {
                "provider": "fast2sms",
                "sent": False,
                "warning": "Fast2SMS API key not configured. Set: FAST2SMS_API_KEY",
            }

        try:
            # Fast2SMS API endpoint
            url = "https://www.fast2sms.com/dev/bulk"
            
            headers = {
                "authorization": api_key,
                "Content-Type": "application/x-www-form-urlencoded"
            }
            
            payload = {
                "route": "otp",
                "numbers": mobile,
                "message": message,
            }
            
            response = requests.post(url, headers=headers, data=payload, timeout=10)
            
            if response.status_code == 200:
                result = response.json()
                if result.get("return"):
                    request_id = result.get("request_id")
                    print(f"[SMS] Fast2SMS sent to {mobile} (Request ID: {request_id})")
                    return {
                        "provider": "fast2sms",
                        "sent": True,
                        "request_id": request_id
                    }
                else:
                    error_msg = result.get("message", "Unknown error")
                    print(f"[SMS ERROR] Fast2SMS: {error_msg}")
                    return {
                        "provider": "fast2sms",
                        "sent": False,
                        "error": error_msg
                    }
            else:
                error_msg = f"HTTP {response.status_code}: {response.text}"
                print(f"[SMS ERROR] Fast2SMS: {error_msg}")
                return {
                    "provider": "fast2sms",
                    "sent": False,
                    "error": error_msg
                }
                
        except requests.exceptions.Timeout:
            msg = "Request timeout"
            print(f"[SMS ERROR] Fast2SMS: {msg}")
            return {"provider": "fast2sms", "sent": False, "error": msg}
        except Exception as exc:
            error_msg = str(exc)
            print(f"[SMS ERROR] Fast2SMS: {error_msg}")
            return {"provider": "fast2sms", "sent": False, "error": error_msg}

    # CONSOLE PROVIDER (Development/Testing)
    if provider == "console":
        print(f"[DEV SMS] To +91{mobile}: {message}")
        return {"provider": "console", "sent": True}

    # Unknown provider
    return {
        "provider": provider,
        "sent": False,
        "warning": f"SMS provider '{provider}' not supported. Use: console, twilio, or fast2sms",
    }
