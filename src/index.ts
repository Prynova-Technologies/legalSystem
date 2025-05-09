/// <reference path="./types/xss-clean.d.ts" />
import express, { Express, Request, Response, NextFunction } from 'express';
import { createServer } from 'http';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import xss from 'xss-clean';
import httpStatus from 'http-status';
import config from './config/config';
import connectDB from './config/database';
import logger from './utils/logger';
import { errorConverter, errorHandler } from './middlewares/error';
import { SocketService } from './services/socket.service';

// Import routes
import userRoutes from './routes/user.routes';
import authRoutes from './routes/auth.routes';
import caseRoutes from './routes/case.routes';
import clientRoutes from './routes/client.routes';
import documentRoutes from './routes/document.routes';
import routes from './routes';
import billingRoutes from './routes/billing.routes';

// Import middlewares
import { deviceTracker } from './middlewares/deviceTracker';
import { requestLogger } from './middlewares/requestLogger';

// Create Express app
const app: Express = express();

// Create HTTP server
const server = createServer(app);

// Connect to MongoDB
connectDB();

// Set security HTTP headers
app.use(helmet());

// Parse JSON request body
app.use(express.json());

// Parse URL-encoded request body
app.use(express.urlencoded({ extended: true }));

// Sanitize request data against NoSQL query injection
app.use(mongoSanitize());

// Sanitize request data against XSS
app.use(xss());

// Gzip compression
app.use(compression());

// Enable CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight requests
app.options('*', cors());

// Track device information
app.use(deviceTracker);

// Log all requests with device information
app.use(requestLogger);

// Request logging
app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(httpStatus.OK).send({ status: 'ok' });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cases', caseRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/billing', billingRoutes);

// Use consolidated routes
app.use(routes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(httpStatus.NOT_FOUND).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Error converter
app.use(errorConverter);

// Error handler
app.use(errorHandler);

// Initialize Socket.IO
SocketService.initialize(server);

// Start server
server.listen(config.port, () => {
  logger.info(`Server running in ${config.env} mode on port ${config.port}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});

export default app;