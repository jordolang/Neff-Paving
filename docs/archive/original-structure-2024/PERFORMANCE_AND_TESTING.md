# Performance Optimization and Testing Guide

## Overview

This document provides comprehensive guidance on performance optimization techniques and testing strategies for the Neff Paving system, covering frontend optimization, backend performance, database tuning, and various testing methodologies.

## Table of Contents

1. [Performance Overview](#performance-overview)
2. [Frontend Performance Optimization](#frontend-performance-optimization)
3. [Backend Performance Optimization](#backend-performance-optimization)
4. [Database Performance Tuning](#database-performance-tuning)
5. [Testing Strategies](#testing-strategies)
6. [Performance Monitoring](#performance-monitoring)
7. [Load Testing](#load-testing)
8. [Testing Automation](#testing-automation)
9. [Performance Benchmarks](#performance-benchmarks)
10. [Optimization Best Practices](#optimization-best-practices)

---

## Performance Overview

### Performance Goals

**Target Metrics:**
- Page Load Time: < 3 seconds (3G connection)
- API Response Time: < 500ms (95th percentile)
- Database Query Time: < 100ms (average)
- First Contentful Paint: < 1.5 seconds
- Time to Interactive: < 4 seconds
- Core Web Vitals Score: > 90

### Performance Stack

**Frontend:**
- Vite for fast development and optimized builds
- Tree shaking for unused code elimination
- Code splitting for optimal loading
- Image optimization and WebP conversion
- Service workers for caching

**Backend:**
- Node.js with Express for API performance
- Redis caching for frequently accessed data
- Connection pooling for database efficiency
- Gzip compression for response optimization
- CDN integration for static assets

**Database:**
- PostgreSQL with optimized queries
- Proper indexing strategies
- Query result caching
- Connection pooling
- Vacuum and analyze scheduling

---

## Frontend Performance Optimization

### Build Optimization

#### Vite Configuration

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    target: 'es2015',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router'],
          utils: ['lodash', 'axios'],
          maps: ['google-maps']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  optimizeDeps: {
    include: ['vue', 'vue-router', 'axios']
  }
});
```

#### Asset Optimization

```javascript
// Image optimization configuration
const imageOptimization = {
  webp: {
    quality: 80,
    effort: 6
  },
  jpeg: {
    quality: 85,
    progressive: true
  },
  png: {
    compressionLevel: 9,
    adaptiveFiltering: true
  }
};

// CSS optimization
const cssOptimization = {
  purgeCSS: {
    content: ['./src/**/*.{vue,js,ts,jsx,tsx,html}'],
    safelist: ['body', 'html', /^(.*-)?modal/]
  },
  cssnano: {
    preset: ['default', {
      discardComments: { removeAll: true },
      normalizeWhitespace: true
    }]
  }
};
```

### Runtime Optimization

#### Lazy Loading Implementation

```javascript
// Route-based code splitting
const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('./pages/Home.vue')
  },
  {
    path: '/admin',
    name: 'Admin',
    component: () => import('./pages/Admin.vue')
  },
  {
    path: '/services',
    name: 'Services',
    component: () => import('./pages/Services.vue')
  }
];

// Component lazy loading
const LazyComponent = defineAsyncComponent({
  loader: () => import('./components/HeavyComponent.vue'),
  loadingComponent: LoadingSpinner,
  errorComponent: ErrorComponent,
  delay: 200,
  timeout: 3000
});
```

#### Image Lazy Loading

```javascript
// Intersection Observer for image lazy loading
class ImageLazyLoader {
  constructor() {
    this.imageObserver = new IntersectionObserver(
      this.handleIntersection.bind(this),
      {
        rootMargin: '50px 0px',
        threshold: 0.01
      }
    );
  }
  
  observe(img) {
    this.imageObserver.observe(img);
  }
  
  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        this.loadImage(img);
        this.imageObserver.unobserve(img);
      }
    });
  }
  
  loadImage(img) {
    const src = img.dataset.src;
    if (src) {
      img.src = src;
      img.classList.add('loaded');
    }
  }
}

// Usage
const lazyLoader = new ImageLazyLoader();
document.querySelectorAll('img[data-src]').forEach(img => {
  lazyLoader.observe(img);
});
```

### Caching Strategies

#### Service Worker Implementation

```javascript
// sw.js - Service Worker for caching
const CACHE_NAME = 'neff-paving-v1';
const urlsToCache = [
  '/',
  '/assets/main.css',
  '/assets/main.js',
  '/images/logo.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});
```

#### Browser Caching Headers

```javascript
// Express.js caching middleware
const setCache = (req, res, next) => {
  const period = 60 * 60 * 24 * 30; // 30 days
  
  if (req.method === 'GET') {
    res.set('Cache-Control', `public, max-age=${period}`);
  }
  
  next();
};

// Asset-specific caching
app.use('/assets', setCache, express.static('public/assets'));
app.use('/images', setCache, express.static('public/images'));
```

---

## Backend Performance Optimization

### API Optimization

#### Response Compression

```javascript
const compression = require('compression');

// Enable gzip compression
app.use(compression({
  level: 6,
  threshold: 100 * 1024, // Only compress responses > 100KB
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));
```

#### Response Caching

```javascript
const redis = require('redis');
const client = redis.createClient();

// Cache middleware
const cacheMiddleware = (duration = 300) => {
  return async (req, res, next) => {
    const key = `cache:${req.originalUrl}`;
    
    try {
      const cached = await client.get(key);
      if (cached) {
        return res.json(JSON.parse(cached));
      }
      
      // Override res.json to cache the response
      const originalJson = res.json;
      res.json = function(body) {
        client.setex(key, duration, JSON.stringify(body));
        return originalJson.call(this, body);
      };
      
      next();
    } catch (error) {
      next();
    }
  };
};

// Apply caching to specific routes
app.get('/api/estimates', cacheMiddleware(600), getEstimates);
app.get('/api/admin/dashboard/stats', cacheMiddleware(300), getDashboardStats);
```

#### Database Connection Pooling

```javascript
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  max: 20, // Maximum number of clients
  min: 2,  // Minimum number of clients
  idle: 10000, // Close idle clients after 10 seconds
  connectionTimeoutMillis: 2000, // Return error after 2 seconds if connection cannot be established
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
});

// Query with connection pooling
const queryDatabase = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Query error', { text, error: error.message });
    throw error;
  }
};
```

#### Request Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

// General API rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false
});

// Strict limiting for authentication
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Limit each IP to 5 auth requests per windowMs
  skipSuccessfulRequests: true
});

app.use('/api/', generalLimiter);
app.use('/api/auth/', authLimiter);
```

