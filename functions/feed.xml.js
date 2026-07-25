// /feed.xml -> yayınlanmış blog yazılarının RSS 2.0 akışı (herkese açık).
// Cloudflare Pages Functions bu dosyayı dosya adına göre route eder:
// functions/feed.xml.js  =>  https://site/feed.xml

function escapeXml(str) {
  return (str || "").toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toRfc822(iso) {
  try {
    const d = new Date((iso || "").replace(" ", "T") + "Z");
    return d.toUTCString();
  } catch (e) {
    return new Date().toUTCString();
  }
}

export async function onRequestGet(context) {
  const siteUrl = context.env.SITE_URL || "https://salihtaskin.pages.dev";
  let posts = [];

  try {
    const { results } = await context.env.DB.prepare(
      `SELECT slug, title_tr, content_tr, created_at FROM blog_posts
       WHERE published = 1 ORDER BY created_at DESC LIMIT 30`
    ).all();
    posts = results || [];
  } catch (e) {
    posts = [];
  }

  const items = posts.map(p => {
    const link = `${siteUrl}/blog-post.html?slug=${encodeURIComponent(p.slug)}`;
    const excerpt = (p.content_tr || "").slice(0, 400);
    return `
    <item>
      <title>${escapeXml(p.title_tr)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="true">${escapeXml(link)}</guid>
      <pubDate>${toRfc822(p.created_at)}</pubDate>
      <description>${escapeXml(excerpt)}</description>
    </item>`;
  }).join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Salih Taşkın — Blog</title>
    <link>${siteUrl}/blog.html</link>
    <description>Salih Taşkın'ın siber güvenlik üzerine yazıları.</description>
    <language>tr</language>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" }
  });
}
