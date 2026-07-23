import { getSessionUser, jsonResponse, getAllSettings, DEFAULT_SETTINGS } from "../../_lib/auth.js";

export async function onRequestGet(context) {
  const admin = await getSessionUser(context);
  if (!admin || admin.role !== "admin") {
    return jsonResponse({ error: "forbidden" }, 403);
  }
  const settings = await getAllSettings(context.env.DB);
  return jsonResponse({ settings });
}

// POST body: { settings: { "feature.quiz": "0", "threat.yellow_threshold": "3", ... } }
// Bilinmeyen key'ler de kabul edilir (ileride genişletilebilir), ama sadece
// DEFAULT_SETTINGS içindeki key'ler dashboard'da gösterilir.
export async function onRequestPost(context) {
  const admin = await getSessionUser(context);
  if (!admin || admin.role !== "admin") {
    return jsonResponse({ error: "forbidden" }, 403);
  }

  const body = await context.request.json().catch(() => ({}));
  const updates = body.settings || {};
  const db = context.env.DB;

  try {
    for (const key of Object.keys(updates)) {
      if (!(key in DEFAULT_SETTINGS)) continue; // bilinmeyen key'leri yok say
      const value = (updates[key] ?? "").toString().slice(0, 500);
      await db.prepare(
        `INSERT INTO site_settings (key, value) VALUES (?, ?)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`
      ).bind(key, value).run();
    }
    return jsonResponse({ ok: true });
  } catch (e) {
    return jsonResponse({ error: "server_error", detail: String(e), migration_required: true }, 500);
  }
}
