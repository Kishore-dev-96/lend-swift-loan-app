/**
 * AUTH API CLIENT
 * Handles secure backend communication for OTP login/signup flows.
 */

const AuthAPI = {
  csrfToken: null,

  async init() {
    if (this.csrfToken) {
      return this.csrfToken;
    }

    try {
      const response = await fetch('/api/auth/csrf-token', {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Unable to initialize authentication API');
      }

      const data = await response.json();
      this.csrfToken = data.csrf_token || null;
      return this.csrfToken;
    } catch (error) {
      console.error('AuthAPI.init error:', error);
      return null;
    }
  },

  async request(path, options = {}) {
    await this.init();

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.csrfToken) {
      headers['X-CSRF-Token'] = this.csrfToken;
    }

    const response = await fetch(path, {
      credentials: 'include',
      ...options,
      headers
    });

    let data;
    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      return {
        success: false,
        message: data?.error || data?.message || 'Unable to complete request',
        status: response.status,
      };
    }

    return {
      success: data?.success !== false,
      ...data
    };
  },

  post(path, payload = {}) {
    return this.request(path, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }
};

window.AuthAPI = AuthAPI;
