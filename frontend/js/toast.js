/**
 * ============================================
 * LENDSWIFT AI - TOAST NOTIFICATION SYSTEM
 * Manages user feedback messages
 * ============================================
 */

const Toast = (() => {
  // Configuration
  const CONFIG = {
    DEFAULT_DURATION: 3000,
    ANIMATION_DURATION: 300,
  };

  // Toast queue for managing multiple toasts
  let toastQueue = [];
  let toastContainer = null;

  /**
   * Initialize the toast container
   */
  const init = () => {
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.className = 'toast-container';
      document.body.appendChild(toastContainer);
    }
  };

  /**
   * Create and display a toast notification
   * @param {string} type - Type of toast: 'success', 'error', 'warning', 'info'
   * @param {string} title - Toast title
   * @param {string} message - Toast message (optional)
   * @param {number} duration - Display duration in ms (optional)
   */
  const show = (type, title, message = '', duration = CONFIG.DEFAULT_DURATION) => {
    init();

    const toastId = `toast-${Date.now()}-${Math.random()}`;
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.id = toastId;

    // Icon mapping
    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ',
    };

    const icon = icons[type] || icons.info;

    toast.innerHTML = `
      <div class="toast-icon">${icon}</div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        ${message ? `<div class="toast-message">${message}</div>` : ''}
      </div>
      <button class="toast-close" aria-label="Close notification">×</button>
    `;

    // Add close button event listener
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => dismiss(toastId));

    // Add to container
    toastContainer.appendChild(toast);
    toastQueue.push(toastId);

    // Auto-dismiss after duration
    if (duration > 0) {
      setTimeout(() => dismiss(toastId), duration);
    }

    return toastId;
  };

  /**
   * Dismiss a specific toast
   * @param {string} toastId - ID of the toast to dismiss
   */
  const dismiss = (toastId) => {
    const toast = document.getElementById(toastId);
    if (!toast) return;

    // Add removing animation
    toast.classList.add('removing');

    // Remove from DOM after animation
    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
      toastQueue = toastQueue.filter((id) => id !== toastId);
    }, CONFIG.ANIMATION_DURATION);
  };

  /**
   * Dismiss all toasts
   */
  const dismissAll = () => {
    toastQueue.forEach((toastId) => {
      const toast = document.getElementById(toastId);
      if (toast) toast.remove();
    });
    toastQueue = [];
  };

  /**
   * Show success toast
   * @param {string} title - Toast title
   * @param {string} message - Toast message (optional)
   * @param {number} duration - Display duration in ms (optional)
   */
  const success = (title, message = '', duration = CONFIG.DEFAULT_DURATION) => {
    return show('success', title, message, duration);
  };

  /**
   * Show error toast
   * @param {string} title - Toast title
   * @param {string} message - Toast message (optional)
   * @param {number} duration - Display duration in ms (optional)
   */
  const error = (title, message = '', duration = CONFIG.DEFAULT_DURATION) => {
    return show('error', title, message, duration);
  };

  /**
   * Show warning toast
   * @param {string} title - Toast title
   * @param {string} message - Toast message (optional)
   * @param {number} duration - Display duration in ms (optional)
   */
  const warning = (title, message = '', duration = CONFIG.DEFAULT_DURATION) => {
    return show('warning', title, message, duration);
  };

  /**
   * Show info toast
   * @param {string} title - Toast title
   * @param {string} message - Toast message (optional)
   * @param {number} duration - Display duration in ms (optional)
   */
  const info = (title, message = '', duration = CONFIG.DEFAULT_DURATION) => {
    return show('info', title, message, duration);
  };

  /**
   * Show loading toast (persistent until dismissed)
   * @param {string} title - Toast title
   * @param {string} message - Toast message (optional)
   */
  const loading = (title, message = '') => {
    init();
    const toastId = `toast-${Date.now()}-${Math.random()}`;
    const toast = document.createElement('div');
    toast.className = 'toast-notification toast-info';
    toast.id = toastId;

    toast.innerHTML = `
      <div class="toast-icon loading-spinner"></div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        ${message ? `<div class="toast-message">${message}</div>` : ''}
      </div>
    `;

    toastContainer.appendChild(toast);
    toastQueue.push(toastId);

    return toastId;
  };

  /**
   * Update an existing toast
   * @param {string} toastId - ID of the toast to update
   * @param {object} options - Options: {title, message, type}
   */
  const update = (toastId, options = {}) => {
    const toast = document.getElementById(toastId);
    if (!toast) return;

    if (options.type) {
      const oldType = Array.from(toast.classList).find((cls) => cls.startsWith('toast-'));
      if (oldType) {
        toast.classList.remove(oldType);
      }
      toast.classList.add(`toast-${options.type}`);
    }

    if (options.title) {
      const titleEl = toast.querySelector('.toast-title');
      if (titleEl) titleEl.textContent = options.title;
    }

    if (options.message) {
      let messageEl = toast.querySelector('.toast-message');
      if (!messageEl) {
        messageEl = document.createElement('div');
        messageEl.className = 'toast-message';
        toast.querySelector('.toast-content').appendChild(messageEl);
      }
      messageEl.textContent = options.message;
    }
  };

  // Public API
  return {
    show,
    dismiss,
    dismissAll,
    success,
    error,
    warning,
    info,
    loading,
    update,
  };
})();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Toast;
}
