/**
 * Mobile Navigation Menu JavaScript
 * Handles hamburger menu toggle, overlay functionality, and accessibility
 */

class MobileNavigation {
    constructor() {
        this.init();
    }

    init() {
        this.bindElements();
        this.bindEvents();
        this.handleInitialState();
    }

    bindElements() {
        // Mobile navigation elements
        this.mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
        this.mobileNav = document.querySelector('.mobile-nav');
        this.mobileNavClose = document.querySelector('.mobile-nav-close');
        this.mobileNavOverlay = document.querySelector('.mobile-nav-overlay');
        this.mobileNavLinks = document.querySelectorAll('.mobile-nav-links a');
        this.body = document.body;

        // Verify required elements exist
        if (!this.mobileMenuToggle || !this.mobileNav) {
            console.warn('Mobile navigation elements not found');
            return;
        }
    }

    bindEvents() {
        // Toggle menu open/close
        if (this.mobileMenuToggle) {
            this.mobileMenuToggle.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleMenu();
            });
        }

        // Close menu button
        if (this.mobileNavClose) {
            this.mobileNavClose.addEventListener('click', (e) => {
                e.preventDefault();
                this.closeMenu();
            });
        }

        // Close menu when overlay is clicked
        if (this.mobileNavOverlay) {
            this.mobileNavOverlay.addEventListener('click', () => {
                this.closeMenu();
            });
        }

        // Close menu when navigation links are clicked
        if (this.mobileNavLinks) {
            this.mobileNavLinks.forEach(link => {
                link.addEventListener('click', () => {
                    // Small delay to allow navigation to complete
                    setTimeout(() => {
                        this.closeMenu();
                    }, 100);
                });
            });
        }

        // Handle escape key to close menu
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isMenuOpen()) {
                this.closeMenu();
                // Return focus to hamburger button
                if (this.mobileMenuToggle) {
                    this.mobileMenuToggle.focus();
                }
            }
        });

        // Handle window resize to close menu if switching to desktop view
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                if (window.innerWidth > 768 && this.isMenuOpen()) {
                    this.closeMenu();
                }
            }, 250);
        });

        // Prevent scroll when touching the mobile nav overlay
        if (this.mobileNavOverlay) {
            this.mobileNavOverlay.addEventListener('touchmove', (e) => {
                e.preventDefault();
            }, { passive: false });
        }

        // Allow scrolling within the mobile nav menu
        if (this.mobileNav) {
            this.mobileNav.addEventListener('touchmove', (e) => {
                e.stopPropagation();
            });
        }
    }

    handleInitialState() {
        // Ensure menu is closed on page load
        this.closeMenu();
    }

    toggleMenu() {
        if (this.isMenuOpen()) {
            this.closeMenu();
        } else {
            this.openMenu();
        }
    }

    openMenu() {
        // Add active classes
        if (this.mobileMenuToggle) {
            this.mobileMenuToggle.classList.add('active');
            this.mobileMenuToggle.setAttribute('aria-expanded', 'true');
        }
        
        if (this.mobileNav) {
            this.mobileNav.classList.add('open');
        }

        if (this.mobileNavOverlay) {
            this.mobileNavOverlay.classList.add('active');
        }

        // Prevent body scroll
        this.body.classList.add('mobile-nav-open');

        // Focus management - move focus to close button or first link
        setTimeout(() => {
            const focusTarget = this.mobileNavClose || document.querySelector('.mobile-nav-links a');
            if (focusTarget) {
                focusTarget.focus();
            }
        }, 100);

        // Announce to screen readers
        this.announceToScreenReader('Navigation menu opened');
    }

    closeMenu() {
        // Remove active classes
        if (this.mobileMenuToggle) {
            this.mobileMenuToggle.classList.remove('active');
            this.mobileMenuToggle.setAttribute('aria-expanded', 'false');
        }
        
        if (this.mobileNav) {
            this.mobileNav.classList.remove('open');
        }

        if (this.mobileNavOverlay) {
            this.mobileNavOverlay.classList.remove('active');
        }

        // Restore body scroll
        this.body.classList.remove('mobile-nav-open');

        // Announce to screen readers
        this.announceToScreenReader('Navigation menu closed');
    }

    isMenuOpen() {
        return this.mobileNav && this.mobileNav.classList.contains('open');
    }

    // Accessibility helper - announce changes to screen readers
    announceToScreenReader(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.style.cssText = `
            position: absolute !important;
            width: 1px !important;
            height: 1px !important;
            padding: 0 !important;
            margin: -1px !important;
            overflow: hidden !important;
            clip: rect(0, 0, 0, 0) !important;
            white-space: nowrap !important;
            border: 0 !important;
        `;
        
        announcement.textContent = message;
        document.body.appendChild(announcement);
        
        // Remove after announcement
        setTimeout(() => {
            if (document.body.contains(announcement)) {
                document.body.removeChild(announcement);
            }
        }, 1000);
    }

    // Method to programmatically close menu (for external use)
    forceClose() {
        this.closeMenu();
    }

    // Method to check if mobile navigation is active (for external use)
    isMobileNavActive() {
        return window.innerWidth <= 768;
    }
}

