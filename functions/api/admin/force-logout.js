import { getSessionUser, jsonResponse } from "../../_lib/auth.js";

export async function onRequestPost(context) {
  const admin = await getSessionUser(context);
  if (!admin || admin.role !== "admin") {
    return jsonResponse({ error: "forbidden" }, 403);
  }

  const body = await context.request.json().catch(() => ({}));
  const user_id = Number(body.user_id);
  if (!user_id) return jsonResponse({ error: "missing_fields" }, 400);

  await context.env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(user_id).run();

  return jsonResponse({ ok: true });
}
