import { useState, useEffect } from 'react';
import { ArrowLeft, Save, RotateCcw } from 'lucide-react';
import { ProxyConfig, ProxyType, ServerType, TransportType, SearchEngine } from '../types/proxy';
import { getDefaultWispServer, getDefaultBareServer } from '../utils/proxySwitcher';

interface SettingsPageProps {
  config: ProxyConfig;
  onConfigChange: (config: Partial<ProxyConfig>) => void;
  onBack: () => void;
}

interface DropdownProps {
  id: string;
  value: string;
  options: { name: string; value: string }[];
  onChange: (value: string) => void;
}

function Dropdown({ id, value, options, onChange }: DropdownProps) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.name}
        </option>
      ))}
    </select>
  );
}

interface InputProps {
  id: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}

function Input({ id, value, placeholder, onChange }: InputProps) {
  return (
    <input
      id={id}
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
    />
  );
}

interface ButtonProps {
  id: string;
  text: string;
  icon: 'save' | 'reset';
  onClick: () => void;
}

function Button({ id, text, icon, onClick }: ButtonProps) {
  return (
    <button
      id={id}
      onClick={onClick}
      className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
    >
      {icon === 'save' ? <Save className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}
      {text}
    </button>
  );
}

const SearchEngineOptions = [
  { name: 'DuckDuckGo', value: 'duckduckgo' },
  { name: 'Google', value: 'google' },
  { name: 'Bing', value: 'bing' },
  { name: 'Yahoo', value: 'yahoo' },
  { name: 'Brave', value: 'brave' },
];

const ProxyTypeOptions = [
  { name: 'Ultraviolet', value: 'ultraviolet' },
  { name: 'Scramjet (Experimental)', value: 'scramjet' },
];

const ServerTypeOptions = [
  { name: 'Wisp Server', value: 'wisp' },
  { name: 'Bare Server', value: 'bare' },
];

const TransportOptions = [
  { name: 'Libcurl', value: 'libcurl' },
  { name: 'Epoxy', value: 'epoxy' },
];

