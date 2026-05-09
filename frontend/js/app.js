/**
 * APP.JS - Main Application Controller
 * Orchestrates all modules and manages the application flow
 */

let appState = {
  formData: {},
  completedSteps: new Set(),
  isAutoSaving: false
};

/**
 * Initialize the application
 */
function initializeApp() {
  try {
    console.log('Initializing LendSwift Loan Application...');

    // Load saved data
    appState.formData = loadFormData();
    
    // Initialize UI
    initThemeToggle();
    populateForm(appState.formData);

    // Set up event listeners
    setupEventListeners();

    // Load theme
    const savedTheme = loadTheme();
    if (savedTheme === 'dark') {
      document.body.classList.add('dark-mode');
    }

    // Show initial step
    const startStep = appState.formData.currentStep || 1;
    goToStep(startStep, appState.formData, updateUIState);

    // Mark completed steps
    updateCompletedSteps();

    console.log('Application initialized successfully');
  } catch (error) {
    console.error('Error initializing app:', error);
    showToast('Error initializing application', 'error');
  }
}

/**
 * Update application state and UI
 */
function updateUIState(stepNumber) {
  appState.formData.currentStep = stepNumber;

  // Update UI elements
  updateProgressBar(stepNumber);
  updateStepIndicators(stepNumber, appState.completedSteps);
  showFormStep(stepNumber);
  updateNextButtonText(stepNumber);

  // Update button states
  setPrevButtonState(stepNumber > 1);
  
  // Clear errors
  clearErrors();

  // Save current step
  saveCurrentStep(stepNumber);
}

/**
 * Setup event listeners for the entire application
 */
function setupEventListeners() {
  // Navigation buttons
  const nextBtn = document.getElementById('nextBtn');
  const prevBtn = document.getElementById('prevBtn');
  const clearBtn = document.getElementById('clearAppBtn');

  if (nextBtn) {
    nextBtn.addEventListener('click', handleNextStep);
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', handlePrevStep);
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', handleClearApp);
  }

  // Step indicators
  document.querySelectorAll('.step-indicator').forEach(indicator => {
    indicator.addEventListener('click', handleStepClick);
  });

  // Form inputs - Real-time auto-save
  const form = document.getElementById('loanForm');
  if (form) {
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      input.addEventListener('change', handleFormChange);
      input.addEventListener('input', handleFormInput);
    });
  }

  // Employment type conditional display
  const employmentTypeSelect = document.getElementById('employmentType');
  if (employmentTypeSelect) {
    employmentTypeSelect.addEventListener('change', function() {
      updateEmploymentSections(this.value);
      handleFormChange();
    });
  }

  // Co-applicant checkbox
  const coApplicantCheckbox = document.getElementById('coApplicantEnabled');
  if (coApplicantCheckbox) {
    coApplicantCheckbox.addEventListener('change', function() {
      updateCoApplicantFields(this.checked);
      handleFormChange();
    });
  }

  // PAN verification
  const panVerifyBtn = document.querySelector('[data-verify="pan"]');
  if (panVerifyBtn) {
    panVerifyBtn.addEventListener('click', handlePANVerification);
  }

  // Aadhaar verification
  const aadhaarVerifyBtn = document.querySelector('[data-verify="aadhaar"]');
  if (aadhaarVerifyBtn) {
    aadhaarVerifyBtn.addEventListener('click', handleAadhaarVerification);
  }

  // PIN code input
  const pincodeInput = document.getElementById('pincode');
  if (pincodeInput) {
    pincodeInput.addEventListener('blur', handlePincodeChange);
  }

  // File uploads with preview
  handleFilePreview('panFile', 'panFilePreview');
  handleFilePreview('aadhaarFile', 'aadhaarFilePreview');

  // Signature canvas
  setupSignatureCanvas();

  // Edit buttons in review step
  document.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', function() {
      const step = parseInt(this.dataset.editStep);
      goToStep(step, appState.formData, updateUIState);
    });
  });

  // Form submission
  const form_elem = document.getElementById('loanForm');
  if (form_elem) {
    form_elem.addEventListener('submit', handleFormSubmit);
  }
}

/**
 * Handle next step
 */
function handleNextStep() {
  // Get current form data
  appState.formData = {
    ...appState.formData,
    ...getFormDataFromDOM()
  };

  // If on last step, submit form
  if (appState.formData.currentStep === 8) {
    handleFormSubmit(new Event('submit'));
    return;
  }

  // Try to go to next step
  const success = nextStep(appState.formData, updateUIState);
  
  if (success) {
    updateCompletedSteps();
  }
}

