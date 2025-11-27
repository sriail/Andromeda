import { ProxyConfig, ProxyType, ServerType, TransportType } from '../types/proxy';

const STORAGE_KEY = 'andromeda_proxy_config';

// Default configuration
const defaultConfig: ProxyConfig = {
  proxy: 'ultraviolet',
  server: 'wisp',
  transport: 'epoxy'
};

/**
 * Load proxy configuration from localStorage
 */
export function loadConfig(): ProxyConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        proxy: isValidProxy(parsed.proxy) ? parsed.proxy : defaultConfig.proxy,
        server: isValidServer(parsed.server) ? parsed.server : defaultConfig.server,
        transport: isValidTransport(parsed.transport) ? parsed.transport : defaultConfig.transport
      };
    }
  } catch {
    // Ignore parse errors
  }
  return { ...defaultConfig };
}

/**
 * Save proxy configuration to localStorage
 */
export function saveConfig(config: ProxyConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Update a single configuration value
 */
export function updateConfig(key: keyof ProxyConfig, value: string): ProxyConfig {
  const config = loadConfig();
  
  switch (key) {
    case 'proxy':
      if (isValidProxy(value)) {
        config.proxy = value;
      }
      break;
    case 'server':
      if (isValidServer(value)) {
        config.server = value;
      }
      break;
    case 'transport':
      if (isValidTransport(value)) {
        config.transport = value;
      }
      break;
  }
  
  saveConfig(config);
  return config;
}

/**
 * Reset configuration to defaults
 */
export function resetConfig(): ProxyConfig {
  saveConfig(defaultConfig);
  return { ...defaultConfig };
}

/**
 * Get the proxy prefix based on current configuration
 */
export function getProxyPrefix(config: ProxyConfig): string {
  if (config.proxy === 'ultraviolet') {
    return '/~/uv/';
  } else {
    return '/~/scramjet/';
  }
}

/**
 * Get the wisp URL based on current location
 */
export function getWispUrl(): string {
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${location.host}/wisp/`;
}

/**
 * Get the bare server URL
 */
export function getBareUrl(): string {
  return `${location.origin}/bare/`;
}

// Type guards
function isValidProxy(value: unknown): value is ProxyType {
  return value === 'ultraviolet' || value === 'scramjet';
}

function isValidServer(value: unknown): value is ServerType {
  return value === 'wisp' || value === 'bare';
}

function isValidTransport(value: unknown): value is TransportType {
  return value === 'epoxy' || value === 'libcurl';
}

// Export types for convenience
export type { ProxyConfig, ProxyType, ServerType, TransportType };
