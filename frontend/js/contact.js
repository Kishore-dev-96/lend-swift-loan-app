/**
 * LendSwift AI - Contact Page
 * Handles contact form submission and validation
 */

class ContactPage {
  constructor() {
    this.authStorage = new AuthStorage();
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.updateNavigation();
  }

  setupEventListeners() {
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
      contactForm.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    // Real-time validation
    const inputs = document.querySelectorAll('.contact-form input, .contact-form textarea');
    inputs.forEach(input => {
      input.addEventListener('blur', (e) => this.validateField(e.target));
      input.addEventListener('input', (e) => {
        if (e.target.closest('.form-group').classList.contains('error')) {
          this.validateField(e.target);
        }
      });
    });
  }

  validateField(field) {
    const formGroup = field.closest('.form-group');
    let isValid = true;
    let errorMessage = '';

    const value = field.value.trim();
    const fieldName = field.name;

    if (!value) {
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
    } else if (fieldName === 'name') {
      if (value.length < 2 || value.length > 50) {
        isValid = false;
        errorMessage = 'Name must be between 2 and 50 characters';
      }
    } else if (fieldName === 'message') {
      if (value.length < 10) {
        isValid = false;
        errorMessage = 'Message must be at least 10 characters';
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

  async handleSubmit(e) {
    e.preventDefault();

    // Validate all fields
    const form = e.target;
    const inputs = form.querySelectorAll('input, textarea');
    let isFormValid = true;

    inputs.forEach(input => {
      if (!this.validateField(input)) {
        isFormValid = false;
      }
    });

    if (!isFormValid) {
      this.showToast('Please fix all errors before submitting', 'error');
      return;
    }

    const submitBtn = form.querySelector('.btn-submit');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoader = submitBtn.querySelector('.btn-loader');

    // Show loading state
    submitBtn.classList.add('loading');
    btnText.style.display = 'none';
    btnLoader.style.display = 'inline';

    try {
      const formData = new FormData(form);
      const data = {
        name: formData.get('name'),
        email: formData.get('email'),
        mobile: formData.get('mobile'),
        message: formData.get('message')
      };

      const response = await fetch('/contact-message', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        this.showToast('Your message has been sent successfully! We\'ll respond shortly.', 'success');
        form.reset();
        
        // Clear error states
        form.querySelectorAll('.form-group').forEach(group => {
          group.classList.remove('error');
        });
      } else {
        this.showToast(result.message || 'Failed to send message. Please try again.', 'error');
      }
    } catch (error) {
      console.error('Error submitting contact form:', error);
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

  updateNavigation() {
    const authState = this.authStorage.getAuthState();
    const loginBtn = document.getElementById('navbar-login-btn');
    const signupBtn = document.getElementById('navbar-signup-btn');

    if (authState.isLoggedIn && authState.user) {
      // Hide login/signup buttons if logged in
      if (loginBtn) loginBtn.style.display = 'none';
      if (signupBtn) signupBtn.style.display = 'none';
    }
  }
}

// Initialize on document ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new ContactPage();
  });
} else {
  new ContactPage();
}
