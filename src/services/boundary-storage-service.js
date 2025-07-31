/**
 * Enhanced Boundary Storage Service
 * Handles storage, retrieval, and management of boundary data with imagery metadata
 */

import BoundaryValidationService from './boundary-validation-service.js';
import { storeMeasurementData, getMeasurementData, clearMeasurementData } from '../utils/measurement-storage.js';

export class BoundaryStorageService {
    constructor() {
        this.validationService = new BoundaryValidationService();
        
        // Storage configuration
        this.storageConfig = {
            maxStorageSize: 10 * 1024 * 1024, // 10MB
            maxBoundariesPerTool: 10,
            compressionEnabled: true,
            generateThumbnails: true,
            thumbnailSize: { width: 200, height: 150 },
            metadataFields: [
                'projectName',
                'projectType',
                'customerInfo',
                'imagerySource',
                'imageryDate',
                'imageryQuality',
                'measurementAccuracy',
                'notes'
            ]
        };

        // Imagery metadata templates
        this.imageryTemplates = {
            satellite: {
                source: 'Google Satellite',
                typical_resolution: '0.5m',
                update_frequency: 'Monthly',
                accuracy: 'High',
                best_for: ['General mapping', 'Large areas', 'Overview planning']
            },
            hybrid: {
                source: 'Google Hybrid',
                typical_resolution: '0.5m',
                update_frequency: 'Monthly',
                accuracy: 'High',
                best_for: ['Detailed mapping', 'Property boundaries', 'Urban areas']
            },
            terrain: {
                source: 'Google Terrain',
                typical_resolution: '90m elevation',
                update_frequency: 'Yearly',
                accuracy: 'Medium',
                best_for: ['Topographic analysis', 'Slope calculation', 'Elevation mapping']
            },
            '3d': {
                source: 'Google Maps',
                typical_resolution: '1m',
                update_frequency: 'Variable',
                accuracy: 'High',
                best_for: ['Standard measurements', 'General surveys']
            }
        };
    }

    /**
     * Store boundary data with full validation and metadata
     */
    async storeBoundaryData(toolType, boundaryData, options = {}) {
        try {
            // Validate coordinates
            const coordinateValidation = this.validationService.validateBoundaryCoordinates(
                boundaryData.coordinates,
                { useUSBounds: options.useUSBounds || false }
            );

            if (!coordinateValidation.isValid) {
                throw new Error(`Coordinate validation failed: ${coordinateValidation.errors.map(e => e.message).join(', ')}`);
            }

            // Validate polygon geometry
            const geometryValidation = this.validationService.validatePolygonGeometry(
                coordinateValidation.correctedCoordinates,
                boundaryData.area,
                boundaryData.perimeter
            );

            // Compress coordinate data if enabled
            let compression = null;
            if (this.storageConfig.compressionEnabled) {
                compression = this.validationService.compressCoordinateData(
                    coordinateValidation.correctedCoordinates,
                    options.compression
                );
            }

            // Generate thumbnail if enabled
            let thumbnail = null;
            if (this.storageConfig.generateThumbnails) {
                thumbnail = this.validationService.generateBoundaryThumbnail(
                    compression ? compression.coordinates : coordinateValidation.correctedCoordinates,
                    { ...this.storageConfig.thumbnailSize, ...options.thumbnail }
                );
            }

            // Prepare imagery metadata
            const imageryMetadata = this.prepareImageryMetadata(boundaryData, options);

            // Create enhanced boundary data
            const enhancedBoundaryData = {
                ...boundaryData,
                coordinates: compression ? compression.coordinates : coordinateValidation.correctedCoordinates,
                compression: compression,
                thumbnail: thumbnail,
                imageryMetadata: imageryMetadata,
                validation: {
                    coordinate: coordinateValidation,
                    geometry: geometryValidation,
                    quality: this.validationService.calculateQualityScore(coordinateValidation)
                }
            };

            // Store with validation results
            const stored = this.validationService.storeBoundaryData(
                toolType,
                enhancedBoundaryData,
                coordinateValidation
            );

            if (!stored) {
                throw new Error('Failed to store boundary data');
            }

            // Update storage metadata
            await this.updateStorageMetadata(toolType, enhancedBoundaryData);

            return {
                success: true,
                data: enhancedBoundaryData,
                validation: coordinateValidation,
                compression: compression,
                thumbnail: thumbnail,
                metadata: imageryMetadata
            };

        } catch (error) {
            console.error('Failed to store boundary data:', error);
            return {
                success: false,
                error: error.message,
                data: null
            };
        }
    }

