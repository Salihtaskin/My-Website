/* ======================================================
   contact.js - Ana sayfadaki iletişim formu.
   /api/contact uç noktasına POST atar, gerçekten e-posta
   gönderir (Resend yapılandırılmışsa) ve veritabanına kaydeder.
====================================================== */

function contactCurrentLang(){
  return localStorage.getItem('site_lang') || 'tr';
}

function initContactForm(){
  const form = document.getElementById('contact-form');
  if(!form) return;
  const msg = document.getElementById('contact-msg');
  const submitBtn = document.getElementById('contact-submit');
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  form.addEventListener('submit', async function(e){
    e.preventDefault();
    const lang = contactCurrentLang();
    const name = document.getElementById('contact-name').value.trim();
    const email = document.getElementById('contact-email').value.trim();
    const message = document.getElementById('contact-message').value.trim();
    const website = document.getElementById('contact-website').value; // honeypot

    if(!name || !email || !message){
      msg.textContent = translations['contact.form_err_missing'][lang];
      msg.className = 'login-msg error';
      return;
    }
    if(!emailRe.test(email)){
      msg.textContent = translations['contact.form_err_email'][lang];
      msg.className = 'login-msg error';
      return;
    }

    submitBtn.disabled = true;
    msg.textContent = '';
    msg.className = 'login-msg';

    try{
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message, website })
      });
      const data = await res.json().catch(()=>({}));

      if(res.ok && data.ok){
        msg.textContent = translations['contact.form_success'][lang];
        msg.className = 'login-msg ok';
        form.reset();
        return;
      }

      let key = 'contact.form_err_server';
      if(data.error === 'missing_fields') key = 'contact.form_err_missing';
      else if(data.error === 'invalid_email') key = 'contact.form_err_email';
      else if(data.error === 'rate_limited') key = 'contact.form_err_rate_limited';
      msg.textContent = translations[key][lang];
      msg.className = 'login-msg error';
    } catch(err){
      msg.textContent = translations['contact.form_err_server'][lang];
      msg.className = 'login-msg error';
    } finally {
      submitBtn.disabled = false;
    }
  });
}

document.addEventListener('DOMContentLoaded', initContactForm);
