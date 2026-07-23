import { getSessionUser, jsonResponse } from "../../_lib/auth.js";

export async function onRequestGet(context) {
  const admin = await getSessionUser(context);
  if (!admin || admin.role !== "admin") {
    return jsonResponse({ error: "forbidden" }, 403);
  }

  try {
    const { results } = await context.env.DB.prepare(
      "SELECT key, lang, value, updated_at FROM content_blocks ORDER BY key"
    ).all();

    const overrides = {};
    (results || []).forEach(row => {
      if (!overrides[row.key]) overrides[row.key] = {};
      overrides[row.key][row.lang] = row.value;
    });

    return jsonResponse({ overrides });
  } catch (e) {
    return jsonResponse({ overrides: {}, migration_required: true });
  }
}

// POST body:
//  { action: 'save',  key, tr, en }  -> her iki dili de upsert eder
//  { action: 'reset', key }          -> özelleştirmeyi kaldırır (varsayılana döner)
export async function onRequestPost(context) {
  const admin = await getSessionUser(context);
  if (!admin || admin.role !== "admin") {
    return jsonResponse({ error: "forbidden" }, 403);
  }

  const db = context.env.DB;
  const body = await context.request.json().catch(() => ({}));
  const key = (body.key || "").toString().trim().slice(0, 100);

  if (!key) return jsonResponse({ error: "missing_fields" }, 400);

  if (body.action === "reset") {
    await db.prepare("DELETE FROM content_blocks WHERE key = ?").bind(key).run();
    return jsonResponse({ ok: true });
  }

  if (body.action === "save") {
    const tr = (body.tr || "").toString().slice(0, 5000);
    const en = (body.en || "").toString().slice(0, 5000);

    await db.prepare(
      `INSERT INTO content_blocks (key, lang, value, updated_at) VALUES (?, 'tr', ?, datetime('now'))
       ON CONFLICT(key, lang) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`
    ).bind(key, tr).run();

    await db.prepare(
      `INSERT INTO content_blocks (key, lang, value, updated_at) VALUES (?, 'en', ?, datetime('now'))
       ON CONFLICT(key, lang) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`
    ).bind(key, en).run();

    return jsonResponse({ ok: true });
  }

  return jsonResponse({ error: "invalid_action" }, 400);
}
