import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.STATIC_PORT || 5173;

// Get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from the dist directory at /consent-manager/ path
const distPath = path.join(__dirname, '../dist');
app.use('/consent-manager', express.static(distPath));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'static-server', timestamp: new Date().toISOString() });
});

// Handle client-side routing - serve index.html for consent-manager routes except static assets
app.use('/consent-manager', (req, res, next) => {
  // Skip if it's a request for a static file (has file extension)
  const hasFileExtension = /\.[a-zA-Z0-9]+$/.test(req.path);

  // Only serve index.html for GET requests that accept HTML and aren't static files
  if (req.method === 'GET' && req.accepts('html') && !hasFileExtension) {
    res.sendFile(path.join(distPath, 'index.html'));
  } else {
    next();
  }
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Static server running on port ${PORT}`);
  console.log(`Serving files from: ${distPath}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

export default app;
