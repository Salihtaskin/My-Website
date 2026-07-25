import { jsonResponse } from "../_lib/auth.js";

// Herkese açık: sadece yayınlanmış (published=1) yazıların listesi.
// ?tag=xxx verilirse sadece o etikete sahip yazılar filtrelenir.
export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const tag = (url.searchParams.get("tag") || "").trim().toLowerCase();

  try {
    const { results } = await context.env.DB.prepare(
      `SELECT id, slug, title_tr, title_en, content_tr, content_en, tags, created_at
       FROM blog_posts WHERE published = 1 ORDER BY created_at DESC`
    ).all();

    let posts = results || [];
    if (tag) {
      posts = posts.filter(p => (p.tags || "")
        .split(",").map(t => t.trim().toLowerCase()).filter(Boolean).includes(tag));
    }

    return jsonResponse({ posts });
  } catch (e) {
    return jsonResponse({ posts: [], migration_required: true });
  }
}
