import { verifyPassword, makeSessionToken, jsonResponse } from "../_lib/auth.js";

export async function onRequestPost(context) {
  try {
    const body = await context.request.json().catch(() => ({}));
    const email = (body.email || "").toString().trim().toLowerCase();
    const password = (body.password || "").toString();

    if (!email || !password) {
      return jsonResponse({ error: "missing_fields" }, 400);
    }

    const user = await context.env.DB
      .prepare("SELECT * FROM users WHERE email = ?")
      .bind(email)
      .first();

    if (!user) {
      return jsonResponse({ error: "invalid_credentials" }, 401);
    }

    const ok = await verifyPassword(password, user.salt, user.password_hash);
    if (!ok) {
      return jsonResponse({ error: "invalid_credentials" }, 401);
    }

    if (user.status !== "approved") {
      return jsonResponse({ error: "not_approved", status: user.status }, 403);
    }

    const token = makeSessionToken();
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    await context.env.DB.prepare(
      "INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)"
    ).bind(token, user.id, expires).run();

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
