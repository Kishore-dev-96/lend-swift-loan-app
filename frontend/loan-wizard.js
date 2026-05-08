/**
 * LendSwift Loan Application Wizard
 * Multi-step form with localStorage auto-save, validation, and eligibility scoring
 */

// =====================================================
// GLOBAL STATE & CONFIGURATION
// =====================================================

const STORAGE_KEY = 'loanAppData';
const AUTOSAVE_INTERVAL = 30000; // 30 seconds
const PIN_DATABASE = {
  '560001': { city: 'Bengaluru', state: 'Karnataka' },
  '110001': { city: 'New Delhi', state: 'Delhi' },
  '400001': { city: 'Mumbai', state: 'Maharashtra' },
  '600001': { city: 'Chennai', state: 'Tamil Nadu' },
  '700001': { city: 'Kolkata', state: 'West Bengal' },
  '500001': { city: 'Hyderabad', state: 'Telangana' },
};

let formData = {
  loanType: '',
  fullName: '',
  dob: '',
  age: '',
  email: '',
  mobile: '',
  pan: '',
  aadhaar: '',
  panVerified: false,
  aadhaarVerified: false,
  pinCode: '',
  city: '',
  state: '',
  address: '',
  employmentType: '',
  companyName: '',
  monthlySalary: '',
  businessName: '',
  businessNameOwner: '',
  annualIncome: '',
  businessIncome: '',
  hasCoApplicant: false,
  coApplicantName: '',
  coApplicantRelationship: '',
  coApplicantIncome: '',
  uploadedFiles: [],
  signatureData: '',
  consentTerms: false,
  consentData: false,
};

let currentStep = 1;
const totalSteps = 8;
let isDirty = false;
let autosaveTimer = null;
let signatureCanvas = null;
let signatureContext = null;
let isDrawing = false;

// =====================================================
// INITIALIZATION
// =====================================================

document.addEventListener('DOMContentLoaded', () => {
  initializeApp();
});

function initializeApp() {
  loadFormData();
  setupEventListeners();
  setupThemeToggle();
  setupSignatureCanvas();
  setupFileUpload();
  updateUI();
  startAutosave();
}

// =====================================================
// EVENT LISTENERS
// =====================================================

