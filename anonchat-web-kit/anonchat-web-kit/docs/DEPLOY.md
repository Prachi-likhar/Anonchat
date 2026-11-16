# Anonchat Web Frontend — Production Deployment Guide

This document provides a production guide for building, configuring, and deploying the **Anonchat** web frontend (React 18 + TypeScript + Vite + Tailwind CSS + Socket.IO Client).

---

## 1. Architecture Overview

```
[ Browser Client ]
       │
       ├── (Static Assets: HTML, CSS, JS, Fonts) ──> [ Static CDN / Nginx / Vercel / Netlify ]
       │
       ├── (REST API: /api/*) ───────────────────────> [ Express Backend API (Port 4000) ]
       │
       └── (WebSocket: /socket.io/*) ───────────────> [ Socket.IO Server (Port 4000) ]
```

- **Frontend Tech Stack**: React 18.3, TypeScript 5.6 (strict), Vite 5.4, Tailwind CSS 3.4, TanStack Query v5, Zustand v5.
- **Security & Privacy Model**:
  - Access token stored in memory only (`authStore`), refreshed via `httpOnly` secure cookie against `/api/auth/refresh`.
  - Zero leakage of real names, email addresses, or database IDs in UI streams.
  - Web Audio API synthesized notification chimes (zero external MP3 assets).

---

## 2. Environment Variables

| Variable | Required | Description | Example (Production) |
|---|---|---|---|
| `VITE_API_URL` | Yes | Base URL prefix for the backend REST API | `https://api.anonchat.app/api` |
| `VITE_SOCKET_URL` | Yes | Base URL for the Socket.IO server | `https://api.anonchat.app` |

### Setting Environment in Production

Create a `.env.production` file in `anonchat-web-kit/` before running the build:

```ini
VITE_API_URL=https://api.anonchat.app/api
VITE_SOCKET_URL=https://api.anonchat.app
```

> **Note**: Vite embeds variables prefixed with `VITE_` at build time. When deploying to containerized or cloud platforms, pass these during the build phase (`npm run build`).

---

## 3. Backend CORS & Cookie Whitelist Configuration

For authentication cookies (`withCredentials: true`) and Socket.IO handshakes to succeed, the **backend server** must allow the frontend's production origin:

1. In the backend `.env` file, configure `CORS_ORIGINS`:
   ```ini
   CORS_ORIGINS=https://anonchat.app,https://www.anonchat.app,https://admin.anonchat.app
   ```
2. Verify cookie settings in `src/services/tokenService.js`:
   - `secure: true` (requires HTTPS in production)
   - `sameSite: 'lax'` (or `'none'` if API and web app are hosted on different top-level domains)
   - `httpOnly: true`

---

## 4. Hosting Option 1: Vercel

Vercel provides native edge caching and zero-config Vite deployments.

### Automatic Git Integration
1. Push your repository to GitHub.
2. Go to the [Vercel Dashboard](https://vercel.com) and click **"Add New Project"**.
3. Set **Root Directory** to `anonchat-web-kit/anonchat-web-kit`.
4. Configure Build and Output Settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add Environment Variables:
   - `VITE_API_URL`: `https://api.anonchat.app/api`
   - `VITE_SOCKET_URL`: `https://api.anonchat.app`
6. Click **Deploy**.

### SPA Routing Rule (`vercel.json`)
The included `vercel.json` automatically ensures client-side routing works for deep links (e.g. `/app/chat/123`, `/admin/reports`):
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

---

## 5. Hosting Option 2: Netlify

### Automatic Git Integration
1. Connect repository in [Netlify Dashboard](https://app.netlify.com).
2. Set **Base Directory** to `anonchat-web-kit/anonchat-web-kit`.
3. Set **Build Command** to `npm run build`.
4. Set **Publish Directory** to `dist`.
5. Set Environment Variables in **Site Configuration > Environment Variables**.
6. Deploy site.

### SPA Routing Fallback (`_redirects`)
The file `public/_redirects` is copied directly to `dist/_redirects` during build:
```
/*    /index.html   200
```
This serves `index.html` with a 200 status code for all client-side routes, allowing React Router to handle page resolution.

---

## 6. Hosting Option 3: Self-Hosted Nginx & Docker

For self-hosted Linux servers or on-premise Kubernetes clusters:

### Nginx Configuration (`/etc/nginx/sites-available/anonchat.conf`)

```nginx
# Upstream Backend API & Socket Server
upstream backend_api {
    server 127.0.0.1:4000;
    keepalive 32;
}

server {
    listen 80;
    server_name anonchat.app www.anonchat.app;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name anonchat.app www.anonchat.app;

    ssl_certificate /etc/letsencrypt/live/anonchat.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/anonchat.app/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; connect-src 'self' https: wss:; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:;" always;

    root /var/www/anonchat/dist;
    index index.html;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;

    # Static Assets with 1-Year Cache
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }

    # SPA Client Routing Fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Reverse Proxy: REST API
    location /api/ {
        proxy_pass http://backend_api;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Reverse Proxy: WebSocket / Socket.IO
    location /socket.io/ {
        proxy_pass http://backend_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }
}
```

### Multi-Stage Dockerfile

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
ARG VITE_API_URL=/api
ARG VITE_SOCKET_URL=/
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL

RUN npm run build

# Stage 2: Serve
FROM nginx:1.25-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## 7. Pre-Release Verification & Sanity Checklist

Before publishing new builds to production, execute the 4 mandatory validation gates:

```bash
# 1. Type Check
npm run typecheck

# 2. Linting
npm run lint

# 3. Complete Test Suite (63+ tests across 10 suites)
npm test

# 4. Production Build Verification
npm run build
```

### Verification Criteria Checklist
- [x] All chunks in `dist/assets/` are gzip-compressed.
- [x] Unauthenticated users are redirected from `/app/*` to `/login`.
- [x] Non-admin users are blocked from `/admin/*` with "Access Denied".
- [x] Document title reacts dynamically to unread messages: `(N) Anonchat`.
- [x] Offline alert renders seamlessly if network drops or Socket.IO reconnects.
- [x] Audio notifications trigger without external asset 404s using Web Audio API.
- [x] Browser push notifications strictly hide message text for complete privacy.
- [x] No sensitive credentials or secrets stored in `localStorage`.
