-- ============================================================
-- MIGRATION v4 — Admin ayarları, tehdit göstergesi, canlı log,
-- kullanıcı şifre/geçmiş, rozetler, mini quiz/CTF
-- ============================================================
-- SADECE migration_v2.sql ve migration_v3.sql zaten çalıştırılmış
-- bir veritabanında çalıştır. Mevcut veriyi SİLMEZ.
--
-- Nasıl çalıştırılır: Cloudflare Dashboard → D1 veritabanın →
-- Console sekmesi → bu dosyanın tamamını yapıştır → çalıştır.
-- ============================================================

-- Admin panelden açılıp kapatılabilen / eşiği değiştirilebilen ayarlar
CREATE TABLE IF NOT EXISTS site_settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

INSERT OR IGNORE INTO site_settings (key, value) VALUES
  ('feature.threat_level', '1'),
  ('feature.terminal_log', '1'),
  ('feature.quiz', '1'),
  ('feature.badges', '1'),
  ('threat.yellow_threshold', '2'),
  ('threat.red_threshold', '5'),
  ('badge.streak_days', '7'),
  ('badge.login_count_milestone', '10'),
  ('terminal.refresh_seconds', '5'),
  ('terminal.max_events', '30');

-- Mini siber güvenlik quiz/CTF soruları (admin panelden yönetilir)
CREATE TABLE IF NOT EXISTS quiz_questions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  question      TEXT NOT NULL,
  option_a      TEXT NOT NULL,
  option_b      TEXT NOT NULL,
  option_c      TEXT NOT NULL,
  option_d      TEXT NOT NULL,
  correct_index INTEGER NOT NULL,   -- 0=A, 1=B, 2=C, 3=D
  active        INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Kullanıcı başına en iyi quiz skoru
CREATE TABLE IF NOT EXISTS quiz_scores (
  user_id    INTEGER PRIMARY KEY,
  best_score INTEGER NOT NULL DEFAULT 0,
  best_total INTEGER NOT NULL DEFAULT 0,
  attempts   INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_quiz_scores_best ON quiz_scores(best_score);

-- Başlangıç soru seti (admin panelden düzenlenebilir/silinebilir)
INSERT INTO quiz_questions (question, option_a, option_b, option_c, option_d, correct_index) VALUES
('"Phishing" saldırısı nedir?', 'Ağ trafiğini dinleme', 'Sahte e-posta/site ile kimlik bilgisi çalma', 'Sunucuyu aşırı istekle çökertme', 'Şifreyi kaba kuvvetle deneme', 1),
('Güçlü bir şifrenin özelliği nedir?', 'Sadece rakamlardan oluşması', 'Kısa ve akılda kalıcı olması', 'Uzun, karmaşık ve tahmin edilemez olması', 'Doğum tarihini içermesi', 2),
('2FA (iki faktörlü doğrulama) neden kullanılır?', 'Siteyi hızlandırmak için', 'Şifre çalınsa bile ekstra bir güvenlik katmanı eklemek için', 'Şifreyi hatırlamamak için', 'Reklamları engellemek için', 1),
('DDoS saldırısının amacı nedir?', 'Veri çalmak', 'Bir sistemi/servisi aşırı istekle erişilemez hale getirmek', 'Zararlı yazılım yaymak', 'Şifreleri kırmak', 1),
('"Brute force" saldırısı ne yapar?', 'Tüm olası şifre kombinasyonlarını dener', 'Sahte e-posta gönderir', 'Ağ paketlerini şifreler', 'Sunucu loglarını siler', 0),
('HTTPS ile HTTP arasındaki temel fark nedir?', 'HTTPS daha hızlıdır', 'HTTPS trafiği şifreler (SSL/TLS)', 'HTTP daha güvenlidir', 'Aralarında fark yoktur', 1),
('SQL Injection saldırısına karşı en iyi savunma nedir?', 'Parametrize edilmiş sorgular (prepared statements) kullanmak', 'Şifreleri uzun tutmak', 'Sunucuyu yeniden başlatmak', 'Reklam engelleyici kullanmak', 0),
('Bir "firewall" (güvenlik duvarı) ne işe yarar?', 'Diski defragmente eder', 'Ağ trafiğini kurallara göre filtreler', 'Ekran kartını hızlandırır', 'E-postaları sıralar', 1),
('"Social engineering" (sosyal mühendislik) nedir?', 'İnsan psikolojisini kullanarak bilgi/erişim elde etme', 'Ağ kablolarını yeniden döşeme', 'Yazılımı güncelleme', 'Donanım arızasını tespit etme', 0),
('Kali Linux ne için kullanılır?', 'Ofis programları çalıştırmak için', 'Sızma testi ve güvenlik araçları için özelleşmiş bir dağıtım', 'Sadece oyun oynamak için', 'E-posta sunucusu olarak', 1);
