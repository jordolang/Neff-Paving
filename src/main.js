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
        this.initHeroVideo();
        this.initNavigation();
        this.initFacebookGallery();
        this.initWorkLightbox();

        // Analytics are non-visual: defer them to idle time so their script fetch
        // and init never compete with first paint or add to Total Blocking Time.
        const startAnalytics = () => this.initAnalytics();
        if ('requestIdleCallback' in window) {
            requestIdleCallback(startAnalytics, { timeout: 3000 });
        } else {
            window.addEventListener('load', () => setTimeout(startAnalytics, 1500));
        }
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

        // The hero background video is decoration: the preloaded AVIF poster is
        // the real LCP element. On phones, data-saver, slow networks, or when the
        // user prefers reduced motion, the 7 MB video is not worth the payload —
        // it barely shows at phone size and it single-handedly triples the
        // mobile transfer. Skip fetching it entirely and let the poster stand.
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        const saveData = Boolean(connection && connection.saveData);
        const slowNetwork = Boolean(connection && /(^|-)(2g|slow-2g)$/.test(connection.effectiveType || ''));
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const smallScreen = window.matchMedia('(max-width: 768px)').matches;

        if (saveData || slowNetwork || reducedMotion || smallScreen) {
            // Poster remains visible; the video is never requested.
            return;
        }

        // Transient network errors (e.g. ERR_QUIC_PROTOCOL_ERROR on HTTP/3) can
        // interrupt the video's range request. These are recoverable: reloading
        // makes the browser retry, and it typically falls back to HTTP/2. Retry
        // once before giving up. The <video> poster stays visible throughout, so
        // the hero never flashes an empty background during the retry.
        let hasRetried = false;
        video.addEventListener('error', () => {
            if (!hasRetried) {
                hasRetried = true;
                // Re-fetch the source; QUIC failures generally succeed on the
                // HTTP/2 fallback the browser negotiates on retry.
                video.load();
                video.play().catch(() => { /* poster remains as fallback */ });
                return;
            }

            // Retry also failed — the poster attribute keeps showing the hero
            // still image, so no further UI intervention is needed.
            console.error('Hero video could not be loaded after retry; showing poster.');
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
