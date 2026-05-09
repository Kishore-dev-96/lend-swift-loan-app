/**
 * NAVIGATION.JS - Step Navigation Engine
 * Handles step transitions, validation, and navigation rules
 */

/**
 * Navigate to a specific step
 * @param {number} targetStep - Step number to navigate to (1-8)
 * @param {Object} formData - Current form data
 * @param {Function} updateUICallback - Callback to update UI
 * @returns {boolean} - True if navigation successful
 */
function goToStep(targetStep, formData, updateUICallback) {
  // Boundary check
  if (targetStep < 1 || targetStep > 8) {
    console.warn('Invalid step number:', targetStep);
    return false;
  }

  // Check if can go back
  if (targetStep < formData.currentStep) {
    updateUICallback(targetStep);
    return true;
  }

  // Check if can go forward - validate previous steps
  const validation = validatePreviousSteps(formData.currentStep, formData);
  if (!validation.isValid) {
    showToast(`Please complete Step ${validation.firstIncompleteStep} first`, 'error');
    return false;
  }

  // Validate current step before moving forward
  const currentValidation = validateStep(formData.currentStep, formData);
  if (!currentValidation.isValid) {
    displayErrors(currentValidation.errors);
    showToast('Please fix errors before proceeding', 'error');
    return false;
  }

  updateUICallback(targetStep);
  return true;
}

/**
 * Go to next step
 */
function nextStep(formData, updateUICallback) {
  const nextStepNumber = Math.min(formData.currentStep + 1, 8);
  return goToStep(nextStepNumber, formData, updateUICallback);
}

/**
 * Go to previous step
 */
function prevStep(formData, updateUICallback) {
  if (formData.currentStep > 1) {
    const prevStepNumber = formData.currentStep - 1;
    goToStep(prevStepNumber, formData, updateUICallback);
    return true;
  }
  return false;
}

/**
 * Get step title
 */
function getStepTitle(stepNumber) {
  const titles = {
    1: 'Loan Type Selection',
    2: 'Personal Information',
    3: 'KYC Verification',
    4: 'Address Details',
    5: 'Employment & Income',
    6: 'Co-Applicant',
    7: 'Documents & Signature',
    8: 'Review Your Application'
  };

  return titles[stepNumber] || 'Loan Application';
}

/**
 * Check if step is locked (cannot access)
 */
function isStepLocked(stepNumber, formData) {
  // First step is always accessible
  if (stepNumber === 1) return false;

  // Check if all previous steps are valid
  const validation = validatePreviousSteps(stepNumber, formData);
  return !validation.isValid;
}

/**
 * Get first incomplete step
 */
function getFirstIncompleteStep(formData) {
  for (let step = 1; step <= 8; step++) {
    const validation = validateStep(step, formData);
    if (!validation.isValid) {
      return step;
    }
  }
  return 8; // All steps complete
}

/**
 * Check if step is completed
 */
function isStepCompleted(stepNumber, formData) {
  const validation = validateStep(stepNumber, formData);
  return validation.isValid;
}

/**
 * Display validation errors on the form
 */