/**
 * Handle previous step
 */
function handlePrevStep() {
  appState.formData = {
    ...appState.formData,
    ...getFormDataFromDOM()
  };

  prevStep(appState.formData, updateUIState);
}

/**
 * Handle step indicator click
 */
function handleStepClick(e) {
  const step = parseInt(e.target.dataset.step);
  
  appState.formData = {
    ...appState.formData,
    ...getFormDataFromDOM()
  };

  // Check if step is locked
  if (isStepLocked(step, appState.formData)) {
    const firstIncomplete = getFirstIncompleteStep(appState.formData);
    showToast(`Please complete Step ${firstIncomplete} first`, 'error');
    return;
  }

  goToStep(step, appState.formData, updateUIState);
}

/**
 * Handle form input/change
 */
function handleFormInput(e) {
  const { name, value } = e.target;
  appState.formData[name] = value;

  // Real-time validation
  const field = e.target;
  const validation = validateStep(appState.formData.currentStep, appState.formData);

  if (validation.errors[name]) {
    const group = field.closest('.form-group');
    if (group) group.classList.add('error');

    const errorElem = document.querySelector(`[data-error="${name}"]`);
    if (errorElem) {
      errorElem.textContent = validation.errors[name];
      errorElem.classList.add('show');
    }
  } else {
    const group = field.closest('.form-group');
    if (group) group.classList.remove('error');

    const errorElem = document.querySelector(`[data-error="${name}"]`);
    if (errorElem) {
      errorElem.classList.remove('show');
      errorElem.textContent = '';
    }
  }

  // Update next button state - enable if valid
  setNextButtonState(validation.isValid);
}

/**
 * Handle form change - Auto save
 */
function handleFormChange(e) {
  appState.formData = {
    ...appState.formData,
    ...getFormDataFromDOM()
  };

  // Auto-save
  saveFormData(appState.formData);
  updateAutosaveStatus('Saved');

  // Update button state based on current step validation
  const currentStep = appState.formData.currentStep || 1;
  const validation = validateStep(currentStep, appState.formData);
  setNextButtonState(validation.isValid);

  // Reset autosave status after 2 seconds
  setTimeout(() => {
    updateAutosaveStatus('');
  }, 2000);
}

/**
 * Handle PAN verification
 */
async function handlePANVerification(e) {
  e.preventDefault();

  const panNumber = document.getElementById('panNumber').value;
  if (!panNumber) {
    showToast('Please enter PAN number first', 'error');
    return;
  }

  const result = await verifyPAN(panNumber);
  const statusElem = document.getElementById('panStatus');

  if (result.isValid) {
    statusElem.className = 'verify-status success';
    appState.formData.panVerified = true;
  } else {
    statusElem.className = 'verify-status error';
    appState.formData.panVerified = false;
  }

  statusElem.textContent = result.message;
  handleFormChange();
}

/**
 * Handle Aadhaar verification
 */
async function handleAadhaarVerification(e) {
  e.preventDefault();

  const aadhaarNumber = document.getElementById('aadhaarNumber').value;
  if (!aadhaarNumber) {
    showToast('Please enter Aadhaar number first', 'error');
    return;
  }

  const result = await verifyAadhaar(aadhaarNumber);
  const statusElem = document.getElementById('aadhaarStatus');

  if (result.isValid) {
    statusElem.className = 'verify-status success';
    appState.formData.aadhaarVerified = true;
  } else {
    statusElem.className = 'verify-status error';
    appState.formData.aadhaarVerified = false;
  }

  statusElem.textContent = result.message;
  handleFormChange();
}

/**
 * Handle PIN code blur
 */
async function handlePincodeChange(e) {
  const pincode = e.target.value;
  if (pincode.length === 6) {
    const result = await lookupPincode(pincode);
    const hintElem = document.getElementById('pincodeHint');

    if (result.found) {
      document.getElementById('city').value = result.city;
      document.getElementById('state').value = result.state;
      hintElem.textContent = result.message;
      hintElem.style.color = 'var(--green-primary)';
    } else {
      hintElem.textContent = result.message;
      hintElem.style.color = 'var(--text-secondary)';
    }

    handleFormChange();
  }
}

/**
 * Setup signature canvas
 */