    /**
     * Retrieve boundary data with all metadata
     */
    async retrieveBoundaryData(toolType, options = {}) {
        try {
            const rawData = getMeasurementData(toolType);
            
            if (!rawData) {
                return {
                    success: false,
                    error: 'No boundary data found',
                    data: null
                };
            }

            // Enhance retrieved data if needed
            const enhancedData = await this.enhanceRetrievedData(rawData, options);

            return {
                success: true,
                data: enhancedData,
                metadata: {
                    toolType: toolType,
                    retrieved: new Date().toISOString(),
                    dataAge: this.calculateDataAge(rawData.timestamp),
                    quality: enhancedData.validation?.quality || 'unknown'
                }
            };

        } catch (error) {
            console.error('Failed to retrieve boundary data:', error);
            return {
                success: false,
                error: error.message,
                data: null
            };
        }
    }

    /**
     * Prepare imagery metadata
     */
    prepareImageryMetadata(boundaryData, options) {
        const imageryType = boundaryData.imageryType || 'satellite';
        const template = this.imageryTemplates[imageryType] || this.imageryTemplates.satellite;

        return {
            type: imageryType,
            source: template.source,
            date: boundaryData.imageryDate || new Date().toISOString(),
            quality: boundaryData.imageryQuality || 'high',
            resolution: template.typical_resolution,
            accuracy: template.accuracy,
            updateFrequency: template.update_frequency,
            bestFor: template.best_for,
            metadata: {
                zoom_level: boundaryData.zoomLevel || 18,
                map_type: boundaryData.mapType || imageryType,
                coordinates_system: 'WGS84',
                measurement_tool: boundaryData.measurementTool || 'unknown',
                user_agent: navigator.userAgent,
                screen_resolution: `${screen.width}x${screen.height}`,
                timestamp: new Date().toISOString()
            },
            custom: boundaryData.imageryMetadata || {}
        };
    }

    /**
     * Enhance retrieved data with current metadata
     */
    async enhanceRetrievedData(rawData, options) {
        try {
            // Check if data needs validation update
            if (!rawData.validation || options.revalidate) {
                const coordinateValidation = this.validationService.validateBoundaryCoordinates(
                    rawData.boundary.coordinates,
                    { useUSBounds: options.useUSBounds || false }
                );

                rawData.validation = {
                    ...rawData.validation,
                    coordinate: coordinateValidation,
                    quality: this.validationService.calculateQualityScore(coordinateValidation)
                };
            }

            // Regenerate thumbnail if missing or requested
            if ((!rawData.thumbnail || options.regenerateThumbnail) && this.storageConfig.generateThumbnails) {
                rawData.thumbnail = this.validationService.generateBoundaryThumbnail(
                    rawData.boundary.coordinates,
                    { ...this.storageConfig.thumbnailSize, ...options.thumbnail }
                );
            }

            // Update imagery metadata if needed
            if (options.updateImagery) {
                rawData.imagery = {
                    ...rawData.imagery,
                    ...this.prepareImageryMetadata(rawData.boundary, options)
                };
            }

            return rawData;

        } catch (error) {
            console.error('Failed to enhance retrieved data:', error);
            return rawData; // Return original data if enhancement fails
        }
    }

    /**
     * Update storage metadata
     */
    async updateStorageMetadata(toolType, boundaryData) {
        try {
            const metadataKey = `boundary_metadata_${toolType}`;
            const existing = JSON.parse(sessionStorage.getItem(metadataKey) || '{}');

            const metadata = {
                ...existing,
                lastUpdated: new Date().toISOString(),
                totalSize: this.calculateDataSize(boundaryData),
                boundaryCount: (existing.boundaryCount || 0) + 1,
                compressionEnabled: this.storageConfig.compressionEnabled,
                compressionRatio: boundaryData.compression?.compressionRatio || 1.0,
                qualityScore: boundaryData.validation?.quality || 0,
                imageryType: boundaryData.imageryMetadata?.type || 'unknown',
                toolType: toolType
            };

            sessionStorage.setItem(metadataKey, JSON.stringify(metadata));

            // Check storage limits
            await this.checkStorageLimits(toolType);

        } catch (error) {
            console.error('Failed to update storage metadata:', error);
        }
    }

