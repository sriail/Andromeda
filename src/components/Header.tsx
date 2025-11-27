import { useState, useRef, useEffect } from 'react';
import { Menu, X, Home, Settings, ArrowLeft, ArrowRight, RotateCw, ChevronDown } from 'lucide-react';
import SearchBar from './SearchBar';
import { ProxyConfig, ProxyType, ServerType, TransportType } from '../types/proxy';

interface HeaderProps {
  isProxying: boolean;
  pageInfo: { title: string; favicon: string } | null;
  currentUrl: string;
  onSearch: (url: string) => void;
  onBack: () => void;
  onForward: () => void;
  onReload: () => void;
  onHome: () => void;
  config: ProxyConfig;
  onConfigChange: (config: Partial<ProxyConfig>) => void;
}

export default function Header({
  isProxying,
  pageInfo,
  currentUrl,
  onSearch,
  onBack,
  onForward,
  onReload,
  onHome,
  config,
  onConfigChange
}: HeaderProps) {
  const [navOpen, setNavOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const configRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (configRef.current && !configRef.current.contains(event.target as Node)) {
        setConfigOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      {/* Header Bar */}
      <header className="h-14 fixed top-0 left-0 right-0 bg-white border-b border-gray-200 px-4 z-50 flex items-center font-inter">
        {/* Left section */}
        <div className="flex items-center gap-3 w-64">
          <button
            onClick={() => setNavOpen(true)}
            className="cursor-pointer inline-flex items-center justify-center rounded-lg text-sm font-medium h-10 w-10 hover:bg-gray-100 transition-colors"
          >
            <Menu className="text-gray-700 h-6 w-6" />
          </button>
          
          {isProxying && pageInfo ? (
            <div className="flex items-center gap-2">
              {pageInfo.favicon && (
                <img 
                  src={pageInfo.favicon} 
                  alt="" 
                  className="w-6 h-6 rounded"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
              <span className="text-sm font-medium text-gray-700 truncate max-w-[140px]">
                {pageInfo.title || 'Loading...'}
              </span>
            </div>
          ) : (
            <button onClick={onHome} className="flex items-center gap-2">
              <img src="/images/andromeda_logo.png" alt="Andromeda" className="w-8 h-8" />
              <h1 className="text-xl font-bold text-gray-900">Andromeda</h1>
            </button>
          )}
        </div>

        {/* Center section - Search */}
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-2xl">
            <SearchBar 
              value={currentUrl} 
              onSearch={onSearch} 
              compact={true}
            />
          </div>
        </div>

        {/* Right section - Navigation controls */}
        <div className="flex items-center gap-1 text-gray-700 w-64 justify-end">
          {isProxying && (
            <>
              <button
                onClick={onBack}
                className="h-10 w-10 rounded-lg hover:bg-gray-100 inline-flex items-center justify-center transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <button
                onClick={onForward}
                className="h-10 w-10 rounded-lg hover:bg-gray-100 inline-flex items-center justify-center transition-colors"
              >
                <ArrowRight className="h-5 w-5" />
              </button>
              <button
                onClick={onReload}
                className="h-10 w-10 rounded-lg hover:bg-gray-100 inline-flex items-center justify-center transition-colors"
              >
                <RotateCw className="h-5 w-5" />
              </button>
            </>
          )}
          
          {/* Config dropdown */}
          <div className="relative" ref={configRef}>
            <button
              onClick={() => setConfigOpen(!configOpen)}
              className="h-10 px-3 rounded-lg hover:bg-gray-100 inline-flex items-center gap-1 transition-colors text-sm font-medium"
            >
              <span className="hidden sm:inline">{config.proxy}</span>
              <ChevronDown className="h-4 w-4" />
            </button>
            
            {configOpen && (
              <div className="absolute right-0 top-12 w-64 bg-white border border-gray-200 rounded-lg shadow-lg p-4 space-y-4">
                {/* Proxy Type */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">Proxy Engine</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onConfigChange({ proxy: 'ultraviolet' })}
                      className={`flex-1 py-2 px-3 text-sm rounded-lg border transition-colors ${
                        config.proxy === 'ultraviolet'
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      Ultraviolet
                    </button>
                    <button
                      onClick={() => onConfigChange({ proxy: 'scramjet' })}
                      className={`flex-1 py-2 px-3 text-sm rounded-lg border transition-colors ${
                        config.proxy === 'scramjet'
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      Scramjet
                    </button>
                  </div>
                </div>

                {/* Server Type */}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-2">Server</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onConfigChange({ server: 'wisp' })}
                      className={`flex-1 py-2 px-3 text-sm rounded-lg border transition-colors ${
                        config.server === 'wisp'
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      Wisp
                    </button>
                    <button
                      onClick={() => onConfigChange({ server: 'bare' })}
                      className={`flex-1 py-2 px-3 text-sm rounded-lg border transition-colors ${
                        config.server === 'bare'
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      Bare
                    </button>
                  </div>
                </div>

                {/* Transport (only for Wisp) */}
                {config.server === 'wisp' && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-2">Transport</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => onConfigChange({ transport: 'epoxy' })}
                        className={`flex-1 py-2 px-3 text-sm rounded-lg border transition-colors ${
                          config.transport === 'epoxy'
                            ? 'bg-gray-900 text-white border-gray-900'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        Epoxy
                      </button>
                      <button
                        onClick={() => onConfigChange({ transport: 'libcurl' })}
                        className={`flex-1 py-2 px-3 text-sm rounded-lg border transition-colors ${
                          config.transport === 'libcurl'
                            ? 'bg-gray-900 text-white border-gray-900'
                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        Libcurl
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Side Navigation */}
      <div
        className={`fixed inset-0 z-50 transition-opacity duration-300 ${
          navOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50"
          onClick={() => setNavOpen(false)}
        />
        
        {/* Nav Panel */}
        <div
          className={`absolute left-0 top-0 h-full w-72 bg-white border-r border-gray-200 p-6 transform transition-transform duration-300 ${
            navOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-2">
              <img src="/images/andromeda_logo.png" alt="Andromeda" className="w-10 h-10" />
            </div>
            <button
              onClick={() => setNavOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          <nav className="space-y-2">
            <button
              onClick={() => {
                onHome();
                setNavOpen(false);
              }}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Home className="h-5 w-5" />
              Home
            </button>
            <button
              onClick={() => setNavOpen(false)}
              className="flex items-center gap-3 w-full px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Settings className="h-5 w-5" />
              Settings
            </button>
          </nav>
        </div>
      </div>
    </>
  );
}
