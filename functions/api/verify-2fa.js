import { verifyTotp, makeSessionToken, jsonResponse } from "../_lib/auth.js";

export async function onRequestPost(context) {
  const db = context.env.DB;
  const ip = context.request.headers.get("CF-Connecting-IP") || "unknown";
  const ua = (context.request.headers.get("User-Agent") || "").slice(0, 255);

  try {
    const body = await context.request.json().catch(() => ({}));
    const pendingToken = (body.pending_token || "").toString();
    const code = (body.code || "").toString();

    if (!pendingToken || !code) {
      return jsonResponse({ error: "missing_fields" }, 400);
    }

    const pending = await db.prepare(
      `SELECT p.token, p.user_id, u.email, u.full_name, u.role, u.totp_secret
       FROM pending_2fa p JOIN users u ON u.id = p.user_id
       WHERE p.token = ? AND p.expires_at > datetime('now')`
    ).bind(pendingToken).first();

    if (!pending) {
      return jsonResponse({ error: "expired_or_invalid" }, 401);
    }

    const ok = await verifyTotp(pending.totp_secret, code);
    if (!ok) {
      return jsonResponse({ error: "invalid_code" }, 401);
    }

    // Tek kullanımlık: doğrulanır doğrulanmaz sil
    await db.prepare("DELETE FROM pending_2fa WHERE token = ?").bind(pendingToken).run();

    const token = makeSessionToken();
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    await db.prepare(
      "INSERT INTO sessions (token, user_id, expires_at, ip, user_agent) VALUES (?, ?, ?, ?, ?)"
    ).bind(token, pending.user_id, expires, ip, ua).run();

    try {
      await db.prepare(
        "UPDATE users SET last_login_at = datetime('now'), last_login_ip = ? WHERE id = ?"
      ).bind(ip, pending.user_id).run();
    } catch (e) { /* sessizce geç */ }

    try {
      await db.prepare(
        `INSERT INTO login_events (user_id, email, ip, user_agent, success, reason)
         VALUES (?, ?, ?, ?, 1, 'ok_2fa')`
      ).bind(pending.user_id, pending.email, ip, ua).run();
    } catch (e) { /* sessizce geç */ }

    const headers = {
      "Set-Cookie": `session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800`
    };

    return jsonResponse(
      { ok: true, user: { full_name: pending.full_name, email: pending.email, role: pending.role } },
      200,
      headers
    );
  } catch (err) {
    return jsonResponse({ error: "server_error", detail: String(err) }, 500);
  }
}
