import { getSessionUser, jsonResponse, hashPassword, verifyPassword } from "../_lib/auth.js";

export async function onRequestPost(context) {
  const user = await getSessionUser(context);
  if (!user) return jsonResponse({ error: "unauthorized" }, 401);

  const db = context.env.DB;
  const body = await context.request.json().catch(() => ({}));
  const currentPassword = (body.current_password || "").toString();
  const newPassword = (body.new_password || "").toString();

  if (!currentPassword || !newPassword) {
    return jsonResponse({ error: "missing_fields" }, 400);
  }
  if (newPassword.length < 8) {
    return jsonResponse({ error: "weak_password" }, 400);
  }

  const row = await db.prepare("SELECT salt, password_hash FROM users WHERE id = ?").bind(user.id).first();
  if (!row) return jsonResponse({ error: "not_found" }, 404);

  const ok = await verifyPassword(currentPassword, row.salt, row.password_hash);
  if (!ok) {
    return jsonResponse({ error: "wrong_current_password" }, 401);
  }

  const { hash, salt } = await hashPassword(newPassword);
  await db.prepare("UPDATE users SET password_hash = ?, salt = ? WHERE id = ?")
    .bind(hash, salt, user.id).run();

  // Şifre değişince güvenlik için diğer tüm oturumları da sonlandır (mevcut oturum hariç
  // tutmuyoruz; kullanıcı zaten aynı çerezle giriş yapmaya devam edebilir çünkü çerez
  // değişmedi, session tablosu ayrı tutuluyor). Burada bilinçli olarak sadece şifreyi
  // güncelliyoruz, oturumları sonlandırmıyoruz ki kullanıcı kendi kendini dışarı atmasın.

  return jsonResponse({ ok: true });
}
