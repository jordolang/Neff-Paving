/**
 * Measurement Storage Utility
 * Handles persistence of measurement data across tool switches and page reloads
 */

const STORAGE_KEYS = {
    GOOGLE_MAPS_DATA: 'neff_paving_google_maps_measurements',
    ARCGIS_DATA: 'neff_paving_arcgis_measurements',
    ACTIVE_TOOL: 'neff_paving_active_measurement_tool',
    MEASUREMENT_SESSION: 'neff_paving_measurement_session'
};

/**
 * Store measurement data for a specific tool
 */
export function storeMeasurementData(toolType, data) {
    try {
        const key = getStorageKey(toolType);
        const storageData = {
            data,
            timestamp: new Date().toISOString(),
            toolType
        };
        
        sessionStorage.setItem(key, JSON.stringify(storageData));
        
        // Also update the active tool
        sessionStorage.setItem(STORAGE_KEYS.ACTIVE_TOOL, toolType);
        
        // Update session metadata
        updateSessionMetadata();
        
        console.log(`Measurement data stored for ${toolType}:`, data);
    } catch (error) {
        console.error('Failed to store measurement data:', error);
    }
}

/**
 * Retrieve measurement data for a specific tool
 */
export function getMeasurementData(toolType) {
    try {
        const key = getStorageKey(toolType);
        const stored = sessionStorage.getItem(key);
        
        if (!stored) {
            return null;
        }
        
        const parsedData = JSON.parse(stored);
        
        // Check if data is still valid (not older than 24 hours)
        const dataAge = Date.now() - new Date(parsedData.timestamp).getTime();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours
        
        if (dataAge > maxAge) {
            clearMeasurementData(toolType);
            return null;
        }
        
        return parsedData.data;
    } catch (error) {
        console.error('Failed to retrieve measurement data:', error);
        return null;
    }
}

/**
 * Clear measurement data for a specific tool
 */
export function clearMeasurementData(toolType) {
    try {
        const key = getStorageKey(toolType);
        sessionStorage.removeItem(key);
        
        // Update session metadata
        updateSessionMetadata();
        
        console.log(`Measurement data cleared for ${toolType}`);
    } catch (error) {
        console.error('Failed to clear measurement data:', error);
    }
}

/**
 * Clear all measurement data
 */
export function clearAllMeasurementData() {
    try {
        Object.values(STORAGE_KEYS).forEach(key => {
            sessionStorage.removeItem(key);
        });
        
        console.log('All measurement data cleared');
    } catch (error) {
        console.error('Failed to clear all measurement data:', error);
    }
}

/**
 * Get the active measurement tool
 */
export function getActiveTool() {
    return sessionStorage.getItem(STORAGE_KEYS.ACTIVE_TOOL) || 'google-maps';
}

/**
 * Set the active measurement tool
 */
export function setActiveTool(toolType) {
    try {
        sessionStorage.setItem(STORAGE_KEYS.ACTIVE_TOOL, toolType);
        updateSessionMetadata();
    } catch (error) {
        console.error('Failed to set active tool:', error);
    }
}

/**
 * Check if any measurement data exists
 */
export function hasMeasurementData() {
    return Object.values(STORAGE_KEYS).some(key => {
        if (key === STORAGE_KEYS.MEASUREMENT_SESSION) return false;
        return sessionStorage.getItem(key) !== null;
    });
}

/**
 * Get all available measurement data
 */
export function getAllMeasurementData() {
    return {
        googleMaps: getMeasurementData('google-maps'),
        arcgis: getMeasurementData('arcgis'),
        activeTool: getActiveTool()
    };
}

/**
 * Get measurement summary for display
 */
export function getMeasurementSummary() {
    const allData = getAllMeasurementData();
    const summary = {
        hasData: false,
        tools: [],
        totalMeasurements: 0
    };
    
    if (allData.googleMaps) {
        summary.hasData = true;
        summary.tools.push({
            type: 'google-maps',
            name: 'Google Maps',
            hasArea: !!allData.googleMaps.areaInSquareFeet,
            area: allData.googleMaps.areaInSquareFeet || 0,
            timestamp: allData.googleMaps.timestamp
        });
        summary.totalMeasurements++;
    }
    
    if (allData.arcgis) {
        summary.hasData = true;
        const arcgisSummary = allData.arcgis.getMeasurementSummary ? 
            allData.arcgis.getMeasurementSummary() : 
            { measurementCount: { areas: 0, distances: 0 } };
        
        summary.tools.push({
            type: 'arcgis',
            name: 'ArcGIS 3D',
            hasArea: arcgisSummary.measurementCount.areas > 0,
            area: arcgisSummary.totalArea?.value || 0,
            timestamp: allData.arcgis.timestamp
        });
        summary.totalMeasurements += arcgisSummary.measurementCount.areas + arcgisSummary.measurementCount.distances;
    }
    
    return summary;
}

/**
 * Restore measurement data to a tool instance
 */
export function restoreMeasurementData(toolType, toolInstance) {
    try {
        const data = getMeasurementData(toolType);
        if (!data) {
            return false;
        }
        
        if (toolType === 'google-maps' && toolInstance.restoreAreaData) {
            toolInstance.restoreAreaData(data);
            return true;
        }
        
        if (toolType === 'arcgis' && toolInstance.restoreMeasurementData) {
            toolInstance.restoreMeasurementData(data);
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('Failed to restore measurement data:', error);
        return false;
    }
}

/**
 * Handle form submission - clear all measurement data
 */
export function handleFormSubmission() {
    clearAllMeasurementData();
}

/**
 * Handle form reset - clear all measurement data
 */
export function handleFormReset() {
    clearAllMeasurementData();
}

// Private helper functions

function getStorageKey(toolType) {
    switch (toolType) {
        case 'google-maps':
            return STORAGE_KEYS.GOOGLE_MAPS_DATA;
        case 'arcgis':
            return STORAGE_KEYS.ARCGIS_DATA;
        default:
            throw new Error(`Unknown tool type: ${toolType}`);
    }
}

function updateSessionMetadata() {
    try {
        const metadata = {
            lastUpdated: new Date().toISOString(),
            tools: []
        };
        
        // Check which tools have data
        if (sessionStorage.getItem(STORAGE_KEYS.GOOGLE_MAPS_DATA)) {
            metadata.tools.push('google-maps');
        }
        
        if (sessionStorage.getItem(STORAGE_KEYS.ARCGIS_DATA)) {
            metadata.tools.push('arcgis');
        }
        
        sessionStorage.setItem(STORAGE_KEYS.MEASUREMENT_SESSION, JSON.stringify(metadata));
    } catch (error) {
        console.error('Failed to update session metadata:', error);
    }
}

// Initialize storage cleanup on page load
export function initializeStorage() {
    try {
        // Clean up old sessions (older than 24 hours)
        const sessionData = sessionStorage.getItem(STORAGE_KEYS.MEASUREMENT_SESSION);
        if (sessionData) {
            const parsed = JSON.parse(sessionData);
            const sessionAge = Date.now() - new Date(parsed.lastUpdated).getTime();
            const maxAge = 24 * 60 * 60 * 1000; // 24 hours
            
            if (sessionAge > maxAge) {
                clearAllMeasurementData();
            }
        }
    } catch (error) {
        console.error('Failed to initialize storage:', error);
    }
}
