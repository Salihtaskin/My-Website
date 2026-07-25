/* ======================================================
   password-recovery.js - forgot-password.html ve
   reset-password.html sayfalarında çalışır. Hangi sayfada
   olduğunu DOM'daki #forgot-form / #reset-form elementine
   bakarak anlar.
====================================================== */

function recoveryCurrentLang(){
  return localStorage.getItem('site_lang') || 'tr';
}

function initForgotForm(){
  const form = document.getElementById('forgot-form');
  if(!form) return;
  const msg = document.getElementById('forgot-msg');
  const submitBtn = document.getElementById('forgot-submit');

  form.addEventListener('submit', async function(e){
    e.preventDefault();
    const lang = recoveryCurrentLang();
    const email = document.getElementById('email').value.trim();

    if(!email){
      msg.textContent = translations['forgot.err_empty'][lang];
      msg.className = 'login-msg error';
      return;
    }

    submitBtn.disabled = true;
    msg.textContent = '';
    msg.className = 'login-msg';

    try{
      const res = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      await res.json().catch(()=>({}));

      msg.textContent = translations['forgot.ok_msg'][lang];
      msg.className = 'login-msg ok';
      form.reset();
    } catch(err){
      msg.textContent = translations['forgot.err_server'][lang];
      msg.className = 'login-msg error';
    } finally {
      submitBtn.disabled = false;
    }
  });
}

function initResetForm(){
  const form = document.getElementById('reset-form');
  if(!form) return;
  const msg = document.getElementById('reset-msg');
  const submitBtn = document.getElementById('reset-submit');

  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');

  if(!token){
    const lang = recoveryCurrentLang();
    msg.textContent = translations['reset.no_token'][lang];
    msg.className = 'login-msg error';
    submitBtn.disabled = true;
    return;
  }

  form.addEventListener('submit', async function(e){
    e.preventDefault();
    const lang = recoveryCurrentLang();
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if(!newPassword || !confirmPassword){
      msg.textContent = translations['reset.err_empty'][lang];
      msg.className = 'login-msg error';
      return;
    }
    if(newPassword !== confirmPassword){
      msg.textContent = translations['reset.err_mismatch'][lang];
      msg.className = 'login-msg error';
      return;
    }
    if(newPassword.length < 8){
      msg.textContent = translations['reset.err_weak'][lang];
      msg.className = 'login-msg error';
      return;
    }

    submitBtn.disabled = true;
    msg.textContent = '';
    msg.className = 'login-msg';

    try{
      const res = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: newPassword })
      });
      const data = await res.json().catch(()=>({}));

      if(res.ok && data.ok){
        msg.textContent = translations['reset.ok_msg'][lang];
        msg.className = 'login-msg ok';
        setTimeout(()=>{ window.location.href = 'login.html'; }, 1200);
        return;
      }

      let key = 'reset.err_server';
      if(data.error === 'invalid_or_expired') key = 'reset.err_invalid_token';
      else if(data.error === 'weak_password') key = 'reset.err_weak';
      else if(data.error === 'missing_fields') key = 'reset.err_empty';
      msg.textContent = translations[key][lang];
      msg.className = 'login-msg error';
    } catch(err){
      msg.textContent = translations['reset.err_server'][lang];
      msg.className = 'login-msg error';
    } finally {
      submitBtn.disabled = false;
    }
  });
}

document.addEventListener('DOMContentLoaded', ()=>{
  initForgotForm();
  initResetForm();
});