function setupEventListeners() {
  // Form submission
  document.getElementById('loanForm').addEventListener('submit', (e) => {
    e.preventDefault();
    handleFormSubmit();
  });

  // Navigation buttons
  document.getElementById('nextBtn').addEventListener('click', handleNextStep);
  document.getElementById('prevBtn').addEventListener('click', handlePrevStep);

  // Loan type selection
  document.querySelectorAll('input[name="loanType"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      formData.loanType = e.target.value;
      isDirty = true;
    });
  });

  // Employment type
  document.getElementById('employmentType').addEventListener('change', (e) => {
    formData.employmentType = e.target.value;
    updateEmploymentFields();
    isDirty = true;
  });

  // Co-applicant checkbox
  document.getElementById('hasCoApplicant').addEventListener('change', (e) => {
    formData.hasCoApplicant = e.target.checked;
    document.getElementById('coApplicantFields').style.display = e.target.checked ? 'block' : 'none';
    isDirty = true;
  });

  // Personal info fields
  document.getElementById('fullName').addEventListener('input', (e) => {
    formData.fullName = e.target.value;
    isDirty = true;
  });

  document.getElementById('email').addEventListener('input', (e) => {
    formData.email = e.target.value;
    isDirty = true;
  });

  document.getElementById('mobile').addEventListener('input', (e) => {
    formData.mobile = e.target.value.replace(/\D/g, '').slice(0, 10);
    e.target.value = formData.mobile;
    isDirty = true;
  });

  document.getElementById('dob').addEventListener('change', (e) => {
    formData.dob = e.target.value;
    updateAge();
    isDirty = true;
  });

  // KYC Verification
  document.getElementById('pan').addEventListener('input', (e) => {
    formData.pan = e.target.value.toUpperCase();
    e.target.value = formData.pan;
    isDirty = true;
  });

  document.getElementById('aadhaar').addEventListener('input', (e) => {
    formData.aadhaar = e.target.value.replace(/\D/g, '');
    e.target.value = formData.aadhaar;
    isDirty = true;
  });

  document.getElementById('verifyKycBtn').addEventListener('click', simulateKycVerification);

  // Address fields
  document.getElementById('pinCode').addEventListener('change', (e) => {
    formData.pinCode = e.target.value;
    autofillAddress();
    isDirty = true;
  });

  document.getElementById('address').addEventListener('input', (e) => {
    formData.address = e.target.value;
    isDirty = true;
  });

  // Employment & Income fields
  document.getElementById('companyName').addEventListener('input', (e) => {
    formData.companyName = e.target.value;
    isDirty = true;
  });

  document.getElementById('monthlySalary').addEventListener('input', (e) => {
    formData.monthlySalary = e.target.value;
    isDirty = true;
  });

  document.getElementById('businessName').addEventListener('input', (e) => {
    formData.businessName = e.target.value;
    isDirty = true;
  });

  document.getElementById('annualIncome').addEventListener('input', (e) => {
    formData.annualIncome = e.target.value;
    isDirty = true;
  });

  document.getElementById('businessNameOwner').addEventListener('input', (e) => {
    formData.businessNameOwner = e.target.value;
    isDirty = true;
  });

  document.getElementById('businessIncome').addEventListener('input', (e) => {
    formData.businessIncome = e.target.value;
    isDirty = true;
  });

  // Co-applicant fields
  document.getElementById('coApplicantName').addEventListener('input', (e) => {
    formData.coApplicantName = e.target.value;
    isDirty = true;
  });

  document.getElementById('coApplicantRelationship').addEventListener('change', (e) => {
    formData.coApplicantRelationship = e.target.value;
    isDirty = true;
  });

  document.getElementById('coApplicantIncome').addEventListener('input', (e) => {
    formData.coApplicantIncome = e.target.value;
    isDirty = true;
  });

  // Consent checkboxes
  document.getElementById('consentTerms').addEventListener('change', (e) => {
    formData.consentTerms = e.target.checked;
    isDirty = true;
  });

  document.getElementById('consentData').addEventListener('change', (e) => {
    formData.consentData = e.target.checked;
    isDirty = true;
  });

  // Success modal
  document.getElementById('closeModalBtn').addEventListener('click', () => {
    window.location.href = 'index.html';
  });

  // Clear Signature
  document.getElementById('clearSignatureBtn').addEventListener('click', clearSignature);
  document.getElementById('saveSignatureBtn').addEventListener('click', saveSignature);
}

// =====================================================
// STEP NAVIGATION
// =====================================================

function handleNextStep() {
  if (!validateCurrentStep()) {
    return;
  }

  // Special logic: Show co-applicant step only for loans > 5L
  if (currentStep === 5 && formData.loanType === 'Personal') {
    const income = parseFloat(formData.monthlySalary || 0);
    if (income < 50000) {
      currentStep = 7; // Skip co-applicant step
    } else {
      currentStep = 6;
    }
  } else {
    currentStep++;
  }

  // Skip co-applicant step if not needed
  if (currentStep === 6 && document.getElementById('coApplicantStep').style.display === 'none') {
    currentStep = 7;
  }

  updateUI();
  window.scrollTo(0, 0);
}

function handlePrevStep() {
  currentStep--;
  updateUI();
  window.scrollTo(0, 0);
}

// =====================================================
// VALIDATION
// =====================================================

function validateCurrentStep() {
  clearErrors();

  switch (currentStep) {
    case 1:
      return validateStep1();
    case 2:
      return validateStep2();
    case 3:
      return validateStep3();
    case 4:
      return validateStep4();
    case 5:
      return validateStep5();
    case 6:
      return validateStep6();
    case 7:
      return validateStep7();
    case 8:
      return validateStep8();
    default:
      return true;
  }
}

