import { jsonResponse, hashPassword } from "../_lib/auth.js";

// Herkese açık: geçerli/kullanılmamış/süresi dolmamış bir token + yeni şifre alır.
export async function onRequestPost(context) {
  const db = context.env.DB;
  const body = await context.request.json().catch(() => ({}));
  const token = (body.token || "").toString().trim();
  const newPassword = (body.new_password || "").toString();

  if (!token || !newPassword) {
    return jsonResponse({ error: "missing_fields" }, 400);
  }
  if (newPassword.length < 8) {
    return jsonResponse({ error: "weak_password" }, 400);
  }

  try {
    const row = await db.prepare(
      `SELECT token, user_id FROM password_reset_tokens
       WHERE token = ? AND used = 0 AND expires_at > datetime('now')`
    ).bind(token).first();

    if (!row) {
      return jsonResponse({ error: "invalid_or_expired" }, 400);
    }

    const { hash, salt } = await hashPassword(newPassword);
    await db.prepare("UPDATE users SET password_hash = ?, salt = ? WHERE id = ?")
      .bind(hash, salt, row.user_id).run();

    // Token'ı kullanılmış işaretle ve kullanıcının diğer bekleyen token'larını da geçersiz kıl
    await db.prepare("UPDATE password_reset_tokens SET used = 1 WHERE user_id = ?").bind(row.user_id).run();

    return jsonResponse({ ok: true });
  } catch (e) {
    return jsonResponse({ error: "server_error" }, 500);
  }
}
