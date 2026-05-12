# OTP System - Quick Developer Reference

## File Structure

```
backend/
├── sms.py                          # SMS provider integration (Twilio, Fast2SMS, Console)
├── services/
│   └── otp_service.py             # OTP generation, hashing, and verification logic
├── routes/
│   └── auth.py                     # API endpoints for OTP flows
├── config.py                       # Configuration (OTP settings, SMS provider)
└── requirements.txt                # Dependencies (requests, twilio)

frontend/
├── signup-new.html                 # Signup page with OTP form
├── js/
│   ├── auth-api.js                # Backend API client with CSRF support
│   ├── signup-otp.js              # OTP signup flow handler
│   └── otp.js                      # OTP UI manager (timers, inputs, validation)
└── css/
    └── auth-responsive.css         # OTP form styling

Configuration:
├── .env.example                    # Environment variable template
├── OTP_IMPLEMENTATION_GUIDE.md     # Complete setup guide
└── OTP_TESTING_CHECKLIST.md       # Testing procedures
```

## Key Flows

### Signup Flow
```
User fills form (name, email, mobile)
    ↓
POST /api/auth/send-otp
    ↓ [Backend]
Generate secure OTP → Hash it → Store in DB → Send SMS
    ↓ [SMS Provider]
Fast2SMS/Twilio sends SMS
    ↓ [Frontend]
Show OTP input form with 5-min timer
    ↓
User enters 6-digit OTP
    ↓
POST /api/auth/signup-verify-otp
    ↓ [Backend]
Verify OTP hash → Create user → Set session
    ↓
Redirect to dashboard
```

### Backend OTP Generation
```python
# In backend/services/otp_service.py
1. Generate random 6-digit: secrets.randbelow(1_000_000)
2. Hash with PBKDF2: hash_value(otp)
3. Set expiry: NOW + 300 seconds
4. Store in database: otp_logs table
5. Send SMS: sms.send_sms(mobile, message)
```

### Frontend OTP Input
```javascript
// In frontend/js/signup-otp.js & otp.js
1. 6 input fields, accept digits only
2. Auto-advance to next field
3. Show 5-minute countdown timer
4. Track failed attempts (max 3)
5. Show resend after 30 seconds
6. Submit entire OTP to backend
```

## API Endpoints

### 1. Send OTP
```
POST /api/auth/send-otp

Request:
{
  "mobile": "9876543210",
  "type": "signup"              // or "login"
}

Response (Success):
{
  "success": true,
  "message": "OTP sent.",
  "sent": true,
  "provider": "fast2sms",       // or "twilio", "console"
  "dev_otp": null               // Only in console mode
}

Response (Error):
{
  "success": false,
  "error": "Invalid mobile number."
}
```

### 2. Verify OTP (Signup)
```
POST /api/auth/signup-verify-otp

Request:
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "mobile": "9876543210",
  "otp": "123456"
}

Response (Success):
{
  "success": true,
  "user": { id, name, email, mobile },
  "token": "JWT_TOKEN_HERE"
}

Response (Error):
{
  "success": false,
  "error": "Invalid OTP."
}
```

### 3. Verify OTP (Login)
```
POST /api/auth/mobile-login

Request:
{
  "mobile": "9876543210",
  "otp": "123456"
}

Response: Same as signup-verify-otp
```

## Environment Variables

```bash
# SMS Provider (console, twilio, fast2sms)
SMS_PROVIDER=console

# Fast2SMS
FAST2SMS_API_KEY=your_key_here

# Twilio
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_FROM_NUMBER=+1...

# Security
LENDSWIFT_SECRET_KEY=strong_random_key_32_chars_min
LENDSWIFT_AES_KEY=strong_random_key_32_chars_min

# OTP Config
OTP_EXPIRATION_SECONDS=300       # 5 minutes
OTP_MAX_ATTEMPTS=3               # Max wrong attempts
OTP_MAX_REQUESTS_PER_HOUR=5      # Rate limit
OTP_RESEND_COOLDOWN_SECONDS=30   # Time between requests
```

## Database Schema

```sql
CREATE TABLE otp_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mobile TEXT NOT NULL,           -- 10-digit mobile
    otp_hash TEXT NOT NULL,         -- PBKDF2 hashed (never plain)
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    expires_at TEXT NOT NULL,       -- ISO format
    attempts INTEGER DEFAULT 0,     -- Failed verification attempts
    verified INTEGER DEFAULT 0,     -- 1 if successfully verified
    request_ip TEXT                 -- Client IP for security
)

CREATE INDEX idx_otp_mobile_created ON otp_logs(mobile, created_at)
```

## Common JavaScript Objects