---

## Database Performance Tuning

### Query Optimization

#### Efficient Query Patterns

```sql
-- Good: Use specific columns and proper indexes
SELECT id, customer_name, status, created_at 
FROM estimates 
WHERE status = 'pending' 
AND created_at > CURRENT_DATE - INTERVAL '7 days'
ORDER BY created_at DESC 
LIMIT 50;

-- Good: Use EXPLAIN ANALYZE to check query performance
EXPLAIN ANALYZE 
SELECT js.*, c.client_name 
FROM job_schedules js
JOIN contracts c ON js.contract_id = c.id
WHERE js.start_date BETWEEN '2024-07-01' AND '2024-07-31'
AND js.status = 'scheduled';

-- Good: Use partial indexes for specific queries
CREATE INDEX idx_estimates_pending_recent 
ON estimates (created_at) 
WHERE status = 'pending';
```

#### Query Performance Monitoring

```sql
-- Create view for monitoring slow queries
CREATE VIEW slow_queries AS
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    stddev_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements 
WHERE calls > 5 AND mean_time > 100
ORDER BY mean_time DESC;

-- Monitor index usage
CREATE VIEW unused_indexes AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE idx_scan = 0 
AND schemaname = 'public';
```

### Index Optimization

#### Strategic Index Creation

```sql
-- Composite indexes for common query patterns
CREATE INDEX idx_job_schedules_status_date 
ON job_schedules(status, start_date) 
WHERE status IN ('scheduled', 'confirmed');

-- Partial indexes for filtered queries
CREATE INDEX idx_estimates_pending 
ON estimates(created_at) 
WHERE status = 'pending';

-- GIN indexes for JSON searches
CREATE INDEX idx_job_schedules_crew_gin 
ON job_schedules USING GIN (crew_assigned);

-- Text search indexes
CREATE INDEX idx_customers_name_search 
ON customers USING GIN (to_tsvector('english', name));
```

#### Index Maintenance

