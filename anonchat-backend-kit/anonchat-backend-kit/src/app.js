const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const pinoHttp = require('pino-http');

const { env } = require('./config/env');
const logger = require('./utils/logger');
const { globalLimiter } = require('./middleware/rateLimiters');
const authRoutes = require('./modules/auth/auth.routes');
const usersRoutes = require('./modules/users/users.routes');
const membersRoutes = require('./modules/members/members.routes');
const blocksRoutes = require('./modules/blocks/blocks.routes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.disable('x-powered-by');
if (env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.use(helmet());

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser clients (e.g. React Native, curl) that omit Origin
      if (!origin) {
        return callback(null, true);
      }
      if (env.CORS_ORIGINS.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Client'],
  }),
);

app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

if (env.NODE_ENV !== 'test') {
  app.use(
    pinoHttp({
      logger,
      customLogLevel(_req, res, err) {
        if (err || res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
      },
    }),
  );
}

app.use('/api', globalLimiter);

app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/me', usersRoutes);
app.use('/api/members', membersRoutes);
app.use('/api/blocks', blocksRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
