import { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import SearchPage from './components/SearchPage';
import ProxyFrame, { scramjetGoBack, scramjetGoForward, scramjetReload } from './components/ProxyFrame';
import SettingsPage from './components/SettingsPage';
import AppearancePage from './components/AppearancePage';
import { ThemeProvider } from './components/ThemeContext';
import { ProxyConfig, SearchEngine } from './types/proxy';
import { loadConfig, saveConfig } from './utils/proxySwitcher';

type AppView = 'home' | 'proxy' | 'settings' | 'appearance';

const searchEngineUrls: Record<SearchEngine, string> = {
  google: 'https://www.google.com/search?q=',
  duckduckgo: 'https://duckduckgo.com/?q=',
  bing: 'https://www.bing.com/search?q=',
  yahoo: 'https://search.yahoo.com/search?p=',
  brave: 'https://search.brave.com/search?q='
};

function AppContent() {
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [proxyUrl, setProxyUrl] = useState('');
  const [pageInfo, setPageInfo] = useState<{ title: string; favicon: string } | null>(null);
  
  // Proxy configuration state - initialize from localStorage
  const [config, setConfig] = useState<ProxyConfig>(() => loadConfig());

  // Persist config changes
  useEffect(() => {
    saveConfig(config);
  }, [config]);

  // Listen for settings open event from the side menu
  useEffect(() => {
    const handleOpenSettingsEvent = () => {
      setCurrentView('settings');
    };
    const handleOpenAppearanceEvent = () => {
      setCurrentView('appearance');
    };
    window.addEventListener('openSettings', handleOpenSettingsEvent);
    window.addEventListener('openAppearance', handleOpenAppearanceEvent);
    return () => {
      window.removeEventListener('openSettings', handleOpenSettingsEvent);
      window.removeEventListener('openAppearance', handleOpenAppearanceEvent);
    };
  }, []);

  const handleSearch = useCallback((url: string) => {
    // Normalize the URL
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      // Check if it looks like a URL
      if (normalizedUrl.includes('.') && !normalizedUrl.includes(' ')) {
        normalizedUrl = 'https://' + normalizedUrl;
      } else {
        // Treat as search query - use configured search engine
        const searchUrl = searchEngineUrls[config.searchEngine] || searchEngineUrls.duckduckgo;
        normalizedUrl = searchUrl + encodeURIComponent(normalizedUrl);
      }
    }
    setProxyUrl(normalizedUrl);
    setCurrentView('proxy');
  }, [config.searchEngine]);

  const handleBack = useCallback(() => {
    // Use scramjet navigation if using scramjet proxy
    if (config.proxy === 'scramjet') {
      scramjetGoBack();
    } else {
      // Standard iframe navigation
      const iframe = document.getElementById('proxy-frame') as HTMLIFrameElement;
      if (iframe?.contentWindow) {
        iframe.contentWindow.history.back();
      }
    }
  }, [config.proxy]);

  const handleForward = useCallback(() => {
    if (config.proxy === 'scramjet') {
      scramjetGoForward();
    } else {
      const iframe = document.getElementById('proxy-frame') as HTMLIFrameElement;
      if (iframe?.contentWindow) {
        iframe.contentWindow.history.forward();
      }
    }
  }, [config.proxy]);

  const handleReload = useCallback(() => {
    if (config.proxy === 'scramjet') {
      scramjetReload();
    } else {
      const iframe = document.getElementById('proxy-frame') as HTMLIFrameElement;
      if (iframe?.contentWindow) {
        iframe.contentWindow.location.reload();
      }
    }
  }, [config.proxy]);

  const handleHome = useCallback(() => {
    setCurrentView('home');
    setProxyUrl('');
    setPageInfo(null);
  }, []);

  const handleSettingsBack = useCallback(() => {
    // Return to home or proxy view based on whether we were proxying
    if (proxyUrl) {
      setCurrentView('proxy');
    } else {
      setCurrentView('home');
    }
  }, [proxyUrl]);

  const handlePageInfoUpdate = useCallback((info: { title: string; favicon: string }) => {
    setPageInfo(info);
  }, []);

  const handleConfigChange = useCallback((newConfig: Partial<ProxyConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  // Render the Settings page without the header
  if (currentView === 'settings') {
    return (
      <div className="h-full w-full flex flex-col bg-white dark:bg-neutral-900">
        <SettingsPage
          config={config}
          onConfigChange={handleConfigChange}
          onBack={handleSettingsBack}
        />
      </div>
    );
  }

  // Render the Appearance page without the header
  if (currentView === 'appearance') {
    return (
      <div className="h-full w-full flex flex-col bg-white dark:bg-neutral-900">
        <AppearancePage onBack={handleSettingsBack} />
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-white dark:bg-neutral-900">
      <Header
        isProxying={currentView === 'proxy'}
        pageInfo={pageInfo}
        currentUrl={proxyUrl}
        onSearch={handleSearch}
        onBack={handleBack}
        onForward={handleForward}
        onReload={handleReload}
        onHome={handleHome}
      />
      
      <main className="flex-1 pt-14">
        {currentView === 'proxy' ? (
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

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
