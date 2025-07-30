/**
 * Lightbox component for image gallery
 */
class Lightbox {
    constructor() {
        this.currentIndex = 0;
        this.images = [];
        this.isOpen = false;
        this.init();
    }

    init() {
        this.createLightbox();
        this.bindEvents();
    }

    createLightbox() {
        const lightboxHTML = `
            <div id="lightbox" class="lightbox" aria-hidden="true" role="dialog" aria-labelledby="lightbox-title" aria-describedby="lightbox-description">
                <div class="lightbox-overlay"></div>
                <div class="lightbox-content">
                    <div class="lightbox-header">
                        <h2 id="lightbox-title" class="lightbox-title"></h2>
                        <button class="lightbox-close" aria-label="Close lightbox" title="Close">&times;</button>
                    </div>
                    <div class="lightbox-main">
                        <button class="lightbox-nav lightbox-prev" aria-label="Previous image" title="Previous">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
                            </svg>
                        </button>
                        <div class="lightbox-image-container">
                            <img class="lightbox-image" src="" alt="" loading="lazy">
                            <div class="lightbox-loading">
                                <div class="loading-spinner"></div>
                            </div>
                        </div>
                        <button class="lightbox-nav lightbox-next" aria-label="Next image" title="Next">
                            <svg viewBox="0 0 24 24" fill="currentColor">
                                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                            </svg>
                        </button>
                    </div>
                    <div class="lightbox-footer">
                        <p id="lightbox-description" class="lightbox-description"></p>
                        <div class="lightbox-counter">
                            <span class="current-index">1</span> / <span class="total-images">1</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', lightboxHTML);
        this.lightboxElement = document.getElementById('lightbox');
        this.lightboxImage = this.lightboxElement.querySelector('.lightbox-image');
        this.lightboxTitle = this.lightboxElement.querySelector('.lightbox-title');
        this.lightboxDescription = this.lightboxElement.querySelector('.lightbox-description');
        this.lightboxLoading = this.lightboxElement.querySelector('.lightbox-loading');
        this.currentIndexElement = this.lightboxElement.querySelector('.current-index');
        this.totalImagesElement = this.lightboxElement.querySelector('.total-images');
    }

    bindEvents() {
        // Close button
        this.lightboxElement.querySelector('.lightbox-close').addEventListener('click', () => {
            this.close();
        });

        // Navigation buttons
        this.lightboxElement.querySelector('.lightbox-prev').addEventListener('click', () => {
            this.prev();
        });

        this.lightboxElement.querySelector('.lightbox-next').addEventListener('click', () => {
            this.next();
        });

        // Overlay click to close
        this.lightboxElement.querySelector('.lightbox-overlay').addEventListener('click', () => {
            this.close();
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (!this.isOpen) return;

            switch (e.key) {
                case 'Escape':
                    this.close();
                    break;
                case 'ArrowLeft':
                    this.prev();
                    break;
                case 'ArrowRight':
                    this.next();
                    break;
            }
        });

        // Image load event
        this.lightboxImage.addEventListener('load', () => {
            this.lightboxLoading.style.display = 'none';
        });

        this.lightboxImage.addEventListener('error', () => {
            this.lightboxLoading.style.display = 'none';
            this.lightboxImage.alt = 'Image failed to load';
        });
    }

    open(images, index = 0) {
        this.images = images;
        this.currentIndex = index;
        this.isOpen = true;

        // Update counter
        this.totalImagesElement.textContent = this.images.length;

        // Show lightbox
        this.lightboxElement.classList.add('active');
        this.lightboxElement.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';

        // Load initial image
        this.loadImage();

        // Focus management
        this.lightboxElement.querySelector('.lightbox-close').focus();
    }

    close() {
        this.isOpen = false;
        this.lightboxElement.classList.remove('active');
        this.lightboxElement.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        
        // Clear image to prevent flicker
        setTimeout(() => {
            this.lightboxImage.src = '';
        }, 300);
    }

    prev() {
        if (this.images.length <= 1) return;
        
        this.currentIndex = this.currentIndex > 0 ? this.currentIndex - 1 : this.images.length - 1;
        this.loadImage();
    }

    next() {
        if (this.images.length <= 1) return;
        
        this.currentIndex = this.currentIndex < this.images.length - 1 ? this.currentIndex + 1 : 0;
        this.loadImage();
    }

    loadImage() {
        const imageData = this.images[this.currentIndex];
        
        // Show loading
        this.lightboxLoading.style.display = 'flex';
        
        // Update content
        this.lightboxTitle.textContent = imageData.title || '';
        this.lightboxDescription.textContent = imageData.category || '';
        this.currentIndexElement.textContent = this.currentIndex + 1;
        
        // Load image
        this.lightboxImage.src = imageData.src;
        this.lightboxImage.alt = imageData.alt || imageData.title || '';
        
        // Update navigation visibility
        const prevBtn = this.lightboxElement.querySelector('.lightbox-prev');
        const nextBtn = this.lightboxElement.querySelector('.lightbox-next');
        
        if (this.images.length <= 1) {
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'none';
        } else {
            prevBtn.style.display = 'flex';
            nextBtn.style.display = 'flex';
        }
    }
}

export default Lightbox;
