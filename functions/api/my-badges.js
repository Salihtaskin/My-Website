import { getSessionUser, jsonResponse, getAllSettings, settingBool, settingInt } from "../_lib/auth.js";

function computeStreak(dateStrings) {
  // dateStrings: 'YYYY-MM-DD' formatında, azalan sırada, tekrarsız
  if (!dateStrings.length) return 0;

  const toDate = (s) => new Date(s + "T00:00:00Z");
  const oneDayMs = 24 * 60 * 60 * 1000;

  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const yesterdayStr = new Date(today.getTime() - oneDayMs).toISOString().slice(0, 10);

  // Seri, en son giriş bugün ya da dün değilse kırılmış sayılır (0 döner)
  if (dateStrings[0] !== todayStr && dateStrings[0] !== yesterdayStr) return 0;

  let streak = 1;
  for (let i = 0; i < dateStrings.length - 1; i++) {
    const cur = toDate(dateStrings[i]);
    const prev = toDate(dateStrings[i + 1]);
    const diffDays = Math.round((cur - prev) / oneDayMs);
    if (diffDays === 1) streak++;
    else break;
  }
  return streak;
}

export async function onRequestGet(context) {
  const user = await getSessionUser(context);
  if (!user) return jsonResponse({ error: "unauthorized" }, 401);

  const db = context.env.DB;
  const settings = await getAllSettings(db);

  if (!settingBool(settings, "feature.badges")) {
    return jsonResponse({ enabled: false });
  }

  const streakThreshold = settingInt(settings, "badge.streak_days", 7);
  const milestone = settingInt(settings, "badge.login_count_milestone", 10);

  const totalRow = await db.prepare(
    "SELECT COUNT(*) AS cnt FROM login_events WHERE user_id = ? AND success = 1"
  ).bind(user.id).first().catch(() => ({ cnt: 0 }));

  const { results: dayRows } = await db.prepare(
    `SELECT DISTINCT date(created_at) AS d FROM login_events
     WHERE user_id = ? AND success = 1 ORDER BY d DESC LIMIT 400`
  ).bind(user.id).all().catch(() => ({ results: [] }));

  const streak = computeStreak((dayRows || []).map(r => r.d));

  const quizRow = await db.prepare(
    "SELECT best_score, best_total FROM quiz_scores WHERE user_id = ?"
  ).bind(user.id).first().catch(() => null);

  const totalLogins = (totalRow && totalRow.cnt) || 0;
  const quizBestScore = (quizRow && quizRow.best_score) || 0;
  const quizBestTotal = (quizRow && quizRow.best_total) || 0;
  const quizRatio = quizBestTotal > 0 ? quizBestScore / quizBestTotal : 0;

  const badges = [
    { key: "first_login", earned: totalLogins >= 1 },
    { key: "login_milestone", value: milestone, earned: totalLogins >= milestone },
    { key: "login_streak", value: streakThreshold, earned: streak >= streakThreshold },
    { key: "quiz_master", earned: quizBestTotal > 0 && quizRatio >= 0.8 }
  ];

  return jsonResponse({
    enabled: true,
    badges,
    stats: { total_logins: totalLogins, streak, quiz_best_score: quizBestScore, quiz_best_total: quizBestTotal }
  });
}
