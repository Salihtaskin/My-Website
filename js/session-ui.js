/* ======================================================
   session-ui.js
   ------------------------------------------------------
   Ortak oturum durumu kontrolü. /api/me isteğinden dönen
   sonuca göre:
   - index.html'de: "Kayıt Ol / Giriş Yap" yerine
     "Panele Git / Çıkış Yap" göster (data-auth attribute'u
     ile).
   - login.html / register.html'de: kullanıcı zaten
     girişliyse otomatik olarak dashboard.html'e yönlendir
     (tekrar login formuyla karşılaşmasın diye).
   Bu, "ana sayfaya dönünce tekrar giriş istiyor" hissini
   ortadan kaldırır: oturum çerezi zaten geçerliyse kullanıcı
   bunu görebilir ve login formunu tekrar doldurmak zorunda
   kalmaz.
====================================================== */

async function checkSession(){
  try{
    const res = await fetch('/api/me', { credentials: 'same-origin' });
    if(!res.ok) return null;
    const data = await res.json();
    return data.user || null;
  } catch(e){
    return null;
  }
}

async function applySessionUI(){
  const user = await checkSession();
  const loggedIn = !!user;

  document.querySelectorAll('[data-auth="guest-only"]').forEach(el=>{
    el.style.display = loggedIn ? 'none' : '';
  });
  document.querySelectorAll('[data-auth="user-only"]').forEach(el=>{
    el.style.display = loggedIn ? '' : 'none';
  });

  // login.html / register.html: zaten girişliyse doğrudan panele yönlendir
  if(loggedIn && document.body.classList.contains('guest-redirect-page')){
    window.location.href = 'dashboard.html';
    return;
  }

  // logout butonu (nav içinde, user-only alanda) varsa bağla
  const logoutBtn = document.getElementById('nav-logout-btn');
  if(logoutBtn){
    logoutBtn.addEventListener('click', async ()=>{
      await fetch('/api/logout', { method: 'POST', credentials: 'same-origin' }).catch(()=>{});
      window.location.reload();
    });
  }
}

document.addEventListener('DOMContentLoaded', applySessionUI);
