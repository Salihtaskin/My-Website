import { getSessionUser, jsonResponse } from "../../_lib/auth.js";

export async function onRequestGet(context) {
  const admin = await getSessionUser(context);
  if (!admin || admin.role !== "admin") {
    return jsonResponse({ error: "forbidden" }, 403);
  }

  try {
    const { results } = await context.env.DB.prepare(
      `SELECT id, question, option_a, option_b, option_c, option_d, correct_index, active
       FROM quiz_questions ORDER BY id`
    ).all();
    return jsonResponse({ questions: results || [] });
  } catch (e) {
    return jsonResponse({ questions: [], migration_required: true });
  }
}

// POST body:
//  { action: 'add', question, option_a, option_b, option_c, option_d, correct_index }
//  { action: 'toggle', id }               -> active/pasif değiştir
//  { action: 'delete', id }
export async function onRequestPost(context) {
  const admin = await getSessionUser(context);
  if (!admin || admin.role !== "admin") {
    return jsonResponse({ error: "forbidden" }, 403);
  }

  const db = context.env.DB;
  const body = await context.request.json().catch(() => ({}));

  if (body.action === "add") {
    const question = (body.question || "").toString().trim().slice(0, 500);
    const a = (body.option_a || "").toString().trim().slice(0, 200);
    const b = (body.option_b || "").toString().trim().slice(0, 200);
    const c = (body.option_c || "").toString().trim().slice(0, 200);
    const d = (body.option_d || "").toString().trim().slice(0, 200);
    const correctIndex = Number(body.correct_index);

    if (!question || !a || !b || !c || !d || ![0, 1, 2, 3].includes(correctIndex)) {
      return jsonResponse({ error: "missing_fields" }, 400);
    }

    await db.prepare(
      `INSERT INTO quiz_questions (question, option_a, option_b, option_c, option_d, correct_index, active)
       VALUES (?, ?, ?, ?, ?, ?, 1)`
    ).bind(question, a, b, c, d, correctIndex).run();

    return jsonResponse({ ok: true });
  }

  if (body.action === "toggle") {
    const id = Number(body.id);
    if (!id) return jsonResponse({ error: "missing_fields" }, 400);
    await db.prepare(
      "UPDATE quiz_questions SET active = 1 - active WHERE id = ?"
    ).bind(id).run();
    return jsonResponse({ ok: true });
  }

  if (body.action === "delete") {
    const id = Number(body.id);
    if (!id) return jsonResponse({ error: "missing_fields" }, 400);
    await db.prepare("DELETE FROM quiz_questions WHERE id = ?").bind(id).run();
    return jsonResponse({ ok: true });
  }

  return jsonResponse({ error: "invalid_action" }, 400);
}
