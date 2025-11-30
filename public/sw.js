// Scramjet Service Worker
// This service worker handles requests for the Scramjet proxy

importScripts('/scram/scramjet.all.js');

let scramjet = null;
let initPromise = null;

// Initialize scramjet lazily to avoid blocking
async function initScramjet() {
  if (scramjet) return;
  if (initPromise) return initPromise;
  
  initPromise = (async () => {
    try {
      const { ScramjetServiceWorker } = $scramjetLoadWorker();
      scramjet = new ScramjetServiceWorker();
      // Pre-load config once during initialization
      await scramjet.loadConfig();
    } catch (error) {
      console.error('Failed to initialize Scramjet:', error);
      throw error;
    }
  })();
  
  return initPromise;
}

async function handleRequest(event) {
  try {
    // Ensure scramjet is initialized
    await initScramjet();
    
    if (scramjet && scramjet.route(event)) {
      return await scramjet.fetch(event);
    }
  } catch (error) {
    console.error('Scramjet error:', error);
  }
  
  // Fallback to regular fetch
  return fetch(event.request);
}

self.addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event));
});

// Pre-initialize on service worker activation
self.addEventListener('activate', (event) => {
  event.waitUntil(initScramjet());
});

// Handle service worker installation
self.addEventListener('install', () => {
  // Skip waiting to activate immediately
  self.skipWaiting();
});
