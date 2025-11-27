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