```sql
-- Regular index maintenance function
CREATE OR REPLACE FUNCTION maintain_indexes()
RETURNS VOID AS $$
BEGIN
    -- Reindex if fragmentation is high
    REINDEX INDEX CONCURRENTLY idx_job_schedules_dates;
    REINDEX INDEX CONCURRENTLY idx_estimates_status;
    
    -- Update statistics
    ANALYZE job_schedules;
    ANALYZE estimates;
    ANALYZE contracts;
    
    RAISE NOTICE 'Index maintenance completed at %', CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;
```

### Connection and Resource Management

```sql
-- Monitor connection usage
SELECT 
    application_name,
    state,
    count(*) as connections
FROM pg_stat_activity 
GROUP BY application_name, state
ORDER BY connections DESC;

-- Monitor lock waits
SELECT 
    blocked_locks.pid AS blocked_pid,
    blocked_activity.usename AS blocked_user,
    blocking_locks.pid AS blocking_pid,
    blocking_activity.usename AS blocking_user,
    blocked_activity.query AS blocked_statement,
    blocking_activity.query AS current_statement_in_blocking_process
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;
```

---

## Testing Strategies

### Unit Testing

#### Frontend Unit Tests (Vitest)

```javascript
// tests/components/EstimateForm.test.js
import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import EstimateForm from '@/components/EstimateForm.vue';

describe('EstimateForm', () => {
  it('validates required fields', async () => {
    const wrapper = mount(EstimateForm);
    
    await wrapper.find('form').trigger('submit');
    
    expect(wrapper.find('.error-message').text()).toContain('Name is required');
  });
  
  it('submits form with valid data', async () => {
    const mockSubmit = vi.fn();
    const wrapper = mount(EstimateForm, {
      props: { onSubmit: mockSubmit }
    });
    
    await wrapper.find('input[name="customerName"]').setValue('John Doe');
    await wrapper.find('input[name="email"]').setValue('john@example.com');
    await wrapper.find('select[name="serviceType"]').setValue('residential');
    await wrapper.find('form').trigger('submit');
    
    expect(mockSubmit).toHaveBeenCalledWith({
      customerName: 'John Doe',
      email: 'john@example.com',
      serviceType: 'residential'
    });
  });
});
```

#### Backend Unit Tests (Jest)

```javascript
// tests/services/estimateService.test.js
const EstimateService = require('../src/services/estimateService');
const db = require('../src/database');

jest.mock('../src/database');

describe('EstimateService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('createEstimate', () => {
    it('creates estimate with valid data', async () => {
      const estimateData = {
        customerName: 'John Doe',
        email: 'john@example.com',
        serviceType: 'residential'
      };
      
      const mockEstimate = { id: 'est_123', ...estimateData };
      db.estimates.create.mockResolvedValue(mockEstimate);
      
      const result = await EstimateService.createEstimate(estimateData);
      
      expect(db.estimates.create).toHaveBeenCalledWith(estimateData);
      expect(result).toEqual(mockEstimate);
    });
    
    it('throws error for invalid email', async () => {
      const estimateData = {
        customerName: 'John Doe',
        email: 'invalid-email',
        serviceType: 'residential'
      };
      
      await expect(EstimateService.createEstimate(estimateData))
        .rejects.toThrow('Invalid email format');
    });
  });
});
```

### Integration Testing

#### API Integration Tests

```javascript
// tests/integration/estimates.test.js
const request = require('supertest');
const app = require('../src/app');
const db = require('../src/database');

describe('Estimates API', () => {
  beforeEach(async () => {
    await db.estimates.deleteMany({});
  });
  
  afterAll(async () => {
    await db.close();
  });
  
  describe('POST /api/estimates', () => {
    it('creates new estimate', async () => {
      const estimateData = {
        customerName: 'John Doe',
        email: 'john@example.com',
        phone: '(555) 123-4567',
        serviceType: 'residential',
        projectAddress: '123 Main St',
        description: 'Driveway paving'
      };
      
      const response = await request(app)
        .post('/api/estimates')
        .send(estimateData)
        .expect(201);
      
      expect(response.body).toMatchObject({
        id: expect.any(String),
        customerName: 'John Doe',
        status: 'pending'
      });
    });
    
    it('validates required fields', async () => {
      const response = await request(app)
        .post('/api/estimates')
        .send({})
        .expect(400);
      
      expect(response.body.error).toContain('customerName is required');
    });
  });
  
  describe('GET /api/estimates', () => {
    it('requires authentication', async () => {
      await request(app)
        .get('/api/estimates')
        .expect(401);
    });
    
    it('returns estimates for authenticated user', async () => {
      const token = await getAuthToken();
      
      const response = await request(app)
        .get('/api/estimates')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('estimates');
      expect(Array.isArray(response.body.estimates)).toBe(true);
    });
  });
});
```

