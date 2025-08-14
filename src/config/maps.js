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
  zoom: 18,
  center: { lat: 39.94041, lng: -82.00734 }, // Muskingum County Courthouse
  mapTypeId: 'satellite',
  tilt: 0, // Explicitly set tilt to 0 to avoid 45° imagery
  mapTypeControl: true,
  mapTypeControlOptions: {
    mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain'],
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
  zoom: 18,
  center: { lat: 39.94041, lng: -82.00734 },
  mapTypeId: 'satellite',
  tilt: 0, // Explicitly set tilt to 0 to avoid 45° imagery
  mapTypeControl: true,
  mapTypeControlOptions: {
    mapTypeIds: ['roadmap', 'satellite', 'hybrid', 'terrain']
  },
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