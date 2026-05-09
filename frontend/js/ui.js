/**
 * UI.JS - UI/UX Utilities Module
 * Handles UI state management, animations, and interactions
 */

/**
 * Update progress bar and percentage
 */
function updateProgressBar(currentStep) {
  const totalSteps = 8;
  const percentage = (currentStep / totalSteps) * 100;
  const progressBar = document.getElementById('progressBar');
  const progressPercent = document.getElementById('progressPercent');

  if (progressBar) {
    progressBar.style.width = percentage + '%';
  }

  if (progressPercent) {
    progressPercent.textContent = Math.round(percentage) + '%';
  }
}

/**
 * Update step indicators
 */
function updateStepIndicators(currentStep, completedSteps) {
  document.querySelectorAll('.step-indicator').forEach(indicator => {
    const step = parseInt(indicator.dataset.step);
    indicator.classList.remove('active', 'completed');

    if (step === currentStep) {
      indicator.classList.add('active');
    } else if (completedSteps.has(step)) {
      indicator.classList.add('completed');
    }
  });
}

/**
 * Show specific form step
 */
function showFormStep(stepNumber) {
  const totalSteps = 8;

  // Validate step number
  if (stepNumber < 1 || stepNumber > totalSteps) {
    console.warn('Invalid step:', stepNumber);
    return;
  }

  // Hide all steps
  document.querySelectorAll('.form-step').forEach(step => {
    step.classList.remove('active');
  });

  // Show current step - use more specific selector
  const activeStep = document.querySelector(`.form-step[data-step="${stepNumber}"]`);
  if (activeStep) {
    activeStep.classList.add('active');
  } else {
    console.warn('Form step not found for step:', stepNumber);
  }

  // Update title and counter
  updateStepTitle(stepNumber);
  updateStepCounter(stepNumber);

  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Update step title
 */
function updateStepTitle(stepNumber) {
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

  const titleElem = document.getElementById('stepTitle');
  if (titleElem) {
    titleElem.textContent = titles[stepNumber] || 'Loan Application';
  }
}

/**
 * Update step counter display
 */
function updateStepCounter(stepNumber) {
  const counter = document.getElementById('currentStepNum');
  if (counter) {
    counter.textContent = stepNumber;
  }
}

/**
 * Enable/disable Next button
 */
function setNextButtonState(enabled) {
  const nextBtn = document.getElementById('nextBtn');
  if (nextBtn) {
    nextBtn.disabled = !enabled;
  }
}

/**
 * Update Next button state (alias for setNextButtonState)
 */
function updateNextButtonState(enabled) {
  setNextButtonState(enabled);
}

/**
 * Enable/disable Previous button
 */
function setPrevButtonState(enabled) {
  const prevBtn = document.getElementById('prevBtn');
  if (prevBtn) {
    prevBtn.disabled = !enabled;
  }
}

/**
 * Update Next button text
 */
function updateNextButtonText(stepNumber) {
  const nextBtn = document.getElementById('nextBtn');
  if (nextBtn) {
    if (stepNumber === 8) {
      nextBtn.textContent = 'Submit Application';
    } else {
      nextBtn.textContent = 'Continue';
    }
  }
}

/**
 * Populate form from data
 */
function populateForm(formData) {
  Object.entries(formData).forEach(([fieldName, value]) => {
    if (fieldName === 'currentStep') return;
    if (fieldName === 'signature') return; // Skip signature data (canvas)

    const field = document.querySelector(`[name="${fieldName}"]`);
    if (!field) return;

    // Skip file inputs - they cannot be set programmatically
    if (field.type === 'file') return;

    if (field.type === 'checkbox') {
      field.checked = value === true || value === 'true';
    } else if (field.type === 'radio') {
      const radio = document.querySelector(`input[name="${fieldName}"][value="${value}"]`);
      if (radio) radio.checked = true;
    } else {
      field.value = value || '';
    }
  });
}

/**
 * Get all form data from DOM
 */
function getFormDataFromDOM() {
  const form = document.getElementById('loanForm');
  const formData = {};

  const fields = form.querySelectorAll('input, select, textarea');
  fields.forEach(field => {
    if (!field.name) return;

    // Skip file inputs - store file count instead
    if (field.type === 'file') {
      formData[field.name] = field.files && field.files.length > 0 ? field.files[0].name : '';
      return;
    }

    if (field.type === 'checkbox') {
      formData[field.name] = field.checked;
    } else if (field.type === 'radio') {
      const checked = document.querySelector(`input[name="${field.name}"]:checked`);
      if (checked) {
        formData[field.name] = checked.value;
      }
    } else {
      formData[field.name] = field.value;
    }
  });

  return formData;
}

/**
 * Show/hide conditional sections based on employment type
 */
function updateEmploymentSections(employmentType) {
  const salariedSection = document.getElementById('salariedSection');
  const selfEmployedSection = document.getElementById('selfEmployedSection');

  if (salariedSection) {
    salariedSection.style.display = employmentType === 'Salaried' ? 'block' : 'none';
  }

  if (selfEmployedSection) {
    selfEmployedSection.style.display = ['Self-Employed', 'Freelancer'].includes(employmentType) ? 'block' : 'none';
  }
}

/**
 * Show/hide co-applicant fields
 */
function updateCoApplicantFields(enabled) {
  const coApplicantFields = document.getElementById('coApplicantFields');
  if (coApplicantFields) {
    coApplicantFields.style.display = enabled ? 'block' : 'none';
  }

  // Clear co-applicant fields if disabled
  if (!enabled) {
    document.querySelectorAll('[id^="coApplicant"]').forEach(field => {
      if (field.type === 'checkbox') {
        field.checked = false;
      } else {
        field.value = '';
      }
    });
  }
}

/**
 * Generate Review Page Content
 */
function generateReviewContent(formData) {
  // Loan Review
  const loanReview = document.getElementById('loanReview');
  if (loanReview) {
    loanReview.innerHTML = `
      <p><strong>Loan Type:</strong> ${formData.selectedLoanType || 'Not selected'}</p>
    `;
  }

  // Personal Info Review
  const personalReview = document.getElementById('personalReview');
  if (personalReview) {
    personalReview.innerHTML = `
      <p><strong>Full Name:</strong> ${formData.fullName || '-'}</p>
      <p><strong>Date of Birth:</strong> ${formData.dob || '-'}</p>
      <p><strong>Email:</strong> ${formData.email || '-'}</p>
      <p><strong>Mobile:</strong> ${formData.mobile || '-'}</p>
    `;
  }

  // KYC Review
  const kycReview = document.getElementById('kycReview');
  if (kycReview) {
    kycReview.innerHTML = `
      <p><strong>PAN:</strong> ${maskSensitiveData(formData.panNumber)}</p>
      <p><strong>Aadhaar:</strong> ${maskSensitiveData(formData.aadhaarNumber)}</p>
    `;
  }

  // Address Review
  const addressReview = document.getElementById('addressReview');
  if (addressReview) {
    addressReview.innerHTML = `
      <p><strong>PIN Code:</strong> ${formData.pincode || '-'}</p>
      <p><strong>City:</strong> ${formData.city || '-'}</p>
      <p><strong>State:</strong> ${formData.state || '-'}</p>
      <p><strong>Address:</strong> ${formData.address || '-'}</p>
    `;
  }

  // Employment Review
  const employmentReview = document.getElementById('employmentReview');
  if (employmentReview) {
    let employmentHTML = `<p><strong>Employment Type:</strong> ${formData.employmentType || '-'}</p>`;

    if (formData.employmentType === 'Salaried') {
      employmentHTML += `
        <p><strong>Company:</strong> ${formData.companyName || '-'}</p>
        <p><strong>Monthly Salary:</strong> ₹${formatNumber(formData.monthlySalary) || '-'}</p>
      `;
    } else if (['Self-Employed', 'Freelancer'].includes(formData.employmentType)) {
      employmentHTML += `
        <p><strong>Business Name:</strong> ${formData.businessName || '-'}</p>
        <p><strong>Annual Income:</strong> ₹${formatNumber(formData.annualIncome) || '-'}</p>
      `;
    }

    employmentReview.innerHTML = employmentHTML;
  }

  // Co-Applicant Review
  const coApplicantReview = document.getElementById('coApplicantReview');
  const coApplicantContent = document.getElementById('coApplicantContent');

  if (formData.coApplicantEnabled && coApplicantReview && coApplicantContent) {
    coApplicantReview.style.display = 'block';
    coApplicantContent.innerHTML = `
      <p><strong>Name:</strong> ${formData.coApplicantName || '-'}</p>
      <p><strong>Relationship:</strong> ${formData.coApplicantRelationship || '-'}</p>
      <p><strong>Monthly Income:</strong> ₹${formatNumber(formData.coApplicantIncome) || '-'}</p>
    `;
  } else if (coApplicantReview) {
    coApplicantReview.style.display = 'none';
  }
}

/**
 * Show success screen
 */
function showSuccessScreen(applicationId) {
  const formWrapper = document.getElementById('formWrapper');
  const successScreen = document.getElementById('successScreen');
  const applicationIdElem = document.getElementById('applicationId');
  const submittedTime = document.getElementById('submittedTime');

  if (formWrapper) formWrapper.style.display = 'none';
  if (successScreen) successScreen.style.display = 'flex';
  
  if (applicationIdElem) {
    applicationIdElem.textContent = applicationId;
  }

  if (submittedTime) {
    submittedTime.textContent = new Date().toLocaleString();
  }
}

/**
 * Mask sensitive data for display
 */
function maskSensitiveData(data) {
  if (!data) return '-';
  const str = String(data);
  if (str.length <= 4) return str;
  
  const visible = str.slice(-4);
  const masked = '*'.repeat(str.length - 4);
  return masked + visible;
}

/**
 * Format number as Indian currency
 */
function formatNumber(num) {
  if (!num) return '';
  return parseInt(num).toLocaleString('en-IN');
}

/**
 * Generate random Application ID
 */
function generateApplicationId() {
  const prefix = 'LS';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substr(2, 5).toUpperCase();
  return `${prefix}${timestamp}${random}`;
}

/**
 * Handle file preview
 */
function handleFilePreview(inputId, previewId) {
  const input = document.getElementById(inputId);
  const preview = document.getElementById(previewId);

  if (input && preview) {
    input.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = function(event) {
          preview.innerHTML = `<img src="${event.target.result}" alt="Preview">`;
        };
        reader.readAsDataURL(file);
      }
    });
  }
}

