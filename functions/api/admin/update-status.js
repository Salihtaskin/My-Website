import { getSessionUser, jsonResponse } from "../../_lib/auth.js";

const VALID_STATUS = ["pending", "approved", "rejected"];
const VALID_ROLE = ["user", "admin"];

export async function onRequestPost(context) {
  const admin = await getSessionUser(context);
  if (!admin || admin.role !== "admin") {
    return jsonResponse({ error: "forbidden" }, 403);
  }

  const body = await context.request.json().catch(() => ({}));
  const user_id = Number(body.user_id);
  const status = body.status;
  const role = body.role;

  if (!user_id) return jsonResponse({ error: "missing_fields" }, 400);
  if (status && !VALID_STATUS.includes(status)) {
    return jsonResponse({ error: "invalid_status" }, 400);
  }
  if (role && !VALID_ROLE.includes(role)) {
    return jsonResponse({ error: "invalid_role" }, 400);
  }
  if (user_id === admin.id && role === "user") {
    return jsonResponse({ error: "cannot_demote_self" }, 400);
  }

  if (status) {
    await context.env.DB.prepare("UPDATE users SET status = ? WHERE id = ?")
      .bind(status, user_id).run();
  }
  if (role) {
    await context.env.DB.prepare("UPDATE users SET role = ? WHERE id = ?")
      .bind(role, user_id).run();
  }

  return jsonResponse({ ok: true });
}
