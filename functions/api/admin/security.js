import { getSessionUser, jsonResponse } from "../../_lib/auth.js";

/*
  Basit kural tabanlı anomali tespiti:
  - Brute force şüphesi: son 15 dakikada aynı IP'den >=5 başarısız giriş denemesi
  - Kimlik bilgisi (credential stuffing) şüphesi: son 30 dakikada aynı e-postaya
    >=3 farklı IP'den başarısız deneme
  Bu bir SIEM/IDS değildir; küçük ölçekli bir kişisel site için görünürlük
  sağlamak amacıyla D1 üzerinde basit SQL sorgularıyla hesaplanır.
*/

export async function onRequestGet(context) {
  const admin = await getSessionUser(context);
  if (!admin || admin.role !== "admin") {
    return jsonResponse({ error: "forbidden" }, 403);
  }

  const db = context.env.DB;

  try {
    const { results: events } = await db.prepare(
      `SELECT id, user_id, email, ip, user_agent, success, reason, created_at
       FROM login_events
       ORDER BY created_at DESC
       LIMIT 150`
    ).all();

    const stats = await db.prepare(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) AS success_count,
         SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) AS fail_count,
         COUNT(DISTINCT ip) AS unique_ips
       FROM login_events
       WHERE created_at >= datetime('now', '-1 day')`
    ).first();

    const { results: bruteForce } = await db.prepare(
      `SELECT ip, COUNT(*) AS attempts, MAX(created_at) AS last_attempt
       FROM login_events
       WHERE success = 0 AND ip IS NOT NULL AND ip != 'unknown'
         AND created_at >= datetime('now', '-15 minutes')
       GROUP BY ip
       HAVING attempts >= 5
       ORDER BY attempts DESC`
    ).all();

    const { results: credStuffing } = await db.prepare(
      `SELECT email, COUNT(DISTINCT ip) AS ip_count, COUNT(*) AS attempts, MAX(created_at) AS last_attempt
       FROM login_events
       WHERE success = 0 AND email IS NOT NULL
         AND created_at >= datetime('now', '-30 minutes')
       GROUP BY email
       HAVING ip_count >= 3
       ORDER BY ip_count DESC`
    ).all();

    return jsonResponse({
      stats: stats || { total: 0, success_count: 0, fail_count: 0, unique_ips: 0 },
      events: events || [],
      anomalies: {
        brute_force: bruteForce || [],
        credential_stuffing: credStuffing || []
      }
    });
  } catch (err) {
    // login_events tablosu henüz yoksa (migration çalıştırılmadıysa) boş/uyumlu yanıt dön
    return jsonResponse({
      stats: { total: 0, success_count: 0, fail_count: 0, unique_ips: 0 },
      events: [],
      anomalies: { brute_force: [], credential_stuffing: [] },
      migration_required: true
    });
  }
}
