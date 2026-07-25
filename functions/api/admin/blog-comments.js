import { getSessionUser, jsonResponse } from "../../_lib/auth.js";

// GET: tüm yorumları (post başlığıyla birlikte) admin panelinde listelemek için.
export async function onRequestGet(context) {
  const admin = await getSessionUser(context);
  if (!admin || admin.role !== "admin") {
    return jsonResponse({ error: "forbidden" }, 403);
  }

  try {
    const { results } = await context.env.DB.prepare(
      `SELECT c.id, c.post_id, c.name, c.email, c.comment_text, c.approved, c.created_at,
              p.title_tr AS post_title, p.slug AS post_slug
       FROM blog_comments c
       LEFT JOIN blog_posts p ON p.id = c.post_id
       ORDER BY c.created_at DESC`
    ).all();
    return jsonResponse({ comments: results || [] });
  } catch (e) {
    return jsonResponse({ comments: [], migration_required: true });
  }
}

// POST body:
//  { action: 'approve', id }
//  { action: 'delete', id }
export async function onRequestPost(context) {
  const admin = await getSessionUser(context);
  if (!admin || admin.role !== "admin") {
    return jsonResponse({ error: "forbidden" }, 403);
  }

  const db = context.env.DB;
  const body = await context.request.json().catch(() => ({}));
  const id = Number(body.id);
  if (!id) return jsonResponse({ error: "missing_fields" }, 400);

  if (body.action === "approve") {
    await db.prepare("UPDATE blog_comments SET approved = 1 WHERE id = ?").bind(id).run();
    return jsonResponse({ ok: true });
  }

  if (body.action === "delete") {
    await db.prepare("DELETE FROM blog_comments WHERE id = ?").bind(id).run();
    return jsonResponse({ ok: true });
  }

  return jsonResponse({ error: "invalid_action" }, 400);
}