function validateStep1() {
  if (!formData.loanType) {
    showError('Please select a loan type');
    return false;
  }
  return true;
}

function validateStep2() {
  let isValid = true;

  if (!formData.fullName || formData.fullName.trim().length < 3) {
    showError('fullNameError', 'Please enter a valid full name');
    isValid = false;
  }

  if (!formData.dob) {
    showError('dobError', 'Please select your date of birth');
    isValid = false;
  } else {
    const age = calculateAge(formData.dob);
    if (age < 18) {
      showError('dobError', 'You must be at least 18 years old');
      isValid = false;
    }
  }

  if (!validateEmail(formData.email)) {
    showError('emailError', 'Please enter a valid email address');
    isValid = false;
  }

  if (!validateMobile(formData.mobile)) {
    showError('mobileError', 'Please enter a valid 10-digit mobile number');
    isValid = false;
  }

  return isValid;
}

function validateStep3() {
  let isValid = true;

  if (!validatePAN(formData.pan)) {
    showError('panError', 'Please enter a valid PAN number (AAAAA9999A)');
    isValid = false;
  }

  if (!validateAadhaar(formData.aadhaar)) {
    showError('aadhaarError', 'Please enter a valid 12-digit Aadhaar number');
    isValid = false;
  }

  if (!formData.panVerified || !formData.aadhaarVerified) {
    showError('Please verify your KYC documents');
    isValid = false;
  }

  return isValid;
}

function validateStep4() {
  let isValid = true;

  if (!formData.pinCode || formData.pinCode.length !== 6) {
    showError('pinCodeError', 'Please enter a valid 6-digit PIN code');
    isValid = false;
  }

  if (!formData.city) {
    showError('cityError', 'City is required');
    isValid = false;
  }

  if (!formData.state) {
    showError('stateError', 'State is required');
    isValid = false;
  }

  if (!formData.address || formData.address.trim().length < 10) {
    showError('addressError', 'Please enter a valid address');
    isValid = false;
  }

  return isValid;
}

function validateStep5() {
  let isValid = true;

  if (!formData.employmentType) {
    showError('employmentTypeError', 'Please select your employment type');
    isValid = false;
  }

  if (formData.employmentType === 'Salaried') {
    if (!formData.companyName) {
      showError('Company name is required');
      isValid = false;
    }
    if (!formData.monthlySalary || parseFloat(formData.monthlySalary) <= 0) {
      showError('monthlySalaryError', 'Please enter a valid salary');
      isValid = false;
    }
  } else if (formData.employmentType === 'Self-Employed') {
    if (!formData.businessName) {
      showError('Business name is required');
      isValid = false;
    }
    if (!formData.annualIncome || parseFloat(formData.annualIncome) <= 0) {
      showError('annualIncomeError', 'Please enter a valid annual income');
      isValid = false;
    }
  } else if (formData.employmentType === 'Business') {
    if (!formData.businessNameOwner) {
      showError('Business name is required');
      isValid = false;
    }
    if (!formData.businessIncome || parseFloat(formData.businessIncome) <= 0) {
      showError('businessIncomeError', 'Please enter a valid business income');
      isValid = false;
    }
  }

  return isValid;
}

function validateStep6() {
  if (formData.hasCoApplicant) {
    if (!formData.coApplicantName) {
      showError('Co-applicant name is required');
      return false;
    }
    if (!formData.coApplicantRelationship) {
      showError('Please select co-applicant relationship');
      return false;
    }
  }
  return true;
}

function validateStep7() {
  if (!formData.signatureData) {
    showError('Please save your e-signature');
    return false;
  }
  return true;
}

function validateStep8() {
  let isValid = true;

  if (!formData.consentTerms) {
    showError('consentError', 'You must accept the terms and conditions');
    isValid = false;
  }

  if (!formData.consentData) {
    showError('consentError', 'You must consent to data sharing');
    isValid = false;
  }

  return isValid;
}

