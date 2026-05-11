/**
 * LendSwift AI - Dashboard Handler
 * Manages dashboard display and user data
 */

// Dashboard Manager
class DashboardManager {
  constructor() {
    this.user = null;
    this.applications = [];
  }

  // Initialize dashboard
  init() {
    this.checkAuthentication();
    this.loadUserData();
    this.renderDashboard();
    this.setupEventListeners();
  }

  // Check if user is authenticated
  checkAuthentication() {
    if (!window.authStorage) {
      console.error('Auth storage not available');
      this.redirectToLogin();
      return;
    }

    const authState = window.authStorage.getAuthState();
    if (!authState || !authState.isLoggedIn) {
      this.redirectToLogin();
      return;
    }

    // Check session expiry
    if (authState.sessionExpiry && new Date(authState.sessionExpiry) <= new Date()) {
      window.authStorage.clearAuthState();
      this.redirectToLogin();
      return;
    }

    this.user = authState.user;
  }

  // Redirect to login
  redirectToLogin() {
    window.location.href = 'login.html';
  }

  // Load user data and applications
  loadUserData() {
    if (!this.user) return;

    // Load applications from localStorage or simulate data
    const savedApplications = localStorage.getItem(`applications_${this.user.id}`);
    if (savedApplications) {
      try {
        this.applications = JSON.parse(savedApplications);
      } catch (error) {
        console.error('Error loading applications:', error);
        this.applications = [];
      }
    } else {
      // Simulate some demo applications for demo user
      if (this.user.email === 'demo@lendswift.ai') {
        this.applications = [
          {
            id: 1,
            type: 'Personal Loan',
            amount: 50000,
            status: 'approved',
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 2,
            type: 'Home Loan',
            amount: 2000000,
            status: 'pending',
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date().toISOString()
          }
        ];
      }
    }
  }

  // Render dashboard content
  renderDashboard() {
    this.renderUserInfo();
    this.renderStats();
    this.renderApplications();
    this.renderKYCStatus();
  }

  // Render user information
  renderUserInfo() {
    const userNameEl = document.getElementById('user-name');
    if (userNameEl && this.user) {
      userNameEl.textContent = this.user.fullName || 'User';
    }
  }

  // Render statistics
  renderStats() {
    const totalApps = this.applications.length;
    const pendingApps = this.applications.filter(app => app.status === 'pending').length;
    const approvedApps = this.applications.filter(app => app.status === 'approved').length;
    const totalAmount = this.applications
      .filter(app => app.status === 'approved')
      .reduce((sum, app) => sum + (app.amount || 0), 0);

    document.getElementById('total-applications').textContent = totalApps;
    document.getElementById('pending-applications').textContent = pendingApps;
    document.getElementById('approved-applications').textContent = approvedApps;
    document.getElementById('total-loan-amount').textContent = `$${totalAmount.toLocaleString()}`;
  }

  // Render applications list
  renderApplications() {
    const container = document.getElementById('applications-list');
    if (!container) return;

    if (this.applications.length === 0) {
      // Empty state is already in HTML
      return;
    }

    const applicationsHTML = this.applications
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 3) // Show only recent 3
      .map(app => `
        <div class="application-card">
          <div class="application-header">
            <h4>${app.type}</h4>
            <span class="application-status status-${app.status}">${app.status}</span>
          </div>
          <div class="application-details">
            <div class="application-amount">$${app.amount.toLocaleString()}</div>
            <div class="application-date">${new Date(app.createdAt).toLocaleDateString()}</div>
          </div>
        </div>
      `).join('');

    container.innerHTML = applicationsHTML;
  }

  // Render KYC status
  renderKYCStatus() {
    const statusEl = document.getElementById('kyc-status-text');
    const progressBar = document.getElementById('kyc-progress-bar');
    const progressFill = document.getElementById('kyc-progress-fill');

    if (!statusEl || !progressBar || !progressFill) return;

    const kycStatus = this.user?.kycStatus || 'pending';
    let statusText = '';
    let progressPercent = 0;

    switch (kycStatus) {
      case 'completed':
        statusText = 'Verified ✓';
        progressPercent = 100;
        break;
      case 'in_review':
        statusText = 'Under Review';
        progressPercent = 75;
        break;
      case 'pending':
        statusText = 'Pending Verification';
        progressPercent = 25;
        break;
      default:
        statusText = 'Not Started';
        progressPercent = 0;
    }

    statusEl.textContent = statusText;
    progressFill.style.width = `${progressPercent}%`;

    // Update card styling based on status
    const card = document.getElementById('kyc-status');
    if (card) {
      card.className = `kyc-status-card kyc-${kycStatus}`;
    }
  }

  // Setup event listeners
  setupEventListeners() {
    // Logout functionality
    const logoutLink = document.getElementById('logout-link');
    if (logoutLink) {
      logoutLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.logout();
      });
    }
  }

  // Logout user
  async logout() {
    try {
      await AuthAPI.post('/api/auth/logout');
    } catch (error) {
      console.warn('Logout request failed:', error);
    }

    if (window.authStorage) {
      window.authStorage.clearAuthState();
    }
    this.redirectToLogin();
  }
}

