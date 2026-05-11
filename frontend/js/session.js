/**
 * LendSwift AI - Session Management Module
 * Handles user session persistence and validation
 */

class SessionManager {
  constructor() {
    this.SESSION_KEY = 'lendSwiftSession';
    this.CHECK_INTERVAL = 60000; // Check every minute
    this.init();
  }

  // Initialize session manager
  init() {
    // Check session validity on page load
    this.validateSessionOnLoad();

    // Start periodic session check
    this.startSessionCheck();

    // Add event listeners for session events
    window.addEventListener('beforeunload', () => this.onPageUnload());
    document.addEventListener('visibilitychange', () => this.onVisibilityChange());
  }

  // Validate session on page load
  validateSessionOnLoad() {
    const session = this.getSession();
    
    if (!session) {
      console.log('No active session found');
      return false;
    }

    if (!this.isSessionValid(session)) {
      console.log('Session expired');
      this.logout();
      return false;
    }

    return true;
  }

  // Get current session
  getSession() {
    try {
      const session = localStorage.getItem(this.SESSION_KEY);
      return session ? JSON.parse(session) : null;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  // Check if session is valid
  isSessionValid(session) {
    if (!session || !session.loggedIn) {
      return false;
    }

    // Add session duration check if needed
    // const loginTime = new Date(session.loginTime);
    // const currentTime = new Date();
    // const durationMs = currentTime - loginTime;
    // const MAX_SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
    // return durationMs < MAX_SESSION_DURATION;

    return true;
  }

  // Create session
  createSession(user) {
    const session = {
      loggedIn: true,
      userId: user.id,
      fullName: user.fullName,
      email: user.email,
      mobile: user.mobile,
      loginTime: new Date().toISOString(),
      sessionToken: AuthUtils.generateSessionToken()
    };

    try {
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
      console.log('✓ Session created for:', user.email);
      return session;
    } catch (error) {
      console.error('Error creating session:', error);
      return null;
    }
  }

  // Update session
  updateSession(updates) {
    const session = this.getSession();
    if (!session) return null;

    const updatedSession = { ...session, ...updates };
    try {
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(updatedSession));
      return updatedSession;
    } catch (error) {
      console.error('Error updating session:', error);
      return null;
    }
  }

  // Get current user
  getCurrentUser() {
    const session = this.getSession();
    if (!session || !session.loggedIn) return null;

    return {
      userId: session.userId,
      fullName: session.fullName,
      email: session.email,
      mobile: session.mobile
    };
  }

  // Check if user is authenticated
  isAuthenticated() {
    const session = this.getSession();
    return session && session.loggedIn === true;
  }

  // Logout user
  logout() {
    try {
      localStorage.removeItem(this.SESSION_KEY);
      console.log('✓ Session cleared - User logged out');
      
      // Dispatch custom event for logout
      const event = new CustomEvent('userLogout');
      document.dispatchEvent(event);
      
      return true;
    } catch (error) {
      console.error('Error logging out:', error);
      return false;
    }
  }

  // Refresh session
  refreshSession() {
    const session = this.getSession();
    if (!session) return false;

    const updated = {
      ...session,
      lastRefreshed: new Date().toISOString()
    };

    try {
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(updated));
      return true;
    } catch (error) {
      console.error('Error refreshing session:', error);
      return false;
    }
  }

  // Start periodic session check
  startSessionCheck() {
    this.checkInterval = setInterval(() => {
      const session = this.getSession();
      if (session && !this.isSessionValid(session)) {
        console.log('Session became invalid - logging out');
        this.logout();
      }
    }, this.CHECK_INTERVAL);
  }

  // Stop session check
  stopSessionCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }

  // Handle page visibility change
  onVisibilityChange() {
    if (document.hidden) {
      // Page hidden - pause session check
      this.stopSessionCheck();
    } else {
      // Page visible again - resume session check
      this.startSessionCheck();

      // Validate session is still active
      if (!this.validateSessionOnLoad()) {
        console.log('Session invalid after page visibility change');
      }
    }
  }

  // Handle page unload
  onPageUnload() {
    this.stopSessionCheck();
  }
}

// Create global session manager instance
const sessionManager = new SessionManager();

// Export for global access
window.SessionManager = SessionManager;
window.sessionManager = sessionManager;

/**
 * ROUTE PROTECTION
 * Automatically redirect unauthenticated users
 */

document.addEventListener('DOMContentLoaded', () => {
  // List of protected pages
  const protectedPages = ['dashboard.html', 'loan-application.html', 'profile.html'];

  // Get current page
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  // Check if current page is protected
  if (protectedPages.some(page => currentPage.includes(page))) {
    // Verify user is authenticated
    if (!sessionManager.isAuthenticated()) {
      console.log('🔒 Redirecting to login - No active session');
      window.location.href = 'login.html';
      return;
    }

    // Get and display current user info
    const user = sessionManager.getCurrentUser();
    if (user) {
      console.log('✓ User authenticated:', user.fullName);

      // Update header with user info if welcome section exists
      const welcomeName = document.querySelector('[data-user-name]');
      if (welcomeName) {
        welcomeName.textContent = user.fullName;
      }

      // Update user email if it exists
      const userEmail = document.querySelector('[data-user-email]');
      if (userEmail) {
        userEmail.textContent = user.email;
      }
    }
  }
});

/**
 * LOGOUT HANDLER
 * Handle logout button clicks
 */

document.addEventListener('DOMContentLoaded', () => {
  const logoutButtons = document.querySelectorAll('[data-logout-btn], .logout-btn');

  logoutButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();

      // Confirm logout
      if (confirm('Are you sure you want to logout?')) {
        sessionManager.logout();
        window.location.href = 'login.html';
      }
    });
  });
});
