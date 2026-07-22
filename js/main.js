/* ======================================================
   Main site behaviour: matrix rain, nav, language switch,
   typing terminal effect
====================================================== */

// ---------- Language handling ----------
function applyLanguage(lang){
  document.documentElement.lang = lang;
  document.querySelectorAll('[data-i18n]').forEach(el=>{
    const key = el.getAttribute('data-i18n');
    if(translations[key]){
      const val = translations[key][lang];
      if(el.hasAttribute('data-i18n-html')){
        el.innerHTML = val;
      } else {
        el.textContent = val;
      }
    }
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>{
    const key = el.getAttribute('data-i18n-placeholder');
    if(translations[key]) el.placeholder = translations[key][lang];
  });
  document.querySelectorAll('.lang-toggle button').forEach(b=>{
    b.classList.toggle('active', b.dataset.lang === lang);
  });
  localStorage.setItem('site_lang', lang);

  // restart typing effect for hero terminal line if present
  const termEl = document.querySelector('.terminal-line .typed');
  if(termEl){
    startTyping(translations['terminal.lines'][lang].split('|'));
  }
}

function initLanguage(){
  const saved = localStorage.getItem('site_lang') || 'tr';
  applyLanguage(saved);
  document.querySelectorAll('.lang-toggle button').forEach(btn=>{
    btn.addEventListener('click', ()=> applyLanguage(btn.dataset.lang));
  });
}

// ---------- Mobile nav ----------
function initNavToggle(){
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if(!toggle || !links) return;
  toggle.addEventListener('click', ()=> links.classList.toggle('open'));
  links.querySelectorAll('a').forEach(a=>{
    a.addEventListener('click', ()=> links.classList.remove('open'));
  });
}

// ---------- Typing terminal effect ----------
let typingTimer = null;
function startTyping(lines){
  const el = document.querySelector('.terminal-line .typed');
  if(!el) return;
  clearTimeout(typingTimer);
  let lineIdx = 0, charIdx = 0, deleting = false;

  function tick(){
    const current = lines[lineIdx];
    if(!deleting){
      el.textContent = current.slice(0, charIdx+1);
      charIdx++;
      if(charIdx === current.length){
        deleting = true;
        typingTimer = setTimeout(tick, 1400);
        return;
      }
    } else {
      el.textContent = current.slice(0, charIdx-1);
      charIdx--;
      if(charIdx === 0){
        deleting = false;
        lineIdx = (lineIdx+1) % lines.length;
      }
    }
    typingTimer = setTimeout(tick, deleting ? 30 : 55);
  }
  tick();
}

// ---------- Matrix rain canvas ----------
function initMatrix(){
  const canvas = document.getElementById('matrix-canvas');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let w, h, columns, drops;
  const chars = "アイウエオカキクケコサシスセソ0123456789ABCDEF@#$%&";

  function resize(){
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    columns = Math.floor(w / 16);
    drops = new Array(columns).fill(1);
  }
  window.addEventListener('resize', resize);
  resize();

  function draw(){
    ctx.fillStyle = 'rgba(6,10,9,0.08)';
    ctx.fillRect(0,0,w,h);
    ctx.fillStyle = '#00ff9d';
    ctx.font = '14px monospace';
    for(let i=0;i<drops.length;i++){
      const text = chars[Math.floor(Math.random()*chars.length)];
      ctx.fillText(text, i*16, drops[i]*16);
      if(drops[i]*16 > h && Math.random() > 0.975) drops[i] = 0;
      drops[i]++;
    }
    requestAnimationFrame(draw);
  }
  draw();
}

// ---------- Scroll reveal ----------
function initReveal(){
  const els = document.querySelectorAll('.section, .card, .skill-card, .timeline-item');
  const obs = new IntersectionObserver(entries=>{
    entries.forEach(e=>{
      if(e.isIntersecting){
        e.target.style.opacity = 1;
        e.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });
  els.forEach(el=>{
    el.style.opacity = 0.001;
    el.style.transform = 'translateY(16px)';
    el.style.transition = 'opacity .6s ease, transform .6s ease';
    obs.observe(el);
  });
}

document.addEventListener('DOMContentLoaded', ()=>{
  initMatrix();
  initNavToggle();
  initLanguage();
  initReveal();
});