### AuthAPI (frontend/js/auth-api.js)
```javascript
// Handles CSRF tokens and backend communication
AuthAPI.init()                      // Initialize, get CSRF token
AuthAPI.post(path, payload)         // POST request to backend
AuthAPI.request(path, options)      // Generic request method
```

### OTPManager (frontend/js/otp.js)
```javascript
// Handles OTP UI and timers
OTPManager.getOTPValue()            // Get entered OTP
OTPManager.isOTPComplete()          // Check if all 6 digits entered
OTPManager.startOTPTimer()          // Start 5-minute countdown
OTPManager.startResendTimer()       // Start 30-second cooldown
OTPManager.clearOTPInputs()         // Reset inputs
OTPManager.showOTPError(msg)        // Show error
OTPManager.showOTPSuccess()         // Show success state
```

### SignupOTP (frontend/js/signup-otp.js)
```javascript
// Handles signup OTP flow
SignupOTP.handleSendOTP()           // Send OTP to backend
SignupOTP.handleVerifyOTP()         // Verify OTP
SignupOTP.handleResendOTP()         // Resend OTP
SignupOTP.showOTPStep()             // Switch to OTP form
SignupOTP.goBackToDetails()         // Go back to signup form
```

## Security Checklist

```
✓ OTP hashed before storage (PBKDF2)
✓ OTP never logged in plain text
✓ OTP never returned in API response
✓ Rate limiting: 5 requests/hour per mobile
✓ Rate limiting: 30 seconds between requests
✓ Max attempts: 3 tries per OTP
✓ OTP expiry: 5 minutes
✓ CSRF token required for all requests
✓ Cookies are HttpOnly, Secure, SameSite
✓ Session timeout: 1 hour
✓ All input validation server-side
✓ All errors sanitized (no info disclosure)
```

## Debugging Tips

### Backend Debugging
```bash
# 1. Check SMS provider is set
echo $SMS_PROVIDER

# 2. Watch backend logs in real-time
tail -f backend/data/lendswift.log

# 3. Test OTP in console mode
SMS_PROVIDER=console python -m backend.run

# 4. Check database directly
sqlite3 data/lendswift.db "SELECT * FROM otp_logs LIMIT 5;"

# 5. Check for OTP hash format (should start with $2b$12$)
sqlite3 data/lendswift.db "SELECT otp_hash FROM otp_logs LIMIT 1;"
```

### Frontend Debugging
```javascript
// In browser console
// Check OTP input value
OTPManager.getOTPValue()

// Check if OTP form is complete
OTPManager.isOTPComplete()

// Check current state
console.log(SignupOTP.state)

// Check CSRF token
console.log(AuthAPI.csrfToken)

// Check auth storage
console.log(localStorage.getItem('lendswift_auth'))
```

## Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| "CSRF token missing" | Form not submitted via AuthAPI | Use AuthAPI.post() |
| "Invalid mobile" | Format check failed | Check validate_mobile() |
| "Mobile already registered" | Mobile exists | Check get_user_by_mobile() |
| "OTP not found" | OTP expired or invalid | Check otp_logs table |
| "Maximum attempts exceeded" | Too many wrong tries | User needs to request new OTP |
| "OTP request limit exceeded" | Rate limit hit | Check OTP_MAX_REQUESTS_PER_HOUR |
| SMS not received | Provider issue or invalid key | Check SMS_PROVIDER and credentials |

## Testing Commands

```bash
# 1. Start fresh (clear database)
rm data/lendswift.db

# 2. Start backend with console mode
SMS_PROVIDER=console python -m backend.run

# 3. In another terminal, start frontend
cd frontend && python -m http.server 5173

# 4. Open http://localhost:5173/signup-new.html

# 5. Fill signup form

# 6. Check backend terminal for OTP:
# [DEV SMS] To +919876543210: Your LendSwift OTP is 123456...

# 7. Copy OTP and verify in frontend

# 8. Check database for new user:
sqlite3 data/lendswift.db "SELECT * FROM users WHERE mobile='9876543210';"
```

## Performance Considerations

- OTP database queries indexed on (mobile, created_at)
- OTP verification is O(1) - single row lookup
- Hash verification is fast (bcrypt optimized)
- SMS API calls are async (don't block response)
- Consider caching CSRF tokens on frontend

## Future Enhancements

1. **Email OTP** - Alternative if SMS fails
2. **Backup codes** - For account recovery
3. **2FA** - Additional security layer
4. **SMS retry** - Auto-retry on failure
5. **Delivery status** - Webhook from SMS provider
6. **Analytics** - OTP success/failure rates
7. **Rate limiting by IP** - Prevent attacks
8. **Fallback provider** - Switch if primary fails
