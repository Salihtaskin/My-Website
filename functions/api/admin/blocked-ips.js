import { getSessionUser, jsonResponse } from "../../_lib/auth.js";

// GET: engellenen IP listesi (aktif + geçmiş)
export async function onRequestGet(context) {
  const admin = await getSessionUser(context);
  if (!admin || admin.role !== "admin") {
    return jsonResponse({ error: "forbidden" }, 403);
  }

  try {
    const { results } = await context.env.DB.prepare(
      `SELECT ip, reason, blocked_at, blocked_until, created_by
       FROM blocked_ips ORDER BY blocked_at DESC LIMIT 200`
    ).all();
    return jsonResponse({ blocked: results || [] });
  } catch (e) {
    return jsonResponse({ blocked: [], migration_required: true });
  }
}

// POST: { action: 'block', ip, reason?, minutes? }  -> minutes yoksa süresiz
//       { action: 'unblock', ip }
export async function onRequestPost(context) {
  const admin = await getSessionUser(context);
  if (!admin || admin.role !== "admin") {
    return jsonResponse({ error: "forbidden" }, 403);
  }

  const body = await context.request.json().catch(() => ({}));
  const action = body.action;
  const ip = (body.ip || "").toString().trim();

  if (!ip) return jsonResponse({ error: "missing_fields" }, 400);

  if (action === "unblock") {
    await context.env.DB.prepare("DELETE FROM blocked_ips WHERE ip = ?").bind(ip).run();
    return jsonResponse({ ok: true });
  }

  if (action === "block") {
    const reason = (body.reason || "manual").toString().slice(0, 200);
    const minutes = Number(body.minutes) || null;
    const until = minutes ? new Date(Date.now() + minutes * 60 * 1000).toISOString() : null;

    await context.env.DB.prepare(
      `INSERT INTO blocked_ips (ip, reason, blocked_until, created_by)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(ip) DO UPDATE SET reason=excluded.reason, blocked_until=excluded.blocked_until, created_by=excluded.created_by`
    ).bind(ip, reason, until, admin.email).run();

    return jsonResponse({ ok: true });
  }

  return jsonResponse({ error: "invalid_action" }, 400);
}
