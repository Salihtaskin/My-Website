import { getSessionUser, jsonResponse, verifyTotp } from "../../_lib/auth.js";

// 2FA'yı kapatmak, çalınmış bir oturum çerezinin tek başına yeterli
// olmaması için mevcut geçerli bir TOTP kodu ister.
export async function onRequestPost(context) {
  const user = await getSessionUser(context);
  if (!user || user.role !== "admin") {
    return jsonResponse({ error: "forbidden" }, 403);
  }

  const body = await context.request.json().catch(() => ({}));
  const code = (body.code || "").toString();

  const row = await context.env.DB.prepare(
    "SELECT totp_secret, totp_enabled FROM users WHERE id = ?"
  ).bind(user.id).first();

  if (!row || !row.totp_enabled) {
    return jsonResponse({ ok: true }); // zaten kapalı
  }

  const ok = await verifyTotp(row.totp_secret, code);
  if (!ok) {
    return jsonResponse({ error: "invalid_code" }, 401);
  }

  await context.env.DB.prepare(
    "UPDATE users SET totp_enabled = 0, totp_secret = NULL WHERE id = ?"
  ).bind(user.id).run();

  return jsonResponse({ ok: true });
}
