/**
 * Map-to-Form Data Binding
 * Handles communication between ArcGIS measurement components and estimate form
 */

class MapFormBinding {
    constructor() {
        this.measurementData = null;
        this.boundaryData = null;
        this.isInitialized = false;
        this.currentMeasurement = null;
        this.currentBoundary = null;
        this.boundaryPreview = null;
        this.isEditMode = false;
        this.drawingMetadata = null;
        
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupBindings());
        } else {
            this.setupBindings();
        }
    }

    setupBindings() {
        this.setupIframeMessageListener();
        this.setupFormButtons();
        this.updateSubmitButtonState();
        
        console.log('Map-to-form binding initialized');
    }

    /**
     * Set up message listener for iframe communication
     */
    setupIframeMessageListener() {
        window.addEventListener('message', (event) => {
            // Ensure message is from our measurement iframe
            if (event.origin !== window.location.origin) {
                return;
            }

            const { type, data } = event.data;

            switch (type) {
                case 'MEASUREMENT_COMPLETE':
                    this.handleMeasurementComplete(data);
                    break;
                case 'MEASUREMENT_CLEARED':
                    this.handleMeasurementCleared();
                    break;
                case 'MEASUREMENT_ERROR':
                    this.handleMeasurementError(data);
                    break;
                case 'BOUNDARY_COMPLETE':
                    this.handleBoundaryComplete(data);
                    break;
                case 'BOUNDARY_EDIT_START':
                    this.handleBoundaryEditStart(data);
                    break;
                case 'BOUNDARY_EDIT_UPDATE':
                    this.handleBoundaryEditUpdate(data);
                    break;
                case 'BOUNDARY_EDIT_COMPLETE':
                    this.handleBoundaryEditComplete(data);
                    break;
                case 'BOUNDARY_PREVIEW':
                    this.handleBoundaryPreview(data);
                    break;
                case 'BOUNDARY_CLEARED':
                    this.handleBoundaryCleared();
                    break;
                case 'DRAWING_METADATA':
                    this.handleDrawingMetadata(data);
                    break;
            }
        });
    }

    /**
     * Set up form button event listeners
     */
    setupFormButtons() {
        const clearButton = document.getElementById('clear-measurement');
        const confirmButton = document.getElementById('confirm-measurement');
        const clearBoundaryButton = document.getElementById('clear-boundary');
        const confirmBoundaryButton = document.getElementById('confirm-boundary');

        if (clearButton) {
            clearButton.addEventListener('click', () => this.clearMeasurement());
        }

        if (confirmButton) {
            confirmButton.addEventListener('click', () => this.confirmMeasurement());
        }

        if (clearBoundaryButton) {
            clearBoundaryButton.addEventListener('click', () => this.clearBoundary());
        }

        if (confirmBoundaryButton) {
            confirmBoundaryButton.addEventListener('click', () => this.confirmBoundary());
        }
    }

    /**
     * Handle boundary completion
     */
    handleBoundaryComplete(boundaryData) {
        console.log('Boundary completed:', boundaryData);

        const perimeter = this.calculatePerimeter(boundaryData.geometry);
        const isValid = this.validateBoundary(boundaryData.geometry);

        if (!isValid) {
            console.error('Invalid boundary data');
            this.updateMeasurementStatus('Invalid boundary: minimum 3 vertices required and polygon must be closed', 'error');
            return;
        }

        this.boundaryData = {
            ...boundaryData,
            perimeter: perimeter,
            vertexCount: boundaryData.geometry.rings[0].length - 1, // Subtract 1 for closing vertex
            timestamp: new Date().toISOString()
        };

        // Update UI
        this.updateBoundaryDisplay();
        this.populateBoundaryFields();
        this.updateSubmitButtonState();
    }

    /**
     * Calculate perimeter of the polygon
     */
    calculatePerimeter(geometry) {
        if (!geometry || !geometry.rings) {
            return 0;
        }

        // Calculate perimeter based on vertex coordinates
        const points = geometry.rings[0];
        let perimeter = 0;
        for (let i = 0; i < points.length - 1; i++) {
            const [x1, y1] = points[i];
            const [x2, y2] = points[i + 1];
            perimeter += Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        }
        // Closing edge (if not already closed)
        if (!this.isClosedPolygon(points)) {
            const [x1, y1] = points[0];
            const [x2, y2] = points[points.length - 1];
            perimeter += Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        }

        return perimeter;
    }

    /**
     * Validate the boundary data for minimum requirements
     */
    validateBoundary(geometry) {
        if (!geometry || !geometry.rings) {
            return false;
        }

        // Minimum number of vertices required (e.g., triangle)
        const MIN_VERTICES = 3;
        const points = geometry.rings[0];
        return points.length >= MIN_VERTICES + 1 && this.isClosedPolygon(points);
    }

    /**
     * Check if the polygon is closed
     */
    isClosedPolygon(points) {
        const firstPoint = points[0];
        const lastPoint = points[points.length - 1];
        return firstPoint[0] === lastPoint[0] && firstPoint[1] === lastPoint[1];
    }

    /**
     * Handle boundary edit start
     */
    handleBoundaryEditStart(data) {
        console.log('Boundary editing started:', data);
        this.isEditMode = true;
        this.updateMeasurementStatus('Boundary editing mode active', 'info');
    }

    /**
     * Handle boundary edit update
     */
    handleBoundaryEditUpdate(data) {
        console.log('Boundary editing updated:', data);
        // Update preview during editing
        this.boundaryPreview = data;
        this.updateBoundaryPreview();
    }

    /**
     * Handle boundary edit complete
     */
    handleBoundaryEditComplete(data) {
        console.log('Boundary editing completed:', data);
        this.isEditMode = false;
        this.handleBoundaryComplete(data);
    }

    /**
     * Handle boundary preview
     */
    handleBoundaryPreview(data) {
        console.log('Boundary preview:', data);
        this.boundaryPreview = data;
        this.updateBoundaryPreview();
    }

    /**
     * Handle drawing metadata
     */
    handleDrawingMetadata(data) {
        console.log('Drawing metadata:', data);
        this.drawingMetadata = {
            ...data,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Update boundary display in UI
     */
    updateBoundaryDisplay() {
        if (!this.boundaryData) return;

        const statusElement = document.getElementById('boundary-status');
        if (statusElement) {
            statusElement.innerHTML = `
                <div class="boundary-success">
                    <span class="status-indicator">✅</span>
                    <span class="status-text">Boundary drawn successfully</span>
                </div>
            `;
        }

        // Update perimeter display
        const perimeterElement = document.getElementById('boundary-perimeter-display');
        if (perimeterElement) {
            perimeterElement.textContent = `${this.boundaryData.perimeter.toLocaleString()} units`;
        }

        // Update vertex count display
        const vertexElement = document.getElementById('boundary-vertices-display');
        if (vertexElement) {
            vertexElement.textContent = `${this.boundaryData.vertexCount} vertices`;
        }
    }

    /**
     * Update boundary preview display
     */
    updateBoundaryPreview() {
        if (!this.boundaryPreview) return;

        const previewElement = document.getElementById('boundary-preview');
        if (previewElement) {
            const previewPerimeter = this.calculatePerimeter(this.boundaryPreview.geometry);
            const previewVertices = this.boundaryPreview.geometry.rings[0].length - 1;
            
            previewElement.innerHTML = `
                <div class="boundary-preview">
                    <span class="preview-text">Preview: ${previewVertices} vertices, ${previewPerimeter.toLocaleString()} units perimeter</span>
                </div>
            `;
        }
    }

    /**
     * Populate form fields with boundary data
     */
    populateBoundaryFields() {
        if (!this.boundaryData) return;

        // Store boundary coordinates
        const boundaryCoordinatesField = document.getElementById('boundary-coordinates');
        if (boundaryCoordinatesField) {
            boundaryCoordinatesField.value = JSON.stringify(this.boundaryData.geometry);
        }

        // Store perimeter
        const perimeterField = document.getElementById('boundary-perimeter');
        if (perimeterField) {
            perimeterField.value = this.boundaryData.perimeter.toString();
        }

        // Store vertex count
        const vertexCountField = document.getElementById('boundary-vertex-count');
        if (vertexCountField) {
            vertexCountField.value = this.boundaryData.vertexCount.toString();
        }

        // Store drawing metadata
        const drawingMetadataField = document.getElementById('drawing-metadata');
        if (drawingMetadataField && this.drawingMetadata) {
            drawingMetadataField.value = JSON.stringify(this.drawingMetadata);
        }

        // Store boundary timestamp
        const boundaryTimestampField = document.getElementById('boundary-timestamp');
        if (boundaryTimestampField) {
            boundaryTimestampField.value = this.boundaryData.timestamp;
        }
    }

    /**
     * Clear boundary data
     */
    handleBoundaryCleared() {
        console.log('Boundary cleared');
        this.boundaryData = null;
        this.boundaryPreview = null;
        this.isEditMode = false;

        const fields = [
            'boundary-coordinates',
            'boundary-perimeter',
            'boundary-vertex-count',
            'drawing-metadata',
            'boundary-timestamp'
        ];
        
        fields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.value = '';
            }
        });

        // Clear display elements
        const statusElement = document.getElementById('boundary-status');
        if (statusElement) {
            statusElement.innerHTML = '';
        }

        const previewElement = document.getElementById('boundary-preview');
        if (previewElement) {
            previewElement.innerHTML = '';
        }
    }

    /**
     * Clear boundary (triggered by clear button)
     */
    clearBoundary() {
        // Send message to iframe to clear boundary
        const iframe = document.getElementById('arcgis-measurement-iframe');
        if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage({
                type: 'CLEAR_BOUNDARY'
            }, window.location.origin);
        }

        // Clear local data
        this.handleBoundaryCleared();
    }

    /**
     * Confirm boundary (triggered by confirm button)
     */
    confirmBoundary() {
        if (!this.boundaryData) {
            alert('No boundary data to confirm');
            return;
        }

        // Update status
        this.updateMeasurementStatus(
            `Confirmed boundary: ${this.boundaryData.vertexCount} vertices, ${this.boundaryData.perimeter.toLocaleString()} units perimeter`,
            'success'
        );

        // Mark as confirmed
        const boundaryContainer = document.querySelector('.boundary-container');
        if (boundaryContainer) {
            boundaryContainer.classList.add('boundary-confirmed');
        }
    }

    /**
     * Handle measurement completion from ArcGIS component
     */
    handleMeasurementComplete(measurementData) {
        console.log('Measurement completed:', measurementData);
        
        this.currentMeasurement = measurementData;
        
        // Extract area data
        const area = measurementData.area || 0;
        const unit = measurementData.unit || 'square-meters';
        const coordinates = measurementData.geometry || null;
        
        // Convert to square feet if needed
        const areaInSqFt = this.convertToSquareFeet(area, unit);
        
        // Update measurement data
        this.measurementData = {
            area: areaInSqFt,
            originalArea: area,
            originalUnit: unit,
            coordinates: coordinates,
            timestamp: new Date().toISOString()
        };

        // Update UI
        this.updateMeasurementDisplay(areaInSqFt);
        this.populateHiddenFields();
        this.updateSubmitButtonState();
        
        // Show measurement results section
        this.showMeasurementResults();
    }

    /**
     * Handle measurement cleared
     */
    handleMeasurementCleared() {
        console.log('Measurement cleared');
        
        this.currentMeasurement = null;
        this.measurementData = null;
        
        // Clear form fields
        this.clearHiddenFields();
        
        // Update UI
        this.hideMeasurementResults();
        this.updateMeasurementStatus('Please measure your project area to proceed');
        this.updateSubmitButtonState();
    }

    /**
     * Handle measurement error
     */
    handleMeasurementError(error) {
        console.error('Measurement error:', error);
        
        this.updateMeasurementStatus(`Error: ${error.message || 'Measurement failed'}`, 'error');
    }

    /**
     * Convert area to square feet
     */
    convertToSquareFeet(area, unit) {
        const conversions = {
            'square-meters': 10.7639,
            'square-feet': 1,
            'acres': 43560,
            'sqm': 10.7639,
            'sqft': 1,
            'm²': 10.7639,
            'ft²': 1
        };

        const multiplier = conversions[unit] || conversions['square-meters'];
        return area * multiplier;
    }

    /**
     * Update measurement display in the UI
     */
    updateMeasurementDisplay(areaInSqFt) {
        const statusElement = document.getElementById('measurement-status');
        if (statusElement) {
            statusElement.innerHTML = `
                <div class="measurement-success">
                    <span class="status-indicator">✅</span>
                    <span class="status-text">Area measured successfully</span>
                </div>
            `;
        }

        // Update measured area display
        const measuredAreaElement = document.getElementById('measured-area');
        if (measuredAreaElement) {
            measuredAreaElement.textContent = `${areaInSqFt.toLocaleString()} sq ft`;
        }

        // Update coordinates display
        const coordsElement = document.getElementById('measured-coordinates');
        if (coordsElement && this.measurementData.coordinates) {
            const coordsText = this.formatCoordinates(this.measurementData.coordinates);
            coordsElement.textContent = coordsText;
        }
    }

    /**
     * Format coordinates for display
     */
    formatCoordinates(geometry) {
        if (!geometry || !geometry.rings) {
            return 'Coordinates available';
        }

        const pointCount = geometry.rings[0]?.length || 0;
        return `${pointCount} coordinate points`;
    }

    /**
     * Populate hidden form fields with measurement data
     */
    populateHiddenFields() {
        if (!this.measurementData) return;

        // Area coordinates
        const coordsField = document.getElementById('area-coordinates');
        if (coordsField) {
            coordsField.value = JSON.stringify(this.measurementData.coordinates);
        }

        // Square footage
        const areaField = document.getElementById('square-footage');
        if (areaField) {
            areaField.value = this.measurementData.area.toString();
        }

        // Additional hidden fields from estimate form
        const calcAreaField = document.getElementById('calculatedSquareFootage');
        if (calcAreaField) {
            calcAreaField.value = this.measurementData.area.toString();
        }

        const timestampField = document.getElementById('measurementTimestamp');
        if (timestampField) {
            timestampField.value = this.measurementData.timestamp;
        }

        const toolField = document.getElementById('measurementTool');
        if (toolField) {
            toolField.value = 'arcgis-3d';
        }
    }

    /**
     * Clear hidden form fields
     */
    clearHiddenFields() {
        const fields = [
            'area-coordinates',
            'square-footage', 
            'calculatedSquareFootage',
            'measurementTimestamp',
            'measurementTool',
            'boundary-coordinates',
            'boundary-perimeter',
            'boundary-vertex-count',
            'drawing-metadata',
            'boundary-timestamp'
        ];

        fields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.value = '';
            }
        });
    }

    /**
     * Show measurement results section
     */
    showMeasurementResults() {
        const resultsSection = document.getElementById('measurement-results');
        if (resultsSection) {
            resultsSection.style.display = 'block';
        }
    }

    /**
     * Hide measurement results section
     */
    hideMeasurementResults() {
        const resultsSection = document.getElementById('measurement-results');
        if (resultsSection) {
            resultsSection.style.display = 'none';
        }
    }

    /**
     * Update measurement status message
     */
    updateMeasurementStatus(message, type = 'info') {
        const statusElement = document.getElementById('measurement-status');
        if (!statusElement) return;

        const icons = {
            info: '⚠️',
            success: '✅',
            error: '❌'
        };

        statusElement.innerHTML = `
            <span class="status-indicator">${icons[type]}</span>
            <span class="status-text">${message}</span>
        `;
    }

    /**
     * Update submit button state based on measurement data
     */
    updateSubmitButtonState() {
        const submitButton = document.getElementById('submit-button') || 
                           document.getElementById('submit-estimate');
        
        if (!submitButton) return;

        const hasValidMeasurement = this.measurementData && this.measurementData.area > 0;
        const hasRequiredFields = this.checkRequiredFields();

        submitButton.disabled = !hasValidMeasurement || !hasRequiredFields;

        // Update button text
        if (hasValidMeasurement) {
            const btnText = submitButton.querySelector('.btn-text') || submitButton;
            if (btnText.textContent.includes('area')) {
                btnText.textContent = 'Submit Estimate';
            }
        }
    }

    /**
     * Check if required form fields are filled
     */
    checkRequiredFields() {
        const requiredFields = [
            'firstName', 'lastName', 'email', 'phone', 
            'serviceType', 'streetAddress', 'city', 'state', 'zipCode'
        ];

        return requiredFields.every(fieldName => {
            const field = document.getElementById(fieldName) || 
                         document.querySelector(`[name="${fieldName}"]`);
            return field && field.value.trim();
        });
    }

    /**
     * Clear measurement (triggered by clear button)
     */
    clearMeasurement() {
        // Send message to iframe to clear measurement
        const iframe = document.getElementById('arcgis-measurement-iframe');
        if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage({
                type: 'CLEAR_MEASUREMENT'
            }, window.location.origin);
        }

        // Clear local data
        this.handleMeasurementCleared();
    }

    /**
     * Confirm measurement (triggered by confirm button)
     */
    confirmMeasurement() {
        if (!this.measurementData) {
            alert('No measurement data to confirm');
            return;
        }

        // Hide measurement tools and show confirmed status
        this.updateMeasurementStatus(
            `Confirmed: ${this.measurementData.area.toLocaleString()} sq ft`, 
            'success'
        );
        
        // Optionally collapse the measurement section
        const measurementContainer = document.querySelector('.measurement-container');
        if (measurementContainer) {
            measurementContainer.classList.add('measurement-confirmed');
        }
    }

    /**
     * Get current measurement data
     */
    getMeasurementData() {
        return this.measurementData;
    }

    /**
     * Get current boundary data
     */
    getBoundaryData() {
        return this.boundaryData;
    }

    /**
     * Get current boundary preview data
     */
    getBoundaryPreview() {
        return this.boundaryPreview;
    }

    /**
     * Get drawing metadata
     */
    getDrawingMetadata() {
        return this.drawingMetadata;
    }

    /**
     * Check if measurement is complete
     */
    hasMeasurement() {
        return this.measurementData && this.measurementData.area > 0;
    }

    /**
     * Check if boundary is complete
     */
    hasBoundary() {
        return this.boundaryData && this.boundaryData.geometry && this.validateBoundary(this.boundaryData.geometry);
    }

    /**
     * Check if currently in edit mode
     */
    isInEditMode() {
        return this.isEditMode;
    }

    /**
     * Process vertex coordinates for storage
     */
    processVertexCoordinates(geometry) {
        if (!geometry || !geometry.rings) {
            return [];
        }

        const vertices = geometry.rings[0];
        return vertices.map((vertex, index) => ({
            index: index,
            x: vertex[0],
            y: vertex[1],
            z: vertex[2] || 0 // Include elevation if available
        }));
    }

    /**
     * Convert perimeter to different units
     */
    convertPerimeter(perimeter, fromUnit, toUnit) {
        const conversions = {
            'meters': 1,
            'feet': 3.28084,
            'yards': 1.09361,
            'miles': 0.000621371
        };

        const fromMultiplier = conversions[fromUnit] || 1;
        const toMultiplier = conversions[toUnit] || 1;
        
        return (perimeter / fromMultiplier) * toMultiplier;
    }
}

// Initialize when script loads
const mapFormBinding = new MapFormBinding();

// Export for use in other scripts
window.MapFormBinding = MapFormBinding;
window.mapFormBinding = mapFormBinding;

export default MapFormBinding;
