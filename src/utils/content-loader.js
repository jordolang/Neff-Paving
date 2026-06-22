// Content loader utility - Loads CMS-managed content from JSON files
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load JSON content files
const homepageData = JSON.parse(readFileSync(join(__dirname, '../../content/homepage.json'), 'utf-8'));
const servicesData = JSON.parse(readFileSync(join(__dirname, '../../content/services.json'), 'utf-8'));
const galleryData = JSON.parse(readFileSync(join(__dirname, '../../content/gallery.json'), 'utf-8'));

// Export individual content modules
export const homepage = homepageData;
export const services = servicesData;
export const gallery = galleryData;

// Helper function to get all content as a single object
export function getAllContent() {
  return {
    homepage: homepageData,
    services: servicesData,
    gallery: galleryData
  };
}

// Helper function to get gallery images with full paths
export function getGalleryImagesWithPaths() {
  const allImages = [];
  Object.entries(galleryData).forEach(([category, images]) => {
    images.forEach(image => {
      allImages.push({
        ...image,
        category,
        path: `/assets/gallery/${category}/${image.filename}`
      });
    });
  });
  return allImages;
}

// Helper function to get all services in a flat array
export function getAllServices() {
  const asphalt = servicesData.asphaltServices || [];
  const concrete = servicesData.concreteServices || [];
  return [...asphalt, ...concrete];
}

// Helper function to get service by ID
export function getServiceById(id) {
  const allServices = getAllServices();
  return allServices.find(service => service.id === id);
}

// Helper function to get gallery images by category
export function getGalleryImagesByCategory(category) {
  return galleryData[category] || [];
}
