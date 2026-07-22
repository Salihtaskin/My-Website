-- ============================================================
-- MIGRATION v2 — Güvenlik/IP takibi ve admin özellikleri
-- ============================================================
-- Bu dosyayı SADECE daha önce schema.sql'i çalıştırıp siteyi
-- zaten kurmuş, kullanıcıları/adminliği olan bir D1 veritabanında
-- çalıştır. Mevcut hiçbir veriyi SİLMEZ, sadece yeni sütun ve
-- tablo ekler.
--
-- Nasıl çalıştırılır: Cloudflare Dashboard → D1 veritabanın →
-- Console sekmesi → bu dosyanın tamamını yapıştır → çalıştır.
-- ============================================================

ALTER TABLE users ADD COLUMN last_login_at TEXT;
ALTER TABLE users ADD COLUMN last_login_ip TEXT;
ALTER TABLE users ADD COLUMN registered_ip TEXT;

ALTER TABLE sessions ADD COLUMN ip TEXT;
ALTER TABLE sessions ADD COLUMN user_agent TEXT;

CREATE TABLE IF NOT EXISTS login_events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER,
  email       TEXT,
  ip          TEXT,
  user_agent  TEXT,
  success     INTEGER NOT NULL,   -- 1 = başarılı, 0 = başarısız
  reason      TEXT,               -- 'ok' | 'invalid_credentials' | 'not_approved:pending' | ...
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_login_events_email   ON login_events(email);
CREATE INDEX IF NOT EXISTS idx_login_events_ip       ON login_events(ip);
CREATE INDEX IF NOT EXISTS idx_login_events_created  ON login_events(created_at);
