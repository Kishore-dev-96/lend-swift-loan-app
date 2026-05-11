/**
 * LendSwift AI - Core Authentication Module
 * Handles signup, login, OTP verification, and session management
 */

const AuthSystem = (() => {
  // Constants
  const STORAGE_PREFIX = 'lendswift_';
  const USERS_KEY = `${STORAGE_PREFIX}users`;
  const SESSION_KEY = `${STORAGE_PREFIX}session`;
  const OTP_KEY = `${STORAGE_PREFIX}otp`;
  const OTP_EXPIRY = 5 * 60 * 1000; // 5 minutes
  const PROTECTED_PAGES = ['dashboard.html', 'loan-application.html', 'kyc-upload.html', 'profile.html'];

  // Initialize storage
  const initStorage = () => {
    if (!localStorage.getItem(USERS_KEY)) {
      localStorage.setItem(USERS_KEY, JSON.stringify([]));
    }
  };

  // Generate OTP
  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Hash password (simulation - NOT for production)
  const hashPassword = (password) => {
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
      const char = password.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return btoa(Math.abs(hash).toString()); // Base64 encode
  };

  // Verify password
  const verifyPassword = (plainPassword, hashedPassword) => {
    return hashPassword(plainPassword) === hashedPassword;
  };

  // Get all users
  const getAllUsers = () => {
    try {
      const users = localStorage.getItem(USERS_KEY);
      return users ? JSON.parse(users) : [];
    } catch (error) {
      console.error('Error retrieving users:', error);
      return [];
    }
  };

  // Save user
  const saveUser = (userData) => {
    try {
      const users = getAllUsers();
      const userExists = users.some(u => u.email === userData.email || u.mobile === userData.mobile);
      
      if (userExists) {
        return { success: false, message: 'User already exists' };
      }

      const newUser = {
        id: Date.now().toString(),
        ...userData,
        password: hashPassword(userData.password),
        createdAt: new Date().toISOString(),
        verified: false,
        lastLogin: null
      };

      users.push(newUser);
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
      return { success: true, message: 'User registered successfully', userId: newUser.id };
    } catch (error) {
      console.error('Error saving user:', error);
      return { success: false, message: 'Error saving user data' };
    }
  };

  // Find user by email or mobile
  const findUser = (identifier) => {
    const users = getAllUsers();
    return users.find(u => u.email === identifier || u.mobile === identifier);
  };

  // Signup
  const signup = (fullName, email, mobile, password) => {
    if (!fullName || !email || !mobile || !password) {
      return { success: false, message: 'All fields are required' };
    }

    // Validation
    if (!isValidEmail(email)) {
      return { success: false, message: 'Invalid email format' };
    }

    if (!isValidMobile(mobile)) {
      return { success: false, message: 'Mobile number must be 10 digits' };
    }

    if (password.length < 8) {
      return { success: false, message: 'Password must be at least 8 characters' };
    }

    // Check if user exists
    const existingUser = findUser(email) || findUser(mobile);
    if (existingUser) {
      return { success: false, message: 'Email or mobile already registered' };
    }

    // Save user
    return saveUser({ fullName, email, mobile, password });
  };

  // Login
  const login = (identifier, password) => {
    if (!identifier || !password) {
      return { success: false, message: 'Email/Mobile and password are required' };
    }

    const user = findUser(identifier);
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    if (!verifyPassword(password, user.password)) {
      return { success: false, message: 'Incorrect password' };
    }

    if (!user.verified) {
      return { success: false, message: 'Please verify your account first' };
    }

    return { success: true, message: 'Login successful', userId: user.id };
  };

  // Create OTP
  const createOTP = (mobile) => {
    const otp = generateOTP();
    const otpData = {
      otp,
      mobile,
      createdAt: Date.now(),
      expiresAt: Date.now() + OTP_EXPIRY,
      attempts: 0,
      verified: false
    };

    sessionStorage.setItem(OTP_KEY, JSON.stringify(otpData));
    return otp;
  };

  // Verify OTP
  const verifyOTP = (inputOTP) => {
    try {
      const otpData = JSON.parse(sessionStorage.getItem(OTP_KEY));

      if (!otpData) {
        return { success: false, message: 'OTP expired or not found' };
      }

      if (Date.now() > otpData.expiresAt) {
        sessionStorage.removeItem(OTP_KEY);
        return { success: false, message: 'OTP has expired' };
      }

      if (otpData.attempts >= 3) {
        sessionStorage.removeItem(OTP_KEY);
        return { success: false, message: 'Too many attempts. Request a new OTP' };
      }

      if (inputOTP !== otpData.otp) {
        otpData.attempts += 1;
        sessionStorage.setItem(OTP_KEY, JSON.stringify(otpData));
        return { success: false, message: 'Incorrect OTP' };
      }

      return { success: true, message: 'OTP verified successfully', mobile: otpData.mobile };
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return { success: false, message: 'Error verifying OTP' };
    }
  };

  // Get remaining OTP time
  const getOTPTimeRemaining = () => {
    try {
      const otpData = JSON.parse(sessionStorage.getItem(OTP_KEY));
      if (!otpData) return 0;

      const remaining = Math.max(0, Math.ceil((otpData.expiresAt - Date.now()) / 1000));
      return remaining;
    } catch {
      return 0;
    }
  };

  // Verify user email and set verified
  const verifyUserEmail = (userId) => {
    try {
      const users = getAllUsers();
      const userIndex = users.findIndex(u => u.id === userId);

      if (userIndex === -1) {
        return { success: false, message: 'User not found' };
      }

      users[userIndex].verified = true;
      users[userIndex].verifiedAt = new Date().toISOString();
      localStorage.setItem(USERS_KEY, JSON.stringify(users));

      return { success: true, message: 'Email verified successfully' };
    } catch (error) {
      console.error('Error verifying user:', error);
      return { success: false, message: 'Error verifying user' };
    }
  };

  // Create session
  const createSession = (userId) => {
    try {
      const user = getAllUsers().find(u => u.id === userId);
      if (!user) {
        return { success: false, message: 'User not found' };
      }

      const session = {
        userId,
        loggedIn: true,
        loginTime: new Date().toISOString(),
        userEmail: user.email,
        userName: user.fullName,
        userMobile: user.mobile,
        sessionToken: btoa(`${userId}:${Date.now()}`)
      };

      localStorage.setItem(SESSION_KEY, JSON.stringify(session));

      // Update last login
      user.lastLogin = new Date().toISOString();
      const users = getAllUsers();
      const userIndex = users.findIndex(u => u.id === userId);
      if (userIndex !== -1) {
        users[userIndex] = user;
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
      }

      return { success: true, message: 'Session created', session };
    } catch (error) {
      console.error('Error creating session:', error);
      return { success: false, message: 'Error creating session' };
    }
  };

  // Get current session
  const getSession = () => {
    try {
      const session = localStorage.getItem(SESSION_KEY);
      return session ? JSON.parse(session) : null;
    } catch {
      return null;
    }
  };

  // Check if logged in
  const isLoggedIn = () => {
    const session = getSession();
    return session && session.loggedIn === true;
  };

  // Logout
  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(OTP_KEY);
    return { success: true, message: 'Logged out successfully' };
  };

  // Protect route
  const protectRoute = () => {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    if (PROTECTED_PAGES.includes(currentPage)) {
      if (!isLoggedIn()) {
        window.location.href = 'login.html';
        return false;
      }
    }
    return true;
  };

  // Validation helpers
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isValidMobile = (mobile) => {
    return /^[0-9]{10}$/.test(mobile);
  };

  const isValidPassword = (password) => {
    return password && password.length >= 8;
  };

  const passwordsMatch = (password, confirmPassword) => {
    return password === confirmPassword;
  };

  return {
    initStorage,
    signup,
    login,
    logout,
    createOTP,
    verifyOTP,
    getOTPTimeRemaining,
    verifyUserEmail,
    createSession,
    getSession,
    isLoggedIn,
    protectRoute,
    findUser,
    getAllUsers,
    isValidEmail,
    isValidMobile,
    isValidPassword,
    passwordsMatch
  };
})();

// Initialize storage on load
document.addEventListener('DOMContentLoaded', () => {
  AuthSystem.initStorage();
  AuthSystem.protectRoute();
});

// OLD INTERFACE BELOW - KEEPING FOR REFERENCE
const LegacyAuthSystem = {
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
