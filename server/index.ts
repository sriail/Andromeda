import Fastify, {
  FastifyServerFactory,
  FastifyServerFactoryHandler,
  RawServerDefault
} from 'fastify';
import fastifyMiddie from '@fastify/middie';
import fastifyStatic from '@fastify/static';
import { fileURLToPath } from 'node:url';
import { server as wisp } from '@mercuryworkshop/wisp-js/server';
import { createBareServer } from '@tomphttp/bare-server-node';
import { createServer } from 'node:http';
import type { Socket } from 'node:net';

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
const serverFactory: FastifyServerFactory = (
  handler: FastifyServerFactoryHandler
): RawServerDefault => {
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
    .on('request', (req, res) => {
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
    .on('upgrade', (req, socket, head) => {
      try {
        if (bareServer.shouldRoute(req)) {
          bareServer.routeUpgrade(req, socket as Socket, head);
        } else if (req.url?.endsWith('/wisp/') || req.url?.endsWith('/adblock/')) {
          wisp.routeRequest(req, socket as Socket, head);
        }
      } catch (error) {
        console.error('Error handling WebSocket upgrade:', error);
        socket.destroy();
      }
    })
    .on('error', (error) => {
      console.error('Server error:', error);
    })
    .on('clientError', (error, socket) => {
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

// Register static file serving for public files with custom headers for service workers
await app.register(fastifyStatic, {
  root: fileURLToPath(new URL('../public', import.meta.url)),
  setHeaders: (res, path) => {
    // Set Service-Worker-Allowed header for JS files in uv/scram/baremux directories
    if (path.includes('/uv/') || path.includes('/scram/') || path.includes('/baremux/')) {
      res.setHeader('Service-Worker-Allowed', '/');
    }
    // Set proper content type for JavaScript files
    if (path.endsWith('.js') || path.endsWith('.cjs') || path.endsWith('.mjs')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
    // Set proper content type for WebAssembly files
    if (path.endsWith('.wasm')) {
      res.setHeader('Content-Type', 'application/wasm');
    }
  }
});

// Register middleware support for connect-style handlers
await app.register(fastifyMiddie);

// SPA fallback - serve index.html for all non-file routes
app.setNotFoundHandler((request, reply) => {
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
    console.log(`Server listening on http://localhost:${PORT}/`);
    console.log(`Server also listening on http://0.0.0.0:${PORT}/`);
    console.log(`Connection timeout: 120s, Keep-alive timeout: 65s`);
    console.log(`Max header size: 32KB, Body limit: 10MB`);
  })
  .catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
