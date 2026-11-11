-- Anonymous Community Chat — PostgreSQL 14+
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- gen_random_uuid()

CREATE TYPE gender_t       AS ENUM ('male','female');
CREATE TYPE role_t         AS ENUM ('user','admin');
CREATE TYPE account_status_t AS ENUM ('active','suspended','banned');
CREATE TYPE theme_t        AS ENUM ('system','light','dark');
CREATE TYPE otp_purpose_t  AS ENUM ('verify_email','reset_password');
CREATE TYPE convo_status_t AS ENUM ('active','ended');
CREATE TYPE report_reason_t AS ENUM ('spam','harassment','inappropriate','impersonation','other');
CREATE TYPE report_status_t AS ENUM ('open','reviewing','resolved','dismissed');

CREATE TABLE users (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  anon_username   text NOT NULL UNIQUE,                 -- Anonymous_4821, permanent
  full_name       text NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 60),  -- PRIVATE
  email           citext NOT NULL UNIQUE,                                          -- PRIVATE
  password_hash   text NOT NULL,
  gender          gender_t NOT NULL,
  avatar_color    text NOT NULL DEFAULT '#7C3AED',
  theme           theme_t NOT NULL DEFAULT 'system',
  role            role_t NOT NULL DEFAULT 'user',
  status          account_status_t NOT NULL DEFAULT 'active',
  status_reason   text,
  suspended_until timestamptz,
  email_verified_at timestamptz,
  failed_logins   int NOT NULL DEFAULT 0,
  locked_until    timestamptz,
  last_seen_at    timestamptz,                          -- admin-only
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX users_discovery_idx ON users (gender) WHERE status='active' AND email_verified_at IS NOT NULL;

CREATE TABLE otp_codes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose     otp_purpose_t NOT NULL,
  code_hash   text NOT NULL,                -- sha256(code + user_id + pepper), never plaintext
  attempts    int NOT NULL DEFAULT 0,
  expires_at  timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX otp_user_idx ON otp_codes (user_id, purpose, created_at DESC);

CREATE TABLE refresh_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  family_id   uuid NOT NULL,
  token_hash  text NOT NULL UNIQUE,         -- sha256 of the opaque token
  user_agent  text,
  expires_at  timestamptz NOT NULL,
  revoked_at  timestamptz,
  replaced_by uuid,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX rt_user_idx ON refresh_tokens (user_id);

CREATE TABLE conversations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a        uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_b        uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  initiated_by  uuid NOT NULL REFERENCES users(id),
  status        convo_status_t NOT NULL DEFAULT 'active',
  ended_by      uuid REFERENCES users(id),
  a_deleted_at  timestamptz,                -- per-participant soft delete
  b_deleted_at  timestamptz,
  a_last_read_at timestamptz,
  b_last_read_at timestamptz,
  last_message_at timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  CHECK (user_a < user_b),                  -- canonical ordering → one row per pair
  UNIQUE (user_a, user_b)
);
CREATE INDEX convo_a_idx ON conversations (user_a, last_message_at DESC NULLS LAST);
CREATE INDEX convo_b_idx ON conversations (user_b, last_message_at DESC NULLS LAST);

CREATE TABLE messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body            text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  client_msg_id   text,
  read_at         timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (conversation_id, sender_id, client_msg_id)   -- idempotent retries
);
CREATE INDEX messages_convo_idx ON messages (conversation_id, created_at DESC);

CREATE TABLE blocks (
  blocker_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);
CREATE INDEX blocks_blocked_idx ON blocks (blocked_id);

CREATE TABLE reports (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id     uuid REFERENCES users(id) ON DELETE SET NULL,
  reported_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES conversations(id) ON DELETE SET NULL,
  reason          report_reason_t NOT NULL,
  details         text CHECK (char_length(details) <= 500),
  snapshot        jsonb,                    -- last 30 msgs: [{sender:'Anonymous_1', body, at}]
  status          report_status_t NOT NULL DEFAULT 'open',
  resolution_note text,
  handled_by      uuid REFERENCES users(id),
  created_at      timestamptz NOT NULL DEFAULT now(),
  resolved_at     timestamptz
);
CREATE INDEX reports_status_idx ON reports (status, created_at DESC);
CREATE INDEX reports_reported_idx ON reports (reported_id);

CREATE TABLE admin_audit_log (
  id         bigserial PRIMARY KEY,
  admin_id   uuid REFERENCES users(id) ON DELETE SET NULL,
  action     text NOT NULL,                 -- 'suspend','ban','reinstate','report.resolve','role.change'
  target_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  meta       jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Optional defence in depth: enable RLS and set `SET LOCAL app.user_id` per request.
-- v1 relies on service-layer authorization; see docs/AUTH_SECURITY.md §RLS.
