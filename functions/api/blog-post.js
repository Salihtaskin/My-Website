import { jsonResponse } from "../_lib/auth.js";

// Herkese açık: slug'a göre tek bir yayınlanmış yazı.
export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const slug = (url.searchParams.get("slug") || "").trim();
  if (!slug) return jsonResponse({ error: "missing_slug" }, 400);

  try {
    const post = await context.env.DB.prepare(
      `SELECT id, slug, title_tr, title_en, content_tr, content_en, created_at
       FROM blog_posts WHERE slug = ? AND published = 1`
    ).bind(slug).first();

    if (!post) return jsonResponse({ error: "not_found" }, 404);
    return jsonResponse({ post });
  } catch (e) {
    return jsonResponse({ error: "not_found" }, 404);
  }
}