// =====================================================
// HELPER FUNCTIONS: VALIDATION
// =====================================================

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateMobile(mobile) {
  return /^\d{10}$/.test(mobile) && /^[6-9]/.test(mobile);
}

function validatePAN(pan) {
  return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan);
}

function validateAadhaar(aadhaar) {
  return /^\d{12}$/.test(aadhaar);
}

function calculateAge(dob) {
  const today = new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
}

// =====================================================
// DYNAMIC FIELD MANAGEMENT
// =====================================================

function updateEmploymentFields() {
  const salariedFields = document.getElementById('salariedFields');
  const selfEmployedFields = document.getElementById('selfEmployedFields');
  const businessFields = document.getElementById('businessFields');

  salariedFields.style.display = 'none';
  selfEmployedFields.style.display = 'none';
  businessFields.style.display = 'none';

  if (formData.employmentType === 'Salaried') {
    salariedFields.style.display = 'block';
  } else if (formData.employmentType === 'Self-Employed') {
    selfEmployedFields.style.display = 'block';
  } else if (formData.employmentType === 'Business') {
    businessFields.style.display = 'block';
  }
}

function updateAge() {
  if (formData.dob) {
    const age = calculateAge(formData.dob);
    formData.age = age;
    document.getElementById('age').value = age || '';
  }
}

function autofillAddress() {
  const location = PIN_DATABASE[formData.pinCode];
  if (location) {
    formData.city = location.city;
    formData.state = location.state;
    document.getElementById('city').value = location.city;
    document.getElementById('state').value = location.state;
  }
}

function showCoApplicantStep() {
  const step = document.getElementById('coApplicantStep');
  const income = parseFloat(formData.monthlySalary || formData.annualIncome || formData.businessIncome || 0);
  
  if (formData.loanType === 'Home' || income > 500000) {
    step.style.display = 'block';
  } else {
    step.style.display = 'none';
  }
}

// =====================================================
// KYC VERIFICATION (SIMULATION)
// =====================================================

