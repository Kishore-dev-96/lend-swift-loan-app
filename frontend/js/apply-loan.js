/**
 * LendSwift AI - Apply for Loan Page
 * Handles multi-step loan application form
 */

class ApplyLoanPage {
  constructor() {
    this.currentStep = 1;
    this.totalSteps = 3;
    this.formData = {};
    this.authStorage = new AuthStorage();
    this.init();
  }

  async init() {
    // Check if user is logged in before rendering the page
    await this.checkAuthentication();
    this.setupEventListeners();
    this.populateUserData();
    this.getLoanTypeFromQuery();
  }

  async checkAuthentication() {
    try {
      const response = await fetch('/api/auth/check-auth', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (!data.loggedIn) {
        // Not logged in, redirect to login
        window.location.href = '/login.html';
      }
    } catch (error) {
      console.error('Authentication check failed:', error);
      window.location.href = '/login.html';
    }
  }

  setupEventListeners() {
    const form = document.getElementById('loan-application-form');
    const nextBtn = document.getElementById('next-step');
    const prevBtn = document.getElementById('prev-step');
    const submitBtn = document.getElementById('submit-application');

    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.nextStep());
    }
    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.previousStep());
    }
    if (submitBtn) {
      submitBtn.addEventListener('click', (e) => this.handleSubmit(e));
    }

    // Real-time validation
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      input.addEventListener('blur', (e) => this.validateField(e.target));
      input.addEventListener('input', (e) => {
        if (e.target.closest('.form-group').classList.contains('error')) {
          this.validateField(e.target);
        }
      });
    });
  }

  populateUserData() {
    const authState = this.authStorage.getAuthState();
    if (authState.user) {
      const nameInput = document.getElementById('app-full-name');
      const mobileInput = document.getElementById('app-mobile');
      const emailInput = document.getElementById('app-email');

      if (nameInput && authState.user.name) {
        nameInput.value = authState.user.name;
      }
      if (mobileInput && authState.user.mobile) {
        mobileInput.value = authState.user.mobile;
      }
      if (emailInput && authState.user.email) {
        emailInput.value = authState.user.email;
      }
    }
  }

  getLoanTypeFromQuery() {
    const params = new URLSearchParams(window.location.search);
    const loanType = params.get('type');
    if (loanType) {
      const loanTypeSelect = document.getElementById('app-loan-type');
      if (loanTypeSelect) {
        loanTypeSelect.value = loanType;
      }
    }
  }

  validateField(field) {
    const formGroup = field.closest('.form-group');
    let isValid = true;
    let errorMessage = '';

    const value = field.value.trim();
    const fieldName = field.name;

    // Skip empty optional fields
    if (!value && !field.required) {
      isValid = true;
    } else if (!value) {
      isValid = false;
      errorMessage = `${field.labels?.[0]?.textContent || 'This field'} is required`;
    } else if (fieldName === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        isValid = false;
        errorMessage = 'Please enter a valid email address';
      }
    } else if (fieldName === 'mobile') {
      const mobileRegex = /^[6-9]\d{9}$/;
      if (!mobileRegex.test(value.replace(/\D/g, ''))) {
        isValid = false;
        errorMessage = 'Please enter a valid 10-digit mobile number';
      }
    } else if (fieldName === 'fullName') {
      if (value.length < 2 || value.length > 50) {
        isValid = false;
        errorMessage = 'Name must be between 2 and 50 characters';
      }
    } else if (fieldName === 'loanAmount') {
      if (parseInt(value) < 50000) {
        isValid = false;
        errorMessage = 'Minimum loan amount is ₹50,000';
      }
    } else if (fieldName === 'monthlyIncome') {
      if (parseInt(value) < 0) {
        isValid = false;
        errorMessage = 'Monthly income must be a positive number';
      }
    }

    if (isValid) {
      formGroup.classList.remove('error');
      const errorElement = formGroup.querySelector('.error-message');
      if (errorElement) {
        errorElement.textContent = '';
      }
    } else {
      formGroup.classList.add('error');
      const errorElement = formGroup.querySelector('.error-message');
      if (errorElement) {
        errorElement.textContent = errorMessage;
      }
    }

    return isValid;
  }

  validateStep(step) {
    const stepElement = document.querySelector(`[data-step="${step}"]`);
    if (!stepElement) return false;

    const inputs = stepElement.querySelectorAll('input[required], select[required], textarea[required]');
    let isStepValid = true;

    inputs.forEach(input => {
      if (!this.validateField(input)) {
        isStepValid = false;
      }
    });

    return isStepValid;
  }

  nextStep() {
    if (!this.validateStep(this.currentStep)) {
      this.showToast('Please fix all errors before continuing', 'error');
      return;
    }

    if (this.currentStep < this.totalSteps) {
      this.saveStepData();
      this.currentStep++;
      this.updateStepDisplay();

      if (this.currentStep === this.totalSteps) {
        this.showReviewSummary();
      }
    }
  }

  previousStep() {
    if (this.currentStep > 1) {
      this.saveStepData();
      this.currentStep--;
      this.updateStepDisplay();
    }
  }

  updateStepDisplay() {
    // Hide all steps
    document.querySelectorAll('.form-step').forEach(step => {
      step.classList.remove('active');
    });

    // Show current step
    document.querySelector(`[data-step="${this.currentStep}"]`).classList.add('active');

    // Update progress
    document.querySelectorAll('.progress-step').forEach((step, index) => {
      const stepNum = index + 1;
      step.classList.remove('active', 'completed');
      if (stepNum === this.currentStep) {
        step.classList.add('active');
      } else if (stepNum < this.currentStep) {
        step.classList.add('completed');
      }
    });

    // Update button visibility
    const nextBtn = document.getElementById('next-step');
    const prevBtn = document.getElementById('prev-step');
    const submitBtn = document.getElementById('submit-application');

    if (this.currentStep === 1) {
      prevBtn.style.display = 'none';
    } else {
      prevBtn.style.display = 'inline-block';
    }

    if (this.currentStep === this.totalSteps) {
      nextBtn.style.display = 'none';
      submitBtn.style.display = 'inline-block';
    } else {
      nextBtn.style.display = 'inline-block';
      submitBtn.style.display = 'none';
    }

    // Scroll to top
    document.querySelector('.application-form-wrapper').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  saveStepData() {
    const form = document.getElementById('loan-application-form');
    const formData = new FormData(form);
    
    for (let [key, value] of formData.entries()) {
      this.formData[key] = value;
    }
  }

  showReviewSummary() {
    const reviewContainer = document.getElementById('review-summary');
    const summary = `
      <h3>Application Summary</h3>
      <div class="review-item">
        <span class="review-label">Full Name</span>
        <span class="review-value">${this.formData.fullName}</span>
      </div>
      <div class="review-item">
        <span class="review-label">Email</span>
        <span class="review-value">${this.formData.email}</span>
      </div>
      <div class="review-item">
        <span class="review-label">Mobile</span>
        <span class="review-value">${this.formData.mobile}</span>
      </div>
      <div class="review-item">
        <span class="review-label">Loan Type</span>
        <span class="review-value">${this.formatLoanType(this.formData.loanType)}</span>
      </div>
      <div class="review-item">
        <span class="review-label">Loan Amount</span>
        <span class="review-value">₹${parseInt(this.formData.loanAmount).toLocaleString()}</span>
      </div>
      <div class="review-item">
        <span class="review-label">Tenure</span>
        <span class="review-value">${this.formData.tenure} months</span>
      </div>
      <div class="review-item">
        <span class="review-label">Monthly Income</span>
        <span class="review-value">₹${parseInt(this.formData.monthlyIncome).toLocaleString()}</span>
      </div>
    `;
    reviewContainer.innerHTML = summary;
  }

  formatLoanType(type) {
    const types = {
      personal: 'Personal Loan',
      home: 'Home Loan',
      education: 'Education Loan',
      vehicle: 'Vehicle Loan',
      business: 'Business Loan',
      gold: 'Gold Loan'
    };
    return types[type] || type;
  }

  async handleSubmit(e) {
    e.preventDefault();

    // Validate checkboxes
    const agreeTerms = document.getElementById('app-terms').checked;
    const dataConsent = document.getElementById('app-consent').checked;

    if (!agreeTerms || !dataConsent) {
      this.showToast('Please agree to all terms before submitting', 'error');
      return;
    }

    this.saveStepData();

    const submitBtn = document.getElementById('submit-application');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoader = submitBtn.querySelector('.btn-loader');

    // Show loading state
    submitBtn.classList.add('loading');
    btnText.style.display = 'none';
    btnLoader.style.display = 'inline';

    try {
      const response = await fetch('/api/loans/apply', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName: this.formData.fullName,
          email: this.formData.email,
          mobile: this.formData.mobile,
          dob: this.formData.dob,
          loanType: this.formData.loanType,
          loanAmount: parseInt(this.formData.loanAmount),
          tenure: parseInt(this.formData.tenure),
          monthlyIncome: parseInt(this.formData.monthlyIncome),
          loanPurpose: this.formData.loanPurpose
        })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        this.showToast('Application submitted successfully!', 'success');
        setTimeout(() => {
          window.location.href = '/dashboard.html';
        }, 2000);
      } else {
        this.showToast(result.message || 'Failed to submit application. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      this.showToast('An error occurred. Please try again later.', 'error');
    } finally {
      submitBtn.classList.remove('loading');
      btnText.style.display = 'inline';
      btnLoader.style.display = 'none';
    }
  }

  showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    
    setTimeout(() => {
      toast.classList.remove('show');
    }, 4000);
  }
}

// Initialize on document ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new ApplyLoanPage();
  });
} else {
  new ApplyLoanPage();
}
