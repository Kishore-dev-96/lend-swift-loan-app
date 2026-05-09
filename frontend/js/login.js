/**
 * LendSwift AI - Login Page Handler
 * Manages login form validation and authentication
 */

// Auth State Management
class AuthState {
  constructor() {
    this.state = {
      isLoggedIn: false,
      user: null,
      token: null,
      sessionExpiry: null
    };
    this.listeners = [];
    this.loadFromStorage();
  }

  // Subscribe to auth state changes
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  // Notify all listeners
  notify() {
    this.listeners.forEach(callback => callback(this.state));
  }

  // Load auth state from localStorage
  loadFromStorage() {
    if (!window.authStorage) return;

    try {
      const authState = window.authStorage.getAuthState();
      if (authState && authState.sessionExpiry && new Date(authState.sessionExpiry) > new Date()) {
        this.state = authState;
      } else {
        this.clearStorage();
      }
    } catch (error) {
      console.error('Error loading auth state:', error);
      this.clearStorage();
    }
  }

  // Save auth state to localStorage
  saveToStorage() {
    if (window.authStorage) {
      window.authStorage.saveAuthState(this.state);
    }
  }

  // Clear auth state and storage
  clearStorage() {
    if (window.authStorage) {
      window.authStorage.clearAuthState();
    }
    this.state = {
      isLoggedIn: false,
      user: null,
      token: null,
      sessionExpiry: null
    };
    this.notify();
  }

  // Login user
  login(userData, token, rememberMe = false) {
    const expiryTime = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000; // 30 days or 24 hours
    this.state = {
      isLoggedIn: true,
      user: userData,
      token: token,
      sessionExpiry: new Date(Date.now() + expiryTime).toISOString()
    };
    this.saveToStorage();
    this.notify();
  }

  // Logout user
  logout() {
    this.clearStorage();
  }

  // Check if user is authenticated
  isAuthenticated() {
    return this.state.isLoggedIn && this.state.sessionExpiry &&
           new Date(this.state.sessionExpiry) > new Date();
  }

  // Get current user
  getUser() {
    return this.state.user;
  }

  // Get auth token
  getToken() {
    return this.state.token;
  }
}

// Global auth state instance
const authState = new AuthState();

// Authentication API Simulation
class AuthAPI {
  constructor() {
    this.mockDelay = 1500; // Simulate network delay
  }

  // Mock API response wrapper
  async mockRequest(response, success = true) {
    await new Promise(resolve => setTimeout(resolve, this.mockDelay));

    if (success) {
      return { success: true, data: response };
    } else {
      throw new Error(response.message || 'Request failed');
    }
  }

  // Login user
  async login(credentials) {
    // Simulate API call - accept demo credentials or any email/password for demo
    if (credentials.email === 'demo@lendswift.ai' && credentials.password === 'demo123') {
      const mockUser = {
        id: Date.now(),
        email: credentials.email,
        fullName: 'Demo User',
        mobile: '9876543210',
        createdAt: new Date().toISOString(),
        kycStatus: 'completed',
        loanApplications: []
      };

      const mockToken = 'demo_jwt_token_' + Date.now();
      return this.mockRequest({
        user: mockUser,
        token: mockToken,
        message: 'Login successful'
      });
    }

    // For other credentials, simulate successful login for demo purposes
    const mockUser = {
      id: Date.now(),
      email: credentials.email,
      fullName: 'Demo User',
      mobile: '9876543210',
      createdAt: new Date().toISOString(),
      kycStatus: 'pending',
      loanApplications: []
    };

    const mockToken = 'mock_jwt_token_' + Date.now();
    return this.mockRequest({
      user: mockUser,
      token: mockToken,
      message: 'Login successful'
    });
  }

  // Forgot Password - Send Reset Link
  async forgotPassword(email) {
    // Simulate sending reset email
    console.log('Password reset requested for:', email);
    return this.mockRequest({
      message: 'Password reset link sent to your email'
    });
  }
}