    /**
     * Calculate data size for storage management
     */
    calculateDataSize(data) {
        try {
            const jsonString = JSON.stringify(data);
            return new Blob([jsonString]).size;
        } catch (error) {
            console.error('Failed to calculate data size:', error);
            return 0;
        }
    }

    /**
     * Calculate data age in milliseconds
     */
    calculateDataAge(timestamp) {
        try {
            const dataDate = new Date(timestamp);
            return Date.now() - dataDate.getTime();
        } catch (error) {
            return 0;
        }
    }

    /**
     * Check and enforce storage limits
     */
    async checkStorageLimits(toolType) {
        try {
            const metadataKey = `boundary_metadata_${toolType}`;
            const metadata = JSON.parse(sessionStorage.getItem(metadataKey) || '{}');

            // Check total size limit
            if (metadata.totalSize > this.storageConfig.maxStorageSize) {
                console.warn(`Storage size limit exceeded for ${toolType}`);
                await this.cleanupOldData(toolType);
            }

            // Check boundary count limit
            if (metadata.boundaryCount > this.storageConfig.maxBoundariesPerTool) {
                console.warn(`Boundary count limit exceeded for ${toolType}`);
                await this.cleanupOldData(toolType);
            }

        } catch (error) {
            console.error('Failed to check storage limits:', error);
        }
    }

    /**
     * Clean up old data to free storage space
     */
    async cleanupOldData(toolType) {
        try {
            console.log(`Cleaning up old data for ${toolType}`);
            
            // For now, just clear all data for the tool
            // In a more sophisticated implementation, we could:
            // 1. Remove oldest entries first
            // 2. Compress data further
            // 3. Move to persistent storage
            
            clearMeasurementData(toolType);
            
            // Reset metadata
            const metadataKey = `boundary_metadata_${toolType}`;
            sessionStorage.removeItem(metadataKey);

        } catch (error) {
            console.error('Failed to cleanup old data:', error);
        }
    }

    /**
     * Export boundary data with all metadata
     */
    exportBoundaryData(toolType, format = 'json') {
        try {
            const data = getMeasurementData(toolType);
            
            if (!data) {
                throw new Error('No boundary data to export');
            }

            const exportData = {
                metadata: {
                    exported: new Date().toISOString(),
                    toolType: toolType,
                    format: format,
                    version: '1.0'
                },
                boundary: data
            };

            switch (format.toLowerCase()) {
                case 'json':
                    return {
                        data: JSON.stringify(exportData, null, 2),
                        filename: `boundary_${toolType}_${Date.now()}.json`,
                        contentType: 'application/json'
                    };

                case 'geojson':
                    const geoJson = this.convertToGeoJSON(data);
                    return {
                        data: JSON.stringify(geoJson, null, 2),
                        filename: `boundary_${toolType}_${Date.now()}.geojson`,
                        contentType: 'application/geo+json'
                    };

                case 'csv':
                    const csv = this.convertToCSV(data);
                    return {
                        data: csv,
                        filename: `boundary_${toolType}_${Date.now()}.csv`,
                        contentType: 'text/csv'
                    };

                default:
                    throw new Error(`Unsupported export format: ${format}`);
            }

        } catch (error) {
            console.error('Failed to export boundary data:', error);
            throw error;
        }
    }

    /**
     * Convert boundary data to GeoJSON format
     */
    convertToGeoJSON(data) {
        return {
            type: 'FeatureCollection',
            features: [{
                type: 'Feature',
                geometry: {
                    type: 'Polygon',
                    coordinates: [data.boundary.coordinates.map(coord => [coord.lng, coord.lat])]
                },
                properties: {
                    area: data.boundary.area,
                    perimeter: data.boundary.perimeter,
                    units: data.boundary.units,
                    imagery_type: data.imagery?.type,
                    imagery_quality: data.imagery?.quality,
                    imagery_date: data.imagery?.date,
                    measurement_tool: data.toolType,
                    timestamp: data.timestamp,
                    validation_quality: data.validation?.quality
                }
            }]
        };
    }

    /**
     * Convert boundary data to CSV format
     */
    convertToCSV(data) {
        const headers = ['latitude', 'longitude', 'point_index', 'area_sqft', 'perimeter_ft', 'imagery_type', 'quality', 'timestamp'];
        const rows = [headers.join(',')];

        data.boundary.coordinates.forEach((coord, index) => {
            const row = [
                coord.lat,
                coord.lng,
                index,
                data.boundary.area,
                data.boundary.perimeter,
                data.imagery?.type || '',
                data.imagery?.quality || '',
                data.timestamp
            ];
            rows.push(row.join(','));
        });

        return rows.join('\n');
    }

