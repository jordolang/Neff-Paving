
import { gsap } from 'gsap';

class GalleryFilter {
    constructor(galleryElement) {
        this.galleryElement = galleryElement;
        this.filterButtons = document.querySelectorAll('.button-group .button');
        this.galleryWrapper = document.querySelector('.gallery-wrapper');
        this.galleryItems = Array.from(this.galleryWrapper.querySelectorAll('.gallery'));

        this.init();
    }

    init() {
        this.initFilters();
        // Set initial state - show "All" gallery by default
        this.showGallery('one');
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

    handleFilterClick(button) {
        // Remove active class from all buttons
        this.filterButtons.forEach(btn => btn.classList.remove('cs-active'));
        // Add active class to clicked button
        button.classList.add('cs-active');
        
        const filter = button.dataset.filter;
        this.showGallery(filter);
    }

    showGallery(filter) {
        // Hide all galleries first
        this.galleryItems.forEach(gallery => {
            gallery.classList.add('hidden');
            gallery.style.display = 'none';
        });

        // Show the selected gallery
        const targetGallery = this.galleryItems.find(gallery => 
            gallery.dataset.category === filter
        );

        if (targetGallery) {
            targetGallery.style.display = 'flex';
            targetGallery.classList.remove('hidden');
            
            // Animate gallery cards
            const cards = targetGallery.querySelectorAll('.gallery-card');
            gsap.fromTo(cards, 
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

