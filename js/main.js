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

// ---------- CMS: admin panelinden düzenlenen içerik override'ları ----------
// /api/content herkese açıktır; sadece admin panelinden değiştirilmiş
// metinleri döner. Bulunursa translations.js'teki varsayılanın üzerine yazılır.
async function applyContentOverrides(){
  try{
    const res = await fetch('/api/content');
    if(!res.ok) return;
    const data = await res.json();
    const overrides = data.overrides || {};
    Object.keys(overrides).forEach(key=>{
      if(!translations[key]) return;
      if(overrides[key].tr) translations[key].tr = overrides[key].tr;
      if(overrides[key].en) translations[key].en = overrides[key].en;
    });
  } catch(e){ /* varsayılan metinlerle devam et */ }
}

// ---------- Ziyaretçi analitiği (anonim ping) ----------
// Admin panelindeki "Analitik" sekmesi için: sadece IP/UA/ülke/sayfa
// yolu kaydedilir, kişisel/hassas bir veri gönderilmez.
function sendVisitPing(){
  try{
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: window.location.pathname }),
      keepalive: true
    }).catch(()=>{});
  } catch(e){ /* sessizce geç */ }
}

// ---------- Konsol (DevTools/F12) mesajı ----------
// Meraklı bir geliştirici konsolu açarsa küçük bir selam bırakalım.
function printConsoleMessage(){
  const style1 = 'color:#00ff9d;font-family:monospace;font-size:18px;font-weight:bold;';
  const style2 = 'color:#7fa896;font-family:monospace;font-size:13px;';
  console.log('%c> whoami', style1);
  console.log('%cSalih Taşkın — Siber Güvenlik Öğrencisi & Pentest Meraklısı', style1);
  console.log('%cKonsolu açacak kadar meraklısın demek. Bu iyi bir işaret. 🙂', style2);
  console.log('%cCV / iş birliği için: salihtaskin282282@gmail.com', style2);
  console.log('%cGitHub: https://github.com/Salihtaskin', style2);
}

// ---------- Konami kod easter egg ----------
// ↑ ↑ ↓ ↓ ← → ← → B A girilirse küçük bir "penetrasyon testi tamamlandı" efekti göster.
function initKonamiCode(){
  const sequence = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  let progress = 0;

  function showKonamiReward(){
    const el = document.createElement('div');
    el.className = 'konami-banner';
    el.innerHTML = '&gt; PENETRASYON TESTİ TAMAMLANDI ✅<br><span>Konami kodunu bilecek kadar eskisin. Saygılar. 🕹️</span>';
    document.body.appendChild(el);
    requestAnimationFrame(()=> el.classList.add('show'));
    setTimeout(()=>{
      el.classList.remove('show');
      setTimeout(()=> el.remove(), 500);
    }, 3500);
  }

  document.addEventListener('keydown', (e)=>{
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if(key === sequence[progress]){
      progress++;
      if(progress === sequence.length){
        progress = 0;
        showKonamiReward();
      }
    } else {
      progress = (key === sequence[0]) ? 1 : 0;
    }
  });
}

// ---------- Sahte "güvenlik duvarı aşılıyor" yükleme ekranı ----------
// Sadece ana sayfada, sayfa ilk açıldığında ~1.2 saniye sürer, sonra kaybolur.
// Gerçekte hiçbir şey yapmaz, tema/atmosfer için.
function initFakeLoadingScreen(){
  const overlay = document.getElementById('fake-loading-screen');
  if(!overlay) return;
  const bar = document.getElementById('fake-loading-bar');
  const pct = document.getElementById('fake-loading-pct');
  let progress = 0;

  const timer = setInterval(()=>{
    progress += Math.random() * 22 + 8;
    if(progress >= 100){
      progress = 100;
      clearInterval(timer);
      setTimeout(()=>{
        overlay.classList.add('hide');
        setTimeout(()=> overlay.remove(), 500);
      }, 250);
    }
    if(bar) bar.style.width = progress + '%';
    if(pct) pct.textContent = Math.floor(progress) + '%';
  }, 140);
}

document.addEventListener('DOMContentLoaded', async ()=>{
  initFakeLoadingScreen();
  initMatrix();
  initNavToggle();
  await applyContentOverrides();
  initLanguage();
  initReveal();
  initKonamiCode();
  printConsoleMessage();
  sendVisitPing();
});
