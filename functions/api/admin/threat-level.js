import { getSessionUser, jsonResponse, getAllSettings, settingBool, settingInt } from "../../_lib/auth.js";

export async function onRequestGet(context) {
  const admin = await getSessionUser(context);
  if (!admin || admin.role !== "admin") {
    return jsonResponse({ error: "forbidden" }, 403);
  }

  const db = context.env.DB;
  const settings = await getAllSettings(db);

  if (!settingBool(settings, "feature.threat_level")) {
    return jsonResponse({ enabled: false });
  }

  const yellow = settingInt(settings, "threat.yellow_threshold", 2);
  const red = settingInt(settings, "threat.red_threshold", 5);

  try {
    const bruteForce = await db.prepare(
      `SELECT COUNT(*) AS cnt FROM (
         SELECT ip FROM login_events
         WHERE success = 0 AND ip IS NOT NULL AND ip != 'unknown'
           AND created_at >= datetime('now', '-15 minutes')
         GROUP BY ip HAVING COUNT(*) >= 5
       )`
    ).first().catch(() => ({ cnt: 0 }));

    const credStuffing = await db.prepare(
      `SELECT COUNT(*) AS cnt FROM (
         SELECT email FROM login_events
         WHERE success = 0 AND email IS NOT NULL
           AND created_at >= datetime('now', '-30 minutes')
         GROUP BY email HAVING COUNT(DISTINCT ip) >= 3
       )`
    ).first().catch(() => ({ cnt: 0 }));

    const blocked = await db.prepare(
      `SELECT COUNT(*) AS cnt FROM blocked_ips WHERE blocked_at >= datetime('now', '-1 day')`
    ).first().catch(() => ({ cnt: 0 }));

    const score = (bruteForce.cnt || 0) + (credStuffing.cnt || 0) + (blocked.cnt || 0);
    const level = score >= red ? "red" : (score >= yellow ? "yellow" : "green");

    return jsonResponse({ enabled: true, score, level });
  } catch (e) {
    return jsonResponse({ enabled: true, score: 0, level: "green", migration_required: true });
  }
}
