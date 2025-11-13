import express from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import UserRoutes from "./routes/User.js";

dotenv.config();

const app = express();

// Configure CORS with explicit options
// For development, allow all origins. For production, restrict to specific domains
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? function (origin, callback) {
        const allowedOrigins = [
          // Add your production frontend URL here
          // 'https://your-frontend-domain.com'
        ];
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      }
    : true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Type', 'Authorization'],
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// Handle preflight requests explicitly for all routes
app.options('*', cors(corsOptions));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

// Log route registration
console.log('Registering routes...');
console.log('User routes: /api/user');

app.use("/api/user", UserRoutes);

console.log('Routes registered successfully');

app.get("/", (req, res) => {
  res.status(200).json({
    message: "FitTrack serverless API is running.",
  });
});

app.get("/test", (req, res) => {
  res.send("Test endpoint is working!");
});

// 404 handler for undefined routes
app.use((req, res, next) => {
  console.log('404 - Route not found:', req.method, req.path);
  console.log('Available routes: /api/generate, /api/user/*, /, /test');
  
  res.setHeader('access-control-allow-origin', '*');
  res.setHeader('access-control-allow-headers', 'Content-Type,Authorization,X-Requested-With,Accept');
  res.setHeader('access-control-allow-methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
  res.setHeader('access-control-allow-credentials', 'true');
  
  return res.status(404).json({
    success: false,
    status: 404,
    message: `Route not found: ${req.method} ${req.path}`,
    error: `Route not found: ${req.method} ${req.path}`,
    availableRoutes: ['/api/user/*', '/', '/test']
  });
});

app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || "Something went wrong";
  
  console.error('Express error middleware called');
  console.error('Error status:', status);
  console.error('Error message:', message);
  console.error('Full error:', err);
  
  // Ensure CORS headers are set on error responses
  // HTTP API Gateway v2 requires lowercase header names
  res.setHeader('access-control-allow-origin', '*');
  res.setHeader('access-control-allow-headers', 'Content-Type,Authorization,X-Requested-With,Accept');
  res.setHeader('access-control-allow-methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
  res.setHeader('access-control-allow-credentials', 'true');
  
  return res.status(status).json({
    success: false,
    status,
    message,
    error: message, // Also include as 'error' for consistency
  });
});

export default app;

