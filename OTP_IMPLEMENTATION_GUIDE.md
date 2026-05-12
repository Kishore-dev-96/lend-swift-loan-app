# LendSwift OTP System - Production Implementation Guide

## Overview

This guide explains how to implement and deploy the production-grade OTP verification system for LendSwift. The system supports multiple SMS providers and includes comprehensive security measures.

## Architecture

### Components

1. **Backend OTP Service** (`backend/services/otp_service.py`)
   - Generates secure 6-digit OTPs
   - Hashes OTPs before storing in database
   - Manages OTP expiry (2 minutes default)
   - Implements rate limiting (5 requests/hour per mobile)
   - Enforces max attempts (3 attempts per OTP)

2. **SMS Gateway** (`backend/sms.py`)
   - Multi-provider support
   - Console mode for development
   - Twilio integration for production
   - Fast2SMS for India (recommended)

3. **Frontend Integration** (`frontend/js/signup-otp.js`)
   - OTP input form with 6-digit entry
   - Real-time countdown timer (5 minutes)
   - Resend functionality with 30-second cooldown
   - Automatic field advancement on digit entry
   - Error handling and retry logic

4. **API Endpoints**
   - `POST /api/auth/send-otp` - Request OTP
   - `POST /api/auth/signup-verify-otp` - Verify OTP + Create Account
   - `POST /api/auth/mobile-login` - Login with mobile OTP

## Setup Instructions

### Step 1: Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

Key packages:
- `requests` - For SMS API calls
- `twilio` - For Twilio integration
- `bcrypt` - For OTP hashing

### Step 2: Configure Environment Variables

1. Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

2. Edit `.env` with your configuration:

#### Development Mode (Console)
```env
SMS_PROVIDER=console
LENDSWIFT_SECRET_KEY=dev-secret-key
```

#### Production with Fast2SMS (Recommended for India)
```env
SMS_PROVIDER=fast2sms
FAST2SMS_API_KEY=your_api_key_from_fast2sms_dashboard
LENDSWIFT_SECRET_KEY=your-strong-random-key-at-least-32-chars
```

#### Production with Twilio
```env
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_FROM_NUMBER=+1234567890
LENDSWIFT_SECRET_KEY=your-strong-random-key-at-least-32-chars
```

### Step 3: Get SMS Provider Credentials

#### Option A: Fast2SMS (Recommended for India)

1. Go to https://www.fast2sms.com
2. Sign up for a free account
3. Verify your account
4. Navigate to Dashboard → API Key
5. Copy your API key
6. Add to `.env`: `FAST2SMS_API_KEY=your_key_here`

**Advantages:**
- No complex setup
- Good rates for India
- Supports all Indian mobile numbers
- Development-friendly

**API Limits:**
- Free tier: Varies by plan
- Production tier: Contact sales for pricing

#### Option B: Twilio

1. Go to https://www.twilio.com
2. Sign up for account
3. Get trial phone number
4. In Console, find:
   - Account SID: Settings → Account SID
   - Auth Token: Settings → Auth Token
   - From Number: Phone Numbers → Manage
5. Add to `.env`:
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_FROM_NUMBER=+1234567890
```

**Advantages:**
- Production-grade reliability
- Global coverage
- Detailed logging
- Good documentation

**Pricing:**
- Trial credits: Included
- Production: ~$0.0075 per SMS

### Step 4: Start the Application

#### Development Mode
```bash
# Terminal 1: Backend
cd backend
python -m backend.run

# Terminal 2: Frontend
cd frontend
python -m http.server 5173
```

Open: http://localhost:5173

#### Production Mode
```bash
# With Gunicorn
gunicorn -w 4 -b 0.0.0.0:8000 backend.app:create_app()

