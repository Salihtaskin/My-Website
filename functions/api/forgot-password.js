import { jsonResponse, makeSessionToken } from "../_lib/auth.js";

const RESET_WINDOW_MIN = 30;

// Herkese açık. Kullanıcı e-postasını girer, hesap varsa sıfırlama linki
// mail ile gider. Hesap olsun ya da olmasın HER ZAMAN aynı "ok" cevabını
// döneriz — böylece bu uç nokta, sitede kayıtlı e-postaları taramak
// (enumeration) için kullanılamaz.
export async function onRequestPost(context) {
  const db = context.env.DB;
  const ip = context.request.headers.get("CF-Connecting-IP") || "unknown";
  const body = await context.request.json().catch(() => ({}));
  const email = (body.email || "").toString().trim().toLowerCase().slice(0, 160);

  if (!email) {
    return jsonResponse({ error: "missing_fields" }, 400);
  }

  try {
    // Aynı IP'den saatte 5'ten fazla sıfırlama isteğini engelle (spam/enumeration önleme)
    if (ip !== "unknown") {
      const recent = await db.prepare(
        `SELECT COUNT(*) AS cnt FROM password_reset_tokens
         WHERE ip = ? AND created_at >= datetime('now', '-1 hour')`
      ).bind(ip).first().catch(() => null);
      if (recent && recent.cnt >= 5) {
        return jsonResponse({ ok: true }); // sessizce geç, bilgi sızdırma
      }
    }

    const user = await db.prepare("SELECT id, full_name, email FROM users WHERE email = ?").bind(email).first();

    if (user) {
      const token = makeSessionToken();
      const expires = new Date(Date.now() + RESET_WINDOW_MIN * 60 * 1000).toISOString();

      await db.prepare(
        "INSERT INTO password_reset_tokens (token, user_id, ip, expires_at) VALUES (?, ?, ?, ?)"
      ).bind(token, user.id, ip, expires).run();

      if (context.env.RESEND_API_KEY) {
        const from = context.env.FROM_EMAIL || "onboarding@resend.dev";
        const siteUrl = context.env.SITE_URL || "https://salihtaskin.pages.dev";
        const resetLink = `${siteUrl}/reset-password.html?token=${encodeURIComponent(token)}`;
        try {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${context.env.RESEND_API_KEY}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              from,
              to: [user.email],
              subject: "Şifre sıfırlama isteği — Salih Taşkın",
              html: `<p>Merhaba ${user.full_name || ""},</p>
                     <p>Hesabın için bir şifre sıfırlama isteği alındı. Aşağıdaki linke tıklayarak yeni bir şifre belirleyebilirsin. Bu link ${RESET_WINDOW_MIN} dakika içinde geçerliliğini yitirecek.</p>
                     <p><a href="${resetLink}">${resetLink}</a></p>
                     <p>Bu isteği sen yapmadıysan bu maili yok sayabilirsin, hesabında herhangi bir değişiklik yapılmayacak.</p>`
            })
          });
        } catch (e) {
          // e-posta gönderilemese de aynı "ok" cevabı döneriz (bkz. üstteki not)
        }
      }
    }
  } catch (e) {
    // password_reset_tokens tablosu henüz yoksa (migration_v7.sql çalıştırılmadıysa)
    // sessizce geç, kullanıcıya yine de "ok" dön.
  }

  return jsonResponse({ ok: true });
}
