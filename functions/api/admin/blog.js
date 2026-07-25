import { getSessionUser, jsonResponse, getAllSettings, settingBool } from "../../_lib/auth.js";

function slugify(text) {
  const map = { ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u", Ç: "c", Ğ: "g", İ: "i", Ö: "o", Ş: "s", Ü: "u" };
  return text
    .toString()
    .split("").map(ch => map[ch] || ch).join("")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

function normalizeTags(raw) {
  return (raw || "")
    .toString()
    .split(",")
    .map(t => t.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 10)
    .join(",");
}

// Yazı yeni yayınlandığında (0 -> 1 geçişinde) tüm abonelere Resend ile
// bilgilendirme maili gönderir. RESEND_API_KEY yoksa ya da özellik Ayarlar'dan
// kapatılmışsa sessizce hiçbir şey yapmaz.
async function notifySubscribers(context, post) {
  const db = context.env.DB;
  if (!context.env.RESEND_API_KEY) return;

  const settings = await getAllSettings(db);
  if (!settingBool(settings, "feature.newsletter")) return;

  let subscribers = [];
  try {
    const { results } = await db.prepare("SELECT email, unsub_token FROM newsletter_subscribers").all();
    subscribers = results || [];
  } catch (e) {
    return; // newsletter_subscribers tablosu henüz yoksa (migration_v7.sql çalıştırılmadıysa) sessizce geç
  }
  if (!subscribers.length) return;

  const from = context.env.FROM_EMAIL || "onboarding@resend.dev";
  const siteUrl = context.env.SITE_URL || "https://salihtaskin.pages.dev";
  const postUrl = `${siteUrl}/blog-post.html?slug=${encodeURIComponent(post.slug)}`;

  // Resend'in ücretsiz planında tek tek istek atmak gerekiyor (toplu alıcı listesi yok);
  // abone sayısı azken bu sorun olmaz. context.waitUntil ile isteğe cevabı beklemeden gönderiyoruz.
  const sendAll = subscribers.map(sub => {
    const unsubUrl = `${siteUrl}/api/unsubscribe?token=${encodeURIComponent(sub.unsub_token)}`;
    return fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${context.env.RESEND_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from,
        to: [sub.email],
        subject: `Yeni blog yazısı: ${post.title_tr}`,
        html: `<p>Merhaba,</p>
               <p>Yeni bir yazı yayınladım: <b>${post.title_tr}</b></p>
               <p><a href="${postUrl}">${postUrl}</a></p>
               <hr>
               <p style="color:#888;font-size:12px;">Bu maili almak istemiyorsan <a href="${unsubUrl}">buradan abonelikten çıkabilirsin</a>.</p>`
      })
    }).catch(() => {});
  });

  context.waitUntil(Promise.all(sendAll));
}

export async function onRequestGet(context) {
  const admin = await getSessionUser(context);
  if (!admin || admin.role !== "admin") {
    return jsonResponse({ error: "forbidden" }, 403);
  }

  try {
    const { results } = await context.env.DB.prepare(
      `SELECT id, slug, title_tr, title_en, content_tr, content_en, tags, published, created_at
       FROM blog_posts ORDER BY created_at DESC`
    ).all();
    return jsonResponse({ posts: results || [] });
  } catch (e) {
    return jsonResponse({ posts: [], migration_required: true });
  }
}

// POST body:
//  { action: 'add', title_tr, title_en, content_tr, content_en, tags }
//  { action: 'toggle_publish', id }
//  { action: 'delete', id }
export async function onRequestPost(context) {
  const admin = await getSessionUser(context);
  if (!admin || admin.role !== "admin") {
    return jsonResponse({ error: "forbidden" }, 403);
  }

  const db = context.env.DB;
  const body = await context.request.json().catch(() => ({}));

  if (body.action === "add") {
    const title_tr = (body.title_tr || "").toString().trim().slice(0, 200);
    const title_en = (body.title_en || "").toString().trim().slice(0, 200);
    const content_tr = (body.content_tr || "").toString().trim().slice(0, 20000);
    const content_en = (body.content_en || "").toString().trim().slice(0, 20000);
    const tags = normalizeTags(body.tags);

    if (!title_tr || !title_en || !content_tr || !content_en) {
      return jsonResponse({ error: "missing_fields" }, 400);
    }

    let slug = slugify(title_tr) || ("yazi-" + Date.now());
    const existing = await db.prepare("SELECT id FROM blog_posts WHERE slug = ?").bind(slug).first();
    if (existing) slug = slug + "-" + Date.now().toString().slice(-5);

    try {
      await db.prepare(
        `INSERT INTO blog_posts (slug, title_tr, title_en, content_tr, content_en, tags, published)
         VALUES (?, ?, ?, ?, ?, ?, 0)`
      ).bind(slug, title_tr, title_en, content_tr, content_en, tags).run();
    } catch (e) {
      // tags sütunu henüz yoksa (migration_v7.sql çalıştırılmadıysa) tagsiz dene
      await db.prepare(
        `INSERT INTO blog_posts (slug, title_tr, title_en, content_tr, content_en, published)
         VALUES (?, ?, ?, ?, ?, 0)`
      ).bind(slug, title_tr, title_en, content_tr, content_en).run();
    }

    return jsonResponse({ ok: true, slug });
  }

  if (body.action === "toggle_publish") {
    const id = Number(body.id);
    if (!id) return jsonResponse({ error: "missing_fields" }, 400);

    const before = await db.prepare("SELECT published FROM blog_posts WHERE id = ?").bind(id).first();

    await db.prepare(
      "UPDATE blog_posts SET published = 1 - published, updated_at = datetime('now') WHERE id = ?"
    ).bind(id).run();

    // Sadece taslaktan yayına geçtiyse (0 -> 1) abonelere haber ver
    if (before && Number(before.published) === 0) {
      const post = await db.prepare("SELECT slug, title_tr FROM blog_posts WHERE id = ?").bind(id).first();
      if (post) await notifySubscribers(context, post);
    }

    return jsonResponse({ ok: true });
  }

  if (body.action === "delete") {
    const id = Number(body.id);
    if (!id) return jsonResponse({ error: "missing_fields" }, 400);
    await db.prepare("DELETE FROM blog_posts WHERE id = ?").bind(id).run();
    try {
      await db.prepare("DELETE FROM blog_comments WHERE post_id = ?").bind(id).run();
    } catch (e) { /* blog_comments tablosu henüz yoksa sessizce geç */ }
    return jsonResponse({ ok: true });
  }

  return jsonResponse({ error: "invalid_action" }, 400);
}
