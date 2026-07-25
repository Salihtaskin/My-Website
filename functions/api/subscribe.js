import { jsonResponse, EMAIL_RE, makeSessionToken, getAllSettings, settingBool } from "../_lib/auth.js";

// Herkese açık: blog sayfasındaki "yeni yazılardan haberdar ol" formu.
// Spam korumaları: honeypot alanı + aynı IP'den saatte 5 istek sınırı.
export async function onRequestPost(context) {
  const db = context.env.DB;
  const ip = context.request.headers.get("CF-Connecting-IP") || "unknown";

  const settings = await getAllSettings(db);
  if (!settingBool(settings, "feature.newsletter")) {
    return jsonResponse({ error: "newsletter_disabled" }, 403);
  }

  const body = await context.request.json().catch(() => ({}));
  const email = (body.email || "").toString().trim().toLowerCase().slice(0, 160);
  const honeypot = (body.website || "").toString();

  if (honeypot) return jsonResponse({ ok: true });
  if (!email || !EMAIL_RE.test(email)) {
    return jsonResponse({ error: "invalid_email" }, 400);
  }

  try {
    if (ip !== "unknown") {
      const recent = await db.prepare(
        `SELECT COUNT(*) AS cnt FROM newsletter_subscribers WHERE ip = ? AND created_at >= datetime('now', '-1 hour')`
      ).bind(ip).first();
      if (recent && recent.cnt >= 5) {
        return jsonResponse({ error: "rate_limited" }, 429);
      }
    }

    const existing = await db.prepare("SELECT id FROM newsletter_subscribers WHERE email = ?").bind(email).first();
    if (existing) {
      return jsonResponse({ ok: true, already_subscribed: true });
    }

    const unsubToken = makeSessionToken();
    await db.prepare(
      "INSERT INTO newsletter_subscribers (email, unsub_token, ip) VALUES (?, ?, ?)"
    ).bind(email, unsubToken, ip).run();

    return jsonResponse({ ok: true });
  } catch (e) {
    return jsonResponse({ error: "server_error" }, 500);
  }
}
