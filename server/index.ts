import express, { Request, Response } from 'express';
import { createServer } from 'http';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
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
  // Don't serve index.html for API routes or static files
  if (req.path.startsWith('/api/') || req.path.includes('.')) {
    res.status(404).send('Not Found');
    return;
  }
  res.sendFile(join(__dirname, '../public/index.html'));
});

// Initialize Wisp server
async function setupWisp() {
  try {
    const { default: wisp } = await import('wisp-server-node');
    
    server.on('upgrade', (req, socket, head) => {
      if (req.url?.startsWith('/wisp')) {
        wisp.routeRequest(req, socket as any, head);
      }
    });
    
    console.log('Wisp server initialized');
  } catch (error) {
    console.error('Failed to initialize Wisp server:', error);
  }
}

setupWisp();

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
