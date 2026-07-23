import { jsonResponse, parseUserAgent } from "../_lib/auth.js";

// Herkese açık: ziyaretçiye KENDİ IP/ülke/cihaz bilgisini döner.
// Bu bilgiler zaten her istekte sunucuya gidiyor (CF-Connecting-IP,
// User-Agent) - burada sadece "şaka" ekranında göstermek için aynı
// bilgiyi ziyaretçiye geri yansıtıyoruz. Başka birinin bilgisini
// göstermez, sadece isteği yapanınkini.
export async function onRequestGet(context) {
  const ip = context.request.headers.get("CF-Connecting-IP") || "bilinmiyor";
  const country = (context.request.cf && context.request.cf.country) || "??";
  const city = (context.request.cf && context.request.cf.city) || "";
  const ua = context.request.headers.get("User-Agent") || "";
  const { device_type, os, browser } = parseUserAgent(ua);

  return jsonResponse({ ip, country, city, device_type, os, browser });
}
