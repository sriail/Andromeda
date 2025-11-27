export type ProxyType = 'ultraviolet' | 'scramjet';
export type ServerType = 'wisp' | 'bare';
export type TransportType = 'epoxy' | 'libcurl';

export interface ProxyConfig {
  proxy: ProxyType;
  server: ServerType;
  transport: TransportType;
}

export interface ProxySettings {
  config: ProxyConfig;
  setProxy: (proxy: ProxyType) => void;
  setServer: (server: ServerType) => void;
  setTransport: (transport: TransportType) => void;
}
