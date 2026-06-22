/**
 * Comprehensive Asset Loading Test Script
 * Tests all website assets for proper loading and accessibility
 */

class AssetLoadingTester {
    constructor() {
        this.baseUrl = window.location.origin;
        this.results = {
            passed: 0,
            failed: 0,
            warnings: 0,
            details: []
        };
        this.timeout = 5000; // 5 second timeout for each asset
    }

    async testAllAssets() {
        console.log('🚀 Starting comprehensive asset loading test...');
        
        // Test categories
        await this.testImages();
        await this.testVideos();
        await this.testFonts();
        await this.testCSS();
        await this.testJavaScript();
        await this.testGalleryImages();
        await this.testLazyLoading();
        
        this.generateReport();
    }

    async testImages() {
        console.log('🖼️ Testing UI images...');
        
        const imageSelectors = [
            'img[src]',
            'img[data-src]',
            '.testimonial-author img',
            '.team-member img',
            '.service-icon img'
        ];

        for (const selector of imageSelectors) {
            const images = document.querySelectorAll(selector);
            for (const img of images) {
                await this.testImage(img);
            }
        }
    }

    async testImage(img) {
        const src = img.src || img.dataset.src;
        if (!src || src.startsWith('data:')) return;

        return new Promise((resolve) => {
            const testImg = new Image();
            const timeout = setTimeout(() => {
                this.addResult('failed', `Image failed to load: ${src}`, 'images');
                resolve();
            }, this.timeout);

            testImg.onload = () => {
                clearTimeout(timeout);
                this.addResult('passed', `Image loaded successfully: ${src}`, 'images');
                resolve();
            };

            testImg.onerror = () => {
                clearTimeout(timeout);
                this.addResult('failed', `Image failed to load: ${src}`, 'images');
                resolve();
            };

            testImg.src = src;
        });
    }

    async testVideos() {
        console.log('🎥 Testing videos...');
        
        const videos = document.querySelectorAll('video');
        for (const video of videos) {
            await this.testVideo(video);
        }
    }

    async testVideo(video) {
        const sources = video.querySelectorAll('source');
        
        if (sources.length === 0 && video.src) {
            await this.testVideoSource(video.src);
        } else {
            for (const source of sources) {
                if (source.src) {
                    await this.testVideoSource(source.src);
                }
            }
        }
    }

    async testVideoSource(src) {
        return new Promise((resolve) => {
            const testVideo = document.createElement('video');
            const timeout = setTimeout(() => {
                this.addResult('failed', `Video failed to load: ${src}`, 'videos');
                resolve();
            }, this.timeout);

            testVideo.onloadeddata = () => {
                clearTimeout(timeout);
                this.addResult('passed', `Video loaded successfully: ${src}`, 'videos');
                resolve();
            };

            testVideo.onerror = () => {
                clearTimeout(timeout);
                this.addResult('failed', `Video failed to load: ${src}`, 'videos');
                resolve();
            };

            testVideo.src = src;
        });
    }

    async testFonts() {
        console.log('🔤 Testing fonts...');
        
        const fontUrls = [
            'https://fonts.googleapis.com/css2?family=Oswald:wght@300;400;500;600;700&display=swap',
            'https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap'
        ];

        for (const fontUrl of fontUrls) {
            await this.testExternalResource(fontUrl, 'fonts');
        }

        // Test if fonts are actually applied
        const testElement = document.createElement('div');
        testElement.style.fontFamily = 'Oswald, sans-serif';
        testElement.textContent = 'Test';
        document.body.appendChild(testElement);
        
        const computedStyle = window.getComputedStyle(testElement);
        const actualFont = computedStyle.fontFamily;
        
        if (actualFont.includes('Oswald')) {
            this.addResult('passed', 'Oswald font is properly loaded and applied', 'fonts');
        } else {
            this.addResult('warning', 'Oswald font may not be loaded, using fallback', 'fonts');
        }
        
        document.body.removeChild(testElement);
    }

    async testCSS() {
        console.log('🎨 Testing CSS files...');
        
        const cssLinks = document.querySelectorAll('link[rel="stylesheet"]');
        for (const link of cssLinks) {
            if (!link.href) continue;
            // Compare the parsed host exactly — a substring check like
            // includes('fonts.googleapis.com') can be bypassed (e.g. fonts.googleapis.com.evil.example).
            let host = '';
            try { host = new URL(link.href).hostname; } catch (e) { host = ''; }
            if (host !== 'fonts.googleapis.com') {
                await this.testExternalResource(link.href, 'css');
            }
        }
    }

    async testJavaScript() {
        console.log('📜 Testing JavaScript files...');
        
        const scripts = document.querySelectorAll('script[src]');
        for (const script of scripts) {
            if (script.src) {
                await this.testExternalResource(script.src, 'javascript');
            }
        }
    }

