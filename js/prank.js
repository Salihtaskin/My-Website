/* ======================================================
   prank.js — Ana sayfa "hacklendiniz" şakası (eğlence amaçlı)
   Akış: kullanıcı sayfayla ilk etkileşiminde (tık/tuş/scroll,
   tarayıcı otomatik ses politikası nedeniyle) -> fotoğraf + ses
   -> terminal tarzı sahte "hack" bilgisi (gerçek IP/cihaz, zaten
   her site tarafından görülen bilgiler) -> şaka açıklaması.
   Sadece Ayarlar sekmesinden "feature.hack_prank" açıksa çalışır.
====================================================== */

const PRANK_ALARM_DATA_URI = "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZSA0PVqzn77BdGAg+ltryxnMpBSp+zPLaizsIGGS57OihUBELTKXh8bllHAU2jtbzx3UsBSV7yvDdkUAKFF+16+mjUBEMSKHe8rtnHAU0iNTyz3ksBSh5yO/blEILEmC06+mjUBEMS5/g8LhlHAU2jNXzy3csBSZ9y/DblUILEmG16+qkUBEMSp/f8LdmHAU1itPzzngrBSd9y+/blUAKE2Gz7OukURAMSp7g8LdlHAY1idLzzXcrBSh+yu/dlEELEmGz7OukURALSp7g8LdlHAY1idLzzXcrBSh+yu/dlEELEmGz7OukUBELSp3f8LdmHAY1idHzzXcrBSh+yu/dlEELEmGz7OukUBELSZ7g8LhlHAY1idDzzXcrBSh+yu/dlEALEmGz7OukT/8LSZ7g8LhlHAc1idDzzXcrBSh+yu/dlEALEmGz7OukT/8LSZ7f8LhlHQc1idDzzXcrBSh+ye/dlEALEmGz7OukT/8LSZ7g8LdmHQc1idDzzXcrBSh+yu/dlEALEmGz7OukT/8LSZ7g8LdlHQc1idDzzXcrBSh+yu/dlD8LEmGz7OukUP8LSZ7g8LdlHQc1idDzzXcrBSh+yu/dlD8LEmGz7OukUP8LSZ7g8LdlHQc1idDzzXcrBSh+yu/dlD8LEmGz7OukUP8LSZ7g8LdlHQc1ic/zzXcrBSh+yu/dlD8LEmGz7OukUP8LSZ7g8LdlHQc1ic/zzXcrBSh+yu/dlD8LEmGz7OukUP8LSZ7g8LdlHQc1ic/zzXcrBSh+yu/elD8LEmGz7OukT/8LSZ7g8LdlHQc1ic/zzXcrBSh+yu/elD8LEmGz7OukT/8LSZ7g8LdlHQc1ic/zzXcrBSh+yu/elD8LEmGz7OukT/8LSZ7g8LdlHQc1idDzzXcrBSh+yu/elD8LEmGz7OukT/8LSZ7g8LdlHQc1idDzzXcrBSh+yu/elD8LEmGz7OukT/8LSZ7g8LdlHQc1idDzzXcrBSh+yu/dlD8LEmGz7OukT/8LSZ7g8LdlHQc1idDzzXcrBSh+yu/dlD8LEmGz7OukT/8LSZ7g8LdlHQc1idDzzXcrBSh+yu/dlD8LEmGz7OukT/8=";

let prankTriggered = false;

function sleep(ms){ return new Promise(resolve => setTimeout(resolve, ms)); }

function typeLine(el, text){
  return new Promise(resolve=>{
    let i = 0;
    const timer = setInterval(()=>{
      el.textContent = text.slice(0, i + 1);
      i++;
      if(i >= text.length){ clearInterval(timer); resolve(); }
    }, 22);
  });
}

async function isPrankEnabled(){
  try{
    const res = await fetch('/api/settings');
    if(!res.ok) return false;
    const data = await res.json();
    const s = data.settings || {};
    return s['feature.hack_prank'] === '1' || s['feature.hack_prank'] === 'true';
  } catch(e){ return false; }
}

