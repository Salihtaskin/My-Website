import { jsonResponse } from "../_lib/auth.js";

// Herkese açık: bildirim maillerinin altındaki "abonelikten çık" linki.
// GET /api/unsubscribe?token=... -> token'a sahip aboneyi siler.
export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const token = (url.searchParams.get("token") || "").trim();

  if (!token) {
    return new Response("Geçersiz link.", { status: 400, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }

  try {
    await context.env.DB.prepare("DELETE FROM newsletter_subscribers WHERE unsub_token = ?").bind(token).run();
  } catch (e) {
    // sessizce geç
  }

  return new Response(
    "Abonelikten cikildi. Bu sekmeyi kapatabilirsin. / You have been unsubscribed. You can close this tab.",
    { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8" } }
  );
}
