# Next Steps
Phase 4 (Chat REST + Anti-Spam) is complete.

Next build phase:
1. **Phase 5 — Real-time Socket.IO (`docs/REALTIME.md`, `docs/API_CONTRACT.md`):**
   - `src/sockets/index.js` + handlers attached to HTTP server in `src/server.js`
   - Socket auth middleware (`socket.handshake.auth.token`, JWT + DB status check, `user:<id>` room, JWT expiration disconnect timer)
   - Wire `presenceService` connect/disconnect + `users.last_seen_at` update + scoped `presence` emit to conversation peers
   - Wire `message:new`, `message:read`, `conversation:ended`, `force-logout`, and throttled `typing:start` / `typing:stop`
   - Two-client Socket.IO test in `tests/`
2. **Phase 6 — Reports & Admin (`docs/ADMIN.md`)**
3. **Phase 7 — Hardening & docs**
