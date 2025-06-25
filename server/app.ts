import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:5173', 'https://dips.soton.ac.uk'],
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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