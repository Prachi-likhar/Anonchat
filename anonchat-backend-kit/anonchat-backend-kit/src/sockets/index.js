const { Server } = require('socket.io');
const { env } = require('../config/env');
const { verifyAccessToken } = require('../services/tokenService');
const { loadUserAuthState } = require('../middleware/auth');
const { setIo } = require('./emitter');
const { handleConnection } = require('./handlers');

let activeIo = null;

/**
 * Attaches Socket.IO to the HTTP server with JWT + DB status authentication.
 * @param {import('http').Server} httpServer
 */
function initSockets(httpServer) {
  const io = new Server(httpServer, {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    cors: {
      origin(origin, callback) {
        if (!origin || env.CORS_ORIGINS.includes(origin)) {
          return callback(null, true);
        }
        return callback(null, false);
      },
      credentials: true,
      methods: ['GET', 'POST'],
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token || typeof token !== 'string') {
        return next(new Error('UNAUTHENTICATED'));
      }

      let payload;
      try {
        payload = verifyAccessToken(token);
      } catch {
        return next(new Error('UNAUTHENTICATED'));
      }

      if (!payload || !payload.sub) {
        return next(new Error('UNAUTHENTICATED'));
      }

      const user = await loadUserAuthState(payload.sub);
      if (!user) {
        return next(new Error('UNAUTHENTICATED'));
      }
      if (user.status === 'banned') {
        return next(new Error('ACCOUNT_BANNED'));
      }
      if (user.status === 'suspended') {
        return next(new Error('ACCOUNT_SUSPENDED'));
      }
      if (!user.email_verified_at) {
        return next(new Error('EMAIL_NOT_VERIFIED'));
      }

      socket.data.userId = user.id;
      socket.data.role = user.role;
      socket.data.tokenExp = payload.exp;
      return next();
    } catch {
      return next(new Error('INTERNAL'));
    }
  });

  io.on('connection', (socket) => {
    handleConnection(io, socket);
  });

  activeIo = io;
  setIo(io);
  return io;
}

async function closeSockets() {
  if (activeIo) {
    const ioToClose = activeIo;
    activeIo = null;
    setIo(null);
    await ioToClose.close();
  }
}

module.exports = {
  initSockets,
  closeSockets,
};
