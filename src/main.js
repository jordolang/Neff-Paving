// Import CSS
import '../styles/main.css'

// Import animation libraries
import AOS from 'aos'
import 'aos/dist/aos.css'

// Import gallery component (CRITICAL for gallery functionality)
import GalleryFilter from './components/gallery-filter.js';

// Simple application class
class NeffPavingApp {
    constructor() {
        this.galleryFilter = null;
        this.init();
    }

    init() {
        console.log('Initializing Neff Paving App...');
        
        // Initialize hero video
        this.initHeroVideo()
        
        // Initialize animations
        this.initAnimations()
        
        // Initialize navigation
        this.initNavigation()
        
        // Initialize gallery (CRITICAL for gallery functionality)
        try {
            this.initGalleryFilters()
            console.log('Gallery initialized successfully')
        } catch (error) {
            console.error('Gallery initialization failed:', error)
        }
        
        console.log('Neff Paving app initialized successfully')
    }

    initHeroVideo() {
        const video = document.getElementById('hero-video');
        if (!video) return;

        // Add error handling
        video.addEventListener('error', (e) => {
            console.error('Video failed to load:', e);
            const heroSection = document.getElementById('hero');
            if (heroSection) {
                heroSection.style.backgroundColor = '#2c2c2c';
            }
        });

        // Force video to play on load
        video.addEventListener('loadeddata', () => {
            video.play().catch(err => {
                console.error('Video autoplay failed:', err);
            });
        });

        // Ensure video is visible
        video.style.opacity = '1';
    }

    initAnimations() {
        // Initialize AOS
        AOS.init({
            duration: 1000,
            once: true,
            offset: 100
        });
        
        // Remove any loading states immediately
        this.removeLoadingStates();
    }
    
    removeLoadingStates() {
        // Force immediate display of all content - no loading screens or spinners
        const style = document.createElement('style');
        style.textContent = `
            /* Force immediate visibility - no loading states */
            .loading,
            .spinner,
            .loader,
            .loading-overlay,
            .progress-bar,
            .loading-indicator {
                display: none !important;
                opacity: 0 !important;
                visibility: hidden !important;
            }
            
            /* Ensure all gallery images are immediately visible */
            .gallery-card,
            .gallery-item,
            .gallery img,
            .card-image img {
                opacity: 1 !important;
                visibility: visible !important;
                display: block !important;
            }
            
            /* Ensure forms work without loading indicators */
            .form-loading,
            .btn .loading,
            .submit-loading {
                display: none !important;
            }
            
            /* Remove any transition delays that might appear as loading */
            .gallery-card,
            .service-card,
            .contact-method {
                transition-delay: 0s !important;
            }
            
            /* Force maps and images to display immediately */
            .map-placeholder,
            .image-placeholder {
                background: transparent !important;
            }
            
            /* Disable animations that might look like loading */
            .spin {
                animation: none !important;
            }
        `;
        document.head.appendChild(style);
        
        console.log('✅ Loading states removed - content displays immediately');
    }

    initNavigation() {
        // Smooth scrolling for navigation links
        document.querySelectorAll('nav a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault()
                const target = document.querySelector(this.getAttribute('href'))
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    })
                }
            })
        })
    }
    
    initGalleryFilters() {
        const galleryElement = document.getElementById('gallery');
        if (galleryElement) {
            this.galleryFilter = new GalleryFilter(galleryElement);
        }
    }
}

// Initialize the app when DOM is loaded
function initializeApp() {
    try {
        console.log('Starting NeffPavingApp initialization...');
        new NeffPavingApp();
        console.log('NeffPavingApp initialized successfully');
    } catch (error) {
        console.error('Failed to initialize NeffPavingApp:', error);
    }
}

// DOM ready check
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
