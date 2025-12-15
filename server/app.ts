import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import fs from "fs";
import path from "path";
import YAML from "yaml";
import { fileURLToPath } from "url";

// Fix __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const app = express();
const PORT = process.env.PORT || 8010;

// Configure payload limits from environment variables
const JSON_LIMIT = process.env.JSON_LIMIT || "10mb";
const URL_LIMIT = process.env.URL_LIMIT || "10mb";

console.log(
  `Server starting with limits: JSON=${JSON_LIMIT}, URL=${URL_LIMIT}`
);

// Configure helmet with conditional iframe support
app.use((req, res, next) => {
  if (req.path.startsWith("/api/auth/token")) {
    // Skip helmet entirely for auth endpoints to allow iframe embedding
    next();
  } else {
    helmet()(req, res, next);
  }
});

// Configure CORS from environment variables
const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS === "*"
    ? ["*"]
    : process.env.CORS_ORIGINS.split(",").map((origin) => origin.trim())
  : ["*"]; // fallback to allow all

app.use(
  cors({
    // use this for production
    // origin: corsOrigins,
    // use this for localhost
    origin: ["http://localhost:5173", "http://localhost:8019"],
    credentials: true,
  })
);

app.use(morgan("combined"));
app.use(express.json({ limit: JSON_LIMIT }));
app.use(express.urlencoded({ extended: true, limit: URL_LIMIT }));

import session from "express-session";

app.use(
  session({
    secret: process.env.SESSION_SECRET || "supersecret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 1000 * 60 * 60,
    },
  })
);

// --- Swagger setup ---
const openapiPath = path.join(__dirname, "openapi.yaml"); // adjust if file is elsewhere
const file = fs.readFileSync(openapiPath, "utf8");
const swaggerDocument = YAML.parse(file);

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Import routes
import requestsRouter from "./routes/requests.js";
import authRouter from "./routes/auth.js";
import ontologiesRouter from "./routes/ontologies.js";
import dashboardRouter from "./routes/dashboard.js";
import externalApiRouter from "./routes/external-api.js";
import contractRoutes from "./routes/contractRoutes.js";

// API Routes
app.use("/api", (req, res, next) => {
  console.log(`API request: ${req.method} ${req.path}`);
  next();
});

app.use("/api/requests", requestsRouter);
app.use("/api/auth", authRouter);
app.use("/api/ontologies", ontologiesRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/external", externalApiRouter);
app.use("/api/requests", contractRoutes);

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Swagger docs: http://localhost:${PORT}/docs`);
});

export default app;