    /**
     * Import boundary data from external sources
     */
    async importBoundaryData(toolType, importData, format = 'json') {
        try {
            let boundaryData;

            switch (format.toLowerCase()) {
                case 'json':
                    boundaryData = typeof importData === 'string' ? JSON.parse(importData) : importData;
                    break;

                case 'geojson':
                    boundaryData = this.convertFromGeoJSON(importData);
                    break;

                case 'csv':
                    boundaryData = this.convertFromCSV(importData);
                    break;

                default:
                    throw new Error(`Unsupported import format: ${format}`);
            }

            // Validate and store imported data
            const result = await this.storeBoundaryData(toolType, boundaryData);
            
            if (!result.success) {
                throw new Error(`Import validation failed: ${result.error}`);
            }

            return result;

        } catch (error) {
            console.error('Failed to import boundary data:', error);
            throw error;
        }
    }

    /**
     * Convert GeoJSON to boundary data format
     */
    convertFromGeoJSON(geoJson) {
        const data = typeof geoJson === 'string' ? JSON.parse(geoJson) : geoJson;
        
        if (!data.features || data.features.length === 0) {
            throw new Error('Invalid GeoJSON: no features found');
        }

        const feature = data.features[0];
        const coords = feature.geometry.coordinates[0];
        
        return {
            coordinates: coords.map(coord => ({ lat: coord[1], lng: coord[0] })),
            area: feature.properties.area || 0,
            perimeter: feature.properties.perimeter || 0,
            units: feature.properties.units || 'sqft',
            imageryType: feature.properties.imagery_type || 'satellite',
            imageryQuality: feature.properties.imagery_quality || 'high',
            imageryDate: feature.properties.imagery_date || new Date().toISOString()
        };
    }

    /**
     * Convert CSV to boundary data format
     */
    convertFromCSV(csvData) {
        const lines = csvData.trim().split('\n');
        const headers = lines[0].split(',');
        
        const coordinates = [];
        let area = 0;
        let perimeter = 0;
        let imageryType = 'satellite';
        let imageryQuality = 'high';
        let imageryDate = new Date().toISOString();

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            const row = {};
            
            headers.forEach((header, index) => {
                row[header.trim()] = values[index]?.trim();
            });

            if (row.latitude && row.longitude) {
                coordinates.push({
                    lat: parseFloat(row.latitude),
                    lng: parseFloat(row.longitude)
                });
            }

            // Extract metadata from first row
            if (i === 1) {
                area = parseFloat(row.area_sqft) || 0;
                perimeter = parseFloat(row.perimeter_ft) || 0;
                imageryType = row.imagery_type || 'satellite';
                imageryQuality = row.quality || 'high';
                imageryDate = row.timestamp || new Date().toISOString();
            }
        }

        return {
            coordinates,
            area,
            perimeter,
            units: 'sqft',
            imageryType,
            imageryQuality,
            imageryDate
        };
    }

    /**
     * Get storage statistics
     */
    getStorageStatistics() {
        const stats = {
            totalSize: 0,
            boundaryCount: 0,
            tools: {},
            lastUpdated: null
        };

        try {
            // Check each tool type
            ['google-maps', 'enhanced-area-finder'].forEach(toolType => {
                const metadataKey = `boundary_metadata_${toolType}`;
                const metadata = JSON.parse(sessionStorage.getItem(metadataKey) || '{}');
                
                if (metadata.totalSize) {
                    stats.tools[toolType] = {
                        size: metadata.totalSize,
                        count: metadata.boundaryCount || 0,
                        lastUpdated: metadata.lastUpdated,
                        quality: metadata.qualityScore || 0,
                        compressionRatio: metadata.compressionRatio || 1.0
                    };

                    stats.totalSize += metadata.totalSize;
                    stats.boundaryCount += metadata.boundaryCount || 0;
                    
                    if (!stats.lastUpdated || metadata.lastUpdated > stats.lastUpdated) {
                        stats.lastUpdated = metadata.lastUpdated;
                    }
                }
            });

            return stats;

        } catch (error) {
            console.error('Failed to get storage statistics:', error);
            return stats;
        }
    }
}

export default BoundaryStorageService;