### End-to-End Testing

#### Playwright E2E Tests

```javascript
// tests/e2e/estimate-flow.spec.js
const { test, expect } = require('@playwright/test');

test.describe('Estimate Request Flow', () => {
  test('user can request estimate', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to contact form
    await page.click('text=Get Free Estimate');
    
    // Fill out estimate form
    await page.fill('input[name="customerName"]', 'John Doe');
    await page.fill('input[name="email"]', 'john@example.com');
    await page.fill('input[name="phone"]', '(555) 123-4567');
    await page.selectOption('select[name="serviceType"]', 'residential');
    await page.fill('textarea[name="description"]', 'Need driveway paving');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Verify success message
    await expect(page.locator('.success-message')).toContainText('Thank you');
    await expect(page.locator('.success-message')).toContainText('2 hours');
  });
  
  test('admin can view estimates', async ({ page }) => {
    // Login as admin
    await page.goto('/admin');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Navigate to estimates
    await page.click('text=Estimates');
    
    // Verify estimates table
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('th')).toContainText('Customer Name');
  });
});
```

### Performance Testing

#### Frontend Performance Tests

```javascript
// tests/performance/page-speed.test.js
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');

describe('Page Performance', () => {
  let chrome;
  
  beforeAll(async () => {
    chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  });
  
  afterAll(async () => {
    await chrome.kill();
  });
  
  test('homepage performance score > 90', async () => {
    const options = {
      logLevel: 'info',
      output: 'json',
      onlyCategories: ['performance'],
      port: chrome.port
    };
    
    const runnerResult = await lighthouse('http://localhost:3000', options);
    const performanceScore = runnerResult.report.categories.performance.score * 100;
    
    expect(performanceScore).toBeGreaterThan(90);
  });
  
  test('core web vitals meet thresholds', async () => {
    const options = {
      logLevel: 'info',
      output: 'json',
      port: chrome.port
    };
    
    const runnerResult = await lighthouse('http://localhost:3000', options);
    const audits = runnerResult.report.audits;
    
    // First Contentful Paint < 1.5s
    expect(audits['first-contentful-paint'].numericValue).toBeLessThan(1500);
    
    // Largest Contentful Paint < 2.5s
    expect(audits['largest-contentful-paint'].numericValue).toBeLessThan(2500);
    
    // Cumulative Layout Shift < 0.1
    expect(audits['cumulative-layout-shift'].numericValue).toBeLessThan(0.1);
  });
});
```

---

## Performance Monitoring

### Application Performance Monitoring (APM)

#### Custom Performance Monitoring

```javascript
// Performance monitoring middleware
const performanceMonitor = (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const endpoint = `${req.method} ${req.route?.path || req.path}`;
    
    // Log performance metrics
    console.log({
      endpoint,
      duration,
      statusCode: res.statusCode,
      timestamp: new Date().toISOString()
    });
    
    // Alert on slow responses
    if (duration > 1000) {
      console.warn(`Slow response: ${endpoint} took ${duration}ms`);
    }
  });
  
  next();
};

app.use(performanceMonitor);
```

#### Database Performance Monitoring

```sql
-- Create performance monitoring views
CREATE VIEW query_performance_summary AS
SELECT 
    substr(query, 1, 50) as query_start,
    calls,
    total_time,
    mean_time,
    stddev_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements 
WHERE calls > 10
ORDER BY mean_time DESC
LIMIT 20;

-- Monitor connection pool health
CREATE VIEW connection_health AS
SELECT 
    'total_connections' as metric,
    count(*) as value
FROM pg_stat_activity
UNION ALL
SELECT 
    'active_connections' as metric,
    count(*) as value
FROM pg_stat_activity
WHERE state = 'active'
UNION ALL
SELECT 
    'idle_connections' as metric,
    count(*) as value
FROM pg_stat_activity
WHERE state = 'idle';
```

