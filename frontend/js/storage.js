/**
 * STORAGE.JS - LocalStorage Management Module
 * Handles auto-save, data loading, and persistence
 */

const STORAGE_VERSION = 'v1';
const STORAGE_KEY = `loanAppData_${STORAGE_VERSION}`;
const THEME_KEY = 'loanAppTheme';

/**
 * Default form data structure
 */
const defaultFormData = {
  currentStep: 1,
  selectedLoanType: '',
  fullName: '',
  dob: '',
  email: '',
  mobile: '',
  panNumber: '',
  aadhaarNumber: '',
  panVerified: false,
  aadhaarVerified: false,
  pincode: '',
  city: '',
  state: '',
  address: '',
  employmentType: '',
  companyName: '',
  monthlySalary: '',
  businessName: '',
  annualIncome: '',
  coApplicantEnabled: false,
  coApplicantName: '',
  coApplicantRelationship: '',
  coApplicantIncome: '',
  panFile: '',
  aadhaarFile: '',
  signature: '',
  agreeTerms: false
};

/**
 * Save form data to localStorage with timestamp
 */
function saveFormData(formData) {
  const dataToSave = {
    ...formData,
    lastSaved: new Date().toISOString()
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
}

/**
 * Load form data from localStorage
 */
function loadFormData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  
  if (!saved) {
    return { ...defaultFormData };
  }

  try {
    const parsedData = JSON.parse(saved);
    // Merge with defaults to handle new fields
    return {
      ...defaultFormData,
      ...parsedData
    };
  } catch (error) {
    console.error('Error loading form data:', error);
    return { ...defaultFormData };
  }
}

/**
 * Clear all saved data
 */
function clearAllData() {
  if (confirm('Are you sure? This will clear all your application data.')) {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  }
  return false;
}

/**
 * Update specific field in storage
 */
function updateFormField(fieldName, value) {
  const formData = loadFormData();
  formData[fieldName] = value;
  saveFormData(formData);
  return formData;
}

/**
 * Save current step
 */
function saveCurrentStep(step) {
  const formData = loadFormData();
  formData.currentStep = step;
  saveFormData(formData);
}

/**
 * Get last saved time
 */
function getLastSavedTime() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return null;
  
  try {
    const data = JSON.parse(saved);
    return data.lastSaved ? new Date(data.lastSaved) : null;
  } catch {
    return null;
  }
}

/**
 * Format time for display
 */
function formatTimeAgo(date) {
  if (!date) return 'Never';
  
  const seconds = Math.floor((new Date() - date) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  
  return date.toLocaleDateString();
}

/**
 * Save theme preference
 */
function saveTheme(theme) {
  localStorage.setItem(THEME_KEY, theme);
}

/**
 * Load theme preference
 */
function loadTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved) return saved;
  
  // Check system preference
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  
  return 'light';
}

/**
 * Export module
 */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    STORAGE_KEY,
    STORAGE_VERSION,
    defaultFormData,
    saveFormData,
    loadFormData,
    clearAllData,
    updateFormField,
    saveCurrentStep,
    getLastSavedTime,
    formatTimeAgo,
    saveTheme,
    loadTheme
  };
}
