/**
 * LendSwift AI - Login Handler
 * Handles login form validation and submission
 */

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const toastNotification = document.getElementById('toast-notification');

  if (!loginForm) return;

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
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

    const identifier = document.getElementById('identifier').value.trim();
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('remember-me').checked;

    const errors = validateLoginForm({ identifier, password });
    if (Object.keys(errors).length > 0) {
      displayErrors(errors);
      showToast('Please fix the errors below', 'error');
      return;
    }

    showLoading();

    try {
      const result = await AuthAPI.post('/api/auth/login', {
        identifier,
        password
      });

      if (!result.success) {
        showToast(result.message || 'Invalid login credentials', 'error');
        displayErrors({ general: result.message || 'Invalid login credentials' });
        hideLoading();
        return;
      }

      window.authStorage.login(result.user, result.token, rememberMe);
      showToast('Login successful! 🎉', 'success');

      if (rememberMe) {
        localStorage.setItem('lendswift_remember_me', identifier);
      } else {
        localStorage.removeItem('lendswift_remember_me');
      }

      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1200);
    } catch (error) {
      console.error('Login error:', error);
      showToast('An error occurred. Please try again.', 'error');
      hideLoading();
    }
  });

  // Real-time validation
  document.getElementById('identifier').addEventListener('blur', function() {
    const value = this.value.trim();
    if (value) {
      const isEmail = AuthSystem.isValidEmail(value);
      const isMobile = AuthSystem.isValidMobile(value);
      
      if (!isEmail && !isMobile) {
        showFieldError('identifier', 'Please enter a valid email or 10-digit mobile number');
      } else {
        clearFieldError('identifier');
      }
    }
  });

  document.getElementById('password').addEventListener('blur', function() {
    const value = this.value;
    if (value && value.length === 0) {
      showFieldError('password', 'Password is required');
    } else {
      clearFieldError('password');
    }
  });

  // Check for remembered credential
  window.addEventListener('load', () => {
    const remembered = localStorage.getItem('lendswift_remember_me');
    if (remembered) {
      document.getElementById('identifier').value = remembered;
      document.getElementById('remember-me').checked = true;
    }
  });

  // Validation functions
  function validateLoginForm(data) {
    const errors = {};

    // Identifier validation
    if (!data.identifier) {
      errors.identifier = 'Email or mobile number is required';
    } else {
      const isEmail = AuthSystem.isValidEmail(data.identifier);
      const isMobile = AuthSystem.isValidMobile(data.identifier);
      
      if (!isEmail && !isMobile) {
        errors.identifier = 'Please enter a valid email or 10-digit mobile number';
      }
    }

    // Password validation
    if (!data.password) {
      errors.password = 'Password is required';
    }

    return errors;
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
    if (errors.general) {
      const statusContainer = document.getElementById('status-container');
      const errorDiv = document.createElement('div');
      errorDiv.className = 'status-message error';
      errorDiv.textContent = errors.general;
      statusContainer.innerHTML = '';
      statusContainer.appendChild(errorDiv);
    }

    Object.entries(errors).forEach(([field, message]) => {
      if (field === 'general') return;
      
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

    const statusContainer = document.getElementById('status-container');
    if (statusContainer) {
      statusContainer.innerHTML = '';
    }
  }

  // Loading state
  function showLoading() {
    const btn = document.getElementById('login-btn');
    btn.disabled = true;
    btn.querySelector('.button-text').style.display = 'none';
    btn.querySelector('.button-loader').classList.remove('hidden');
    loginForm.classList.add('form-loading');
  }

  function hideLoading() {
    const btn = document.getElementById('login-btn');
    btn.disabled = false;
    btn.querySelector('.button-text').style.display = 'inline';
    btn.querySelector('.button-loader').classList.add('hidden');
    loginForm.classList.remove('form-loading');
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