### Real-Time Monitoring Dashboard

```javascript
// Real-time performance metrics collection
class PerformanceCollector {
  constructor() {
    this.metrics = {
      requests: 0,
      errors: 0,
      totalResponseTime: 0,
      dbQueries: 0,
      dbResponseTime: 0
    };
    
    this.startTime = Date.now();
  }
  
  recordRequest(duration, error = false) {
    this.metrics.requests++;
    this.metrics.totalResponseTime += duration;
    
    if (error) {
      this.metrics.errors++;
    }
  }
  
  recordDbQuery(duration) {
    this.metrics.dbQueries++;
    this.metrics.dbResponseTime += duration;
  }
  
  getStats() {
    const uptime = Date.now() - this.startTime;
    const avgResponseTime = this.metrics.totalResponseTime / this.metrics.requests || 0;
    const avgDbTime = this.metrics.dbResponseTime / this.metrics.dbQueries || 0;
    const errorRate = (this.metrics.errors / this.metrics.requests * 100) || 0;
    
    return {
      uptime,
      requests: this.metrics.requests,
      avgResponseTime: Math.round(avgResponseTime),
      avgDbTime: Math.round(avgDbTime),
      errorRate: Math.round(errorRate * 100) / 100,
      requestsPerSecond: Math.round(this.metrics.requests / (uptime / 1000) * 100) / 100
    };
  }
}

const performanceCollector = new PerformanceCollector();

// Endpoint to expose metrics
app.get('/api/metrics', (req, res) => {
  res.json(performanceCollector.getStats());
});
```

---

## Load Testing

### Artillery Load Testing

```yaml
# artillery-config.yml
config:
  target: 'http://localhost:8001'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Ramp up load"
    - duration: 300
      arrivalRate: 100
      name: "Sustained load"
  payload:
    - path: "./test-data.csv"
      fields:
        - customerName
        - email
        - serviceType

scenarios:
  - name: "API Load Test"
    weight: 70
    flow:
      - get:
          url: "/api/health"
      - post:
          url: "/api/estimates"
          json:
            customerName: "{{ customerName }}"
            email: "{{ email }}"
            serviceType: "{{ serviceType }}"
            projectAddress: "123 Test St"
            description: "Load test estimate"
      - get:
          url: "/api/admin/dashboard/stats"
          headers:
            Authorization: "Bearer {{ authToken }}"
  
  - name: "Frontend Load Test"
    weight: 30
    flow:
      - get:
          url: "/"
      - get:
          url: "/services"
      - get:
          url: "/admin"
```

### K6 Load Testing

```javascript
// load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

export let errorRate = new Rate('errors');

export let options = {
  stages: [
    { duration: '2m', target: 20 }, // Ramp up
    { duration: '5m', target: 20 }, // Stay at 20 users
    { duration: '2m', target: 50 }, // Ramp up to 50 users
    { duration: '5m', target: 50 }, // Stay at 50 users
    { duration: '2m', target: 0 },  // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    errors: ['rate<0.05'], // Error rate must be below 5%
  },
};

export default function () {
  // Test homepage
  let response = http.get('http://localhost:8001/');
  check(response, {
    'homepage status is 200': (r) => r.status === 200,
    'homepage loads in < 2s': (r) => r.timings.duration < 2000,
  }) || errorRate.add(1);
  
  sleep(1);
  
  // Test API health endpoint
  response = http.get('http://localhost:8001/api/health');
  check(response, {
    'health check status is 200': (r) => r.status === 200,
    'health check responds in < 100ms': (r) => r.timings.duration < 100,
  }) || errorRate.add(1);
  
  sleep(1);
  
  // Test estimate creation
  const estimateData = {
    customerName: 'Load Test User',
    email: 'test@example.com',
    serviceType: 'residential',
    projectAddress: '123 Test St',
    description: 'Load test estimate'
  };
  
  response = http.post('http://localhost:8001/api/estimates', JSON.stringify(estimateData), {
    headers: { 'Content-Type': 'application/json' },
  });
  
  check(response, {
    'estimate creation status is 201': (r) => r.status === 201,
    'estimate creation responds in < 500ms': (r) => r.timings.duration < 500,
  }) || errorRate.add(1);
  
  sleep(2);
}
```

---

## Testing Automation

