import { jsonResponse } from "../../_lib/auth.js";

/*
  Günlük özet e-postası. Bu uç nokta ADMIN OTURUMU ile değil, gizli bir
  header (X-Cron-Secret) ile korunur; çünkü günde bir kez GitHub Actions
  (ya da başka bir zamanlayıcı) tarafından, kimse sitede giriş yapmışken
  değil, tetiklenir.

  Gerekli Cloudflare Pages ortam değişkenleri:
    CRON_SECRET     -> rastgele uzun bir gizli anahtar (GitHub secrets ile aynı olmalı)
    RESEND_API_KEY  -> resend.com üzerinden alınan ücretsiz API anahtarı
    ADMIN_EMAIL     -> özetin gönderileceği e-posta (yoksa salihtaskin282282@gmail.com)
    FROM_EMAIL      -> gönderen adres (Resend hesabı doğrulanmadıysa "onboarding@resend.dev" kullanılabilir)
*/

async function buildSummary(db) {
  const visits = await db.prepare(
    `SELECT COUNT(*) AS cnt, COUNT(DISTINCT ip) AS unique_ips FROM page_visits
     WHERE created_at >= datetime('now', '-1 day')`
  ).first().catch(() => ({ cnt: 0, unique_ips: 0 }));

  const { results: topCountries } = await db.prepare(
    `SELECT country, COUNT(*) AS cnt FROM page_visits
     WHERE created_at >= datetime('now', '-1 day')
     GROUP BY country ORDER BY cnt DESC LIMIT 3`
  ).all().catch(() => ({ results: [] }));

  const loginStats = await db.prepare(
    `SELECT COUNT(*) AS total,
            SUM(CASE WHEN success=1 THEN 1 ELSE 0 END) AS success_count,
            SUM(CASE WHEN success=0 THEN 1 ELSE 0 END) AS fail_count
     FROM login_events WHERE created_at >= datetime('now', '-1 day')`
  ).first().catch(() => ({ total: 0, success_count: 0, fail_count: 0 }));

  const pending = await db.prepare(
    `SELECT COUNT(*) AS cnt FROM users WHERE status = 'pending'`
  ).first().catch(() => ({ cnt: 0 }));

  const { results: blocked } = await db.prepare(
    `SELECT ip, reason FROM blocked_ips
     WHERE blocked_at >= datetime('now', '-1 day') ORDER BY blocked_at DESC LIMIT 10`
  ).all().catch(() => ({ results: [] }));

  return { visits, topCountries: topCountries || [], loginStats, pending, blocked: blocked || [] };
}

function renderHtml(s) {
  const countriesHtml = s.topCountries.length
    ? s.topCountries.map(c => `${c.country}: ${c.cnt}`).join(", ")
    : "veri yok";
  const blockedHtml = s.blocked.length
    ? s.blocked.map(b => `${b.ip} (${b.reason})`).join("<br>")
    : "Engellenen IP yok";

  return `
    <h2>Günlük Site Özeti — salihtaskin.pages.dev</h2>
    <p><b>Ziyaretler (son 24 saat):</b> ${s.visits.cnt || 0} istek, ${s.visits.unique_ips || 0} benzersiz IP</p>
    <p><b>En çok gelen ülkeler:</b> ${countriesHtml}</p>
    <p><b>Giriş denemeleri:</b> ${s.loginStats.total || 0} toplam
       (${s.loginStats.success_count || 0} başarılı, ${s.loginStats.fail_count || 0} başarısız)</p>
    <p><b>Onay bekleyen kayıt:</b> ${s.pending.cnt || 0}</p>
    <p><b>Son 24 saatte engellenen IP'ler:</b><br>${blockedHtml}</p>
    <hr>
    <p style="color:#888;font-size:12px;">Bu e-posta otomatik olarak günlük gönderilmiştir.</p>
  `;
}

async function handle(context) {
  const secret = context.request.headers.get("X-Cron-Secret") || "";
  if (!context.env.CRON_SECRET || secret !== context.env.CRON_SECRET) {
    return jsonResponse({ error: "forbidden" }, 403);
  }

  const db = context.env.DB;
  const summary = await buildSummary(db);
  const html = renderHtml(summary);

  const to = context.env.ADMIN_EMAIL || "salihtaskin282282@gmail.com";
  const from = context.env.FROM_EMAIL || "onboarding@resend.dev";

  if (!context.env.RESEND_API_KEY) {
    return jsonResponse({ ok: false, error: "RESEND_API_KEY tanımlı değil", summary });
  }

  try {
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${context.env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: "Günlük Site Özeti — salihtaskin.pages.dev",
        html
      })
    });

    const emailData = await emailRes.json().catch(() => ({}));
    return jsonResponse({ ok: emailRes.ok, email_response: emailData });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) }, 500);
  }
}

export async function onRequestGet(context) { return handle(context); }
export async function onRequestPost(context) { return handle(context); }
