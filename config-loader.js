// Configuration loader for standard HTML script tags
// This file provides a simple way to load environment variables in non-module contexts
// DO NOT hardcode API keys in this file

(function() {
    'use strict';

    // This function will be replaced during build with actual environment values
    // For development, you need to manually set the API key in .env.local
    // The build process will inject the actual value here

    // Default configuration
    const config = {
        googleMapsApiKey: '%VITE_GOOGLE_MAPS_API_KEY%',

        // Helper function to check if API key is available
        hasGoogleMapsApiKey: function() {
            return this.googleMapsApiKey &&
                   this.googleMapsApiKey !== '%VITE_GOOGLE_MAPS_API_KEY%' &&
                   this.googleMapsApiKey !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE' &&
                   this.googleMapsApiKey !== '';
        },

        // Get the full Google Maps API URL with the key
        getGoogleMapsUrl: function(libraries, callback) {
            if (!this.hasGoogleMapsApiKey()) {
                console.warn('Google Maps API key not configured. Maps will use fallback mode.');
                return null;
            }

            libraries = libraries || [];
            let url = 'https://maps.googleapis.com/maps/api/js?key=' + this.googleMapsApiKey;

            if (libraries.length > 0) {
                url += '&libraries=' + libraries.join(',');
            }

            if (callback) {
                url += '&callback=' + callback;
            }

            return url;
        }
    };

    // Make config available globally
    window.NeffPavingConfig = config;

    // Log initialization (can be removed in production)
    if (config.hasGoogleMapsApiKey()) {
        console.log('✅ Google Maps API key loaded successfully');
    } else {
        console.warn('⚠️ Google Maps API key not configured - using fallback mode');
        console.log('To enable Google Maps:');
        console.log('1. Create a .env.local file in the project root');
        console.log('2. Add: VITE_GOOGLE_MAPS_API_KEY=your_api_key_here');
        console.log('3. Rebuild the project');
    }
})();