function setupSignatureCanvas() {
  const canvas = document.getElementById('signatureCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let isDrawing = false;
  let lastX = 0;
  let lastY = 0;

  // Set canvas background to white for visibility
  canvas.style.backgroundColor = '#ffffff';
  
  // Adjust canvas size
  canvas.width = canvas.offsetWidth;
  canvas.height = 150;
  
  // Fill canvas with white background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Drawing functions
  const startDrawing = (e) => {
    isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    lastX = e.clientX - rect.left;
    lastY = e.clientY - rect.top;
  };

  const draw = (e) => {
    if (!isDrawing) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Use actual color values instead of CSS variables
    ctx.strokeStyle = '#000000';  // Black color for drawing
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();

    lastX = x;
    lastY = y;
  };

  const stopDrawing = () => {
    isDrawing = false;
  };

  // Mouse events
  canvas.addEventListener('mousedown', startDrawing);
  canvas.addEventListener('mousemove', draw);
  canvas.addEventListener('mouseup', stopDrawing);
  canvas.addEventListener('mouseout', stopDrawing);

  // Touch events for mobile
  canvas.addEventListener('touchstart', (e) => {
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousedown', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
  });

  canvas.addEventListener('touchmove', (e) => {
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent('mousemove', {
      clientX: touch.clientX,
      clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
  });

  canvas.addEventListener('touchend', (e) => {
    const mouseEvent = new MouseEvent('mouseup', {});
    canvas.dispatchEvent(mouseEvent);
  });

  // Clear button
  const clearBtn = document.getElementById('clearSignature');
  if (clearBtn) {
    clearBtn.addEventListener('click', (e) => {
      e.preventDefault();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      appState.formData.signature = '';
      setNextButtonState(false);
      showToast('Signature cleared', 'info');
    });
  }

  // Save button
  const saveBtn = document.getElementById('saveSignature');
  if (saveBtn) {
    saveBtn.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Check if anything was drawn on canvas
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      let hasDrawing = false;
      
      // Check if there are non-white pixels
      for (let i = 0; i < data.length; i += 4) {
        // Check if pixel is not white (r, g, b all 255)
        if (data[i] < 255 || data[i + 1] < 255 || data[i + 2] < 255) {
          hasDrawing = true;
          break;
        }
      }
      
      if (!hasDrawing) {
        showToast('Please draw your signature before saving', 'warning');
        return;
      }
      
      appState.formData.signature = canvas.toDataURL('image/png');
      showToast('Signature saved successfully', 'success');
      handleFormChange();
      
      // Enable continue button if signature is now valid
      const validation = validateStep(7, appState.formData);
      setNextButtonState(validation.isValid);
    });
  }
}

/**
 * Handle form submission
 */
function handleFormSubmit(e) {
  e.preventDefault();

  // Get final form data
  appState.formData = {
    ...appState.formData,
    ...getFormDataFromDOM()
  };

  // Validate final step
  const validation = validateStep(8, appState.formData);
  if (!validation.isValid) {
    displayErrors(validation.errors);
    showToast('Please fill all required fields', 'error');
    return;
  }

  // Show success screen
  showSpinner('Submitting application...');

  // Simulate API call
  setTimeout(() => {
    hideSpinner();

    const applicationId = generateApplicationId();
    
    // Clear data after success
    localStorage.removeItem('loanAppData_v1');

    // Show success screen
    showSuccessScreen(applicationId);

    console.log('Application submitted:', {
      applicationId,
      formData: appState.formData,
      timestamp: new Date().toISOString()
    });
  }, 2000);
}

/**
 * Handle clear application
 */
function handleClearApp() {
  if (clearAllData()) {
    appState.formData = { ...defaultFormData };
    appState.completedSteps.clear();
    
    // Reset UI
    const form = document.getElementById('loanForm');
    if (form) form.reset();

    updateUIState(1);
    showToast('Application cleared', 'success');
  }
}

/**
 * Update completed steps based on validation
 */
function updateCompletedSteps() {
  appState.completedSteps.clear();

  for (let step = 1; step <= 8; step++) {
    const validation = validateStep(step, appState.formData);
    if (validation.isValid) {
      appState.completedSteps.add(step);
    }
  }

  updateStepIndicators(appState.formData.currentStep, appState.completedSteps);
}

/**
 * Auto-save periodically
 */
function setupAutoSave() {
  setInterval(() => {
    if (appState.formData.currentStep && appState.formData.currentStep > 0) {
      saveFormData(appState.formData);
    }
  }, 30000); // Save every 30 seconds
}

/**
 * Initialize on DOM ready
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// Setup periodic auto-save
setupAutoSave();

console.log('LendSwift Loan Application loaded successfully');
