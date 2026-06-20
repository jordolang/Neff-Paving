module.exports = {
  ci: {
    collect: {
      // URLs to audit - using localhost for local development
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/estimate-form.html'
      ],
      // Number of runs per URL to get more stable results
      numberOfRuns: 3,
      // Settings for Lighthouse runs
      settings: {
        // Mobile device emulation (default)
        formFactor: 'mobile',
        screenEmulation: {
          mobile: true,
          width: 375,
          height: 667,
          deviceScaleFactor: 2,
          disabled: false
        },
        // Throttling settings (simulates 4G mobile connection)
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          requestLatencyMs: 0,
          downloadThroughputKbps: 10240,
          uploadThroughputKbps: 5120,
          cpuSlowdownMultiplier: 4
        },
        // Only run performance audits (faster)
        onlyCategories: ['performance']
      }
    },
    assert: {
      // Preset for most assertions
      preset: 'lighthouse:no-pwa',
      assertions: {
        // Core Web Vitals targets
        'categories:performance': ['error', { minScore: 0.9 }], // 90+ performance score

        // Largest Contentful Paint - good threshold is 2.5s
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],

        // Cumulative Layout Shift - good threshold is 0.1
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],

        // Total Blocking Time (proxy for INP) - good threshold is 200ms
        'total-blocking-time': ['error', { maxNumericValue: 200 }],

        // First Contentful Paint - good threshold is 1.8s
        'first-contentful-paint': ['error', { maxNumericValue: 1800 }],

        // Speed Index - good threshold is 3.4s
        'speed-index': ['error', { maxNumericValue: 3400 }],

        // Interactive - good threshold is 3.8s
        'interactive': ['error', { maxNumericValue: 3800 }],

        // Additional performance best practices
        'uses-responsive-images': ['warn', { maxLength: 0 }],
        'modern-image-formats': ['warn', { maxLength: 0 }],
        'offscreen-images': ['warn', { maxLength: 0 }],
        'uses-optimized-images': ['warn', { maxLength: 0 }],
        'uses-text-compression': ['warn', { maxLength: 0 }],
        'efficient-animated-content': ['warn', { maxLength: 0 }],
        'unused-css-rules': 'off', // Can be noisy with AOS/animations
        'unused-javascript': 'off', // Can be noisy with third-party scripts

        // Resource hints
        'uses-rel-preconnect': 'off', // Optional optimization
        'uses-rel-preload': 'off', // We're using preload selectively

        // Critical request chains
        'critical-request-chains': 'off', // Informational only

        // No excessive DOM size
        'dom-size': ['warn', { maxNumericValue: 1500 }],

        // No render-blocking resources (or minimal)
        'render-blocking-resources': ['warn', { maxNumericValue: 100 }]
      }
    },
    upload: {
      // Don't upload results to a server by default
      // Can be configured later to use Lighthouse CI server or GitHub Actions
      target: 'temporary-public-storage'
    }
  }
};
