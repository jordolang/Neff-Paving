import { describe, it, expect, beforeEach } from 'vitest'
import { FormValidationService } from '../../src/services/form-validation-service.js'

describe('estimate-form validation', () => {
    let validationService

    beforeEach(() => {
        validationService = new FormValidationService()
    })

    describe('validateAreaMeasurement', () => {
        it('should validate area within acceptable range for residential', () => {
            const result = validationService.validateAreaMeasurement(500, 'residential', 'sqft')

            expect(result.isValid).toBe(true)
            expect(result.errors).toHaveLength(0)
        })

        it('should reject area below minimum', () => {
            const result = validationService.validateAreaMeasurement(30, 'residential', 'sqft')

            expect(result.isValid).toBe(false)
            expect(result.errors).toContain('Area is below minimum of 50 sq ft')
        })

        it('should reject area above maximum', () => {
            const result = validationService.validateAreaMeasurement(600000, 'residential', 'sqft')

            expect(result.isValid).toBe(false)
            expect(result.errors).toContain('Area exceeds maximum of 500,000 sq ft')
        })

        it('should reject zero or negative area', () => {
            const result = validationService.validateAreaMeasurement(0, 'residential', 'sqft')

            expect(result.isValid).toBe(false)
            expect(result.errors).toContain('Area measurement is required and must be greater than 0')
        })

        it('should reject null area', () => {
            const result = validationService.validateAreaMeasurement(null, 'residential', 'sqft')

            expect(result.isValid).toBe(false)
            expect(result.errors).toContain('Area measurement is required and must be greater than 0')
        })

        it('should warn when area is small for residential service type', () => {
            const result = validationService.validateAreaMeasurement(75, 'residential', 'sqft')

            expect(result.isValid).toBe(true)
            expect(result.warnings).toContain('Area seems small for residential projects. Typical range is 100-10,000 sq ft')
        })

        it('should warn when area is large for residential service type', () => {
            const result = validationService.validateAreaMeasurement(15000, 'residential', 'sqft')

            expect(result.isValid).toBe(true)
            expect(result.warnings).toContain('Area seems large for residential projects. Typical range is 100-10,000 sq ft')
            expect(result.recommendations).toContain('Consider breaking large projects into phases')
        })

        it('should validate commercial area within acceptable range', () => {
            const result = validationService.validateAreaMeasurement(5000, 'commercial', 'sqft')

            expect(result.isValid).toBe(true)
            expect(result.errors).toHaveLength(0)
        })

        it('should warn when area is small for commercial service type', () => {
            const result = validationService.validateAreaMeasurement(500, 'commercial', 'sqft')

            expect(result.isValid).toBe(true)
            expect(result.warnings).toContain('Area seems small for commercial projects. Typical range is 1,000-100,000 sq ft')
        })

        it('should validate maintenance area within acceptable range', () => {
            const result = validationService.validateAreaMeasurement(500, 'maintenance', 'sqft')

            expect(result.isValid).toBe(true)
            expect(result.errors).toHaveLength(0)
        })

        it('should validate custom area within acceptable range', () => {
            const result = validationService.validateAreaMeasurement(10000, 'custom', 'sqft')

            expect(result.isValid).toBe(true)
            expect(result.errors).toHaveLength(0)
        })

        it('should validate emergency area within acceptable range', () => {
            const result = validationService.validateAreaMeasurement(1000, 'emergency', 'sqft')

            expect(result.isValid).toBe(true)
            expect(result.errors).toHaveLength(0)
        })

        it('should recommend 3D measurement for large areas', () => {
            const result = validationService.validateAreaMeasurement(6000, 'residential', 'sqft')

            expect(result.recommendations).toContain('For large areas, consider using 3D measurement tools for better accuracy')
        })

        it('should recommend site survey for very large commercial areas', () => {
            const result = validationService.validateAreaMeasurement(25000, 'commercial', 'sqft')

            expect(result.recommendations).toContain('Large commercial projects may require site survey for final measurements')
        })

        it('should handle square meters conversion', () => {
            const result = validationService.validateAreaMeasurement(50, 'residential', 'sqm')

            expect(result.isValid).toBe(true)
        })

        it('should handle acres conversion', () => {
            const result = validationService.validateAreaMeasurement(0.5, 'commercial', 'acres')

            expect(result.isValid).toBe(true)
        })
    })

    describe('validatePerimeterMeasurement', () => {
        it('should validate perimeter within acceptable range', () => {
            const result = validationService.validatePerimeterMeasurement(100, 500, 'ft')

            expect(result.isValid).toBe(true)
            expect(result.errors).toHaveLength(0)
            expect(result.warnings).toHaveLength(0)
        })

        it('should warn when perimeter is not provided', () => {
            const result = validationService.validatePerimeterMeasurement(null, 500, 'ft')

            expect(result.isValid).toBe(true)
            expect(result.warnings).toContain('Perimeter measurement not provided - using area-based estimate')
        })

        it('should warn when perimeter is zero', () => {
            const result = validationService.validatePerimeterMeasurement(0, 500, 'ft')

            expect(result.isValid).toBe(true)
            expect(result.warnings).toContain('Perimeter measurement not provided - using area-based estimate')
        })

        it('should warn when perimeter is unusually small', () => {
            const result = validationService.validatePerimeterMeasurement(20, 500, 'ft')

            expect(result.isValid).toBe(true)
            expect(result.warnings).toContain('Perimeter seems unusually small (20 ft)')
        })

        it('should warn when perimeter is unusually large', () => {
            const result = validationService.validatePerimeterMeasurement(12000, 5000, 'ft')

            expect(result.isValid).toBe(true)
            expect(result.warnings).toContain('Perimeter seems unusually large (12,000 ft)')
        })

        it('should warn when shape appears elongated', () => {
            const result = validationService.validatePerimeterMeasurement(200, 100, 'ft')

            expect(result.isValid).toBe(true)
            expect(result.warnings).toContain('Area shape appears very elongated or irregular')
        })

        it('should warn when shape appears very compact', () => {
            const result = validationService.validatePerimeterMeasurement(30, 500, 'ft')

            expect(result.isValid).toBe(true)
            expect(result.warnings).toContain('Area shape appears very compact - please verify measurements')
        })

        it('should handle meters conversion', () => {
            const result = validationService.validatePerimeterMeasurement(30, 500, 'm')

            expect(result.isValid).toBe(true)
        })
    })

    describe('validateForm', () => {
        it('should validate complete valid form data', () => {
            const formData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com',
                phone: '5551234567',
                serviceType: 'residential',
                projectDescription: 'Need driveway paving'
            }

            const result = validationService.validateForm(formData)

            expect(result.isValid).toBe(true)
            expect(result.errors).toHaveLength(0)
        })

        it('should reject form with missing required fields', () => {
            const formData = {
                firstName: '',
                lastName: 'Doe',
                email: 'john.doe@example.com',
                phone: '5551234567',
                serviceType: 'residential'
            }

            const result = validationService.validateForm(formData)

            expect(result.isValid).toBe(false)
            expect(result.errors).toContain('First Name is required')
        })

        it('should reject form with all required fields missing', () => {
            const formData = {}

            const result = validationService.validateForm(formData)

            expect(result.isValid).toBe(false)
            expect(result.errors.length).toBeGreaterThan(0)
            expect(result.errors).toContain('First Name is required')
            expect(result.errors).toContain('Last Name is required')
            expect(result.errors).toContain('Email is required')
            expect(result.errors).toContain('Phone is required')
            expect(result.errors).toContain('Service Type is required')
        })

        it('should reject form with invalid email', () => {
            const formData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'invalid-email',
                phone: '5551234567',
                serviceType: 'residential'
            }

            const result = validationService.validateForm(formData)

            expect(result.isValid).toBe(false)
            expect(result.errors).toContain('Please enter a valid email address')
        })

        it('should warn about invalid phone format', () => {
            const formData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com',
                phone: '123',
                serviceType: 'residential'
            }

            const result = validationService.validateForm(formData)

            expect(result.warnings).toContain('Phone number format could not be verified')
        })

        it('should validate form with area data', () => {
            const formData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com',
                phone: '5551234567',
                serviceType: 'residential',
                areaData: {
                    areaInSquareFeet: 500,
                    perimeter: 100
                }
            }

            const result = validationService.validateForm(formData)

            expect(result.isValid).toBe(true)
        })

        it('should reject form with invalid area data', () => {
            const formData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com',
                phone: '5551234567',
                serviceType: 'residential',
                areaData: {
                    areaInSquareFeet: 30
                }
            }

            const result = validationService.validateForm(formData)

            expect(result.isValid).toBe(false)
            expect(result.errors).toContain('Area is below minimum of 50 sq ft')
        })

        it('should validate form with area field instead of areaInSquareFeet', () => {
            const formData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com',
                phone: '5551234567',
                serviceType: 'residential',
                areaData: {
                    area: 500,
                    perimeter: 100
                }
            }

            const result = validationService.validateForm(formData)

            expect(result.isValid).toBe(true)
        })

        it('should include measurement tool recommendations', () => {
            const formData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com',
                phone: '5551234567',
                serviceType: 'residential',
                projectDescription: 'Driveway on a slope'
            }

            const result = validationService.validateForm(formData)

            expect(result.recommendations.length).toBeGreaterThan(0)
        })

        it('should handle whitespace-only values as missing', () => {
            const formData = {
                firstName: '   ',
                lastName: 'Doe',
                email: 'john.doe@example.com',
                phone: '5551234567',
                serviceType: 'residential'
            }

            const result = validationService.validateForm(formData)

            expect(result.isValid).toBe(false)
            expect(result.errors).toContain('First Name is required')
        })
    })

    describe('isValidEmail', () => {
        it('should accept valid email addresses', () => {
            expect(validationService.isValidEmail('john.doe@example.com')).toBe(true)
            expect(validationService.isValidEmail('user+tag@domain.co.uk')).toBe(true)
            expect(validationService.isValidEmail('test_email@test.org')).toBe(true)
        })

        it('should reject invalid email addresses', () => {
            expect(validationService.isValidEmail('invalid')).toBe(false)
            expect(validationService.isValidEmail('invalid@')).toBe(false)
            expect(validationService.isValidEmail('@example.com')).toBe(false)
            expect(validationService.isValidEmail('no-at-sign.com')).toBe(false)
            expect(validationService.isValidEmail('missing@domain')).toBe(false)
            expect(validationService.isValidEmail('spaces in@email.com')).toBe(false)
        })
    })

    describe('isValidPhone', () => {
        it('should accept valid phone numbers', () => {
            expect(validationService.isValidPhone('5551234567')).toBe(true)
            expect(validationService.isValidPhone('(555) 123-4567')).toBe(true)
            expect(validationService.isValidPhone('+15551234567')).toBe(true)
            expect(validationService.isValidPhone('555-123-4567')).toBe(true)
        })

        it('should reject invalid phone numbers', () => {
            expect(validationService.isValidPhone('123')).toBe(false)
            expect(validationService.isValidPhone('abc')).toBe(false)
            expect(validationService.isValidPhone('')).toBe(false)
        })

        it('should accept international phone numbers', () => {
            expect(validationService.isValidPhone('+441234567890')).toBe(true)
            expect(validationService.isValidPhone('+86 138 0000 0000')).toBe(true)
        })
    })

    describe('formatFieldName', () => {
        it('should format camelCase field names', () => {
            expect(validationService.formatFieldName('firstName')).toBe('First Name')
            expect(validationService.formatFieldName('lastName')).toBe('Last Name')
            expect(validationService.formatFieldName('serviceType')).toBe('Service Type')
        })

        it('should handle single word field names', () => {
            expect(validationService.formatFieldName('email')).toBe('Email')
            expect(validationService.formatFieldName('phone')).toBe('Phone')
        })

        it('should handle multiple capital letters', () => {
            expect(validationService.formatFieldName('projectDescription')).toBe('Project Description')
        })
    })

    describe('convertToSquareFeet', () => {
        it('should convert square feet to square feet', () => {
            expect(validationService.convertToSquareFeet(100, 'sqft')).toBe(100)
        })

        it('should convert square meters to square feet', () => {
            const result = validationService.convertToSquareFeet(10, 'sqm')
            expect(result).toBeCloseTo(107.639, 2)
        })

        it('should convert acres to square feet', () => {
            expect(validationService.convertToSquareFeet(1, 'acres')).toBe(43560)
        })

        it('should handle unknown units as 1:1 conversion', () => {
            expect(validationService.convertToSquareFeet(100, 'unknown')).toBe(100)
        })
    })

    describe('convertToFeet', () => {
        it('should convert feet to feet', () => {
            expect(validationService.convertToFeet(100, 'ft')).toBe(100)
        })

        it('should convert meters to feet', () => {
            const result = validationService.convertToFeet(10, 'm')
            expect(result).toBeCloseTo(32.8084, 2)
        })

        it('should handle meters alias', () => {
            const result = validationService.convertToFeet(10, 'meters')
            expect(result).toBeCloseTo(32.8084, 2)
        })

        it('should handle unknown units as 1:1 conversion', () => {
            expect(validationService.convertToFeet(100, 'unknown')).toBe(100)
        })
    })

    describe('getTooltip', () => {
        it('should return tooltip for known elements', () => {
            expect(validationService.getTooltip('measurement3D')).toBe('Use 3D measurement for slopes and complex terrain to get accurate surface area calculations. This is especially important for driveways on hills or uneven ground.')
            expect(validationService.getTooltip('areaValidation')).toBe('Area measurements help us provide accurate estimates and ensure we bring the right equipment and materials for your project.')
            expect(validationService.getTooltip('serviceTypeSelection')).toBe('Select the service type that best matches your project. This helps us provide appropriate pricing and timeline estimates.')
        })

        it('should return null for unknown elements', () => {
            expect(validationService.getTooltip('unknown')).toBeNull()
        })
    })

    describe('getHelpText', () => {
        it('should return help text for service types', () => {
            expect(validationService.getHelpText('serviceTypes', 'residential')).toBe('Driveways, walkways, patios, and small parking areas for homes')
            expect(validationService.getHelpText('serviceTypes', 'commercial')).toBe('Parking lots, loading docks, and business access areas')
            expect(validationService.getHelpText('serviceTypes', 'maintenance')).toBe('Crack sealing, sealcoating, striping, and repair work')
        })

        it('should return null for unknown field types', () => {
            expect(validationService.getHelpText('unknown')).toBeNull()
        })

        it('should return parent object for unknown subtypes', () => {
            const result = validationService.getHelpText('serviceTypes', 'unknown')
            expect(result).toBeDefined()
            expect(result.residential).toBe('Driveways, walkways, patios, and small parking areas for homes')
        })

        it('should return help text object when no subtype specified', () => {
            const result = validationService.getHelpText('serviceTypes')
            expect(result).toBeDefined()
            expect(result.residential).toBe('Driveways, walkways, patios, and small parking areas for homes')
        })
    })

    describe('getMeasurementToolInstructions', () => {
        it('should return instructions for google-maps tool', () => {
            const instructions = validationService.getMeasurementToolInstructions('google-maps')

            expect(instructions).toBeDefined()
            expect(instructions.title).toBe('Google Maps Area Finder')
            expect(instructions.description).toBe('Easy-to-use 2D measurement with satellite imagery')
            expect(instructions.instructions).toBeInstanceOf(Array)
            expect(instructions.instructions.length).toBeGreaterThan(0)
            expect(instructions.benefits).toBeInstanceOf(Array)
            expect(instructions.limitations).toBeInstanceOf(Array)
        })

        it('should return null for unknown tool types', () => {
            expect(validationService.getMeasurementToolInstructions('unknown-tool')).toBeNull()
        })
    })

    describe('recommendMeasurementTool', () => {
        it('should recommend google-maps for flat residential projects', () => {
            const recommendation = validationService.recommendMeasurementTool('residential', 'Simple driveway')

            expect(recommendation.primary).toBe('google-maps')
            expect(recommendation.secondary).toBe('google-maps')
        })

        it('should recommend google-maps for sloped projects', () => {
            const recommendation = validationService.recommendMeasurementTool('residential', 'Driveway on a steep slope')

            expect(recommendation.primary).toBe('google-maps')
            expect(recommendation.reasoning).toContain('2D measurement suitable for most terrain types')
        })

        it('should detect slope keywords in project description', () => {
            const slopeKeywords = ['slope', 'hill', 'sloped', 'steep', 'elevation', 'grade', 'incline']

            slopeKeywords.forEach(keyword => {
                const recommendation = validationService.recommendMeasurementTool('residential', `Project with ${keyword}`)
                expect(recommendation.reasoning).toContain('2D measurement suitable for most terrain types')
            })
        })

        it('should note 3D benefits for commercial projects', () => {
            const recommendation = validationService.recommendMeasurementTool('commercial', 'Large parking lot')

            expect(recommendation.reasoning).toContain('Commercial projects benefit from precise 3D measurements')
        })

        it('should recommend google-maps for emergency repairs', () => {
            const recommendation = validationService.recommendMeasurementTool('emergency', 'Urgent pothole repair')

            expect(recommendation.primary).toBe('google-maps')
            expect(recommendation.reasoning).toContain('Quick 2D measurement suitable for emergency repairs')
        })

        it('should handle empty project description', () => {
            const recommendation = validationService.recommendMeasurementTool('residential', '')

            expect(recommendation.primary).toBeDefined()
            expect(recommendation.secondary).toBeDefined()
            expect(recommendation.reasoning).toBeInstanceOf(Array)
        })

        it('should handle hasSlope parameter', () => {
            const recommendation = validationService.recommendMeasurementTool('residential', 'Driveway', true)

            expect(recommendation.primary).toBe('google-maps')
            expect(recommendation.reasoning).toContain('2D measurement suitable for most terrain types')
        })
    })

    describe('getValidationMessage', () => {
        it('should format validation message with errors', () => {
            const validation = {
                errors: ['Error 1', 'Error 2'],
                warnings: [],
                recommendations: []
            }

            const message = validationService.getValidationMessage(validation)

            expect(message).toContain('Errors: Error 1, Error 2')
        })

        it('should format validation message with warnings', () => {
            const validation = {
                errors: [],
                warnings: ['Warning 1', 'Warning 2'],
                recommendations: []
            }

            const message = validationService.getValidationMessage(validation)

            expect(message).toContain('Warnings: Warning 1, Warning 2')
        })

        it('should format validation message with recommendations', () => {
            const validation = {
                errors: [],
                warnings: [],
                recommendations: ['Recommendation 1', 'Recommendation 2']
            }

            const message = validationService.getValidationMessage(validation)

            expect(message).toContain('Recommendations: Recommendation 1, Recommendation 2')
        })

        it('should format validation message with all types', () => {
            const validation = {
                errors: ['Error 1'],
                warnings: ['Warning 1'],
                recommendations: ['Recommendation 1']
            }

            const message = validationService.getValidationMessage(validation)

            expect(message).toContain('Errors: Error 1')
            expect(message).toContain('Warnings: Warning 1')
            expect(message).toContain('Recommendations: Recommendation 1')
        })

        it('should return empty string for empty validation', () => {
            const validation = {
                errors: [],
                warnings: [],
                recommendations: []
            }

            const message = validationService.getValidationMessage(validation)

            expect(message).toBe('')
        })
    })

    describe('edge cases', () => {
        it('should handle undefined service type in validateAreaMeasurement', () => {
            const result = validationService.validateAreaMeasurement(500, undefined, 'sqft')

            expect(result.isValid).toBe(true)
        })

        it('should handle negative area values', () => {
            const result = validationService.validateAreaMeasurement(-100, 'residential', 'sqft')

            expect(result.isValid).toBe(false)
            expect(result.errors).toContain('Area measurement is required and must be greater than 0')
        })

        it('should handle negative perimeter values', () => {
            const result = validationService.validatePerimeterMeasurement(-50, 500, 'ft')

            expect(result.isValid).toBe(true)
            expect(result.warnings).toContain('Perimeter measurement not provided - using area-based estimate')
        })

        it('should handle form validation with null values', () => {
            const formData = {
                firstName: null,
                lastName: null,
                email: null,
                phone: null,
                serviceType: null
            }

            const result = validationService.validateForm(formData)

            expect(result.isValid).toBe(false)
        })

        it('should handle form validation with undefined values', () => {
            const formData = {
                firstName: undefined,
                lastName: undefined,
                email: undefined,
                phone: undefined,
                serviceType: undefined
            }

            const result = validationService.validateForm(formData)

            expect(result.isValid).toBe(false)
        })
    })
})
