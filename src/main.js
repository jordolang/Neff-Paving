// Import CSS - using Vite alias for better deployment compatibility
import '@styles/main.css'

// Import Vercel Speed Insights
import { injectSpeedInsights } from '@vercel/speed-insights'

// Import Vercel Analytics
import { inject } from '@vercel/analytics'

import { AreaFinder } from './components/area-finder.js';
import { LocationMaps } from './components/location-maps.js';
import GalleryFilter from './components/gallery-filter.js';

// Import asset loading utilities
import { assetLoader } from './utils/asset-loader.js';
import { initializeAssetOptimization } from './utils/base-url.js';

// Import measurement storage utilities
import { 
    initializeStorage, 
    handleFormSubmission, 
    handleFormReset, 
    setActiveTool, 
    getMeasurementSummary 
} from './utils/measurement-storage.js';

// Import debug utilities (for development)
import { debugAssetPaths, testAssetLoading, fixDoubleSlashes } from './debug-assets.js';

// Import cache-busting utilities
import { getBuildInfo, addCacheBusting } from './utils/cache-busting.js';

// Import animation libraries
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import AOS from 'aos'
import 'aos/dist/aos.css'



// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger)

// Initialize the application
class NeffPavingApp {
    constructor() {
        this.scrollRevealElements = []
        this.isLoading = false
        this.formProgress = 0
        this.areaFinderInstance = null
        this.activeMeasurementTool = 'google-maps'
        this.galleryFilter = null
        this.init();
    }

    init() {
        // Log build information for cache busting verification
        if (import.meta.env.DEV) {
            console.log('🔧 Build Info:', getBuildInfo());
        }
        
        // Initialize asset optimization first
        initializeAssetOptimization()
        
        // Initialize storage system
        initializeStorage()
        
        // Preload critical assets
        this.preloadCriticalAssets()
        
        // Initialize hero video
        this.initHeroVideo()
        
        this.initLoadingAnimation()
        this.initAnimations()
        this.initScrollEffects()
        this.initRevealOnScroll()
        this.initNavigation()
        
        // Initialize gallery (critical for user experience)
        try {
            this.initGalleryFilters()
            console.log('Gallery initialized successfully')
        } catch (error) {
            console.error('Gallery initialization failed:', error)
        }
        
        // Initialize other components with error handling
        try {
            this.initContactForm()
        } catch (error) {
            console.error('Contact form initialization failed:', error)
        }
        
        this.initSectionAnimations()
        this.initConversionOptimizations()
        this.initInteractiveFeatures()
        this.initClickToCall()
        this.initEmergencyServiceHighlight()
        this.initNotificationSystem()
        
        // Initialize optional components that may fail
        try {
            this.initLocationMaps()
        } catch (error) {
            console.error('Location maps initialization failed (non-critical):', error)
        }
        
        this.initLazyLoading();
        
        try {
            this.initServiceWorker();
        } catch (error) {
            console.error('Service worker initialization failed (non-critical):', error)
        }

        // Initialize analytics (optional)
        try {
            // Initialize Vercel Analytics if available
            if (typeof inject === 'function') {
                inject()
            }
            
            // Initialize Vercel Speed Insights if available  
            if (typeof injectSpeedInsights === 'function') {
                injectSpeedInsights({
                    beforeSend: (event) => {
                        // Optional: Add any custom logic here
                        return event;
                    },
                });
            }
        } catch (error) {
            console.error('Analytics initialization failed (non-critical):', error)
        }

        console.log('Neff Paving app initialized successfully')
    }







    /**
     * Initialize hero video with proper path handling
     */
    initHeroVideo() {
        const video = document.getElementById('hero-video');
        if (!video) return;

        // Use Vite's asset resolution for better deployment compatibility
        const videoSource = video.querySelector('source');
        if (videoSource) {
            // Use dynamic import or direct path - Vite will handle asset resolution
            const videoPath = '/assets/videos/optimized/neff-paving-1080p.mp4';
            videoSource.src = videoPath;
        }

        // Add error handling
        video.addEventListener('error', (e) => {
            console.error('Video failed to load:', e);
            // Add a fallback background color or image
            const heroSection = document.getElementById('hero');
            if (heroSection) {
                heroSection.style.backgroundColor = '#2c2c2c';
            }
        });

        // Force video to play on load
        video.addEventListener('loadeddata', () => {
            video.play().catch(err => {
                console.error('Video autoplay failed:', err);
            });
        });

        // Ensure video is visible
        video.style.opacity = '1';
    }

    /**
     * Preload critical assets for better performance
     */
    preloadCriticalAssets() {
        const criticalAssets = [
            { path: '/assets/images/posters/hero-poster-1920x1080.jpg', type: 'image', priority: 'high' },
            { path: '/assets/videos/optimized/neff-paving-1080p.mp4', type: 'video', priority: 'medium' },
            { path: '/assets/images/neff-favicon.png', type: 'image', priority: 'high' }
        ];
        
        assetLoader.preloadCriticalAssets(criticalAssets);
    }
    