# Or with Waitress
waitress-serve --port=8000 backend.app:create_app()
```

## Usage Flow

### Signup with OTP

1. **User enters details:**
   - Full Name
   - Email
   - Mobile Number

2. **Click "Send OTP"**
   - System validates inputs
   - Generates 6-digit OTP
   - Hashes OTP before storing
   - Sends SMS via configured provider
   - In console mode: OTP appears in terminal

3. **OTP Screen appears:**
   - 5-minute countdown timer
   - 6 digit input fields with auto-advance
   - Resend button (enabled after 30 seconds)

4. **User enters OTP:**
   - Can paste directly
   - Auto-advances to next field
   - Shows error on invalid attempts

5. **Click "Verify OTP"**
   - Backend validates OTP
   - Checks expiry
   - Checks attempt count
   - Creates account if valid
   - Sets login session

6. **Success:**
   - Redirects to dashboard
   - User is logged in

### Login with Mobile OTP

Same flow as signup but for existing users.

## Security Features

### OTP Generation
```python
✓ Cryptographically secure random generation
✓ 6-digit format (1,000,000 combinations)
✓ 2-minute expiry (300 seconds)
✓ Hash stored in database (never plain text)
```

### Rate Limiting
```python
✓ Max 5 OTP requests per hour per mobile
✓ 30-second cooldown between requests
✓ Max 3 verification attempts per OTP
✓ Prevents brute force attacks
```

### Database Security
```python
✓ OTP hash: PBKDF2 with salt
✓ Indexed on mobile + created_at for performance
✓ Foreign key constraints
✓ PRAGMA foreign_keys enabled
```

### Frontend Security
```javascript
✓ CSRF token validation
✓ Secure cookie (HttpOnly)
✓ Session expiry (1 hour)
✓ Never exposes OTP in logs
```

## Error Handling

### Errors the User May See

| Error | Cause | Solution |
|-------|-------|----------|
| "Invalid mobile number" | Mobile format incorrect | Enter 10 digits starting with 6-9 |
| "OTP request limit exceeded" | More than 5 requests/hour | Wait 1 hour, then retry |
| "Please wait 30 seconds" | Requesting too quickly | Wait 30 seconds before resending |
| "OTP expired" | More than 5 minutes passed | Click "Resend OTP" |
| "Invalid OTP" | Wrong code entered | Check SMS and re-enter |
| "Maximum OTP attempts exceeded" | More than 3 wrong attempts | Request new OTP |
| "Email already registered" | Email exists in system | Use different email or login |
| "Mobile already registered" | Mobile exists in system | Use different mobile or login |

### Backend Logging

All events are logged to console:

```
[SMS] Fast2SMS sent to 9876543210 (Request ID: 12345)
[DEV SMS] To +919876543210: Your LendSwift OTP is 123456. It expires in 5 minutes.
[SMS ERROR] Fast2SMS: Invalid API key
```

## Testing Scenarios

### Test 1: Console Mode (Development)
```
1. Set SMS_PROVIDER=console
2. Enter mobile number: 9876543210
3. Check backend terminal for OTP
4. Copy OTP and enter in form
5. Account should be created
```

### Test 2: Fast2SMS (Production)
```
1. Set SMS_PROVIDER=fast2sms
2. Set FAST2SMS_API_KEY=your_key
3. Enter your actual mobile number
4. Check SMS on your phone
5. Enter OTP in form
6. Account should be created
```

### Test 3: Rate Limiting
```
1. Click "Send OTP" 5 times quickly
2. 6th click should show "OTP request limit exceeded"
3. Message should suggest waiting 1 hour
```

### Test 4: OTP Expiry
```
1. Send OTP
2. Wait 5+ minutes
3. Try to verify
4. Should show "OTP expired"
5. Resend OTP should work
```

### Test 5: Max Attempts
```
1. Send OTP
2. Enter wrong code 3 times
3. Should show "Maximum OTP attempts exceeded"
4. Need to request new OTP
```

## Database Schema

The system uses SQLite with the following relevant table:

```sql
CREATE TABLE otp_logs (
    id INTEGER PRIMARY KEY,
    mobile TEXT NOT NULL,           -- 10-digit mobile number
    otp_hash TEXT NOT NULL,         -- PBKDF2 hashed OTP
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    expires_at TEXT NOT NULL,       -- ISO format timestamp
    attempts INTEGER DEFAULT 0,     -- Failed verification attempts
    verified INTEGER DEFAULT 0,     -- Whether OTP was verified
    request_ip TEXT                 -- Client IP for logging
)
```

## Configuration Reference

### Config Variables (`backend/config.py`)

```python
OTP_EXPIRATION_SECONDS = 300           # 5 minutes
OTP_MAX_ATTEMPTS = 3                   # Max failed attempts
OTP_MAX_REQUESTS_PER_HOUR = 5          # Rate limiting
OTP_RESEND_COOLDOWN_SECONDS = 30       # Min time between requests
PASSWORD_MIN_LENGTH = 8                # Password strength
LOGIN_MAX_ATTEMPTS = 5                 # Account lockout threshold
LOCK_DURATION_SECONDS = 900            # 15 minutes lockout
```

## Production Deployment Checklist

- [ ] Set `SMS_PROVIDER` to `twilio` or `fast2sms` (not `console`)
- [ ] Configure SMS provider credentials
- [ ] Set strong `LENDSWIFT_SECRET_KEY` (min 32 chars, random)
- [ ] Set strong `LENDSWIFT_AES_KEY` (min 32 chars, random)
- [ ] Deploy behind HTTPS (certificate required)
- [ ] Enable CSRF protection
- [ ] Use secure cookies (check Flask config)
- [ ] Set up monitoring for OTP failures
- [ ] Implement rate limiting on API endpoints
- [ ] Enable database backups
- [ ] Configure logging to persistent storage
- [ ] Test with real phone number before launch
- [ ] Set up error alerts (SMS failures, high failure rates)
- [ ] Document support process for "OTP not received" cases

## API Reference

### Send OTP

**Request:**
```bash
POST /api/auth/send-otp
Content-Type: application/json
X-CSRF-Token: token_value