// Global dashboard instance
const dashboardManager = new DashboardManager();

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('📊 Initializing LendSwift AI Dashboard...');

  dashboardManager.init();

  console.log('✅ Dashboard initialized successfully');
});

// Add dashboard-specific CSS
const dashboardStyle = document.createElement('style');
dashboardStyle.textContent = `
  .dashboard-main {
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 80px 0 40px;
  }

  .dashboard-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
  }

  .dashboard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 40px;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    padding: 32px;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .welcome-section h1 {
    font-size: 2.5rem;
    font-weight: 700;
    color: white;
    margin: 0 0 8px 0;
  }

  .welcome-section p {
    color: rgba(255, 255, 255, 0.8);
    font-size: 1.1rem;
    margin: 0;
  }

  .quick-actions {
    display: flex;
    gap: 16px;
  }

  .action-button {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    border-radius: 12px;
    text-decoration: none;
    font-weight: 600;
    transition: all 0.3s ease;
  }

  .action-button.primary {
    background: #4f46e5;
    color: white;
    box-shadow: 0 4px 15px rgba(79, 70, 229, 0.3);
  }

  .action-button.primary:hover {
    background: #4338ca;
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(79, 70, 229, 0.4);
  }

  .action-button.secondary {
    background: rgba(255, 255, 255, 0.1);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.3);
  }

  .action-button.secondary:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 24px;
    margin-bottom: 40px;
  }

  .stat-card {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 16px;
    padding: 24px;
    display: flex;
    align-items: center;
    gap: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .stat-icon {
    font-size: 2rem;
    width: 60px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea, #764ba2);
    border-radius: 12px;
    color: white;
  }

  .stat-content h3 {
    font-size: 2rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 4px 0;
  }

  .stat-content p {
    color: #6b7280;
    margin: 0;
    font-weight: 500;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }

  .section-header h2 {
    font-size: 1.8rem;
    font-weight: 700;
    color: white;
    margin: 0;
  }

  .view-all-link {
    color: rgba(255, 255, 255, 0.8);
    text-decoration: none;
    font-weight: 500;
    transition: color 0.3s ease;
  }

  .view-all-link:hover {
    color: white;
  }

  .applications-section,
  .kyc-section {
    margin-bottom: 40px;
  }

  .applications-list {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  }

  .empty-state {
    text-align: center;
    padding: 40px 20px;
  }

  .empty-icon {
    font-size: 3rem;
    margin-bottom: 16px;
  }

  .empty-state h3 {
    color: #374151;
    margin: 0 0 8px 0;
    font-size: 1.5rem;
  }

  .empty-state p {
    color: #6b7280;
    margin: 0 0 24px 0;
  }

  .application-card {
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 16px;
    background: white;
    transition: all 0.3s ease;
  }

  .application-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }

  .application-card:last-child {
    margin-bottom: 0;
  }

  .application-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .application-header h4 {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: #1f2937;
  }

  .application-status {
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .status-approved {
    background: #dcfce7;
    color: #166534;
  }

  .status-pending {
    background: #fef3c7;
    color: #92400e;
  }

  .status-rejected {
    background: #fee2e2;
    color: #991b1b;
  }

  .application-details {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .application-amount {
    font-size: 1.3rem;
    font-weight: 700;
    color: #4f46e5;
  }

  .application-date {
    color: #6b7280;
    font-size: 0.9rem;
  }

  .kyc-status-card {
    background: rgba(255, 255, 255, 0.95);
    border-radius: 16px;
    padding: 24px;
    display: flex;
    align-items: center;
    gap: 20px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  }

  .kyc-completed {
    border-left: 4px solid #10b981;
  }

  .kyc-in_review {
    border-left: 4px solid #f59e0b;
  }

  .kyc-pending {
    border-left: 4px solid #ef4444;
  }

  .kyc-icon {
    font-size: 2.5rem;
  }

  .kyc-content h3 {
    font-size: 1.3rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 8px 0;
  }

  .kyc-content p {
    color: #6b7280;
    margin: 0 0 16px 0;
    font-weight: 500;
  }

  .kyc-progress {
    width: 100%;
    max-width: 200px;
  }

  .progress-bar {
    height: 8px;
    background: #e5e7eb;
    border-radius: 4px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #4f46e5, #7c3aed);
    border-radius: 4px;
    transition: width 0.3s ease;
  }

  @media (max-width: 768px) {
    .dashboard-header {
      flex-direction: column;
      text-align: center;
      gap: 24px;
    }

    .welcome-section h1 {
      font-size: 2rem;
    }

    .quick-actions {
      flex-direction: column;
      width: 100%;
    }

    .action-button {
      justify-content: center;
    }

    .stats-grid {
      grid-template-columns: 1fr;
    }

    .section-header {
      flex-direction: column;
      gap: 12px;
      text-align: center;
    }

    .application-details {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }

    .kyc-status-card {
      flex-direction: column;
      text-align: center;
    }

    .kyc-progress {
      max-width: none;
    }
  }
`;
document.head.appendChild(dashboardStyle);

// Export for global access
window.DashboardManager = dashboardManager;