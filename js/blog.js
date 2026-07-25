/* ======================================================
   blog.js - blog.html (liste) ve blog-post.html (tekil yazı)
   sayfalarında çalışır. Hangi sayfada olduğunu DOM'daki
   #blog-list / #post-content elementine bakarak anlar.
====================================================== */

function blogCurrentLang(){
  return localStorage.getItem('site_lang') || 'tr';
}

function escapeHtmlBlog(str){
  const div = document.createElement('div');
  div.textContent = str == null ? '' : str;
  return div.innerHTML;
}

function textToParagraphs(text){
  return text.split(/\n\s*\n/).map(p => `<p>${escapeHtmlBlog(p).replace(/\n/g, '<br>')}</p>`).join('');
}

function formatBlogDate(iso){
  try{
    const d = new Date(iso.replace(' ', 'T') + 'Z');
    const lang = blogCurrentLang();
    return d.toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-GB', { day:'2-digit', month:'long', year:'numeric' });
  } catch(e){ return iso; }
}

async function initBlogList(){
  const container = document.getElementById('blog-list');
  if(!container) return;
  const lang = blogCurrentLang();

  try{
    const res = await fetch('/api/blog');
    const data = await res.json();
    const posts = data.posts || [];

    if(!posts.length){
      container.innerHTML = `<div class="section-sub">${translations['blog.empty'][lang]}</div>`;
      return;
    }

    container.innerHTML = posts.map(p=>{
      const title = lang === 'tr' ? p.title_tr : p.title_en;
      const content = lang === 'tr' ? p.content_tr : p.content_en;
      const excerpt = content.slice(0, 160);
      return `
        <div class="card">
          <span class="tag">${formatBlogDate(p.created_at)}</span>
          <h4>${escapeHtmlBlog(title)}</h4>
          <p>${escapeHtmlBlog(excerpt)}${content.length > 160 ? '…' : ''}</p>
          <a href="blog-post.html?slug=${encodeURIComponent(p.slug)}" class="btn btn-alt" style="margin-top:14px;">${translations['blog.read_more'][lang]}</a>
        </div>
      `;
    }).join('');
  } catch(e){
    container.innerHTML = `<div class="section-sub">${translations['blog.empty'][lang]}</div>`;
  }
}

async function initBlogPost(){
  const container = document.getElementById('post-content');
  if(!container) return;
  const lang = blogCurrentLang();
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug');

  if(!slug){
    container.innerHTML = `<div class="section-sub">${translations['blog.not_found'][lang]}</div>`;
    return;
  }

  try{
    const res = await fetch('/api/blog-post?slug=' + encodeURIComponent(slug));
    if(!res.ok) throw new Error('not_found');
    const data = await res.json();
    const post = data.post;
    const title = lang === 'tr' ? post.title_tr : post.title_en;
    const content = lang === 'tr' ? post.content_tr : post.content_en;

    const titleTag = document.getElementById('post-title-tag');
    const descTag = document.getElementById('post-desc-tag');
    if(titleTag) titleTag.textContent = title + ' // Salih Taşkın';
    if(descTag) descTag.setAttribute('content', content.slice(0, 150));

    container.innerHTML = `
      <h2 class="section-title">${escapeHtmlBlog(title)}</h2>
      <div class="section-sub">${formatBlogDate(post.created_at)}</div>
      <div style="margin-top:20px;line-height:1.8;color:var(--text);">${textToParagraphs(content)}</div>
    `;
  } catch(e){
    container.innerHTML = `<div class="section-sub">${translations['blog.not_found'][lang]}</div>`;
  }
}

document.addEventListener('DOMContentLoaded', ()=>{
  initBlogList();
  initBlogPost();
});

document.addEventListener('site-language-changed', ()=>{
  initBlogList();
  initBlogPost();
});
