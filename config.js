// Configuration file for loading environment variables
// This file loads the Google Maps API key from environment variables
// DO NOT hardcode API keys in this file

// For local development, the API key should be set in .env.local
// For production, the API key should be injected during build/deployment

const config = {
    // Google Maps API Key - loaded from environment variables
    // Falls back to empty string if not set (will show fallback map)
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',

    // Helper function to check if API key is available
    hasGoogleMapsApiKey() {
        return this.googleMapsApiKey && this.googleMapsApiKey !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE';
    },

    // Get the full Google Maps API URL with the key
    getGoogleMapsUrl(libraries = []) {
        if (!this.hasGoogleMapsApiKey()) {
            console.warn('Google Maps API key not configured. Maps will use fallback mode.');
            return null;
        }

        let url = `https://maps.googleapis.com/maps/api/js?key=${this.googleMapsApiKey}`;

        if (libraries.length > 0) {
            url += `&libraries=${libraries.join(',')}`;
        }

        return url;
    }
};

// For non-module scripts, make config available globally
if (typeof window !== 'undefined') {
    window.NeffPavingConfig = config;
}

export default config;
