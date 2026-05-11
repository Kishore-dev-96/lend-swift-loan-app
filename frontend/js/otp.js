/**
 * OTP MODULE
 * LendSwift AI - OTP generation, validation, and timer management
 */

const OTPManager = {
  state: {
    otpSent: false,
    otpVerified: false,
    otpExpiredTime: null,
    resendAllowedTime: null,
    currentMobile: null,
    countdownInterval: null,
    resendCountdownInterval: null,
    attempts: 0,
    maxAttempts: 3
  },

  CONFIG: {
    OTP_EXPIRY: 5 * 60 * 1000, // 5 minutes in milliseconds
    RESEND_DELAY: 30 * 1000, // 30 seconds
    OTP_LENGTH: 6
  },

  /**
   * Initialize OTP timer
   */
  getCountdownElement() {
    return document.getElementById('otp-countdown') || document.getElementById('otp-countdown-signup');
  },

  getResendElements() {
    return {
      resendLink: document.getElementById('resend-otp-link') || document.getElementById('resend-otp-signup-link'),
      resendCountdown: document.getElementById('resend-countdown') || document.getElementById('resend-countdown-signup')
    };
  },

  getVerifyButton() {
    return document.getElementById('verify-otp-btn') || document.getElementById('verify-otp-signup-btn');
  },

  startOTPTimer() {
    const expiryTime = new Date().getTime() + this.CONFIG.OTP_EXPIRY;
    this.state.otpExpiredTime = expiryTime;

    const countdownElement = this.getCountdownElement();
    if (!countdownElement) return;

    if (this.state.countdownInterval) {
      clearInterval(this.state.countdownInterval);
    }

    this.state.countdownInterval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((expiryTime - new Date().getTime()) / 1000));
      countdownElement.textContent = remaining;

      if (remaining === 0) {
        clearInterval(this.state.countdownInterval);
        this.handleOTPExpiry();
      }

      if (remaining < 30 && remaining > 0) {
        countdownElement.parentElement?.classList.add('otp-expired');
      }
    }, 1000);

    console.log('✅ OTP timer started - expires in', Math.floor(this.CONFIG.OTP_EXPIRY / 1000), 'seconds');
  },

  /**
   * Initialize resend timer
   */
  startResendTimer() {
    const resendAllowedTime = new Date().getTime() + this.CONFIG.RESEND_DELAY;
    this.state.resendAllowedTime = resendAllowedTime;

    const { resendLink, resendCountdown } = this.getResendElements();
    if (!resendLink || !resendCountdown) return;

    resendLink.classList.add('disabled');
    resendLink.style.pointerEvents = 'none';

    if (this.state.resendCountdownInterval) {
      clearInterval(this.state.resendCountdownInterval);
    }

    this.state.resendCountdownInterval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((resendAllowedTime - new Date().getTime()) / 1000));
      resendCountdown.textContent = remaining;

      if (remaining === 0) {
        clearInterval(this.state.resendCountdownInterval);
        this.enableResendOTP();
      }
    }, 1000);

    console.log('✅ Resend timer started - available in', Math.floor(this.CONFIG.RESEND_DELAY / 1000), 'seconds');
  },

  /**
   * Handle OTP expiry
   */
  handleOTPExpiry() {
    console.log('⏱️ OTP has expired');

    const countdownElement = this.getCountdownElement();
    if (countdownElement) {
      countdownElement.parentElement?.classList.add('otp-expired');
      countdownElement.textContent = '0';
    }

    const otpInputs = document.querySelectorAll('.otp-input');
    otpInputs.forEach(input => {
      input.disabled = true;
      input.classList.add('error');
    });

    const verifyBtn = this.getVerifyButton();
    if (verifyBtn) {
      verifyBtn.disabled = true;
      verifyBtn.textContent = 'OTP Expired';
    }

    this.showNotification('OTP has expired. Please request a new OTP.', 'error');
  },

  /**
   * Enable resend OTP
   */
  enableResendOTP() {
    console.log('✅ Resend OTP is now enabled');

    const { resendLink } = this.getResendElements();
    if (resendLink) {
      resendLink.classList.remove('disabled');
      resendLink.style.pointerEvents = 'auto';
      resendLink.textContent = 'Resend OTP';
    }
  },

  /**
   * Handle OTP input focus
   */
  setupOTPInput() {
    const otpInputs = document.querySelectorAll('.otp-input');

    otpInputs.forEach((input, index) => {
      input.addEventListener('input', (e) => {
        const value = e.target.value;

        // Only allow digits
        if (!/^\d*$/.test(value)) {
          e.target.value = '';
          return;
        }

        // Auto-focus next input
        if (value.length === 1 && index < otpInputs.length - 1) {
          otpInputs[index + 1].focus();
        }

        // Auto-submit if all filled
        if (this.isOTPComplete()) {
          // Could auto-verify here
        }
      });

      // Handle backspace
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !e.target.value && index > 0) {
          otpInputs[index - 1].focus();
        }

        // Handle paste
        if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
          e.preventDefault();
          const pastedData = this.getPastedData();
          if (pastedData && pastedData.length === 6) {
            this.setOTPValue(pastedData);
          }
        }
      });

      // Handle paste event
      input.addEventListener('paste', (e) => {
        e.preventDefault();
        const pastedText = (e.clipboardData || window.clipboardData).getData('text');
        const cleanedOTP = pastedText.replace(/\D/g, '').substring(0, 6);

        if (cleanedOTP.length === 6) {
          this.setOTPValue(cleanedOTP);
          otpInputs[5].focus();
        }
      });
    });

    console.log('✅ OTP input handlers setup');
  },

  /**
   * Get pasted data from clipboard
   */
  getPastedData() {
    // This would be called from paste handler
    return null;
  },

  /**
   * Set OTP value to inputs
   */
  setOTPValue(otp) {
    const digits = otp.split('');
    const otpInputs = document.querySelectorAll('.otp-input');

    otpInputs.forEach((input, index) => {
      input.value = digits[index] || '';
      input.classList.remove('error', 'success');
    });

    console.log('✅ OTP value set');
  },

  /**
   * Get OTP value from inputs
   */
  getOTPValue() {
    let otp = '';
    const otpInputs = document.querySelectorAll('.otp-input');

    otpInputs.forEach(input => {
      otp += input.value || '';
    });

    return otp;
  },

  /**
   * Check if OTP is complete
   */
  isOTPComplete() {
    const otp = this.getOTPValue();
    return otp.length === 6 && /^\d{6}$/.test(otp);
  },

  /**
   * Clear OTP inputs
   */
  clearOTPInputs() {
    const otpInputs = document.querySelectorAll('.otp-input');

    otpInputs.forEach(input => {
      input.value = '';
      input.classList.remove('error', 'success');
      input.disabled = false;
    });

    // Focus on first input
    if (otpInputs.length > 0) {
      otpInputs[0].focus();
    }

    console.log('✅ OTP inputs cleared');
  },

  /**
   * Show error state on OTP inputs
   */
  showOTPError(message) {
    const otpInputs = document.querySelectorAll('.otp-input');
    const errorElement = document.getElementById('otp-error');

    // Show shake animation
    otpInputs.forEach(input => {
      input.classList.add('error');
    });

    // Show error message
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.classList.add('visible');
    }

    console.log('❌ OTP Error:', message);
  },

  /**
   * Show success state on OTP inputs
   */
  showOTPSuccess() {
    const otpInputs = document.querySelectorAll('.otp-input');

    otpInputs.forEach(input => {
      input.classList.add('success');
      input.disabled = true;
    });

    const errorElement = document.getElementById('otp-error');
    if (errorElement) {
      errorElement.textContent = '';
      errorElement.classList.remove('visible');
    }

    console.log('✅ OTP Verified');
  },

  /**
   * Reset OTP state
   */
  resetOTP() {
    if (this.state.countdownInterval) {
      clearInterval(this.state.countdownInterval);
    }

    if (this.state.resendCountdownInterval) {
      clearInterval(this.state.resendCountdownInterval);
    }

    this.clearOTPInputs();

    this.state.otpSent = false;
    this.state.otpVerified = false;
    this.state.otpExpiredTime = null;
    this.state.resendAllowedTime = null;
    this.state.attempts = 0;

    console.log('✅ OTP state reset');
  },

  /**
   * Increment failed attempt counter
   */
  incrementAttempt() {
    this.state.attempts++;
    console.log(`⚠️ OTP attempt ${this.state.attempts}/${this.state.maxAttempts}`);

    if (this.state.attempts >= this.state.maxAttempts) {
      this.lockOTPInput();
    }
  },

  /**
   * Lock OTP input after max attempts
   */
  lockOTPInput() {
    console.log('🔒 OTP input locked due to max attempts');

    const otpInputs = document.querySelectorAll('.otp-input');
    otpInputs.forEach(input => {
      input.disabled = true;
    });

    const verifyBtn = document.getElementById('verify-otp-btn');
    if (verifyBtn) {
      verifyBtn.disabled = true;
      verifyBtn.textContent = 'Too Many Attempts';
    }

    this.showNotification('Too many failed attempts. Please request a new OTP.', 'error');
  },

  /**
   * Show notification
   */
  showNotification(message, type = 'info') {
    const statusContainer = document.getElementById('status-container');
    if (!statusContainer) return;

    const notification = document.createElement('div');
    notification.className = `status-message status-${type}`;
    notification.innerHTML = `
      <div class="status-icon">${type === 'success' ? '✓' : type === 'error' ? '⚠' : 'ℹ'}</div>
      <div class="status-text">${message}</div>
    `;

    statusContainer.innerHTML = '';
    statusContainer.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 5000);
  },

  /**
   * Initialize OTP manager
   */
  init() {
    console.log('🔐 Initializing OTP Manager');
    this.setupOTPInput();
  }
};

// Initialize when needed
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.otp-input')) {
      OTPManager.init();
    }
  });
} else {
  if (document.querySelector('.otp-input')) {
    OTPManager.init();
  }
}
