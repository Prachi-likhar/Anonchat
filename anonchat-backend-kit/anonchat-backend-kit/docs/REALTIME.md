# Real-time (Socket.IO)
- Attach Socket.IO to the same HTTP server. CORS same allow-list. Transports: websocket + polling fallback.
- **Auth middleware** (`io.use`): read `socket.handshake.auth.token`, verify JWT, load user status from DB (reject banned/suspended/unverified), set `socket.data.userId`. On success `socket.join('user:'+id)`.
- **Presence:** `presenceService` keeps `Map<userId, connectionCount>`. First connection → online; last disconnect → offline, update `users.last_seen_at`. Emit `presence` only to rooms of users who share a conversation with them. Discovery `isOnline` comes from the same map (REST reads it).
- **Delivery:** after REST `POST /messages` commits, emit `message:new` to `user:<recipient>` (and to sender's other devices `user:<sender>` with `mine:true`). Never emit if blocked.
- **Typing:** on `typing:start|stop {conversationId}`: verify participant (DB or cached set), not blocked, throttle, then emit `typing` to the other user's room. Typing events are not persisted.
- **Read receipts:** REST `POST /conversations/:id/read` updates DB then emits `message:read` to the other participant. (Show a "Seen" tick; user setting to disable read receipts is a later phase.)
- **Force logout:** `io.to('user:'+id).emit('force-logout', {...}); io.in('user:'+id).disconnectSockets(true)`.
- **Token expiry:** clients reconnect with a fresh token; server also sets a timer to disconnect sockets whose JWT expires (check `exp`).
- **Scaling note:** v1 single instance; for multiple instances add `@socket.io/redis-adapter` and move presence + rate limits to Redis.