    /**
     * Initialize lazy loading for images and videos
     */
    initLazyLoading() {
        // Convert existing images to lazy loading
        document.querySelectorAll('img[src]').forEach(img => {
            const src = img.src;
            if (src && !src.startsWith('data:') && !img.hasAttribute('data-no-lazy')) {
                img.dataset.src = src;
                img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB2aWV3Qm94PSIwIDAgMSAxIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxwYXRoIGZpbGw9IiNGOEY5RkEiIGQ9Ik0wIDBoMXYxSDB6Ii8+PC9zdmc+';
                img.loading = 'lazy';
                img.classList.add('lazy-load');
            }
        });
        
        // Add lazy loading observer
        assetLoader.addLazyImages();
    }
    
    
    initSectionAnimations() {
        // Enhanced animations for new sections - with existence checks
        
        // Create GSAP context for section animations
        this.sectionContext = gsap.context(() => {
            // Service cards hover effects
            const serviceCards = document.querySelectorAll('.service-card')
            serviceCards.forEach(card => {
                if (card) {
                    card.addEventListener('mouseenter', () => {
                        gsap.to(card, {
                            scale: 1.03,
                            duration: 0.3,
                            ease: 'power2.out'
                        })
                    })
                    
                    card.addEventListener('mouseleave', () => {
                        gsap.to(card, {
                            scale: 1,
                            duration: 0.3,
                            ease: 'power2.out'
                        })
                    })
                }
            })
            
            // Team member animations
            const teamMembers = document.querySelectorAll('.team-member')
            teamMembers.forEach((member, index) => {
                if (member) {
                    gsap.from(member, {
                        y: 50,
                        opacity: 0,
                        duration: 0.8,
                        delay: index * 0.1,
                        scrollTrigger: {
                            trigger: member,
                            start: 'top 80%',
                            toggleActions: 'play none none reverse'
                        }
                    })
                }
            })
            
            // Contact method cards - no animation delay for immediate display
            const contactMethods = document.querySelectorAll('.contact-method')
            contactMethods.forEach((method, index) => {
                if (method) {
                    // Remove any hidden state that might be set
                    method.style.opacity = '1'
                    method.style.transform = 'none'
                }
            })
            
            // Stats counter animation
            const statNumbers = document.querySelectorAll('.stat-number')
            statNumbers.forEach(stat => {
                if (stat && stat.textContent) {
                    const finalValue = stat.textContent
                    stat.textContent = '0'
                    
                    gsap.to(stat, {
                        textContent: finalValue,
                        duration: 2,
                        ease: 'power2.out',
                        snap: { textContent: 1 },
                        scrollTrigger: {
                            trigger: stat,
                            start: 'top 80%',
                            toggleActions: 'play none none none'
                        }
                    })
                }
            })
            
            // Certification icons animation
            const certIcons = document.querySelectorAll('.cert-icon')
            certIcons.forEach((icon, index) => {
                if (icon) {
                    gsap.from(icon, {
                        scale: 0,
                        rotation: 180,
                        duration: 0.5,
                        delay: index * 0.05,
                        ease: 'back.out(1.7)',
                        scrollTrigger: {
                            trigger: icon,
                            start: 'top 85%',
                            toggleActions: 'play none none reverse'
                        }
                    })
                }
            })
        })
    }

    initAnimations() {
        // Initialize AOS (Animate On Scroll)
        AOS.init({
            duration: 1000,
            once: true,
            offset: 100
        })

        // Create GSAP context for better cleanup and error handling
        this.gsapContext = gsap.context(() => {
            // GSAP animations for hero section - with existence checks
            const heroTitle = document.querySelector('.hero-content h2')
            if (heroTitle) {
                gsap.from(heroTitle, {
                    duration: 1.5,
                    y: 50,
                    opacity: 0,
                    ease: 'power3.out'
                })
            }

            const heroText = document.querySelector('.hero-content p')
            if (heroText) {
                gsap.from(heroText, {
                    duration: 1.5,
                    y: 30,
                    opacity: 0,
                    delay: 0.3,
                    ease: 'power3.out'
                })
            }
        })
    }

    initAreaFinder() {
        // Initialize area finder if container exists
        const mapContainer = document.querySelector('.map-placeholder')
        if (mapContainer) {
            // Replace the placeholder with area finder
            mapContainer.innerHTML = `
                <div id="area-finder-container">
                    <h4>Project Area Calculator</h4>
                    <p>Draw the area of your project on the map to get an accurate estimate.</p>
                </div>
            `
            
            try {
                this.areaFinderInstance = new AreaFinder('area-finder-container', {
                    showCalculator: true,
                    showAddressSearch: true,
                    showAreaInfo: true,
                    onAreaCalculated: (areaData) => {
                        console.log('Area calculated:', areaData)
                        this.updateProjectSizeFromArea(areaData)
                    }
                })
            } catch (error) {
                console.error('Error initializing area finder:', error)
                mapContainer.innerHTML = `
                    <div class="error-message">
                        <p>Unable to load map. Please enter project size manually in the form above.</p>
                    </div>
                `
            }
        }
    }
    
