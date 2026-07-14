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
        this.initHeroCarousel();
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

    initHeroCarousel() {
        const carousel = document.querySelector('[data-hero-carousel]');
        if (!carousel) return;

        const slides = Array.from(carousel.querySelectorAll('[data-hero-slide]'));
        if (slides.length < 2) return;

        const SLIDE_MS = 30000;

        // Slide 1 ships with a real src and is the LCP element. Slides 2..n carry
        // their URLs in data-* so they are not fetched on load — they sit inside the
        // viewport, where `loading="lazy"` would not defer them. Hydrating a slide is
        // what actually triggers its download.
        const hydrate = (slide) => {
            if (slide.dataset.hydrated) return;
            slide.dataset.hydrated = 'true';

            // The <source> srcsets must be set before the <img> src, or the browser
            // resolves a candidate while the sources are still empty and settles on
            // the JPEG, throwing away the AVIF/WebP saving.
            slide.querySelectorAll('source[data-srcset]').forEach((source) => {
                source.srcset = source.dataset.srcset;
                delete source.dataset.srcset;
            });

            const img = slide.querySelector('img[data-src]');
            if (!img) return;
            if (img.dataset.srcset) {
                img.srcset = img.dataset.srcset;
                delete img.dataset.srcset;
            }
            img.src = img.dataset.src;
            delete img.dataset.src;
        };

        // Indicators are built here rather than in the markup so they never render as
        // dead controls when JS is unavailable — in that case slide 1 just stands as
        // a static hero.
        const dots = document.createElement('div');
        dots.className = 'hero-dots';
        dots.setAttribute('role', 'tablist');
        dots.setAttribute('aria-label', 'Hero image');

        let index = 0;
        let timer = null;

        const show = (next) => {
            if (next === index) return;
            hydrate(slides[next]);
            slides[index].classList.remove('is-active');
            slides[next].classList.add('is-active');
            dots.children[index].setAttribute('aria-selected', 'false');
            dots.children[next].setAttribute('aria-selected', 'true');
            index = next;
            // Pull the following slide during this one's 30s dwell, so it is decoded
            // and ready long before its own cross-fade starts.
            hydrate(slides[(next + 1) % slides.length]);
        };

        slides.forEach((slide, i) => {
            const dot = document.createElement('button');
            dot.type = 'button';
            dot.className = 'hero-dot';
            dot.setAttribute('role', 'tab');
            dot.setAttribute('aria-selected', String(i === 0));
            dot.setAttribute('aria-label', `Show hero image ${i + 1} of ${slides.length}`);
            dot.addEventListener('click', () => {
                show(i);
                restart();
            });
            dots.appendChild(dot);
        });

        (carousel.closest('#hero') || carousel.parentElement).appendChild(dots);

        const advance = () => show((index + 1) % slides.length);

        // Data-saver and 2G users keep slide 1 only: four more full-bleed photos are
        // not worth the transfer. The dots still let them opt in by tapping.
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        const saveData = Boolean(connection && connection.saveData);
        const slowNetwork = Boolean(connection && /(^|-)(2g|slow-2g)$/.test(connection.effectiveType || ''));
        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

        const shouldAutoplay = () => !saveData && !slowNetwork && !reducedMotion.matches;

        const stop = () => {
            if (timer !== null) {
                clearInterval(timer);
                timer = null;
            }
        };
        const restart = () => {
            stop();
            if (shouldAutoplay()) timer = setInterval(advance, SLIDE_MS);
        };

        // setInterval keeps firing in a background tab, so without this the carousel
        // cycles unseen and the user comes back to a half-finished cross-fade.
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) stop();
            else restart();
        });
        reducedMotion.addEventListener('change', restart);

        if (shouldAutoplay()) {
            // Hold slide 2 until load, so the second image never competes with the
            // LCP image for bandwidth.
            const begin = () => {
                hydrate(slides[1]);
                restart();
            };
            if (document.readyState === 'complete') begin();
            else window.addEventListener('load', begin, { once: true });
        }
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
