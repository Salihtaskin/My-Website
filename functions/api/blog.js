import { jsonResponse } from "../_lib/auth.js";

// Herkese açık: sadece yayınlanmış (published=1) yazıların listesi.
export async function onRequestGet(context) {
  try {
    const { results } = await context.env.DB.prepare(
      `SELECT id, slug, title_tr, title_en, content_tr, content_en, created_at
       FROM blog_posts WHERE published = 1 ORDER BY created_at DESC`
    ).all();
    return jsonResponse({ posts: results || [] });
  } catch (e) {
    return jsonResponse({ posts: [], migration_required: true });
  }
}