    updateProjectSizeFromArea(areaData) {
        const projectSizeInput = document.getElementById('project-size')
        if (projectSizeInput && areaData.areaInSquareFeet) {
            projectSizeInput.value = `${Math.round(areaData.areaInSquareFeet)} sq ft`
            
            // Trigger input event to update any listeners
            projectSizeInput.dispatchEvent(new Event('input', { bubbles: true }))
        }
    }

    
    
    
    

    initScrollEffects() {
        // Check if user prefers reduced motion
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        
        // Create GSAP context for scroll effects
        this.scrollContext = gsap.context(() => {
            if (!prefersReducedMotion) {
                // Parallax effect for hero content - with existence check
                const heroContent = document.querySelector('.hero-content')
                const heroSection = document.getElementById('hero')
                if (heroContent && heroSection) {
                    gsap.to(heroContent, {
                        yPercent: 10,
                        ease: 'none',
                        scrollTrigger: {
                            trigger: heroSection,
                            start: 'top bottom',
                            end: 'bottom top',
                            scrub: 2
                        }
                    })
                }
            }
            
            // Enhanced hero content animations - with existence checks
            const heroSection = document.getElementById('hero')
            if (heroSection) {
                const heroTimeline = gsap.timeline({
                    scrollTrigger: {
                        trigger: heroSection,
                        start: 'top 80%',
                        toggleActions: 'play none none reverse'
                    }
                })
                
                const heroTitle = document.querySelector('.hero-title')
                if (heroTitle) {
                    heroTimeline.from(heroTitle, {
                        y: 60,
                        opacity: 0,
                        duration: 1.2,
                        ease: 'power3.out'
                    })
                }
                
                const heroSubtitle = document.querySelector('.hero-subtitle')
                if (heroSubtitle) {
                    heroTimeline.from(heroSubtitle, {
                        y: 40,
                        opacity: 0,
                        duration: 1,
                        ease: 'power3.out'
                    }, '-=0.8')
                }
                
                const heroButtons = document.querySelectorAll('.hero-cta .btn')
                if (heroButtons.length > 0) {
                    heroTimeline.from(heroButtons, {
                        y: 30,
                        opacity: 0,
                        duration: 0.8,
                        stagger: 0.2,
                        ease: 'power3.out'
                    }, '-=0.6')
                }
                
                const featureBadges = document.querySelectorAll('.feature-badge')
                if (featureBadges.length > 0) {
                    heroTimeline.from(featureBadges, {
                        y: 20,
                        opacity: 0,
                        duration: 0.6,
                        stagger: 0.1,
                        ease: 'power3.out'
                    }, '-=0.4')
                }
            }
            
            // Services section animations - with existence checks
            const servicesSection = document.querySelector('.services-section')
            const serviceCards = document.querySelectorAll('.asphalt-service-grid .service-card, .concrete-service-container .service-card')
            if (servicesSection && serviceCards.length > 0) {
                gsap.from(serviceCards, {
                    y: 80,
                    opacity: 0,
                    duration: 1,
                    stagger: 0.2,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: servicesSection,
                        start: 'top 80%',
                        toggleActions: 'play none none reverse'
                    }
                })
            }
            
            // Gallery section animations - with existence checks
            const galleryContainer = document.querySelector('.gallery-container, .gallery')
            const galleryItems = document.querySelectorAll('.gallery-item, .gallery-card')
            if (galleryContainer && galleryItems.length > 0) {
                gsap.from(galleryItems, {
                    scale: 0.8,
                    opacity: 0,
                    duration: 0.8,
                    stagger: 0.1,
                    ease: 'power3.out',
                    scrollTrigger: {
                        trigger: galleryContainer,
                        start: 'top 80%',
                        toggleActions: 'play none none reverse'
                    }
                })
            }
            
            // Header background opacity on scroll - with existence check
            const header = document.querySelector('header')
            if (header) {
                gsap.to(header, {
                    backgroundColor: 'rgba(44, 62, 80, 0.98)',
                    scrollTrigger: {
                        trigger: 'body',
                        start: 'top -50px',
                        end: 'top -100px',
                        scrub: 1
                    }
                })
            }
            
            // Smooth reveal animation for sections - with existence checks
            const sections = document.querySelectorAll('section')
            sections.forEach((section, index) => {
                if (section && section.id !== 'hero') {
                    gsap.from(section, {
                        opacity: 0,
                        y: 50,
                        duration: 1,
                        scrollTrigger: {
                            trigger: section,
                            start: 'top 85%',
                            toggleActions: 'play none none reverse'
                        }
                    })
                }
            })
        })
    }

    initNavigation() {
        // Smooth scrolling for navigation links
        document.querySelectorAll('nav a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault()
                const target = document.querySelector(this.getAttribute('href'))
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    })
                }
            })
        })

        // Header scroll effect
        let lastScrollTop = 0
        window.addEventListener('scroll', () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop
            const header = document.querySelector('header')
            
            if (scrollTop > lastScrollTop && scrollTop > 100) {
                // Scrolling down
                header.style.transform = 'translateY(-100%)'
            } else {
                // Scrolling up
                header.style.transform = 'translateY(0)'
            }
            
            lastScrollTop = scrollTop <= 0 ? 0 : scrollTop
        })
    }
    
    initGalleryFilters() {
        const galleryElement = document.getElementById('gallery');
        if (galleryElement) {
            this.galleryFilter = new GalleryFilter(galleryElement);
        }
    }
    
    initContactForm() {
        const contactForm = document.getElementById('contact-form')
        if (contactForm) {
            contactForm.addEventListener('submit', async (e) => {
                e.preventDefault()

                // Get form data
                const formData = new FormData(contactForm)
                const formObject = Object.fromEntries(formData)

                // Determine active measurement tool and get data
                const measurementData = this.getMeasurementData()
                
                // Validate measurement data if tool was used
                if (measurementData && !this.validateMeasurementData(measurementData)) {
                    this.showValidationErrors(['measurement-invalid'])
                    return
                }

                // Include measurement data in form submission payload
                if (measurementData) {
                    formObject.measurementData = measurementData
                    formObject.areaInSquareFeet = measurementData.areaInSquareFeet
                    formObject.measurementTool = measurementData.toolType
                }

                // Basic validation
                if (!this.validateForm(formObject)) {
                    return
                }

                // Show loading state
                const submitButton = contactForm.querySelector('button[type="submit"]')
                const originalText = submitButton.textContent
                submitButton.textContent = 'Sending...'
                submitButton.disabled = true

                try {
                    // Submit to backend API
                    const response = await fetch('/api/estimates', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(formObject)
                    })

                    const result = await response.json()

                    if (result.success) {
                        this.showSuccessMessage('Your estimate request has been submitted successfully!')
                        contactForm.reset()
                        this.clearMeasurementData()
                        // Clear session storage
                        handleFormSubmission()
                    } else {
                        throw new Error(result.message || 'Submission failed')
                    }
                } catch (error) {
                    console.error('Form submission error:', error)
                    this.showSuccessMessage('Form submitted! We will contact you within 2 business hours.', 'warning')
                } finally {
                    submitButton.textContent = originalText
                    submitButton.disabled = false
                }
            })
        }
        
        // Start chat functionality
        const startChatBtn = document.getElementById('start-chat')
        if (startChatBtn) {
            startChatBtn.addEventListener('click', () => {
                // Simulate chat widget opening
                alert('Chat widget would open here. In a real implementation, this would integrate with a chat service like Intercom, Zendesk, or custom solution.')
            })
        }
        
    }
    
    validateForm(formData) {
        const required = ['firstName', 'lastName', 'email', 'phone', 'serviceType']
        const errors = []
        
        required.forEach(field => {
            if (!formData[field] || formData[field].trim() === '') {
                errors.push(field)
            }
        })
        
        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (formData.email && !emailRegex.test(formData.email)) {
            errors.push('email-format')
        }
        
        // Phone validation
        const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/
        if (formData.phone && !phoneRegex.test(formData.phone.replace(/\D/g, ''))) {
            errors.push('phone-format')
        }
        
        if (errors.length > 0) {
            this.showValidationErrors(errors)
            return false
        }
        
        return true
    }
    
    showValidationErrors(errors) {
        // Remove existing error messages
        document.querySelectorAll('.error-message').forEach(msg => msg.remove())
        
        errors.forEach(error => {
            let fieldName, message
            
            switch(error) {
                case 'firstName':
                    fieldName = 'first-name'
                    message = 'First name is required'
                    break
                case 'lastName':
                    fieldName = 'last-name'
                    message = 'Last name is required'
                    break
                case 'email':
                    fieldName = 'email'
                    message = 'Email is required'
                    break
                case 'email-format':
                    fieldName = 'email'
                    message = 'Please enter a valid email address'
                    break
                case 'phone':
                    fieldName = 'phone'
                    message = 'Phone number is required'
                    break
                case 'phone-format':
                    fieldName = 'phone'
                    message = 'Please enter a valid phone number'
                    break
                case 'serviceType':
                    fieldName = 'service-type'
                    message = 'Please select a service type'
                    break
                case 'measurement-invalid':
                    fieldName = 'project-size'
                    message = 'Please complete the measurement or clear the drawing to proceed'
                    break
            }
            
            const field = document.getElementById(fieldName)
            if (field) {
                const errorDiv = document.createElement('div')
                errorDiv.className = 'error-message'
                errorDiv.style.color = 'var(--error-red)'
                errorDiv.style.fontSize = '14px'
                errorDiv.style.marginTop = 'var(--spacing-xs)'
                errorDiv.textContent = message
                field.parentNode.appendChild(errorDiv)
                field.style.borderColor = 'var(--error-red)'
            }
        })
    }
    
    /**
     * Determine which measurement tool is active and retrieve measurement data
     * @returns {Object|null} Measurement data object or null if no tool is active
     */
    getMeasurementData() {
        // Check for Google Maps AreaFinder instance
        if (this.areaFinderInstance && this.areaFinderInstance.getAreaData()) {
            const areaData = this.areaFinderInstance.getAreaData()
            return {
                toolType: 'google-maps',
                areaInSquareFeet: areaData.areaInSquareFeet,
                areaInAcres: areaData.areaInAcres,
                perimeter: areaData.perimeter,
                coordinates: areaData.coordinates || [],
                timestamp: new Date().toISOString()
            }
        }
        
        
        return null
    }
    
    /**
     * Validate measurement data to ensure it's complete and valid
     * @param {Object} measurementData - The measurement data to validate
     * @returns {boolean} True if valid, false otherwise
     */
    validateMeasurementData(measurementData) {
        if (!measurementData) return false
        
        // Check required fields
        if (!measurementData.areaInSquareFeet || measurementData.areaInSquareFeet <= 0) {
            return false
        }
        
        // Check if tool type is supported
        const supportedTools = ['google-maps']
        if (!supportedTools.includes(measurementData.toolType)) {
            return false
        }
        
        // Additional validation can be added here
        return true
    }
    
    /**
     * Clear measurement data from all active tools
     */
    clearMeasurementData() {
        // Clear Google Maps/AreaFinder data
        if (this.areaFinderInstance) {
            this.areaFinderInstance.clearShapes()
        }
        
    }
    
    showSuccessMessage(message = 'Thank You!', type = 'success') {
        // Remove any existing success message
        const existingMessage = document.querySelector('.success-message');
        if (existingMessage) {
            existingMessage.remove();
        }

        // Create success message
        const successDiv = document.createElement('div')
        successDiv.className = `success-message alert alert-${type === 'success' ? 'success' : 'warning'}`
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#d4edda' : '#fff3cd'};
            color: ${type === 'success' ? '#155724' : '#856404'};
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            z-index: 10000;
            border: 1px solid ${type === 'success' ? '#c3e6cb' : '#ffeaa7'};
            max-width: 400px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `
        
        successDiv.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <div>
                    <h4 style="margin: 0 0 0.5rem 0; font-size: 1.1rem; font-weight: 600;">${type === 'success' ? '✅ ' : '⚠️ '}${message}</h4>
                    <p style="margin: 0; font-size: 0.9rem;">
                        ${type === 'success' 
                            ? 'Your estimate request has been submitted successfully. We\'ll contact you within 2 business hours with a detailed quote.'
                            : 'Your form has been submitted. If you don\'t hear from us within 24 hours, please call us directly.'
                        }
                    </p>
                </div>
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: inherit; margin-left: 1rem;">×</button>
            </div>
        `
        
        document.body.appendChild(successDiv)
        
        // Auto-remove after 8 seconds
        setTimeout(() => {
            if (successDiv.parentElement) {
                successDiv.remove()
            }
        }, 8000)
        
        // Animate in
        if (typeof gsap !== 'undefined') {
            gsap.fromTo(successDiv, 
                { x: 400, opacity: 0 },
                { x: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.7)' }
            )
        }
    }
    
    initLoadingAnimation() {
        // Create loading overlay
        const loadingOverlay = document.createElement('div')
        loadingOverlay.className = 'loading-overlay show'
        loadingOverlay.innerHTML = `
            <div class="loading-spinner"></div>
        `
        document.body.appendChild(loadingOverlay)
        
        // Remove loading overlay after page loads
        window.addEventListener('load', () => {
            setTimeout(() => {
                loadingOverlay.classList.remove('show')
                setTimeout(() => {
                    loadingOverlay.remove()
                }, 300)
            }, 500)
        })
    }
    
    initRevealOnScroll() {
        // Add reveal classes to elements
        const elementsToReveal = [
            { selector: '.service-card', class: 'reveal stagger-1' },
            { selector: '.gallery-item', class: 'reveal-scale stagger-2' },
            { selector: '.team-member', class: 'reveal-left stagger-3' },
            { selector: '.contact-method', class: 'reveal-right stagger-1' },
            { selector: '.cert-category', class: 'reveal stagger-2' }
        ]
        
        elementsToReveal.forEach(({ selector, class: className }) => {
            document.querySelectorAll(selector).forEach((element, index) => {
                element.classList.add('reveal')
                if (className.includes('stagger')) {
                    element.classList.add(`stagger-${(index % 6) + 1}`)
                }
                if (className.includes('reveal-left')) {
                    element.classList.add('reveal-left')
                } else if (className.includes('reveal-right')) {
                    element.classList.add('reveal-right')
                } else if (className.includes('reveal-scale')) {
                    element.classList.add('reveal-scale')
                }
            })
        })
        
        // Intersection Observer for reveal animations
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed')
                }
            })
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        })
        
        document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale').forEach(el => {
            revealObserver.observe(el)
        })
    }
    
    initConversionOptimizations() {
        // Add progress bar to contact form
        const contactForm = document.getElementById('contact-form')
        if (contactForm) {
            const progressBar = document.createElement('div')
            progressBar.className = 'form-progress'
            progressBar.innerHTML = '<div class="form-progress-bar"></div>'
            contactForm.insertBefore(progressBar, contactForm.firstChild)
            
            // Update progress as user fills form
            const formInputs = contactForm.querySelectorAll('input[required], select[required], textarea[required]')
            const progressBarInner = progressBar.querySelector('.form-progress-bar')
            
            formInputs.forEach(input => {
                input.addEventListener('input', () => {
                    this.updateFormProgress(formInputs, progressBarInner)
                })
                input.addEventListener('change', () => {
                    this.updateFormProgress(formInputs, progressBarInner)
                })
            })
        }
        
        // Chat widget is now implemented in HTML instead of sticky CTA
        
        // Add urgency indicators
        this.addUrgencyIndicators()
        
        // Track user engagement
        this.trackUserEngagement()
    }
    
    updateFormProgress(inputs, progressBar) {
        const filledInputs = Array.from(inputs).filter(input => {
            if (input.type === 'email') {
                return input.value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)
            }
            return input.value && input.value.trim() !== ''
        })
        
        const progress = (filledInputs.length / inputs.length) * 100
        progressBar.style.width = `${progress}%`
        
        // Add visual feedback for completed sections
        inputs.forEach(input => {
            const formGroup = input.closest('.form-group')
            if (input.value && input.value.trim() !== '') {
                if (input.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) {
                    formGroup.classList.remove('success')
                    formGroup.classList.add('error')
                } else {
                    formGroup.classList.remove('error')
                    formGroup.classList.add('success')
                }
            } else {
                formGroup.classList.remove('success', 'error')
            }
        })
    }
    
    createStickyCTA() {
        const stickyCTA = document.createElement('div')
        stickyCTA.className = 'sticky-cta'
        stickyCTA.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: var(--safety-yellow);
            color: var(--asphalt-dark);
            padding: var(--spacing-md) var(--spacing-lg);
            border-radius: 25px;
            box-shadow: var(--shadow-lg);
            z-index: 1000;
            font-family: var(--font-primary);
            font-weight: 600;
            cursor: pointer;
            transform: translateY(100px);
            transition: var(--transition);
        `
        stickyCTA.innerHTML = `
            📞 Call for Free Quote: (555) 123-PAVE
        `
        
        stickyCTA.addEventListener('click', () => {
            window.location.href = 'tel:5551237283'
        })
        
        document.body.appendChild(stickyCTA)
        
        // Show sticky CTA when user scrolls past hero
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) {
                    stickyCTA.style.transform = 'translateY(0)'
                } else {
                    stickyCTA.style.transform = 'translateY(100px)'
                }
            })
        }, { threshold: 0.1 })
        
        const heroSection = document.getElementById('hero')
        if (heroSection) {
            observer.observe(heroSection)
        }
    }
    
    addUrgencyIndicators() {
        // Add limited time offers
        const emergencyService = document.querySelector('.emergency-service')
        if (emergencyService) {
            const urgencyText = document.createElement('div')
            urgencyText.style.cssText = `
                background: rgba(255, 255, 255, 0.1);
                padding: var(--spacing-sm);
                border-radius: var(--border-radius);
                margin-top: var(--spacing-md);
                font-size: 14px;
                text-align: center;
            `
            urgencyText.innerHTML = '⚡ Average response time: 30 minutes'
            emergencyService.appendChild(urgencyText)
        }
        
        // Add social proof
        this.addSocialProof()
    }
    
    addSocialProof() {
        const heroContent = document.querySelector('.hero-content')
        if (heroContent) {
            const socialProof = document.createElement('div')
            socialProof.className = 'social-proof'
            socialProof.style.cssText = `
                margin-top: var(--spacing-lg);
                padding: var(--spacing-md);
                background: rgba(255, 255, 255, 0.1);
                border-radius: var(--border-radius);
                text-align: center;
                font-size: 14px;
            `
            socialProof.innerHTML = `
                ⭐⭐⭐⭐⭐ Rated 4.9/5 by 200+ customers | 🏆 BBB A+ Rating
            `
            heroContent.appendChild(socialProof)
        }
    }
    
    trackUserEngagement() {
        // Track scroll depth
        let maxScroll = 0
        window.addEventListener('scroll', () => {
            const scrollPercent = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100)
            maxScroll = Math.max(maxScroll, scrollPercent)
            
            // Trigger conversion offers at key scroll points
            if (scrollPercent >= 50 && !this.hasShownScrollOffer) {
                this.showScrollOffer()
                this.hasShownScrollOffer = true
            }
        })
        
        // Track time on page
        let timeOnPage = 0
        setInterval(() => {
            timeOnPage += 1
            
            // Show exit intent offer after 2 minutes
            if (timeOnPage >= 120 && !this.hasShownTimeOffer) {
                this.showTimeOffer()
                this.hasShownTimeOffer = true
            }
        }, 1000)
        
        // Track exit intent
        document.addEventListener('mouseleave', (e) => {
            if (e.clientY < 0 && !this.hasShownExitIntent) {
                this.showExitIntentOffer()
                this.hasShownExitIntent = true
            }
        })
    }
    
    showScrollOffer() {
        this.showNotification('📱 Still browsing? Get a free quote in under 2 minutes!', 'info', () => {
            document.getElementById('contact-form').scrollIntoView({ behavior: 'smooth' })
        })
    }
    
    showTimeOffer() {
        this.showNotification('⏰ Limited Time: Free site consultation with any quote request!', 'warning')
    }
    
    showExitIntentOffer() {
        this.showNotification('🚀 Wait! Get 10% off your first project - Call now: (555) 123-PAVE', 'success', () => {
            window.location.href = 'tel:5551237283'
        })
    }
    
    initInteractiveFeatures() {

        // The gallery-item event listener is now handled in gallery.js
        
        // Add tooltips to service features
        document.querySelectorAll('.cert-icon').forEach(icon => {
            const listItem = icon.closest('li')
            if (listItem) {
                listItem.classList.add('tooltip')
                listItem.setAttribute('data-tooltip', 'Click for more information')
            }
        })
        
        // Add interactive service cards
        document.querySelectorAll('.service-card').forEach(card => {
            const quoteBtn = card.querySelector('.btn')
            if (quoteBtn) {
                quoteBtn.addEventListener('click', (e) => {
                    e.preventDefault()
                    this.prefilleForm(card)
                })
            }
        })
    }
    
    
    prefilleForm(serviceCard) {
        const serviceTitle = serviceCard.querySelector('h3').textContent
        const serviceSelect = document.getElementById('service-type')
        
        if (serviceSelect) {
            // Map service titles to form values
            const serviceMap = {
                'Residential Paving': 'residential',
                'Commercial Paving': 'commercial',
                'Maintenance Services': 'maintenance',
                'Custom Solutions': 'custom'
            }
            
            const serviceValue = serviceMap[serviceTitle]
            if (serviceValue) {
                serviceSelect.value = serviceValue
                serviceSelect.dispatchEvent(new Event('change'))
            }
        }
        
        // Scroll to form
        document.getElementById('contact-form').scrollIntoView({ behavior: 'smooth' })
        
        // Show notification
        this.showNotification(`Form pre-filled for ${serviceTitle} services!`, 'success')
    }
    
    initClickToCall() {
        // Make all phone numbers clickable
        const phoneNumbers = document.querySelectorAll('a[href^="tel:"]')
        phoneNumbers.forEach(phone => {
            phone.addEventListener('click', () => {
                // Track phone click (for analytics)
                this.trackPhoneClick(phone.href)
            })
        })
        
        // Add click-to-call functionality to text phone numbers
        const phoneTexts = document.querySelectorAll('.method-info, .hero-subtitle')
        phoneTexts.forEach(element => {
            const text = element.textContent
            const phoneRegex = /\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})/
            if (phoneRegex.test(text)) {
                element.style.cursor = 'pointer'
                element.style.textDecoration = 'underline'
                element.addEventListener('click', () => {
                    const phone = text.match(phoneRegex)[0]
                    window.location.href = `tel:${phone.replace(/\D/g, '')}`
                })
            }
        })
    }
    
    trackPhoneClick(phoneHref) {
        // In a real implementation, this would send to analytics
        console.log('Phone click tracked:', phoneHref)
    }
    
    initEmergencyServiceHighlight() {
        // Make emergency service more prominent based on time
        const now = new Date()
        const hour = now.getHours()
        const isBusinessHours = hour >= 7 && hour <= 19
        
        const emergencyMethods = document.querySelectorAll('.contact-method.emergency')
        emergencyMethods.forEach(method => {
            if (!isBusinessHours) {
                // Highlight emergency service after hours
                method.style.order = '-1'
                method.style.transform = 'scale(1.05)'
                
                const badge = document.createElement('div')
                badge.style.cssText = `
                    position: absolute;
                    top: -10px;
                    right: -10px;
                    background: var(--warning-amber);
                    color: var(--asphalt-dark);
                    padding: var(--spacing-xs) var(--spacing-sm);
                    border-radius: 15px;
                    font-size: 12px;
                    font-weight: 700;
                    animation: pulse 2s infinite;
                `
                badge.textContent = 'AFTER HOURS'
                method.style.position = 'relative'
                method.appendChild(badge)
            }
        })
    }
    
    initNotificationSystem() {
        // Create notification container
        const container = document.createElement('div')
        container.id = 'notification-container'
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: var(--spacing-md);
        `
        document.body.appendChild(container)
    }
    
    showNotification(message, type = 'info', onClick = null) {
        const container = document.getElementById('notification-container')
        if (!container) return
        
        const notification = document.createElement('div')
        notification.className = `notification ${type} show`
        notification.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <span>${message}</span>
                <button onclick="this.closest('.notification').remove()" style="background: none; border: none; color: inherit; font-size: 18px; cursor: pointer; margin-left: var(--spacing-md);">&times;</button>
            </div>
        `
        
        if (onClick) {
            notification.style.cursor = 'pointer'
            notification.addEventListener('click', onClick)
        }
        
        container.appendChild(notification)
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            notification.remove()
        }, 5000)
    }
    
    /**
     * Initialize location maps for business offices
     */
    initLocationMaps() {
        try {
            // Initialize location maps component
            this.locationMaps = new LocationMaps()
        } catch (error) {
            console.error('Error initializing location maps:', error)
        }
    }
    
    /**
     * Initialize Service Worker for cache management
     */
    initServiceWorker() {
        // Check if service workers are supported
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/sw.js')
                    .then(registration => {
                        console.log('Service Worker registered successfully:', registration.scope);
                        
                        // Listen for updates
                        registration.addEventListener('updatefound', () => {
                            const newWorker = registration.installing;
                            if (newWorker) {
                                newWorker.addEventListener('statechange', () => {
                                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                        // New version available, show update notification
                                        this.showUpdateNotification();
                                    }
                                });
                            }
                        });
                    })
                    .catch(error => {
                        console.log('Service Worker registration failed:', error);
                    });
            });
        } else {
            console.log('Service Worker not supported');
        }
    }
    
    /**
     * Show notification when a new version of the app is available
     */
    showUpdateNotification() {
        const notification = document.createElement('div');
        notification.className = 'update-notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: #2196F3;
            color: white;
            padding: 1rem 2rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10001;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            align-items: center;
            gap: 1rem;
        `;
        
        notification.innerHTML = `
            <span>🚀 A new version is available!</span>
            <button onclick="window.location.reload()" 
                    style="background: white; color: #2196F3; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; font-weight: 600;">Update</button>
            <button onclick="this.parentElement.remove()" 
                    style="background: transparent; color: white; border: 1px solid white; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer;">Later</button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 10 seconds if user doesn't interact
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 10000);
    }
    
    // Testimonial read more functionality removed - now using pure scroll feature

    // Debounce function
    debounce(func, delay) {
        let timeout;
        return function (...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), delay);
        };
    }


    isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }
    
    /**
     * Clean up GSAP contexts and animations
     * Call this when destroying the app instance
     */
    destroy() {
        try {
            // Kill all GSAP contexts to prevent memory leaks
            if (this.gsapContext) {
                this.gsapContext.kill()
                this.gsapContext = null
            }
            
            if (this.scrollContext) {
                this.scrollContext.kill()
                this.scrollContext = null
            }
            
            if (this.sectionContext) {
                this.sectionContext.kill()
                this.sectionContext = null
            }
            
            // Kill all ScrollTriggers
            ScrollTrigger.killAll()
            
            console.log('NeffPavingApp contexts cleaned up')
        } catch (error) {
            console.error('Error cleaning up GSAP contexts:', error)
        }
    }
    
}

// Initialize the app when DOM is loaded
function initializeApp() {
    try {
        console.log('Starting NeffPavingApp initialization...');
        new NeffPavingApp();
        console.log('NeffPavingApp initialized successfully');
    } catch (error) {
        console.error('Failed to initialize NeffPavingApp:', error);
        
        // Fallback: Initialize gallery directly if main app fails
        console.log('Attempting fallback gallery initialization...');
        try {
            const galleryElement = document.getElementById('gallery');
            if (galleryElement) {
                try {
                    new GalleryFilter(galleryElement);
                    console.log('Fallback gallery initialization successful');
                } catch (galleryError) {
                    console.error('Fallback gallery initialization failed:', galleryError);
                }
            }
        } catch (fallbackError) {
            console.error('Fallback initialization failed:', fallbackError);
        }
    }
}

// Try multiple initialization approaches to ensure it runs
function ensureDOMReady() {
    return new Promise((resolve) => {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', resolve);
        } else {
            // DOM is already loaded
            resolve();
        }
    });
}

// Initialize app with proper DOM ready check
ensureDOMReady().then(() => {
    // Add small delay to ensure all elements are fully rendered
    setTimeout(initializeApp, 100);
});