    async testGalleryImages() {
        console.log('🏗️ Testing gallery images...');
        
        // Test gallery image structure
        const galleryCategories = ['commercial', 'residential', 'concrete', 'equipment'];
        const testImages = [
            'advance-auto-parking-lot.webp',
            'custom-mansion-driveway.webp',
            'concrete-pad.webp',
            'leeboy-dropping-tar.webp'
        ];

        for (let i = 0; i < galleryCategories.length; i++) {
            const category = galleryCategories[i];
            const testImage = testImages[i];
            const imagePath = `${this.baseUrl}/assets/gallery/${category}/${testImage}`;
            
            await this.testExternalResource(imagePath, 'gallery');
        }
    }

    async testLazyLoading() {
        console.log('⏳ Testing lazy loading functionality...');
        
        // Check if lazy loading is properly implemented
        const lazyImages = document.querySelectorAll('img[loading="lazy"], img.lazy-load');
        
        if (lazyImages.length > 0) {
            this.addResult('passed', `Found ${lazyImages.length} images with lazy loading`, 'lazy-loading');
            
            // Test intersection observer
            if ('IntersectionObserver' in window) {
                this.addResult('passed', 'IntersectionObserver API is supported', 'lazy-loading');
            } else {
                this.addResult('warning', 'IntersectionObserver API not supported, lazy loading may not work', 'lazy-loading');
            }
        } else {
            this.addResult('warning', 'No lazy loading images found', 'lazy-loading');
        }
    }

    async testExternalResource(url, category) {
        return new Promise((resolve) => {
            const timeout = setTimeout(() => {
                this.addResult('failed', `Resource failed to load: ${url}`, category);
                resolve();
            }, this.timeout);

            fetch(url, { method: 'HEAD' })
                .then(response => {
                    clearTimeout(timeout);
                    if (response.ok) {
                        this.addResult('passed', `Resource loaded successfully: ${url}`, category);
                    } else {
                        this.addResult('failed', `Resource returned ${response.status}: ${url}`, category);
                    }
                    resolve();
                })
                .catch(error => {
                    clearTimeout(timeout);
                    this.addResult('failed', `Resource failed to load: ${url} (${error.message})`, category);
                    resolve();
                });
        });
    }

    addResult(status, message, category) {
        this.results[status === 'passed' ? 'passed' : status === 'warning' ? 'warnings' : 'failed']++;
        this.results.details.push({
            status,
            message,
            category,
            timestamp: new Date().toISOString()
        });
        
        const emoji = status === 'passed' ? '✅' : status === 'warning' ? '⚠️' : '❌';
        console.log(`${emoji} [${category.toUpperCase()}] ${message}`);
    }

    generateReport() {
        console.log('\n📊 ASSET LOADING TEST REPORT');
        console.log('================================');
        console.log(`✅ Passed: ${this.results.passed}`);
        console.log(`⚠️ Warnings: ${this.results.warnings}`);
        console.log(`❌ Failed: ${this.results.failed}`);
        console.log(`📈 Success Rate: ${Math.round((this.results.passed / (this.results.passed + this.results.failed + this.results.warnings)) * 100)}%`);
        
        // Group by category
        const categories = {};
        this.results.details.forEach(detail => {
            if (!categories[detail.category]) {
                categories[detail.category] = { passed: 0, warnings: 0, failed: 0 };
            }
            categories[detail.category][detail.status === 'passed' ? 'passed' : detail.status === 'warning' ? 'warnings' : 'failed']++;
        });

        console.log('\n📋 BY CATEGORY:');
        Object.entries(categories).forEach(([category, stats]) => {
            console.log(`${category.toUpperCase()}: ✅${stats.passed} ⚠️${stats.warnings} ❌${stats.failed}`);
        });

        // Show failures
        const failures = this.results.details.filter(d => d.status === 'failed');
        if (failures.length > 0) {
            console.log('\n❌ FAILURES:');
            failures.forEach(failure => {
                console.log(`- ${failure.message}`);
            });
        }

        // Show warnings
        const warnings = this.results.details.filter(d => d.status === 'warning');
        if (warnings.length > 0) {
            console.log('\n⚠️ WARNINGS:');
            warnings.forEach(warning => {
                console.log(`- ${warning.message}`);
            });
        }

        // Browser console output
        if (failures.length === 0) {
            console.log('\n🎉 All critical assets loaded successfully!');
        } else {
            console.log('\n⚠️ Some assets failed to load. Check the details above.');
        }

        return this.results;
    }
}

// Auto-run test when script is loaded
if (typeof window !== 'undefined') {
    // Wait for page to load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                const tester = new AssetLoadingTester();
                tester.testAllAssets();
            }, 1000);
        });
    } else {
        setTimeout(() => {
            const tester = new AssetLoadingTester();
            tester.testAllAssets();
        }, 1000);
    }
}

// Export for manual testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AssetLoadingTester;
}
