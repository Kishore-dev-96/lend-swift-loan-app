# OTP System - Integration Testing Checklist

## Quick Start Testing (5 minutes)

### Console Mode Testing
```bash
# 1. Verify .env is set correctly
SMS_PROVIDER=console

# 2. Start backend
cd backend
python -m backend.run

# 3. In another terminal, start frontend
cd frontend
python -m http.server 5173

# 4. Go to http://localhost:5173/signup-new.html

# 5. Fill in signup form:
#    Name: Test User
#    Email: test@example.com
#    Mobile: 9876543210

# 6. Click "Send OTP"

# 7. In backend terminal, you should see:
#    [DEV SMS] To +919876543210: Your LendSwift OTP is 123456. It expires in 5 minutes.

# 8. Copy the OTP (e.g., 123456)

# 9. Paste it into the OTP form

# 10. Click "Verify OTP"

# 11. Account should be created and you'll be redirected to dashboard
```

## Feature Testing Checklist

### ✓ OTP Generation
- [ ] OTP is 6 digits
- [ ] OTP is different each time
- [ ] OTP is printed to console in dev mode
- [ ] OTP is NOT returned in API response (for security)

### ✓ OTP Sending
- [ ] SMS shows correct mobile number format (+91...)
- [ ] SMS contains clear expiry message
- [ ] SMS contains LendSwift branding
- [ ] API returns success response with provider info

### ✓ OTP Input Form
- [ ] Form has 6 input fields
- [ ] Each field accepts only digits
- [ ] Auto-advances to next field on digit entry
- [ ] Backspace moves to previous field
- [ ] Paste works (can paste 6-digit code at once)
- [ ] Countdown timer shows correct time
- [ ] Timer reaches 0:00 and shows expired message

### ✓ OTP Verification
- [ ] Valid OTP passes verification
- [ ] Invalid OTP shows error message
- [ ] After 3 wrong attempts, shows "max attempts exceeded"
- [ ] Expired OTP shows "OTP expired" error
- [ ] User must request new OTP after expiry

### ✓ Resend Functionality
- [ ] "Resend OTP" button is disabled initially
- [ ] Shows 30-second countdown until enabled
- [ ] After countdown, button is enabled and clickable
- [ ] Clicking resend generates new OTP
- [ ] Old OTP becomes invalid
- [ ] New countdown timer starts

### ✓ Rate Limiting
- [ ] Can request OTP once immediately
- [ ] 2nd request within 30 seconds shows error
- [ ] Can request after 30-second cooldown
- [ ] After 5 requests in 1 hour, shows "limit exceeded"
- [ ] Must wait 1 hour for next request

### ✓ Error Handling
- [ ] Invalid mobile shows validation error
- [ ] Duplicate email shows "already registered"
- [ ] Duplicate mobile shows "already registered"
- [ ] Network error shows connection message
- [ ] SMS provider error shows graceful message

### ✓ Session Management
- [ ] After successful verification, user is logged in
- [ ] Session token is stored
- [ ] Can access dashboard without re-login
- [ ] Session expires after 1 hour
- [ ] Logout clears session

### ✓ Security
- [ ] CSRF token is required
- [ ] OTP is never logged in plain text
- [ ] OTP hash is stored in database
- [ ] No OTP visible in network requests
- [ ] Cookies are HttpOnly

## Provider-Specific Testing

### Fast2SMS Testing
```bash
# 1. Get API key from fast2sms.com dashboard

# 2. Update .env:
SMS_PROVIDER=fast2sms
FAST2SMS_API_KEY=your_key_here

# 3. Restart backend

# 4. Fill signup form with real phone number

# 5. Click "Send OTP"

# 6. Check backend logs for:
#    [SMS] Fast2SMS sent to XXXXXXXXXX (Request ID: xxxxx)

# 7. Should receive SMS on phone within 10 seconds

# 8. Enter OTP from SMS

# 9. Account created successfully
```

### Twilio Testing
```bash
# 1. Create Twilio account

# 2. Update .env:
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_FROM_NUMBER=+1...

# 3. Restart backend

# 4. Follow same flow as Fast2SMS

# 5. Should receive SMS within 5 seconds
```

## Performance Testing

### Load Testing
```
# Test 10 concurrent OTP requests
# Measure response time: Should be < 2 seconds
# Check database performance: Should not slow down
```

### Database Testing
```
# Verify OTP logs table grows
# Verify indexes work (otp_logs_mobile_created)
# Verify old OTPs are not interfering
```

## Regression Testing

### After Each Deployment
- [ ] Can signup with OTP
- [ ] Can login with OTP
- [ ] Rate limiting works
- [ ] OTP expiry works
- [ ] Error messages display correctly
- [ ] Dashboard loads after signup
- [ ] Session persists across page reloads

## Edge Cases

### Test These Scenarios
- [ ] User doesn't enter OTP and waits 5 minutes
- [ ] User enters wrong OTP 3 times, then requests new OTP
- [ ] User tries to verify expired OTP
- [ ] User requests 6 OTPs in quick succession
- [ ] User requests OTP, then requests again after 20 seconds
- [ ] User enters OTP in reverse order
- [ ] User submits partial OTP (less than 6 digits)
- [ ] Network disconnects during OTP verification
- [ ] Backend crashes during OTP verification (user should get error)

## Database Verification

```sql
-- Check OTP was created
SELECT * FROM otp_logs WHERE mobile = '9876543210' ORDER BY created_at DESC LIMIT 1;

-- Verify OTP is hashed (not plain text)
-- otp_hash should look like: $2b$12$... (bcrypt hash)

-- Check user was created after OTP verification
SELECT * FROM users WHERE mobile = '9876543210';

-- Verify mobile_verified flag is set
-- Should be 1 (true) after successful OTP verification
```

## Common Issues & Solutions

| Issue | Check | Solution |
|-------|-------|----------|
| OTP not showing in console | Is SMS_PROVIDER=console? | Set in .env and restart |
| OTP sent but not received | Valid API key? Network? | Check provider dashboard |
| Form validation error | Correct format? (10 digits) | Use format: 98XXXXXXXX |
| "Already registered" | Used this email before? | Use different email |
| Session not persisting | Cookies enabled? | Check browser settings |
| CSRF token error | Form submitted correctly? | Refresh page and retry |

## Sign-Off

- [ ] All feature tests passed
- [ ] All edge cases handled
- [ ] No console errors
- [ ] Database state correct
- [ ] Performance acceptable
- [ ] Ready for production deployment

## Contact

For issues or questions about OTP implementation:
1. Check OTP_IMPLEMENTATION_GUIDE.md
2. Review backend/sms.py for provider details
3. Check frontend/js/signup-otp.js for UI logic
4. Review backend/services/otp_service.py for security logic
