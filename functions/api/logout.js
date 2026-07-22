import { parseCookies, jsonResponse } from "../_lib/auth.js";

export async function onRequestPost(context) {
  const cookies = parseCookies(context.request);
  const token = cookies["session"];

  if (token) {
    await context.env.DB.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
  }

  const headers = {
    "Set-Cookie": "session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0"
  };

  return jsonResponse({ ok: true }, 200, headers);
}