export default function SettingsPage({ 
  config, 
  onConfigChange, 
  onBack 
}: SettingsPageProps) {
  const [wispServerInput, setWispServerInput] = useState(config.wispServer || getDefaultWispServer());
  const [bareServerInput, setBareServerInput] = useState(config.bareServer || getDefaultBareServer());
  const [serverStatus, setServerStatus] = useState<{ message: string; type: 'info' | 'success' | 'error' } | null>(null);

  useEffect(() => {
    // Update inputs when config changes
    setWispServerInput(config.wispServer || getDefaultWispServer());
    setBareServerInput(config.bareServer || getDefaultBareServer());
  }, [config.wispServer, config.bareServer]);

  const handleServerSave = () => {
    if (config.server === 'wisp') {
      const server = wispServerInput;
      
      if (!server.match(/^wss?:\/\/.*/)) {
        setServerStatus({
          message: "Invalid URL! Wisp URLs MUST start with wss:// or ws://",
          type: 'error'
        });
      } else {
        setServerStatus({
          message: 'Wisp Server Set!',
          type: 'success'
        });
        onConfigChange({ wispServer: wispServerInput });
        
        // Check if we should show ad blocking (only for default server)
        const defaultServer = getDefaultWispServer();
        if (wispServerInput === defaultServer) {
          onConfigChange({ adBlocking: true });
        }
      }
    } else {
      const server = bareServerInput;
      
      if (!server.match(/^https?:\/\/.*/)) {
        setServerStatus({
          message: "Invalid URL! Bare server URLs MUST start with https:// or http://",
          type: 'error'
        });
      } else {
        setServerStatus({
          message: 'Bare Server Set!',
          type: 'success'
        });
        onConfigChange({ bareServer: bareServerInput });
      }
    }
    
    // Clear status after 4 seconds
    setTimeout(() => setServerStatus(null), 4000);
  };

  const handleServerReset = () => {
    if (config.server === 'wisp') {
      const resetVal = getDefaultWispServer();
      setWispServerInput(resetVal);
      onConfigChange({ wispServer: resetVal, adBlocking: true });
      setServerStatus({
        message: 'Wisp Server Reset!',
        type: 'success'
      });
    } else {
      const resetVal = getDefaultBareServer();
      setBareServerInput(resetVal);
      onConfigChange({ bareServer: resetVal });
      setServerStatus({
        message: 'Bare Server Reset!',
        type: 'success'
      });
    }
    setTimeout(() => setServerStatus(null), 4000);
  };

  const isDefaultWispServer = wispServerInput === getDefaultWispServer();
  const isDefaultBareServer = bareServerInput === getDefaultBareServer();

  // Handle server type change - reset transport when switching to bare
  const handleServerTypeChange = (value: string) => {
    const serverType = value as ServerType;
    onConfigChange({ server: serverType });
    
    // When switching to bare server, set transport to bare
    if (serverType === 'bare') {
      onConfigChange({ transport: 'bare' as TransportType });
    } else if (config.transport === 'bare') {
      // When switching from bare to wisp, reset transport to libcurl
      onConfigChange({ transport: 'libcurl' });
    }
  };

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
          <h1 className="text-xl font-medium text-gray-900">Proxy Settings</h1>
        </div>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="w-full flex-grow space-y-4">
              {/* Proxy Type */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Proxy Type</p>
                <Dropdown
                  id="pSwitcher"
                  value={config.proxy}
                  options={ProxyTypeOptions}
                  onChange={(value) => onConfigChange({ proxy: value as ProxyType })}
                />
                {config.proxy === 'scramjet' && (
                  <p className="mt-1 text-xs text-amber-600">
                    Scramjet is experimental and may not work with all websites.
                  </p>
                )}
              </div>

              {/* Routing Mode / Server Type */}
              <div className="mt-2">
                <p className="text-sm font-medium text-gray-700 mb-2">Routing Mode</p>
                <Dropdown
                  id="rSwitcher"
                  value={config.server}
                  options={ServerTypeOptions}
                  onChange={handleServerTypeChange}
                />
              </div>

              {/* Transport - only show when using Wisp */}
              {config.server === 'wisp' && (
                <div className="mt-2" id="transportSection">
                  <p className="text-sm font-medium text-gray-700 mb-2">Transport</p>
                  <Dropdown
                    id="tSwitcher"
                    value={config.transport}
                    options={TransportOptions}
                    onChange={(value) => onConfigChange({ transport: value as TransportType })}
                  />
                </div>
              )}

              {/* Search Engine */}
              <div className="mt-2">
                <p className="text-sm font-medium text-gray-700 mb-2">Search Engine</p>
                <Dropdown
                  id="sSwitcher"
                  value={config.searchEngine}
                  options={SearchEngineOptions}
                  onChange={(value) => onConfigChange({ searchEngine: value as SearchEngine })}
                />
              </div>

              {/* Wisp Server Section - only show when using Wisp */}
              {config.server === 'wisp' && (
                <div className="mt-2 w-80" id="wispServerSection">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Wisp Server</p>
                    <Input
                      id="wispServerSwitcher"
                      value={wispServerInput}
                      placeholder="Wisp server URL (e.g., wss://example.com/wisp/)"
                      onChange={setWispServerInput}
                    />
                    
                    {/* Ad Blocking - only show for default server */}
                    {isDefaultWispServer && (
                      <div className="mt-2" id="adBlocking">
                        <p className="text-sm font-medium text-gray-700 mb-2">Ad Blocking</p>
                        <Dropdown
                          id="adBlockingDropdown"
                          value={config.adBlocking ? 'enabled' : 'disabled'}
                          options={[
                            { name: 'Enabled', value: 'enabled' },
                            { name: 'Disabled', value: 'disabled' }
                          ]}
                          onChange={(value) => onConfigChange({ adBlocking: value === 'enabled' })}
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Server Status */}
                  {serverStatus && (
                    <div className="mt-2 mb-2" id="serverInfo">
                      <p className={`text-sm ${
                        serverStatus.type === 'error' ? 'text-red-500' : 
                        serverStatus.type === 'success' ? 'text-green-500' : 
                        'text-blue-500'
                      }`} id="serverInfo-inner">
                        {serverStatus.message}
                      </p>
                    </div>
                  )}
                  
                  {/* Save and Reset buttons */}
                  <div className="mt-2 flex flex-row gap-4">
                    <Button
                      id="serverSave"
                      text="Save Changes"
                      icon="save"
                      onClick={handleServerSave}
                    />
                    <Button
                      id="serverReset"
                      text="Reset"
                      icon="reset"
                      onClick={handleServerReset}
                    />
                  </div>
                </div>
              )}

              {/* Bare Server Section - only show when using Bare */}
              {config.server === 'bare' && (
                <div className="mt-2 w-80" id="bareServerSection">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Bare Server</p>
                    <Input
                      id="bareServerSwitcher"
                      value={bareServerInput}
                      placeholder="Bare server URL (e.g., https://example.com/bare/)"
                      onChange={setBareServerInput}
                    />
                  </div>
                  
                  {/* Server Status */}
                  {serverStatus && (
                    <div className="mt-2 mb-2" id="serverInfo">
                      <p className={`text-sm ${
                        serverStatus.type === 'error' ? 'text-red-500' : 
                        serverStatus.type === 'success' ? 'text-green-500' : 
                        'text-blue-500'
                      }`} id="serverInfo-inner">
                        {serverStatus.message}
                      </p>
                    </div>
                  )}
                  
                  {/* Save and Reset buttons */}
                  <div className="mt-2 flex flex-row gap-4">
                    <Button
                      id="serverSave"
                      text="Save Changes"
                      icon="save"
                      onClick={handleServerSave}
                    />
                    <Button
                      id="serverReset"
                      text="Reset"
                      icon="reset"
                      onClick={handleServerReset}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
