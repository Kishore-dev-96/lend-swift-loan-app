/**
 * LendSwift AI - Auth Check Module
 * Handles session/authentication checking for protected routes
 */

const AuthCheck = (() => {
  const API_BASE = '/api/auth';

  /**
   * Check if user is currently authenticated
   */
  async function isAuthenticated() {
    try {
      const response = await fetch(`${API_BASE}/status`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      return data.authenticated === true;
    } catch (error) {
      console.error('Auth check error:', error);
      return false;
    }
  }

  /**
   * Get current user info if authenticated
   */
  async function getCurrentUser() {
    try {
      const response = await fetch(`${API_BASE}/status`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      if (data.authenticated === true && data.user) {
        return data.user;
      }
      return null;
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  }

  /**
   * Protect a route - redirect to login if not authenticated
   */
  async function protectRoute() {
    const isAuth = await isAuthenticated();
    if (!isAuth) {
      showToast('Please login to continue.', 'warning');
      setTimeout(() => {
        window.location.href = '/login.html';
      }, 1500);
      return false;
    }
    return true;
  }

  /**
   * Redirect to login with a message
   */
  function redirectToLogin(message = 'Please login to continue.') {
    if (message) {
      localStorage.setItem('auth_message', message);
    }
    window.location.href = '/login.html';
  }

  /**
   * Redirect to apply loan page with selected type
   */
  function redirectToApply(loanType = null) {
    if (loanType) {
      window.location.href = `/apply-loan.html?type=${loanType}`;
    } else {
      window.location.href = '/apply-loan.html';
    }
  }

  /**
   * Handle Apply button click with auth check
   */
  async function handleApplyClick(loanType = null) {
    const isAuth = await isAuthenticated();
    if (!isAuth) {
      showToast('Please login to continue loan application.', 'warning');
      setTimeout(() => {
        redirectToLogin('You must login before applying for loans.');
      }, 1500);
    } else {
      redirectToApply(loanType);
    }
  }

  return {
    isAuthenticated,
    getCurrentUser,
    protectRoute,
    redirectToLogin,
    redirectToApply,
    handleApplyClick
  };
})();

// Global toast function
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'alert');
  toast.textContent = message;
  toast.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
    color: white;
    padding: 15px 20px;
    border-radius: 8px;
    z-index: 1000;
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    animation: slideIn 0.3s ease;
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// Add animation
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;
document.head.appendChild(style);
