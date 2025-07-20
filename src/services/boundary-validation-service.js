/**
 * Boundary Validation and Storage Service
 * Provides comprehensive validation, compression, and storage for boundary data
 */

import { storeMeasurementData, getMeasurementData } from '../utils/measurement-storage.js';

export class BoundaryValidationService {
    constructor() {
        // Coordinate validation limits
        this.coordinateLimits = {
            latitude: { min: -90, max: 90 },
            longitude: { min: -180, max: 180 },
            // US-specific limits for better validation
            usLatitude: { min: 24.396308, max: 71.538800 },
            usLongitude: { min: -179.148909, max: -66.885417 }
        };

        // Area and polygon limits
        this.polygonLimits = {
            minVertices: 3,
            maxVertices: 1000,
            minArea: 50, // square feet
            maxArea: 50000000, // ~1150 acres
            minPerimeter: 28, // feet
            maxPerimeter: 50000, // feet
            complexityThreshold: 0.1 // ratio of area to perimeter squared
        };

        // Coordinate precision settings
        this.precision = {
            latitude: 6,  // ~0.1 meter precision
            longitude: 6, // ~0.1 meter precision
            area: 2,      // square feet
            perimeter: 2  // feet
        };

        // Compression settings
        this.compression = {
            enabled: true,
            threshold: 100, // minimum number of coordinates to compress
            tolerance: 0.00001, // Douglas-Peucker tolerance
            maxPoints: 500 // maximum points after compression
        };

        // Validation error types
        this.errorTypes = {
            INVALID_COORDINATES: 'invalid_coordinates',
            POLYGON_NOT_CLOSED: 'polygon_not_closed',
            INSUFFICIENT_VERTICES: 'insufficient_vertices',
            EXCESSIVE_VERTICES: 'excessive_vertices',
            INVALID_AREA: 'invalid_area',
            INVALID_PERIMETER: 'invalid_perimeter',
            SELF_INTERSECTING: 'self_intersecting',
            DUPLICATE_VERTICES: 'duplicate_vertices',
            EXCESSIVE_COMPLEXITY: 'excessive_complexity'
        };
    }

    /**
     * Validate boundary coordinates
     * @param {Array} coordinates - Array of coordinate objects with lat/lng
     * @param {Object} options - Validation options
     * @returns {Object} Validation result
     */
    validateBoundaryCoordinates(coordinates, options = {}) {
        const validation = {
            isValid: true,
            errors: [],
            warnings: [],
            correctedCoordinates: null,
            metadata: {
                originalCount: coordinates.length,
                validCount: 0,
                duplicatesRemoved: 0,
                outOfBoundsCount: 0,
                precision: this.precision
            }
        };

        try {
            // Check if coordinates array is valid
            if (!Array.isArray(coordinates) || coordinates.length === 0) {
                validation.isValid = false;
                validation.errors.push({
                    type: this.errorTypes.INVALID_COORDINATES,
                    message: 'Coordinates must be a non-empty array'
                });
                return validation;
            }

            // Check minimum vertices requirement
            if (coordinates.length < this.polygonLimits.minVertices) {
                validation.isValid = false;
                validation.errors.push({
                    type: this.errorTypes.INSUFFICIENT_VERTICES,
                    message: `Polygon must have at least ${this.polygonLimits.minVertices} vertices`
                });
                return validation;
            }

            // Check maximum vertices limit
            if (coordinates.length > this.polygonLimits.maxVertices) {
                validation.isValid = false;
                validation.errors.push({
                    type: this.errorTypes.EXCESSIVE_VERTICES,
                    message: `Polygon cannot have more than ${this.polygonLimits.maxVertices} vertices`
                });
                return validation;
            }

            // Validate and correct individual coordinates
            const correctedCoordinates = this.validateIndividualCoordinates(
                coordinates, 
                validation, 
                options
            );

            // Check for duplicate vertices
            const uniqueCoordinates = this.removeDuplicateVertices(correctedCoordinates, validation);

            // Ensure polygon closure
            const closedCoordinates = this.ensurePolygonClosure(uniqueCoordinates, validation);

            // Check for self-intersections
            if (this.hasSelfIntersections(closedCoordinates)) {
                validation.warnings.push({
                    type: this.errorTypes.SELF_INTERSECTING,
                    message: 'Polygon appears to have self-intersections'
                });
            }

            // Apply coordinate precision
            const precisionCoordinates = this.applyCoordinatePrecision(closedCoordinates);

            validation.correctedCoordinates = precisionCoordinates;
            validation.metadata.validCount = precisionCoordinates.length;

            return validation;

        } catch (error) {
            validation.isValid = false;
            validation.errors.push({
                type: this.errorTypes.INVALID_COORDINATES,
                message: `Validation error: ${error.message}`
            });
            return validation;
        }
    }

