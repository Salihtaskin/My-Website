import { getSessionUser, jsonResponse } from "../_lib/auth.js";

export async function onRequestGet(context) {
  const user = await getSessionUser(context);
  if (!user) return jsonResponse({ error: "unauthorized" }, 401);
  return jsonResponse({ user });
}
