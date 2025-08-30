// Gallery images data - Updated to use projects folder
export const galleryImages = {
    commercial: [
        { filename: 'commercial-project-1.jpg', title: 'Commercial Project 1', alt: 'Commercial paving project showcasing quality workmanship' },
        { filename: 'commercial-project-2.jpg', title: 'Commercial Project 2', alt: 'Commercial paving project with professional finish' },
        { filename: 'commercial-project-3.jpg', title: 'Commercial Project 3', alt: 'Commercial paving project demonstrating expertise' },
        { filename: 'commercial-project-4.jpg', title: 'Commercial Project 4', alt: 'Commercial paving project with attention to detail' }
    ],
    residential: [
        { filename: 'residential-driveway-1.jpg', title: 'Residential Driveway 1', alt: 'Beautiful residential driveway installation' },
        { filename: 'residential-driveway-2.jpg', title: 'Residential Driveway 2', alt: 'Quality residential driveway paving' },
        { filename: 'residential-driveway-3.jpg', title: 'Residential Driveway 3', alt: 'Professional residential driveway work' },
        { filename: 'residential-driveway-3.webp', title: 'Residential Driveway 3 WebP', alt: 'Professional residential driveway work (WebP format)' },
        { filename: 'residential-driveway-4.jpg', title: 'Residential Driveway 4', alt: 'Custom residential driveway design' },
        { filename: 'residential-driveway-5.jpg', title: 'Residential Driveway 5', alt: 'Premium residential driveway installation' },
        { filename: 'residential-driveway-6.jpg', title: 'Residential Driveway 6', alt: 'Expert residential driveway paving' },
        { filename: 'residential-driveway-7.jpg', title: 'Residential Driveway 7', alt: 'High-quality residential driveway work' },
        { filename: 'residential-driveway-8.webp', title: 'Residential Driveway 8 WebP', alt: 'High-quality residential driveway work (WebP format)' },
        { filename: 'residential-driveway-9.jpg', title: 'Residential Driveway 9', alt: 'Outstanding residential driveway project' }
    ],
    equipment: [
        { filename: 'leeboy-1.jpg', title: 'Leeboy Equipment', alt: 'Professional Leeboy paving equipment in action' }
    ],
    concrete: [
        // Note: No concrete images in projects folder currently
        // This category will be empty until concrete project images are added
    ]
};

// Helper function to get all images as a flat array
export function getAllGalleryImages() {
    const allImages = [];
    Object.entries(galleryImages).forEach(([category, images]) => {
        images.forEach(image => {
            allImages.push({
                ...image,
                category,
                path: `/assets/images/projects/${image.filename}`
            });
        });
    });
    return allImages;
}