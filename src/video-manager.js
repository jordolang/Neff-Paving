/**
 * VideoManager Class
 * Handles video playback with robust error handling and fallback mechanisms
 */
class VideoManager {
    constructor() {
        this.retryAttempts = 0
        this.maxRetries = 3
        this.fallbackPosterUrl = '/assets/images/posters/hero-poster-1920x1080.jpg'
        this.init()
    }

    init() {
        // Initialize video error handling for all videos on the page
        this.setupVideoErrorHandling()
        
        // Set up global window reference for HTML event handlers
        window.videoManager = this
    }

    setupVideoErrorHandling() {
        // Find all video elements on the page
        const videos = document.querySelectorAll('video')
        
        videos.forEach(video => {
            this.setupVideoElement(video)
        })
    }

    setupVideoElement(video) {
        // Add error event listener
        video.addEventListener('error', (e) => {
            console.error('Video error detected:', e)
            this.handleVideoError(video)
        })

        // Handle individual source errors
        const sources = video.querySelectorAll('source')
        sources.forEach(source => {
            source.addEventListener('error', (e) => {
                console.error('Video source error:', source.src, e)
                this.handleSourceError(video, source)
            })
        })

        // Set up network state monitoring
        this.monitorNetworkState(video)

        // Set up loading timeout
        this.setupLoadingTimeout(video)
    }

    handleVideoError(video) {
        console.log(`Video error occurred. Retry attempt: ${this.retryAttempts}/${this.maxRetries}`)
        
        if (this.retryAttempts >= this.maxRetries) {
            console.log('Max retries reached, showing fallback poster')
            this.showFallbackPoster(video)
            return
        }

        this.retryAttempts++
        this.reloadVideo(video)
    }

    handleSourceError(video, failedSource) {
        console.log('Source failed:', failedSource.src)
        
        // Try next source if available
        const sources = Array.from(video.querySelectorAll('source'))
        const failedIndex = sources.indexOf(failedSource)
        
        if (failedIndex < sources.length - 1) {
            console.log('Trying next video quality...')
            // Remove failed source to prevent retry
            failedSource.remove()
            video.load()
        } else {
            // All sources failed, handle as video error
            this.handleVideoError(video)
        }
    }

    reloadVideo(video) {
        console.log('Reloading video with cache-busting parameters...')
        
        // Clear browser cache for video sources
        const sources = Array.from(video.getElementsByTagName('source'))
        sources.forEach(source => {
            const url = new URL(source.src, window.location.origin)
            url.searchParams.set('retry', this.retryAttempts.toString())
            url.searchParams.set('t', Date.now().toString())
            source.src = url.toString()
        })

        // Reload the video
        video.load()
        
        // Attempt to play if autoplay was intended
        if (video.hasAttribute('autoplay')) {
            video.play().catch(error => {
                console.error('Autoplay failed after reload:', error)
                this.handlePlaybackError(video, error)
            })
        }
    }

    showFallbackPoster(video) {
        console.log('Showing fallback poster image')
        
        // Set the poster image
        video.poster = this.fallbackPosterUrl
        
        // Hide video controls since video won't play
        video.controls = false
        video.removeAttribute('autoplay')
        
        // Add a class for styling
        video.classList.add('video-error-fallback')
        
        // Create an error message overlay if needed
        this.createErrorOverlay(video)
        
        // Dispatch custom event for error handling
        const errorEvent = new CustomEvent('videoFallback', {
            detail: {
                video: video,
                retryAttempts: this.retryAttempts,
                message: 'Video failed to load after multiple attempts'
            }
        })
        video.dispatchEvent(errorEvent)
    }

