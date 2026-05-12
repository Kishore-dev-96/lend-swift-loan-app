/**
 * LendSwift AI - Signup Handler
 * Handles signup form validation and submission
 */

document.addEventListener('DOMContentLoaded', () => {
  const signupForm = document.getElementById('signup-form');
  const statusContainer = document.getElementById('status-container');
  const toastNotification = document.getElementById('toast-notification');

  if (!signupForm) return;

  // Password visibility toggle
  document.querySelectorAll('.password-toggle').forEach(toggle => {
    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      const inputId = toggle.getAttribute('data-toggle-password');
      const input = document.getElementById(inputId);
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      toggle.textContent = isPassword ? '🙈' : '👁️';
    });
  });

  // Form submission
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

    // Get form data
    const fullName = document.getElementById('fullname').value.trim();
    const email = document.getElementById('email').value.trim();
    const mobile = document.getElementById('mobile').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const termsAccepted = document.getElementById('terms').checked;

    // Validate all fields
    const errors = validateSignupForm({
      fullName,
      email,
      mobile,
      password,
      confirmPassword,
      termsAccepted
    });

    if (Object.keys(errors).length > 0) {
      displayErrors(errors);
      showToast('Please fix the errors below', 'error');
      return;
    }

    showLoading();

    try {
      const result = await AuthAPI.post('/api/auth/send-otp', {
        mobile,
        type: 'signup'
      });

      if (!result.success) {
        showToast(result.message || 'Unable to send OTP', 'error');
        displayErrors({ general: result.message || 'Unable to send OTP' });
        hideLoading();
        return;
      }

      if (result.dev_otp) {
        console.debug('Development OTP:', result.dev_otp);
      }

      const signupData = {
        fullName,
        email,
        mobile,
        password
      };

      sessionStorage.setItem('signup_data', JSON.stringify(signupData));
      sessionStorage.setItem('otp_sent_at', String(Date.now()));
      sessionStorage.setItem('otp_expires_at', String(Date.now() + 300000));

      showToast('OTP sent to your mobile. Please verify to complete signup.', 'success');
      setTimeout(() => {
        window.location.href = 'otp-verification.html';
      }, 1200);
    } catch (error) {
      console.error('Signup error:', error);
      showToast('An error occurred. Please try again.', 'error');
      hideLoading();
    }
  });

  // Real-time validation
  document.getElementById('fullname').addEventListener('blur', function () {
    const value = this.value.trim();
    if (value && !isValidFullName(value)) {
      showFieldError('fullname', 'Please enter a valid full name (3+ characters)');
    } else {
      clearFieldError('fullname');
    }
  });

  document.getElementById('email').addEventListener('blur', function () {
    const value = this.value.trim();
    if (value && !AuthSystem.isValidEmail(value)) {
      showFieldError('email', 'Please enter a valid email address');
    } else {
      clearFieldError('email');
    }
  });

  document.getElementById('mobile').addEventListener('blur', function () {
    const value = this.value.trim();
    if (value && !AuthSystem.isValidMobile(value)) {
      showFieldError('mobile', 'Please enter a valid 10-digit mobile number');
    } else {
      clearFieldError('mobile');
    }
  });

  document.getElementById('password').addEventListener('blur', function () {
    const value = this.value;
    if (value && !AuthSystem.isValidPassword(value)) {
      showFieldError('password', 'Password must be at least 8 characters');
    } else {
      clearFieldError('password');
    }
  });

  document.getElementById('confirm-password').addEventListener('blur', function () {
    const password = document.getElementById('password').value;
    const value = this.value;
    if (value && !AuthSystem.passwordsMatch(password, value)) {
      showFieldError('confirm-password', 'Passwords do not match');
    } else {
      clearFieldError('confirm-password');
    }
  });

  // Validation functions
  function validateSignupForm(data) {
    const errors = {};

    // Full name validation
    if (!data.fullName) {
      errors.fullname = 'Full name is required';
    } else if (!isValidFullName(data.fullName)) {
      errors.fullname = 'Please enter a valid full name (3+ characters, letters and spaces only)';
    }

    // Email validation
    if (!data.email) {
      errors.email = 'Email is required';
    } else if (!AuthSystem.isValidEmail(data.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Mobile validation
    if (!data.mobile) {
      errors.mobile = 'Mobile number is required';
    } else if (!AuthSystem.isValidMobile(data.mobile)) {
      errors.mobile = 'Please enter a valid 10-digit mobile number';
    }

    // Password validation
    if (!data.password) {
      errors.password = 'Password is required';
    } else if (!AuthSystem.isValidPassword(data.password)) {
      errors.password = 'Password must be at least 8 characters';
    }

    // Confirm password validation
    if (!data.confirmPassword) {
      errors['confirm-password'] = 'Please confirm your password';
    } else if (!AuthSystem.passwordsMatch(data.password, data.confirmPassword)) {
      errors['confirm-password'] = 'Passwords do not match';
    }

    // Terms validation
    if (!data.termsAccepted) {
      errors.terms = 'You must agree to the Terms & Conditions';
    }

    return errors;
  }

  function isValidFullName(name) {
    return /^[a-zA-Z\s]{3,}$/.test(name);
  }

  // Error display functions
  function showFieldError(fieldId, message) {
    const errorElement = document.getElementById(`${fieldId}-error`);
    const inputElement = document.getElementById(fieldId);
    
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.classList.add('show');
    }
    
    if (inputElement) {
      inputElement.classList.add('error');
    }
  }

  function clearFieldError(fieldId) {
    const errorElement = document.getElementById(`${fieldId}-error`);
    const inputElement = document.getElementById(fieldId);
    
    if (errorElement) {
      errorElement.textContent = '';
      errorElement.classList.remove('show');
    }
    
    if (inputElement) {
      inputElement.classList.remove('error');
    }
  }

  function displayErrors(errors) {
    Object.entries(errors).forEach(([field, message]) => {
      const errorElement = document.getElementById(`${field}-error`);
      const inputElement = document.getElementById(field);
      
      if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('show');
      }
      
      if (inputElement) {
        inputElement.classList.add('error');
      }
    });
  }

  function clearErrors() {
    document.querySelectorAll('.error-message').forEach(el => {
      el.classList.remove('show');
      el.textContent = '';
    });

    document.querySelectorAll('.form-input').forEach(el => {
      el.classList.remove('error');
    });

    document.querySelectorAll('input[type="checkbox"]').forEach(el => {
      el.classList.remove('error');
    });
  }

  // Loading state
  function showLoading() {
    const btn = document.getElementById('signup-btn');
    btn.disabled = true;
    btn.querySelector('.button-text').style.display = 'none';
    btn.querySelector('.button-loader').classList.remove('hidden');
    signupForm.classList.add('form-loading');
  }

  function hideLoading() {
    const btn = document.getElementById('signup-btn');
    btn.disabled = false;
    btn.querySelector('.button-text').style.display = 'inline';
    btn.querySelector('.button-loader').classList.add('hidden');
    signupForm.classList.remove('form-loading');
  }

  // Toast notification
  function showToast(message, type = 'info') {
    toastNotification.textContent = message;
    toastNotification.className = `toast-notification ${type}`;
    
    setTimeout(() => {
      toastNotification.classList.add('hidden');
    }, 4000);
  }
});
