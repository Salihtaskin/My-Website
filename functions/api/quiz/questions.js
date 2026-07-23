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
      `SELECT id, question, option_a, option_b, option_c, option_d
       FROM quiz_questions WHERE active = 1 ORDER BY id`
    ).all();
    return jsonResponse({ enabled: true, questions: results || [] });
  } catch (e) {
    return jsonResponse({ enabled: true, questions: [], migration_required: true });
  }
}
