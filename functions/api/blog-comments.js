import { jsonResponse, EMAIL_RE, getAllSettings, settingBool } from "../_lib/auth.js";

// GET /api/blog-comments?post_id=5 -> onaylanmış (approved=1) yorumlar, herkese açık.
export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const postId = Number(url.searchParams.get("post_id"));
  if (!postId) return jsonResponse({ comments: [] });

  try {
    const { results } = await context.env.DB.prepare(
      `SELECT id, name, comment_text, created_at FROM blog_comments
       WHERE post_id = ? AND approved = 1 ORDER BY created_at ASC`
    ).bind(postId).all();
    return jsonResponse({ comments: results || [] });
  } catch (e) {
    return jsonResponse({ comments: [] });
  }
}

// POST /api/blog-comments -> yeni yorum gönder (admin onayı bekler).
// Spam korumaları: honeypot alanı + aynı IP'den saatte 5 yorum sınırı.
export async function onRequestPost(context) {
  const db = context.env.DB;
  const ip = context.request.headers.get("CF-Connecting-IP") || "unknown";

  const settings = await getAllSettings(db);
  if (!settingBool(settings, "feature.comments")) {
    return jsonResponse({ error: "comments_disabled" }, 403);
  }

  const body = await context.request.json().catch(() => ({}));
  const postId = Number(body.post_id);
  const name = (body.name || "").toString().trim().slice(0, 120);
  const email = (body.email || "").toString().trim().toLowerCase().slice(0, 160);
  const comment_text = (body.comment || "").toString().trim().slice(0, 2000);
  const honeypot = (body.website || "").toString();

  if (honeypot) return jsonResponse({ ok: true }); // botu sessizce yut

  if (!postId || !name || !comment_text) {
    return jsonResponse({ error: "missing_fields" }, 400);
  }
  if (email && !EMAIL_RE.test(email)) {
    return jsonResponse({ error: "invalid_email" }, 400);
  }

  try {
    const post = await db.prepare("SELECT id FROM blog_posts WHERE id = ? AND published = 1").bind(postId).first();
    if (!post) return jsonResponse({ error: "not_found" }, 404);

    if (ip !== "unknown") {
      const recent = await db.prepare(
        `SELECT COUNT(*) AS cnt FROM blog_comments WHERE ip = ? AND created_at >= datetime('now', '-1 hour')`
      ).bind(ip).first();
      if (recent && recent.cnt >= 5) {
        return jsonResponse({ error: "rate_limited" }, 429);
      }
    }

    await db.prepare(
      `INSERT INTO blog_comments (post_id, name, email, comment_text, ip, approved)
       VALUES (?, ?, ?, ?, ?, 0)`
    ).bind(postId, name, email || null, comment_text, ip).run();

    return jsonResponse({ ok: true });
  } catch (e) {
    return jsonResponse({ error: "server_error" }, 500);
  }
}
