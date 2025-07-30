import GalleryModal from './gallery-modal.js';

const projects = [
    {
        category: 'residential',
        image: '/assets/images/projects/residential-driveway-1.jpg',
        title: 'Modern Driveway',
        description: 'Residential • 2023',
        tag: 'Before/After'
    },
    {
        category: 'commercial',
        image: '/assets/images/projects/commercial-parking-1.jpg',
        title: 'Retail Parking Lot',
        description: 'Commercial • 2023',
        tag: 'New Construction'
    },
    {
        category: 'maintenance',
        image: '/assets/images/projects/maintenance-repair-1.jpg',
        title: 'Crack Sealing',
        description: 'Maintenance • 2023',
        tag: 'Preventive Care'
    },
    {
        category: 'custom',
        image: '/assets/images/projects/custom-decorative-1.jpg',
        title: 'Decorative Asphalt',
        description: 'Custom • 2023',
        tag: 'Specialty Work'
    },
    {
        category: 'residential',
        image: '/assets/images/projects/residential-walkway-1.jpg',
        title: 'Garden Walkway',
        description: 'Residential • 2023',
        tag: 'New Installation'
    },
    {
        category: 'commercial',
        image: '/assets/images/projects/commercial-warehouse-1.jpg',
        title: 'Warehouse Access',
        description: 'Commercial • 2023',
        tag: 'Heavy Duty'
    }
];

export class Gallery {
    constructor() {
        this.filterButtons = document.querySelectorAll('.filter-btn');
        this.galleryGrid = document.querySelector('.gallery-grid');
        this.galleryModal = new GalleryModal();

        this.loadProjects();
        this.initFilters();
    }

    loadProjects() {
        this.galleryGrid.innerHTML = ''; // Clear existing items
        projects.forEach(project => {
            const item = this.createGalleryItem(project);
            this.galleryGrid.appendChild(item);
        });
        this.galleryItems = document.querySelectorAll('.gallery-item');
        this.initModal();
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

