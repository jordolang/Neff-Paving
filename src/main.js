// Import CSS
import '../styles/main.css'

// Import animation libraries
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import AOS from 'aos'
import 'aos/dist/aos.css'

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger)

// Simple application class
class NeffPavingApp {
    constructor() {
        this.init();
    }

    init() {
        console.log('Initializing Neff Paving App...');
        
        // Initialize hero video
        this.initHeroVideo()
        
        // Initialize animations
        this.initAnimations()
        
        // Initialize navigation
        this.initNavigation()
        
        console.log('Neff Paving app initialized successfully')
    }

    initHeroVideo() {
        const video = document.getElementById('hero-video');
        if (!video) return;

        // Add error handling
        video.addEventListener('error', (e) => {
            console.error('Video failed to load:', e);
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

    initAnimations() {
        // Initialize AOS
        AOS.init({
            duration: 1000,
            once: true,
            offset: 100
        });
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
    }
}

// DOM ready check
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
