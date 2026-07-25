import { getSessionUser, jsonResponse } from "../../_lib/auth.js";

// GET: abone listesi (admin panelinde göstermek için)
export async function onRequestGet(context) {
  const admin = await getSessionUser(context);
  if (!admin || admin.role !== "admin") {
    return jsonResponse({ error: "forbidden" }, 403);
  }

  try {
    const { results } = await context.env.DB.prepare(
      "SELECT id, email, created_at FROM newsletter_subscribers ORDER BY created_at DESC"
    ).all();
    return jsonResponse({ subscribers: results || [] });
  } catch (e) {
    return jsonResponse({ subscribers: [], migration_required: true });
  }
}

// POST { action: 'delete', id } -> admin bir aboneyi elle silebilir
export async function onRequestPost(context) {
  const admin = await getSessionUser(context);
  if (!admin || admin.role !== "admin") {
    return jsonResponse({ error: "forbidden" }, 403);
  }

  const body = await context.request.json().catch(() => ({}));
  const id = Number(body.id);
  if (body.action === "delete" && id) {
    await context.env.DB.prepare("DELETE FROM newsletter_subscribers WHERE id = ?").bind(id).run();
    return jsonResponse({ ok: true });
  }

  return jsonResponse({ error: "invalid_action" }, 400);
}