// Smooth scrolling for anchor links (enhanced for mobile)
class SmoothScroll {
    constructor() {
        this.init();
    }

    init() {
        // Handle all internal links
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href^="#"]');
            if (link && link.getAttribute('href').length > 1) {
                e.preventDefault();
                this.scrollToElement(link.getAttribute('href'));
            }
        });
    }

    scrollToElement(targetId) {
        const targetElement = document.querySelector(targetId);
        if (!targetElement) return;

        // Calculate offset for fixed header
        const headerHeight = this.getHeaderHeight();
        const elementPosition = targetElement.offsetTop;
        const offsetPosition = elementPosition - headerHeight - 20; // Extra 20px padding

        // Smooth scroll
        window.scrollTo({
            top: Math.max(0, offsetPosition),
            behavior: 'smooth'
        });

        // Update URL hash
        if (history.pushState) {
            history.pushState(null, null, targetId);
        }

        // Focus management for accessibility
        setTimeout(() => {
            targetElement.focus({ preventScroll: true });
            if (targetElement.getAttribute('tabindex') === null) {
                targetElement.setAttribute('tabindex', '-1');
            }
        }, 500);
    }

    getHeaderHeight() {
        const header = document.querySelector('header');
        return header ? header.offsetHeight : 0;
    }
}

// Touch gesture support for mobile navigation
class TouchGestures {
    constructor(mobileNav) {
        this.mobileNav = mobileNav;
        this.startX = 0;
        this.currentX = 0;
        this.threshold = 100; // Minimum swipe distance
        this.restraint = 100; // Maximum vertical distance
        this.allowedTime = 300; // Maximum time allowed
        this.startTime = 0;
        
        this.init();
    }

    init() {
        if (!this.mobileNav.mobileNavOverlay) return;

        this.mobileNav.mobileNavOverlay.addEventListener('touchstart', (e) => {
            this.handleTouchStart(e);
        }, { passive: false });

        this.mobileNav.mobileNavOverlay.addEventListener('touchmove', (e) => {
            this.handleTouchMove(e);
        }, { passive: false });

        this.mobileNav.mobileNavOverlay.addEventListener('touchend', (e) => {
            this.handleTouchEnd(e);
        }, { passive: false });
    }

    handleTouchStart(e) {
        const touchObj = e.changedTouches[0];
        this.startX = touchObj.pageX;
        this.startTime = new Date().getTime();
    }

    handleTouchMove(e) {
        e.preventDefault(); // Prevent scrolling
    }

    handleTouchEnd(e) {
        const touchObj = e.changedTouches[0];
        this.currentX = touchObj.pageX;
        const elapsedTime = new Date().getTime() - this.startTime;

        // Check if it's a valid swipe
        if (elapsedTime <= this.allowedTime) {
            const distance = this.currentX - this.startX;
            
            // Swipe right to close menu (distance > threshold)
            if (distance >= this.threshold && Math.abs(touchObj.pageY - e.changedTouches[0].pageY) <= this.restraint) {
                this.mobileNav.closeMenu();
            }
        }
    }
}

// Initialize mobile navigation when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Initialize mobile navigation
    const mobileNav = new MobileNavigation();
    
    // Initialize smooth scrolling
    const smoothScroll = new SmoothScroll();
    
    // Initialize touch gestures for mobile nav
    const touchGestures = new TouchGestures(mobileNav);

    // Make mobile navigation globally accessible for debugging
    if (typeof window !== 'undefined') {
        window.mobileNav = mobileNav;
    }

    console.log('Mobile navigation initialized successfully');
});

// Handle page visibility change to close menu if page becomes hidden
document.addEventListener('visibilitychange', () => {
    if (document.hidden && window.mobileNav && window.mobileNav.isMenuOpen()) {
        window.mobileNav.closeMenu();
    }
});

// Export for module systems (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MobileNavigation, SmoothScroll, TouchGestures };
}
