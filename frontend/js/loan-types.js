/**
 * LendSwift AI - Loan Types Page
 * Displays available loan products with details and apply functionality
 */

class LoanTypesPage {
  constructor() {
    this.loanData = [
      {
        id: 'personal',
        icon: '👤',
        title: 'Personal Loan',
        description: 'Flexible unsecured loan for personal needs',
        interestRate: '9.99% - 18.99%',
        loanAmount: '₹50,000 - ₹25,00,000',
        emiStart: '₹4,249'
      },
      {
        id: 'home',
        icon: '🏠',
        title: 'Home Loan',
        description: 'Affordable financing for your dream home',
        interestRate: '6.50% - 9.50%',
        loanAmount: '₹5,00,000 - ₹1 Cr',
        emiStart: '₹41,865'
      },
      {
        id: 'education',
        icon: '📚',
        title: 'Education Loan',
        description: 'Support your educational aspirations',
        interestRate: '8.00% - 13.00%',
        loanAmount: '₹2,00,000 - ₹50,00,000',
        emiStart: '₹12,500'
      },
      {
        id: 'vehicle',
        icon: '🚗',
        title: 'Vehicle Loan',
        description: 'Drive your dream car with easy financing',
        interestRate: '8.50% - 14.50%',
        loanAmount: '₹1,00,000 - ₹30,00,000',
        emiStart: '₹8,754'
      },
      {
        id: 'business',
        icon: '💼',
        title: 'Business Loan',
        description: 'Grow your business with working capital',
        interestRate: '10.99% - 20.00%',
        loanAmount: '₹5,00,000 - ₹1 Cr',
        emiStart: '₹15,000'
      },
      {
        id: 'gold',
        icon: '✨',
        title: 'Gold Loan',
        description: 'Quick cash against your gold at low interest',
        interestRate: '7.50% - 12.99%',
        loanAmount: '₹10,000 - ₹50,00,000',
        emiStart: '₹2,500'
      }
    ];

    this.authStorage = new AuthStorage();
    this.init();
  }

  init() {
    this.renderLoanCards();
    this.setupEventListeners();
    this.updateNavigation();
  }

  renderLoanCards() {
    const container = document.getElementById('loan-cards-container');
    container.innerHTML = this.loanData
      .map(loan => `
        <div class="loan-card" data-loan-id="${loan.id}">
          <div class="loan-card-header">
            <div class="loan-card-icon">${loan.icon}</div>
            <h3 class="loan-card-title">${loan.title}</h3>
          </div>
          <p class="loan-card-description">${loan.description}</p>
          
          <div class="loan-details">
            <div class="detail-item">
              <span class="detail-label">Interest Rate</span>
              <span class="detail-value">${loan.interestRate}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Loan Amount</span>
              <span class="detail-value">${loan.loanAmount}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">EMI From</span>
              <span class="detail-value">${loan.emiStart}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Tenure</span>
              <span class="detail-value">6-60 months</span>
            </div>
          </div>
          
          <button class="apply-btn" data-apply-loan="${loan.id}">
            Apply Now
          </button>
        </div>
      `)
      .join('');
  }

  setupEventListeners() {
    const applyButtons = document.querySelectorAll('[data-apply-loan]');
    applyButtons.forEach(btn => {
      btn.addEventListener('click', (e) => this.handleApply(e));
    });
  }

  async handleApply(e) {
    e.preventDefault();
    const loanId = e.target.getAttribute('data-apply-loan');
    const btn = e.target;

    // Show loading state
    btn.classList.add('loading');
    btn.textContent = 'Checking...';

    try {
      // Check if user is logged in using AuthCheck module
      const isAuth = await AuthCheck.isAuthenticated();

      if (isAuth) {
        // User is logged in, redirect to apply page
        window.location.href = `/apply-loan.html?type=${loanId}`;
      } else {
        // User not logged in, redirect to login
        this.showToast('Please login to continue loan application.', 'warning');
        setTimeout(() => {
          window.location.href = '/login.html';
        }, 1500);
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
      this.showToast('Error processing your request. Please try again.', 'error');
      btn.classList.remove('loading');
      btn.textContent = 'Apply Now';
    }
  }

  showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3000);
  }

  updateNavigation() {
    const authState = this.authStorage.getAuthState();
    const loginBtn = document.getElementById('navbar-login-btn');
    const signupBtn = document.getElementById('navbar-signup-btn');

    if (authState.isLoggedIn && authState.user) {
      // Hide login/signup buttons if logged in
      if (loginBtn) loginBtn.style.display = 'none';
      if (signupBtn) signupBtn.style.display = 'none';
    }
  }
}

// Initialize on document ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new LoanTypesPage();
  });
} else {
  new LoanTypesPage();
}
