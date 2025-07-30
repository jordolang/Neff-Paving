import GalleryModal from './gallery-modal.js';

// Projects data embedded directly to avoid import issues
const projects = [
  {
    category: "commercial",
    image: "assets/images/projects/commercial-parking-1.jpg",
    title: "Commercial Parking Lot",
    description: "Commercial • 2023",
    tag: "New Construction"
  },
  {
    category: "commercial",
    image: "assets/images/projects/commercial-warehouse-1.jpg",
    title: "Warehouse Access Road",
    description: "Commercial • 2023",
    tag: "Heavy Duty"
  },
  {
    category: "custom",
    image: "assets/images/projects/custom-decorative-1.jpg",
    title: "Decorative Asphalt",
    description: "Custom • 2023",
    tag: "Specialty Work"
  },
  {
    category: "maintenance",
    image: "assets/images/projects/maintenance-repair-1.jpg",
    title: "Asphalt Maintenance",
    description: "Maintenance • 2023",
    tag: "Preventive Care"
  },
  {
    category: "residential",
    image: "assets/images/projects/residential-driveway-1.jpg",
    title: "Modern Residential Driveway",
    description: "Residential • 2023",
    tag: "New Installation"
  },
  {
    category: "residential",
    image: "assets/images/projects/residential-walkway-1.jpg",
    title: "Residential Walkway",
    description: "Residential • 2023",
    tag: "New Installation"
  }
];

export class Gallery {
    constructor() {
        this.filterButtons = document.querySelectorAll('.filter-btn');
        this.galleryGrid = document.querySelector('.gallery-grid');
        this.galleryModal = new GalleryModal();
        this.isLoading = false;

        this.init();
    }

    async init() {
        try {
            this.showLoading();
            await this.loadProjects();
            this.initFilters();
            this.hideLoading();
        } catch (error) {
            console.error('Error initializing gallery:', error);
            this.showError('Failed to load gallery. Please refresh the page.');
        }
    }

    async loadProjects() {
        this.galleryGrid.innerHTML = ''; // Clear existing items
        
        // Add error handling for missing images
        const validProjects = projects.filter(project => {
            return project.image && project.title && project.category;
        });

        if (validProjects.length === 0) {
            this.showError('No gallery items found.');
            return;
        }

        validProjects.forEach(project => {
            const item = this.createGalleryItem(project);
            this.galleryGrid.appendChild(item);
        });
        
        this.galleryItems = document.querySelectorAll('.gallery-item');
        this.initModal();
        this.preloadImages();
    }

    showLoading() {
        this.isLoading = true;
        this.galleryGrid.innerHTML = `
            <div class="gallery-loading">
                <div class="loading-spinner"></div>
                <p>Loading gallery...</p>
            </div>
        `;
    }

    hideLoading() {
        this.isLoading = false;
        const loadingElement = this.galleryGrid.querySelector('.gallery-loading');
        if (loadingElement) {
            loadingElement.remove();
        }
    }

    showError(message) {
        this.galleryGrid.innerHTML = `
            <div class="gallery-error">
                <div class="error-icon">⚠️</div>
                <p>${message}</p>
                <button onclick="window.location.reload()" class="btn btn-primary">Retry</button>
            </div>
        `;
    }

    preloadImages() {
        // Preload first few images for better performance
        const firstImages = Array.from(this.galleryItems)
            .slice(0, 6)
            .map(item => item.querySelector('img'));
        
        firstImages.forEach(img => {
            if (img && img.src) {
                const preloadImg = new Image();
                preloadImg.src = img.src;
                
                preloadImg.onerror = () => {
                    // If image fails to load, show a placeholder
                    img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMTUwTDE3NSAxMjVIMjI1TDIwMCAxNTBaIiBmaWxsPSIjOUI5QkEwIi8+CjxwYXRoIGQ9Ik0yMDAgMTUwTDE3NSAxNzVIMjI1TDIwMCAxNTBaIiBmaWxsPSIjOUI5QkEwIi8+Cjx0ZXh0IHg9IjIwMCIgeT0iMjAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOUI5QkEwIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiPkltYWdlIG5vdCBhdmFpbGFibGU8L3RleHQ+Cjwvc3ZnPg==';
                    img.alt = 'Image not available';
                };
            }
        });
    }

    createGalleryItem(project) {
        const item = document.createElement('div');
        item.className = `gallery-item`;
        item.dataset.category = project.category;
        item.innerHTML = `
            <div class="gallery-image">
                <img src="${project.image}" alt="${project.title}" loading="lazy">
                <div class="gallery-overlay">
                    <div class="gallery-info">
                        <h4>${project.title}</h4>
                        <p>${project.description}</p>
                        <span class="gallery-tag">${project.tag}</span>
                    </div>
                    <button class="gallery-expand" aria-label="View full project">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                            <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
        return item;
    }
    
    initFilters() {
        this.filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.filter(button.dataset.filter);
                this.setActiveButton(button);
            });
        });
    }

    initModal() {
        this.galleryItems.forEach(item => {
            item.addEventListener('click', () => {
                this.galleryModal.open(item);
            });
        });
    }

    filter(category) {
        this.galleryItems.forEach(item => {
            const itemCategory = item.dataset.category;
            if (category === 'all' || category === itemCategory) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }

    setActiveButton(activeButton) {
        this.filterButtons.forEach(button => {
            button.classList.remove('active');
        });
        activeButton.classList.add('active');
    }
}

