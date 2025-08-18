
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
        this.displayedImages = {}; // Track displayed images by category
        this.currentFilter = 'all';

        this.init();
    }

    init() {
        this.loadGalleryImages();
        this.initFilters();
        this.initLightbox();
        // Set first button as active
        if (this.filterButtons.length > 0) {
            this.filterButtons[0].classList.add('cs-active');
        }
    }

    loadGalleryImages() {
        // Clear existing gallery items
        this.galleryContainer.innerHTML = '';
        this.galleryItems = [];
        this.allImagesData = [];
        this.displayedImages = {};
        
        // Collect all images and organize by category
        Object.entries(galleryImages).forEach(([category, images]) => {
            images.forEach(image => {
                this.allImagesData.push({ ...image, category });
            });
        });
        
        // Get 10 random images per category for filtering
        const categories = Object.keys(galleryImages);
        categories.forEach(category => {
            const categoryImages = galleryImages[category].map(img => ({ ...img, category }));
            const shuffled = this.shuffleArray([...categoryImages]);
            this.displayedImages[category] = shuffled.slice(0, 10);
        });
        
        // Also create a mixed "all" category with 10 random images from all categories
        const allShuffled = this.shuffleArray([...this.allImagesData]);
        this.displayedImages['all'] = allShuffled.slice(0, 10);
        
        // Create a unique set of images to avoid duplicates
        const uniqueImages = new Set();
        const uniqueImagesArray = [];
        
        // Collect all unique images from all display categories
        Object.entries(this.displayedImages).forEach(([displayCategory, images]) => {
            images.forEach(image => {
                const imageKey = `${image.category}-${image.filename}`;
                if (!uniqueImages.has(imageKey)) {
                    uniqueImages.add(imageKey);
                    uniqueImagesArray.push({
                        ...image,
                        displayCategories: [displayCategory] // Track which display categories this image belongs to
                    });
                } else {
                    // Add this display category to existing image
                    const existingImage = uniqueImagesArray.find(img => 
                        img.category === image.category && img.filename === image.filename
                    );
                    if (existingImage) {
                        existingImage.displayCategories.push(displayCategory);
                    }
                }
            });
        });
        
        // Create gallery cards only for unique images
        uniqueImagesArray.forEach(image => {
            const galleryCard = this.createGalleryCard(image, image.category, image.displayCategories);
            this.galleryContainer.appendChild(galleryCard);
            this.galleryItems.push(galleryCard);
        });
        
        // Debug logging to track image counts
        console.log(`🔄 Gallery Debug Info:`);
        Object.entries(this.displayedImages).forEach(([category, images]) => {
            console.log(`  - ${category}: ${images.length} images selected`);
        });
        console.log(`  - Total unique cards created: ${uniqueImagesArray.length}`);
        
        // Show initial filter (all)
        this.filterItems('all');
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

    createGalleryCard(image, category, displayCategories) {
        const card = document.createElement('div');
        card.className = 'gallery-card';
        card.setAttribute('data-category', category);
        card.setAttribute('data-display-categories', displayCategories.join(','));
        
        // Generate image path
        const resolvedPath = getAssetPath(`/assets/gallery/${category}/${image.filename}`, { addCacheBusting: true });
        
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
                <div class="card-category">${category.charAt(0).toUpperCase() + category.slice(1)}</div>
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
            
            const clickedImage = {
                filename: card.querySelector('img').src.split('/').pop(),
                title: card.querySelector('.card-title').textContent,
                category: card.dataset.category
            };
            
            // Get all images based on current filter
            let imagesToShow = [];
            let clickedIndex = 0;
            
            if (this.currentFilter === 'all') {
                // Show ALL images from all categories
                imagesToShow = this.allImagesData;
            } else {
                // Show all images from the selected category
                imagesToShow = this.allImagesData.filter(img => img.category === this.currentFilter);
            }
            
            // Build lightbox images array with proper asset paths
            const lightboxImages = imagesToShow.map(image => {
                return {
                    src: getAssetPath(`/assets/gallery/${image.category}/${image.filename}`, {
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
        let visibleCount = 0;
        
        this.galleryItems.forEach(item => {
            const displayCategories = item.dataset.displayCategories.split(',');
            const shouldShow = displayCategories.includes(filter) && visibleCount < 10;

            if (shouldShow) {
                item.style.display = 'block';
                visibleCount++;
            } else {
                item.style.display = 'none';
            }
        });

        // SIMPLIFIED VERSION - No animations, display immediately
        const visibleItems = this.galleryItems.filter(item => 
            item && item.style.display === 'block'
        );
        
        console.log(`🔄 Gallery Filter '${filter}': Showing ${visibleItems.length} items (limit: 10)`);
        
        // No GSAP animations - images display immediately without transitions
    }
}

export default GalleryFilter;