function displayErrors(errors) {
  // Clear previous errors
  document.querySelectorAll('.error-message.show').forEach(elem => {
    elem.classList.remove('show');
  });

  document.querySelectorAll('.form-group.error').forEach(elem => {
    elem.classList.remove('error');
  });

  // Display new errors
  Object.entries(errors).forEach(([fieldName, message]) => {
    const field = document.querySelector(`[name="${fieldName}"]`);
    if (field) {
      // Add error class to group
      const group = field.closest('.form-group');
      if (group) {
        group.classList.add('error');
      }

      // Show error message
      const errorElem = document.querySelector(`[data-error="${fieldName}"]`);
      if (errorElem) {
        errorElem.textContent = message;
        errorElem.classList.add('show');
      }
    }
  });

  // Scroll to first error
  const firstErrorGroup = document.querySelector('.form-group.error');
  if (firstErrorGroup) {
    firstErrorGroup.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

/**
 * Clear all error messages
 */
function clearErrors() {
  document.querySelectorAll('.error-message.show').forEach(elem => {
    elem.classList.remove('show');
    elem.textContent = '';
  });

  document.querySelectorAll('.form-group.error').forEach(elem => {
    elem.classList.remove('error');
  });
}

/**
 * Show toast notification
 */
function showToast(message, type = 'info') {
  const toastContainer = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  toast.innerHTML = `
    <span>${message}</span>
    <button class="toast-close" aria-label="Close notification">×</button>
  `;

  toastContainer.appendChild(toast);

  // Auto remove after 3 seconds
  const timer = setTimeout(() => {
    toast.style.animation = 'slideOutRight 0.3s ease-out';
    setTimeout(() => toast.remove(), 300);
  }, 3000);

  // Close button handler
  toast.querySelector('.toast-close').addEventListener('click', () => {
    clearTimeout(timer);
    toast.remove();
  });
}

/**
 * Show loading spinner
 */
function showSpinner(message = 'Processing...') {
  const overlay = document.getElementById('spinnerOverlay');
  const text = document.getElementById('spinnerText');
  if (overlay) {
    text.textContent = message;
    overlay.style.display = 'flex';
  }
}

/**
 * Hide loading spinner
 */
function hideSpinner() {
  const overlay = document.getElementById('spinnerOverlay');
  if (overlay) {
    overlay.style.display = 'none';
  }
}

/**
 * Simulate async operations (KYC, PIN lookup, etc.)
 */
async function simulateAsyncOperation(duration = 2000) {
  return new Promise(resolve => {
    setTimeout(resolve, duration);
  });
}

/**
 * Handle PAN verification (simulated)
 */
async function verifyPAN(panNumber) {
  showSpinner('Verifying PAN...');
  
  try {
    await simulateAsyncOperation(1500);

    // Simulate verification logic
    if (panNumber && /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(panNumber)) {
      hideSpinner();
      return {
        isValid: true,
        message: '✓ PAN verified successfully'
      };
    } else {
      hideSpinner();
      return {
        isValid: false,
        message: '✗ Invalid PAN format'
      };
    }
  } catch (error) {
    hideSpinner();
    return {
      isValid: false,
      message: '✗ Verification failed'
    };
  }
}

/**
 * Handle Aadhaar verification (simulated)
 */
async function verifyAadhaar(aadhaarNumber) {
  showSpinner('Verifying Aadhaar...');
  
  try {
    await simulateAsyncOperation(1500);

    if (aadhaarNumber && /^[0-9]{12}$/.test(aadhaarNumber)) {
      hideSpinner();
      return {
        isValid: true,
        message: '✓ Aadhaar verified successfully'
      };
    } else {
      hideSpinner();
      return {
        isValid: false,
        message: '✗ Invalid Aadhaar format'
      };
    }
  } catch (error) {
    hideSpinner();
    return {
      isValid: false,
      message: '✗ Verification failed'
    };
  }
}

/**
 * Handle PIN code lookup
 */
async function lookupPincode(pincode) {
  showSpinner('Looking up location...');
  
  const pincodeMap = {
    '110001': { city: 'New Delhi', state: 'Delhi' },
    '400001': { city: 'Mumbai', state: 'Maharashtra' },
    '560001': { city: 'Bengaluru', state: 'Karnataka' },
    '600001': { city: 'Chennai', state: 'Tamil Nadu' },
    '700001': { city: 'Kolkata', state: 'West Bengal' },
    '500001': { city: 'Hyderabad', state: 'Telangana' },
    '380001': { city: 'Ahmedabad', state: 'Gujarat' },
    '302001': { city: 'Jaipur', state: 'Rajasthan' }
  };

  try {
    await simulateAsyncOperation(1000);
    hideSpinner();

    const location = pincodeMap[pincode];
    if (location) {
      return {
        found: true,
        city: location.city,
        state: location.state,
        message: `Found: ${location.city}, ${location.state}`
      };
    } else {
      return {
        found: false,
        message: 'PIN not found in demo database. Please enter manually.'
      };
    }
  } catch (error) {
    hideSpinner();
    return {
      found: false,
      message: 'Lookup failed'
    };
  }
}

/**
 * Export module
 */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    goToStep,
    nextStep,
    prevStep,
    getStepTitle,
    isStepLocked,
    getFirstIncompleteStep,
    isStepCompleted,
    displayErrors,
    clearErrors,
    showToast,
    showSpinner,
    hideSpinner,
    simulateAsyncOperation,
    verifyPAN,
    verifyAadhaar,
    lookupPincode
  };
}