    /**
     * Validate individual coordinate values
     */
    validateIndividualCoordinates(coordinates, validation, options) {
        const corrected = [];
        const useUSBounds = options.useUSBounds || false;

        for (let i = 0; i < coordinates.length; i++) {
            const coord = coordinates[i];

            // Check if coordinate has required properties
            if (!coord || typeof coord.lat !== 'number' || typeof coord.lng !== 'number') {
                validation.isValid = false;
                validation.errors.push({
                    type: this.errorTypes.INVALID_COORDINATES,
                    message: `Invalid coordinate at index ${i}: missing or invalid lat/lng`
                });
                continue;
            }

            // Check latitude bounds
            const latLimits = useUSBounds ? this.coordinateLimits.usLatitude : this.coordinateLimits.latitude;
            if (coord.lat < latLimits.min || coord.lat > latLimits.max) {
                validation.metadata.outOfBoundsCount++;
                validation.warnings.push({
                    type: this.errorTypes.INVALID_COORDINATES,
                    message: `Latitude ${coord.lat} at index ${i} is out of bounds`
                });
                continue;
            }

            // Check longitude bounds
            const lngLimits = useUSBounds ? this.coordinateLimits.usLongitude : this.coordinateLimits.longitude;
            if (coord.lng < lngLimits.min || coord.lng > lngLimits.max) {
                validation.metadata.outOfBoundsCount++;
                validation.warnings.push({
                    type: this.errorTypes.INVALID_COORDINATES,
                    message: `Longitude ${coord.lng} at index ${i} is out of bounds`
                });
                continue;
            }

            // Check for NaN or Infinity values
            if (!isFinite(coord.lat) || !isFinite(coord.lng)) {
                validation.isValid = false;
                validation.errors.push({
                    type: this.errorTypes.INVALID_COORDINATES,
                    message: `Invalid coordinate values at index ${i}`
                });
                continue;
            }

            corrected.push({
                lat: coord.lat,
                lng: coord.lng
            });
        }

        return corrected;
    }

    /**
     * Remove duplicate vertices
     */
    removeDuplicateVertices(coordinates, validation) {
        const unique = [];
        const tolerance = 0.000001; // ~0.1 meter

        for (let i = 0; i < coordinates.length; i++) {
            const coord = coordinates[i];
            const isDuplicate = unique.some(existing => 
                Math.abs(existing.lat - coord.lat) < tolerance && 
                Math.abs(existing.lng - coord.lng) < tolerance
            );

            if (!isDuplicate) {
                unique.push(coord);
            } else {
                validation.metadata.duplicatesRemoved++;
            }
        }

        if (validation.metadata.duplicatesRemoved > 0) {
            validation.warnings.push({
                type: this.errorTypes.DUPLICATE_VERTICES,
                message: `Removed ${validation.metadata.duplicatesRemoved} duplicate vertices`
            });
        }

        return unique;
    }

    /**
     * Ensure polygon closure
     */
    ensurePolygonClosure(coordinates, validation) {
        if (coordinates.length < 3) return coordinates;

        const first = coordinates[0];
        const last = coordinates[coordinates.length - 1];
        const tolerance = 0.000001;

        // Check if polygon is already closed
        if (Math.abs(first.lat - last.lat) < tolerance && 
            Math.abs(first.lng - last.lng) < tolerance) {
            return coordinates;
        }

        // Close the polygon
        const closed = [...coordinates, { lat: first.lat, lng: first.lng }];
        
        validation.warnings.push({
            type: this.errorTypes.POLYGON_NOT_CLOSED,
            message: 'Polygon was not closed - added closing vertex'
        });

        return closed;
    }

