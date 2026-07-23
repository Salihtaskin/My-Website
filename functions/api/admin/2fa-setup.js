import { getSessionUser, jsonResponse, generateTotpSecret, totpOtpauthUri, verifyTotp } from "../../_lib/auth.js";

// GET: 2FA zaten aktifse durumu döner. Değilse yeni bir secret üretip
// (henüz aktif etmeden) kullanıcıya kaydeder ve QR için otpauth URI döner.
export async function onRequestGet(context) {
  const user = await getSessionUser(context);
  if (!user || user.role !== "admin") {
    return jsonResponse({ error: "forbidden" }, 403);
  }

  const row = await context.env.DB.prepare(
    "SELECT totp_enabled, totp_secret FROM users WHERE id = ?"
  ).bind(user.id).first();

  if (row && row.totp_enabled) {
    return jsonResponse({ enabled: true });
  }

  // Zaten üretilmiş ama henüz onaylanmamış bir secret varsa AYNISINI tekrar
  // döndür — her sekme açılışında yeni secret üretirsek, kullanıcı authenticator
  // uygulamasına QR'ı okuttuktan sonra onaylamadan sekmeyi kapatıp tekrar açtığında
  // secret değişmiş olur ve okuttuğu kod geçersiz kalır.
  let secret = row && row.totp_secret;
  if (!secret) {
    secret = generateTotpSecret();
    await context.env.DB.prepare(
      "UPDATE users SET totp_secret = ?, totp_enabled = 0 WHERE id = ?"
    ).bind(secret, user.id).run();
  }

  const uri = totpOtpauthUri(secret, user.email, "SalihTaskinSite");
  return jsonResponse({ enabled: false, secret, otpauth_uri: uri });
}

// POST: kullanıcı authenticator uygulamasından okuduğu 6 haneli kodu
// gönderir; doğruysa 2FA kalıcı olarak aktif edilir.
export async function onRequestPost(context) {
  const user = await getSessionUser(context);
  if (!user || user.role !== "admin") {
    return jsonResponse({ error: "forbidden" }, 403);
  }

  const body = await context.request.json().catch(() => ({}));
  const code = (body.code || "").toString();

  const row = await context.env.DB.prepare(
    "SELECT totp_secret FROM users WHERE id = ?"
  ).bind(user.id).first();

  if (!row || !row.totp_secret) {
    return jsonResponse({ error: "no_pending_setup" }, 400);
  }

  const ok = await verifyTotp(row.totp_secret, code);
  if (!ok) {
    return jsonResponse({ error: "invalid_code" }, 401);
  }

  await context.env.DB.prepare(
    "UPDATE users SET totp_enabled = 1 WHERE id = ?"
  ).bind(user.id).run();

  return jsonResponse({ ok: true });
}
