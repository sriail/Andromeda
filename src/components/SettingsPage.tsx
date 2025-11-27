import { ArrowLeft } from 'lucide-react';
import { ProxyConfig } from '../types/proxy';

interface SettingsPageProps {
  config: ProxyConfig;
  onConfigChange: (config: Partial<ProxyConfig>) => void;
  onBack: () => void;
}

export default function SettingsPage({ 
  config, 
  onConfigChange, 
  onBack 
}: SettingsPageProps) {
  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Settings Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="h-10 w-10 rounded-lg hover:bg-gray-100 inline-flex items-center justify-center transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-700" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Settings</h1>
        </div>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Proxy Configuration Section */}
          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Proxy Configuration</h2>
            
            {/* Proxy Engine */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Proxy Engine</label>
              <p className="text-sm text-gray-500 mb-3">
                Choose the proxy engine to use for browsing.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => onConfigChange({ proxy: 'ultraviolet' })}
                  className={`flex-1 py-3 px-4 text-sm rounded-lg border-2 transition-all ${
                    config.proxy === 'ultraviolet'
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">Ultraviolet</div>
                  <div className={`text-xs mt-1 ${config.proxy === 'ultraviolet' ? 'text-gray-300' : 'text-gray-400'}`}>
                    Recommended for most sites
                  </div>
                </button>
                <button
                  onClick={() => onConfigChange({ proxy: 'scramjet' })}
                  className={`flex-1 py-3 px-4 text-sm rounded-lg border-2 transition-all ${
                    config.proxy === 'scramjet'
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">Scramjet</div>
                  <div className={`text-xs mt-1 ${config.proxy === 'scramjet' ? 'text-gray-300' : 'text-gray-400'}`}>
                    Alternative proxy engine
                  </div>
                </button>
              </div>
            </div>

            {/* Server Type */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">Server Protocol</label>
              <p className="text-sm text-gray-500 mb-3">
                Select the server protocol for the proxy connection.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => onConfigChange({ server: 'wisp' })}
                  className={`flex-1 py-3 px-4 text-sm rounded-lg border-2 transition-all ${
                    config.server === 'wisp'
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">Wisp</div>
                  <div className={`text-xs mt-1 ${config.server === 'wisp' ? 'text-gray-300' : 'text-gray-400'}`}>
                    WebSocket-based protocol
                  </div>
                </button>
                <button
                  onClick={() => onConfigChange({ server: 'bare' })}
                  className={`flex-1 py-3 px-4 text-sm rounded-lg border-2 transition-all ${
                    config.server === 'bare'
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">Bare</div>
                  <div className={`text-xs mt-1 ${config.server === 'bare' ? 'text-gray-300' : 'text-gray-400'}`}>
                    HTTP-based protocol
                  </div>
                </button>
              </div>
            </div>

            {/* Transport (only for Wisp) */}
            {config.server === 'wisp' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Transport Layer</label>
                <p className="text-sm text-gray-500 mb-3">
                  Choose the transport layer for the Wisp connection.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => onConfigChange({ transport: 'epoxy' })}
                    className={`flex-1 py-3 px-4 text-sm rounded-lg border-2 transition-all ${
                      config.transport === 'epoxy'
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium">Epoxy</div>
                    <div className={`text-xs mt-1 ${config.transport === 'epoxy' ? 'text-gray-300' : 'text-gray-400'}`}>
                      Default transport
                    </div>
                  </button>
                  <button
                    onClick={() => onConfigChange({ transport: 'libcurl' })}
                    className={`flex-1 py-3 px-4 text-sm rounded-lg border-2 transition-all ${
                      config.transport === 'libcurl'
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium">Libcurl</div>
                    <div className={`text-xs mt-1 ${config.transport === 'libcurl' ? 'text-gray-300' : 'text-gray-400'}`}>
                      Alternative transport
                    </div>
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* About Section */}
          <section className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">About</h2>
            <div className="flex items-center gap-4">
              <img 
                src="/images/andromeda_logo.png" 
                alt="Andromeda" 
                className="w-12 h-12"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <div>
                <h3 className="font-medium text-gray-900">Andromeda</h3>
                <p className="text-sm text-gray-500">A simple, fast web proxy</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
