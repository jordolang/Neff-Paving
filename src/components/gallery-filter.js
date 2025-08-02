
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
        
        // Get 8 random images per category
        const categories = Object.keys(galleryImages);
        categories.forEach(category => {
            const categoryImages = galleryImages[category].map(img => ({ ...img, category }));
            const shuffled = this.shuffleArray([...categoryImages]);
            this.displayedImages[category] = shuffled.slice(0, 8);
        });
        
        // Also create a mixed "all" category with 8 random images from all categories
        const allShuffled = this.shuffleArray([...this.allImagesData]);
        this.displayedImages['all'] = allShuffled.slice(0, 8);
        
        // Create gallery cards for all displayed images (initially hidden)
        Object.entries(this.displayedImages).forEach(([category, images]) => {
            images.forEach(image => {
                const galleryCard = this.createGalleryCard(image, image.category, category);
                this.galleryContainer.appendChild(galleryCard);
                this.galleryItems.push(galleryCard);
            });
        });
        
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

    createGalleryCard(image, category, displayCategory) {
        const card = document.createElement('div');
        card.className = 'gallery-card';
        card.setAttribute('data-category', category);
        card.setAttribute('data-display-category', displayCategory);
        
        // SIMPLIFIED VERSION - minimal implementation for testing
        
        // Generate all possible image paths for debugging
        const originalPath = `/assets/gallery/${category}/${image.filename}`;
        const hardcodedPath = `/Neff-Paving/assets/gallery/${category}/${image.filename}`;
        const resolvedPath = getAssetPath(originalPath, { addCacheBusting: true });
        const simplePath = `assets/gallery/${category}/${image.filename}`;
        const relativePath = `./assets/gallery/${category}/${image.filename}`;
        
        // Log ALL image paths to console for debugging
        console.group(`🖼️ SIMPLIFIED Gallery Card: ${image.filename}`);
        console.log('Original path:', originalPath);
        console.log('Hardcoded GitHub path:', hardcodedPath);
        console.log('Resolved path:', resolvedPath);
        console.log('Simple path:', simplePath);
        console.log('Relative path:', relativePath);
        console.log('Category:', category);
        console.log('Display category:', displayCategory);
        console.log('Image data:', image);
        console.groupEnd();
        
        // Use minimal HTML structure - no loading attributes or placeholders
        card.innerHTML = `
            <div class="card-image">
                <img src="${resolvedPath}" alt="${image.alt}" width="630" height="400">
            </div>
            <div class="card-overlay">
                <div class="card-title">${image.title}</div>
                <div class="card-category">${category.charAt(0).toUpperCase() + category.slice(1)}</div>
            </div>
        `;
        
        // Display images immediately - no opacity transitions or placeholders
        const img = card.querySelector('img');
        
        // Simple error handling - just log and show error message
        img.onerror = () => {
            console.error(`❌ SIMPLIFIED: Failed to load image:`, resolvedPath);
            img.style.display = 'none';
            card.querySelector('.card-image').innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 200px; background: #f5f5f5; color: #666;">
                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">📷</div>
                    <div style="font-size: 0.875rem;">Image not available</div>
                    <div style="font-size: 0.75rem; margin-top: 0.25rem; opacity: 0.7;">${image.filename}</div>
                </div>
            `;
        };
        
        // Log when image loads successfully
        img.onload = () => {
            console.log(`✅ SIMPLIFIED: Successfully loaded image:`, resolvedPath);
        };
        
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
        this.galleryItems.forEach(item => {
            const displayCategory = item.dataset.displayCategory;
            const shouldShow = displayCategory === filter;

            if (shouldShow) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });

        // SIMPLIFIED VERSION - No animations, display immediately
        const visibleItems = this.galleryItems.filter(item => 
            item && item.style.display === 'block'
        );
        
        console.log(`🔄 SIMPLIFIED: Showing ${visibleItems.length} items for filter '${filter}'`);
        
        // No GSAP animations - images display immediately without transitions
    }
}

export default GalleryFilter;