/**
 * Update autosave status
 */
function updateAutosaveStatus(status) {
  const statusElem = document.getElementById('autosaveStatus');
  if (statusElem) {
    statusElem.textContent = status;
    statusElem.className = 'autosave-status';

    if (status.includes('Saving')) {
      statusElem.classList.add('saving');
    } else if (status.includes('Saved')) {
      statusElem.classList.add('saved');
    }
  }
}

/**
 * Theme management
 */
function initThemeToggle() {
  const themeToggle = document.getElementById('themeToggle');
  const theme = loadTheme();

  if (theme === 'dark') {
    document.body.classList.add('dark-mode');
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      const isDark = document.body.classList.contains('dark-mode');
      saveTheme(isDark ? 'dark' : 'light');
    });
  }
}

/**
 * Export module
 */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    updateProgressBar,
    updateStepIndicators,
    showFormStep,
    updateStepTitle,
    updateStepCounter,
    setNextButtonState,
    setPrevButtonState,
    updateNextButtonText,
    populateForm,
    getFormDataFromDOM,
    updateEmploymentSections,
    updateCoApplicantFields,
    generateReviewContent,
    showSuccessScreen,
    maskSensitiveData,
    formatNumber,
    generateApplicationId,
    handleFilePreview,
    updateAutosaveStatus,
    initThemeToggle
  };
}
