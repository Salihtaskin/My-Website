/* ======================================================
   dashboard.js - Gerçek oturum kontrolü + admin paneli
   /api/me ile giriş kontrolü yapar. Admin ise /api/admin/users
   ile kullanıcı listesini çeker ve onay/rol işlemlerini
   /api/admin/update-status ve /api/admin/delete-user
   endpoint'lerine bağlar.
====================================================== */

let allUsers = [];
let currentUser = null;

function currentLang(){
  return localStorage.getItem('site_lang') || 'tr';
}

function showToast(key, type){
  const lang = currentLang();
  const container = document.getElementById('toast-container');
  if(!container) return;
  const t = document.createElement('div');
  t.className = 'toast ' + (type || 'ok');
  t.textContent = translations[key] ? translations[key][lang] : key;
  container.appendChild(t);
  setTimeout(()=> t.classList.add('show'), 10);
  setTimeout(()=>{
    t.classList.remove('show');
    setTimeout(()=> t.remove(), 300);
  }, 3000);
}

async function loadMe(){
  try{
    const res = await fetch('/api/me', { credentials: 'same-origin' });
    if(!res.ok){
      window.location.href = 'login.html';
      return null;
    }
    const data = await res.json();
    return data.user;
  } catch(err){
    window.location.href = 'login.html';
    return null;
  }
}

function renderAccountInfo(user){
  const lang = currentLang();
  const el = document.getElementById('account-info');
  const roleLabel = user.role === 'admin' ? translations['dash.role_admin'][lang] : translations['dash.role_user'][lang];
  el.innerHTML = `
    <div>${user.full_name}</div>
    <div>${user.email}</div>
    <div class="ok">${roleLabel}</div>
  `;
  const welcome = document.getElementById('dash-welcome');
  welcome.textContent = user.role === 'admin'
    ? translations['dash.welcome_admin'][lang]
    : translations['dash.welcome_user'][lang];
}

function statusBadge(status){
  const lang = currentLang();
  const map = {
    pending: ['badge-pending', 'dash.status_pending'],
    approved: ['badge-approved', 'dash.status_approved'],
    rejected: ['badge-rejected', 'dash.status_rejected']
  };
  const [cls, key] = map[status] || map.pending;
  return `<span class="badge ${cls}">${translations[key][lang]}</span>`;
}

function roleBadge(role){
  const lang = currentLang();
  const key = role === 'admin' ? 'dash.role_admin' : 'dash.role_user';
  const cls = role === 'admin' ? 'badge-admin' : 'badge-user';
  return `<span class="badge ${cls}">${translations[key][lang]}</span>`;
}

function renderUserTable(users){
  const lang = currentLang();
  const tbody = document.getElementById('user-table-body');
  tbody.innerHTML = '';

  if(!users.length){
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;color:var(--text-dim);">${translations['dash.no_users'][lang]}</td></tr>`;
    return;
  }

  users.forEach(u=>{
    const tr = document.createElement('tr');
    const isSelf = currentUser && u.id === currentUser.id;

    let actions = '';
    if(u.status === 'pending'){
      actions += `<button class="btn-mini approve" data-id="${u.id}" data-action="approve">${translations['dash.btn_approve'][lang]}</button>`;
      actions += `<button class="btn-mini reject" data-id="${u.id}" data-action="reject">${translations['dash.btn_reject'][lang]}</button>`;
    }
    if(u.role !== 'admin'){
      actions += `<button class="btn-mini promote" data-id="${u.id}" data-action="promote">${translations['dash.btn_promote'][lang]}</button>`;
    } else if(!isSelf){
      actions += `<button class="btn-mini demote" data-id="${u.id}" data-action="demote">${translations['dash.btn_demote'][lang]}</button>`;
    }
    if(!isSelf){
      actions += `<button class="btn-mini delete" data-id="${u.id}" data-action="delete">${translations['dash.btn_delete'][lang]}</button>`;
    }

    tr.innerHTML = `
      <td>${escapeHtml(u.full_name)}</td>
      <td>${escapeHtml(u.email)}</td>
      <td>${escapeHtml(u.phone || '—')}</td>
      <td>${roleBadge(u.role)}</td>
      <td>${statusBadge(u.status)}</td>
      <td class="actions-cell">${actions}</td>
    `;
    tbody.appendChild(tr);
  });
}

function escapeHtml(str){
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function renderStats(users){
  document.getElementById('stat-total').textContent = users.length;
  document.getElementById('stat-pending').textContent = users.filter(u=>u.status==='pending').length;
  document.getElementById('stat-approved').textContent = users.filter(u=>u.status==='approved').length;
  document.getElementById('stat-admins').textContent = users.filter(u=>u.role==='admin').length;
}

async function loadAdminUsers(){
  try{
    const res = await fetch('/api/admin/users', { credentials: 'same-origin' });
    if(!res.ok) return;
    const data = await res.json();
    allUsers = data.users || [];
    renderStats(allUsers);
    renderUserTable(allUsers);
  } catch(err){
    showToast('toast.error', 'error');
  }
}

async function handleUserAction(id, action){
  let body = { user_id: id };
  let endpoint = '/api/admin/update-status';
  let toastKey = 'toast.error';

  if(action === 'approve'){ body.status = 'approved'; toastKey = 'toast.approved'; }
  else if(action === 'reject'){ body.status = 'rejected'; toastKey = 'toast.rejected'; }
  else if(action === 'promote'){ body.role = 'admin'; toastKey = 'toast.promoted'; }
  else if(action === 'demote'){ body.role = 'user'; toastKey = 'toast.demoted'; }
  else if(action === 'delete'){
    const lang = currentLang();
    if(!confirm(translations['dash.confirm_delete'][lang])) return;
    endpoint = '/api/admin/delete-user';
    toastKey = 'toast.deleted';
  }

  try{
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(body)
    });
    if(res.ok){
      showToast(toastKey, 'ok');
      loadAdminUsers();
    } else {
      showToast('toast.error', 'error');
    }
  } catch(err){
    showToast('toast.error', 'error');
  }
}

function initAdminPanel(){
  const panel = document.getElementById('admin-panel');
  panel.style.display = 'block';
  loadAdminUsers();

  document.getElementById('user-table-body').addEventListener('click', (e)=>{
    const btn = e.target.closest('button[data-action]');
    if(!btn) return;
    handleUserAction(Number(btn.dataset.id), btn.dataset.action);
  });

  document.getElementById('user-search').addEventListener('input', (e)=>{
    const q = e.target.value.trim().toLowerCase();
    const filtered = allUsers.filter(u =>
      u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
    renderUserTable(filtered);
  });
}

function initLogout(){
  const btn = document.getElementById('logout-btn');
  if(!btn) return;
  btn.addEventListener('click', async ()=>{
    await fetch('/api/logout', { method: 'POST', credentials: 'same-origin' }).catch(()=>{});
    window.location.href = 'login.html';
  });
}

document.addEventListener('DOMContentLoaded', async ()=>{
  initLogout();
  const user = await loadMe();
  if(!user) return;
  currentUser = user;
  renderAccountInfo(user);
  if(user.role === 'admin'){
    initAdminPanel();
  }
});
