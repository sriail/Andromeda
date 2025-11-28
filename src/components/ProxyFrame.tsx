import { useEffect, useRef, useState } from 'react';
import { ProxyConfig } from '../types/proxy';

interface ProxyFrameProps {
  url: string;
  config: ProxyConfig;
  onPageInfoUpdate: (info: { title: string; favicon: string }) => void;
  onUrlChange: (url: string) => void;
}

// Declare global types for proxy libraries
declare global {
  interface Window {
    __uv$config?: {
      prefix: string;
      encodeUrl: (url: string) => string;
      decodeUrl: (encoded: string) => string;
    };
    BareMuxConnection?: new (workerPath: string) => {
      setTransport: (path: string, args: unknown[]) => Promise<void>;
    };
  }
}

// Track service worker registration state
let serviceWorkerRegistered = false;
let serviceWorkerPromise: Promise<void> | null = null;

export default function ProxyFrame({ 
  url, 
  config, 
  onPageInfoUpdate,
}: ProxyFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [encodedUrl, setEncodedUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initProxy = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Register service worker first (if using UV)
        if (config.proxy === 'ultraviolet') {
          await registerServiceWorker();
        }
        
        // Set up the transport based on config
        await setupTransport(config);
        
        // Encode the URL based on proxy type
        const encoded = await encodeProxyUrl(url, config);
        setEncodedUrl(encoded);
      } catch (err) {
        console.error('Error initializing proxy:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize proxy');
        setIsLoading(false);
      }
    };

    if (url) {
      initProxy();
    }
  }, [url, config]);

  const handleLoad = () => {
    setIsLoading(false);
    
    // Try to get page info from iframe
    try {
      const iframe = iframeRef.current;
      if (iframe?.contentWindow) {
        const doc = iframe.contentDocument;
        if (doc) {
          const title = doc.title || url;
          const favicon = getFavicon(doc, url);
          onPageInfoUpdate({ title, favicon });
        }
      }
    } catch {
      // Cross-origin - use URL as fallback with local favicon placeholder
      try {
        const hostname = new URL(url).hostname;
        onPageInfoUpdate({ 
          title: hostname, 
          favicon: '' // Use empty favicon to avoid leaking URL to external service
        });
      } catch {
        onPageInfoUpdate({ title: 'Page', favicon: '' });
      }
    }
  };

  if (error) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4 text-center px-4">
          <div className="text-red-500 text-lg font-medium">Failed to load proxy</div>
          <p className="text-gray-500 text-sm max-w-md">{error}</p>
          <p className="text-gray-400 text-xs">Please check the server configuration and try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-600 rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Loading...</p>
          </div>
        </div>
      )}
      
      {encodedUrl && (
        <iframe
          id="proxy-frame"
          ref={iframeRef}
          src={encodedUrl}
          onLoad={handleLoad}
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
        />
      )}
    </div>
  );
}

async function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if script already loaded
    const existingScript = document.querySelector(`script[src="${src}"]`);
    if (existingScript) {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

// Load UV bundle before config (provides Ultraviolet.codec)
async function loadUVScripts(): Promise<void> {
  // Load bundle first to make Ultraviolet.codec available
  await loadScript('/uv/uv.bundle.js');
  // Then load config which uses the codec
  await loadScript('/uv/uv.config.js');
}

async function registerServiceWorker(): Promise<void> {
  // Return early if already registered or registration in progress
  if (serviceWorkerRegistered) {
    return;
  }
  
  if (serviceWorkerPromise) {
    return serviceWorkerPromise;
  }

  serviceWorkerPromise = (async () => {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service workers are not supported in this browser');
    }

    try {
      // Load UV bundle and config scripts
      await loadUVScripts();
      
      // Register the UV service worker
      const registration = await navigator.serviceWorker.register('/uv/uv.sw.js', {
        scope: '/~/uv/',
      });

      // Wait for the service worker to be ready
      await navigator.serviceWorker.ready;
      
      // Wait a bit for the SW to fully initialize
      if (registration.installing) {
        await new Promise<void>((resolve, reject) => {
          const sw = registration.installing;
          if (!sw) {
            resolve();
            return;
          }
          
          // Set a timeout to prevent indefinite waiting
          const timeout = setTimeout(() => {
            resolve(); // Resolve anyway after timeout, SW might still work
          }, 10000);
          
          sw.addEventListener('statechange', () => {
            if (sw.state === 'activated') {
              clearTimeout(timeout);
              resolve();
            } else if (sw.state === 'redundant') {
              clearTimeout(timeout);
              reject(new Error('Service worker became redundant'));
            }
          });
        });
      }

      serviceWorkerRegistered = true;
    } catch (err) {
      serviceWorkerPromise = null;
      throw new Error(`Failed to register service worker: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  })();

  return serviceWorkerPromise;
}

async function setupTransport(config: ProxyConfig): Promise<void> {
  // Load BareMux
  await loadScript('/baremux/index.js');
  
  if (!window.BareMuxConnection) {
    throw new Error('BareMux not loaded properly');
  }
  
  let connection;
  try {
    connection = new window.BareMuxConnection('/baremux/worker.js');
  } catch (err) {
    throw new Error(`Failed to create BareMux connection: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }

  if (config.server === 'wisp') {
    // Use configured wisp server or default to current host
    const defaultWispUrl = `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/wisp/`;
    const wispUrl = config.wispServer || defaultWispUrl;
    
    if (config.transport === 'epoxy') {
      await connection.setTransport('/epoxy/index.mjs', [{ wisp: wispUrl }]);
    } else {
      await connection.setTransport('/libcurl/index.mjs', [{ wisp: wispUrl }]);
    }
  } else {
    // Bare server mode - currently not supported, fall back to wisp with libcurl
    console.warn('Bare server mode is not currently supported. Falling back to Wisp with libcurl transport.');
    const defaultWispUrl = `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/wisp/`;
    await connection.setTransport('/libcurl/index.mjs', [{ wisp: defaultWispUrl }]);
  }
}

async function encodeProxyUrl(url: string, config: ProxyConfig): Promise<string> {
  // Load UV bundle and config scripts
  await loadUVScripts();
  
  if (config.proxy === 'ultraviolet') {
    if (!window.__uv$config) {
      throw new Error('Ultraviolet config not loaded');
    }
    const encoded = window.__uv$config.encodeUrl(url);
    return window.__uv$config.prefix + encoded;
  } else {
    // Scramjet - simple URL encoding
    const encoded = encodeURIComponent(url);
    return `/~/scramjet/${encoded}`;
  }
}

function getFavicon(doc: Document, fallbackUrl: string): string {
  // Try to find favicon from document
  const links = doc.querySelectorAll('link[rel*="icon"]');
  for (const link of links) {
    const href = link.getAttribute('href');
    if (href) {
      try {
        return new URL(href, fallbackUrl).href;
      } catch {
        // Invalid URL
      }
    }
  }
  
  // Fallback to Google favicon service
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(fallbackUrl)}&sz=64`;
}
