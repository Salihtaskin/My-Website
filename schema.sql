-- Cloudflare D1 şeması (v2 — sıfırdan kurulum için)
-- Zaten bir D1 kurulumun varsa bunu ÇALIŞTIRMA, onun yerine
-- migration_v2.sql dosyasını çalıştır (mevcut veriyi korur).
-- Kurulum adımları için README.md'ye bakın.

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  full_name     TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  phone         TEXT,
  password_hash TEXT NOT NULL,
  salt          TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'user',     -- 'user' | 'admin'
  status        TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'approved' | 'rejected'
  registered_ip TEXT,
  last_login_at TEXT,
  last_login_ip TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  token      TEXT PRIMARY KEY,
  user_id    INTEGER NOT NULL,
  ip         TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS login_events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER,
  email       TEXT,
  ip          TEXT,
  user_agent  TEXT,
  success     INTEGER NOT NULL,   -- 1 = başarılı, 0 = başarısız
  reason      TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_email          ON users(email);
CREATE INDEX IF NOT EXISTS idx_sessions_user         ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_login_events_email    ON login_events(email);
CREATE INDEX IF NOT EXISTS idx_login_events_ip        ON login_events(ip);
CREATE INDEX IF NOT EXISTS idx_login_events_created  ON login_events(created_at);
