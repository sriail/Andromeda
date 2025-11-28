import Fastify, {
  FastifyServerFactory,
  FastifyServerFactoryHandler,
  FastifyReply,
  FastifyRequest
} from 'fastify';
import fastifyStatic from '@fastify/static';
import { createServer, ServerResponse, IncomingMessage } from 'http';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { server as wisp } from '@mercuryworkshop/wisp-js/server';
import { createBareServer } from '@tomphttp/bare-server-node';
import type { Socket } from 'net';
import type { Server } from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = parseInt(process.env.PORT || '8080', 10);

// Create Bare Server with connection limiter to prevent "too many keepalive requests" error
const bareServer = createBareServer('/bare/', {
  connectionLimiter: {
    // Optimized for sites with heavy cookies and complex browser services
    maxConnectionsPerIP: parseInt(process.env.BARE_MAX_CONNECTIONS_PER_IP || '1000', 10),
    windowDuration: parseInt(process.env.BARE_WINDOW_DURATION || '60', 10),
    blockDuration: parseInt(process.env.BARE_BLOCK_DURATION || '30', 10)
  }
});

// Custom server factory for Fastify to integrate Bare server and Wisp
const serverFactory: FastifyServerFactory = (handler: FastifyServerFactoryHandler): Server => {
  const server = createServer({
    // Increase header size limit for sites with heavy cookies
    maxHeaderSize: 32768, // 32KB
    // Enable keep-alive for better connection stability
    keepAlive: true,
    keepAliveTimeout: 65000, // 65 seconds
    // Increase timeout for long-running requests
    requestTimeout: 120000 // 120 seconds
  });

  server
    .on('request', (req: IncomingMessage, res: ServerResponse) => {
      try {
        if (bareServer.shouldRoute(req)) {
          bareServer.routeRequest(req, res);
        } else {
          handler(req, res);
        }
      } catch (error) {
        console.error('Error handling request:', error);
        if (!res.headersSent) {
          res.statusCode = 500;
          res.end('Internal Server Error');
        }
      }
    })
    .on('upgrade', (req: IncomingMessage, socket: Socket, head: Buffer) => {
      try {
        if (bareServer.shouldRoute(req)) {
          bareServer.routeUpgrade(req, socket, head);
        } else if (req.url?.startsWith('/wisp')) {
          wisp.routeRequest(req, socket, head);
        } else {
          // Close connection for unhandled WebSocket paths
          socket.end();
        }
      } catch (error) {
        console.error('Error handling WebSocket upgrade:', error);
        socket.destroy();
      }
    })
    .on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use`);
        process.exit(1);
      }
      console.error('Server error:', err);
    })
    .on('clientError', (error: Error, socket: Socket) => {
      console.error('Client error:', error);
      if (!socket.destroyed) {
        socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
      }
    });

  return server;
};

// Create Fastify app with optimized settings for better performance
const app = Fastify({
  logger: process.env.LOG_LEVEL === 'debug' || process.env.NODE_ENV === 'development',
  serverFactory: serverFactory,
  // Increase body size limits for sites with heavy data
  bodyLimit: 10485760, // 10MB
  // Improve connection handling
  connectionTimeout: 120000, // 120 seconds
  keepAliveTimeout: 65000, // 65 seconds
  // Enable trust proxy for proper IP handling behind reverse proxies
  trustProxy: true,
  // Router options for better URL handling
  routerOptions: {
    ignoreDuplicateSlashes: true,
    ignoreTrailingSlash: true
  }
});

// Helper to set common headers for static files
const setStaticHeaders = (reply: FastifyReply, path: string, options?: { serviceWorker?: boolean; crossOrigin?: boolean }) => {
  if (path.endsWith('.js') || path.endsWith('.cjs') || path.endsWith('.mjs')) {
    reply.header('Content-Type', 'application/javascript');
  } else if (path.endsWith('.wasm')) {
    reply.header('Content-Type', 'application/wasm');
  }
  if (options?.serviceWorker) {
    reply.header('Service-Worker-Allowed', '/');
  }
  if (options?.crossOrigin) {
    reply.header('Cross-Origin-Opener-Policy', 'same-origin');
    reply.header('Cross-Origin-Embedder-Policy', 'require-corp');
  }
};

// Register static file serving for UV bundle files
await app.register(fastifyStatic, {
  root: join(__dirname, '../public/uv'),
  prefix: '/uv/',
  decorateReply: false,
  setHeaders: (res, path) => {
    const reply = res as unknown as FastifyReply;
    if (typeof reply.header === 'function') {
      setStaticHeaders(reply, path, { serviceWorker: true });
    }
  }
});

// Register static file serving for Scramjet files
await app.register(fastifyStatic, {
  root: join(__dirname, '../public/scram'),
  prefix: '/scram/',
  decorateReply: false,
  setHeaders: (res, path) => {
    const reply = res as unknown as FastifyReply;
    if (typeof reply.header === 'function') {
      setStaticHeaders(reply, path, { serviceWorker: true, crossOrigin: true });
    }
  }
});

// Register static file serving for baremux transport files
await app.register(fastifyStatic, {
  root: join(__dirname, '../public/baremux'),
  prefix: '/baremux/',
  decorateReply: false,
  setHeaders: (res, path) => {
    const reply = res as unknown as FastifyReply;
    if (typeof reply.header === 'function') {
      setStaticHeaders(reply, path, { serviceWorker: true });
    }
  }
});

// Register static file serving for epoxy transport files
await app.register(fastifyStatic, {
  root: join(__dirname, '../public/epoxy'),
  prefix: '/epoxy/',
  decorateReply: false
});

// Register static file serving for libcurl transport files
await app.register(fastifyStatic, {
  root: join(__dirname, '../public/libcurl'),
  prefix: '/libcurl/',
  decorateReply: false
});

// Register static file serving for bare-as-module3 transport
await app.register(fastifyStatic, {
  root: join(__dirname, '../public/baremod'),
  prefix: '/baremod/',
  decorateReply: false
});

// Register static file serving for general public files (must be last, with decorateReply true)
await app.register(fastifyStatic, {
  root: join(__dirname, '../public'),
  prefix: '/',
  decorateReply: true
});

// Handle proxy routes - these are handled by the service worker in the browser
// but we need to serve the main HTML for them to work
app.get('/~/uv/*', async (request: FastifyRequest, reply: FastifyReply) => {
  return reply.sendFile('index.html');
});

// Handle Scramjet proxy routes
app.get('/~/scram/*', async (request: FastifyRequest, reply: FastifyReply) => {
  return reply.sendFile('index.html');
});

// SPA fallback - serve index.html for all non-file routes
app.setNotFoundHandler(async (request: FastifyRequest, reply: FastifyReply) => {
  // Don't serve index.html for API routes or static files with extensions
  const hasFileExtension = /\.[a-z0-9]{1,10}$/i.test(request.url);
  if (request.url.startsWith('/api/') || hasFileExtension) {
    return reply.status(404).send('Not Found');
  }
  return reply.sendFile('index.html');
});

// Add error handler for better error handling
app.setErrorHandler((error, request, reply) => {
  console.error('Fastify error:', error);
  const statusCode = (error as { statusCode?: number }).statusCode || 500;
  const errorMessage = error instanceof Error ? error.message : 'An error occurred';
  reply.status(statusCode).send({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? errorMessage : 'An error occurred'
  });
});

// Start the server
app.listen({ port: PORT, host: '0.0.0.0' })
  .then(() => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Server also listening on http://0.0.0.0:${PORT}/`);
    console.log('Available endpoints:');
    console.log('  - Wisp: ws://localhost:' + PORT + '/wisp/');
    console.log('  - Bare: http://localhost:' + PORT + '/bare/');
    console.log('Server optimizations (Fastify):');
    console.log('  - Connection timeout: 120s, Keep-alive timeout: 65s');
    console.log('  - Max header size: 32KB, Body limit: 10MB');
    console.log('  - Bare server max connections per IP: 1000');
  })
  .catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
