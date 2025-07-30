
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
        // Clear existing gallery items (keep only the sample ones for fallback)
        this.galleryContainer.innerHTML = '';
        
        // Load all images from our data
        Object.entries(galleryImages).forEach(([category, images]) => {
            images.forEach(image => {
                const galleryCard = this.createGalleryCard(image, category);
                this.galleryContainer.appendChild(galleryCard);
                this.galleryItems.push(galleryCard);
            });
        });
    }

    createGalleryCard(image, category) {
        const card = document.createElement('div');
        card.className = 'gallery-card';
        card.setAttribute('data-category', category);
        
        // Use the asset path utility to get the correct path
        const imagePath = getAssetPath(`/assets/gallery/${category}/${image.filename}`);
        
        card.innerHTML = `
            <div class="card-image">
                <picture class="image">
                    <source media="(max-width: 600px)" srcset="${imagePath}">
                    <source media="(min-width: 601px)" srcset="${imagePath}">
                    <img loading="lazy" decoding="async" src="${imagePath}" alt="${image.alt}" width="630" height="400">
                </picture>
            </div>
            <div class="card-overlay">
                <div class="card-title">${image.title}</div>
                <div class="card-category">${category.charAt(0).toUpperCase() + category.slice(1)}</div>
            </div>
        `;
        
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

