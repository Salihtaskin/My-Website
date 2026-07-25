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

function parseTags(tagsStr){
  return (tagsStr || '').split(',').map(t => t.trim()).filter(Boolean);
}

let allBlogPosts = [];
let activeTagFilter = null;

function renderTagFilterBar(){
  const bar = document.getElementById('tag-filter-bar');
  if(!bar) return;
  const lang = blogCurrentLang();

  const tagSet = new Set();
  allBlogPosts.forEach(p => parseTags(p.tags).forEach(t => tagSet.add(t)));

  if(!tagSet.size){ bar.innerHTML = ''; return; }

  const allLabel = translations['blog.tags_all'][lang];
  let html = `<button type="button" class="tag-pill${activeTagFilter ? '' : ' active'}" data-tag="">${escapeHtmlBlog(allLabel)}</button>`;
  Array.from(tagSet).sort().forEach(tag => {
    html += `<button type="button" class="tag-pill${activeTagFilter === tag ? ' active' : ''}" data-tag="${escapeHtmlBlog(tag)}">${escapeHtmlBlog(tag)}</button>`;
  });
  bar.innerHTML = html;

  bar.querySelectorAll('.tag-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      activeTagFilter = btn.dataset.tag || null;
      renderTagFilterBar();
      renderBlogCards();
    });
  });
}

function renderBlogCards(){
  const container = document.getElementById('blog-list');
  if(!container) return;
  const lang = blogCurrentLang();

  let posts = allBlogPosts;
  if(activeTagFilter){
    posts = posts.filter(p => parseTags(p.tags).map(t=>t.toLowerCase()).includes(activeTagFilter.toLowerCase()));
  }

  if(!posts.length){
    container.innerHTML = `<div class="section-sub">${translations['blog.empty'][lang]}</div>`;
    return;
  }

  container.innerHTML = posts.map(p=>{
    const title = lang === 'tr' ? p.title_tr : p.title_en;
    const content = lang === 'tr' ? p.content_tr : p.content_en;
    const excerpt = content.slice(0, 160);
    const tags = parseTags(p.tags);
    const tagsHtml = tags.length ? `<div class="post-tags">${tags.map(t=>`<span class="tag-pill">${escapeHtmlBlog(t)}</span>`).join('')}</div>` : '';
    return `
      <div class="card">
        <span class="tag">${formatBlogDate(p.created_at)}</span>
        <h4>${escapeHtmlBlog(title)}</h4>
        ${tagsHtml}
        <p>${escapeHtmlBlog(excerpt)}${content.length > 160 ? '…' : ''}</p>
        <a href="blog-post.html?slug=${encodeURIComponent(p.slug)}" class="btn btn-alt" style="margin-top:14px;">${translations['blog.read_more'][lang]}</a>
      </div>
    `;
  }).join('');
}

async function initBlogList(){
  const container = document.getElementById('blog-list');
  if(!container) return;
  const lang = blogCurrentLang();

  try{
    const res = await fetch('/api/blog');
    const data = await res.json();
    allBlogPosts = data.posts || [];
    renderTagFilterBar();
    renderBlogCards();
  } catch(e){
    container.innerHTML = `<div class="section-sub">${translations['blog.empty'][lang]}</div>`;
  }

  initSubscribeForm();
}

function initSubscribeForm(){
  const form = document.getElementById('subscribe-form');
  if(!form || form.dataset.bound) return;
  form.dataset.bound = '1';
  const msg = document.getElementById('subscribe-msg');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const lang = blogCurrentLang();
    const email = document.getElementById('subscribe-email').value.trim();
    const website = document.getElementById('subscribe-website').value;

    try{
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, website })
      });
      const data = await res.json().catch(()=>({}));

      if(res.ok && data.ok){
        msg.textContent = data.already_subscribed ? translations['blog.subscribe_already'][lang] : translations['blog.subscribe_success'][lang];
        msg.className = 'subscribe-msg ok';
        form.reset();
        return;
      }

      msg.textContent = data.error === 'invalid_email' ? translations['blog.subscribe_err_email'][lang] : translations['blog.subscribe_err_server'][lang];
      msg.className = 'subscribe-msg error';
    } catch(err){
      msg.textContent = translations['blog.subscribe_err_server'][lang];
      msg.className = 'subscribe-msg error';
    }
  });
}

