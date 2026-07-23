import { verifyPassword, makeSessionToken, jsonResponse } from "../_lib/auth.js";

const BRUTE_FORCE_WINDOW_MIN = 15;
const BRUTE_FORCE_THRESHOLD = 5;
const AUTO_BLOCK_MINUTES = 60;
const TWOFA_WINDOW_MIN = 5;

export async function onRequestPost(context) {
  const db = context.env.DB;
  const ip = context.request.headers.get("CF-Connecting-IP") || "unknown";
  const ua = (context.request.headers.get("User-Agent") || "").slice(0, 255);

  async function logAttempt(email, success, reason, user_id) {
    try {
      await db.prepare(
        `INSERT INTO login_events (user_id, email, ip, user_agent, success, reason)
         VALUES (?, ?, ?, ?, ?, ?)`
      ).bind(user_id || null, email || null, ip, ua, success ? 1 : 0, reason).run();
    } catch (e) {
      // login_events tablosu henüz oluşturulmamışsa (migration çalıştırılmadıysa)
      // giriş akışını bozmamak için sessizce geç.
    }
  }

  // Son 15 dakikada bu IP'den BRUTE_FORCE_THRESHOLD veya daha fazla başarısız
  // giriş varsa, IP'yi otomatik olarak AUTO_BLOCK_MINUTES süreyle engelle.
  async function autoBlockIfBruteForce() {
    if (ip === "unknown") return;
    try {
      const row = await db.prepare(
        `SELECT COUNT(*) AS cnt FROM login_events
         WHERE success = 0 AND ip = ? AND created_at >= datetime('now', ?)`
      ).bind(ip, `-${BRUTE_FORCE_WINDOW_MIN} minutes`).first();

      if (row && row.cnt >= BRUTE_FORCE_THRESHOLD) {
        const until = new Date(Date.now() + AUTO_BLOCK_MINUTES * 60 * 1000).toISOString();
        await db.prepare(
          `INSERT INTO blocked_ips (ip, reason, blocked_until, created_by)
           VALUES (?, 'auto:brute_force', ?, 'auto')
           ON CONFLICT(ip) DO UPDATE SET reason='auto:brute_force', blocked_until=excluded.blocked_until`
        ).bind(ip, until).run();
      }
    } catch (e) {
      // blocked_ips tablosu henüz yoksa (migration_v3.sql çalıştırılmadıysa) sessizce geç
    }
  }

  try {
    const body = await context.request.json().catch(() => ({}));
    const email = (body.email || "").toString().trim().toLowerCase();
    const password = (body.password || "").toString();

    if (!email || !password) {
      await logAttempt(email, false, "missing_fields", null);
      return jsonResponse({ error: "missing_fields" }, 400);
    }

    const user = await db.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();

    if (!user) {
      await logAttempt(email, false, "invalid_credentials", null);
      await autoBlockIfBruteForce();
      return jsonResponse({ error: "invalid_credentials" }, 401);
    }

    const ok = await verifyPassword(password, user.salt, user.password_hash);
    if (!ok) {
      await logAttempt(email, false, "invalid_credentials", user.id);
      await autoBlockIfBruteForce();
      return jsonResponse({ error: "invalid_credentials" }, 401);
    }

    if (user.status !== "approved") {
      await logAttempt(email, false, "not_approved:" + user.status, user.id);
      return jsonResponse({ error: "not_approved", status: user.status }, 403);
    }

    // 2FA aktifse (sadece admin hesaplarında sunuluyor): oturumu hemen açma,
    // önce 6 haneli kodu doğrulamak üzere kısa ömürlü bir "pending" token dön.
    if (user.totp_enabled && user.totp_secret) {
      const pendingToken = makeSessionToken();
      const expires = new Date(Date.now() + TWOFA_WINDOW_MIN * 60 * 1000).toISOString();
      try {
        await db.prepare(
          "INSERT INTO pending_2fa (token, user_id, ip, user_agent, expires_at) VALUES (?, ?, ?, ?, ?)"
        ).bind(pendingToken, user.id, ip, ua, expires).run();

        await logAttempt(email, true, "password_ok_awaiting_2fa", user.id);

        return jsonResponse({ ok: true, requires_2fa: true, pending_token: pendingToken });
      } catch (e) {
        // pending_2fa tablosu henüz yoksa (migration_v3.sql çalıştırılmadıysa)
        // 2FA'yı atlayıp normal girişe düş (siteyi kilitlememek için).
      }
    }

    const token = makeSessionToken();
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    await db.prepare(
      "INSERT INTO sessions (token, user_id, expires_at, ip, user_agent) VALUES (?, ?, ?, ?, ?)"
    ).bind(token, user.id, expires, ip, ua).run();

    try {
      await db.prepare(
        "UPDATE users SET last_login_at = datetime('now'), last_login_ip = ? WHERE id = ?"
      ).bind(ip, user.id).run();
    } catch (e) { /* migration henüz çalıştırılmadıysa sütun yok, sessizce geç */ }

    await logAttempt(email, true, "ok", user.id);

    const headers = {
      "Set-Cookie": `session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`
    };

    return jsonResponse(
      { ok: true, user: { full_name: user.full_name, email: user.email, role: user.role } },
      200,
      headers
    );
  } catch (err) {
    return jsonResponse({ error: "server_error", detail: String(err) }, 500);
  }
}
