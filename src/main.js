// Import CSS
import '../styles/main.css'

// Import animation libraries
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import AOS from 'aos'
import 'aos/dist/aos.css'

// Import video player
import Plyr from 'plyr'
import 'plyr/dist/plyr.css'

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger)

// Initialize the application
class NeffPavingApp {
    constructor() {
        this.init()
    }

    init() {
        this.initAnimations()
        this.initVideoPlayer()
        this.initScrollEffects()
        this.initNavigation()
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

    initVideoPlayer() {
        // Initialize Plyr video player
        const videoContainer = document.getElementById('video-player')
        
        if (videoContainer) {
            // Create video element
            const video = document.createElement('video')
            video.setAttribute('controls', '')
            video.setAttribute('playsinline', '')
            video.setAttribute('poster', '/assets/images/video-poster.jpg')
            
            // Add video sources (placeholder for now)
            const source = document.createElement('source')
            source.src = '/assets/videos/hero-video.mp4'
            source.type = 'video/mp4'
            video.appendChild(source)
            
            videoContainer.appendChild(video)
            
            // Initialize Plyr
            const player = new Plyr(video, {
                controls: [
                    'play-large',
                    'play',
                    'progress',
                    'current-time',
                    'mute',
                    'volume',
                    'fullscreen'
                ],
                autoplay: false,
                muted: true,
                loop: { active: true }
            })

            // Store player reference
            this.videoPlayer = player
        }
    }

    initScrollEffects() {
        // Parallax effect for hero section
        gsap.to('.hero-video', {
            yPercent: -50,
            ease: 'none',
            scrollTrigger: {
                trigger: '.hero-video',
                start: 'top bottom',
                end: 'bottom top',
                scrub: true
            }
        })

        // Fade in services section
        gsap.from('.services-grid', {
            opacity: 0,
            y: 100,
            duration: 1,
            scrollTrigger: {
                trigger: '.services-grid',
                start: 'top 80%',
                toggleActions: 'play none none reverse'
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
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new NeffPavingApp()
})
