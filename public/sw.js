// Unified Service Worker for Andromeda
// Handles both Ultraviolet and Scramjet proxy requests

importScripts('/uv/uv.bundle.js', '/uv/uv.config.js', '/scram/scramjet.all.js');
importScripts(__uv$config.sw || '/uv/uv.sw.js');

// Initialize Ultraviolet service worker
const uv = new UVServiceWorker();

// Initialize Scramjet service worker
const { ScramjetServiceWorker } = $scramjetLoadWorker();
const sj = new ScramjetServiceWorker({
  // Enhanced configuration for better cookie and service worker support
  defaultFlags: {
    serviceworkers: true,
    captureErrors: true,
    syncxhr: true,
    scramitize: true,
    cleanErrors: false,
    strictRewrites: false,
    allowFailedIntercepts: true
  }
});

// Track if scramjet config is loaded
let sjConfigLoaded = false;
let sjConfigPromise = null;

async function ensureScramjetConfig() {
  if (sjConfigLoaded) return true;
  if (sjConfigPromise) return sjConfigPromise;
  
  sjConfigPromise = (async () => {
    try {
      await sj.loadConfig();
      sjConfigLoaded = true;
      return true;
    } catch (err) {
      console.warn('Scramjet config load failed:', err.message || err);
      sjConfigPromise = null;
      return false;
    }
  })();
  
  return sjConfigPromise;
}

// Script to inject into proxied pages to intercept new tab/window attempts
const INTERCEPTOR_SCRIPT = `
<script>
(function() {
    // Intercept window.open to prevent new tabs/windows from opening
    const originalOpen = window.open;
    window.open = function(url, target, features) {
        if (url) {
            console.log('[Proxy Interceptor] Redirecting window.open to same window:', url);
            // Navigate in the current window instead of opening a new one
            window.location.href = url;
            
            // Return a Proxy that mimics a Window object for compatibility
            return new Proxy({}, {
                get: function() { return null; },
                set: function() { return true; }
            });
        }
        return null;
    };
    
    // Remove target="_blank" from all links
    function removeTargetBlank() {
        document.querySelectorAll('a[target="_blank"], a[target="_new"]').forEach(function(anchor) {
            anchor.removeAttribute('target');
        });
    }
    
    // Run on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', removeTargetBlank);
    } else {
        removeTargetBlank();
    }
    
    // Watch for dynamically added links
    if (typeof MutationObserver !== 'undefined') {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType !== 1) return;
                    
                    if (node.tagName === 'A' && (node.getAttribute('target') === '_blank' || node.getAttribute('target') === '_new')) {
                        node.removeAttribute('target');
                    }
                    if (node.querySelectorAll) {
                        node.querySelectorAll('a[target="_blank"], a[target="_new"]').forEach(function(anchor) {
                            anchor.removeAttribute('target');
                        });
                    }
                });
            });
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });
    }
})();
</script>
`;

// Helper function to inject script into HTML responses
async function injectInterceptorScript(response) {
  const contentType = response.headers.get('content-type') || '';

  // Only inject into HTML responses
  if (!contentType.includes('text/html')) {
    return response;
  }

  try {
    const text = await response.text();

    // Check if script was already injected to prevent duplicates
    if (text.includes('[Proxy Interceptor]')) {
      return new Response(text, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      });
    }

    // Inject the script just after opening tags
    let modifiedHtml = text;
    let injected = false;

    // Try to inject after <head> tag
    if (!injected && /<head(\s[^>]*)?>/i.test(text)) {
      modifiedHtml = text.replace(/<head(\s[^>]*)?>/i, (match) => match + INTERCEPTOR_SCRIPT);
      injected = true;
    }

    // Fallback: inject after <body> tag
    if (!injected && /<body(\s[^>]*)?>/i.test(text)) {
      modifiedHtml = text.replace(/<body(\s[^>]*)?>/i, (match) => match + INTERCEPTOR_SCRIPT);
      injected = true;
    }

    // Last resort: inject after <html> tag
    if (!injected && /<html(\s[^>]*)?>/i.test(text)) {
      modifiedHtml = text.replace(/<html(\s[^>]*)?>/i, (match) => match + INTERCEPTOR_SCRIPT);
      injected = true;
    }

    return new Response(modifiedHtml, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });
  } catch (error) {
    console.error('Error injecting interceptor script:', error);
    return response;
  }
}

// Check if URL might be a proxy request (quick check before full routing)
function mightBeProxyRequest(url) {
  // Check for UV prefix
  const uvPrefix = (typeof __uv$config !== 'undefined' && __uv$config?.prefix) || '/~/uv/';
  if (url.includes(uvPrefix)) return true;
  
  // Check for Scramjet prefix patterns (the default prefix is /~/scramjet/)
  if (url.includes('/~/scramjet/') || url.includes('/$scramjet/')) return true;
  
  return false;
}

self.addEventListener('fetch', function (event) {
  const url = event.request.url;
  
  // Fast path: if URL doesn't look like a proxy request, pass through immediately
  if (!mightBeProxyRequest(url)) {
    return; // Let browser handle normally
  }
  
  event.respondWith(
    (async () => {
      try {
        // Check if this is a UV request
        const uvPrefix = (typeof __uv$config !== 'undefined' && __uv$config?.prefix) || '/~/uv/';
        const isUvRequest = url.startsWith(location.origin + uvPrefix);
        
        let response;
        
        if (isUvRequest) {
          // Handle Ultraviolet request
          response = await uv.fetch(event);
        } else {
          // Try Scramjet
          const configLoaded = await ensureScramjetConfig();
          if (configLoaded && sj.route(event)) {
            response = await sj.fetch(event);
          } else {
            // Not a recognized proxy request
            return await fetch(event.request);
          }
        }

        // Inject interceptor script into proxied HTML responses
        response = await injectInterceptorScript(response);

        return response;
      } catch (error) {
        console.error('Service worker fetch error:', error);
        // Try regular fetch as fallback
        try {
          return await fetch(event.request);
        } catch (fetchError) {
          return new Response('Service Worker Error', {
            status: 500,
            statusText: 'Internal Service Worker Error',
            headers: { 'Content-Type': 'text/plain' }
          });
        }
      }
    })()
  );
});

// Add error handling for service worker activation
self.addEventListener('activate', function (event) {
  event.waitUntil(
    (async () => {
      try {
        await self.clients.claim();
      } catch (error) {
        console.error('Service worker activation error:', error);
      }
    })()
  );
});

// Handle service worker installation
self.addEventListener('install', function (event) {
  self.skipWaiting();
});
