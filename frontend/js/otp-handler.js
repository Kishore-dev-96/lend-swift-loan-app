/**
 * LendSwift AI - OTP Handler
 * Handles OTP verification with auto-focus, timer, and resend logic
 */

document.addEventListener('DOMContentLoaded', () => {
  const otpForm = document.getElementById('otp-form');
  const toastNotification = document.getElementById('toast-notification');
  const otpInputs = document.querySelectorAll('.otp-input');
  const verifyBtn = document.getElementById('verify-otp-btn');
  const resendLink = document.getElementById('resend-otp-link');
  const changeMobileBtn = document.getElementById('change-mobile-btn');
  const otpCountdown = document.getElementById('otp-countdown');
  const resendCountdown = document.getElementById('resend-countdown');
  const otpTimer = document.getElementById('otp-timer');
  const otpDescription = document.getElementById('otp-description');
  const otpMobileDisplay = document.getElementById('otp-mobile-display');

  let otpExpiryTimer = null;
  let resendExpiryTimer = null;
  let otpTimeRemaining = 300; // 5 minutes
  let resendTimeRemaining = 0;

  // Initialize OTP page
  function initOTPPage() {
    // Get signup data from session
    const userId = sessionStorage.getItem('signup_user_id');
    const mobile = sessionStorage.getItem('signup_mobile');
    const email = sessionStorage.getItem('signup_email');
    const name = sessionStorage.getItem('signup_name');

    if (!userId || !mobile) {
      // No signup data, redirect to signup
      window.location.href = 'signup.html';
      return;
    }

    // Display masked mobile
    const maskedMobile = maskMobileNumber(mobile);
    otpMobileDisplay.textContent = maskedMobile;

    // Start OTP timer
    startOTPTimer();

    // Focus on first OTP input
    otpInputs[0].focus();
  }

  // Mask mobile number
  function maskMobileNumber(mobile) {
    if (mobile.length === 10) {
      return `+91 XXXX${mobile.slice(-4)}`;
    }
    return mobile;
  }

  // OTP Input handling
  otpInputs.forEach((input, index) => {
    input.addEventListener('input', (e) => {
      const value = e.target.value;

      // Only allow numbers
      if (!/^\d*$/.test(value)) {
        e.target.value = '';
        return;
      }

      // Auto-focus to next input
      if (value && index < otpInputs.length - 1) {
        otpInputs[index + 1].focus();
      }

      // Auto-submit when all fields filled
      if (allOTPFieldsFilled()) {
        // Optional: auto-verify, or let user click verify
        // handleOTPSubmit();
      }
    });

    input.addEventListener('keydown', (e) => {
      // Handle backspace
      if (e.key === 'Backspace') {
        e.preventDefault();
        input.value = '';
        if (index > 0) {
          otpInputs[index - 1].focus();
        }
      }
      // Handle arrow keys
      else if (e.key === 'ArrowLeft' && index > 0) {
        e.preventDefault();
        otpInputs[index - 1].focus();
      } else if (e.key === 'ArrowRight' && index < otpInputs.length - 1) {
        e.preventDefault();
        otpInputs[index + 1].focus();
      }
    });

    input.addEventListener('paste', (e) => {
      e.preventDefault();
      const pasteData = e.clipboardData.getData('text');
      const digits = pasteData.replace(/\D/g, '').slice(0, 6);

      digits.split('').forEach((digit, i) => {
        if (i < otpInputs.length) {
          otpInputs[i].value = digit;
        }
      });

      if (digits.length === 6) {
        otpInputs[5].focus();
      }
    });
  });

  // Check if all OTP fields are filled
  function allOTPFieldsFilled() {
    return Array.from(otpInputs).every(input => input.value !== '');
  }

  // Form submission
  otpForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

    const otpValue = Array.from(otpInputs).map(input => input.value).join('');

    // Validate OTP
    if (!otpValue || otpValue.length !== 6 || !/^\d{6}$/.test(otpValue)) {
      showFieldError('otp', 'Please enter a valid 6-digit OTP');
      showToast('Please enter all 6 digits', 'error');
      return;
    }

    showLoading();

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Verify OTP
      const verifyResult = AuthSystem.verifyOTP(otpValue);

      if (!verifyResult.success) {
        showToast(verifyResult.message, 'error');
        showFieldError('otp', verifyResult.message);
        clearOTPInputs();
        otpInputs[0].focus();
        hideLoading();
        return;
      }

      // OTP verified successfully
      const userId = sessionStorage.getItem('signup_user_id');

      // Mark user as verified
      const verifyUserResult = AuthSystem.verifyUserEmail(userId);

      if (!verifyUserResult.success) {
        showToast('Verification failed', 'error');
        hideLoading();
        return;
      }

      // Create session
      const sessionResult = AuthSystem.createSession(userId);

      if (!sessionResult.success) {
        showToast('Session creation failed', 'error');
        hideLoading();
        return;
      }

      showToast('Account verified successfully! 🎉', 'success');

      // Clear session data
      sessionStorage.removeItem('signup_user_id');
      sessionStorage.removeItem('signup_mobile');
      sessionStorage.removeItem('signup_email');
      sessionStorage.removeItem('signup_name');

      // Redirect to dashboard
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1500);
    } catch (error) {
      console.error('OTP verification error:', error);
      showToast('An error occurred. Please try again.', 'error');
      hideLoading();
    }
  });

  // Resend OTP
  resendLink.addEventListener('click', async (e) => {
    e.preventDefault();

    if (resendLink.classList.contains('disabled')) {
      return;
    }

    try {
      const mobile = sessionStorage.getItem('signup_mobile');
      
      // Generate new OTP
      const newOTP = AuthSystem.createOTP(mobile);

      showToast('OTP resent successfully! Check your mobile.', 'success');

      // Reset timers
      clearOTPInputs();
      otpInputs[0].focus();

      otpTimeRemaining = 300;
      resendTimeRemaining = 30;

      clearInterval(otpExpiryTimer);
      clearInterval(resendExpiryTimer);

      startOTPTimer();
      startResendTimer();
    } catch (error) {
      console.error('Resend OTP error:', error);
      showToast('Failed to resend OTP', 'error');
    }
  });

  // Change mobile number
  changeMobileBtn.addEventListener('click', (e) => {
    e.preventDefault();
    sessionStorage.removeItem('signup_user_id');
    sessionStorage.removeItem('signup_mobile');
    sessionStorage.removeItem('signup_email');
    sessionStorage.removeItem('signup_name');
    window.location.href = 'signup.html';
  });

  // Timer functions
  function startOTPTimer() {
    otpTimeRemaining = AuthSystem.getOTPTimeRemaining();

    otpExpiryTimer = setInterval(() => {
      otpTimeRemaining--;
      otpCountdown.textContent = otpTimeRemaining;

      // Update timer appearance
      if (otpTimeRemaining <= 60) {
        otpTimer.classList.add('expired');
      }

      if (otpTimeRemaining <= 0) {
        clearInterval(otpExpiryTimer);
        otpTimer.textContent = 'OTP has expired';
        otpTimer.classList.add('expired');
        verifyBtn.disabled = true;
        otpInputs.forEach(input => input.disabled = true);
        showToast('OTP has expired. Please request a new one.', 'error');
      }
    }, 1000);

    startResendTimer();
  }

  function startResendTimer() {
    resendTimeRemaining = 30;

    resendExpiryTimer = setInterval(() => {
      resendTimeRemaining--;
      resendCountdown.textContent = resendTimeRemaining;

      if (resendTimeRemaining <= 0) {
        clearInterval(resendExpiryTimer);
        resendLink.classList.remove('disabled');
        resendLink.textContent = 'Resend OTP';
      }
    }, 1000);

    resendLink.classList.add('disabled');
  }

  // Utility functions
  function clearOTPInputs() {
    otpInputs.forEach(input => {
      input.value = '';
    });
  }

  function showFieldError(fieldId, message) {
    const errorElement = document.getElementById(`${fieldId}-error`);
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.classList.add('show');
    }
  }

  function clearErrors() {
    document.querySelectorAll('.error-message').forEach(el => {
      el.classList.remove('show');
      el.textContent = '';
    });

    otpInputs.forEach(input => {
      input.classList.remove('error');
    });
  }

  function showLoading() {
    verifyBtn.disabled = true;
    verifyBtn.querySelector('.button-text').style.display = 'none';
    verifyBtn.querySelector('.button-loader').classList.remove('hidden');
    otpForm.classList.add('form-loading');
  }

  function hideLoading() {
    verifyBtn.disabled = false;
    verifyBtn.querySelector('.button-text').style.display = 'inline';
    verifyBtn.querySelector('.button-loader').classList.add('hidden');
    otpForm.classList.remove('form-loading');
  }

  function showToast(message, type = 'info') {
    toastNotification.textContent = message;
    toastNotification.className = `toast-notification ${type}`;

    setTimeout(() => {
      toastNotification.classList.add('hidden');
    }, 4000);
  }

  // Initialize on page load
  initOTPPage();
});
