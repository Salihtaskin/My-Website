import { getSessionUser, jsonResponse } from "../../_lib/auth.js";

export async function onRequestGet(context) {
  const admin = await getSessionUser(context);
  if (!admin || admin.role !== "admin") {
    return jsonResponse({ error: "forbidden" }, 403);
  }

  try {
    const { results } = await context.env.DB.prepare(
      `SELECT id, name, email, message, ip, is_read, created_at
       FROM contact_messages ORDER BY created_at DESC LIMIT 200`
    ).all();
    return jsonResponse({ messages: results || [] });
  } catch (e) {
    return jsonResponse({ messages: [], migration_required: true });
  }
}

// POST body: { action: 'mark_read', id } | { action: 'delete', id }
export async function onRequestPost(context) {
  const admin = await getSessionUser(context);
  if (!admin || admin.role !== "admin") {
    return jsonResponse({ error: "forbidden" }, 403);
  }

  const db = context.env.DB;
  const body = await context.request.json().catch(() => ({}));
  const id = Number(body.id);
  if (!id) return jsonResponse({ error: "missing_fields" }, 400);

  if (body.action === "mark_read") {
    await db.prepare("UPDATE contact_messages SET is_read = 1 WHERE id = ?").bind(id).run();
    return jsonResponse({ ok: true });
  }
  if (body.action === "delete") {
    await db.prepare("DELETE FROM contact_messages WHERE id = ?").bind(id).run();
    return jsonResponse({ ok: true });
  }
  return jsonResponse({ error: "invalid_action" }, 400);
}