async function fetchWhoAmI(){
  try{
    const res = await fetch('/api/whoami');
    if(!res.ok) throw new Error('fail');
    return await res.json();
  } catch(e){
    return { ip: '???.???.???.???', country: '??', os: '?', browser: '?' };
  }
}

async function runPrankSequence(){
  if(prankTriggered) return;
  prankTriggered = true;

  let overlay = document.getElementById('prank-overlay');
  if(!overlay){
    overlay = document.createElement('div');
    overlay.id = 'prank-overlay';
    document.body.appendChild(overlay);
  }
  overlay.className = 'prank-overlay';
  overlay.innerHTML = '';
  overlay.style.display = 'flex';

  // --- Aşama 1: fotoğraf + alarm sesi ---
  const photoStage = document.createElement('div');
  photoStage.className = 'prank-photo-stage';
  photoStage.innerHTML = '<img src="assets/prank.jpg" alt="">';
  overlay.appendChild(photoStage);

  const audio = new Audio(PRANK_ALARM_DATA_URI);
  audio.loop = true;
  audio.play().catch(()=>{ /* tarayıcı otomatik ses çalmayı engellemiş olabilir, sorun değil */ });

  await sleep(2600);

  // --- Aşama 2: terminal ---
  photoStage.remove();
  const term = document.createElement('div');
  term.className = 'prank-terminal-stage';
  overlay.appendChild(term);

  const info = await fetchWhoAmI();
  const lines = [
    'root@unknown:~# initiating_access...',
    '[!] BAGLANTI YAKALANDI',
    '[!] IP: ' + (info.ip || '???'),
    '[!] Konum: ' + (info.country || '??') + (info.city ? (' / ' + info.city) : ''),
    '[!] Cihaz: ' + (info.os || '?') + ' / ' + (info.browser || '?'),
    '[!] HACKLENDINIZ...'
  ];

  for(const line of lines){
    const div = document.createElement('div');
    div.className = line.startsWith('[!]') ? 'prank-danger' : '';
    term.appendChild(div);
    await typeLine(div, line);
    await sleep(250);
  }

  await sleep(1000);
  audio.pause();

  // --- Aşama 3: şaka açıklaması ---
  term.remove();
  const reveal = document.createElement('div');
  reveal.className = 'prank-reveal-stage';
  reveal.innerHTML = [
    '<div style="font-size:2.4rem;margin-bottom:14px;">😄</div>',
    '<div>Sakin ol, hacklenmedin! Bu sadece küçük bir şakaydı.</div>',
    '<div style="margin-top:12px;color:var(--text-dim);font-size:0.85rem;">',
    'Bu arada: yukarıdaki bilgiler (IP, cihaz, konum) zaten ziyaret ettiğin HER sitenin sunucusu tarafından görülüyor — yeni bir şey değil, ama farkında olmak önemli. 🛡️',
    '</div>',
    '<button class="btn" id="prank-close-btn">Kapat</button>'
  ].join('');
  overlay.appendChild(reveal);

  document.getElementById('prank-close-btn').addEventListener('click', ()=>{
    overlay.style.display = 'none';
    overlay.innerHTML = '';
    prankTriggered = false; // "her ziyarette" tetiklenmesi isteniyor; sayfa yeniden yüklenince zaten sıfırlanır
  });
}

function initHackPrank(){
  if(!document.getElementById('home')) return; // sadece ana sayfada

  isPrankEnabled().then(enabled=>{
    if(!enabled) return;
    const trigger = ()=>{
      document.removeEventListener('click', trigger);
      document.removeEventListener('keydown', trigger);
      document.removeEventListener('scroll', trigger);
      runPrankSequence();
    };
    document.addEventListener('click', trigger, { once: true });
    document.addEventListener('keydown', trigger, { once: true });
    document.addEventListener('scroll', trigger, { once: true, passive: true });
  });
}

document.addEventListener('DOMContentLoaded', initHackPrank);
