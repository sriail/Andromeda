declare module '@mercuryworkshop/wisp-js/server' {
  import { IncomingMessage } from 'http';
  import { Duplex } from 'stream';

  export const server: {
    routeRequest(req: IncomingMessage, socket: Duplex, head: Buffer): void;
    ServerStream: unknown;
    ServerConnection: unknown;
    parse_real_ip: unknown;
    options: unknown;
  };
  
  export const packet: unknown;
  export const logging: unknown;
  export const extensions: unknown;
}

declare module '@tomphttp/bare-server-node' {
  import { IncomingMessage, ServerResponse } from 'http';
  import { Duplex } from 'stream';

  interface BareServer {
    shouldRoute(request: IncomingMessage): boolean;
    routeRequest(request: IncomingMessage, response: ServerResponse): void;
    routeUpgrade(request: IncomingMessage, socket: Duplex, head: Buffer): void;
    close(): void;
  }

  interface ConnectionLimiterOptions {
    /** Maximum number of keep-alive connections per IP address. @default 10 */
    maxConnectionsPerIP?: number;
    /** Duration in seconds for the rate limit cooldown time window. @default 60 */
    windowDuration?: number;
    /** Block duration in seconds during rate limit cooldown. @default 60 */
    blockDuration?: number;
  }

  interface BareServerOptions {
    logErrors?: boolean;
    localAddress?: string;
    maintainer?: { email?: string; website?: string };
    /** If local IP addresses/DNS records should be blocked. @default true */
    blockLocal?: boolean;
    /** If legacy clients should be supported (v1 & v2). @default true */
    legacySupport?: boolean;
    /** Connection limiting options to prevent resource exhaustion attacks. */
    connectionLimiter?: ConnectionLimiterOptions;
  }

  export function createBareServer(directory: string, options?: BareServerOptions): BareServer;
}
