import { jsonResponse, EMAIL_RE } from "../_lib/auth.js";

// Herkese açık iletişim formu uç noktası. Spam korumaları:
//  - honeypot alanı (botlar genelde görünmez alanları da doldurur)
//  - aynı IP'den saatte 5 mesaj sınırı
export async function onRequestPost(context) {
  const db = context.env.DB;
  const ip = context.request.headers.get("CF-Connecting-IP") || "unknown";

  const body = await context.request.json().catch(() => ({}));
  const name = (body.name || "").toString().trim().slice(0, 120);
  const email = (body.email || "").toString().trim().toLowerCase().slice(0, 160);
  const message = (body.message || "").toString().trim().slice(0, 4000);
  const honeypot = (body.website || "").toString();

  // Honeypot doluysa bot kabul et, sessizce "başarılı" dön (botu bilgilendirme)
  if (honeypot) {
    return jsonResponse({ ok: true });
  }

  if (!name || !email || !message) {
    return jsonResponse({ error: "missing_fields" }, 400);
  }
  if (!EMAIL_RE.test(email)) {
    return jsonResponse({ error: "invalid_email" }, 400);
  }

  if (ip !== "unknown") {
    try {
      const recent = await db.prepare(
        `SELECT COUNT(*) AS cnt FROM contact_messages
         WHERE ip = ? AND created_at >= datetime('now', '-1 hour')`
      ).bind(ip).first();
      if (recent && recent.cnt >= 5) {
        return jsonResponse({ error: "rate_limited" }, 429);
      }
    } catch (e) { /* tablo yoksa sessizce geç */ }
  }

  try {
    await db.prepare(
      `INSERT INTO contact_messages (name, email, message, ip) VALUES (?, ?, ?, ?)`
    ).bind(name, email, message, ip).run();
  } catch (e) {
    return jsonResponse({ error: "server_error" }, 500);
  }

  // Resend yapılandırılmışsa site sahibine anlık e-posta bildirimi de gönder
  // (yapılandırılmamışsa mesaj yine de veritabanında/admin panelinde kalır).
  if (context.env.RESEND_API_KEY) {
    const to = context.env.ADMIN_EMAIL || "salihtaskin282282@gmail.com";
    const from = context.env.FROM_EMAIL || "onboarding@resend.dev";
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${context.env.RESEND_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from,
          to: [to],
          reply_to: email,
          subject: `Site iletişim formu: ${name}`,
          html: `<p><b>Gönderen:</b> ${name} (${email})</p><p><b>Mesaj:</b></p><p>${message.replace(/\n/g, "<br>")}</p>`
        })
      });
    } catch (e) {
      // e-posta gönderilemese de form gönderimi başarısız sayılmaz, mesaj DB'de duruyor
    }
  }

  return jsonResponse({ ok: true });
}
