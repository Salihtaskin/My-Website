import { getSessionUser, jsonResponse } from "../../_lib/auth.js";

export async function onRequestGet(context) {
  const admin = await getSessionUser(context);
  if (!admin || admin.role !== "admin") {
    return jsonResponse({ error: "forbidden" }, 403);
  }

  const db = context.env.DB;

  try {
    const live = await db.prepare(
      `SELECT COUNT(DISTINCT ip) AS cnt FROM page_visits
       WHERE created_at >= datetime('now', '-5 minutes')`
    ).first();

    const today = await db.prepare(
      `SELECT COUNT(*) AS cnt, COUNT(DISTINCT ip) AS unique_ips FROM page_visits
       WHERE created_at >= datetime('now', '-1 day')`
    ).first();

    const { results: byDevice } = await db.prepare(
      `SELECT device_type, COUNT(*) AS cnt FROM page_visits
       WHERE created_at >= datetime('now', '-30 days')
       GROUP BY device_type ORDER BY cnt DESC`
    ).all();

    const { results: byBrowser } = await db.prepare(
      `SELECT browser, COUNT(*) AS cnt FROM page_visits
       WHERE created_at >= datetime('now', '-30 days')
       GROUP BY browser ORDER BY cnt DESC LIMIT 8`
    ).all();

    const { results: byOs } = await db.prepare(
      `SELECT os, COUNT(*) AS cnt FROM page_visits
       WHERE created_at >= datetime('now', '-30 days')
       GROUP BY os ORDER BY cnt DESC LIMIT 8`
    ).all();

    const { results: byCountry } = await db.prepare(
      `SELECT country, COUNT(*) AS cnt FROM page_visits
       WHERE created_at >= datetime('now', '-30 days')
       GROUP BY country ORDER BY cnt DESC LIMIT 10`
    ).all();

    const { results: topPages } = await db.prepare(
      `SELECT path, COUNT(*) AS cnt FROM page_visits
       WHERE created_at >= datetime('now', '-30 days')
       GROUP BY path ORDER BY cnt DESC LIMIT 10`
    ).all();

    const { results: recentVisits } = await db.prepare(
      `SELECT ip, country, path, device_type, browser, os, created_at
       FROM page_visits ORDER BY created_at DESC LIMIT 50`
    ).all();

    return jsonResponse({
      live_visitors: (live && live.cnt) || 0,
      today: today || { cnt: 0, unique_ips: 0 },
      by_device: byDevice || [],
      by_browser: byBrowser || [],
      by_os: byOs || [],
      by_country: byCountry || [],
      top_pages: topPages || [],
      recent: recentVisits || []
    });
  } catch (err) {
    return jsonResponse({
      live_visitors: 0,
      today: { cnt: 0, unique_ips: 0 },
      by_device: [], by_browser: [], by_os: [], by_country: [], top_pages: [], recent: [],
      migration_required: true
    });
  }
}