function simulateKycVerification() {
  const panStatus = document.getElementById('panStatus');
  const aadhaarStatus = document.getElementById('aadhaarStatus');
  const verificationMessage = document.getElementById('verificationMessage');
  const btn = document.getElementById('verifyKycBtn');

  // Clear previous status
  panStatus.innerHTML = '';
  aadhaarStatus.innerHTML = '';
  verificationMessage.innerHTML = '';

  // Validate format first
  if (!validatePAN(formData.pan)) {
    showError('panError', 'Invalid PAN format');
    return;
  }

  if (!validateAadhaar(formData.aadhaar)) {
    showError('aadhaarError', 'Invalid Aadhaar format');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Verifying...';
  verificationMessage.innerHTML = '⏳ Verifying documents...';
  verificationMessage.classList.remove('success', 'error');

  // Simulate API call
  setTimeout(() => {
    // Random success (80% success rate for demo)
    const panSuccess = Math.random() > 0.2;
    const aadhaarSuccess = Math.random() > 0.2;

    formData.panVerified = panSuccess;
    formData.aadhaarVerified = aadhaarSuccess;

    if (panSuccess) {
      panStatus.innerHTML = '<span class="status-success">✓ Verified</span>';
    } else {
      panStatus.innerHTML = '<span class="status-error">✗ Verification Failed</span>';
    }

    if (aadhaarSuccess) {
      aadhaarStatus.innerHTML = '<span class="status-success">✓ Verified</span>';
    } else {
      aadhaarStatus.innerHTML = '<span class="status-error">✗ Verification Failed</span>';
    }

    if (panSuccess && aadhaarSuccess) {
      verificationMessage.innerHTML = '✓ KYC verification successful!';
      verificationMessage.classList.add('success');
    } else {
      verificationMessage.innerHTML = '✗ Verification failed. Please check your details and try again.';
      verificationMessage.classList.add('error');
    }

    btn.disabled = false;
    btn.textContent = 'Verify KYC';
    isDirty = true;
  }, 2000);
}

// =====================================================
// SIGNATURE CANVAS
// =====================================================

function setupSignatureCanvas() {
  signatureCanvas = document.getElementById('signatureCanvas');
  if (!signatureCanvas) return;

  signatureContext = signatureCanvas.getContext('2d');
  const rect = signatureCanvas.getBoundingClientRect();

  // Set canvas size
  signatureCanvas.width = signatureCanvas.offsetWidth;
  signatureCanvas.height = 250;

  // Set background
  signatureContext.fillStyle = '#f8f9fa';
  signatureContext.fillRect(0, 0, signatureCanvas.width, signatureCanvas.height);

  // Drawing events
  signatureCanvas.addEventListener('mousedown', (e) => {
    isDrawing = true;
    const rect = signatureCanvas.getBoundingClientRect();
    signatureContext.beginPath();
    signatureContext.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  });

  signatureCanvas.addEventListener('mousemove', (e) => {
    if (!isDrawing) return;
    const rect = signatureCanvas.getBoundingClientRect();
    signatureContext.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    signatureContext.stroke();
  });

  signatureCanvas.addEventListener('mouseup', () => {
    isDrawing = false;
  });

  signatureCanvas.addEventListener('mouseout', () => {
    isDrawing = false;
  });

  // Touch events for mobile
  signatureCanvas.addEventListener('touchstart', (e) => {
    isDrawing = true;
    const rect = signatureCanvas.getBoundingClientRect();
    const touch = e.touches[0];
    signatureContext.beginPath();
    signatureContext.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
  });

  signatureCanvas.addEventListener('touchmove', (e) => {
    if (!isDrawing) return;
    const rect = signatureCanvas.getBoundingClientRect();
    const touch = e.touches[0];
    signatureContext.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
    signatureContext.stroke();
  });

  signatureCanvas.addEventListener('touchend', () => {
    isDrawing = false;
  });
}

function clearSignature() {
  if (signatureCanvas && signatureContext) {
    signatureContext.fillStyle = '#f8f9fa';
    signatureContext.fillRect(0, 0, signatureCanvas.width, signatureCanvas.height);
    formData.signatureData = '';
    document.getElementById('signatureStatus').textContent = '';
    isDirty = true;
  }
}

function saveSignature() {
  if (!signatureCanvas || !signatureContext) return;

  // Check if canvas has drawing
  const imageData = signatureContext.getImageData(0, 0, signatureCanvas.width, signatureCanvas.height);
  const data = imageData.data;
  let hasDrawing = false;

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 255) { // Check alpha
      hasDrawing = true;
      break;
    }
  }

  if (!hasDrawing) {
    document.getElementById('signatureStatus').textContent = '✗ Please draw your signature first';
    document.getElementById('signatureStatus').classList.add('error');
    return;
  }

  formData.signatureData = signatureCanvas.toDataURL('image/png');
  document.getElementById('signatureStatus').textContent = '✓ Signature saved successfully';
  document.getElementById('signatureStatus').classList.remove('error');
  document.getElementById('signatureStatus').classList.add('success');
  isDirty = true;
}

// =====================================================
// FILE UPLOAD
// =====================================================

function setupFileUpload() {
  const uploadArea = document.getElementById('uploadArea');
  const fileInput = document.getElementById('fileInput');

  if (!uploadArea) return;

  // Click to browse
  uploadArea.addEventListener('click', () => {
    fileInput.click();
  });

  // Drag and drop
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
  });

  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
  });

  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    handleFileSelect(e.dataTransfer.files);
  });

  // File input change
  fileInput.addEventListener('change', (e) => {
    handleFileSelect(e.target.files);
  });
}

