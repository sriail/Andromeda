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

// Serve static files from the dist/public directory
app.use(express.static(join(__dirname, '../public')));

// Serve UV bundle files
app.use('/uv', express.static(join(__dirname, '../public/uv')));
app.use('/baremux', express.static(join(__dirname, '../public/baremux')));
app.use('/epoxy', express.static(join(__dirname, '../public/epoxy')));
app.use('/libcurl', express.static(join(__dirname, '../public/libcurl')));

// SPA fallback - serve index.html for all non-file routes
app.get('*', (req: Request, res: Response) => {
  // Don't serve index.html for API routes or static files with extensions
  // Use a more specific file extension pattern to avoid blocking legitimate routes
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
  }
});

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
