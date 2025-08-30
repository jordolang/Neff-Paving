// import { gsap } from 'gsap'; // Temporarily disabled for simplified version
import Lightbox from './lightbox.js';
import { galleryImages } from '../data/gallery-images.js';
import { getAssetPath } from '../utils/base-url.js';

class GalleryFilter {
    constructor(galleryElement) {
        this.galleryElement = galleryElement;
        this.galleryContainer = galleryElement.querySelector('.gallery');
        this.filterButtons = document.querySelectorAll('.button-group .button');
        this.galleryItems = [];
        this.lightbox = new Lightbox();
        this.allImagesData = []; // Store all images for lightbox
        this.currentFilter = 'all';

        this.init();
    }

    init() {
        this.loadAllImageData();
        this.initFilters();
        this.initLightbox();
        // Set first button as active
        if (this.filterButtons.length > 0) {
            this.filterButtons[0].classList.add('cs-active');
        }

        // Initially show 10 random images from all categories
        this.filterItems('all');
    }

    // Load all image data but don't create DOM elements yet
    loadAllImageData() {
        this.allImagesData = [];

        // Collect all images and organize by category
        Object.entries(galleryImages).forEach(([category, images]) => {
            images.forEach(image => {
                this.allImagesData.push({...image, category });
            });
        });

        console.log(`🔄 Gallery: Loaded ${this.allImagesData.length} total images from all categories`);
    }

    // New method to load and display exactly 10 images based on the current filter
    loadGalleryImages(filter) {
        // Clear existing gallery items
        this.galleryContainer.innerHTML = '';
        this.galleryItems = [];

        // Select images based on filter
        let imagesToDisplay = [];

        if (filter === 'all') {
            // For 'all', select 10 random images from the entire collection
            imagesToDisplay = this.shuffleArray([...this.allImagesData]).slice(0, 10);
        } else {
            // For specific category, select 10 random images from that category
            const categoryImages = this.allImagesData.filter(img => img.category === filter);
            imagesToDisplay = this.shuffleArray([...categoryImages]).slice(0, 10);

            // If category has fewer than 10 images, use all available
            if (imagesToDisplay.length < 10) {
                console.log(`⚠️ Category '${filter}' has only ${categoryImages.length} images`);
            }
        }

        // Create gallery cards for the selected images
        imagesToDisplay.forEach(image => {
            const galleryCard = this.createGalleryCard(image);
            this.galleryContainer.appendChild(galleryCard);
            this.galleryItems.push(galleryCard);
        });

        console.log(`🔄 Gallery Filter '${filter}': Showing exactly ${imagesToDisplay.length} images`);
    }

    // Fisher-Yates shuffle algorithm for truly random selection
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    createGalleryCard(image) {
        const card = document.createElement('div');
        card.className = 'gallery-card';
        card.setAttribute('data-category', image.category);

        // Generate image path
        const resolvedPath = getAssetPath(`/assets/images/projects/${image.filename}`, { addCacheBusting: true });

        // Create HTML structure with lazy loading
        card.innerHTML = `
            <div class="card-image">
                <div class="image-loading-placeholder">
                    <div style="font-size: 2rem; margin-bottom: 0.5rem; color: #999;">📷</div>
                    <div style="font-size: 0.875rem; color: #666;">Loading...</div>
                </div>
                <img data-src="${resolvedPath}" alt="${image.alt}" width="630" height="400" loading="lazy" style="opacity: 0; transition: opacity 0.3s ease;">
            </div>
            <div class="card-overlay">
                <div class="card-title">${image.title}</div>
                <div class="card-category">${image.category.charAt(0).toUpperCase() + image.category.slice(1)}</div>
            </div>
        `;

        // Implement lazy loading with Intersection Observer and mobile optimization
        const img = card.querySelector('img');
        const placeholder = card.querySelector('.image-loading-placeholder');

        // Apply mobile optimizations to the image
        // mobileOptimizer.optimizeImage(img, resolvedPath);

        // Create intersection observer for lazy loading with mobile-aware settings
        const observerOptions = {
            rootMargin: '50px 0px', // Load earlier
            threshold: 0.1 // threshold for loading
        };

        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const image = entry.target;
                    const src = image.getAttribute('data-src');

                    // Start loading the image
                    image.src = src;
                    image.removeAttribute('data-src');

                    // Handle successful load with mobile optimization
                    image.onload = () => {
                        image.style.opacity = '1';
                        placeholder.style.opacity = '0';

                        // Longer transition on slow connections to mask loading
                        const transitionDelay = 300;
                        setTimeout(() => {
                            if (placeholder.parentNode) {
                                placeholder.remove();
                            }
                        }, transitionDelay);

                        console.log(`✅ Lazy loaded image: ${src}`);
                    };

                    // Enhanced error handling for mobile
                    image.onerror = () => {
                        console.error(`❌ Failed to load image: ${src}`);
                        // mobileOptimizer.showImagePlaceholder(image);
                    };

                    // Stop observing this image
                    observer.unobserve(image);
                }
            });
        }, observerOptions);

        // Start observing the image
        imageObserver.observe(img);

        return card;
    }

    initFilters() {
        this.filterButtons.forEach(button => {
            button.addEventListener('click', () => this.handleFilterClick(button));
        });
    }

    initLightbox() {
        // Use event delegation for dynamically loaded items
        this.galleryContainer.addEventListener('click', (e) => {
            const card = e.target.closest('.gallery-card');
            if (!card) return;

            const imgEl = card.querySelector('img');
            const clickedImage = {
                filename: imgEl.src.split('/').pop() || imgEl.getAttribute('data-src').split('/').pop(),
                title: card.querySelector('.card-title').textContent,
                category: card.dataset.category
            };

            // Get all images based on current filter
            let imagesToShow = [];
            let clickedIndex = 0;

            if (this.currentFilter === 'all') {
                // Show ALL images from all categories in the lightbox
                imagesToShow = this.allImagesData;
            } else {
                // Show all images from the selected category in the lightbox
                imagesToShow = this.allImagesData.filter(img => img.category === this.currentFilter);
            }

            // Build lightbox images array with proper asset paths
            const lightboxImages = imagesToShow.map(image => {
                return {
                    src: getAssetPath(`/assets/images/projects/${image.filename}`, {
                        addCacheBusting: true
                    }),
                    title: image.title,
                    category: image.category.charAt(0).toUpperCase() + image.category.slice(1),
                    alt: image.alt
                };
            });

            // Find the index of clicked image in the full array
            clickedIndex = imagesToShow.findIndex(img =>
                img.filename === clickedImage.filename &&
                img.category === clickedImage.category
            );

            // If not found (shouldn't happen), default to 0
            if (clickedIndex === -1) clickedIndex = 0;

            this.lightbox.open(lightboxImages, clickedIndex);
        });
    }

    handleFilterClick(button) {
        // Remove active class from all buttons
        this.filterButtons.forEach(btn => btn.classList.remove('cs-active'));
        // Add active class to clicked button
        button.classList.add('cs-active');

        const filter = button.dataset.filter;
        this.filterItems(filter);
    }

    filterItems(filter) {
        this.currentFilter = filter;

        // Load 10 new images based on the current filter
        this.loadGalleryImages(filter);

        // No GSAP animations - images display immediately without transitions
    }
}

export default GalleryFilter;