// Service Worker for Neff Paving Website
// Implements cache versioning and different caching strategies

// Cache configuration with versioning
const CACHE_VERSION = '1.0.0';
const STATIC_CACHE_NAME = `neff-paving-static-v${CACHE_VERSION}`;
const DYNAMIC_CACHE_NAME = `neff-paving-dynamic-v${CACHE_VERSION}`;
const IMAGES_CACHE_NAME = `neff-paving-images-v${CACHE_VERSION}`;

// List of URLs to cache during install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/estimate-form.html',
  '/404.html',
  '/favicon.ico',
  '/apple-touch-icon.png'
];

// Install event: Cache static assets
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(cache => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        // Skip waiting and activate immediately
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Failed to cache static assets:', error);
      })
  );
});

// Activate event: Clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            // Delete old versions of caches
            if (cacheName.startsWith('neff-paving-') && 
                cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME &&
                cacheName !== IMAGES_CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Take control of all clients immediately
        return self.clients.claim();
      })
  );
});

// Fetch event: Implement different caching strategies
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip requests to external APIs or different origins
  if (url.origin !== location.origin) {
    return;
  }
  
  // Network-first strategy for HTML pages
  if (request.mode === 'navigate' || 
      request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirstStrategy(request, DYNAMIC_CACHE_NAME));
    return;
  }
  
  // Cache-first strategy for images
  if (request.destination === 'image' || 
      /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(url.pathname)) {
    event.respondWith(cacheFirstStrategy(request, IMAGES_CACHE_NAME));
    return;
  }
  
  // Cache-first strategy for static assets (CSS, JS, fonts)
  if (request.destination === 'style' ||
      request.destination === 'script' ||
      request.destination === 'font' ||
      /\.(css|js|woff|woff2|ttf|eot)$/i.test(url.pathname)) {
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE_NAME));
    return;
  }
  
  // Default to network-first for other requests
  event.respondWith(networkFirstStrategy(request, DYNAMIC_CACHE_NAME));
});

// Network-first caching strategy
async function networkFirstStrategy(request, cacheName) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.ok) {
      // Cache the response
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Network failed, try cache
    console.log('Network failed, trying cache:', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If it's a navigation request and no cache, return offline page
    if (request.mode === 'navigate') {
      return caches.match('/404.html');
    }
    
    throw error;
  }
}

// Cache-first caching strategy
async function cacheFirstStrategy(request, cacheName) {
  // Try cache first
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Update cache in background (stale-while-revalidate)
    updateCacheInBackground(request, cacheName);
    return cachedResponse;
  }
  
  // Cache miss, fetch from network
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.ok) {
      // Cache the response
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Failed to fetch resource:', request.url, error);
    throw error;
  }
}

// Update cache in background (for stale-while-revalidate)
async function updateCacheInBackground(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
  } catch (error) {
    // Silently fail background updates
    console.log('Background cache update failed:', request.url);
  }
}

// Handle messages from the main thread
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

