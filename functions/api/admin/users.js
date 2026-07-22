import { getSessionUser, jsonResponse } from "../../_lib/auth.js";

export async function onRequestGet(context) {
  const admin = await getSessionUser(context);
  if (!admin || admin.role !== "admin") {
    return jsonResponse({ error: "forbidden" }, 403);
  }

  let results;
  try {
    ({ results } = await context.env.DB.prepare(
      `SELECT id, full_name, email, phone, role, status, created_at,
              registered_ip, last_login_at, last_login_ip
       FROM users ORDER BY created_at DESC`
    ).all());
  } catch (e) {
    // migration_v2.sql henüz çalıştırılmadıysa (yeni sütunlar yoksa) eski sorguya düş
    ({ results } = await context.env.DB.prepare(
      `SELECT id, full_name, email, phone, role, status, created_at
       FROM users ORDER BY created_at DESC`
    ).all());
  }

  return jsonResponse({ users: results || [] });
}
