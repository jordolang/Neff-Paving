// NOTE: legacy '../styles/main.css' is intentionally NOT imported here.
// The redesigned homepage is styled entirely by styles/redesign.css (linked in index.html).
// The old index.legacy.html links main.css directly, so it remains unaffected.

// Import Vercel Analytics and Speed Insights
import { inject } from '@vercel/analytics';
import { injectSpeedInsights } from '@vercel/speed-insights';

// Import animation libraries
import AOS from 'aos'
import 'aos/dist/aos.css'

// Import gallery component (CRITICAL for gallery functionality)
import GalleryFilter from './components/gallery-filter.js';

// Import content populator for dynamic CMS content
import { ContentPopulator } from './utils/content-populator.js';

// Simple application class
class NeffPavingApp {
    constructor() {
        this.galleryFilter = null;
        this.contentPopulator = null;
        this.init();
    }

    async init() {
        console.log('Initializing Neff Paving App...');

        // Load dynamic content first (CRITICAL for CMS integration)
        try {
            await this.initDynamicContent();
            console.log('Dynamic content loaded successfully');
        } catch (error) {
            console.error('Dynamic content loading failed:', error);
        }

        // Initialize analytics
        this.initAnalytics()

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

    async initDynamicContent() {
        this.contentPopulator = new ContentPopulator();
        await this.contentPopulator.populate();
    }

    async initAnalytics() {
        try {
            // Import BLOCKED_PROPERTIES for PII filtering
            const { BLOCKED_PROPERTIES } = await import('./config/analytics-config.js');

            // Initialize Vercel Analytics for page views and custom events
            inject({
                beforeSend: (event) => {
                    // Filter PII from all analytics events as last resort
                    if (event.data?.properties) {
                        const filtered = Object.keys(event.data.properties).reduce((acc, key) => {
                            const isBlocked = BLOCKED_PROPERTIES.some(blocked =>
                                key.toLowerCase().includes(blocked.toLowerCase())
                            );
                            if (!isBlocked) {
                                acc[key] = event.data.properties[key];
                            } else {
                                console.warn('[Analytics] beforeSend blocked PII:', key);
                            }
                            return acc;
                        }, {});

                        return {
                            ...event,
                            data: {
                                ...event.data,
                                properties: filtered
                            }
                        };
                    }
                    return event;
                }
            });

            // Initialize Vercel Speed Insights for performance monitoring
            injectSpeedInsights();

            console.log('Analytics initialized with PII filtering');
        } catch (error) {
            console.error('Analytics initialization failed:', error);
        }
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

        // Lazy load video using Intersection Observer
        const videoObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Video is in viewport, load and play it
                    if (video.readyState === 0) {
                        video.load();
                    }
                    video.play().catch(err => {
                        console.error('Video autoplay failed:', err);
                    });
                    video.style.opacity = '1';

                    // Stop observing once video is loaded
                    videoObserver.unobserve(video);
                }
            });
        }, {
            rootMargin: '50px' // Start loading slightly before video enters viewport
        });

        // Start observing the video element
        videoObserver.observe(video);
    }

    initAnimations() {
        // Defer AOS initialization until after first paint to reduce main thread blocking
        // This improves INP (Interaction to Next Paint) Core Web Vital metric
        const initAOS = () => {
            AOS.init({
                duration: 1000,
                once: true,
                offset: 100
            });
        };

        // Use requestIdleCallback for optimal performance, with setTimeout fallback
        if ('requestIdleCallback' in window) {
            requestIdleCallback(initAOS, { timeout: 2000 });
        } else {
            // Fallback for browsers without requestIdleCallback support
            setTimeout(initAOS, 100);
        }

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
async function initializeApp() {
    try {
        console.log('Starting NeffPavingApp initialization...');
        await new NeffPavingApp();
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
