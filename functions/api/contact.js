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

  // Resend yapılandırılmışsa iki e-posta gönderilir:
  //  1) Site sahibine bildirim (yeni mesaj geldi)
  //  2) Mesajı gönderen kişiye otomatik "aldık, teşekkürler" onay e-postası
  // Not: FROM_EMAIL varsayılan olarak Resend'in "onboarding@resend.dev" test
  // adresiyse, Resend SADECE senin kendi hesap e-postana gönderime izin verir;
  // ziyaretçiye otomatik e-posta gitmesi için Resend'de kendi domainini
  // doğrulaman ve FROM_EMAIL'i o domainden bir adrese çevirmen gerekir.
  // README'deki "v7 - Ziyaretçiye otomatik e-posta" bölümüne bak.
  let autoReplySent = false;

  if (context.env.RESEND_API_KEY) {
    const adminTo = context.env.ADMIN_EMAIL || "salihtaskin282282@gmail.com";
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
          to: [adminTo],
          reply_to: email,
          subject: `Site iletişim formu: ${name}`,
          html: `<p><b>Gönderen:</b> ${name} (${email})</p><p><b>Mesaj:</b></p><p>${message.replace(/\n/g, "<br>")}</p>`
        })
      });
    } catch (e) {
      // bildirim gönderilemese de form gönderimi başarısız sayılmaz, mesaj DB'de duruyor
    }

    try {
      const autoReplyRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${context.env.RESEND_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from,
          to: [email],
          subject: "Mesajın bana ulaştı — Salih Taşkın",
          html: `
            <p>Merhaba ${name},</p>
            <p>Mesajın için teşekkürler, bana ulaştı. En kısa sürede dönüş yapacağım.</p>
            <p style="color:#888;">Gönderdiğin mesaj:</p>
            <blockquote style="border-left:3px solid #00875f;margin:0;padding-left:12px;color:#555;">
              ${message.replace(/\n/g, "<br>")}
            </blockquote>
            <p style="margin-top:20px;">— Salih Taşkın<br>salihtaskin.pages.dev</p>
          `
        })
      });
      autoReplySent = autoReplyRes.ok;
    } catch (e) {
      // otomatik yanıt gönderilemedi (muhtemelen domain doğrulanmadı), sorun değil
    }
  }

  return jsonResponse({ ok: true, auto_reply_sent: autoReplySent });
}
