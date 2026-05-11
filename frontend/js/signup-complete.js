/**
 * LendSwift AI - Signup Authentication Handler
 * Manages complete signup flow with validation
 */

class SignupHandler {
  constructor() {
    this.form = null;
    this.submitButton = null;
    this.init();
  }

  init() {
    document.addEventListener('DOMContentLoaded', () => {
      this.form = document.getElementById('signup-form');

      if (!this.form) {
        console.warn('Signup form not found');
        return;
      }

      this.submitButton = document.getElementById('signup-btn');

      // Initialize database
      AuthUtils.initializeUsersDatabase();

      // Attach event listeners
      this.attachFormValidation();
      this.attachFormSubmit();
      this.attachPasswordToggle();
    });
  }

  // Attach form validation on input change
  attachFormValidation() {
    const inputs = this.form.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="password"]');

    inputs.forEach(input => {
      input.addEventListener('blur', (e) => {
        this.validateField(e.target);
      });

      input.addEventListener('input', (e) => {
        if (e.target.classList.contains('error')) {
          this.validateField(e.target);
        }
      });
    });
  }

  // Validate individual field
  validateField(field) {
    const fieldName = field.id;
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';

    switch (fieldName) {
      case 'fullname':
        if (!value) {
          errorMessage = 'Full name is required';
          isValid = false;
        } else if (!AuthUtils.validateFullName(value)) {
          errorMessage = 'Full name must be between 2-50 characters';
          isValid = false;
        }
        break;

      case 'email':
        if (!value) {
          errorMessage = 'Email is required';
          isValid = false;
        } else if (!AuthUtils.validateEmail(value)) {
          errorMessage = 'Please enter a valid email address';
          isValid = false;
        } else if (AuthUtils.findUserByEmail(value)) {
          errorMessage = 'Email already registered';
          isValid = false;
        }
        break;

      case 'mobile':
        if (!value) {
          errorMessage = 'Mobile number is required';
          isValid = false;
        } else if (!AuthUtils.validateMobile(value)) {
          errorMessage = 'Mobile must be 10 digits starting with 6-9';
          isValid = false;
        } else if (AuthUtils.findUserByMobile(value)) {
          errorMessage = 'Mobile number already registered';
          isValid = false;
        }
        break;

      case 'password':
        if (!value) {
          errorMessage = 'Password is required';
          isValid = false;
        } else if (!AuthUtils.validatePassword(value)) {
          errorMessage = 'Password must be at least 8 characters';
          isValid = false;
        }
        break;

      case 'confirm-password':
        const passwordField = this.form.querySelector('#password');
        if (!value) {
          errorMessage = 'Please confirm your password';
          isValid = false;
        } else if (!AuthUtils.validatePasswordMatch(passwordField.value, value)) {
          errorMessage = 'Passwords do not match';
          isValid = false;
        }
        break;

      default:
        break;
    }

    this.showFieldError(field, errorMessage, isValid);
    return isValid;
  }

  // Show/hide field error
  showFieldError(field, message, isValid) {
    const errorElement = field.closest('.form-group').querySelector('.error-message');

    if (isValid) {
      field.classList.remove('error');
      if (errorElement) {
        errorElement.textContent = '';
        errorElement.classList.remove('show');
      }
    } else {
      field.classList.add('error');
      if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('show');
      }
    }
  }

  // Validate entire form
  validateForm() {
    const fullname = this.form.querySelector('#fullname');
    const email = this.form.querySelector('#email');
    const mobile = this.form.querySelector('#mobile');
    const password = this.form.querySelector('#password');
    const confirmPassword = this.form.querySelector('#confirm-password');
    const terms = this.form.querySelector('#terms');

    let isValid = true;

    isValid &= this.validateField(fullname);
    isValid &= this.validateField(email);
    isValid &= this.validateField(mobile);
    isValid &= this.validateField(password);
    isValid &= this.validateField(confirmPassword);

    // Validate terms
    if (!terms.checked) {
      const termsError = this.form.querySelector('#terms-error');
      if (termsError) {
        termsError.textContent = 'You must accept the terms and conditions';
        termsError.classList.add('show');
      }
      isValid = false;
    }

    return isValid;
  }

  // Attach form submit handler
  attachFormSubmit() {
    this.form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Clear previous status
      AuthUtils.clearStatus();

      // Validate form
      if (!this.validateForm()) {
        AuthUtils.showError('Please fix all errors before submitting');
        return;
      }

      // Disable submit button
      this.disableSubmitButton();

      try {
        // Get form data
        const formData = AuthUtils.getFormData(this.form);

        // Generate OTP
        const otp = AuthUtils.generateOTP();
        const otpExpiry = AuthUtils.getOTPExpiryTime();

        // Prepare temporary signup data
        const tempSignupData = {
          fullName: formData.fullname,
          mobile: formData.mobile,
          email: formData.email,
          password: formData['confirm-password'],
          otp: otp,
          expiryTime: otpExpiry,
          failedAttempts: 0,
          createdAt: new Date().toISOString()
        };

        // Save temporary data
        const saved = AuthUtils.saveTemporarySignupData(tempSignupData);

        if (saved) {
          // Show success message
          AuthUtils.showSuccess(`OTP sent to ${formData.mobile}. Redirecting to verification...`);

          // Simulate sending OTP (in real app, this would be sent via SMS)
          console.log('📱 OTP sent:', otp);
          console.log('📧 OTP Expiry:', otpExpiry);

          // Redirect to OTP verification page after short delay
          setTimeout(() => {
            window.location.href = 'otp-verification.html';
          }, 1500);
        } else {
          AuthUtils.showError('Error saving signup data. Please try again.');
          this.enableSubmitButton();
        }
      } catch (error) {
        console.error('Signup error:', error);
        AuthUtils.showError('An error occurred during signup. Please try again.');
        this.enableSubmitButton();
      }
    });
  }

  // Attach password toggle functionality
  attachPasswordToggle() {
    const toggleButtons = this.form.querySelectorAll('.password-toggle');

    toggleButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();

        const targetId = button.getAttribute('data-toggle-password');
        const input = this.form.querySelector(`#${targetId}`);

        if (!input) return;

        if (input.type === 'password') {
          input.type = 'text';
          button.textContent = '🙈';
        } else {
          input.type = 'password';
          button.textContent = '👁️';
        }
      });
    });
  }

  // Disable submit button
  disableSubmitButton() {
    this.submitButton.disabled = true;
    this.submitButton.style.opacity = '0.6';
    this.submitButton.style.cursor = 'not-allowed';

    const loader = this.submitButton.querySelector('.button-loader');
    if (loader) {
      loader.classList.remove('hidden');
    }

    const text = this.submitButton.querySelector('.button-text');
    if (text) {
      text.textContent = 'Creating Account...';
    }
  }

  // Enable submit button
  enableSubmitButton() {
    this.submitButton.disabled = false;
    this.submitButton.style.opacity = '1';
    this.submitButton.style.cursor = 'pointer';

    const loader = this.submitButton.querySelector('.button-loader');
    if (loader) {
      loader.classList.add('hidden');
    }

    const text = this.submitButton.querySelector('.button-text');
    if (text) {
      text.textContent = 'Create Account';
    }
  }
}

// Initialize signup handler
const signupHandler = new SignupHandler();

// Export for global access
window.SignupHandler = SignupHandler;
window.signupHandler = signupHandler;
