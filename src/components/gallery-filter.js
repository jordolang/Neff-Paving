
import { gsap } from 'gsap';
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
        
        // Use getAssetPath to properly resolve the image path for the current environment
        const imagePath = getAssetPath(`/assets/gallery/${category}/${image.filename}`, {
            addCacheBusting: true
        });
        
        // Create HTML structure without any src attributes - images loaded purely via JavaScript
        card.innerHTML = `
            <div class="card-image">
                <div class="image-loading-placeholder">
                    <div class="loading-spinner"></div>
                </div>
                <picture class="image">
                    <source media="(max-width: 600px)">
                    <source media="(min-width: 601px)">
                    <img loading="eager" decoding="async" alt="${image.alt}" width="630" height="400">
                </picture>
            </div>
            <div class="card-overlay">
                <div class="card-title">${image.title}</div>
                <div class="card-category">${category.charAt(0).toUpperCase() + category.slice(1)}</div>
            </div>
        `;
        
        // Get DOM elements for image loading states
        const img = card.querySelector('img');
        const sources = card.querySelectorAll('source');
        const placeholder = card.querySelector('.image-loading-placeholder');
        const cardImage = card.querySelector('.card-image');
        
        // Show loading state initially - image completely hidden
        cardImage.style.backgroundColor = '#f5f5f5';
        img.style.opacity = '0';
        
        // Preload image to ensure smooth display
        const imagePreloader = new Image();
        imagePreloader.onload = () => {
            // Image is loaded successfully, now set src attributes and show it
            sources.forEach(source => {
                source.srcset = imagePath;
            });
            img.src = imagePath;
            
            // Show the loaded image
            img.style.opacity = '1';
            placeholder.style.opacity = '0';
            cardImage.style.backgroundColor = 'transparent';
            
            // Remove placeholder after transition
            setTimeout(() => {
                placeholder.style.display = 'none';
            }, 300);
        };
        
        imagePreloader.onerror = () => {
            // Handle failed image loads - show error message without setting src
            placeholder.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #666;">
                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">📷</div>
                    <div style="font-size: 0.875rem;">Image not available</div>
                </div>
            `;
            // Keep img hidden since it failed to load
            img.style.display = 'none';
        };
        
        // Start loading the image - this triggers the loading process
        imagePreloader.src = imagePath;
        
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

        // Animate the visible items - with existence checks
        const visibleItems = this.galleryItems.filter(item => 
            item && item.style.display === 'block'
        );
        
        if (visibleItems.length > 0) {
            gsap.fromTo(visibleItems, 
                {
                    opacity: 0,
                    y: 40
                },
                {
                    opacity: 1,
                    y: 0,
                    duration: 0.8,
                    stagger: 0.15,
                    ease: 'power2.out'
                }
            );
        }
    }
}

export default GalleryFilter;

