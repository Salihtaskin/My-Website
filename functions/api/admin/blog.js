import { getSessionUser, jsonResponse } from "../../_lib/auth.js";

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

export async function onRequestGet(context) {
  const admin = await getSessionUser(context);
  if (!admin || admin.role !== "admin") {
    return jsonResponse({ error: "forbidden" }, 403);
  }

  try {
    const { results } = await context.env.DB.prepare(
      `SELECT id, slug, title_tr, title_en, content_tr, content_en, published, created_at
       FROM blog_posts ORDER BY created_at DESC`
    ).all();
    return jsonResponse({ posts: results || [] });
  } catch (e) {
    return jsonResponse({ posts: [], migration_required: true });
  }
}

// POST body:
//  { action: 'add', title_tr, title_en, content_tr, content_en }
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

    if (!title_tr || !title_en || !content_tr || !content_en) {
      return jsonResponse({ error: "missing_fields" }, 400);
    }

    let slug = slugify(title_tr) || ("yazi-" + Date.now());
    const existing = await db.prepare("SELECT id FROM blog_posts WHERE slug = ?").bind(slug).first();
    if (existing) slug = slug + "-" + Date.now().toString().slice(-5);

    await db.prepare(
      `INSERT INTO blog_posts (slug, title_tr, title_en, content_tr, content_en, published)
       VALUES (?, ?, ?, ?, ?, 0)`
    ).bind(slug, title_tr, title_en, content_tr, content_en).run();

    return jsonResponse({ ok: true, slug });
  }

  if (body.action === "toggle_publish") {
    const id = Number(body.id);
    if (!id) return jsonResponse({ error: "missing_fields" }, 400);
    await db.prepare(
      "UPDATE blog_posts SET published = 1 - published, updated_at = datetime('now') WHERE id = ?"
    ).bind(id).run();
    return jsonResponse({ ok: true });
  }

  if (body.action === "delete") {
    const id = Number(body.id);
    if (!id) return jsonResponse({ error: "missing_fields" }, 400);
    await db.prepare("DELETE FROM blog_posts WHERE id = ?").bind(id).run();
    return jsonResponse({ ok: true });
  }

  return jsonResponse({ error: "invalid_action" }, 400);
}
