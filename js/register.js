/* ======================================================
   register.js - Kayıt formu + şifre güç göstergesi
   /api/register endpoint'ine POST atar (Cloudflare Pages
   Functions + D1). Yeni hesap 'pending' durumunda oluşur,
   admin onayı gerekir.
====================================================== */

function currentLang(){
  return localStorage.getItem('site_lang') || 'tr';
}

function passwordStrength(pw){
  let score = 0;
  if(pw.length >= 8) score++;
  if(pw.length >= 12) score++;
  if(/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if(/[0-9]/.test(pw)) score++;
  if(/[^a-zA-Z0-9]/.test(pw)) score++;
  return Math.min(score, 5);
}

function initStrengthMeter(){
  const pwInput = document.getElementById('password');
  const fill = document.getElementById('strength-fill');
  const label = document.getElementById('strength-label');
  if(!pwInput || !fill) return;

  pwInput.addEventListener('input', ()=>{
    const lang = currentLang();
    const score = passwordStrength(pwInput.value);
    const pct = (score / 5) * 100;
    fill.style.width = pct + '%';

    if(score <= 2){
      fill.style.background = 'var(--neon-red)';
      label.textContent = pwInput.value ? translations['register.strength_weak'][lang] : '';
    } else if(score <= 3){
      fill.style.background = '#ffbd2e';
      label.textContent = translations['register.strength_medium'][lang];
    } else {
      fill.style.background = 'var(--neon)';
      label.textContent = translations['register.strength_strong'][lang];
    }
  });
}

function initRegisterForm(){
  const form = document.getElementById('register-form');
  if(!form) return;
  const msg = document.getElementById('register-msg');
  const submitBtn = document.getElementById('register-submit');

  form.addEventListener('submit', async function(e){
    e.preventDefault();
    const lang = currentLang();
    const full_name = document.getElementById('full_name').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const password = document.getElementById('password').value;
    const confirm = document.getElementById('confirm').value;

    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if(!full_name || !email || !password || !confirm){
      msg.textContent = translations['register.err_missing'][lang];
      msg.className = 'login-msg error';
      return;
    }
    if(!emailRe.test(email)){
      msg.textContent = translations['register.err_email_invalid'][lang];
      msg.className = 'login-msg error';
      return;
    }
    if(password.length < 8){
      msg.textContent = translations['register.err_password_weak'][lang];
      msg.className = 'login-msg error';
      return;
    }
    if(password !== confirm){
      msg.textContent = translations['register.err_password_mismatch'][lang];
      msg.className = 'login-msg error';
      return;
    }

    submitBtn.disabled = true;
    msg.textContent = '';
    msg.className = 'login-msg';

    try{
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name, email, phone, password })
      });
      const data = await res.json().catch(()=>({}));

      if(res.ok && data.ok){
        msg.textContent = translations['register.success'][lang];
        msg.className = 'login-msg ok';
        form.reset();
        document.getElementById('strength-fill').style.width = '0%';
        document.getElementById('strength-label').textContent = '';
        return;
      }

      let key = 'register.err_server';
      if(data.error === 'email_exists') key = 'register.err_email_exists';
      else if(data.error === 'invalid_email') key = 'register.err_email_invalid';
      else if(data.error === 'weak_password') key = 'register.err_password_weak';
      else if(data.error === 'missing_fields') key = 'register.err_missing';
      msg.textContent = translations[key][lang];
      msg.className = 'login-msg error';
    } catch(err){
      msg.textContent = translations['register.err_server'][lang];
      msg.className = 'login-msg error';
    } finally {
      submitBtn.disabled = false;
    }
  });
}

document.addEventListener('DOMContentLoaded', ()=>{
  initStrengthMeter();
  initRegisterForm();
});
