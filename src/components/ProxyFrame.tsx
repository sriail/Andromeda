import { useEffect, useRef, useState } from 'react';
import { ProxyConfig } from '../types/proxy';
import { getDefaultWispServer, getDefaultBareServer } from '../utils/proxySwitcher';

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
      getTransport: () => Promise<string | undefined>;
    };
    BareMux?: {
      BareMuxConnection: new (workerPath: string) => {
        setTransport: (path: string, args: unknown[]) => Promise<void>;
        getTransport: () => Promise<string | undefined>;
      };
    };
    $scramjetLoadController?: () => {
      ScramjetController: new (config: ScramjetControllerConfig) => ScramjetController;
    };
  }
}

interface ScramjetControllerConfig {
  files: {
    wasm: string;
    all: string;
    sync: string;
  };
}

interface ScramjetController {
  init: () => void;
  createFrame: () => { frame: HTMLIFrameElement; go: (url: string) => void };
  encodeUrl: (url: string) => string;
}

// Track service worker registration state
let uvServiceWorkerRegistered = false;
let uvServiceWorkerPromise: Promise<void> | null = null;
let scramjetServiceWorkerRegistered = false;
let scramjetServiceWorkerPromise: Promise<void> | null = null;
let scramjetController: ScramjetController | null = null;

export default function ProxyFrame({ 
  url, 
  config, 
  onPageInfoUpdate,
}: ProxyFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const scramjetFrameRef = useRef<HTMLIFrameElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [encodedUrl, setEncodedUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [useScramjetFrame, setUseScramjetFrame] = useState(false);

  useEffect(() => {
    const initProxy = async () => {
      setIsLoading(true);
      setError(null);
      setUseScramjetFrame(false);
      
      try {
        // Set up the transport based on config
        await setupTransport(config);
        
        if (config.proxy === 'scramjet') {
          // Initialize Scramjet
          await registerScramjetServiceWorker();
          await initScramjetController();
          
          if (scramjetController) {
            // Create and use scramjet frame
            setUseScramjetFrame(true);
            setEncodedUrl(''); // Clear regular iframe URL
            
            // Create scramjet frame after render
            setTimeout(() => {
              if (scramjetController) {
                const frame = scramjetController.createFrame();
                frame.frame.id = 'proxy-frame';
                frame.frame.className = 'w-full h-full border-0';
                
                // Remove any existing scramjet frames
                const existingFrame = document.getElementById('scramjet-container');
                if (existingFrame) {
                  existingFrame.innerHTML = '';
                  existingFrame.appendChild(frame.frame);
                }
                
                scramjetFrameRef.current = frame.frame;
                frame.go(url);
                setIsLoading(false);
              }
            }, 100);
          }
        } else {
          // Register UV service worker
          await registerUVServiceWorker();
          
          // Encode the URL for Ultraviolet
          const encoded = await encodeProxyUrl(url, config);
          setEncodedUrl(encoded);
        }
      } catch (err) {
        console.error('Error initializing proxy:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize proxy');
        setIsLoading(false);
      }
    };

    if (url) {
      initProxy();
    }
    
    // Cleanup scramjet frame on unmount
    return () => {
      if (scramjetFrameRef.current) {
        scramjetFrameRef.current.remove();
        scramjetFrameRef.current = null;
      }
    };
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
      
      {useScramjetFrame ? (
        <div id="scramjet-container" className="w-full h-full" />
      ) : (
        encodedUrl && (
          <iframe
            id="proxy-frame"
            ref={iframeRef}
            src={encodedUrl}
            onLoad={handleLoad}
            className="w-full h-full border-0"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
          />
        )
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

// Load Scramjet scripts
async function loadScramjetScripts(): Promise<void> {
  await loadScript('/scram/scramjet.bundle.js');
}

async function registerUVServiceWorker(): Promise<void> {
  // Return early if already registered or registration in progress
  if (uvServiceWorkerRegistered) {
    return;
  }
  
  if (uvServiceWorkerPromise) {
    return uvServiceWorkerPromise;
  }

  uvServiceWorkerPromise = (async () => {
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

      uvServiceWorkerRegistered = true;
    } catch (err) {
      uvServiceWorkerPromise = null;
      throw new Error(`Failed to register UV service worker: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  })();

  return uvServiceWorkerPromise;
}

async function registerScramjetServiceWorker(): Promise<void> {
  // Return early if already registered or registration in progress
  if (scramjetServiceWorkerRegistered) {
    return;
  }
  
  if (scramjetServiceWorkerPromise) {
    return scramjetServiceWorkerPromise;
  }

  scramjetServiceWorkerPromise = (async () => {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service workers are not supported in this browser');
    }

    try {
      // Load Scramjet scripts
      await loadScramjetScripts();
      
      // Register the Scramjet service worker
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
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
              reject(new Error('Scramjet service worker became redundant'));
            }
          });
        });
      }

      scramjetServiceWorkerRegistered = true;
    } catch (err) {
      scramjetServiceWorkerPromise = null;
      throw new Error(`Failed to register Scramjet service worker: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  })();

  return scramjetServiceWorkerPromise;
}

async function initScramjetController(): Promise<void> {
  if (scramjetController) {
    return;
  }
  
  await loadScramjetScripts();
  
  if (!window.$scramjetLoadController) {
    throw new Error('Scramjet controller loader not available');
  }
  
  const { ScramjetController } = window.$scramjetLoadController();
  
  scramjetController = new ScramjetController({
    files: {
      wasm: '/scram/scramjet.wasm.wasm',
      all: '/scram/scramjet.all.js',
      sync: '/scram/scramjet.sync.js',
    },
  });
  
  scramjetController.init();
}

async function setupTransport(config: ProxyConfig): Promise<void> {
  // Load BareMux
  await loadScript('/baremux/index.js');
  
  const BareMuxConnection = window.BareMuxConnection || window.BareMux?.BareMuxConnection;
  
  if (!BareMuxConnection) {
    throw new Error('BareMux not loaded properly');
  }
  
  let connection;
  try {
    connection = new BareMuxConnection('/baremux/worker.js');
  } catch (err) {
    throw new Error(`Failed to create BareMux connection: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }

  // Set transport based on server mode
  if (config.server === 'bare') {
    // Use bare transport for direct bare server connection
    const bareUrl = config.bareServer || getDefaultBareServer();
    await connection.setTransport('/baremod/index.mjs', [bareUrl]);
  } else {
    // Use wisp-based transports
    const wispUrl = config.wispServer || getDefaultWispServer();
    
    if (config.transport === 'epoxy') {
      await connection.setTransport('/epoxy/index.mjs', [{ wisp: wispUrl }]);
    } else {
      // Default to libcurl
      await connection.setTransport('/libcurl/index.mjs', [{ wisp: wispUrl }]);
    }
  }
}

async function encodeProxyUrl(url: string, config: ProxyConfig): Promise<string> {
  if (config.proxy === 'scramjet') {
    // Scramjet handles URL encoding internally via its controller
    // This shouldn't be called for scramjet, but provide a fallback
    if (scramjetController) {
      return scramjetController.encodeUrl(url);
    }
    throw new Error('Scramjet controller not initialized');
  } else {
    // Load UV bundle and config scripts
    await loadUVScripts();
    
    if (!window.__uv$config) {
      throw new Error('Ultraviolet config not loaded');
    }
    const encoded = window.__uv$config.encodeUrl(url);
    return window.__uv$config.prefix + encoded;
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
