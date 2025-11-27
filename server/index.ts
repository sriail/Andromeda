import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { server as wisp } from '@mercuryworkshop/wisp-js/server';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 8080;

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

// Serve static files from the dist/public directory (including images, pages, etc.)
app.use(express.static(join(__dirname, '../public')));

// Handle proxy routes - these are handled by the service worker in the browser
// but we need to serve the main HTML for them to work
app.get('/~/uv/*', (req: Request, res: Response) => {
  res.sendFile(join(__dirname, '../public/index.html'));
});

app.get('/~/scramjet/*', (req: Request, res: Response) => {
  res.sendFile(join(__dirname, '../public/index.html'));
});

// SPA fallback - serve index.html for all non-file routes
app.get('*', (req: Request, res: Response) => {
  // Don't serve index.html for API routes or static files with extensions
  const hasFileExtension = /\.[a-z0-9]+$/i.test(req.path);
  if (req.path.startsWith('/api/') || hasFileExtension) {
    res.status(404).send('Not Found');
    return;
  }
  res.sendFile(join(__dirname, '../public/index.html'));
});

// Handle WebSocket upgrades for Wisp
httpServer.on('upgrade', (req, socket, head) => {
  if (req.url?.startsWith('/wisp')) {
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
});