{
  "mobile": "9876543210",
  "type": "signup"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "OTP sent.",
  "sent": true,
  "provider": "fast2sms",
  "dev_otp": null
}
```

**Response (Development Mode):**
```json
{
  "success": true,
  "message": "OTP sent.",
  "sent": true,
  "provider": "console",
  "dev_otp": "123456"
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Invalid mobile number.",
  "status": 400
}
```

### Verify OTP (Signup)

**Request:**
```bash
POST /api/auth/signup-verify-otp
Content-Type: application/json
X-CSRF-Token: token_value

{
  "fullName": "John Doe",
  "email": "john@example.com",
  "mobile": "9876543210",
  "otp": "123456"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Authenticated",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "mobile": "9876543210",
    "mobile_verified": 1
  },
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Invalid OTP.",
  "status": 400
}
```

## Troubleshooting

### Issue: "OTP sent" but no SMS received

**Check:**
1. Correct mobile number format (10 digits, starts with 6-9)?
2. SMS provider configured correctly?
3. API key/credentials valid?
4. Check backend logs for errors:
   - `[SMS ERROR]` indicates provider issue
   - `[DEV SMS]` indicates console mode active

**Solution:**
```bash
# Test in console mode first
SMS_PROVIDER=console

# Check if OTP appears in backend terminal
# If not, there's a backend issue

# If console works, switch to actual provider
# and verify credentials
```

### Issue: High OTP failure rate

**Check:**
1. Are SMS messages being blocked by carrier?
2. Are user phones receiving other SMS?
3. Network issues during peak hours?

**Solution:**
1. Check Fast2SMS/Twilio dashboard for failed deliveries
2. Consider switching providers if high failure rate persists
3. Add fallback provider logic

### Issue: OTP not showing in console

**Check:**
1. Is `SMS_PROVIDER=console` set in `.env`?
2. Check backend terminal output (not frontend console)
3. Look for `[DEV SMS]` prefix in output

**Solution:**
```bash
# Restart backend
# Verify .env file
# Check for typos in SMS_PROVIDER value
```

## Support & Resources

- **Fast2SMS Docs:** https://www.fast2sms.com/dev/api
- **Twilio Docs:** https://www.twilio.com/docs/sms
- **PBKDF2 Hash Info:** https://en.wikipedia.org/wiki/PBKDF2
- **OTP Best Practices:** https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html

## Next Steps

After successful OTP implementation:

1. ✓ Test with multiple providers
2. ✓ Monitor success rates
3. ✓ Optimize error messages
4. ✓ Add SMS delivery tracking
5. ✓ Implement analytics dashboard
6. ✓ Consider backup OTP channels (email, call)
7. ✓ Add fraud detection
8. ✓ Implement SMS webhook for delivery status
