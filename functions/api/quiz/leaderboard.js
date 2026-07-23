import { getSessionUser, jsonResponse, getAllSettings, settingBool } from "../../_lib/auth.js";

export async function onRequestGet(context) {
  const user = await getSessionUser(context);
  if (!user) return jsonResponse({ error: "unauthorized" }, 401);

  const db = context.env.DB;
  const settings = await getAllSettings(db);
  if (!settingBool(settings, "feature.quiz")) {
    return jsonResponse({ enabled: false });
  }

  try {
    const { results } = await db.prepare(
      `SELECT u.full_name, q.best_score, q.best_total
       FROM quiz_scores q JOIN users u ON u.id = q.user_id
       WHERE q.best_total > 0
       ORDER BY (CAST(q.best_score AS REAL) / q.best_total) DESC, q.best_score DESC
       LIMIT 10`
    ).all();
    return jsonResponse({ enabled: true, leaderboard: results || [] });
  } catch (e) {
    return jsonResponse({ enabled: true, leaderboard: [], migration_required: true });
  }
}
