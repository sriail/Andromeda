import { useState } from 'react';
import { Menu, X, Home, Settings, ArrowLeft, ArrowRight, RotateCw } from 'lucide-react';
import SearchBar from './SearchBar';

interface HeaderProps {
  isProxying: boolean;
  pageInfo: { title: string; favicon: string } | null;
  currentUrl: string;
  onSearch: (url: string) => void;
  onBack: () => void;
  onForward: () => void;
  onReload: () => void;
  onHome: () => void;
  onOpenSettings: () => void;
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
  onOpenSettings
}: HeaderProps) {
  const [navOpen, setNavOpen] = useState(false);

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
          
          {/* Settings button */}
          <button
            onClick={onOpenSettings}
            className="h-10 w-10 rounded-lg hover:bg-gray-100 inline-flex items-center justify-center transition-colors"
            title="Settings"
          >
            <Settings className="h-5 w-5" />
          </button>
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
              onClick={() => {
                onOpenSettings();
                setNavOpen(false);
              }}
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