    createErrorOverlay(video) {
        const container = video.parentElement
        if (!container) return

        // Check if overlay already exists
        if (container.querySelector('.video-error-overlay')) return

        const overlay = document.createElement('div')
        overlay.className = 'video-error-overlay'
        overlay.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 1rem 2rem;
            border-radius: 8px;
            text-align: center;
            z-index: 10;
            font-family: inherit;
        `
        
        overlay.innerHTML = `
            <div style="margin-bottom: 0.5rem;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style="opacity: 0.7;">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
            </div>
            <div style="font-size: 14px; opacity: 0.9;">Video temporarily unavailable</div>
            <button onclick="window.videoManager.retryVideo(this)" 
                    style="margin-top: 0.5rem; padding: 0.5rem 1rem; background: #ff6b35; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
                Retry
            </button>
        `

        // Position container relatively if needed
        if (getComputedStyle(container).position === 'static') {
            container.style.position = 'relative'
        }

        container.appendChild(overlay)
    }

    retryVideo(button) {
        const overlay = button.closest('.video-error-overlay')
        const container = overlay?.parentElement
        const video = container?.querySelector('video')
        
        if (!video) return

        // Reset retry attempts for manual retry
        this.retryAttempts = 0
        
        // Remove error overlay
        overlay?.remove()
        
        // Remove error class
        video.classList.remove('video-error-fallback')
        
        // Restore original attributes
        video.controls = true
        if (video.dataset.originalAutoplay === 'true') {
            video.setAttribute('autoplay', '')
        }
        
        // Reload video
        this.reloadVideo(video)
    }

    monitorNetworkState(video) {
        const checkNetworkState = () => {
            if (video.networkState === HTMLMediaElement.NETWORK_NO_SOURCE) {
                console.warn('Video has no usable source')
                this.handleVideoError(video)
            } else if (video.networkState === HTMLMediaElement.NETWORK_LOADING) {
                // Reset error state if loading
                video.classList.remove('video-error-fallback')
            }
        }

        video.addEventListener('loadstart', checkNetworkState)
        video.addEventListener('error', checkNetworkState)
    }

    setupLoadingTimeout(video) {
        let loadingTimeout

        video.addEventListener('loadstart', () => {
            // Clear any existing timeout
            if (loadingTimeout) {
                clearTimeout(loadingTimeout)
            }

            // Set timeout for loading
            loadingTimeout = setTimeout(() => {
                if (video.networkState === HTMLMediaElement.NETWORK_LOADING && video.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA) {
                    console.warn('Video loading timeout')
                    this.handleVideoError(video)
                }
            }, 30000) // 30 second timeout
        })

        video.addEventListener('canplay', () => {
            if (loadingTimeout) {
                clearTimeout(loadingTimeout)
                loadingTimeout = null
            }
        })

        video.addEventListener('error', () => {
            if (loadingTimeout) {
                clearTimeout(loadingTimeout)
                loadingTimeout = null
            }
        })
    }

    handlePlaybackError(video, error) {
        console.error('Video playback error:', error)
        
        // Handle specific playback errors
        if (error.name === 'NotAllowedError') {
            console.log('Autoplay blocked by browser policy')
            // Show play button overlay
            this.createPlayButtonOverlay(video)
        } else if (error.name === 'NotSupportedError') {
            console.log('Video format not supported')
            this.handleVideoError(video)
        } else {
            // Generic playback error
            this.handleVideoError(video)
        }
    }

    createPlayButtonOverlay(video) {
        const container = video.parentElement
        if (!container || container.querySelector('.video-play-overlay')) return

        const overlay = document.createElement('div')
        overlay.className = 'video-play-overlay'
        overlay.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.7);
            border-radius: 50%;
            width: 80px;
            height: 80px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 10;
            transition: background 0.3s ease;
        `

        overlay.innerHTML = `
            <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                <path d="M8 5v14l11-7z"/>
            </svg>
        `

        overlay.addEventListener('click', () => {
            video.play().then(() => {
                overlay.remove()
            }).catch(error => {
                console.error('Manual play failed:', error)
            })
        })

        overlay.addEventListener('mouseenter', () => {
            overlay.style.background = 'rgba(0, 0, 0, 0.9)'
        })

        overlay.addEventListener('mouseleave', () => {
            overlay.style.background = 'rgba(0, 0, 0, 0.7)'
        })

        // Position container relatively if needed
        if (getComputedStyle(container).position === 'static') {
            container.style.position = 'relative'
        }

        container.appendChild(overlay)
    }

    // Method to handle video quality switching
    switchVideoQuality(video, quality) {
        const currentTime = video.currentTime
        const wasPlaying = !video.paused

        // Find appropriate source
        const sources = Array.from(video.querySelectorAll('source'))
        const targetSource = sources.find(source => source.src.includes(quality))

        if (!targetSource) {
            console.warn(`Quality ${quality} not available`)
            return
        }

        // Switch to new quality
        const newVideo = video.cloneNode(false)
        newVideo.appendChild(targetSource.cloneNode())
        
        newVideo.currentTime = currentTime
        
        newVideo.addEventListener('loadeddata', () => {
            if (wasPlaying) {
                newVideo.play().catch(console.error)
            }
        })

        video.parentNode.replaceChild(newVideo, video)
        this.setupVideoElement(newVideo)
    }

    // Method to preload video with network-aware quality selection
    preloadVideo(video) {
        if (!navigator.connection) {
            return // No network API support
        }

        const connection = navigator.connection
        const effectiveType = connection.effectiveType

        let preloadQuality = '1080p'
        
        // Adjust quality based on connection
        if (effectiveType === 'slow-2g' || effectiveType === '2g') {
            preloadQuality = '480p'
        } else if (effectiveType === '3g') {
            preloadQuality = '720p'
        }

        console.log(`Preloading video with ${preloadQuality} quality based on connection: ${effectiveType}`)

        // Find and prioritize the appropriate source
        const sources = Array.from(video.querySelectorAll('source'))
        const preferredSource = sources.find(source => source.src.includes(preloadQuality))
        
        if (preferredSource) {
            // Move preferred source to the top
            video.insertBefore(preferredSource, video.firstChild)
        }
    }

    // Utility method to check video support
    static isVideoSupported() {
        const video = document.createElement('video')
        return !!(video.canPlayType && (
            video.canPlayType('video/mp4; codecs="avc1.42E01E"') ||
            video.canPlayType('video/webm; codecs="vp8, vorbis"') ||
            video.canPlayType('video/ogg; codecs="theora"')
        ))
    }

    // Method to add new video element with error handling
    addVideo(videoElement) {
        if (videoElement && videoElement.tagName === 'VIDEO') {
            this.setupVideoElement(videoElement)
        }
    }

    // Clean up method
    destroy() {
        if (window.videoManager === this) {
            window.videoManager = null
        }
    }
}

export default VideoManager
