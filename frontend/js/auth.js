/**
 * AUTHENTICATION MODULE
 * LendSwift AI - Complete Authentication System
 * Handles: Login, Signup, OTP, Session Management
 */

const AuthSystem = {
  // State Management
  state: {
    currentUser: null,
    isAuthenticated: false,
    authMode: 'login', // login or signup
    otp: {
      sending: false,
      verifying: false,
      timeRemaining: 0,
      attempts: 0
    }
  },

  // Constants
  CONFIG: {
    OTP_TIME_LIMIT: 60, // seconds
    OTP_MAX_ATTEMPTS: 3,
    SESSION_STORAGE_KEY: 'lendswift_user',
    TOKEN_STORAGE_KEY: 'lendswift_token',
    SESSION_EXPIRY: 24 * 60 * 60 * 1000 // 24 hours
  },

  // ============================================
  // INITIALIZATION
  // ============================================

  init() {
    console.log('🔐 Initializing Authentication System...');
    this.restoreSession();
    this.setupEventListeners();
    this.setupFormValidation();
    this.checkAuthStatus();
  },

  // ============================================
  // SESSION MANAGEMENT
  // ============================================

  restoreSession() {
    const savedUser = localStorage.getItem(this.CONFIG.SESSION_STORAGE_KEY);
    const savedToken = localStorage.getItem(this.CONFIG.TOKEN_STORAGE_KEY);

    if (savedUser && savedToken) {
      this.state.currentUser = JSON.parse(savedUser);
      this.state.isAuthenticated = true;
      console.log('✅ Session restored:', this.state.currentUser.email);
      this.updateUIForAuthenticatedUser();
    }
  },

  createSession(userData) {
    const token = this.generateToken();
    const sessionData = {
      ...userData,
      loginTime: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    };

    localStorage.setItem(this.CONFIG.SESSION_STORAGE_KEY, JSON.stringify(sessionData));
    localStorage.setItem(this.CONFIG.TOKEN_STORAGE_KEY, token);

    this.state.currentUser = sessionData;
    this.state.isAuthenticated = true;
  },

  destroySession() {
    localStorage.removeItem(this.CONFIG.SESSION_STORAGE_KEY);
    localStorage.removeItem(this.CONFIG.TOKEN_STORAGE_KEY);

    this.state.currentUser = null;
    this.state.isAuthenticated = false;
  },

  generateToken() {
    return 'token_' + Math.random().toString(36).substr(2) + '_' + Date.now();
  },

  // ============================================
  // VALIDATION
  // ============================================

  setupFormValidation() {
    // Email validation
    this.validateEmail = (email) => {
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return regex.test(email);
    };

    // Password validation
    this.validatePassword = (password) => {
      return {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[!@#$%^&*]/.test(password)
      };
    };

    // Mobile validation
    this.validateMobile = (mobile) => {
      const regex = /^[0-9]{10}$/;
      return regex.test(mobile);
    };

    // Name validation
    this.validateName = (name) => {
      return name.trim().length >= 3 && /^[a-zA-Z\s]+$/.test(name);
    };
  },

  calculatePasswordStrength(password) {
    const checks = this.validatePassword(password);
    const passedChecks = Object.values(checks).filter(Boolean).length;

    if (passedChecks <= 2) return 'weak';
    if (passedChecks <= 4) return 'medium';
    return 'strong';
  },

  // ============================================
  // EVENT LISTENERS SETUP
  // ============================================

  setupEventListeners() {
    // Auth tab switching
    const authTabs = document.querySelectorAll('.auth-tab');
    authTabs.forEach(tab => {
      tab.addEventListener('click', (e) => this.switchAuthMode(e.target.dataset.mode));
    });

    // Password visibility toggle
    const passwordToggles = document.querySelectorAll('.password-toggle');
    passwordToggles.forEach(toggle => {
      toggle.addEventListener('click', (e) => this.togglePasswordVisibility(e));
    });

    // Form submissions
    const signupForm = document.querySelector('[data-signup-form]');
    const loginForm = document.querySelector('[data-login-form]');
    const otpForm = document.querySelector('[data-otp-form]');

    if (signupForm) signupForm.addEventListener('submit', (e) => this.handleSignup(e));
    if (loginForm) loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    if (otpForm) otpForm.addEventListener('submit', (e) => this.handleOTPVerification(e));

    // Real-time password strength indicator
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    passwordInputs.forEach(input => {
      input.addEventListener('input', (e) => this.updatePasswordStrength(e.target));
    });

    // OTP auto-focus
    this.setupOTPAutoFocus();

    // Logout button
    const logoutBtn = document.querySelector('[data-logout-btn]');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.logout());
    }
  },

  // ============================================
  // SIGNUP HANDLER
  // ============================================

  handleSignup(e) {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);
    const userData = {
      fullName: formData.get('fullName'),
      email: formData.get('email'),
      mobile: formData.get('mobile'),
      password: formData.get('password'),
      confirmPassword: formData.get('confirmPassword')
    };

    // Clear previous errors
    this.clearFormErrors(form);

    // Validation
    const errors = this.validateSignupForm(userData);
    if (Object.keys(errors).length > 0) {
      this.displayFormErrors(form, errors);
      return;
    }

    // Simulate API call
    this.showLoading(form);
    setTimeout(() => {
      this.hideLoading(form);
      this.showSuccessMessage('Account created successfully! 🎉');

      // Create session
      this.createSession({
        fullName: userData.fullName,
        email: userData.email,
        mobile: userData.mobile,
        isNewUser: true
      });

      // Show OTP verification (simulated)
      setTimeout(() => {
        this.showOTPVerification(userData.mobile);
      }, 1500);
    }, 1500);
  },

  validateSignupForm(data) {
    const errors = {};

    if (!data.fullName || !this.validateName(data.fullName)) {
      errors.fullName = 'Please enter a valid full name (3+ characters, letters only)';
    }

    if (!data.email || !this.validateEmail(data.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!data.mobile || !this.validateMobile(data.mobile)) {
      errors.mobile = 'Please enter a valid 10-digit mobile number';
    }

    if (!data.password || data.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    if (data.password !== data.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    return errors;
  },

  // ============================================
  // LOGIN HANDLER
  // ============================================

  handleLogin(e) {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);
    const credentials = {
      email: formData.get('email'),
      password: formData.get('password'),
      rememberMe: formData.get('rememberMe') === 'on'
    };

    // Clear previous errors
    this.clearFormErrors(form);

    // Validation
    const errors = this.validateLoginForm(credentials);
    if (Object.keys(errors).length > 0) {
      this.displayFormErrors(form, errors);
      return;
    }

    // Simulate API call
    this.showLoading(form);
    setTimeout(() => {
      this.hideLoading(form);

      // Simulate auth (in real app, verify against backend)
      const isValidCredentials = this.simulateLogin(credentials.email, credentials.password);

      if (!isValidCredentials) {
        this.displayFormErrors(form, {
          general: 'Invalid email or password'
        });
        return;
      }

      this.showSuccessMessage('Login successful! 🔓');

      // Create session
      this.createSession({
        email: credentials.email,
        isNewUser: false,
        rememberMe: credentials.rememberMe
      });

      // Redirect to dashboard
      setTimeout(() => {
        window.location.href = 'loan-application.html';
      }, 1500);
    }, 1500);
  },

  validateLoginForm(data) {
    const errors = {};

    if (!data.email || !this.validateEmail(data.email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (!data.password || data.password.length < 8) {
      errors.password = 'Password is invalid';
    }

    return errors;
  },

  simulateLogin(email, password) {
    // Simulate checking credentials (in production, this is backend)
    // For demo: accept test@example.com / Password123!
    const testCredentials = {
      'test@example.com': 'Password123!',
      'demo@lendswift.ai': 'Demo123!'
    };

    return testCredentials[email] === password;
  },

  // ============================================
  // OTP VERIFICATION
  // ============================================

  showOTPVerification(mobile) {
    const otpModal = document.querySelector('[data-otp-modal]');
    if (!otpModal) return;

    // Set mobile display
    const mobileDisplay = otpModal.querySelector('[data-mobile-display]');
    if (mobileDisplay) {
      mobileDisplay.textContent = mobile;
    }

    // Show modal
    this.openModal('otpModal');
    this.startOTPTimer();
  },

  handleOTPVerification(e) {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);
    const otp = formData.get('otp');

    // Clear previous errors
    this.clearFormErrors(form);

    // Validate OTP
    if (!otp || otp.length !== 6 || isNaN(otp)) {
      this.displayFormErrors(form, {
        otp: 'Please enter a valid 6-digit OTP'
      });
      return;
    }

    // Check attempts
    if (this.state.otp.attempts >= this.CONFIG.OTP_MAX_ATTEMPTS) {
      this.displayFormErrors(form, {
        general: 'Maximum OTP attempts exceeded. Please try again later.'
      });
      return;
    }

    // Simulate verification
    this.showLoading(form);
    setTimeout(() => {
      this.hideLoading(form);

      // Simulate OTP verification (accept any 6-digit number in demo)
      if (otp.length === 6) {
        this.showSuccessMessage('OTP verified successfully! ✅');

        setTimeout(() => {
          this.closeModal('otpModal');
          this.showDashboardAccess();
        }, 1500);
      } else {
        this.state.otp.attempts++;
        this.displayFormErrors(form, {
          general: `Invalid OTP. ${this.CONFIG.OTP_MAX_ATTEMPTS - this.state.otp.attempts} attempts remaining`
        });
      }
    }, 1500);
  },

  startOTPTimer() {
    this.state.otp.timeRemaining = this.CONFIG.OTP_TIME_LIMIT;
    const timerElement = document.querySelector('[data-otp-timer]');
    const resendBtn = document.querySelector('[data-resend-otp-btn]');

    if (resendBtn) resendBtn.disabled = true;

    const interval = setInterval(() => {
      this.state.otp.timeRemaining--;

      if (timerElement) {
        timerElement.textContent = `${this.state.otp.timeRemaining}s`;
      }

      if (this.state.otp.timeRemaining <= 0) {
        clearInterval(interval);
        if (resendBtn) resendBtn.disabled = false;
      }
    }, 1000);
  },

  handleResendOTP() {
    this.state.otp.attempts = 0;
    this.state.otp.timeRemaining = 0;
    this.startOTPTimer();
    this.showSuccessMessage('OTP sent successfully! 📨');
  },

  // ============================================
  // UI HELPERS
  // ============================================

  switchAuthMode(mode) {
    this.state.authMode = mode;

    // Update tabs
    const tabs = document.querySelectorAll('.auth-tab');
    tabs.forEach(tab => {
      tab.classList.remove('active');
      if (tab.dataset.mode === mode) {
        tab.classList.add('active');
      }
    });

    // Update content
    const contents = document.querySelectorAll('.auth-tab-content');
    contents.forEach(content => {
      content.classList.remove('active');
      if (content.dataset.mode === mode) {
        content.classList.add('active');
      }
    });
  },

  togglePasswordVisibility(e) {
    const toggle = e.currentTarget;
    const input = toggle.previousElementSibling;

    if (input && input.type === 'password') {
      input.type = 'text';
      toggle.textContent = '👁️';
    } else if (input) {
      input.type = 'password';
      toggle.textContent = '👁️‍🗨️';
    }
  },

  updatePasswordStrength(input) {
    const strength = this.calculatePasswordStrength(input.value);
    const formGroup = input.closest('.auth-form-group');

    if (!formGroup) return;

    // Remove all strength classes
    formGroup.classList.remove('weak', 'medium', 'strong');

    if (input.value.length > 0) {
      formGroup.classList.add(strength);
    }

    // Update strength bars
    const bars = formGroup.querySelectorAll('.strength-bar');
    bars.forEach((bar, index) => {
      bar.classList.remove('weak', 'medium', 'strong');

      if (strength === 'weak' && index === 0) {
        bar.classList.add('weak');
      } else if (strength === 'medium' && index < 2) {
        bar.classList.add('medium');
      } else if (strength === 'strong') {
        bar.classList.add('strong');
      }
    });
  },

  clearFormErrors(form) {
    form.querySelectorAll('.auth-form-group').forEach(group => {
      group.classList.remove('error', 'success');
      const errorMsg = group.querySelector('.auth-form-error');
      if (errorMsg) errorMsg.textContent = '';
    });
  },

  displayFormErrors(form, errors) {
    Object.entries(errors).forEach(([field, message]) => {
      if (field === 'general') {
        this.showErrorMessage(message);
        return;
      }

      const input = form.querySelector(`[name="${field}"]`);
      if (!input) return;

      const formGroup = input.closest('.auth-form-group');
      if (!formGroup) return;

      formGroup.classList.add('error');
      const errorMsg = formGroup.querySelector('.auth-form-error');
      if (errorMsg) errorMsg.textContent = message;
    });
  },

  showLoading(form) {
    const btn = form.querySelector('button[type="submit"]');
    if (!btn) return;

    btn.disabled = true;
    const originalText = btn.textContent;
    btn.dataset.originalText = originalText;
    btn.innerHTML = '<span class="spinner"></span> Loading...';
  },

  hideLoading(form) {
    const btn = form.querySelector('button[type="submit"]');
    if (!btn) return;

    btn.disabled = false;
    btn.textContent = btn.dataset.originalText || 'Continue';
  },

  showSuccessMessage(message) {
    const toast = document.querySelector('[data-toast-container]');
    if (!toast) {
      const container = document.createElement('div');
      container.dataset.toastContainer = '';
      document.body.appendChild(container);
    }

    const toastEl = document.querySelector('[data-toast-container]');
    const messageEl = document.createElement('div');
    messageEl.className = 'alert alert-success';
    messageEl.innerHTML = `
      <div class="alert-icon">✓</div>
      <div class="alert-content">
        <p>${message}</p>
      </div>
    `;

    toastEl.appendChild(messageEl);

    setTimeout(() => {
      messageEl.remove();
    }, 4000);
  },

  showErrorMessage(message) {
    const toast = document.querySelector('[data-toast-container]');
    if (!toast) {
      const container = document.createElement('div');
      container.dataset.toastContainer = '';
      document.body.appendChild(container);
    }

    const toastEl = document.querySelector('[data-toast-container]');
    const messageEl = document.createElement('div');
    messageEl.className = 'alert alert-error';
    messageEl.innerHTML = `
      <div class="alert-icon">!</div>
      <div class="alert-content">
        <p>${message}</p>
      </div>
    `;

    toastEl.appendChild(messageEl);

    setTimeout(() => {
      messageEl.remove();
    }, 4000);
  },

  openModal(modalId) {
    const modal = document.querySelector(`[data-${modalId}]`);
    if (modal) modal.classList.add('active');
  },

  closeModal(modalId) {
    const modal = document.querySelector(`[data-${modalId}]`);
    if (modal) modal.classList.remove('active');
  },

  setupOTPAutoFocus() {
    const otpInputs = document.querySelectorAll('.otp-input');
    otpInputs.forEach((input, index) => {
      input.addEventListener('input', (e) => {
        if (e.target.value.length === 1 && index < otpInputs.length - 1) {
          otpInputs[index + 1].focus();
        }
      });

      input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !e.target.value && index > 0) {
          otpInputs[index - 1].focus();
        }
      });
    });
  },

  // ============================================
  // UI STATE UPDATES
  // ============================================

  updateUIForAuthenticatedUser() {
    // Hide auth-only elements
    document.querySelectorAll('[data-auth-only]').forEach(el => {
      el.style.display = 'none';
    });

    // Show authenticated-only elements
    document.querySelectorAll('[data-authenticated-only]').forEach(el => {
      el.style.display = '';
    });

    // Update user display
    if (this.state.currentUser) {
      const userNameEls = document.querySelectorAll('[data-user-name]');
      userNameEls.forEach(el => {
        el.textContent = this.state.currentUser.fullName || this.state.currentUser.email;
      });

      const userEmailEls = document.querySelectorAll('[data-user-email]');
      userEmailEls.forEach(el => {
        el.textContent = this.state.currentUser.email;
      });
    }
  },

  checkAuthStatus() {
    const isAuthPage = window.location.pathname.includes('login');
    const isAppPage = window.location.pathname.includes('loan-application');

    if (!isAuthPage && !this.state.isAuthenticated && isAppPage) {
      // Redirect to login if not authenticated
      console.log('⚠️ Not authenticated, redirecting to login...');
      // window.location.href = 'login.html';
    }
  },

  showDashboardAccess() {
    this.showSuccessMessage('Welcome to LendSwift! 🚀');
  },

  logout() {
    if (confirm('Are you sure you want to logout?')) {
      this.destroySession();
      this.showSuccessMessage('Logged out successfully');

      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1500);
    }
  }
};

