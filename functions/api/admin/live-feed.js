import { getSessionUser, jsonResponse, getAllSettings, settingBool, settingInt } from "../../_lib/auth.js";

export async function onRequestGet(context) {
  const admin = await getSessionUser(context);
  if (!admin || admin.role !== "admin") {
    return jsonResponse({ error: "forbidden" }, 403);
  }

  const db = context.env.DB;
  const settings = await getAllSettings(db);

  if (!settingBool(settings, "feature.terminal_log")) {
    return jsonResponse({ enabled: false });
  }

  const maxEvents = settingInt(settings, "terminal.max_events", 30);

  try {
    const { results } = await db.prepare(
      `SELECT created_at, type, text FROM (
         SELECT created_at,
                CASE WHEN success = 1 THEN 'login_ok' ELSE 'login_fail' END AS type,
                CASE WHEN success = 1
                     THEN '[OK] giris basarili: ' || COALESCE(email, '?') || ' (' || COALESCE(ip, '?') || ')'
                     ELSE '[FAIL] basarisiz giris: ' || COALESCE(email, '?') || ' (' || COALESCE(ip, '?') || ')'
                END AS text
         FROM login_events

         UNION ALL

         SELECT blocked_at AS created_at, 'blocked' AS type,
                '[BLOCK] IP engellendi: ' || ip || ' (' || COALESCE(reason, '-') || ')' AS text
         FROM blocked_ips

         UNION ALL

         SELECT created_at, 'visit' AS type,
                '[VISIT] ' || COALESCE(country, '??') || ' / ' || COALESCE(device_type, '?') || ' -> ' || COALESCE(path, '/') AS text
         FROM page_visits
       )
       ORDER BY created_at DESC
       LIMIT ?`
    ).bind(maxEvents).all();

    return jsonResponse({ enabled: true, events: results || [] });
  } catch (e) {
    return jsonResponse({ enabled: true, events: [], migration_required: true });
  }
}
