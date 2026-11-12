# Deployment Guide — Anonymous Community Chat Backend

## 1. Prerequisites
- **Node.js** `>= 20.0.0`
- **PostgreSQL** `14+` with `citext` and `pgcrypto` extensions available
- **Google Apps Script Web App** deployed from `apps-script/Code.gs` (see `docs/OTP_GOOGLE_SHEETS.md`), or an alternative mailer replacing `src/services/otpService.js`
- **Reverse Proxy** (Nginx / Caddy / Cloudflare) terminating HTTPS/TLS and forwarding WebSocket upgrades for `/socket.io/`

---

## 2. Environment Configuration
Copy `.env.example` to `.env` in `anonchat-backend-kit/anonchat-backend-kit/` and set production values:

```env
NODE_ENV=production
PORT=4000
DATABASE_URL=postgres://anonchat_app:<strong-password>@<db-host>:5432/anonchat
JWT_ACCESS_SECRET=<64-hex-or-random-32+-bytes>
JWT_REFRESH_SECRET=<different-64-hex-or-random-32+-bytes>
ACCESS_TTL=15m
REFRESH_TTL_DAYS=30
BCRYPT_COST=12
CORS_ORIGINS=https://chat.example.com
COOKIE_SECURE=true
APPS_SCRIPT_URL=https://script.google.com/macros/s/<deployment-id>/exec
APPS_SCRIPT_SECRET=<shared-secret-matching-Apps-Script>
OTP_TTL_MIN=10
OTP_PEPPER=<random-32+-bytes>
SUPER_ADMIN_EMAIL=owner@example.com
SEED_ADMIN_PASSWORD=<strong-initial-admin-password>
ADMIN_CAN_SEE_FULL_NAME=false
STRICT_FIRST_CONTACT=false
```

### Critical Production Checks
- `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` must each be at least 32 characters and **must differ**.
- `COOKIE_SECURE=true` is required behind HTTPS so `refresh_token` cookies are only sent over TLS.
- `APPS_SCRIPT_URL` and `APPS_SCRIPT_SECRET` are enforced at startup when `NODE_ENV=production`.
- `app.set('trust proxy', 1)` is automatically enabled when `NODE_ENV=production` so `req.ip` and rate limits read `X-Forwarded-For` from the reverse proxy.

---

## 3. Database Setup, Migrations & Admin Seed
```bash
# Install production dependencies
npm ci --omit=dev

# Apply SQL migrations (idempotent, tracked in schema_migrations)
npm run migrate

# Seed super-admin account (Anonymous_Admin)
npm run seed:admin
```

Verify health after starting (`npm start`):
```bash
curl -fsS http://127.0.0.1:4000/api/health
```

---

## 4. Reverse Proxy (Nginx + HTTPS + WebSocket Upgrade)
Ensure HTTP/1.1 upgrade headers are forwarded for Socket.IO (`/socket.io/`):

```nginx
server {
    listen 443 ssl http2;
    server_name api.example.com;

    ssl_certificate     /etc/letsencrypt/live/api.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.example.com/privkey.pem;

    client_max_body_size 16k;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Required for Socket.IO WebSocket upgrades
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 60s;
    }
}
```

---

## 5. Backups & Maintenance
- **Daily `pg_dump` backups** (encrypted at rest):
  ```bash
  pg_dump --format=custom --no-owner "$DATABASE_URL" -f "/backups/anonchat_$(date +%F).dump"
  ```
- Test restores monthly into a staging DB and re-run `npm run migrate` as a verification step.
- **Process supervision:** Run `node src/server.js` via systemd or PM2 (`SIGINT`/`SIGTERM` triggers graceful HTTP, Socket.IO, and PostgreSQL pool shutdown).
- **Horizontal scaling (v2+):** Replace in-memory `presenceService` and `antiSpam` stores with Redis and attach `@socket.io/redis-adapter`.
