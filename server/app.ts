import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configure payload limits from environment variables
const JSON_LIMIT = process.env.JSON_LIMIT || '10mb';
const URL_LIMIT = process.env.URL_LIMIT || '10mb';

console.log(`Server starting with limits: JSON=${JSON_LIMIT}, URL=${URL_LIMIT}`);

// Configure helmet with conditional iframe support
app.use((req, res, next) => {
  if (req.path.startsWith('/api/auth/token')) {
    // Skip helmet entirely for auth endpoints to allow iframe embedding
    next();
  } else {
    // Default helmet for other routes
    helmet()(req, res, next);
  }
});
// Configure CORS from environment variables
const corsOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:5173', 'https://dips.soton.ac.uk', 'http://localhost', 'http://127.0.0.1'];

app.use(cors({
  origin: corsOrigins,
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: JSON_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: URL_LIMIT }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Import routes
import requestsRouter from './routes/requests.js';
import authRouter from './routes/auth.js';
import ontologiesRouter from './routes/ontologies.js';
import dashboardRouter from './routes/dashboard.js';
import externalApiRouter from './routes/external-api.js';

// API Routes
app.use('/api', (req, res, next) => {
  console.log(`API request: ${req.method} ${req.path}`);
  next();
});

app.use('/api/requests', requestsRouter);
app.use('/api/auth', authRouter);
app.use('/api/ontologies', ontologiesRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/external', externalApiRouter);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

export default app;