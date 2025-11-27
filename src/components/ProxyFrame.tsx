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
      // Cross-origin - use URL as fallback
      onPageInfoUpdate({ 
        title: new URL(url).hostname, 
        favicon: `https://www.google.com/s2/favicons?domain=${encodeURIComponent(url)}&sz=64` 
      });
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
    if (document.querySelector(`script[src="${src}"]`)) {
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

async function setupTransport(config: ProxyConfig): Promise<void> {
  // Load BareMux
  await loadScript('/baremux/bare.cjs');
  
  if (!window.BareMuxConnection) {
    throw new Error('BareMux not loaded properly');
  }
  
  const connection = new window.BareMuxConnection('/baremux/worker.js');

  if (config.server === 'wisp') {
    const wispUrl = `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/wisp/`;
    
    if (config.transport === 'epoxy') {
      await connection.setTransport('/epoxy/index.mjs', [{ wisp: wispUrl }]);
    } else {
      await connection.setTransport('/libcurl/index.mjs', [{ wisp: wispUrl }]);
    }
  } else {
    // Bare server - use baremod transport
    await connection.setTransport('/baremux/index.mjs', [`${location.origin}/bare/`]);
  }
}

async function encodeProxyUrl(url: string, config: ProxyConfig): Promise<string> {
  // Load UV config
  await loadScript('/uv/uv.config.js');
  
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
