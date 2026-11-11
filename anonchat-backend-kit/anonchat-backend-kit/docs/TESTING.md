# Testing (Jest + Supertest, separate test DB `anonchat_test`)
Must-have tests:
1. Auth: register→verify→login; wrong password lockout; expired/wrong OTP; refresh rotation + reuse detection; suspended/banned login responses.
2. Privacy: `toPublicMember` returns EXACT keys; `/members`, `/conversations`, `/blocks` JSON never contain `email`, `fullName`, `password`, `created_at`, `last_seen`.
3. Authorization: user C cannot read/send/mark-read/end/delete conversation between A and B (404).
4. Blocking: A blocks B → B cannot create conversation or send; both hidden in discovery; unblock restores discovery.
5. Anti-spam: 21st message in a minute → 429; 3 identical messages → `DUPLICATE_MESSAGE`; idempotent `clientMsgId`.
6. Admin: non-admin 403; suspend revokes refresh tokens; stats counts; admin can't read chats.
7. Sockets: unauthenticated connect rejected; typing relayed only to the other participant; no events for blocked pair.
Also: `npm run lint` clean, no `console.log` of sensitive data.
