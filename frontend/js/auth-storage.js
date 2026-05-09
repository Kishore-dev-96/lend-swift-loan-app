/**
 * LendSwift AI - Authentication Storage Module
 * Handles localStorage operations for auth state management
 */

class AuthStorage {
  constructor() {
    this.prefix = 'lendswift_';
    this.authKey = 'auth';
    this.themeKey = 'theme';
    this.isStorageAvailable = this.checkStorageAvailability();
  }

  // Check if localStorage is available
  checkStorageAvailability() {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  // Get prefixed key
  getKey(key) {
    return this.prefix + key;
  }

  // Set item with error handling
  setItem(key, value) {
    if (!this.isStorageAvailable) {
      console.warn('localStorage is not available');
      return false;
    }

    try {
      const serializedValue = typeof value === 'object' ? JSON.stringify(value) : value;
      localStorage.setItem(this.getKey(key), serializedValue);
      return true;
    } catch (error) {
      console.error('Error saving to localStorage:', error);
      return false;
    }
  }

  // Get item with error handling
  getItem(key, defaultValue = null) {
    if (!this.isStorageAvailable) {
      console.warn('localStorage is not available');
      return defaultValue;
    }

    try {
      const value = localStorage.getItem(this.getKey(key));
      if (value === null) return defaultValue;

      // Try to parse as JSON, fallback to string
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return defaultValue;
    }
  }

  // Remove item
  removeItem(key) {
    if (!this.isStorageAvailable) return false;

    try {
      localStorage.removeItem(this.getKey(key));
      return true;
    } catch (error) {
      console.error('Error removing from localStorage:', error);
      return false;
    }
  }

  // Save authentication state
  saveAuthState(state) {
    return this.setItem(this.authKey, state);
  }

  // Get authentication state
  getAuthState() {
    return this.getItem(this.authKey, {
      isLoggedIn: false,
      user: null,
      token: null,
      sessionExpiry: null
    });
  }

  // Clear authentication state
  clearAuthState() {
    return this.removeItem(this.authKey);
  }

  // Check if user is authenticated
  isAuthenticated() {
    const authState = this.getAuthState();
    return authState.isLoggedIn &&
           authState.sessionExpiry &&
           new Date(authState.sessionExpiry) > new Date();
  }

  // Get current user
  getUser() {
    const authState = this.getAuthState();
    return authState.user;
  }

  // Get auth token
  getToken() {
    const authState = this.getAuthState();
    return authState.token;
  }

  // Login user
  login(userData, token, rememberMe = false) {
    const expiryTime = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000; // 30 days or 24 hours
    const authState = {
      isLoggedIn: true,
      user: userData,
      token: token,
      sessionExpiry: new Date(Date.now() + expiryTime).toISOString()
    };
    return this.saveAuthState(authState);
  }

  // Logout user
  logout() {
    return this.clearAuthState();
  }

  // Update user profile
  updateUser(userData) {
    const currentState = this.getAuthState();
    if (currentState.isLoggedIn) {
      currentState.user = { ...currentState.user, ...userData };
      return this.saveAuthState(currentState);
    }
    return false;
  }

  // Save theme preference
  saveTheme(theme) {
    return this.setItem(this.themeKey, theme);
  }

  // Get theme preference
  getTheme() {
    return this.getItem(this.themeKey, 'light');
  }

  // Clear all auth-related data
  clearAllAuthData() {
    this.clearAuthState();
    this.removeItem(this.themeKey);
    return true;
  }
}

// Global instance
const authStorage = new AuthStorage();

// Export for global access
window.AuthStorage = AuthStorage;
window.authStorage = authStorage;