// ============================================
// NAVBAR RESPONSIVE HANDLER
// ============================================

const NavbarHandler = {
  init() {
    const menuToggle = document.querySelector('[data-menu-toggle]');
    const mobileDrawer = document.querySelector('[data-mobile-drawer]');
    const drawerClose = document.querySelector('[data-drawer-close]');

    if (menuToggle) {
      menuToggle.addEventListener('click', () => {
        menuToggle.classList.toggle('active');
        if (mobileDrawer) mobileDrawer.classList.toggle('active');
        document.body.style.overflow = mobileDrawer?.classList.contains('active') ? 'hidden' : '';
      });
    }

    if (drawerClose) {
      drawerClose.addEventListener('click', () => {
        if (menuToggle) menuToggle.classList.remove('active');
        if (mobileDrawer) mobileDrawer.classList.remove('active');
        document.body.style.overflow = '';
      });
    }

    // Close drawer when link clicked
    if (mobileDrawer) {
      mobileDrawer.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          if (menuToggle) menuToggle.classList.remove('active');
          mobileDrawer.classList.remove('active');
          document.body.style.overflow = '';
        });
      });
    }

    // Close drawer on outside click
    if (mobileDrawer) {
      document.addEventListener('click', (e) => {
        if (!e.target.closest('[data-mobile-drawer]') && !e.target.closest('[data-menu-toggle]')) {
          if (mobileDrawer.classList.contains('active')) {
            if (menuToggle) menuToggle.classList.remove('active');
            mobileDrawer.classList.remove('active');
            document.body.style.overflow = '';
          }
        }
      });
    }
  }
};

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  AuthSystem.init();
  NavbarHandler.init();
});
