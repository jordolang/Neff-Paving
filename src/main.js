// Import CSS
import '../styles/main.css'

// Import Vercel Speed Insights
import { injectSpeedInsights } from '@vercel/speed-insights'

// Import Vercel Analytics
import { inject } from '@vercel/analytics'

// Import blog system
import { BlogSystem } from './blog-system.js';
import { AreaFinder } from './components/area-finder.js';

// Import asset loading utilities
import { assetLoader } from './utils/asset-loader.js';
import { initializeAssetOptimization } from './utils/base-url.js';

// Import debug utilities (for development)
import { debugAssetPaths, testAssetLoading, fixDoubleSlashes } from './debug-assets.js';

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
        this.init()
    }

    init() {
        // Initialize asset optimization first
        initializeAssetOptimization()
        
        // Initialize Vercel Analytics
        inject()
        
        // Initialize Vercel Speed Insights
        injectSpeedInsights()
        
        // Preload critical assets
        this.preloadCriticalAssets()
        
        this.initLoadingAnimation()
        this.initAnimations()
        this.initScrollEffects()
        this.initRevealOnScroll()
        this.initNavigation()
        this.initGalleryFilters()
        this.initContactForm()
        this.initSectionAnimations()
        this.initConversionOptimizations()
        this.initInteractiveFeatures()
        this.initClickToCall()
        this.initEmergencyServiceHighlight()
        this.initNotificationSystem()
        this.initBlogSystem()
        this.initLazyLoading()
    }
    
    /**
     * Preload critical assets for better performance
     */
    preloadCriticalAssets() {
        const criticalAssets = [
            { path: '/assets/images/hero-bg.jpg', type: 'image', priority: 'high' },
            { path: '/assets/videos/neff-paving-1080p.mp4', type: 'video', priority: 'medium' },
            { path: '/assets/images/logo.png', type: 'image', priority: 'high' }
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
        // Enhanced animations for new sections
        
        // Service cards hover effects
        document.querySelectorAll('.service-card').forEach(card => {
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
        })
        
        // Team member animations
        document.querySelectorAll('.team-member').forEach((member, index) => {
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
        })
        
        // Contact method cards - no animation delay for immediate display
        document.querySelectorAll('.contact-method').forEach((method, index) => {
            // Remove any hidden state that might be set
            method.style.opacity = '1'
            method.style.transform = 'none'
        })
        
        // Stats counter animation
        document.querySelectorAll('.stat-number').forEach(stat => {
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
        })
        
        // Certification icons animation
        document.querySelectorAll('.cert-icon').forEach((icon, index) => {
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
        })
    }

    initAnimations() {
        // Initialize AOS (Animate On Scroll)
        AOS.init({
            duration: 1000,
            once: true,
            offset: 100
        })

        // GSAP animations for hero section
        gsap.from('.hero-content h2', {
            duration: 1.5,
            y: 50,
            opacity: 0,
            ease: 'power3.out'
        })

        gsap.from('.hero-content p', {
            duration: 1.5,
            y: 30,
            opacity: 0,
            delay: 0.3,
            ease: 'power3.out'
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
        
        if (!prefersReducedMotion) {
            // Parallax effect for hero content
            gsap.to('.hero-content', {
                yPercent: 10,
                ease: 'none',
                scrollTrigger: {
                    trigger: '#hero',
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: 2
                }
            })
        }
        
        // Enhanced hero content animations
        const heroTimeline = gsap.timeline({
            scrollTrigger: {
                trigger: '#hero',
                start: 'top 80%',
                toggleActions: 'play none none reverse'
            }
        })
        
        heroTimeline
            .from('.hero-title', {
                y: 60,
                opacity: 0,
                duration: 1.2,
                ease: 'power3.out'
            })
            .from('.hero-subtitle', {
                y: 40,
                opacity: 0,
                duration: 1,
                ease: 'power3.out'
            }, '-=0.8')
            .from('.hero-cta .btn', {
                y: 30,
                opacity: 0,
                duration: 0.8,
                stagger: 0.2,
                ease: 'power3.out'
            }, '-=0.6')
            .from('.feature-badge', {
                y: 20,
                opacity: 0,
                duration: 0.6,
                stagger: 0.1,
                ease: 'power3.out'
            }, '-=0.4')
        
        // Services section animations
        gsap.from('.asphalt-service-grid .service-card, .concrete-service-container .service-card', {
            y: 80,
            opacity: 0,
            duration: 1,
            stagger: 0.2,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: '.services-section',
                start: 'top 80%',
                toggleActions: 'play none none reverse'
            }
        })
        
        // Gallery section animations
        gsap.from('.gallery-item', {
            scale: 0.8,
            opacity: 0,
            duration: 0.8,
            stagger: 0.1,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: '.gallery-container',
                start: 'top 80%',
                toggleActions: 'play none none reverse'
            }
        })
        
        // Header background opacity on scroll
        gsap.to('header', {
            backgroundColor: 'rgba(44, 62, 80, 0.98)',
            scrollTrigger: {
                trigger: 'body',
                start: 'top -50px',
                end: 'top -100px',
                scrub: 1
            }
        })
        
        
        // Smooth reveal animation for sections
        gsap.utils.toArray('section').forEach((section, index) => {
            if (section.id !== 'hero') {
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
        const filterButtons = document.querySelectorAll('.filter-btn')
        const galleryItems = document.querySelectorAll('.gallery-item')
        
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove active class from all buttons
                filterButtons.forEach(btn => btn.classList.remove('active'))
                // Add active class to clicked button
                button.classList.add('active')
                
                const filter = button.dataset.filter
                
                galleryItems.forEach(item => {
                    if (filter === 'all' || item.dataset.category === filter) {
                        item.style.display = 'block'
                        // Animate in
                        gsap.fromTo(item, 
                            { opacity: 0, y: 20 },
                            { opacity: 1, y: 0, duration: 0.5, delay: Math.random() * 0.3 }
                        )
                    } else {
                        // Animate out
                        gsap.to(item, {
                            opacity: 0,
                            y: -20,
                            duration: 0.3,
                            onComplete: () => {
                                item.style.display = 'none'
                            }
                        })
                    }
                })
            })
        })
    }
    
    initContactForm() {
        const contactForm = document.getElementById('contact-form')
        if (contactForm) {
            contactForm.addEventListener('submit', async (e) => {
                e.preventDefault()
                
                // Get form data
                const formData = new FormData(contactForm)
                const formObject = Object.fromEntries(formData)
                
                // Add area data if available
                if (this.areaFinderInstance && this.areaFinderInstance.getAreaData()) {
                    formObject.areaData = this.areaFinderInstance.getAreaData()
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
                        if (this.areaFinderInstance) {
                            this.areaFinderInstance.clearShapes()
                        }
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
        
        // Service area checker
        const checkServiceAreaBtn = document.getElementById('check-service-area')
        if (checkServiceAreaBtn) {
            checkServiceAreaBtn.addEventListener('click', () => {
                const zipCode = prompt('Enter your ZIP code to check if we serve your area:')
                if (zipCode) {
                    this.checkServiceArea(zipCode)
                }
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
    
    checkServiceArea(zipCode) {
        // Simulate service area check (replace with actual API)
        const serviceAreas = {
            primary: ['12345', '12346', '12347', '12348', '12349'],
            extended: ['12350', '12351', '12352', '12353', '12354']
        }
        
        let message, inService = false
        
        if (serviceAreas.primary.includes(zipCode)) {
            message = `Great news! ${zipCode} is in our primary service area. We offer full services with no additional travel charges.`
            inService = true
        } else if (serviceAreas.extended.includes(zipCode)) {
            message = `Good news! ${zipCode} is in our extended service area. We can serve your area for larger projects with minimal travel charges.`
            inService = true
        } else {
            message = `We're sorry, but ${zipCode} is currently outside our service area. However, we're always expanding! Please contact us directly to discuss your project.`
        }
        
        // Show result
        const resultDiv = document.createElement('div')
        resultDiv.className = 'service-area-result'
        resultDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: var(--spacing-xl);
            border-radius: var(--border-radius-lg);
            text-align: center;
            z-index: 10000;
            box-shadow: var(--shadow-lg);
            max-width: 400px;
            border: 3px solid ${inService ? 'var(--success-green)' : 'var(--warning-amber)'};
        `
        
        resultDiv.innerHTML = `
            <h3 style="margin-bottom: var(--spacing-md); color: ${inService ? 'var(--success-green)' : 'var(--warning-amber)'};">Service Area Check</h3>
            <p style="margin-bottom: var(--spacing-lg); line-height: 1.5;">${message}</p>
            <button class="btn btn-primary" onclick="this.parentElement.remove()">Close</button>
            ${inService ? '<button class="btn btn-outline" style="margin-left: var(--spacing-md);" onclick="document.getElementById(\'contact-form\').scrollIntoView({behavior: \'smooth\'});">Get Quote</button>' : ''}
        `
        
        document.body.appendChild(resultDiv)
        
        // Animate in
        gsap.fromTo(resultDiv, 
            { scale: 0, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.7)' }
        )
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
        // Add hover effects to gallery items
        document.querySelectorAll('.gallery-item').forEach(item => {
            item.addEventListener('click', () => {
                this.openGalleryModal(item)
            })
        })
        
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
    
    openGalleryModal(item) {
        const img = item.querySelector('img')
        const info = item.querySelector('.gallery-info')
        
        if (!img) return
        
        const modal = document.createElement('div')
        modal.className = 'modal show'
        modal.innerHTML = `
            <div class="modal-content">
                <img src="${img.src}" alt="${img.alt}" style="width: 100%; border-radius: var(--border-radius);">
                <h3 style="margin: var(--spacing-lg) 0 var(--spacing-md);">${info ? info.querySelector('h4').textContent : 'Project Gallery'}</h3>
                <p style="margin-bottom: var(--spacing-lg);">${info ? info.querySelector('p').textContent : ''}</p>
                <div style="text-align: center;">
                    <button class="btn btn-primary" onclick="this.closest('.modal').remove()">Close</button>
                    <button class="btn btn-secondary" onclick="document.getElementById('contact-form').scrollIntoView({behavior: 'smooth'}); this.closest('.modal').remove();" style="margin-left: var(--spacing-md);">Get Similar Quote</button>
                </div>
            </div>
        `
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove()
            }
        })
        
        document.body.appendChild(modal)
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
    
    async initBlogSystem() {
        try {
            // Initialize blog system
            this.blogSystem = new BlogSystem()
            await this.blogSystem.init()
            
            // Load recent posts for homepage
            this.loadRecentBlogPosts()
            
            // Handle blog page if we're on it
            this.handleBlogPage()
            
        } catch (error) {
            console.error('Error initializing blog system:', error)
        }
    }
    
    loadRecentBlogPosts() {
        const blogGrid = document.querySelector('#recent-blog .blog-grid')
        if (!blogGrid) return
        
        // Get recent posts
        const recentPosts = this.blogSystem.getRecentPosts(3)
        
        // Clear existing content
        blogGrid.innerHTML = ''
        
        // Render recent posts
        recentPosts.forEach(post => {
            blogGrid.innerHTML += this.blogSystem.renderPostCard(post)
        })
    }
    
    async handleBlogPage() {
        // Check if we're on the blog page
        if (!window.location.pathname.includes('blog.html')) return
        
        console.log('Blog page detected, loading posts...')
        
        const urlParams = new URLSearchParams(window.location.search)
        const postSlug = urlParams.get('post')
        
        const blogList = document.querySelector('.blog-list')
        if (!blogList) {
            console.error('Blog list container not found')
            return
        }
        
        // Ensure blog system is initialized
        if (!this.blogSystem || this.blogSystem.posts.length === 0) {
            console.log('Blog system not ready, waiting...')
            // Wait a bit for blog system to initialize
            setTimeout(() => this.handleBlogPage(), 100)
            return
        }
        
        if (postSlug) {
            // Show single post
            const post = this.blogSystem.getPostBySlug(postSlug)
            if (post) {
                blogList.innerHTML = this.blogSystem.renderFullPost(post)
                document.title = `${post.title} - Neff Paving Blog`
            } else {
                blogList.innerHTML = '<p>Post not found.</p>'
            }
        } else {
            // Show all posts
            const allPosts = this.blogSystem.posts
            console.log(`Rendering ${allPosts.length} posts`)
            
            if (allPosts.length === 0) {
                blogList.innerHTML = '<p>No blog posts available.</p>'
                return
            }
            
            blogList.innerHTML = ''
            
            allPosts.forEach(post => {
                const postElement = document.createElement('div')
                postElement.innerHTML = this.blogSystem.renderPostCard(post)
                blogList.appendChild(postElement.firstElementChild)
            })
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new NeffPavingApp()
})
