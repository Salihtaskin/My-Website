import { jsonResponse, getAllSettings } from "../_lib/auth.js";

// Herkese açık (giriş gerektirmez). Buradaki değerler sadece
// aç/kapa bayrakları ve eşik sayılarıdır — hiçbiri hassas veri
// değildir, bu yüzden ana sayfa (şaka ekranı gibi anonim ziyaretçi
// özellikleri) ve dashboard (quiz/rozet) aynı uç noktayı kullanabilir.
export async function onRequestGet(context) {
  const settings = await getAllSettings(context.env.DB);
  return jsonResponse({ settings });
}
