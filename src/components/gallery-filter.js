
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

        this.init();
    }

    init() {
        this.loadGalleryImages();
        this.initFilters();
        this.initLightbox();
        // Set initial state - show "All" items by default
        this.filterItems('all');
        // Set first button as active
        if (this.filterButtons.length > 0) {
            this.filterButtons[0].classList.add('cs-active');
        }
    }

    loadGalleryImages() {
        // Clear existing gallery items
        this.galleryContainer.innerHTML = '';
        
        // Collect all images from all categories into one array
        const allImages = [];
        Object.entries(galleryImages).forEach(([category, images]) => {
            images.forEach(image => {
                allImages.push({ ...image, category });
            });
        });
        
        // Randomly shuffle and select 9 images
        const shuffledImages = this.shuffleArray([...allImages]);
        const selectedImages = shuffledImages.slice(0, 9);
        
        console.log(`Displaying ${selectedImages.length} random images out of ${allImages.length} total images`);
        
        // Create gallery cards for selected images
        selectedImages.forEach(image => {
            const galleryCard = this.createGalleryCard(image, image.category);
            this.galleryContainer.appendChild(galleryCard);
            this.galleryItems.push(galleryCard);
        });
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

    createGalleryCard(image, category) {
        const card = document.createElement('div');
        card.className = 'gallery-card';
        card.setAttribute('data-category', category);
        
        // Use dynamic path construction that works for both Vercel and GitHub Pages
        const getImagePath = () => {
            const baseUrl = import.meta.env.BASE_URL || '/';
            // Remove leading slash from baseUrl if it's just '/'
            const cleanBaseUrl = baseUrl === '/' ? '' : baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
            return `${cleanBaseUrl}/assets/gallery/${category}/${image.filename}`;
        };
        
        const imagePath = getImagePath();
        
        card.innerHTML = `
            <div class="card-image">
                <div class="image-loading-placeholder">
                    <div class="loading-spinner"></div>
                </div>
                <picture class="image">
                    <source media="(max-width: 600px)" srcset="${imagePath}">
                    <source media="(min-width: 601px)" srcset="${imagePath}">
                    <img loading="eager" decoding="async" src="${imagePath}" alt="${image.alt}" width="630" height="400">
                </picture>
            </div>
            <div class="card-overlay">
                <div class="card-title">${image.title}</div>
                <div class="card-category">${category.charAt(0).toUpperCase() + category.slice(1)}</div>
            </div>
        `;
        
        // Handle image loading states
        const img = card.querySelector('img');
        const placeholder = card.querySelector('.image-loading-placeholder');
        const cardImage = card.querySelector('.card-image');
        
        // Show loading state initially
        cardImage.style.backgroundColor = '#f0f0f0';
        
        img.onload = () => {
            // Hide loading placeholder and show image
            placeholder.style.display = 'none';
            img.style.opacity = '1';
            cardImage.style.backgroundColor = 'transparent';
        };
        
        img.onerror = () => {
            // Handle failed image loads
            placeholder.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #666;">
                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">📷</div>
                    <div style="font-size: 0.875rem;">Image not available</div>
                </div>
            `;
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
            
            const clickedIndex = this.galleryItems.indexOf(card);
            if (clickedIndex === -1) return;
            
            // Get only visible images for lightbox
            const visibleImages = this.galleryItems
                .filter(item => item.style.display !== 'none')
                .map(galleryItem => ({
                    src: galleryItem.querySelector('img').src,
                    title: galleryItem.querySelector('.card-title').textContent,
                    category: galleryItem.querySelector('.card-category').textContent,
                    alt: galleryItem.querySelector('img').alt,
                }));
            
            // Find the index of clicked item in visible items
            const visibleIndex = this.galleryItems
                .filter(item => item.style.display !== 'none')
                .indexOf(card);
                
            this.lightbox.open(visibleImages, visibleIndex);
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
        this.galleryItems.forEach(item => {
            const itemCategory = item.dataset.category;
            const shouldShow = filter === 'all' || itemCategory === filter;

            if (shouldShow) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });

        // Animate the visible items
        const visibleItems = this.galleryItems.filter(item => item.style.display === 'block');
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

export default GalleryFilter;

