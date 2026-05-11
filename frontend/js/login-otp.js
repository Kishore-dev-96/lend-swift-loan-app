/**
 * LOGIN OTP HANDLER
 * LendSwift AI - OTP-based login flow management
 */

const LoginOTP = {
  state: {
    currentStep: 'mobile', // 'mobile' or 'otp'
    mobileNumber: null,
    isProcessing: false
  },

  /**
   * Initialize login form
   */
  init() {
    console.log('🔐 Initializing Login OTP Form');
    this.setupEventListeners();
    this.checkAuthStatus();
  },

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    const mobileInput = document.getElementById('mobile');
    const sendOTPBtn = document.getElementById('send-otp-btn');
    const verifyOTPBtn = document.getElementById('verify-otp-btn');
    const resendOTPLink = document.getElementById('resend-otp-link');
    const backToMobileBtn = document.getElementById('back-to-mobile-btn');

    // Mobile number input - real-time validation
    if (mobileInput) {
      mobileInput.addEventListener('input', (e) => {
        this.handleMobileInput(e);
      });

      mobileInput.addEventListener('focus', (e) => {
        document.getElementById('mobile-error')?.classList.remove('visible');
      });
    }

    // Send OTP button
    if (sendOTPBtn) {
      sendOTPBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleSendOTP();
      });
    }

    // Verify OTP button
    if (verifyOTPBtn) {
      verifyOTPBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.handleVerifyOTP();
      });
    }

    // Resend OTP link
    if (resendOTPLink) {
      resendOTPLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (!resendOTPLink.classList.contains('disabled')) {
          this.handleResendOTP();
        }
      });
    }

    // Back to mobile button
    if (backToMobileBtn) {
      backToMobileBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.goBackToMobileStep();
      });
    }

    console.log('✅ Event listeners setup');
  },

  /**
   * Handle mobile number input
   */
  handleMobileInput(event) {
    const input = event.target;
    let value = input.value;

    // Remove non-digits
    value = value.replace(/\D/g, '');

    // Limit to 10 digits
    if (value.length > 10) {
      value = value.substring(0, 10);
    }

    input.value = value;

    // Clear error on input
    const errorElement = document.getElementById('mobile-error');
    if (errorElement && value.length > 0) {
      errorElement.classList.remove('visible');
      input.classList.remove('error');
    }
  },

  /**
   * Handle Send OTP
   */
  async handleSendOTP() {
    const mobileInput = document.getElementById('mobile');
    const sendOTPBtn = document.getElementById('send-otp-btn');

    if (!mobileInput || !sendOTPBtn) return;

    // Validate mobile
    const validation = this.validateMobileNumber(mobileInput.value);

    if (!validation.valid) {
      console.log('❌ Mobile validation failed:', validation.error);
      this.showError('mobile', validation.error);
      return;
    }

    console.log('✅ Mobile validation passed');

    // Show loading state
    this.setButtonLoading(sendOTPBtn, true);
    this.state.isProcessing = true;

    try {
      // Call backend API to send OTP
      const response = await this.sendOTPToBackend(validation.mobile);

      if (response.success) {
        console.log('✅ OTP sent successfully');

        // Store mobile temporarily
        this.state.mobileNumber = validation.mobile;
        window.authStorage.setItem('temp_mobile', validation.mobile);

        // Show OTP input step
        this.showOTPStep();

        // Start OTP timer
        OTPManager.startOTPTimer();
        OTPManager.startResendTimer();

        this.showNotification(`OTP sent to +91 ${validation.mobile}`, 'success');
      } else {
        console.log('❌ OTP send failed');
        this.showError('mobile', response.message || 'Failed to send OTP. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error sending OTP:', error);
      this.showError('mobile', 'Network error. Please check your connection and try again.');
    } finally {
      this.setButtonLoading(sendOTPBtn, false);
      this.state.isProcessing = false;
    }
  },

  /**
   * Validate mobile number
   */
  validateMobileNumber(mobile) {
    // Remove non-digits
    const cleanMobile = mobile.replace(/\D/g, '');

    if (cleanMobile.length !== 10) {
      return {
        valid: false,
        error: 'Mobile number must be 10 digits'
      };
    }

    if (!/^[6-9]/.test(cleanMobile)) {
      return {
        valid: false,
        error: 'Mobile number must start with 6-9'
      };
    }

    return {
      valid: true,
      mobile: cleanMobile
    };
  },

  /**
   * Send OTP to backend
   */
  async sendOTPToBackend(mobile) {
    try {
      const data = await AuthAPI.post('/api/auth/send-otp', {
        mobile: mobile,
        type: 'login'
      });
      return data;
    } catch (error) {
      console.error('❌ Error sending OTP to backend:', error);
      return {
        success: false,
        message: 'Failed to send OTP'
      };
    }
  },

  /**
   * Show OTP step
   */
  showOTPStep() {
    const mobileStep = document.getElementById('step-mobile-number');
    const otpStep = document.getElementById('step-otp');

    if (mobileStep) {
      mobileStep.style.display = 'none';
    }

    if (otpStep) {
      otpStep.style.display = 'block';
      OTPManager.clearOTPInputs();
    }

    this.state.currentStep = 'otp';
    console.log('✅ Switched to OTP verification step');
  },

  /**
   * Handle Verify OTP
   */
  async handleVerifyOTP() {
    // Check if OTP is complete
    if (!OTPManager.isOTPComplete()) {
      OTPManager.showOTPError('Please enter complete 6-digit OTP');
      return;
    }

    const otp = OTPManager.getOTPValue();
    const verifyBtn = document.getElementById('verify-otp-btn');

    if (!verifyBtn) return;

    // Show loading state
    this.setButtonLoading(verifyBtn, true);
    this.state.isProcessing = true;

    try {
      // Call backend API to verify OTP
      const response = await this.verifyOTPWithBackend(this.state.mobileNumber, otp);

      if (response.success) {
        console.log('✅ OTP verified successfully');

        const rememberSession = document.getElementById('remember-session')?.checked;
        if (response.user && response.token) {
          authStorage.login(response.user, response.token, rememberSession);
        }

        OTPManager.showOTPSuccess();
        this.showNotification('Login successful! Redirecting...', 'success');

        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 1500);
      } else {
        console.log('❌ OTP verification failed');

        OTPManager.incrementAttempt();
        OTPManager.showOTPError(response.message || 'Invalid OTP. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error verifying OTP:', error);
      OTPManager.incrementAttempt();
      OTPManager.showOTPError('Network error. Please try again.');
    } finally {
      this.setButtonLoading(verifyBtn, false);
      this.state.isProcessing = false;
    }
  },

  /**
   * Verify OTP with backend
   */
  async verifyOTPWithBackend(mobile, otp) {
    try {
      const data = await AuthAPI.post('/api/auth/mobile-login', {
        mobile: mobile,
        otp: otp
      });
      return data;
    } catch (error) {
      console.error('❌ Error verifying OTP with backend:', error);
      return {
        success: false,
        message: 'Failed to verify OTP'
      };
    }
  },

  /**
   * Handle Resend OTP
   */
  async handleResendOTP() {
    if (!this.state.mobileNumber) {
      console.log('❌ Mobile number not found');
      return;
    }

    const sendOTPBtn = document.getElementById('send-otp-btn');
    if (sendOTPBtn) {
      this.setButtonLoading(sendOTPBtn, true);
    }

    try {
      const response = await this.sendOTPToBackend(this.state.mobileNumber);

      if (response.success) {
        console.log('✅ OTP resent successfully');

        // Reset OTP inputs and timers
        OTPManager.clearOTPInputs();
        OTPManager.startOTPTimer();
        OTPManager.startResendTimer();

        this.showNotification('New OTP sent to your mobile', 'success');
      } else {
        console.log('❌ Resend OTP failed');
        this.showNotification(response.message || 'Failed to resend OTP', 'error');
      }
    } catch (error) {
      console.error('❌ Error resending OTP:', error);
      this.showNotification('Network error. Please try again.', 'error');
    } finally {
      if (sendOTPBtn) {
        this.setButtonLoading(sendOTPBtn, false);
      }
    }
  },

  /**
   * Go back to mobile step
   */
  goBackToMobileStep() {
    const mobileStep = document.getElementById('step-mobile-number');
    const otpStep = document.getElementById('step-otp');

    if (otpStep) {
      otpStep.style.display = 'none';
    }

    if (mobileStep) {
      mobileStep.style.display = 'block';
    }

    // Reset OTP manager
    OTPManager.resetOTP();

    this.state.currentStep = 'mobile';
    this.state.mobileNumber = null;

    console.log('✅ Switched back to mobile entry step');
  },

  /**
   * Show error message
   */
  showError(fieldId, message) {
    const errorElement = document.getElementById(`${fieldId}-error`);
    const inputElement = document.getElementById(fieldId);

    if (errorElement) {
      errorElement.textContent = message;
      errorElement.classList.add('visible');
    }

    if (inputElement) {
      inputElement.classList.add('error');
    }

    console.log(`❌ Error in ${fieldId}:`, message);
  },

  /**
   * Show notification
   */
  showNotification(message, type = 'info') {
    const statusContainer = document.getElementById('status-container');
    if (!statusContainer) return;

    const icons = {
      success: '✓',
      error: '⚠',
      info: 'ℹ'
    };

    const notification = document.createElement('div');
    notification.className = `status-message status-${type}`;
    notification.innerHTML = `
      <div class="status-icon">${icons[type]}</div>
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
   * Set button loading state
   */
  setButtonLoading(button, isLoading) {
    const textSpan = button.querySelector('.button-text');
    const loaderDiv = button.querySelector('.button-loader');

    if (isLoading) {
      button.disabled = true;
      if (textSpan) textSpan.style.opacity = '0.6';
      if (loaderDiv) loaderDiv.classList.remove('hidden');
    } else {
      button.disabled = false;
      if (textSpan) textSpan.style.opacity = '1';
      if (loaderDiv) loaderDiv.classList.add('hidden');
    }
  },

  /**
   * Check if already authenticated
   */
  checkAuthStatus() {
    if (window.authStorage.getToken()) {
      console.log('✅ User already authenticated, redirecting...');
      window.location.href = 'dashboard.html';
    }
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => LoginOTP.init());
} else {
  LoginOTP.init();
}
