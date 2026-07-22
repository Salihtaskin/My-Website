/* ======================================================
   login.js - Cloudflare Pages Functions + D1 tabanlı
   gerçek giriş akışı. /api/login endpoint'ine istek atar,
   başarılı olursa sunucu HttpOnly session cookie'si set
   eder ve dashboard.html'e yönlendirilir.
====================================================== */

function currentLang(){
  return localStorage.getItem('site_lang') || 'tr';
}

function initLoginForm(){
  const form = document.getElementById('login-form');
  if(!form) return;
  const msg = document.getElementById('login-msg');
  const submitBtn = document.getElementById('login-submit');

  form.addEventListener('submit', async function(e){
    e.preventDefault();
    const lang = currentLang();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if(!email || !password){
      msg.textContent = translations['login.err_empty'][lang];
      msg.className = 'login-msg error';
      return;
    }

    submitBtn.disabled = true;
    msg.textContent = '';
    msg.className = 'login-msg';

    try{
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email, password })
      });
      const data = await res.json().catch(()=>({}));

      if(res.ok && data.ok){
        msg.textContent = translations['login.ok_msg'][lang];
        msg.className = 'login-msg ok';
        setTimeout(()=>{ window.location.href = 'dashboard.html'; }, 600);
        return;
      }

      let key = 'login.err_server';
      if(data.error === 'invalid_credentials') key = 'login.err_invalid';
      else if(data.error === 'not_approved') key = data.status === 'rejected' ? 'login.err_rejected' : 'login.err_not_approved';
      else if(data.error === 'missing_fields') key = 'login.err_empty';
      msg.textContent = translations[key][lang];
      msg.className = 'login-msg error';
    } catch(err){
      msg.textContent = translations['login.err_server'][lang];
      msg.className = 'login-msg error';
    } finally {
      submitBtn.disabled = false;
    }
  });
}

document.addEventListener('DOMContentLoaded', initLoginForm);
