import express from 'express';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRouter from './routes/auth.js';
import activitiesRouter from './routes/activities.js';
import insightsRouter from './routes/insights.js';
import userRouter from './routes/user.js';
import { apiLimiter } from './middleware/rateLimit.js';
import { errorHandler } from './middleware/errorHandler.js';

import path from 'path';
import fs from 'fs';

const rootEnvPath = path.resolve(process.cwd(), '../.env');
if (fs.existsSync(rootEnvPath)) {
  dotenv.config({ path: rootEnvPath });
} else {
  dotenv.config();
}

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy for Cloud Run (required for express-rate-limit)
app.set('trust proxy', 1);

// Helmet for security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://maps.googleapis.com"],
      connectSrc: ["'self'", "https://generativelanguage.googleapis.com"],
    }
  }
}));

// Express built-in body parser
app.use(express.json());

app.get('/healthz', (_req, res) => {
  res.status(200).json({ ok: true });
});

// Base Rate Limiter
app.use('/api', apiLimiter);

// Routes
app.use('/auth', authRouter);
app.use('/api/activities', activitiesRouter);
app.use('/api/insights', insightsRouter);
app.use('/api/user', userRouter);

const clientDistPath = path.resolve(process.cwd(), 'client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/auth')) {
      return next();
    }

    return res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

// Global Error Handler
app.use(errorHandler);

// Serve static files from the client build directory
const clientBuildPath = path.resolve(process.cwd(), '../client/dist');
if (fs.existsSync(clientBuildPath)) {
  app.use(express.static(clientBuildPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}

// Listen
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`GreenTrace server running on port ${PORT}`);
  });
}

export default app;

