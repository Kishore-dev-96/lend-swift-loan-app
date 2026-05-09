/**
 * LendSwift AI - Signup Authentication Module
 * Handles signup form validation and submission
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
    try {
      const stored = localStorage.getItem('lendswift_auth');
      if (stored) {
        const parsed = JSON.parse(stored);
        // Check if session is still valid
        if (parsed.sessionExpiry && new Date(parsed.sessionExpiry) > new Date()) {
          this.state = parsed;
        } else {
          this.clearStorage();
        }
      }
    } catch (error) {
      console.error('Error loading auth state:', error);
      this.clearStorage();
    }
  }

  // Save auth state to localStorage
  saveToStorage() {
    try {
      localStorage.setItem('lendswift_auth', JSON.stringify(this.state));
    } catch (error) {
      console.error('Error saving auth state:', error);
    }
  }

  // Clear auth state and storage
  clearStorage() {
    localStorage.removeItem('lendswift_auth');
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

  // Update user profile
  updateUser(userData) {
    this.state.user = { ...this.state.user, ...userData };
    this.saveToStorage();
    this.notify();
  }
}

// Global auth state instance
const authState = new AuthState();

// Authentication API Simulation
class AuthAPI {
  constructor() {
    this.baseURL = 'http://localhost:8000/api'; // Backend URL when available
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

  // Signup user
  async signup(userData) {
    // Simulate API call
    const mockUser = {
      id: Date.now(),
      fullName: userData.fullName,
      email: userData.email,
      mobile: userData.mobile,
      createdAt: new Date().toISOString(),
      kycStatus: 'pending',
      loanApplications: []
    };

    const mockToken = 'mock_jwt_token_' + Date.now();

    return this.mockRequest({
      user: mockUser,
      token: mockToken,
      message: 'Account created successfully'
    });
  }
}

// Global API instance
const authAPI = new AuthAPI();

// UI Management
class AuthUI {
  constructor() {
    this.currentForm = null;
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
}

// Global UI instance
const authUI = new AuthUI();

// Signup Form Handler
class SignupHandler {
  constructor() {
    this.validator = null;
  }

  // Initialize signup form
  init() {
    const form = document.getElementById('signup-form');
    if (!form) return;

    this.validator = window.AuthValidator.initializeFormValidation('signup-form');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      authUI.clearMessages();

      if (!this.validator.isValid()) {
        authUI.showError('Please fix the errors above');
        return;
      }

      const submitButton = document.getElementById('signup-button');
      authUI.showLoading(submitButton, 'Creating Account...');

      try {
        const formData = new FormData(form);
        const userData = {
          fullName: formData.get('fullName'),
          email: formData.get('email'),
          mobile: formData.get('mobile'),
          password: formData.get('password')
        };

        const response = await authAPI.signup(userData);
        authState.login(response.data.user, response.data.token, false);

        authUI.hideLoading(submitButton, 'Create Account');
        authUI.showSuccess('Account created successfully! Redirecting...');
        authUI.animateSuccess(form);
        authUI.redirectToDashboard();

      } catch (error) {
        authUI.hideLoading(submitButton, 'Create Account');
        authUI.showError(error.message || 'Failed to create account');
      }
    });
  }
}

// Global handler instance
const signupHandler = new SignupHandler();

// Initialize authentication when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Check if user is already logged in
  if (authState.isAuthenticated()) {
    window.location.href = 'dashboard.html';
    return;
  }

  // Initialize signup form
  signupHandler.init();
});

// Export for global access
window.AuthState = authState;
window.AuthAPI = authAPI;
window.AuthUI = authUI;
window.SignupHandler = signupHandler;