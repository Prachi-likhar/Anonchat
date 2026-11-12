const http = require('http');
const app = require('./app');
const { env } = require('./config/env');
const logger = require('./utils/logger');
const { closePool } = require('./db/pool');

const server = http.createServer(app);

function shutdown(signal) {
  logger.info({ signal }, 'Shutting down server');
  server.close(async (err) => {
    if (err) {
      logger.error({ err }, 'Error closing HTTP server');
    }
    try {
      await closePool();
    } catch (poolErr) {
      logger.error({ err: poolErr }, 'Error closing PostgreSQL pool');
    }
    process.exit(err ? 1 : 0);
  });
}

server.listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, 'Anonchat API server listening');
});

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

module.exports = server;
