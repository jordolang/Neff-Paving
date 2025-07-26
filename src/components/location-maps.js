/**
 * Location Maps Component
 * Handles displaying Google Maps for business locations
 */

export class LocationMaps {
    constructor() {
        this.locations = {
            reynoldsburg: {
                address: '1847 Brice Road, Reynoldsburg, OH 43068',
                name: 'Reynoldsburg Office',
                mapId: 'reynoldsburg-google-map'
            },
            zanesville: {
                address: '6575 W Pike, Zanesville, OH 43701',
                name: 'Main Location/Zanesville Office',
                mapId: 'zanesville-google-map'
            }
        };
        
        this.init();
    }

    init() {
        this.setupMapPlaceholders();
        this.bindEvents();
    }

    setupMapPlaceholders() {
        // Update both map placeholders to be clickable
        Object.values(this.locations).forEach(location => {
            const mapElement = document.getElementById(location.mapId);
            if (mapElement) {
                mapElement.style.cursor = 'pointer';
                mapElement.setAttribute('role', 'button');
                mapElement.setAttribute('tabindex', '0');
                mapElement.setAttribute('aria-label', `View ${location.name} on Google Maps`);
            }
        });
    }

    bindEvents() {
        // Add click handlers for both locations
        Object.entries(this.locations).forEach(([key, location]) => {
            const mapElement = document.getElementById(location.mapId);
            if (mapElement) {
                mapElement.addEventListener('click', () => this.loadMap(key));
                mapElement.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        this.loadMap(key);
                    }
                });
            }
        });
    }

    loadMap(locationKey) {
        const location = this.locations[locationKey];
        if (!location) return;

        const mapElement = document.getElementById(location.mapId);
        if (!mapElement) return;

        // Create Google Maps embed URL
        const embedUrl = this.createEmbedUrl(location.address);
        
        // Replace placeholder with iframe
        mapElement.innerHTML = `
            <iframe 
                src="${embedUrl}"
                width="100%" 
                height="400" 
                style="border:0; border-radius: 8px;" 
                allowfullscreen="" 
                loading="lazy" 
                referrerpolicy="no-referrer-when-downgrade"
                title="${location.name} Location Map">
            </iframe>
        `;

        // Update styling for loaded map
        mapElement.style.cursor = 'default';
        mapElement.classList.add('map-loaded');
    }

    createEmbedUrl(address) {
        const encodedAddress = encodeURIComponent(address);
        return `https://www.google.com/maps/embed/v1/place?key=&q=${encodedAddress}&zoom=15&maptype=roadmap`;
    }

    // Alternative method using Google Maps search URL (no API key required)
    openInGoogleMaps(locationKey) {
        const location = this.locations[locationKey];
        if (!location) return;

        const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(location.address)}`;
        window.open(searchUrl, '_blank');
    }

    // Public method to initialize maps without API key
    initWithoutApiKey() {
        Object.entries(this.locations).forEach(([key, location]) => {
            const mapElement = document.getElementById(location.mapId);
            if (!mapElement) return;

            // Create a static map view that opens Google Maps on click
            mapElement.innerHTML = `
                <div class="static-map-view" onclick="window.open('https://www.google.com/maps/search/${encodeURIComponent(location.address)}', '_blank')" style="cursor: pointer;">
                    <div class="map-static-content">
                        <svg viewBox="0 0 24 24" fill="currentColor" style="width: 48px; height: 48px; color: #4285f4; margin-bottom: 16px;">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                        </svg>
                        <h4 style="margin: 0 0 8px 0; color: #1a73e8;">${location.address}</h4>
                        <p style="margin: 0; color: #5f6368;">Click to view in Google Maps</p>
                        <div style="margin-top: 12px; padding: 8px 16px; background: #4285f4; color: white; border-radius: 4px; display: inline-block;">
                            View on Google Maps
                        </div>
                    </div>
                </div>
            `;

            // Style the static map view
            const staticView = mapElement.querySelector('.static-map-view');
            if (staticView) {
                Object.assign(staticView.style, {
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '300px',
                    backgroundColor: '#f8f9fa',
                    border: '2px dashed #dadce0',
                    borderRadius: '8px',
                    textAlign: 'center',
                    transition: 'all 0.3s ease',
                    padding: '20px'
                });

                // Add hover effect
                staticView.addEventListener('mouseenter', function() {
                    this.style.backgroundColor = '#e8f0fe';
                    this.style.borderColor = '#4285f4';
                });

                staticView.addEventListener('mouseleave', function() {
                    this.style.backgroundColor = '#f8f9fa';
                    this.style.borderColor = '#dadce0';
                });
            }
        });
    }

    // Method to load maps with iframe embed (requires basic setup)
    loadEmbeddedMaps() {
        Object.entries(this.locations).forEach(([key, location]) => {
            const mapElement = document.getElementById(location.mapId);
            if (!mapElement) return;

            // Create embedded map using Google Maps embed (no API key needed for basic embed)
            const encodedAddress = encodeURIComponent(location.address);
            const embedUrl = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3048.8!2d-82.8!3d39.9!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMznCsDU4JzAwLjAiTiA4MsKwNDgnMDAuMCJX!5e0!3m2!1sen!2sus!4v1234567890123!5m2!1sen!2sus&q=${encodedAddress}`;
            
            mapElement.innerHTML = `
                <iframe 
                    src="https://www.google.com/maps?q=${encodedAddress}&output=embed"
                    width="100%" 
                    height="350" 
                    style="border:0; border-radius: 8px;" 
                    allowfullscreen="" 
                    loading="lazy" 
                    referrerpolicy="no-referrer-when-downgrade"
                    title="${location.name} Location Map">
                </iframe>
            `;

            mapElement.classList.add('map-loaded');
        });
    }
}

// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize location maps
    const locationMaps = new LocationMaps();
    
    // Load embedded maps immediately (no API key required)
    locationMaps.loadEmbeddedMaps();
});
