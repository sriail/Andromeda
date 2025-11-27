export type ProxyType = 'ultraviolet' | 'scramjet';
export type ServerType = 'wisp' | 'bare';
export type TransportType = 'epoxy' | 'libcurl';
export type SearchEngine = 'google' | 'duckduckgo' | 'bing' | 'yahoo' | 'brave';

export interface ProxyConfig {
  proxy: ProxyType;
  server: ServerType;
  transport: TransportType;
  searchEngine: SearchEngine;
  wispServer: string;
  adBlocking: boolean;
}

export interface ProxySettings {
  config: ProxyConfig;
  setProxy: (proxy: ProxyType) => void;
  setServer: (server: ServerType) => void;
  setTransport: (transport: TransportType) => void;
  setSearchEngine: (searchEngine: SearchEngine) => void;
  setWispServer: (wispServer: string) => void;
  setAdBlocking: (adBlocking: boolean) => void;
}
