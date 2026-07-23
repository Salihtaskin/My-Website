import { getSessionUser, jsonResponse, getAllSettings, settingBool } from "../../_lib/auth.js";

export async function onRequestPost(context) {
  const user = await getSessionUser(context);
  if (!user) return jsonResponse({ error: "unauthorized" }, 401);

  const db = context.env.DB;
  const settings = await getAllSettings(db);
  if (!settingBool(settings, "feature.quiz")) {
    return jsonResponse({ enabled: false });
  }

  const body = await context.request.json().catch(() => ({}));
  const answers = Array.isArray(body.answers) ? body.answers : [];

  if (!answers.length) {
    return jsonResponse({ error: "missing_fields" }, 400);
  }

  const ids = answers.map(a => Number(a.id)).filter(Boolean);
  if (!ids.length) return jsonResponse({ error: "missing_fields" }, 400);

  const placeholders = ids.map(() => "?").join(",");
  const { results: questions } = await db.prepare(
    `SELECT id, correct_index FROM quiz_questions WHERE id IN (${placeholders})`
  ).bind(...ids).all();

  const correctMap = {};
  (questions || []).forEach(q => { correctMap[q.id] = q.correct_index; });

  let score = 0;
  const details = answers.map(a => {
    const id = Number(a.id);
    const selected = Number(a.selected);
    const correct_index = correctMap[id];
    const isCorrect = correct_index !== undefined && selected === correct_index;
    if (isCorrect) score++;
    return { id, selected, correct_index, is_correct: isCorrect };
  });

  const total = answers.length;

  const existing = await db.prepare(
    "SELECT best_score, best_total, attempts FROM quiz_scores WHERE user_id = ?"
  ).bind(user.id).first();

  const prevRatio = existing && existing.best_total > 0 ? existing.best_score / existing.best_total : -1;
  const newRatio = total > 0 ? score / total : 0;
  const shouldUpdateBest = !existing || newRatio > prevRatio;

  if (existing) {
    await db.prepare(
      `UPDATE quiz_scores SET
         best_score = ?, best_total = ?, attempts = attempts + 1, updated_at = datetime('now')
       WHERE user_id = ?`
    ).bind(
      shouldUpdateBest ? score : existing.best_score,
      shouldUpdateBest ? total : existing.best_total,
      user.id
    ).run();
  } else {
    await db.prepare(
      `INSERT INTO quiz_scores (user_id, best_score, best_total, attempts, updated_at)
       VALUES (?, ?, ?, 1, datetime('now'))`
    ).bind(user.id, score, total).run();
  }

  return jsonResponse({ ok: true, score, total, details });
}
