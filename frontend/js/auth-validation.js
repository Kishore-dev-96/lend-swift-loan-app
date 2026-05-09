/**
 * LendSwift AI - Authentication Form Validation Module
 * Handles client-side validation for signup and login forms
 */

// Validation Rules
const AUTH_VALIDATION_RULES = {
  fullName: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z\s]+$/,
    message: {
      required: 'Full name is required',
      minLength: 'Name must be at least 2 characters',
      maxLength: 'Name must be less than 50 characters',
      pattern: 'Name can only contain letters and spaces'
    }
  },
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: {
      required: 'Email address is required',
      pattern: 'Please enter a valid email address'
    }
  },
  mobile: {
    required: true,
    pattern: /^[6-9]\d{9}$/,
    message: {
      required: 'Mobile number is required',
      pattern: 'Please enter a valid 10-digit mobile number starting with 6-9'
    }
  },
  password: {
    required: true,
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    message: {
      required: 'Password is required',
      minLength: 'Password must be at least 8 characters',
      pattern: 'Password must contain uppercase, lowercase, number, and special character'
    }
  },
  confirmPassword: {
    required: true,
    match: 'password',
    message: {
      required: 'Please confirm your password',
      match: 'Passwords do not match'
    }
  },
  terms: {
    required: true,
    message: {
      required: 'You must accept the terms and conditions'
    }
  }
};

// Password Strength Checker
function checkPasswordStrength(password) {
  let score = 0;
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[@$!%*?&]/.test(password)
  };

  score = Object.values(checks).filter(Boolean).length;

  let strength = 'weak';
  let color = '#ef4444';

  if (score >= 4) {
    strength = 'strong';
    color = '#10b981';
  } else if (score >= 3) {
    strength = 'good';
    color = '#3b82f6';
  } else if (score >= 2) {
    strength = 'fair';
    color = '#f59e0b';
  }

  return { score, strength, color, checks };
}

// Update Password Strength UI
function updatePasswordStrength(password, strengthElement, bars) {
  const { score, strength } = checkPasswordStrength(password);

  // Update bars
  bars.forEach((bar, index) => {
    bar.className = 'strength-bar';
    if (index < score) {
      bar.classList.add(`active-${strength}`);
    }
  });

  // Update text
  const strengthText = {
    weak: 'Weak password',
    fair: 'Fair password',
    good: 'Good password',
    strong: 'Strong password'
  };

  strengthElement.textContent = password.length === 0 ? 'Password strength' : strengthText[strength];
}

// Validate Single Field
function validateAuthField(fieldName, value, formData = {}) {
  const rules = AUTH_VALIDATION_RULES[fieldName];
  if (!rules) return { isValid: true };

  const errors = [];

  // Required check
  if (rules.required && (!value || value.trim() === '')) {
    errors.push(rules.message.required);
  }

  // Skip other validations if required fails
  if (errors.length > 0) {
    return { isValid: false, errors };
  }

  // Min length check
  if (rules.minLength && value.length < rules.minLength) {
    errors.push(rules.message.minLength);
  }

  // Max length check
  if (rules.maxLength && value.length > rules.maxLength) {
    errors.push(rules.message.maxLength);
  }

  // Pattern check
  if (rules.pattern && !rules.pattern.test(value)) {
    errors.push(rules.message.pattern);
  }

  // Match check (for confirm password)
  if (rules.match && value !== formData[rules.match]) {
    errors.push(rules.message.match);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Validate Entire Auth Form
function validateAuthForm(formElement) {
  const formData = new FormData(formElement);
  const fields = Array.from(formElement.querySelectorAll('input, select, textarea'));
  let isFormValid = true;
  const errors = {};

  fields.forEach(field => {
    const fieldName = field.name;
    if (!fieldName) return;

    const value = field.type === 'checkbox' ? field.checked : field.value;
    const validation = validateAuthField(fieldName, value, Object.fromEntries(formData));

    if (!validation.isValid) {
      isFormValid = false;
      errors[fieldName] = validation.errors;
      showAuthFieldError(field, validation.errors[0]);
    } else {
      hideAuthFieldError(field);
    }
  });

  return { isValid: isFormValid, errors };
}

// Show Field Error
function showAuthFieldError(field, message) {
  const formGroup = field.closest('.form-group');
  const errorElement = formGroup.querySelector('.error-message');

  if (errorElement) {
    errorElement.textContent = message;
    errorElement.classList.add('show');
  }

  field.classList.add('error');
}

// Hide Field Error
function hideAuthFieldError(field) {
  const formGroup = field.closest('.form-group');
  const errorElement = formGroup.querySelector('.error-message');

  if (errorElement) {
    errorElement.classList.remove('show');
  }

  field.classList.remove('error');
}

// Clear All Auth Errors
function clearAllAuthErrors(formElement) {
  const errorElements = formElement.querySelectorAll('.error-message');
  const errorFields = formElement.querySelectorAll('.error');

  errorElements.forEach(el => el.classList.remove('show'));
  errorFields.forEach(field => field.classList.remove('error'));
}

// Real-time Auth Validation
function setupAuthRealTimeValidation(formElement) {
  const inputs = formElement.querySelectorAll('input, select, textarea');

  inputs.forEach(input => {
    // Password strength for password field
    if (input.name === 'password') {
      const formGroup = input.closest('.form-group');
      const strengthElement = formGroup.querySelector('#strength-text');
      const bars = formGroup.querySelectorAll('.strength-bar');

      input.addEventListener('input', () => {
        updatePasswordStrength(input.value, strengthElement, bars);
      });
    }

    // Real-time validation
    input.addEventListener('blur', () => {
      const formData = new FormData(formElement);
      const validation = validateAuthField(input.name, input.value, Object.fromEntries(formData));

      if (!validation.isValid) {
        showAuthFieldError(input, validation.errors[0]);
      } else {
        hideAuthFieldError(input);
      }
    });

    // Clear errors on input
    input.addEventListener('input', () => {
      if (input.classList.contains('error')) {
        hideAuthFieldError(input);
      }
    });
  });
}

// Password Visibility Toggle
function setupAuthPasswordToggles(formElement) {
  const toggles = formElement.querySelectorAll('.password-toggle');

  toggles.forEach(toggle => {
    toggle.addEventListener('click', () => {
      const input = toggle.closest('.input-container').querySelector('input');
      const isVisible = input.type === 'text';

      input.type = isVisible ? 'password' : 'text';
      toggle.querySelector('.eye-icon').textContent = isVisible ? '👁' : '🙈';
    });
  });
}

// Initialize Auth Form Validation
function initializeAuthFormValidation(formId) {
  const form = document.getElementById(formId);
  if (!form) return;

  setupAuthRealTimeValidation(form);
  setupAuthPasswordToggles(form);

  return {
    validate: () => validateAuthForm(form),
    clearErrors: () => clearAllAuthErrors(form),
    isValid: () => validateAuthForm(form).isValid
  };
}

// Export for use in other modules
window.AuthValidator = {
  validateField: validateAuthField,
  validateForm: validateAuthForm,
  initializeFormValidation: initializeAuthFormValidation,
  clearAllErrors: clearAllAuthErrors,
  checkPasswordStrength
};