### GitHub Actions CI/CD Pipeline

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: password
          POSTGRES_DB: neff_paving_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run database migrations
        run: npm run migrate:test
        env:
          DATABASE_URL: postgresql://postgres:password@localhost:5432/neff_paving_test
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:password@localhost:5432/neff_paving_test

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Build application
        run: npm run build
      
      - name: Start application
        run: npm start &
        
      - name: Wait for application
        run: npx wait-on http://localhost:8001
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/

  performance-tests:
    runs-on: ubuntu-latest
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
      
      - name: Start application
        run: npm start &
        
      - name: Wait for application
        run: npx wait-on http://localhost:8001
      
      - name: Run Lighthouse CI
        run: npx lhci autorun
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
      
      - name: Run load tests
        run: npm run test:load
```

### Test Data Management

```javascript
// tests/helpers/testData.js
const { faker } = require('@faker-js/faker');

class TestDataFactory {
  static createEstimate(overrides = {}) {
    return {
      customerName: faker.person.fullName(),
      email: faker.internet.email(),
      phone: faker.phone.number(),
      serviceType: faker.helpers.arrayElement(['residential', 'commercial', 'maintenance']),
      projectAddress: faker.location.streetAddress(),
      projectSize: faker.number.int({ min: 100, max: 10000 }),
      timeline: faker.helpers.arrayElement(['1-2 weeks', '2-4 weeks', '1-2 months']),
      description: faker.lorem.paragraph(),
      ...overrides
    };
  }
  
  static createContract(overrides = {}) {
    return {
      clientName: faker.person.fullName(),
      clientEmail: faker.internet.email(),
      clientPhone: faker.phone.number(),
      serviceType: faker.helpers.arrayElement(['residential', 'commercial', 'maintenance']),
      projectAddress: faker.location.streetAddress(),
      projectSize: faker.number.float({ min: 100, max: 10000, fractionDigits: 2 }),
      estimatedCost: faker.number.float({ min: 1000, max: 50000, fractionDigits: 2 }),
      status: 'pending',
      ...overrides
    };
  }
  
  static createJobSchedule(contractId, overrides = {}) {
    const startDate = faker.date.future();
    const endDate = new Date(startDate.getTime() + (8 * 60 * 60 * 1000)); // 8 hours later
    
    return {
      contractId,
      calendlyEventUri: `https://api.calendly.com/scheduled_events/${faker.string.uuid()}`,
      startDate,
      endDate,
      status: 'scheduled',
      crewAssigned: faker.helpers.arrayElements(['John Smith', 'Mike Johnson', 'Dave Wilson'], 2),
      equipmentNeeded: faker.helpers.arrayElements(['Paver', 'Roller', 'Truck'], 2),
      locationAddress: faker.location.streetAddress(),
      estimatedDurationHours: faker.number.float({ min: 4, max: 12, fractionDigits: 1 }),
      weatherDependent: faker.datatype.boolean(),
      priorityLevel: faker.number.int({ min: 1, max: 5 }),
      ...overrides
    };
  }
}

module.exports = TestDataFactory;
```

---

## Performance Benchmarks

### Baseline Performance Metrics

#### Frontend Benchmarks

```javascript
// Performance budget configuration
const performanceBudget = {
  // Core Web Vitals
  firstContentfulPaint: 1500, // ms
  largestContentfulPaint: 2500, // ms
  cumulativeLayoutShift: 0.1,
  firstInputDelay: 100, // ms
  
  // Bundle sizes
  jsBundle: 500 * 1024, // 500KB
  cssBundle: 200 * 1024, // 200KB
  totalAssets: 2 * 1024 * 1024, // 2MB
  
  // Lighthouse scores
  performanceScore: 90,
  accessibilityScore: 95,
  bestPracticesScore: 90,
  seoScore: 90
};

// Performance monitoring test
describe('Performance Budget', () => {
  test('bundle sizes within budget', async () => {
    const stats = await getBundleStats();
    
    expect(stats.jsSize).toBeLessThan(performanceBudget.jsBundle);
    expect(stats.cssSize).toBeLessThan(performanceBudget.cssBundle);
    expect(stats.totalSize).toBeLessThan(performanceBudget.totalAssets);
  });
});
```

#### Backend Benchmarks

```javascript
// API performance benchmarks
const apiPerformanceBudget = {
  healthCheck: 50, // ms
  authentication: 200, // ms
  estimateCreation: 300, // ms
  estimateRetrieval: 500, // ms
  dashboardStats: 800, // ms
  complexQuery: 1000 // ms
};

