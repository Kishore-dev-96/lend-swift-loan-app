/**
 * LendSwift AI - Signup Page Initialization
 * Initializes all modules and functionality for the signup page
 */

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Initializing LendSwift AI Signup Page...');

  // Check if user is already logged in
  if (window.authStorage && window.authStorage.isAuthenticated()) {
    console.log('User already authenticated, redirecting to dashboard...');
    window.location.href = 'dashboard.html';
    return;
  }

  // Initialize theme
  initializeTheme();

  // Initialize form validation
  if (window.AuthValidator) {
    window.AuthValidator.initializeFormValidation('signup-form');
  }

  // Initialize authentication
  if (window.SignupHandler) {
    // Signup handler is already initialized in signup-auth.js
  }

  console.log('✅ Signup page initialized successfully');
});

// Theme initialization
function initializeTheme() {
  const savedTheme = window.authStorage ? window.authStorage.getTheme() : 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);

  // Add theme toggle if it exists
  const themeToggle = document.querySelector('[data-theme-toggle]');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';

      document.documentElement.setAttribute('data-theme', newTheme);
      if (window.authStorage) {
        window.authStorage.saveTheme(newTheme);
      }
    });
  }
}

// Add some CSS animations for the signup page
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

  .auth-button.success {
    animation: bounce 0.6s ease;
  }

  .status-message {
    animation: slideIn 0.3s ease-out;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;
document.head.appendChild(style);

// Add loading animation for button
const buttonLoaderStyle = document.createElement('style');
buttonLoaderStyle.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .spinner {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
`;
document.head.appendChild(buttonLoaderStyle);

// Error handling for missing dependencies
window.addEventListener('error', (e) => {
  console.error('Signup page error:', e.error);
  // Show user-friendly error message
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #ef4444;
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    font-family: 'Inter', sans-serif;
  `;
  errorDiv.textContent = 'Something went wrong. Please refresh the page.';
  document.body.appendChild(errorDiv);

  setTimeout(() => {
    errorDiv.remove();
  }, 5000);
});

// Performance monitoring
if ('performance' in window && 'timing' in performance) {
  window.addEventListener('load', () => {
    const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
    console.log(`Signup page loaded in ${loadTime}ms`);
  });
}