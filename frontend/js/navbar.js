/**
 * LendSwift AI - Responsive Navbar Module
 * Handles mobile menu, sticky behavior, and navigation
 * Production-grade fintech navigation
 */

class Navbar {
  constructor() {
    this.navbar = document.querySelector('[data-navbar]');
    this.menuToggle = document.querySelector('[data-menu-toggle]');
    this.navLinks = document.querySelector('[data-nav-links]');
    this.isMenuOpen = false;
    this.lastScrollY = 0;

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupScrollBehavior();
    this.setupKeyboardNavigation();
    this.handleNavigation();
  }

  setupEventListeners() {
    // Mobile menu toggle
    if (this.menuToggle && this.navLinks) {
      this.menuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleMenu();
      });
    }

    // Close menu when clicking links
    const links = this.navLinks?.querySelectorAll('a');
    links?.forEach(link => {
      link.addEventListener('click', (e) => {
        // Only close for anchor links, not external navigations
        if (link.getAttribute('href').startsWith('#')) {
          this.closeMenu();
          this.setActiveLink(link);
        }
      });
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!this.navbar?.contains(e.target)) {
        this.closeMenu();
      }
    });

    // Close menu on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isMenuOpen) {
        this.closeMenu();
      }
    });
  }

  setupScrollBehavior() {
    window.addEventListener('scroll', () => {
      const currentScrollY = window.scrollY;

      // Add scrolled class for styling
      if (this.navbar) {
        this.navbar.classList.toggle('scrolled', currentScrollY > 20);
      }

      // Update active link based on scroll position
      this.updateActiveLink();

      this.lastScrollY = currentScrollY;
    });
  }

  setupKeyboardNavigation() {
    // Keyboard navigation for mobile menu
    if (this.navLinks) {
      const focusableElements = this.navLinks.querySelectorAll('a, button');
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      this.navLinks.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              e.preventDefault();
              this.menuToggle?.focus();
            }
          } else {
            if (document.activeElement === lastElement) {
              e.preventDefault();
              this.closeMenu();
              this.menuToggle?.focus();
            }
          }
        }
      });
    }
  }

  handleNavigation() {
    // Handle login button
    const loginBtn = document.getElementById('home-login-btn');
    if (loginBtn) {
      loginBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'login.html';
      });
    }

    // Handle signup button
    const signupBtn = document.getElementById('home-signup-btn');
    if (signupBtn) {
      signupBtn.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'signup.html';
      });
    }
  }

  toggleMenu() {
    if (!this.navLinks || !this.menuToggle) return;

    this.isMenuOpen = !this.isMenuOpen;

    // Toggle menu visibility
    this.navLinks.classList.toggle('open', this.isMenuOpen);
    this.navLinks.classList.toggle('active', this.isMenuOpen);
    this.menuToggle.classList.toggle('active', this.isMenuOpen);
    document.body.classList.toggle('menu-open', this.isMenuOpen);

    // Update aria attributes
    this.menuToggle.setAttribute('aria-expanded', String(this.isMenuOpen));

    // Focus management
    if (this.isMenuOpen) {
      const firstLink = this.navLinks.querySelector('a');
      firstLink?.focus();
    }
  }

  closeMenu() {
    if (!this.navLinks || !this.menuToggle) return;

    this.isMenuOpen = false;
    this.navLinks.classList.remove('open');
    this.navLinks.classList.remove('active');
    this.menuToggle.classList.remove('active');
    document.body.classList.remove('menu-open');
    this.menuToggle.setAttribute('aria-expanded', 'false');
  }

  setActiveLink(element) {
    // Remove active class from all links
    this.navLinks?.querySelectorAll('a').forEach(link => {
      link.classList.remove('active');
    });
    // Add active class to clicked link
    element.classList.add('active');
  }

  // Update active navigation link based on scroll position
  updateActiveLink() {
    const sections = document.querySelectorAll('section[id]');
    const scrollPosition = window.scrollY + 100;

    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      const sectionId = section.getAttribute('id');

      if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
        const activeLink = this.navLinks?.querySelector(`a[href="#${sectionId}"]`);
        if (activeLink) {
          // Remove active class from all links
          this.navLinks?.querySelectorAll('a').forEach(link => link.classList.remove('active'));
          // Add active class to current link
          activeLink.classList.add('active');
        }
      }
    });
  }

  // Smooth scroll to section
  scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
      const offset = this.navbar ? this.navbar.offsetHeight : 0;
      const targetPosition = section.offsetTop - offset;

      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });

      // Close menu after scrolling
      this.closeMenu();
    }
  }
}

/**
 * Theme Manager - Light/Dark Mode Support
 */
class ThemeManager {
  constructor() {
    this.theme = localStorage.getItem('lendswift_theme') || 'light';
    this.init();
  }

  init() {
    this.applyTheme();
    this.setupThemeToggle();
  }

  setupThemeToggle() {
    const themeToggle = document.querySelector('[data-theme-toggle]');
    if (themeToggle) {
      themeToggle.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggleTheme();
      });
    }
  }

  toggleTheme() {
    this.theme = this.theme === 'light' ? 'dark' : 'light';
    this.applyTheme();
    this.saveTheme();
  }

  applyTheme() {
    document.documentElement.setAttribute('data-theme', this.theme);

    // Update theme toggle button if exists
    const themeToggle = document.querySelector('[data-theme-toggle]');
    if (themeToggle) {
      const icon = themeToggle.querySelector('.theme-icon');
      if (icon) {
        icon.textContent = this.theme === 'light' ? '🌙' : '☀️';
      }
    }
  }

  saveTheme() {
    localStorage.setItem('lendswift_theme', this.theme);
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize navbar
  const navbar = new Navbar();

  // Initialize theme manager
  const themeManager = new ThemeManager();

  // Setup smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = anchor.getAttribute('href').substring(1);
      navbar.scrollToSection(targetId);
    });
  });

  // Update active navigation on scroll
  window.addEventListener('scroll', () => {
    navbar.updateActiveLink();
  });

  // Update active navigation on page load
  navbar.updateActiveLink();
});

// Export for global access
window.Navbar = Navbar;
window.ThemeManager = ThemeManager;