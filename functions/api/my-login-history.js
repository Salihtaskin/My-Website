import { getSessionUser, jsonResponse } from "../_lib/auth.js";

export async function onRequestGet(context) {
  const user = await getSessionUser(context);
  if (!user) return jsonResponse({ error: "unauthorized" }, 401);

  const { results } = await context.env.DB.prepare(
    `SELECT created_at, ip, user_agent, success
     FROM login_events WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`
  ).bind(user.id).all().catch(() => ({ results: [] }));

  return jsonResponse({ events: results || [] });
}
