// Google Maps Configuration - DISABLED for production builds
export const GOOGLE_MAPS_CONFIG = {
    apiKey: 'AIzaSyA7VWDFVhPwWzWrkLxQQ1bktzQvikLoDXk', // Disabled for now
    version: 'weekly',
    libraries: ['drawing', 'geometry', 'places'],
    region: 'US',
    language: 'en'
};

// Default map options - only initialize if Google Maps is available
export const DEFAULT_MAP_OPTIONS = typeof google !== 'undefined' && google.maps ? {
    zoom: 15,
    center: { lat: 39.9612, lng: -82.9988 }, // Columbus, Ohio
    mapTypeId: 'hybrid',
    mapTypeControl: true,
    mapTypeControlOptions: {
        style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
        position: google.maps.ControlPosition.TOP_CENTER
    },
    zoomControl: true,
    zoomControlOptions: {
        position: google.maps.ControlPosition.RIGHT_CENTER
    },
    scaleControl: true,
    streetViewControl: true,
    streetViewControlOptions: {
        position: google.maps.ControlPosition.RIGHT_TOP
    },
    fullscreenControl: true
} : {
    // Fallback options when Google Maps is not available
    zoom: 15,
    center: { lat: 39.9612, lng: -82.9988 },
    mapTypeId: 'hybrid',
    mapTypeControl: true,
    zoomControl: true,
    scaleControl: true,
    streetViewControl: true,
    fullscreenControl: true
};

// Drawing manager options - only initialize if Google Maps is available
export const DRAWING_MANAGER_OPTIONS = typeof google !== 'undefined' && google.maps ? {
    drawingMode: google.maps.drawing.OverlayType.POLYGON,
    drawingControl: true,
    drawingControlOptions: {
        position: google.maps.ControlPosition.TOP_CENTER,
        drawingModes: [
            google.maps.drawing.OverlayType.POLYGON,
            google.maps.drawing.OverlayType.RECTANGLE,
            google.maps.drawing.OverlayType.CIRCLE
        ]
    },
    polygonOptions: {
        fillColor: '#FFD700',
        fillOpacity: 0.3,
        strokeWeight: 2,
        strokeColor: '#FFD700',
        clickable: false,
        editable: true,
        zIndex: 1
    },
    rectangleOptions: {
        fillColor: '#FFD700',
        fillOpacity: 0.3,
        strokeWeight: 2,
        strokeColor: '#FFD700',
        clickable: false,
        editable: true,
        zIndex: 1
    },
    circleOptions: {
        fillColor: '#FFD700',
        fillOpacity: 0.3,
        strokeWeight: 2,
        strokeColor: '#FFD700',
        clickable: false,
        editable: true,
        zIndex: 1
    }
} : {
    // Fallback options when Google Maps is not available
    drawingMode: 'polygon',
    drawingControl: true,
    polygonOptions: {
        fillColor: '#FFD700',
        fillOpacity: 0.3,
        strokeWeight: 2,
        strokeColor: '#FFD700',
        clickable: false,
        editable: true,
        zIndex: 1
    },
    rectangleOptions: {
        fillColor: '#FFD700',
        fillOpacity: 0.3,
        strokeWeight: 2,
        strokeColor: '#FFD700',
        clickable: false,
        editable: true,
        zIndex: 1
    },
    circleOptions: {
        fillColor: '#FFD700',
        fillOpacity: 0.3,
        strokeWeight: 2,
        strokeColor: '#FFD700',
        clickable: false,
        editable: true,
        zIndex: 1
    }
};

// Area calculation helpers
export const AREA_UNITS = {
    SQUARE_METERS: 'sq_m',
    SQUARE_FEET: 'sq_ft',
    ACRES: 'acres',
    SQUARE_KILOMETERS: 'sq_km',
    SQUARE_MILES: 'sq_miles'
};

export const UNIT_CONVERSIONS = {
    [AREA_UNITS.SQUARE_METERS]: {
        [AREA_UNITS.SQUARE_FEET]: 10.7639,
        [AREA_UNITS.ACRES]: 0.000247105,
        [AREA_UNITS.SQUARE_KILOMETERS]: 0.000001,
        [AREA_UNITS.SQUARE_MILES]: 3.861e-7
    }
};