describe('API Performance', () => {
  test('endpoints meet performance budget', async () => {
    const results = await runPerformanceTests();
    
    Object.entries(apiPerformanceBudget).forEach(([endpoint, budget]) => {
      expect(results[endpoint].averageTime).toBeLessThan(budget);
    });
  });
});
```

### Database Performance Standards

```sql
-- Performance standards verification
SELECT 
    'query_performance' as check_type,
    CASE 
        WHEN avg(mean_time) < 100 THEN 'PASS'
        ELSE 'FAIL'
    END as status,
    avg(mean_time) as avg_query_time_ms
FROM pg_stat_statements
WHERE calls > 10

UNION ALL

SELECT 
    'index_efficiency' as check_type,
    CASE 
        WHEN avg(100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0)) > 95 THEN 'PASS'
        ELSE 'FAIL'
    END as status,
    avg(100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0)) as cache_hit_ratio
FROM pg_stat_statements

UNION ALL

SELECT 
    'connection_efficiency' as check_type,
    CASE 
        WHEN count(*) < 50 THEN 'PASS'
        ELSE 'FAIL'
    END as status,
    count(*) as active_connections
FROM pg_stat_activity
WHERE state = 'active';
```

---

## Optimization Best Practices

### Frontend Optimization Checklist

- [ ] **Bundle Optimization**
  - [ ] Enable tree shaking for unused code elimination
  - [ ] Implement code splitting for route-based loading
  - [ ] Use dynamic imports for large components
  - [ ] Minimize and compress JavaScript and CSS

- [ ] **Asset Optimization**
  - [ ] Optimize images (WebP, compression, lazy loading)
  - [ ] Use appropriate image sizes for different viewports
  - [ ] Implement resource hints (preload, prefetch)
  - [ ] Enable browser caching with proper headers

- [ ] **Performance Monitoring**
  - [ ] Implement Core Web Vitals tracking
  - [ ] Set up performance budgets
  - [ ] Monitor bundle size changes
  - [ ] Track user experience metrics

### Backend Optimization Checklist

- [ ] **API Performance**
  - [ ] Implement response caching where appropriate
  - [ ] Use gzip compression for responses
  - [ ] Optimize database queries and add proper indexes
  - [ ] Implement rate limiting to prevent abuse

- [ ] **Database Optimization**
  - [ ] Use connection pooling
  - [ ] Optimize query performance with EXPLAIN ANALYZE
  - [ ] Implement proper indexing strategy
  - [ ] Regular database maintenance (VACUUM, ANALYZE)

- [ ] **Security and Reliability**
  - [ ] Implement proper error handling
  - [ ] Use HTTPS for all communications
  - [ ] Validate and sanitize all inputs
  - [ ] Implement comprehensive logging

### Testing Best Practices

- [ ] **Test Coverage**
  - [ ] Maintain > 80% code coverage
  - [ ] Test critical user journeys
  - [ ] Include edge cases and error scenarios
  - [ ] Implement performance regression tests

- [ ] **Test Automation**
  - [ ] Run tests on every commit
  - [ ] Include performance tests in CI/CD
  - [ ] Automate security scans
  - [ ] Monitor test execution time

- [ ] **Quality Assurance**
  - [ ] Cross-browser testing
  - [ ] Mobile responsiveness testing
  - [ ] Accessibility compliance testing
  - [ ] Load testing for expected traffic

---

## Support and Resources

### Performance Support

- **Performance Issues**: performance@neffpaving.com
- **Database Optimization**: db-admin@neffpaving.com
- **Frontend Performance**: frontend-team@neffpaving.com

### Testing Support

- **Test Infrastructure**: qa-team@neffpaving.com
- **CI/CD Pipeline**: devops@neffpaving.com
- **Load Testing**: performance@neffpaving.com

### External Resources

- [Web.dev Performance Guidelines](https://web.dev/performance/)
- [PostgreSQL Performance Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Node.js Performance Best Practices](https://nodejs.org/en/docs/guides/simple-profiling/)

---

*Last Updated: 2024-07-15*  
*Version: 2.0*  
*Next Review: 2024-10-15*
