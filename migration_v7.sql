-- ============================================================
-- MIGRATION v7 — Şifremi unuttum, blog yorum/etiket/RSS,
-- yeni yazı bildirim aboneliği
-- ============================================================
-- SADECE migration_v2..v6 zaten çalıştırılmış bir veritabanında
-- çalıştır. Mevcut veriyi SİLMEZ, sadece yeni sütun/tablo ekler.
--
-- Nasıl çalıştırılır: Cloudflare Dashboard → D1 veritabanın →
-- Console sekmesi → bu dosyanın tamamını yapıştır → çalıştır.
-- ============================================================

-- Şifremi unuttum: tek kullanımlık, süresi dolan sıfırlama token'ları
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  token      TEXT PRIMARY KEY,
  user_id    INTEGER NOT NULL,
  ip         TEXT,
  used       INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_password_reset_user ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_ip ON password_reset_tokens(ip, created_at);

-- Blog yazılarına etiket desteği (virgülle ayrılmış, ör: "guvenlik,pentest")
ALTER TABLE blog_posts ADD COLUMN tags TEXT NOT NULL DEFAULT '';

-- Blog yorumları (spam'e karşı admin onayı gerekir)
CREATE TABLE IF NOT EXISTS blog_comments (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id      INTEGER NOT NULL,
  name         TEXT NOT NULL,
  email        TEXT,
  comment_text TEXT NOT NULL,
  approved     INTEGER NOT NULL DEFAULT 0,
  ip           TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (post_id) REFERENCES blog_posts(id)
);

CREATE INDEX IF NOT EXISTS idx_blog_comments_post ON blog_comments(post_id, approved);

-- Yeni yazı yayınlanınca mail almak isteyen aboneler
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  email       TEXT NOT NULL UNIQUE,
  unsub_token TEXT NOT NULL,
  ip          TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_ip ON newsletter_subscribers(ip, created_at);

-- Admin panelden aç/kapatılabilen yeni özellikler
INSERT OR IGNORE INTO site_settings (key, value) VALUES
  ('feature.comments', '1'),
  ('feature.newsletter', '1');