function renderShareBar(post, title){
  const bar = document.getElementById('share-bar');
  if(!bar) return;
  const lang = blogCurrentLang();
  const url = window.location.href;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;

  bar.innerHTML = `
    <span>${escapeHtmlBlog(translations['blog.share_title'][lang])}</span>
    <a class="share-btn" href="${twitterUrl}" target="_blank" rel="noopener">X / Twitter</a>
    <a class="share-btn" href="${linkedinUrl}" target="_blank" rel="noopener">LinkedIn</a>
  `;
}

function formatCommentDate(iso){
  try{
    const d = new Date(iso.replace(' ', 'T') + 'Z');
    const lang = blogCurrentLang();
    return d.toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-GB', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
  } catch(e){ return iso; }
}

async function loadComments(postId){
  const list = document.getElementById('comments-list');
  if(!list) return;
  const lang = blogCurrentLang();

  try{
    const res = await fetch('/api/blog-comments?post_id=' + encodeURIComponent(postId));
    const data = await res.json();
    const comments = data.comments || [];

    if(!comments.length){
      list.innerHTML = `<div class="section-sub">${translations['blog.comments_empty'][lang]}</div>`;
      return;
    }

    list.innerHTML = comments.map(c => `
      <div class="comment-item">
        <div class="comment-head">
          <span>${escapeHtmlBlog(c.name)}</span>
          <span class="comment-date">${formatCommentDate(c.created_at)}</span>
        </div>
        <div class="comment-body">${escapeHtmlBlog(c.comment_text)}</div>
      </div>
    `).join('');
  } catch(e){
    list.innerHTML = '';
  }
}

function initCommentForm(postId){
  const form = document.getElementById('comment-form');
  if(!form) return;
  const msg = document.getElementById('comment-msg');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const lang = blogCurrentLang();
    const name = document.getElementById('comment-name').value.trim();
    const email = document.getElementById('comment-email').value.trim();
    const comment = document.getElementById('comment-text').value.trim();
    const website = document.getElementById('comment-website').value;

    if(!name || !comment){
      msg.textContent = translations['blog.comment_err_missing'][lang];
      msg.className = 'login-msg error';
      return;
    }

    try{
      const res = await fetch('/api/blog-comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: postId, name, email, comment, website })
      });
      const data = await res.json().catch(()=>({}));

      if(res.ok && data.ok){
        msg.textContent = translations['blog.comment_success'][lang];
        msg.className = 'login-msg ok';
        form.reset();
        return;
      }

      msg.textContent = translations['blog.comment_err_server'][lang];
      msg.className = 'login-msg error';
    } catch(err){
      msg.textContent = translations['blog.comment_err_server'][lang];
      msg.className = 'login-msg error';
    }
  });
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
    const tags = parseTags(post.tags);
    const tagsHtml = tags.length ? `<div class="post-tags" style="margin-bottom:16px;">${tags.map(t=>`<span class="tag-pill">${escapeHtmlBlog(t)}</span>`).join('')}</div>` : '';

    const titleTag = document.getElementById('post-title-tag');
    const descTag = document.getElementById('post-desc-tag');
    if(titleTag) titleTag.textContent = title + ' // Salih Taşkın';
    if(descTag) descTag.setAttribute('content', content.slice(0, 150));

    container.innerHTML = `
      <h2 class="section-title">${escapeHtmlBlog(title)}</h2>
      <div class="section-sub">${formatBlogDate(post.created_at)}</div>
      ${tagsHtml}
      <div style="margin-top:20px;line-height:1.8;color:var(--text);">${textToParagraphs(content)}</div>
    `;

    renderShareBar(post, title);
    loadComments(post.id);
    initCommentForm(post.id);
  } catch(e){
    container.innerHTML = `<div class="section-sub">${translations['blog.not_found'][lang]}</div>`;
    const shareBar = document.getElementById('share-bar');
    if(shareBar) shareBar.style.display = 'none';
    const commentsSection = document.getElementById('comments-section');
    if(commentsSection) commentsSection.style.display = 'none';
  }
}

document.addEventListener('DOMContentLoaded', ()=>{
  initBlogList();
  initBlogPost();
});

document.addEventListener('site-language-changed', ()=>{
  renderTagFilterBar();
  renderBlogCards();
  initBlogPost();
});
