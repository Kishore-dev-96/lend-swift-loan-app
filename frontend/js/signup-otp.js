/**
 * SIGNUP OTP HANDLER
 * LendSwift AI - OTP-based signup flow management
 */

const SignupOTP = {
  state: {
    currentStep: 'details', // 'details' or 'otp'
    formData: {
      fullName: null,
      mobile: null,
      email: null
    },
    isProcessing: false
  },

  /**
   * Initialize signup form
   */
  init() {
    console.log('🎯 Initializing Signup OTP Form');
    this.setupEventListeners();
    this.setupInputValidation();
    this.checkAuthStatus();
  },

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    const sendOTPBtn = document.getElementById('send-otp-signup-btn');
    const verifyOTPBtn = document.getElementById('verify-otp-signup-btn');
    const resendOTPLink = document.getElementById('resend-otp-signup-link');
    const backToDetailsBtn = document.getElementById('back-to-details-btn');

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

    // Back to details button
    if (backToDetailsBtn) {
      backToDetailsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.goBackToDetails();
      });
    }

    console.log('✅ Event listeners setup');
  },

  /**
   * Setup input validation
   */
  setupInputValidation() {
    // Full name input
    const fullNameInput = document.getElementById('fullName');
    if (fullNameInput) {
      fullNameInput.addEventListener('blur', (e) => {
        this.validateAndShowError('fullName', e.target.value);
      });

      fullNameInput.addEventListener('focus', (e) => {
        this.clearError('fullName');
      });
    }

    // Mobile input
    const mobileInput = document.getElementById('mobile');
    if (mobileInput) {
      mobileInput.addEventListener('input', (e) => {
        this.handleMobileInput(e);
      });

      mobileInput.addEventListener('blur', (e) => {
        this.validateAndShowError('mobile', e.target.value);
      });

      mobileInput.addEventListener('focus', (e) => {
        this.clearError('mobile');
      });
    }

    // Email input
    const emailInput = document.getElementById('email');
    if (emailInput) {
      emailInput.addEventListener('blur', (e) => {
        this.validateAndShowError('email', e.target.value);
      });

      emailInput.addEventListener('focus', (e) => {
        this.clearError('email');
      });
    }

    console.log('✅ Input validation setup');
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
   * Validate field and show error
   */
  validateAndShowError(fieldName, value) {
    let error = null;

    if (fieldName === 'fullName') {
      const validation = this.validateName(value);
      if (!validation.valid) {
        error = validation.error;
      }
    } else if (fieldName === 'mobile') {
      const validation = this.validateMobileNumber(value);
      if (!validation.valid) {
        error = validation.error;
      }
    } else if (fieldName === 'email') {
      const validation = this.validateEmail(value);
      if (!validation.valid) {
        error = validation.error;
      }
    }

    if (error) {
      this.showError(fieldName, error);
      return false;
    }

    return true;
  },

  /**
   * Validate name
   */
  validateName(name) {
    const cleanName = name.trim();

    if (!cleanName) {
      return { valid: false, error: 'Full name is required' };
    }

    if (cleanName.length < 2) {
      return { valid: false, error: 'Name must be at least 2 characters' };
    }

    if (cleanName.length > 50) {
      return { valid: false, error: 'Name must not exceed 50 characters' };
    }

    if (!/^[a-zA-Z\s'-]+$/.test(cleanName)) {
      return { valid: false, error: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
    }

    return { valid: true, name: cleanName };
  },

  /**
   * Validate mobile number
   */
  validateMobileNumber(mobile) {
    const cleanMobile = mobile.replace(/\D/g, '');

    if (!cleanMobile) {
      return { valid: false, error: 'Mobile number is required' };
    }

    if (cleanMobile.length !== 10) {
      return { valid: false, error: 'Mobile number must be 10 digits' };
    }

    if (!/^[6-9]/.test(cleanMobile)) {
      return { valid: false, error: 'Mobile number must start with 6-9' };
    }

    return { valid: true, mobile: cleanMobile };
  },

  /**
   * Validate email
   */
  validateEmail(email) {
    if (!email) {
      return { valid: false, error: 'Email is required' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { valid: false, error: 'Please enter a valid email address' };
    }

    return { valid: true, email: email.toLowerCase() };
  },

  /**
   * Validate all form data
   */
  validateFormData() {
    const fullNameInput = document.getElementById('fullName');
    const mobileInput = document.getElementById('mobile');
    const emailInput = document.getElementById('email');

    let isValid = true;

    // Validate each field
    if (!this.validateAndShowError('fullName', fullNameInput?.value || '')) {
      isValid = false;
    }

    if (!this.validateAndShowError('mobile', mobileInput?.value || '')) {
      isValid = false;
    }

    if (!this.validateAndShowError('email', emailInput?.value || '')) {
      isValid = false;
    }

    return isValid;
  },

  /**
   * Handle Send OTP
   */
  async handleSendOTP() {
    if (!this.validateFormData()) {
      console.log('❌ Form validation failed');
      return;
    }

    const fullNameInput = document.getElementById('fullName');
    const mobileInput = document.getElementById('mobile');
    const emailInput = document.getElementById('email');
    const sendOTPBtn = document.getElementById('send-otp-signup-btn');

    // Store form data
    this.state.formData.fullName = fullNameInput.value.trim();
    this.state.formData.mobile = mobileInput.value.replace(/\D/g, '');
    this.state.formData.email = emailInput.value.toLowerCase();

    console.log('✅ Form validation passed');

    // Show loading state
    this.setButtonLoading(sendOTPBtn, true);
    this.state.isProcessing = true;

    try {
      // Call backend API to send OTP
      const response = await this.sendOTPToBackend(this.state.formData.mobile);

      if (response.success) {
        console.log('✅ OTP sent successfully');

        // Store mobile temporarily
        AuthStorage.setItem('temp_mobile', this.state.formData.mobile);
        AuthStorage.setItem('signup_data', this.state.formData);

        // Show OTP input step
        this.showOTPStep();

        // Setup OTP manager for signup
        this.setupOTPManagerForSignup();

        this.showNotification(`OTP sent to +91 ${this.state.formData.mobile}`, 'success');
      } else {
        console.log('❌ OTP send failed');
        this.showNotification(response.message || 'Failed to send OTP. Please try again.', 'error');
      }
    } catch (error) {
      console.error('❌ Error sending OTP:', error);
      this.showNotification('Network error. Please check your connection and try again.', 'error');
    } finally {
      this.setButtonLoading(sendOTPBtn, false);
      this.state.isProcessing = false;
    }
  },

  /**
   * Setup OTP manager for signup
   */
  setupOTPManagerForSignup() {
    // Update OTP manager to use signup-specific elements
    const otpInputs = document.querySelectorAll('#step-otp-signup .otp-input');
    
    if (otpInputs.length > 0) {
      OTPManager.setupOTPInput();
      OTPManager.startOTPTimer();
      OTPManager.startResendTimer();
    }
  },

  /**
   * Send OTP to backend
   */
  async sendOTPToBackend(mobile) {
    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          mobile: mobile,
          countryCode: '+91',
          type: 'signup'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ Error sending OTP:', error);
      return { success: false, message: 'Failed to send OTP' };
    }
  },

  /**
   * Show OTP step
   */
  showOTPStep() {
    const detailsStep = document.getElementById('step-details');
    const otpStep = document.getElementById('step-otp-signup');

    if (detailsStep) detailsStep.style.display = 'none';
    if (otpStep) otpStep.style.display = 'block';

    // Update progress indicator
    this.updateProgressIndicator(2);

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
    const verifyBtn = document.getElementById('verify-otp-signup-btn');

    if (!verifyBtn) return;

    // Show loading state
    this.setButtonLoading(verifyBtn, true);
    this.state.isProcessing = true;

    try {
      // Call backend API to verify OTP and create account
      const response = await this.createAccountWithOTP(otp);

      if (response.success) {
        console.log('✅ Account created successfully');

        // Store user data
        if (response.user) {
          AuthStorage.setItem('user', response.user);
          AuthStorage.setItem('token', response.token);
        }

        // Show success
        OTPManager.showOTPSuccess();
        this.updateProgressIndicator(3);
        this.showNotification('Account created successfully! Redirecting...', 'success');

        // Redirect to dashboard after 1.5 seconds
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
   * Create account with OTP
   */
  async createAccountWithOTP(otp) {
    try {
      const response = await fetch('/api/auth/signup-verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fullName: this.state.formData.fullName,
          mobile: this.state.formData.mobile,
          email: this.state.formData.email,
          otp: otp,
          countryCode: '+91'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ Error creating account:', error);
      return { success: false, message: 'Failed to create account' };
    }
  },

  /**
   * Handle Resend OTP
   */
  async handleResendOTP() {
    const sendOTPBtn = document.getElementById('send-otp-signup-btn');
    if (sendOTPBtn) {
      this.setButtonLoading(sendOTPBtn, true);
    }

    try {
      const response = await this.sendOTPToBackend(this.state.formData.mobile);

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
   * Go back to details
   */
  goBackToDetails() {
    const detailsStep = document.getElementById('step-details');
    const otpStep = document.getElementById('step-otp-signup');

    if (otpStep) otpStep.style.display = 'none';
    if (detailsStep) detailsStep.style.display = 'block';

    // Reset OTP manager
    OTPManager.resetOTP();

    // Update progress indicator
    this.updateProgressIndicator(1);

    this.state.currentStep = 'details';

    console.log('✅ Switched back to details step');
  },

  /**
   * Update progress indicator
   */
  updateProgressIndicator(step) {
    for (let i = 1; i <= 3; i++) {
      const stepIndicator = document.getElementById(`step-indicator-${i}`);
      if (stepIndicator) {
        if (i <= step) {
          stepIndicator.classList.add('active');
        } else {
          stepIndicator.classList.remove('active');
        }
      }
    }
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
   * Clear error message
   */
  clearError(fieldName) {
    const errorElement = document.getElementById(`${fieldName}-error`);
    const inputElement = document.getElementById(fieldName);

    if (errorElement) {
      errorElement.textContent = '';
      errorElement.classList.remove('visible');
    }

    if (inputElement) {
      inputElement.classList.remove('error');
    }
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
    const textSpan = button?.querySelector('.button-text');
    const loaderDiv = button?.querySelector('.button-loader');

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
    if (AuthStorage.getItem('token')) {
      console.log('✅ User already authenticated, redirecting...');
      window.location.href = 'dashboard.html';
    }
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => SignupOTP.init());
} else {
  SignupOTP.init();
}
