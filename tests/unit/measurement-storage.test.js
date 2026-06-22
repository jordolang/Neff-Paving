import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
    storeMeasurementData,
    getMeasurementData,
    clearMeasurementData,
    clearAllMeasurementData,
    getActiveTool,
    setActiveTool,
    hasMeasurementData,
    getAllMeasurementData,
    getMeasurementSummary,
    restoreMeasurementData,
    handleFormSubmission,
    handleFormReset,
    initializeStorage
} from '../../src/utils/measurement-storage.js'

describe('measurement-storage', () => {
    beforeEach(() => {
        sessionStorage.clear()
        vi.clearAllMocks()
    })

    describe('storeMeasurementData', () => {
        it('should store measurement data for google-maps tool', () => {
            const testData = {
                areaInSquareFeet: 1000,
                coordinates: [[0, 0], [1, 1]]
            }

            storeMeasurementData('google-maps', testData)

            const stored = JSON.parse(sessionStorage.getItem('neff_paving_google_maps_measurements'))
            expect(stored).toBeDefined()
            expect(stored.data).toEqual(testData)
            expect(stored.toolType).toBe('google-maps')
            expect(stored.timestamp).toBeDefined()
        })

        it('should update active tool when storing data', () => {
            const testData = { areaInSquareFeet: 1000 }

            storeMeasurementData('google-maps', testData)

            expect(sessionStorage.getItem('neff_paving_active_measurement_tool')).toBe('google-maps')
        })

        it('should update session metadata when storing data', () => {
            const testData = { areaInSquareFeet: 1000 }

            storeMeasurementData('google-maps', testData)

            const metadata = JSON.parse(sessionStorage.getItem('neff_paving_measurement_session'))
            expect(metadata).toBeDefined()
            expect(metadata.lastUpdated).toBeDefined()
            expect(metadata.tools).toContain('google-maps')
        })

        it('should handle storage errors gracefully without throwing', () => {
            const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

            expect(() => {
                storeMeasurementData('invalid-tool-type', { test: 'data' })
            }).not.toThrow()

            consoleLogSpy.mockRestore()
            consoleErrorSpy.mockRestore()
        })
    })

    describe('getMeasurementData', () => {
        it('should retrieve stored measurement data', () => {
            const testData = { areaInSquareFeet: 1000 }
            storeMeasurementData('google-maps', testData)

            const retrieved = getMeasurementData('google-maps')

            expect(retrieved).toEqual(testData)
        })

        it('should return null if no data exists', () => {
            const retrieved = getMeasurementData('google-maps')

            expect(retrieved).toBeNull()
        })

        it('should return null and clear data if data is older than 24 hours', () => {
            const oldTimestamp = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
            const testData = {
                data: { areaInSquareFeet: 1000 },
                timestamp: oldTimestamp,
                toolType: 'google-maps'
            }

            sessionStorage.setItem('neff_paving_google_maps_measurements', JSON.stringify(testData))

            const retrieved = getMeasurementData('google-maps')

            expect(retrieved).toBeNull()
            expect(sessionStorage.getItem('neff_paving_google_maps_measurements')).toBeNull()
        })

        it('should return data if within 24 hour window', () => {
            const recentTimestamp = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
            const testData = {
                data: { areaInSquareFeet: 1000 },
                timestamp: recentTimestamp,
                toolType: 'google-maps'
            }

            sessionStorage.setItem('neff_paving_google_maps_measurements', JSON.stringify(testData))

            const retrieved = getMeasurementData('google-maps')

            expect(retrieved).toEqual(testData.data)
        })

        it('should handle retrieval errors gracefully', () => {
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
            sessionStorage.setItem('neff_paving_google_maps_measurements', 'invalid json')

            const retrieved = getMeasurementData('google-maps')

            expect(retrieved).toBeNull()
            expect(consoleErrorSpy).toHaveBeenCalled()
            consoleErrorSpy.mockRestore()
        })
    })

    describe('clearMeasurementData', () => {
        it('should clear measurement data for specific tool', () => {
            storeMeasurementData('google-maps', { areaInSquareFeet: 1000 })

            clearMeasurementData('google-maps')

            expect(sessionStorage.getItem('neff_paving_google_maps_measurements')).toBeNull()
        })

        it('should update session metadata when clearing data', () => {
            storeMeasurementData('google-maps', { areaInSquareFeet: 1000 })

            clearMeasurementData('google-maps')

            const metadata = JSON.parse(sessionStorage.getItem('neff_paving_measurement_session'))
            expect(metadata.tools).not.toContain('google-maps')
        })

        it('should handle clear errors gracefully without throwing', () => {
            const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

            expect(() => {
                clearMeasurementData('invalid-tool-type')
            }).not.toThrow()

            consoleLogSpy.mockRestore()
            consoleErrorSpy.mockRestore()
        })
    })

    describe('clearAllMeasurementData', () => {
        it('should clear all measurement data', () => {
            storeMeasurementData('google-maps', { areaInSquareFeet: 1000 })
            setActiveTool('google-maps')

            clearAllMeasurementData()

            expect(sessionStorage.getItem('neff_paving_google_maps_measurements')).toBeNull()
            expect(sessionStorage.getItem('neff_paving_active_measurement_tool')).toBeNull()
            expect(sessionStorage.getItem('neff_paving_measurement_session')).toBeNull()
        })

        it('should handle clear errors gracefully without throwing', () => {
            const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

            expect(() => {
                clearAllMeasurementData()
            }).not.toThrow()

            consoleLogSpy.mockRestore()
        })
    })

    describe('getActiveTool', () => {
        it('should return default tool when no active tool is set', () => {
            const activeTool = getActiveTool()

            expect(activeTool).toBe('google-maps')
        })

        it('should return stored active tool', () => {
            setActiveTool('google-maps')

            const activeTool = getActiveTool()

            expect(activeTool).toBe('google-maps')
        })
    })

    describe('setActiveTool', () => {
        it('should set active tool', () => {
            setActiveTool('google-maps')

            expect(sessionStorage.getItem('neff_paving_active_measurement_tool')).toBe('google-maps')
        })

        it('should update session metadata when setting active tool', () => {
            setActiveTool('google-maps')

            const metadata = JSON.parse(sessionStorage.getItem('neff_paving_measurement_session'))
            expect(metadata).toBeDefined()
            expect(metadata.lastUpdated).toBeDefined()
        })

        it('should not throw errors when setting active tool', () => {
            expect(() => {
                setActiveTool('google-maps')
            }).not.toThrow()
        })
    })

    describe('hasMeasurementData', () => {
        it('should return false when no data exists', () => {
            expect(hasMeasurementData()).toBe(false)
        })

        it('should return true when google-maps data exists', () => {
            storeMeasurementData('google-maps', { areaInSquareFeet: 1000 })

            expect(hasMeasurementData()).toBe(true)
        })

        it('should return true when active tool is set', () => {
            setActiveTool('google-maps')

            expect(hasMeasurementData()).toBe(true)
        })

        it('should ignore session metadata when checking for data', () => {
            sessionStorage.setItem('neff_paving_measurement_session', JSON.stringify({ lastUpdated: new Date().toISOString() }))

            expect(hasMeasurementData()).toBe(false)
        })
    })

    describe('getAllMeasurementData', () => {
        it('should return all measurement data', () => {
            const testData = { areaInSquareFeet: 1000 }
            storeMeasurementData('google-maps', testData)

            const allData = getAllMeasurementData()

            expect(allData.googleMaps).toEqual(testData)
            expect(allData.activeTool).toBe('google-maps')
        })

        it('should return null for google-maps when no data exists', () => {
            const allData = getAllMeasurementData()

            expect(allData.googleMaps).toBeNull()
            expect(allData.activeTool).toBe('google-maps')
        })
    })

    describe('getMeasurementSummary', () => {
        it('should return empty summary when no data exists', () => {
            const summary = getMeasurementSummary()

            expect(summary.hasData).toBe(false)
            expect(summary.tools).toEqual([])
            expect(summary.totalMeasurements).toBe(0)
        })

        it('should return summary with google-maps data', () => {
            const testData = {
                areaInSquareFeet: 1000,
                timestamp: new Date().toISOString()
            }
            storeMeasurementData('google-maps', testData)

            const summary = getMeasurementSummary()

            expect(summary.hasData).toBe(true)
            expect(summary.tools.length).toBe(1)
            expect(summary.tools[0]).toEqual({
                type: 'google-maps',
                name: 'Google Maps',
                hasArea: true,
                area: 1000,
                timestamp: testData.timestamp
            })
            expect(summary.totalMeasurements).toBe(1)
        })

        it('should handle google-maps data without area', () => {
            const testData = {
                timestamp: new Date().toISOString()
            }
            storeMeasurementData('google-maps', testData)

            const summary = getMeasurementSummary()

            expect(summary.hasData).toBe(true)
            expect(summary.tools[0].hasArea).toBe(false)
            expect(summary.tools[0].area).toBe(0)
        })
    })

    describe('restoreMeasurementData', () => {
        it('should restore google-maps data to tool instance', () => {
            const testData = { areaInSquareFeet: 1000 }
            storeMeasurementData('google-maps', testData)

            const mockToolInstance = {
                restoreAreaData: vi.fn()
            }

            const result = restoreMeasurementData('google-maps', mockToolInstance)

            expect(result).toBe(true)
            expect(mockToolInstance.restoreAreaData).toHaveBeenCalledWith(testData)
        })

        it('should return false when no data exists', () => {
            const mockToolInstance = {
                restoreAreaData: vi.fn()
            }

            const result = restoreMeasurementData('google-maps', mockToolInstance)

            expect(result).toBe(false)
            expect(mockToolInstance.restoreAreaData).not.toHaveBeenCalled()
        })

        it('should return false when tool instance does not have restore method', () => {
            const testData = { areaInSquareFeet: 1000 }
            storeMeasurementData('google-maps', testData)

            const mockToolInstance = {}

            const result = restoreMeasurementData('google-maps', mockToolInstance)

            expect(result).toBe(false)
        })

        it('should handle restore errors gracefully', () => {
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
            const testData = { areaInSquareFeet: 1000 }
            storeMeasurementData('google-maps', testData)

            const mockToolInstance = {
                restoreAreaData: vi.fn(() => {
                    throw new Error('Restore failed')
                })
            }

            const result = restoreMeasurementData('google-maps', mockToolInstance)

            expect(result).toBe(false)
            expect(consoleErrorSpy).toHaveBeenCalled()
            consoleErrorSpy.mockRestore()
        })
    })

    describe('handleFormSubmission', () => {
        it('should clear all measurement data on form submission', () => {
            storeMeasurementData('google-maps', { areaInSquareFeet: 1000 })

            handleFormSubmission()

            expect(sessionStorage.getItem('neff_paving_google_maps_measurements')).toBeNull()
            expect(sessionStorage.getItem('neff_paving_active_measurement_tool')).toBeNull()
        })
    })

    describe('handleFormReset', () => {
        it('should clear all measurement data on form reset', () => {
            storeMeasurementData('google-maps', { areaInSquareFeet: 1000 })

            handleFormReset()

            expect(sessionStorage.getItem('neff_paving_google_maps_measurements')).toBeNull()
            expect(sessionStorage.getItem('neff_paving_active_measurement_tool')).toBeNull()
        })
    })

    describe('initializeStorage', () => {
        it('should not clear data if session is recent', () => {
            storeMeasurementData('google-maps', { areaInSquareFeet: 1000 })

            initializeStorage()

            expect(sessionStorage.getItem('neff_paving_google_maps_measurements')).not.toBeNull()
        })

        it('should clear data if session is older than 24 hours', () => {
            const oldTimestamp = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
            const metadata = {
                lastUpdated: oldTimestamp,
                tools: ['google-maps']
            }

            sessionStorage.setItem('neff_paving_measurement_session', JSON.stringify(metadata))
            sessionStorage.setItem('neff_paving_google_maps_measurements', JSON.stringify({
                data: { areaInSquareFeet: 1000 },
                timestamp: oldTimestamp,
                toolType: 'google-maps'
            }))

            initializeStorage()

            expect(sessionStorage.getItem('neff_paving_google_maps_measurements')).toBeNull()
        })

        it('should handle missing session data gracefully', () => {
            initializeStorage()

            expect(sessionStorage.getItem('neff_paving_measurement_session')).toBeNull()
        })

        it('should handle initialization errors gracefully', () => {
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
            sessionStorage.setItem('neff_paving_measurement_session', 'invalid json')

            initializeStorage()

            expect(consoleErrorSpy).toHaveBeenCalled()
            consoleErrorSpy.mockRestore()
        })
    })

    describe('edge cases', () => {
        it('should handle unknown tool type in storeMeasurementData', () => {
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

            storeMeasurementData('unknown-tool', { test: 'data' })

            expect(consoleErrorSpy).toHaveBeenCalled()
            consoleErrorSpy.mockRestore()
        })

        it('should handle unknown tool type in getMeasurementData', () => {
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

            const result = getMeasurementData('unknown-tool')

            expect(result).toBeNull()
            expect(consoleErrorSpy).toHaveBeenCalled()
            consoleErrorSpy.mockRestore()
        })

        it('should handle unknown tool type in clearMeasurementData', () => {
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

            clearMeasurementData('unknown-tool')

            expect(consoleErrorSpy).toHaveBeenCalled()
            consoleErrorSpy.mockRestore()
        })
    })
})
