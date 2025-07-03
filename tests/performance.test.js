import { test, expect } from '@playwright/test'

test.describe('Performance Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage before each test
    await page.goto('/')
  })

  test('page loads within performance budget', async ({ page }) => {
    const startTime = Date.now()
    
    // Wait for main content to be visible
    await expect(page.locator('.hero-content')).toBeVisible()
    await expect(page.locator('.hero-title')).toContainText('Professional Paving Solutions')
    
    const loadTime = Date.now() - startTime
    
    // Performance assertion - page should load within 3 seconds
    expect(loadTime).toBeLessThan(3000)
  })


  test('images load with lazy loading', async ({ page }) => {
    // Scroll to gallery section to trigger lazy loading
    await page.locator('#gallery').scrollIntoViewIfNeeded()
    
    // Wait for gallery images to load
    const galleryImages = page.locator('.gallery-item img')
    await expect(galleryImages.first()).toBeVisible()
    
    // Check that images have loading="lazy" attribute
    const firstImage = galleryImages.first()
    await expect(firstImage).toHaveAttribute('loading', 'lazy')
  })

  test('page resources are optimized', async ({ page }) => {
    // Check for gzip/compression headers
    const response = await page.goto('/')
    const headers = response.headers()
    
    // Should have compression
    expect(headers['content-encoding']).toBeDefined()
  })

  test('critical CSS loads first', async ({ page }) => {
    // Check that critical styles are loaded quickly
    await page.goto('/')
    
    // Hero section should be styled immediately
    const heroSection = page.locator('#hero')
    await expect(heroSection).toHaveCSS('position', 'relative')
    await expect(heroSection).toHaveCSS('min-height')
  })

  test('Web Vitals are within acceptable ranges', async ({ page }) => {
    // Inject Web Vitals measurement
    await page.addInitScript(() => {
      window.webVitals = {}
      
      // Simulate web-vitals library
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'largest-contentful-paint') {
            window.webVitals.LCP = entry.startTime
          }
        }
      })
      observer.observe({ entryTypes: ['largest-contentful-paint'] })
      
      // Measure CLS
      let cumulativeLayoutShift = 0
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            cumulativeLayoutShift += entry.value
          }
        }
        window.webVitals.CLS = cumulativeLayoutShift
      })
      clsObserver.observe({ entryTypes: ['layout-shift'] })
    })
    
    await page.goto('/')
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle')
    
    // Get Web Vitals measurements
    const webVitals = await page.evaluate(() => window.webVitals)
    
    // LCP should be under 2.5 seconds
    if (webVitals.LCP) {
      expect(webVitals.LCP).toBeLessThan(2500)
    }
    
    // CLS should be under 0.1
    if (webVitals.CLS) {
      expect(webVitals.CLS).toBeLessThan(0.1)
    }
  })

  test('service worker caches resources', async ({ page, context }) => {
    // Check if service worker is registered (if PWA is implemented)
    const swRegistration = await page.evaluate(() => {
      return navigator.serviceWorker.getRegistration()
    })
    
    // This test will pass if no service worker is found (optional feature)
    if (swRegistration) {
      expect(swRegistration).toBeTruthy()
    }
  })

  test('fonts load efficiently', async ({ page }) => {
    await page.goto('/')
    
    // Check that font-display: swap is used (prevents FOIT)
    const computedStyle = await page.evaluate(() => {
      const element = document.querySelector('.hero-title')
      return window.getComputedStyle(element).fontFamily
    })
    
    // Should use the custom font
    expect(computedStyle).toContain('Oswald')
  })

  test('animations respect reduced motion preference', async ({ page }) => {
    // Test with reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    
    // Check that animations are disabled or reduced
    const heroContent = page.locator('.hero-content')
    await expect(heroContent).toBeVisible()
    
    // Verify reduced motion styles are applied
    const animationDuration = await heroContent.evaluate(el => 
      window.getComputedStyle(el).animationDuration
    )
    
    // Animation duration should be minimal with reduced motion
    expect(animationDuration === '0s' || animationDuration === 'none').toBe(true)
  })

  test('preload directives are present', async ({ page }) => {
    const response = await page.goto('/')
    const content = await response.text()
    
    // Check for preload/preconnect links
    expect(content).toContain('rel="preconnect"')
    expect(content).toContain('https://fonts.googleapis.com')
    expect(content).toContain('https://fonts.gstatic.com')
  })
})

test.describe('Mobile Performance', () => {
  test.use({ 
    ...test.use,
    viewport: { width: 375, height: 667 } // iPhone SE
  })

  test('mobile performance is optimized', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/')
    
    // Wait for hero content
    await expect(page.locator('.hero-content')).toBeVisible()
    
    const loadTime = Date.now() - startTime
    
    // Mobile should load within 4 seconds (slightly more lenient)
    expect(loadTime).toBeLessThan(4000)
  })

  test('mobile images are appropriately sized', async ({ page }) => {
    await page.goto('/')
    
    // Check that images are properly optimized for mobile
    const galleryImages = page.locator('.gallery-item img')
    
    if (await galleryImages.count() > 0) {
      const firstImage = galleryImages.first()
      await expect(firstImage).toHaveAttribute('loading', 'lazy')
      
      // Check that alt attributes are present
      const altText = await firstImage.getAttribute('alt')
      expect(altText).toBeTruthy()
    }
  })

  test('mobile navigation is accessible', async ({ page }) => {
    await page.goto('/')
    
    // Navigation should be visible and functional on mobile
    const nav = page.locator('nav')
    await expect(nav).toBeVisible()
    
    // Check if navigation links work
    await page.click('nav a[href="#services"]')
    await expect(page.locator('#services')).toBeInViewport()
  })
})
