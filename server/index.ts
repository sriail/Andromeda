import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { server as wisp } from '@mercuryworkshop/wisp-js/server';
import { createBareServer } from '@tomphttp/bare-server-node';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = createServer();
const PORT = process.env.PORT || 8080;

// Create Bare Server for bare transport mode
const bareServer = createBareServer('/bare/');

// Serve UV bundle files with correct MIME types and headers
app.use('/uv', express.static(join(__dirname, '../public/uv'), {
  setHeaders: (res, path) => {
    // Set proper MIME types for JavaScript files
    if (path.endsWith('.js') || path.endsWith('.cjs')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (path.endsWith('.mjs')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
    // Allow service worker scope
    res.setHeader('Service-Worker-Allowed', '/');
  }
}));

// Serve Scramjet files
app.use('/scram', express.static(join(__dirname, '../public/scram'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.js') || path.endsWith('.cjs') || path.endsWith('.mjs')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (path.endsWith('.wasm')) {
      res.setHeader('Content-Type', 'application/wasm');
    }
    res.setHeader('Service-Worker-Allowed', '/');
    // Cross-origin isolation headers required for Scramjet
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  }
}));

// Serve transport files with correct headers
app.use('/baremux', express.static(join(__dirname, '../public/baremux'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.js') || path.endsWith('.cjs') || path.endsWith('.mjs')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
    res.setHeader('Service-Worker-Allowed', '/');
  }
}));

app.use('/epoxy', express.static(join(__dirname, '../public/epoxy'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.js') || path.endsWith('.cjs') || path.endsWith('.mjs')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

app.use('/libcurl', express.static(join(__dirname, '../public/libcurl'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.js') || path.endsWith('.cjs') || path.endsWith('.mjs')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

// Serve bare-as-module3 transport for Bare server mode
app.use('/baremod', express.static(join(__dirname, '../public/baremod'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.js') || path.endsWith('.cjs') || path.endsWith('.mjs')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

// Serve static files from the dist/public directory (including images, pages, etc.)
app.use(express.static(join(__dirname, '../public')));

// Handle proxy routes - these are handled by the service worker in the browser
// but we need to serve the main HTML for them to work
app.get('/~/uv/*', (req: Request, res: Response) => {
  res.sendFile(join(__dirname, '../public/index.html'));
});

// Handle Scramjet proxy routes
app.get('/~/scram/*', (req: Request, res: Response) => {
  res.sendFile(join(__dirname, '../public/index.html'));
});

// SPA fallback - serve index.html for all non-file routes
app.get('*', (req: Request, res: Response) => {
  // Don't serve index.html for API routes or static files with extensions
  // Match common file extensions (1-10 characters after the dot)
  const hasFileExtension = /\.[a-z0-9]{1,10}$/i.test(req.path);
  if (req.path.startsWith('/api/') || hasFileExtension) {
    res.status(404).send('Not Found');
    return;
  }
  res.sendFile(join(__dirname, '../public/index.html'));
});

// Handle HTTP requests - route to Bare server or Express app
httpServer.on('request', (req, res) => {
  if (bareServer.shouldRoute(req)) {
    bareServer.routeRequest(req, res);
  } else {
    app(req, res);
  }
});

// Handle WebSocket upgrades for Wisp and Bare server
httpServer.on('upgrade', (req, socket, head) => {
  if (bareServer.shouldRoute(req)) {
    bareServer.routeUpgrade(req, socket, head);
  } else if (req.url?.startsWith('/wisp')) {
    wisp.routeRequest(req, socket, head);
  } else {
    // Close connection for unhandled WebSocket paths
    socket.end();
  }
});

// Handle server errors
httpServer.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
    process.exit(1);
  }
  console.error('Server error:', err);
});

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('  - Wisp: ws://localhost:' + PORT + '/wisp/');
  console.log('  - Bare: http://localhost:' + PORT + '/bare/');
});
