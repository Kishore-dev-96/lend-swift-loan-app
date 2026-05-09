/**
 * VALIDATION.JS - Centralized Validation Engine
 * Handles all form validations for each step
 */

/**
 * Step 1: Loan Type Validation
 */
function validateStep1(formData) {
  const errors = {};

  if (!formData.selectedLoanType || formData.selectedLoanType.trim() === '') {
    errors.selectedLoanType = 'Please select a loan type';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Step 2: Personal Information Validation
 */
function validateStep2(formData) {
  const errors = {};

  // Full Name
  if (!formData.fullName || formData.fullName.trim() === '') {
    errors.fullName = 'Full name is required';
  } else if (formData.fullName.trim().length < 3) {
    errors.fullName = 'Full name must be at least 3 characters';
  } else if (!/^[a-zA-Z\s]+$/.test(formData.fullName)) {
    errors.fullName = 'Full name should contain only letters and spaces';
  }

  // Date of Birth
  if (!formData.dob) {
    errors.dob = 'Date of birth is required';
  } else {
    const age = calculateAge(new Date(formData.dob));
    if (age < 18) {
      errors.dob = 'You must be at least 18 years old';
    } else if (age > 80) {
      errors.dob = 'Please verify your date of birth';
    }
  }

  // Email
  if (!formData.email || formData.email.trim() === '') {
    errors.email = 'Email address is required';
  } else if (!isValidEmail(formData.email)) {
    errors.email = 'Please enter a valid email address';
  }

  // Mobile
  if (!formData.mobile || formData.mobile.trim() === '') {
    errors.mobile = 'Mobile number is required';
  } else if (!/^[0-9]{10}$/.test(formData.mobile)) {
    errors.mobile = 'Mobile number must be 10 digits';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Step 3: KYC Validation
 */
function validateStep3(formData) {
  const errors = {};

  // PAN
  if (!formData.panNumber || formData.panNumber.trim() === '') {
    errors.panNumber = 'PAN number is required';
  } else if (!isValidPAN(formData.panNumber)) {
    errors.panNumber = 'Invalid PAN format (e.g., AAAAA0000A)';
  }

  // Aadhaar
  if (!formData.aadhaarNumber || formData.aadhaarNumber.trim() === '') {
    errors.aadhaarNumber = 'Aadhaar number is required';
  } else if (!/^[0-9]{12}$/.test(formData.aadhaarNumber)) {
    errors.aadhaarNumber = 'Aadhaar must be 12 digits';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Step 4: Address Validation
 */
function validateStep4(formData) {
  const errors = {};

  // Pincode
  if (!formData.pincode || formData.pincode.trim() === '') {
    errors.pincode = 'Postal code is required';
  } else if (!/^[0-9]{6}$/.test(formData.pincode)) {
    errors.pincode = 'Postal code must be 6 digits';
  }

  // City
  if (!formData.city || formData.city.trim() === '') {
    errors.city = 'City is required';
  }

  // State
  if (!formData.state || formData.state.trim() === '') {
    errors.state = 'State is required';
  }

  // Address
  if (!formData.address || formData.address.trim() === '') {
    errors.address = 'Full address is required';
  } else if (formData.address.trim().length < 10) {
    errors.address = 'Please provide a complete address';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Step 5: Employment Validation
 */
function validateStep5(formData) {
  const errors = {};

  // Employment Type
  if (!formData.employmentType || formData.employmentType.trim() === '') {
    errors.employmentType = 'Employment type is required';
  }

  // Salaried Employee
  if (formData.employmentType === 'Salaried') {
    if (!formData.companyName || formData.companyName.trim() === '') {
      errors.companyName = 'Company name is required';
    }

    if (!formData.monthlySalary || formData.monthlySalary === '') {
      errors.monthlySalary = 'Monthly salary is required';
    } else if (parseFloat(formData.monthlySalary) <= 0) {
      errors.monthlySalary = 'Monthly salary must be greater than 0';
    } else if (parseFloat(formData.monthlySalary) < 10000) {
      errors.monthlySalary = 'Monthly salary must be at least ₹10,000';
    }
  }

  // Self-Employed
  if (formData.employmentType === 'Self-Employed') {
    if (!formData.businessName || formData.businessName.trim() === '') {
      errors.businessName = 'Business name is required';
    }

    if (!formData.annualIncome || formData.annualIncome === '') {
      errors.annualIncome = 'Annual income is required';
    } else if (parseFloat(formData.annualIncome) <= 0) {
      errors.annualIncome = 'Annual income must be greater than 0';
    } else if (parseFloat(formData.annualIncome) < 100000) {
      errors.annualIncome = 'Annual income must be at least ₹1,00,000';
    }
  }

  // Freelancer (same as self-employed)
  if (formData.employmentType === 'Freelancer') {
    if (!formData.annualIncome || formData.annualIncome === '') {
      errors.annualIncome = 'Annual income is required';
    } else if (parseFloat(formData.annualIncome) <= 0) {
      errors.annualIncome = 'Annual income must be greater than 0';
    } else if (parseFloat(formData.annualIncome) < 100000) {
      errors.annualIncome = 'Annual income must be at least ₹1,00,000';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Step 6: Co-Applicant Validation
 */
function validateStep6(formData) {
  const errors = {};

  // Only validate if co-applicant is enabled
  if (formData.coApplicantEnabled) {
    if (!formData.coApplicantName || formData.coApplicantName.trim() === '') {
      errors.coApplicantName = 'Co-applicant name is required';
    } else if (formData.coApplicantName.trim().length < 3) {
      errors.coApplicantName = 'Name must be at least 3 characters';
    }

    if (!formData.coApplicantRelationship || formData.coApplicantRelationship === '') {
      errors.coApplicantRelationship = 'Relationship is required';
    }

    if (!formData.coApplicantIncome || formData.coApplicantIncome === '') {
      errors.coApplicantIncome = 'Co-applicant income is required';
    } else if (parseFloat(formData.coApplicantIncome) <= 0) {
      errors.coApplicantIncome = 'Income must be greater than 0';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Step 7: Documents Validation
 */
function validateStep7(formData) {
  const errors = {};

  // Check if files are actually selected in the input elements
  const panFileInput = document.getElementById('panFile');
  const aadhaarFileInput = document.getElementById('aadhaarFile');

  if (!panFileInput || !panFileInput.files || panFileInput.files.length === 0) {
    errors.panFile = 'PAN document is required';
  }

  if (!aadhaarFileInput || !aadhaarFileInput.files || aadhaarFileInput.files.length === 0) {
    errors.aadhaarFile = 'Aadhaar document is required';
  }

  if (!formData.signature || formData.signature === '') {
    errors.signature = 'Signature is required - please draw and save your signature';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Step 8: Review Validation
 */
function validateStep8(formData) {
  const errors = {};

  if (!formData.agreeTerms) {
    errors.agreeTerms = 'You must agree to the terms and conditions';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Main validation function - validates current step
 */
function validateStep(stepNumber, formData) {
  const validators = {
    1: validateStep1,
    2: validateStep2,
    3: validateStep3,
    4: validateStep4,
    5: validateStep5,
    6: validateStep6,
    7: validateStep7,
    8: validateStep8
  };

  const validator = validators[stepNumber];
  if (!validator) {
    return { isValid: true, errors: {} };
  }

  return validator(formData);
}

/**
 * Validate if all steps before current are completed
 */
function validatePreviousSteps(currentStep, formData) {
  for (let step = 1; step < currentStep; step++) {
    const validation = validateStep(step, formData);
    if (!validation.isValid) {
      return {
        isValid: false,
        firstIncompleteStep: step
      };
    }
  }

  return { isValid: true };
}

/**
 * Helper Functions
 */

function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function isValidPAN(pan) {
  // PAN format: AAAAA0000A (5 letters, 4 digits, 1 letter)
  const regex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
  return regex.test(pan);
}

function calculateAge(dob) {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * File validation
 */
function validateFile(file) {
  const errors = [];
  const maxSize = 2 * 1024 * 1024; // 2MB
  const allowedFormats = ['image/jpeg', 'image/png'];

  if (!file) {
    errors.push('File is required');
    return { isValid: false, errors };
  }

  if (file.size > maxSize) {
    errors.push(`File size must be less than 2MB (Current: ${(file.size / 1024 / 1024).toFixed(2)}MB)`);
  }

  if (!allowedFormats.includes(file.type)) {
    errors.push('Only JPG and PNG files are allowed');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
