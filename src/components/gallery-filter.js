
import { gsap } from 'gsap';
import Lightbox from './lightbox.js';

class GalleryFilter {
    constructor(galleryElement) {
        this.galleryElement = galleryElement;
        this.filterButtons = document.querySelectorAll('.button-group .button');
        this.galleryItems = Array.from(this.galleryElement.querySelectorAll('.gallery-card'));
        this.lightbox = new Lightbox();

        this.init();
    }

    init() {
        this.initFilters();
        this.initLightbox();
        // Set initial state - show "All" items by default
        this.filterItems('all');
        // Set first button as active
        if (this.filterButtons.length > 0) {
            this.filterButtons[0].classList.add('cs-active');
        }
    }

    initFilters() {
        this.filterButtons.forEach(button => {
            button.addEventListener('click', () => this.handleFilterClick(button));
        });
    }

    initLightbox() {
        this.galleryItems.forEach((item, index) => {
            item.addEventListener('click', () => {
                const images = this.galleryItems.map(galleryItem => ({
                    src: galleryItem.querySelector('img').src,
                    title: galleryItem.querySelector('.card-title').textContent,
                    category: galleryItem.querySelector('.card-category').textContent,
                    alt: galleryItem.querySelector('img').alt,
                }));
                this.lightbox.open(images, index);
            });
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

