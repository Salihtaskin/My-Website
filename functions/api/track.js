import { parseUserAgent, jsonResponse } from "../_lib/auth.js";

// Herkese açık, kimlik doğrulama gerektirmeyen uç nokta.
// js/main.js her sayfa yüklendiğinde burayı çağırır; sadece
// analitik amaçlı (IP, ülke, cihaz/tarayıcı/işletim sistemi,
// hangi sayfa) bir satır ekler. Kişisel içerik/şifre YOK.
export async function onRequestPost(context) {
  const db = context.env.DB;
  const ip = context.request.headers.get("CF-Connecting-IP") || "unknown";
  const ua = (context.request.headers.get("User-Agent") || "").slice(0, 255);
  const country = (context.request.cf && context.request.cf.country) || "XX";

  try {
    const body = await context.request.json().catch(() => ({}));
    const path = (body.path || "/").toString().slice(0, 200);
    const { device_type, os, browser } = parseUserAgent(ua);

    await db.prepare(
      `INSERT INTO page_visits (ip, country, path, user_agent, device_type, browser, os)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).bind(ip, country, path, ua, device_type, browser, os).run();

    return jsonResponse({ ok: true });
  } catch (e) {
    // page_visits tablosu henüz yoksa (migration_v3.sql çalıştırılmadıysa)
    // ya da başka bir hata olursa, sayfa yüklenişini asla bozma.
    return jsonResponse({ ok: false });
  }
}