    /**
     * Check for self-intersections using a simple ray casting approach
     */
    hasSelfIntersections(coordinates) {
        if (coordinates.length < 4) return false;

        for (let i = 0; i < coordinates.length - 1; i++) {
            const line1 = [coordinates[i], coordinates[i + 1]];
            
            for (let j = i + 2; j < coordinates.length - 1; j++) {
                const line2 = [coordinates[j], coordinates[j + 1]];
                
                // Skip adjacent lines
                if (j === i + 1 || (i === 0 && j === coordinates.length - 2)) {
                    continue;
                }

                if (this.linesIntersect(line1[0], line1[1], line2[0], line2[1])) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Check if two line segments intersect
     */
    linesIntersect(p1, p2, p3, p4) {
        const det = (p2.lat - p1.lat) * (p4.lng - p3.lng) - (p4.lat - p3.lat) * (p2.lng - p1.lng);
        
        if (Math.abs(det) < 1e-10) return false; // Lines are parallel

        const u = ((p4.lat - p3.lat) * (p1.lng - p3.lng) - (p4.lng - p3.lng) * (p1.lat - p3.lat)) / det;
        const v = ((p2.lat - p1.lat) * (p1.lng - p3.lng) - (p2.lng - p1.lng) * (p1.lat - p3.lat)) / det;

        return u >= 0 && u <= 1 && v >= 0 && v <= 1;
    }

    /**
     * Apply coordinate precision handling
     */
    applyCoordinatePrecision(coordinates) {
        return coordinates.map(coord => ({
            lat: this.roundToPrecision(coord.lat, this.precision.latitude),
            lng: this.roundToPrecision(coord.lng, this.precision.longitude)
        }));
    }

    /**
     * Round number to specified decimal places
     */
    roundToPrecision(num, decimals) {
        const factor = Math.pow(10, decimals);
        return Math.round(num * factor) / factor;
    }

    /**
     * Validate polygon area and perimeter
     */
    validatePolygonGeometry(coordinates, area, perimeter) {
        const validation = {
            isValid: true,
            errors: [],
            warnings: [],
            metrics: {
                area: area,
                perimeter: perimeter,
                complexity: 0,
                areaValid: true,
                perimeterValid: true
            }
        };

        // Validate area
        if (area < this.polygonLimits.minArea) {
            validation.isValid = false;
            validation.metrics.areaValid = false;
            validation.errors.push({
                type: this.errorTypes.INVALID_AREA,
                message: `Area ${area} sq ft is below minimum of ${this.polygonLimits.minArea} sq ft`
            });
        }

        if (area > this.polygonLimits.maxArea) {
            validation.isValid = false;
            validation.metrics.areaValid = false;
            validation.errors.push({
                type: this.errorTypes.INVALID_AREA,
                message: `Area ${area} sq ft exceeds maximum of ${this.polygonLimits.maxArea} sq ft`
            });
        }

        // Validate perimeter
        if (perimeter < this.polygonLimits.minPerimeter) {
            validation.warnings.push({
                type: this.errorTypes.INVALID_PERIMETER,
                message: `Perimeter ${perimeter} ft seems unusually small`
            });
        }

        if (perimeter > this.polygonLimits.maxPerimeter) {
            validation.warnings.push({
                type: this.errorTypes.INVALID_PERIMETER,
                message: `Perimeter ${perimeter} ft seems unusually large`
            });
        }

        // Calculate complexity (perimeter-to-area ratio)
        const complexity = perimeter * perimeter / (4 * Math.PI * area);
        validation.metrics.complexity = complexity;

        if (complexity > this.polygonLimits.complexityThreshold) {
            validation.warnings.push({
                type: this.errorTypes.EXCESSIVE_COMPLEXITY,
                message: `Polygon shape is very complex or irregular (complexity: ${complexity.toFixed(3)})`
            });
        }

        return validation;
    }

    /**
     * Compress coordinate data for efficient storage
     */
    compressCoordinateData(coordinates, options = {}) {
        const compressionOptions = {
            ...this.compression,
            ...options
        };

        const result = {
            originalCount: coordinates.length,
            compressedCount: coordinates.length,
            compressionRatio: 1.0,
            coordinates: coordinates,
            method: 'none'
        };

        // Skip compression if disabled or below threshold
        if (!compressionOptions.enabled || coordinates.length < compressionOptions.threshold) {
            return result;
        }

        try {
            // Apply Douglas-Peucker algorithm for line simplification
            const simplified = this.douglasPeucker(coordinates, compressionOptions.tolerance);
            
            // Ensure we don't exceed maximum points
            let finalCoordinates = simplified;
            if (simplified.length > compressionOptions.maxPoints) {
                finalCoordinates = this.uniformSample(simplified, compressionOptions.maxPoints);
                result.method = 'douglas-peucker + uniform-sampling';
            } else {
                result.method = 'douglas-peucker';
            }

            result.compressedCount = finalCoordinates.length;
            result.compressionRatio = finalCoordinates.length / coordinates.length;
            result.coordinates = finalCoordinates;

            return result;

        } catch (error) {
            console.error('Compression failed:', error);
            return result; // Return original data if compression fails
        }
    }

    /**
     * Douglas-Peucker line simplification algorithm
     */
    douglasPeucker(coordinates, tolerance) {
        if (coordinates.length <= 2) return coordinates;

        const simplified = [coordinates[0]];
        this.douglasPeuckerRecursive(coordinates, 0, coordinates.length - 1, tolerance, simplified);
        simplified.push(coordinates[coordinates.length - 1]);

        return simplified;
    }

    /**
     * Recursive helper for Douglas-Peucker algorithm
     */
    douglasPeuckerRecursive(coordinates, start, end, tolerance, result) {
        if (end - start <= 1) return;

        let maxDistance = 0;
        let maxIndex = 0;

        for (let i = start + 1; i < end; i++) {
            const distance = this.perpendicularDistance(
                coordinates[i],
                coordinates[start],
                coordinates[end]
            );

            if (distance > maxDistance) {
                maxDistance = distance;
                maxIndex = i;
            }
        }

        if (maxDistance > tolerance) {
            this.douglasPeuckerRecursive(coordinates, start, maxIndex, tolerance, result);
            result.push(coordinates[maxIndex]);
            this.douglasPeuckerRecursive(coordinates, maxIndex, end, tolerance, result);
        }
    }

    /**
     * Calculate perpendicular distance from point to line
     */
    perpendicularDistance(point, lineStart, lineEnd) {
        const A = point.lat - lineStart.lat;
        const B = point.lng - lineStart.lng;
        const C = lineEnd.lat - lineStart.lat;
        const D = lineEnd.lng - lineStart.lng;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;

        if (lenSq === 0) {
            return Math.sqrt(A * A + B * B);
        }

        const param = dot / lenSq;
        let xx, yy;

        if (param < 0) {
            xx = lineStart.lat;
            yy = lineStart.lng;
        } else if (param > 1) {
            xx = lineEnd.lat;
            yy = lineEnd.lng;
        } else {
            xx = lineStart.lat + param * C;
            yy = lineStart.lng + param * D;
        }

        const dx = point.lat - xx;
        const dy = point.lng - yy;

        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Uniform sampling to reduce points to target count
     */
    uniformSample(coordinates, targetCount) {
        if (coordinates.length <= targetCount) return coordinates;

        const sampled = [coordinates[0]]; // Always include first point
        const step = (coordinates.length - 1) / (targetCount - 1);

        for (let i = 1; i < targetCount - 1; i++) {
            const index = Math.round(i * step);
            sampled.push(coordinates[index]);
        }

        sampled.push(coordinates[coordinates.length - 1]); // Always include last point
        return sampled;
    }

    /**
     * Generate boundary thumbnail for preview
     */
    generateBoundaryThumbnail(coordinates, options = {}) {
        const thumbnailOptions = {
            width: options.width || 200,
            height: options.height || 150,
            padding: options.padding || 10,
            strokeColor: options.strokeColor || '#FF0000',
            strokeWidth: options.strokeWidth || 2,
            fillColor: options.fillColor || 'rgba(255, 0, 0, 0.3)',
            backgroundColor: options.backgroundColor || '#f0f0f0'
        };

        try {
            // Calculate bounding box
            const bounds = this.calculateBoundingBox(coordinates);
            
            // Create SVG thumbnail
            const svg = this.createSVGThumbnail(coordinates, bounds, thumbnailOptions);
            
            // Create data URL
            const dataUrl = `data:image/svg+xml;base64,${btoa(svg)}`;
            
            return {
                dataUrl: dataUrl,
                svg: svg,
                bounds: bounds,
                dimensions: {
                    width: thumbnailOptions.width,
                    height: thumbnailOptions.height
                }
            };

        } catch (error) {
            console.error('Thumbnail generation failed:', error);
            return null;
        }
    }

    /**
     * Calculate bounding box for coordinates
     */
    calculateBoundingBox(coordinates) {
        if (coordinates.length === 0) return null;

        let minLat = coordinates[0].lat;
        let maxLat = coordinates[0].lat;
        let minLng = coordinates[0].lng;
        let maxLng = coordinates[0].lng;

        for (let i = 1; i < coordinates.length; i++) {
            const coord = coordinates[i];
            minLat = Math.min(minLat, coord.lat);
            maxLat = Math.max(maxLat, coord.lat);
            minLng = Math.min(minLng, coord.lng);
            maxLng = Math.max(maxLng, coord.lng);
        }

        return {
            minLat,
            maxLat,
            minLng,
            maxLng,
            width: maxLng - minLng,
            height: maxLat - minLat,
            center: {
                lat: (minLat + maxLat) / 2,
                lng: (minLng + maxLng) / 2
            }
        };
    }

    /**
     * Create SVG thumbnail
     */
    createSVGThumbnail(coordinates, bounds, options) {
        const { width, height, padding } = options;
        const drawWidth = width - 2 * padding;
        const drawHeight = height - 2 * padding;

        // Scale coordinates to fit in thumbnail
        const scaleX = drawWidth / bounds.width;
        const scaleY = drawHeight / bounds.height;
        const scale = Math.min(scaleX, scaleY);

        const scaledCoords = coordinates.map(coord => ({
            x: padding + (coord.lng - bounds.minLng) * scale,
            y: padding + (bounds.maxLat - coord.lat) * scale // Flip Y axis
        }));

        // Create SVG path
        const pathData = scaledCoords.reduce((path, coord, index) => {
            return path + (index === 0 ? `M ${coord.x} ${coord.y}` : ` L ${coord.x} ${coord.y}`);
        }, '') + ' Z';

        return `
            <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
                <rect width="${width}" height="${height}" fill="${options.backgroundColor}"/>
                <path d="${pathData}" 
                      fill="${options.fillColor}" 
                      stroke="${options.strokeColor}" 
                      stroke-width="${options.strokeWidth}"/>
            </svg>
        `;
    }

    /**
     * Store validated boundary data with metadata
     */
    storeBoundaryData(toolType, boundaryData, validationResult) {
        const storageData = {
            boundary: {
                coordinates: boundaryData.coordinates,
                area: this.roundToPrecision(boundaryData.area, this.precision.area),
                perimeter: this.roundToPrecision(boundaryData.perimeter, this.precision.perimeter),
                units: boundaryData.units || 'sqft'
            },
            validation: {
                isValid: validationResult.isValid,
                errors: validationResult.errors,
                warnings: validationResult.warnings,
                metadata: validationResult.metadata
            },
            compression: boundaryData.compression || null,
            thumbnail: boundaryData.thumbnail || null,
            imagery: {
                type: boundaryData.imageryType || 'satellite',
                quality: boundaryData.imageryQuality || 'high',
                date: boundaryData.imageryDate || new Date().toISOString(),
                metadata: boundaryData.imageryMetadata || {}
            },
            timestamp: new Date().toISOString(),
            toolType: toolType
        };

        try {
            storeMeasurementData(toolType, storageData);
            return true;
        } catch (error) {
            console.error('Failed to store boundary data:', error);
            return false;
        }
    }

    /**
     * Get comprehensive validation summary
     */
    getValidationSummary(validationResult) {
        const summary = {
            status: validationResult.isValid ? 'valid' : 'invalid',
            errorCount: validationResult.errors.length,
            warningCount: validationResult.warnings.length,
            quality: this.calculateQualityScore(validationResult),
            recommendations: []
        };

        // Add recommendations based on validation results
        if (validationResult.metadata.duplicatesRemoved > 0) {
            summary.recommendations.push('Consider reviewing measurement accuracy due to duplicate points');
        }

        if (validationResult.metadata.outOfBoundsCount > 0) {
            summary.recommendations.push('Some coordinates were outside expected bounds');
        }

        if (validationResult.warnings.some(w => w.type === this.errorTypes.EXCESSIVE_COMPLEXITY)) {
            summary.recommendations.push('Consider simplifying polygon shape for better processing');
        }

        return summary;
    }

    /**
     * Calculate quality score based on validation results
     */
    calculateQualityScore(validationResult) {
        let score = 100;

        // Deduct points for errors
        score -= validationResult.errors.length * 20;

        // Deduct points for warnings
        score -= validationResult.warnings.length * 5;

        // Deduct for data quality issues
        if (validationResult.metadata.duplicatesRemoved > 0) {
            score -= Math.min(validationResult.metadata.duplicatesRemoved * 2, 10);
        }

        if (validationResult.metadata.outOfBoundsCount > 0) {
            score -= Math.min(validationResult.metadata.outOfBoundsCount * 3, 15);
        }

        return Math.max(0, Math.min(100, score));
    }
}

export default BoundaryValidationService;
