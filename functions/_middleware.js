/* ======================================================
   Global middleware — Cloudflare Pages Functions içinde
   /functions/_middleware.js her istekte (statik dosyalar
   dahil) çalışır. Burada tek iş: istemcinin IP'si
   blocked_ips tablosunda varsa isteği reddet.
   blocked_ips tablosu henüz yoksa (migration_v3.sql
   çalıştırılmadıysa) siteyi bozmamak için sessizce devam
   edilir.
====================================================== */

export async function onRequest(context) {
  const ip = context.request.headers.get("CF-Connecting-IP") || "unknown";

  if (ip !== "unknown" && context.env.DB) {
    try {
      const row = await context.env.DB.prepare(
        `SELECT blocked_until FROM blocked_ips WHERE ip = ?`
      ).bind(ip).first();

      if (row) {
        const stillActive = !row.blocked_until ||
          new Date(row.blocked_until.replace(" ", "T") + "Z") > new Date();

        if (stillActive) {
          return new Response(
            "Erişim engellendi (şüpheli aktivite tespit edildi). / Access blocked due to suspicious activity.",
            { status: 403, headers: { "Content-Type": "text/plain; charset=utf-8" } }
          );
        }

        // Süresi dolmuş geçici ban ise arka planda temizle, isteği engelleme
        context.waitUntil(
          context.env.DB.prepare(`DELETE FROM blocked_ips WHERE ip = ?`).bind(ip).run().catch(() => {})
        );
      }
    } catch (e) {
      // migration_v3.sql henüz çalıştırılmadıysa tablo yoktur; siteyi bozma
    }
  }

  return context.next();
}
