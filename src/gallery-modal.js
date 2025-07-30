
export default class GalleryModal {
    constructor() {
        this.modal = null;
    }

    open(galleryItem) {
        const imageSrc = galleryItem.querySelector('img').src;
        const title = galleryItem.querySelector('h4').textContent;
        const description = galleryItem.querySelector('p').textContent;

        this.modal = document.createElement('div');
        this.modal.classList.add('gallery-modal');
        this.modal.innerHTML = `
            <div class="gallery-modal-content">
                <span class="close">&times;</span>
                <img src="${imageSrc}" alt="${title}">
                <h3>${title}</h3>
                <p>${description}</p>
            </div>
        `;

        document.body.appendChild(this.modal);

        this.modal.querySelector('.close').addEventListener('click', () => {
            this.close();
        });

        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });
    }

    close() {
        if (this.modal) {
            this.modal.remove();
            this.modal = null;
        }
    }
}