// Global API instance
const authAPI = new AuthAPI();

// UI Management
class AuthUI {
  constructor() {
    this.isLoading = false;
  }

  // Show loading state
  showLoading(button, text = 'Processing...') {
    if (this.isLoading) return;

    this.isLoading = true;
    const buttonText = button.querySelector('.button-text');
    const buttonLoader = button.querySelector('.button-loader');

    if (buttonText) buttonText.textContent = text;
    if (buttonLoader) buttonLoader.classList.remove('hidden');

    button.disabled = true;
    button.style.opacity = '0.8';
  }

  // Hide loading state
  hideLoading(button, text = 'Submit') {
    this.isLoading = false;
    const buttonText = button.querySelector('.button-text');
    const buttonLoader = button.querySelector('.button-loader');

    if (buttonText) buttonText.textContent = text;
    if (buttonLoader) buttonLoader.classList.add('hidden');

    button.disabled = false;
    button.style.opacity = '1';
  }

  // Show success message
  showSuccess(message, duration = 3000) {
    const successEl = document.getElementById('success-message');
    const textEl = document.getElementById('success-text');

    if (successEl && textEl) {
      textEl.textContent = message;
      successEl.classList.remove('hidden');

      setTimeout(() => {
        successEl.classList.add('hidden');
      }, duration);
    }
  }

  // Show error message
  showError(message, duration = 5000) {
    const errorEl = document.getElementById('error-message');
    const textEl = document.getElementById('error-text');

    if (errorEl && textEl) {
      textEl.textContent = message;
      errorEl.classList.remove('hidden');

      setTimeout(() => {
        errorEl.classList.add('hidden');
      }, duration);
    }
  }

  // Clear messages
  clearMessages() {
    const messages = document.querySelectorAll('.status-message');
    messages.forEach(msg => msg.classList.add('hidden'));
  }

  // Redirect after successful auth
  redirectToDashboard() {
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 1500);
  }

  // Animate form success
  animateSuccess(form) {
    form.style.animation = 'bounce 0.6s ease';
    setTimeout(() => {
      form.style.animation = '';
    }, 600);
  }

  // Show forgot password modal
  showForgotPasswordModal() {
    const modal = document.getElementById('forgot-password-modal');
    if (modal) {
      modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';

      // Focus on email input
      const emailInput = modal.querySelector('#reset-email');
      if (emailInput) {
        setTimeout(() => emailInput.focus(), 100);
      }
    }
  }

  // Hide forgot password modal
  hideForgotPasswordModal() {
    const modal = document.getElementById('forgot-password-modal');
    if (modal) {
      modal.classList.add('hidden');
      document.body.style.overflow = '';
    }
  }
}

// Global UI instance
const authUI = new AuthUI();

// Login Form Handler
class LoginHandler {
  constructor() {
    this.validator = null;
  }

  // Initialize login form
  init() {
    const form = document.getElementById('login-form');
    if (!form) return;

    if (window.AuthValidator) {
      this.validator = window.AuthValidator.initializeFormValidation('login-form');
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      authUI.clearMessages();

      if (!this.validator || !this.validator.isValid()) {
        authUI.showError('Please fix the errors above');
        return;
      }

      const submitButton = document.getElementById('login-button');
      authUI.showLoading(submitButton, 'Signing In...');

      try {
        const formData = new FormData(form);
        const credentials = {
          email: formData.get('email'),
          password: formData.get('password')
        };

        const response = await authAPI.login(credentials);
        const rememberMe = form.querySelector('#remember-me')?.checked || false;
        authState.login(response.data.user, response.data.token, rememberMe);

        authUI.hideLoading(submitButton, 'Sign In');
        authUI.showSuccess('Login successful! Redirecting...');
        authUI.animateSuccess(form);
        authUI.redirectToDashboard();

      } catch (error) {
        authUI.hideLoading(submitButton, 'Sign In');
        authUI.showError(error.message || 'Invalid credentials');
      }
    });

