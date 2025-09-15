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

// Serve static files from the dist directory
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'static-server', timestamp: new Date().toISOString() });
});

// Handle client-side routing - serve index.html for all routes
app.use((req, res, next) => {
  // Only serve index.html for GET requests that accept HTML
  if (req.method === 'GET' && req.accepts('html')) {
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
