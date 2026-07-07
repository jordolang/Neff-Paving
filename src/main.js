// NOTE: legacy '../styles/main.css' is intentionally NOT imported here.
// The redesigned homepage is styled entirely by styles/redesign.css (linked in index.html).

// Import Vercel Analytics and Speed Insights
import { inject } from '@vercel/analytics';
import { injectSpeedInsights } from '@vercel/speed-insights';

// Lightbox for the curated work galleries
import Lightbox from './components/lightbox.js';

// Photos synced daily from the Facebook "Website Feed" album
import { facebookImages } from './data/facebook-images.js';

// Simple application class
class NeffPavingApp {
    constructor() {
        this.lightbox = null;
        this.init();
    }

    init() {
        this.initAnalytics();
        this.initHeroVideo();
        this.initNavigation();
        this.initFacebookGallery();
        this.initWorkLightbox();
    }

    // Fill the "Facebook Favorites" section from the synced album manifest,
    // so new photos appear without touching the HTML.
    initFacebookGallery() {
        const grid = document.getElementById('facebook-gallery');
        if (!grid) return;

        facebookImages.forEach(image => {
            const figure = document.createElement('figure');
            figure.className = 'work-item';

            const img = document.createElement('img');
            img.src = `/assets/gallery/facebook/${image.filename}`;
            img.alt = image.alt || image.title || 'Recent work by Neff Paving & Concrete';
            img.loading = 'lazy';

            const caption = document.createElement('figcaption');
            caption.textContent = image.title || '';

            figure.append(img, caption);
            grid.appendChild(figure);
        });
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

    // Open the curated project photos (.work-item) in the shared lightbox,
    // scoped per section so commercial and residential browse separately.
    initWorkLightbox() {
        const grids = document.querySelectorAll('.work-grid');
        if (!grids.length) return;

        this.lightbox = new Lightbox();

        grids.forEach(grid => {
            const items = Array.from(grid.querySelectorAll('.work-item'));
            const images = items.map(item => {
                const img = item.querySelector('img');
                const caption = item.querySelector('figcaption');
                return {
                    src: img.getAttribute('src'),
                    title: caption ? caption.textContent : '',
                    category: '',
                    alt: img.getAttribute('alt') || ''
                };
            });

            items.forEach((item, index) => {
                item.addEventListener('click', () => {
                    this.lightbox.open(images, index);
                });
            });
        });
    }
}

// Initialize the app when DOM is loaded
function initializeApp() {
    try {
        new NeffPavingApp();
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
