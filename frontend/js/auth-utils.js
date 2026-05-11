/**
 * LendSwift AI - Authentication Utilities
 * Core authentication functions and utilities
 */

// ====================================
// VALIDATION UTILITIES
// ====================================

const AuthUtils = {
  // Validate email format
  validateEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Validate mobile number (10 digits, starts with 6-9)
  validateMobile: (mobile) => {
    const mobileRegex = /^[6-9]\d{9}$/;
    return mobileRegex.test(mobile.toString().trim());
  },

  // Validate password (minimum 8 characters)
  validatePassword: (password) => {
    return password && password.length >= 8;
  },

  // Validate full name
  validateFullName: (name) => {
    return name && name.trim().length >= 2 && name.trim().length <= 50;
  },

  // Validate confirm password match
  validatePasswordMatch: (password, confirmPassword) => {
    return password === confirmPassword;
  },

  // Generate OTP (6-digit random number)
  generateOTP: () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },

  // Get OTP expiry time (2 minutes from now)
  getOTPExpiryTime: () => {
    return new Date(Date.now() + 2 * 60 * 1000);
  },

  // Check if OTP is expired
  isOTPExpired: (expiryTime) => {
    return new Date() > new Date(expiryTime);
  },

  // Generate unique user ID
  generateUserId: () => {
    return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  },

  // Generate session token
  generateSessionToken: () => {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  },

  // ====================================
  // USER DATABASE OPERATIONS
  // ====================================

  // Initialize users database if not exists
  initializeUsersDatabase: () => {
    const existingUsers = localStorage.getItem('lendSwiftUsers');
    if (!existingUsers) {
      localStorage.setItem('lendSwiftUsers', JSON.stringify([]));
    }
  },

  // Get all users from database
  getAllUsers: () => {
    try {
      const users = localStorage.getItem('lendSwiftUsers');
      return users ? JSON.parse(users) : [];
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  },

  // Save user permanently to database
  saveUser: (userData) => {
    try {
      AuthUtils.initializeUsersDatabase();
      const users = AuthUtils.getAllUsers();
      
      // Check for duplicate email
      if (users.some(u => u.email === userData.email)) {
        return { success: false, message: 'Email already registered' };
      }

      // Check for duplicate mobile
      if (users.some(u => u.mobile === userData.mobile)) {
        return { success: false, message: 'Mobile number already registered' };
      }

      // Create user object
      const user = {
        id: AuthUtils.generateUserId(),
        fullName: userData.fullName,
        mobile: userData.mobile,
        email: userData.email,
        password: userData.password, // In production, this should be hashed
        verified: true,
        createdAt: new Date().toISOString()
      };

      users.push(user);
      localStorage.setItem('lendSwiftUsers', JSON.stringify(users));

      return { success: true, user, message: 'User created successfully' };
    } catch (error) {
      console.error('Error saving user:', error);
      return { success: false, message: 'Error creating user' };
    }
  },

  // Find user by email
  findUserByEmail: (email) => {
    const users = AuthUtils.getAllUsers();
    return users.find(u => u.email === email);
  },

  // Find user by mobile
  findUserByMobile: (mobile) => {
    const users = AuthUtils.getAllUsers();
    return users.find(u => u.mobile === mobile);
  },

  // Find user by email or mobile
  findUser: (emailOrMobile) => {
    const users = AuthUtils.getAllUsers();
    return users.find(u => u.email === emailOrMobile || u.mobile === emailOrMobile);
  },

  // Verify password
  verifyPassword: (user, password) => {
    return user.password === password;
  },

  // Delete user (for testing)
  deleteUser: (email) => {
    try {
      const users = AuthUtils.getAllUsers();
      const filteredUsers = users.filter(u => u.email !== email);
      localStorage.setItem('lendSwiftUsers', JSON.stringify(filteredUsers));
      return { success: true, message: 'User deleted' };
    } catch (error) {
      console.error('Error deleting user:', error);
      return { success: false, message: 'Error deleting user' };
    }
  },

  // ====================================
  // TEMPORARY SIGNUP DATA
  // ====================================

  // Save temporary signup data (with OTP)
  saveTemporarySignupData: (data) => {
    try {
      localStorage.setItem('lendSwiftTempSignup', JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Error saving temp signup data:', error);
      return false;
    }
  },

  // Get temporary signup data
  getTemporarySignupData: () => {
    try {
      const data = localStorage.getItem('lendSwiftTempSignup');
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting temp signup data:', error);
      return null;
    }
  },

  // Clear temporary signup data
  clearTemporarySignupData: () => {
    try {
      localStorage.removeItem('lendSwiftTempSignup');
      return true;
    } catch (error) {
      console.error('Error clearing temp signup data:', error);
      return false;
    }
  },

  // ====================================
  // SESSION MANAGEMENT
  // ====================================

  // Create user session
  createSession: (user) => {
    try {
      const sessionData = {
        loggedIn: true,
        userId: user.id,
        fullName: user.fullName,
        email: user.email,
        mobile: user.mobile,
        loginTime: new Date().toISOString(),
        sessionToken: AuthUtils.generateSessionToken()
      };

      localStorage.setItem('lendSwiftSession', JSON.stringify(sessionData));
      return sessionData;
    } catch (error) {
      console.error('Error creating session:', error);
      return null;
    }
  },

  // Get current session
  getSession: () => {
    try {
      const session = localStorage.getItem('lendSwiftSession');
      return session ? JSON.parse(session) : null;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  },

  // Check if session is valid
  isSessionValid: () => {
    const session = AuthUtils.getSession();
    return session && session.loggedIn === true;
  },

  // Clear session (logout)
  clearSession: () => {
    try {
      localStorage.removeItem('lendSwiftSession');
      return true;
    } catch (error) {
      console.error('Error clearing session:', error);
      return false;
    }
  },

  // ====================================
  // FORGOT PASSWORD
  // ====================================

  // Save forgot password temporary data
  saveForgotPasswordData: (data) => {
    try {
      localStorage.setItem('lendSwiftForgotPassword', JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Error saving forgot password data:', error);
      return false;
    }
  },

  // Get forgot password data
  getForgotPasswordData: () => {
    try {
      const data = localStorage.getItem('lendSwiftForgotPassword');
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting forgot password data:', error);
      return null;
    }
  },

  // Clear forgot password data
  clearForgotPasswordData: () => {
    try {
      localStorage.removeItem('lendSwiftForgotPassword');
      return true;
    } catch (error) {
      console.error('Error clearing forgot password data:', error);
      return false;
    }
  },

  // Update user password
  updateUserPassword: (email, newPassword) => {
    try {
      const users = AuthUtils.getAllUsers();
      const userIndex = users.findIndex(u => u.email === email);

      if (userIndex === -1) {
        return { success: false, message: 'User not found' };
      }

      users[userIndex].password = newPassword;
      localStorage.setItem('lendSwiftUsers', JSON.stringify(users));

      return { success: true, message: 'Password updated successfully' };
    } catch (error) {
      console.error('Error updating password:', error);
      return { success: false, message: 'Error updating password' };
    }
  },

  // ====================================
  // OTP MANAGEMENT
  // ====================================

  // Save OTP data
  saveOTPData: (data) => {
    try {
      localStorage.setItem('lendSwiftOTPData', JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Error saving OTP data:', error);
      return false;
    }
  },

  // Get OTP data
  getOTPData: () => {
    try {
      const data = localStorage.getItem('lendSwiftOTPData');
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting OTP data:', error);
      return null;
    }
  },

  // Clear OTP data
  clearOTPData: () => {
    try {
      localStorage.removeItem('lendSwiftOTPData');
      return true;
    } catch (error) {
      console.error('Error clearing OTP data:', error);
      return false;
    }
  },

  // Verify OTP
  verifyOTP: (enteredOTP, storedOTPData) => {
    if (!storedOTPData) {
      return { success: false, message: 'No OTP request found' };
    }

    // Check if OTP is expired
    if (AuthUtils.isOTPExpired(storedOTPData.expiryTime)) {
      return { success: false, message: 'OTP has expired' };
    }

    // Check if max attempts reached
    if (storedOTPData.failedAttempts >= 3) {
      return { success: false, message: 'Maximum OTP attempts exceeded. Please request a new OTP.' };
    }

    // Verify OTP
    if (enteredOTP === storedOTPData.otp) {
      return { success: true, message: 'OTP verified successfully' };
    }

    return { success: false, message: 'Invalid OTP' };
  },

  // Increment OTP failed attempts
  incrementOTPFailedAttempts: () => {
    const otpData = AuthUtils.getOTPData();
    if (otpData) {
      otpData.failedAttempts = (otpData.failedAttempts || 0) + 1;
      AuthUtils.saveOTPData(otpData);
    }
  },

  // ====================================
  // UI UTILITIES
  // ====================================

  // Show error message
  showError: (message) => {
    const container = document.getElementById('status-container');
    if (container) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'status-message error-message';
      errorDiv.textContent = message;
      container.innerHTML = '';
      container.appendChild(errorDiv);
      container.style.display = 'block';
    }
  },

  // Show success message
  showSuccess: (message) => {
    const container = document.getElementById('status-container');
    if (container) {
      const successDiv = document.createElement('div');
      successDiv.className = 'status-message success-message';
      successDiv.textContent = message;
      container.innerHTML = '';
      container.appendChild(successDiv);
      container.style.display = 'block';
    }
  },

  // Show info message
  showInfo: (message) => {
    const container = document.getElementById('status-container');
    if (container) {
      const infoDiv = document.createElement('div');
      infoDiv.className = 'status-message info-message';
      infoDiv.textContent = message;
      container.innerHTML = '';
      container.appendChild(infoDiv);
      container.style.display = 'block';
    }
  },

  // Clear status messages
  clearStatus: () => {
    const container = document.getElementById('status-container');
    if (container) {
      container.innerHTML = '';
      container.style.display = 'none';
    }
  },

  // ====================================
  // FORM UTILITIES
  // ====================================

  // Get form data
  getFormData: (formElement) => {
    const formData = new FormData(formElement);
    const data = {};
    for (let [key, value] of formData.entries()) {
      data[key] = value;
    }
    return data;
  },

  // Clear form
  clearForm: (formElement) => {
    formElement.reset();
    const errorMessages = formElement.querySelectorAll('.error-message');
    errorMessages.forEach(msg => {
      msg.textContent = '';
      msg.classList.remove('show');
    });

    const inputs = formElement.querySelectorAll('input');
    inputs.forEach(input => {
      input.classList.remove('error');
    });
  },

  // Disable form button
  disableFormButton: (buttonElement) => {
    buttonElement.disabled = true;
    buttonElement.style.opacity = '0.6';
    buttonElement.style.cursor = 'not-allowed';
  },

  // Enable form button
  enableFormButton: (buttonElement) => {
    buttonElement.disabled = false;
    buttonElement.style.opacity = '1';
    buttonElement.style.cursor = 'pointer';
  }
};

// Export for global access
window.AuthUtils = AuthUtils;