function handleFileSelect(files) {
  const fileList = Array.from(files);
  const maxSize = 2 * 1024 * 1024; // 2MB

  fileList.forEach((file) => {
    if (file.type.match('image.*') || file.type === 'application/pdf') {
      if (file.size > maxSize) {
        alert(`${file.name} is too large (Max 2MB)`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        formData.uploadedFiles.push({
          name: file.name,
          size: file.size,
          type: file.type,
          data: e.target.result,
        });
        isDirty = true;
        updateFileList();
      };
      reader.readAsDataURL(file);
    } else {
      alert('Only images and PDFs are supported');
    }
  });
}

function updateFileList() {
  const fileList = document.getElementById('fileList');
  fileList.innerHTML = '';

  formData.uploadedFiles.forEach((file, index) => {
    const li = document.createElement('li');
    const size = (file.size / 1024).toFixed(2);
    li.innerHTML = `
      <span>${file.name} (${size} KB)</span>
      <button type="button" class="btn-remove" onclick="removeFile(${index})">✕</button>
    `;
    fileList.appendChild(li);
  });
}

function removeFile(index) {
  formData.uploadedFiles.splice(index, 1);
  updateFileList();
  isDirty = true;
}

// =====================================================
// REVIEW & ELIGIBILITY CALCULATION
// =====================================================

function calculateEligibility() {
  let score = 50; // Base score

  // Age factor
  const age = parseInt(formData.age) || 0;
  if (age >= 25 && age <= 60) {
    score += 15;
  } else if (age >= 21 && age < 25) {
    score += 10;
  }

  // Income factor
  let monthlyIncome = 0;
  if (formData.employmentType === 'Salaried') {
    monthlyIncome = parseFloat(formData.monthlySalary) || 0;
  } else if (formData.employmentType === 'Self-Employed') {
    monthlyIncome = (parseFloat(formData.annualIncome) || 0) / 12;
  } else if (formData.employmentType === 'Business') {
    monthlyIncome = (parseFloat(formData.businessIncome) || 0) / 12;
  }

  if (monthlyIncome >= 50000) {
    score += 20;
  } else if (monthlyIncome >= 30000) {
    score += 15;
  } else if (monthlyIncome >= 20000) {
    score += 10;
  }

  // KYC verification
  if (formData.panVerified && formData.aadhaarVerified) {
    score += 15;
  }

  // Cap score at 100
  score = Math.min(score, 100);

  return score;
}

function getApprovalStatus(score) {
  if (score >= 80) {
    return 'Approved';
  } else if (score >= 60) {
    return 'Conditional';
  } else {
    return 'Pending Review';
  }
}

function getSuggestedLoanAmount() {
  let monthlyIncome = 0;

  if (formData.employmentType === 'Salaried') {
    monthlyIncome = parseFloat(formData.monthlySalary) || 0;
  } else if (formData.employmentType === 'Self-Employed') {
    monthlyIncome = (parseFloat(formData.annualIncome) || 0) / 12;
  } else if (formData.employmentType === 'Business') {
    monthlyIncome = (parseFloat(formData.businessIncome) || 0) / 12;
  }

  // Loan amount = Monthly Income * 12 (12 months)
  let loanAmount = monthlyIncome * 12;

  // Cap based on loan type
  if (formData.loanType === 'Personal') {
    loanAmount = Math.min(loanAmount, 1000000); // Max 10L
  } else if (formData.loanType === 'Home') {
    loanAmount = Math.min(loanAmount * 2, 5000000); // Max 50L
  } else if (formData.loanType === 'Business') {
    loanAmount = Math.min(loanAmount * 1.5, 2000000); // Max 20L
  }

  return Math.round(loanAmount);
}

function getInterestRate() {
  const rates = {
    'Personal': '10.5%',
    'Home': '8.5%',
    'Business': '14%',
  };
  return rates[formData.loanType] || '10%';
}

function updateSummary() {
  const score = calculateEligibility();
  const approvalStatus = getApprovalStatus(score);
  const suggestedAmount = getSuggestedLoanAmount();
  const interestRate = getInterestRate();

  document.getElementById('summaryLoanType').textContent = formData.loanType || '-';
  document.getElementById('summaryFullName').textContent = formData.fullName || '-';
  document.getElementById('summaryAge').textContent = formData.age || '-';
  document.getElementById('summaryEmail').textContent = formData.email || '-';
  document.getElementById('summaryMobile').textContent = formData.mobile || '-';
  document.getElementById('summaryEmploymentType').textContent = formData.employmentType || '-';

  let income = '-';
  if (formData.employmentType === 'Salaried') {
    income = `₹${(parseFloat(formData.monthlySalary) || 0).toLocaleString()} / month`;
  } else if (formData.employmentType === 'Self-Employed') {
    income = `₹${(parseFloat(formData.annualIncome) || 0).toLocaleString()} / year`;
  } else if (formData.employmentType === 'Business') {
    income = `₹${(parseFloat(formData.businessIncome) || 0).toLocaleString()} / year`;
  }
  document.getElementById('summaryIncome').textContent = income;

  document.getElementById('scoreValue').textContent = score;
  document.getElementById('scoreCircle').style.setProperty('--percentage', score);
  document.getElementById('approvalStatus').textContent = approvalStatus;
  document.getElementById('approvalStatus').className = `status-badge status-${approvalStatus.toLowerCase().replace(' ', '-')}`;
  document.getElementById('suggestedAmount').textContent = `₹${suggestedAmount.toLocaleString()}`;
  document.getElementById('interestRate').textContent = interestRate;
}

// =====================================================
// FORM SUBMISSION
// =====================================================

function handleFormSubmit() {
  if (!validateCurrentStep()) {
    return;
  }

  saveFormData();

  // Generate Application ID
  const applicationId = `APP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

  // Show success modal
  document.getElementById('applicationId').textContent = `Application ID: ${applicationId}`;
  document.getElementById('successModal').style.display = 'flex';

  // Log submission (for debugging)
  console.log('Application Submitted:', {
    applicationId,
    formData,
    timestamp: new Date().toISOString(),
  });

  // Clear localStorage
  localStorage.removeItem(STORAGE_KEY);
}

// =====================================================
// UI UPDATES
// =====================================================

function updateUI() {
  // Update step display
  document.querySelectorAll('.form-step').forEach((step) => {
    step.classList.remove('active');
  });
  document.querySelector(`.form-step[data-step="${currentStep}"]`).classList.add('active');

  // Update step indicators
  document.querySelectorAll('.step-badge').forEach((badge) => {
    const stepNum = parseInt(badge.dataset.step);
    badge.classList.remove('active', 'completed');
    if (stepNum === currentStep) {
      badge.classList.add('active');
    } else if (stepNum < currentStep) {
      badge.classList.add('completed');
    }
  });

  // Update progress bar
  const progress = (currentStep / totalSteps) * 100;
  document.getElementById('progressFill').style.width = progress + '%';
  document.getElementById('currentStep').textContent = currentStep;

  // Update buttons
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const submitBtn = document.getElementById('submitBtn');

  prevBtn.style.display = currentStep > 1 ? 'block' : 'none';
  nextBtn.style.display = currentStep < totalSteps ? 'block' : 'none';
  submitBtn.style.display = currentStep === totalSteps ? 'block' : 'none';

  // Update step title
  const titles = [
    '',
    'Loan Type Selection',
    'Personal Information',
    'KYC Verification',
    'Address Details',
    'Employment & Income',
    'Co-Applicant Details',
    'Document Upload & E-Signature',
    'Review & Summary',
  ];
  document.getElementById('stepTitle').textContent = titles[currentStep];

  // Show/hide co-applicant step
  showCoApplicantStep();

  // Update employment fields
  if (currentStep === 5) {
    updateEmploymentFields();
  }

  // Update summary
  if (currentStep === 8) {
    updateSummary();
  }

  // Populate form fields with saved data
  populateFormFields();
}

function populateFormFields() {
  // Loan type
  const loanRadio = document.querySelector(`input[name="loanType"][value="${formData.loanType}"]`);
  if (loanRadio) loanRadio.checked = true;

  // Personal info
  document.getElementById('fullName').value = formData.fullName || '';
  document.getElementById('dob').value = formData.dob || '';
  document.getElementById('email').value = formData.email || '';
  document.getElementById('mobile').value = formData.mobile || '';
  document.getElementById('age').value = formData.age || '';

  // KYC
  document.getElementById('pan').value = formData.pan || '';
  document.getElementById('aadhaar').value = formData.aadhaar || '';

  // Address
  document.getElementById('pinCode').value = formData.pinCode || '';
  document.getElementById('city').value = formData.city || '';
  document.getElementById('state').value = formData.state || '';
  document.getElementById('address').value = formData.address || '';

  // Employment
  document.getElementById('employmentType').value = formData.employmentType || '';
  document.getElementById('companyName').value = formData.companyName || '';
  document.getElementById('monthlySalary').value = formData.monthlySalary || '';
  document.getElementById('businessName').value = formData.businessName || '';
  document.getElementById('annualIncome').value = formData.annualIncome || '';
  document.getElementById('businessNameOwner').value = formData.businessNameOwner || '';
  document.getElementById('businessIncome').value = formData.businessIncome || '';

  // Co-applicant
  document.getElementById('hasCoApplicant').checked = formData.hasCoApplicant;
  document.getElementById('coApplicantName').value = formData.coApplicantName || '';
  document.getElementById('coApplicantRelationship').value = formData.coApplicantRelationship || '';
  document.getElementById('coApplicantIncome').value = formData.coApplicantIncome || '';

  // Consent
  document.getElementById('consentTerms').checked = formData.consentTerms;
  document.getElementById('consentData').checked = formData.consentData;
}

// =====================================================
// ERROR HANDLING
// =====================================================

function showError(elementId, message) {
  if (!message) {
    // Simple message without specific element
    const alert = document.createElement('div');
    alert.className = 'form-alert error';
    alert.textContent = elementId;
    document.querySelector('.form-container').insertBefore(alert, document.getElementById('loanForm'));
    return;
  }

  const element = document.getElementById(elementId);
  if (element) {
    element.textContent = message;
  }
}

function clearErrors() {
  document.querySelectorAll('.error-message').forEach((el) => {
    el.textContent = '';
  });
  document.querySelectorAll('.form-alert').forEach((el) => {
    el.remove();
  });
}

// =====================================================
// LOCALSTORAGE & AUTO-SAVE
// =====================================================

function saveFormData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  showAutosaveIndicator();
}

function loadFormData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const data = JSON.parse(saved);
      formData = { ...formData, ...data };
    } catch (e) {
      console.error('Error loading saved data:', e);
    }
  }
}

function startAutosave() {
  autosaveTimer = setInterval(() => {
    if (isDirty) {
      saveFormData();
      isDirty = false;
    }
  }, AUTOSAVE_INTERVAL);
}

function showAutosaveIndicator() {
  const indicator = document.getElementById('autosaveIndicator');
  indicator.style.opacity = '1';
  setTimeout(() => {
    indicator.style.opacity = '0';
  }, 2000);
}

// =====================================================
// THEME TOGGLE
// =====================================================

function setupThemeToggle() {
  const themeToggle = document.getElementById('themeToggle');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  let isDark = localStorage.getItem('theme') === 'dark' || (prefersDark && !localStorage.getItem('theme'));
  if (isDark) {
    document.body.classList.add('dark-mode');
    themeToggle.textContent = '☀️';
  }

  themeToggle.addEventListener('click', () => {
    isDark = !isDark;
    if (isDark) {
      document.body.classList.add('dark-mode');
      themeToggle.textContent = '☀️';
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      themeToggle.textContent = '🌙';
      localStorage.setItem('theme', 'light');
    }
  });
}

// =====================================================
// CLEANUP
// =====================================================

window.addEventListener('beforeunload', () => {
  if (isDirty) {
    saveFormData();
  }
  clearInterval(autosaveTimer);
});
