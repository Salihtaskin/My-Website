import { hashPassword, jsonResponse, EMAIL_RE } from "../_lib/auth.js";

export async function onRequestPost(context) {
  try {
    const body = await context.request.json().catch(() => ({}));
    const full_name = (body.full_name || "").toString().trim().slice(0, 120);
    const email = (body.email || "").toString().trim().toLowerCase().slice(0, 160);
    const phone = (body.phone || "").toString().trim().slice(0, 40);
    const password = (body.password || "").toString();

    if (!full_name || !email || !password) {
      return jsonResponse({ error: "missing_fields" }, 400);
    }
    if (!EMAIL_RE.test(email)) {
      return jsonResponse({ error: "invalid_email" }, 400);
    }
    if (password.length < 8) {
      return jsonResponse({ error: "weak_password" }, 400);
    }

    const existing = await context.env.DB
      .prepare("SELECT id FROM users WHERE email = ?")
      .bind(email)
      .first();

    if (existing) {
      return jsonResponse({ error: "email_exists" }, 409);
    }

    const ip = context.request.headers.get("CF-Connecting-IP") || "unknown";

    // Basit oran sınırlama: aynı IP'den saatte 5'ten fazla kayıt denemesi engellenir
    // (spam/otomasyon kayıt saldırılarına karşı).
    if (ip !== "unknown") {
      try {
        const recentCount = await context.env.DB.prepare(
          `SELECT COUNT(*) AS cnt FROM users
           WHERE registered_ip = ? AND created_at >= datetime('now', '-1 hour')`
        ).bind(ip).first();
        if (recentCount && recentCount.cnt >= 5) {
          return jsonResponse({ error: "rate_limited" }, 429);
        }
      } catch (e) { /* registered_ip sütunu henüz yoksa sessizce geç */ }
    }

    const { hash, salt } = await hashPassword(password);

    try {
      await context.env.DB.prepare(
        `INSERT INTO users (full_name, email, phone, password_hash, salt, role, status, registered_ip)
         VALUES (?, ?, ?, ?, ?, 'user', 'pending', ?)`
      ).bind(full_name, email, phone, hash, salt, ip).run();
    } catch (e) {
      // registered_ip sütunu henüz yoksa (migration çalıştırılmadıysa) eski şekilde dene
      await context.env.DB.prepare(
        `INSERT INTO users (full_name, email, phone, password_hash, salt, role, status)
         VALUES (?, ?, ?, ?, ?, 'user', 'pending')`
      ).bind(full_name, email, phone, hash, salt).run();
    }

    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse({ error: "server_error", detail: String(err) }, 500);
  }
}
