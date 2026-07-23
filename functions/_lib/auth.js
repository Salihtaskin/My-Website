/* ======================================================
   Ortak yardımcı fonksiyonlar: şifre hashleme, session,
   cookie okuma, JSON response.
   Bu dosya route olarak yayınlanmaz (klasör "_" ile
   başladığı için Cloudflare Pages Functions bunu route
   olarak değil, sadece import edilecek modül olarak görür).
====================================================== */

export function bytesToHex(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

export function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

// PBKDF2-SHA256, 100.000 iterasyon, 256 bit çıktı
export async function hashPassword(password, saltHex) {
  const enc = new TextEncoder();
  const salt = saltHex ? hexToBytes(saltHex) : crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    "raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    256
  );
  return { hash: bytesToHex(new Uint8Array(bits)), salt: bytesToHex(salt) };
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

export async function verifyPassword(password, saltHex, expectedHashHex) {
  const { hash } = await hashPassword(password, saltHex);
  return timingSafeEqual(hash, expectedHashHex);
}

export function makeSessionToken() {
  return crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
}

export function parseCookies(request) {
  const header = request.headers.get("Cookie") || "";
  const out = {};
  header.split(";").forEach(pair => {
    const idx = pair.indexOf("=");
    if (idx > -1) {
      out[pair.slice(0, idx).trim()] = pair.slice(idx + 1).trim();
    }
  });
  return out;
}

export async function getSessionUser(context) {
  const cookies = parseCookies(context.request);
  const token = cookies["session"];
  if (!token) return null;

  const { results } = await context.env.DB.prepare(
    `SELECT u.id, u.full_name, u.email, u.phone, u.role, u.status
     FROM sessions s
     JOIN users u ON u.id = s.user_id
     WHERE s.token = ? AND s.expires_at > datetime('now')`
  ).bind(token).all();

  return results && results[0] ? results[0] : null;
}

export function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...extraHeaders }
  });
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ======================================================
   User-Agent basit ayrıştırma (analitik/güvenlik panelinde
   IP'nin yanında "hangi cihaz/işletim sistemi/tarayıcı"
   göstermek için). Tam bir UA-parser kütüphanesi değildir,
   yaygın durumları kapsayan hafif bir regex setidir.
====================================================== */
export function parseUserAgent(ua) {
  const s = (ua || "");

  let device_type = "desktop";
  if (/mobile|iphone|android.*mobile|windows phone/i.test(s)) device_type = "mobile";
  else if (/ipad|tablet|android(?!.*mobile)/i.test(s)) device_type = "tablet";

  let os = "Diğer";
  if (/windows nt 10/i.test(s)) os = "Windows 10/11";
  else if (/windows nt/i.test(s)) os = "Windows";
  else if (/mac os x|macintosh/i.test(s)) os = "macOS";
  else if (/android/i.test(s)) os = "Android";
  else if (/iphone|ipad|ios/i.test(s)) os = "iOS";
  else if (/linux/i.test(s)) os = "Linux";

  let browser = "Diğer";
  if (/edg\//i.test(s)) browser = "Edge";
  else if (/opr\/|opera/i.test(s)) browser = "Opera";
  else if (/chrome\//i.test(s) && !/chromium/i.test(s)) browser = "Chrome";
  else if (/firefox\//i.test(s)) browser = "Firefox";
  else if (/safari\//i.test(s) && !/chrome/i.test(s)) browser = "Safari";

  return { device_type, os, browser };
}

/* ======================================================
   2FA (TOTP - RFC 6238) — Google Authenticator / Authy gibi
   uygulamalarla uyumlu, harici kütüphane olmadan Web Crypto
   (HMAC-SHA1) kullanılarak.
====================================================== */

const BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32Encode(bytes) {
  let bits = 0, value = 0, output = "";
  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
}

export function base32Decode(str) {
  const clean = str.toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = 0, value = 0;
  const out = [];
  for (let i = 0; i < clean.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(clean[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return new Uint8Array(out);
}

export function generateTotpSecret() {
  const bytes = crypto.getRandomValues(new Uint8Array(20));
  return base32Encode(bytes);
}

export function totpOtpauthUri(secretBase32, email, issuer) {
  const label = encodeURIComponent(`${issuer}:${email}`);
  return `otpauth://totp/${label}?secret=${secretBase32}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
}

async function hmacSha1(keyBytes, msgBytes) {
  const key = await crypto.subtle.importKey(
    "raw", keyBytes, { name: "HMAC", hash: "SHA-1" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, msgBytes);
  return new Uint8Array(sig);
}

function intToBytes(num) {
  // 8 byte big-endian counter (RFC 4226)
  const buf = new ArrayBuffer(8);
  const view = new DataView(buf);
  // JS number güvenli tamsayı sınırında (2^53) yeterli, counter küçük olduğu için
  view.setUint32(4, num % 0x100000000, false);
  view.setUint32(0, Math.floor(num / 0x100000000), false);
  return new Uint8Array(buf);
}

export async function totpCodeAtCounter(secretBase32, counter) {
  const key = base32Decode(secretBase32);
  const msg = intToBytes(counter);
  const hmac = await hmacSha1(key, msg);
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binCode = ((hmac[offset] & 0x7f) << 24)
    | ((hmac[offset + 1] & 0xff) << 16)
    | ((hmac[offset + 2] & 0xff) << 8)
    | (hmac[offset + 3] & 0xff);
  const code = (binCode % 1000000).toString().padStart(6, "0");
  return code;
}

// Saat kaymalarını tolere etmek için ±1 adım (30sn) penceresiyle doğrular
export async function verifyTotp(secretBase32, userCode, windowSteps = 1) {
  const clean = (userCode || "").toString().replace(/\s+/g, "");
  if (!/^\d{6}$/.test(clean)) return false;
  const step = Math.floor(Date.now() / 1000 / 30);
  for (let w = -windowSteps; w <= windowSteps; w++) {
    const code = await totpCodeAtCounter(secretBase32, step + w);
    if (timingSafeEqual(code, clean)) return true;
  }
  return false;
}

/* ======================================================
   site_settings yardımcıları — admin panelden aç/kapa ve
   eşik değerleri için basit key/value okuma.
====================================================== */

export const DEFAULT_SETTINGS = {
  "feature.threat_level": "1",
  "feature.terminal_log": "1",
  "feature.quiz": "1",
  "feature.badges": "1",
  "threat.yellow_threshold": "2",
  "threat.red_threshold": "5",
  "badge.streak_days": "7",
  "badge.login_count_milestone": "10",
  "terminal.refresh_seconds": "5",
  "terminal.max_events": "30"
};

export async function getAllSettings(db) {
  const merged = { ...DEFAULT_SETTINGS };
  try {
    const { results } = await db.prepare("SELECT key, value FROM site_settings").all();
    (results || []).forEach(row => { merged[row.key] = row.value; });
  } catch (e) {
    // site_settings tablosu henüz yoksa (migration_v4.sql çalıştırılmadıysa)
    // varsayılanlarla devam et.
  }
  return merged;
}

export function settingBool(settings, key) {
  return settings[key] === "1" || settings[key] === "true";
}

export function settingInt(settings, key, fallback) {
  const n = parseInt(settings[key], 10);
  return Number.isFinite(n) ? n : fallback;
}
