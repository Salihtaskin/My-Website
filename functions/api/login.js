import { verifyPassword, makeSessionToken, jsonResponse } from "../_lib/auth.js";

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
      return jsonResponse({ error: "invalid_credentials" }, 401);
    }

    const ok = await verifyPassword(password, user.salt, user.password_hash);
    if (!ok) {
      await logAttempt(email, false, "invalid_credentials", user.id);
      return jsonResponse({ error: "invalid_credentials" }, 401);
    }

    if (user.status !== "approved") {
      await logAttempt(email, false, "not_approved:" + user.status, user.id);
      return jsonResponse({ error: "not_approved", status: user.status }, 403);
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
