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

  interface BareServerOptions {
    logErrors?: boolean;
    localAddress?: string;
    maintainer?: { email?: string; website?: string };
  }

  export function createBareServer(directory: string, options?: BareServerOptions): BareServer;
}