    // Forgot password link
    const forgotLink = document.getElementById('forgot-password-link');
    if (forgotLink) {
      forgotLink.addEventListener('click', (e) => {
        e.preventDefault();
        authUI.showForgotPasswordModal();
      });
    }

    // Forgot password modal handlers
    this.initForgotPasswordModal();
  }

  // Initialize forgot password modal
  initForgotPasswordModal() {
    const modal = document.getElementById('forgot-password-modal');
    const overlay = document.getElementById('forgot-password-overlay');
    const closeBtn = document.getElementById('forgot-password-close');
    const form = document.getElementById('forgot-password-form');

    // Close modal handlers
    [overlay, closeBtn].forEach(el => {
      if (el) {
        el.addEventListener('click', () => authUI.hideForgotPasswordModal());
      }
    });

    // ESC key handler
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
        authUI.hideForgotPasswordModal();
      }
    });

    // Form submission
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const emailInput = form.querySelector('#reset-email');
        const email = emailInput?.value?.trim();

        if (!email) {
          authUI.showError('Please enter your email address');
          return;
        }

        const submitButton = document.getElementById('reset-button');
        authUI.showLoading(submitButton, 'Sending...');

        try {
          await authAPI.forgotPassword(email);
          authUI.hideLoading(submitButton, 'Send Reset Link');
          authUI.showSuccess('Password reset link sent to your email');
          authUI.hideForgotPasswordModal();

          // Clear form
          form.reset();

        } catch (error) {
          authUI.hideLoading(submitButton, 'Send Reset Link');
          authUI.showError(error.message || 'Failed to send reset link');
        }
      });
    }
  }
}

// Global handler instance
const loginHandler = new LoginHandler();

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('🔐 Initializing LendSwift AI Login Page...');

  // Check if user is already logged in
  if (authState.isAuthenticated()) {
    console.log('User already authenticated, redirecting to dashboard...');
    window.location.href = 'dashboard.html';
    return;
  }

  // Initialize theme
  initializeTheme();

  // Initialize login form
  loginHandler.init();

  console.log('✅ Login page initialized successfully');
});

// Theme initialization
function initializeTheme() {
  const savedTheme = window.authStorage ? window.authStorage.getTheme() : 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes bounce {
    0%, 20%, 53%, 80%, 100% {
      transform: translate3d(0, 0, 0);
    }
    40%, 43% {
      transform: translate3d(0, -30px, 0);
    }
    70% {
      transform: translate3d(0, -15px, 0);
    }
    90% {
      transform: translate3d(0, -4px, 0);
    }
  }

  .modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .modal.hidden {
    display: none;
  }

  .modal-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
  }

  .modal-content {
    background: white;
    border-radius: 16px;
    box-shadow: 0 20px 25px rgba(0, 0, 0, 0.15);
    max-width: 400px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
    z-index: 1001;
  }

  .modal-header {
    padding: 24px 24px 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .modal-header h3 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
  }

  .modal-close {
    background: none;
    border: none;
    font-size: 2rem;
    cursor: pointer;
    color: #6b7280;
    padding: 4px;
    border-radius: 8px;
    transition: all 0.2s ease;
  }

  .modal-close:hover {
    background: #f3f4f6;
    color: #374151;
  }

  .modal-body {
    padding: 24px;
  }

  .demo-credentials {
    margin-top: 32px;
    padding: 16px;
    background: #f8fafc;
    border-radius: 12px;
    text-align: center;
    border: 1px solid #e5e7eb;
  }

  .demo-title {
    font-weight: 600;
    color: #374151;
    margin-bottom: 8px;
  }

  .demo-text {
    font-size: 0.9rem;
    color: #6b7280;
    line-height: 1.4;
  }

  .form-options {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  @media (max-width: 480px) {
    .form-options {
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
    }
  }
`;
document.head.appendChild(style);

// Export for global access
window.AuthState = authState;
window.AuthAPI = authAPI;
window.AuthUI = authUI;
window.LoginHandler = loginHandler;