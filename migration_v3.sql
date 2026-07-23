-- ============================================================
-- MIGRATION v3 — Ziyaretçi analitiği, IP engelleme, 2FA, CMS
-- ============================================================
-- SADECE schema.sql + migration_v2.sql zaten çalıştırılmış bir
-- veritabanında çalıştır. Mevcut veriyi SİLMEZ, sadece yeni
-- sütun/tablo ekler.
--
-- Nasıl çalıştırılır: Cloudflare Dashboard → D1 veritabanın →
-- Console sekmesi → bu dosyanın tamamını yapıştır → çalıştır.
-- ============================================================

-- 2FA (TOTP) için kullanıcı sütunları
ALTER TABLE users ADD COLUMN totp_secret TEXT;
ALTER TABLE users ADD COLUMN totp_enabled INTEGER NOT NULL DEFAULT 0;

-- Şifre doğrulandıktan sonra, 2FA kodu bekleyen geçici oturumlar
-- (5 dakika içinde kullanılmazsa geçersiz sayılır)
CREATE TABLE IF NOT EXISTS pending_2fa (
  token      TEXT PRIMARY KEY,
  user_id    INTEGER NOT NULL,
  ip         TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Engellenen IP'ler (otomatik brute-force banı veya admin'in elle eklediği)
CREATE TABLE IF NOT EXISTS blocked_ips (
  ip           TEXT PRIMARY KEY,
  reason       TEXT,
  blocked_at   TEXT NOT NULL DEFAULT (datetime('now')),
  blocked_until TEXT,          -- NULL = süresiz
  created_by   TEXT            -- 'auto' | admin e-postası
);

-- Sayfa ziyaretleri (analitik için). Her sayfa yüklendiğinde
-- js/main.js -> /api/track çağrısıyla bir satır eklenir.
CREATE TABLE IF NOT EXISTS page_visits (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  ip          TEXT,
  country     TEXT,
  path        TEXT,
  user_agent  TEXT,
  device_type TEXT,   -- 'mobile' | 'tablet' | 'desktop'
  browser     TEXT,
  os          TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_page_visits_created ON page_visits(created_at);
CREATE INDEX IF NOT EXISTS idx_page_visits_ip       ON page_visits(ip);

-- Kod yazmadan içerik güncelleme (basit CMS). key = index.html'deki
-- data-i18n anahtarıyla aynı (ör. "hero.role"); admin panelden
-- düzenlenince translations.js'teki varsayılan metnin yerine geçer.
CREATE TABLE IF NOT EXISTS content_blocks (
  key        TEXT NOT NULL,
  lang       TEXT NOT NULL,   -- 'tr' | 'en'
  value      TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (key, lang)
);

CREATE INDEX IF NOT EXISTS idx_blocked_ips_until ON blocked_ips(blocked_until);
CREATE INDEX IF NOT EXISTS idx_pending_2fa_expires ON pending_2fa(expires_at);
