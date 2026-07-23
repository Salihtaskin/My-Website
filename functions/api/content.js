import { jsonResponse } from "../_lib/auth.js";

// Herkese açık: site (js/main.js), sayfa dilini uygulamadan önce
// bu uç noktadan admin tarafından özelleştirilmiş metinleri çeker
// ve translations.js'teki varsayılanların üzerine yazar.
export async function onRequestGet(context) {
  try {
    const { results } = await context.env.DB.prepare(
      "SELECT key, lang, value FROM content_blocks"
    ).all();

    const overrides = {};
    (results || []).forEach(row => {
      if (!overrides[row.key]) overrides[row.key] = {};
      overrides[row.key][row.lang] = row.value;
    });

    return jsonResponse({ overrides });
  } catch (e) {
    // content_blocks tablosu henüz yoksa (migration_v3.sql çalıştırılmadıysa)
    return jsonResponse({ overrides: {} });
  }
}
