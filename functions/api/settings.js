import { getSessionUser, jsonResponse, getAllSettings } from "../_lib/auth.js";

// Oturum açmış herhangi bir kullanıcı (admin olması şart değil) çağırabilir.
// Sadece kullanıcı tarafındaki özelliklerin (quiz, rozet) açık/kapalı olduğunu
// öğrenmek için; eşik değerleri gibi hassas olmayan bilgiler döner.
export async function onRequestGet(context) {
  const user = await getSessionUser(context);
  if (!user) return jsonResponse({ error: "unauthorized" }, 401);

  const settings = await getAllSettings(context.env.DB);
  return jsonResponse({ settings });
}
