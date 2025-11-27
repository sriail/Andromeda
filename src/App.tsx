import { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import SearchPage from './components/SearchPage';
import ProxyFrame from './components/ProxyFrame';
import { ProxyConfig } from './types/proxy';
import { loadConfig, saveConfig } from './utils/proxySwitcher';

export default function App() {
  const [isProxying, setIsProxying] = useState(false);
  const [proxyUrl, setProxyUrl] = useState('');
  const [pageInfo, setPageInfo] = useState<{ title: string; favicon: string } | null>(null);
  
  // Proxy configuration state - initialize from localStorage
  const [config, setConfig] = useState<ProxyConfig>(() => loadConfig());

  // Persist config changes
  useEffect(() => {
    saveConfig(config);
  }, [config]);

  const handleSearch = useCallback((url: string) => {
    // Normalize the URL
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      // Check if it looks like a URL
      if (normalizedUrl.includes('.') && !normalizedUrl.includes(' ')) {
        normalizedUrl = 'https://' + normalizedUrl;
      } else {
        // Treat as search query
        normalizedUrl = 'https://www.google.com/search?q=' + encodeURIComponent(normalizedUrl);
      }
    }
    setProxyUrl(normalizedUrl);
    setIsProxying(true);
  }, []);

  const handleBack = useCallback(() => {
    // Will be handled by iframe navigation
    const iframe = document.getElementById('proxy-frame') as HTMLIFrameElement;
    if (iframe?.contentWindow) {
      iframe.contentWindow.history.back();
    }
  }, []);

  const handleForward = useCallback(() => {
    const iframe = document.getElementById('proxy-frame') as HTMLIFrameElement;
    if (iframe?.contentWindow) {
      iframe.contentWindow.history.forward();
    }
  }, []);

  const handleReload = useCallback(() => {
    const iframe = document.getElementById('proxy-frame') as HTMLIFrameElement;
    if (iframe?.contentWindow) {
      iframe.contentWindow.location.reload();
    }
  }, []);

  const handleHome = useCallback(() => {
    setIsProxying(false);
    setProxyUrl('');
    setPageInfo(null);
  }, []);

  const handlePageInfoUpdate = useCallback((info: { title: string; favicon: string }) => {
    setPageInfo(info);
  }, []);

  const handleConfigChange = useCallback((newConfig: Partial<ProxyConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  return (
    <div className="h-full w-full flex flex-col bg-white">
      <Header
        isProxying={isProxying}
        pageInfo={pageInfo}
        currentUrl={proxyUrl}
        onSearch={handleSearch}
        onBack={handleBack}
        onForward={handleForward}
        onReload={handleReload}
        onHome={handleHome}
        config={config}
        onConfigChange={handleConfigChange}
      />
      
      <main className="flex-1 pt-14">
        {isProxying ? (
          <ProxyFrame
            url={proxyUrl}
            config={config}
            onPageInfoUpdate={handlePageInfoUpdate}
            onUrlChange={setProxyUrl}
          />
        ) : (
          <SearchPage onSearch={handleSearch} />
        )}
      </main>
    </div>
  );
}
