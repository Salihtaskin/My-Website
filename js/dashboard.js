/* ======================================================
   dashboard.js - Gerçek oturum kontrolü + admin paneli
   (Kullanıcı Yönetimi + Güvenlik sekmesi)
   /api/me ile giriş kontrolü yapar. Admin ise:
   - /api/admin/users ile kullanıcı listesi + onay/rol/silme
   - /api/admin/security ile IP/anomali/log görünürlüğü
   - /api/admin/force-logout ile bir kullanıcının tüm
     oturumlarını sonlandırma
====================================================== */

let allUsers = [];
let currentUser = null;
let currentFilter = 'all';
let securityLoaded = false;
let analyticsLoaded = false;
let blockedLoaded = false;
let twofaLoaded = false;
let contentLoaded = false;
let chartInstances = {};

function currentLang(){
  return localStorage.getItem('site_lang') || 'tr';
}

function t(key){
  const lang = currentLang();
  return translations[key] ? translations[key][lang] : key;
}

function showToast(key, type){
  const container = document.getElementById('toast-container');
  if(!container) return;
  const el = document.createElement('div');
  el.className = 'toast ' + (type || 'ok');
  el.textContent = t(key);
  container.appendChild(el);
  setTimeout(()=> el.classList.add('show'), 10);
  setTimeout(()=>{
    el.classList.remove('show');
    setTimeout(()=> el.remove(), 300);
  }, 3000);
}

function escapeHtml(str){
  const div = document.createElement('div');
  div.textContent = str == null ? '' : str;
  return div.innerHTML;
}

function formatDate(iso){
  if(!iso) return '—';
  try{
    const d = new Date(iso.replace(' ', 'T') + 'Z');
    return d.toLocaleString(currentLang() === 'tr' ? 'tr-TR' : 'en-GB', {
      day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit'
    });
  } catch(e){ return iso; }
}

/* ---------------- Oturum / hesap bilgisi ---------------- */

async function loadMe(){
  try{
    const res = await fetch('/api/me', { credentials: 'same-origin' });
    if(!res.ok){ window.location.href = 'login.html'; return null; }
    const data = await res.json();
    return data.user;
  } catch(err){
    window.location.href = 'login.html';
    return null;
  }
}

function renderAccountInfo(user){
  const roleLabel = user.role === 'admin' ? t('dash.role_admin') : t('dash.role_user');
  document.getElementById('account-info').innerHTML = `
    <div>${escapeHtml(user.full_name)}</div>
    <div>${escapeHtml(user.email)}</div>
    <div class="ok">${roleLabel}</div>
  `;
  document.getElementById('dash-welcome').textContent =
    user.role === 'admin' ? t('dash.welcome_admin') : t('dash.welcome_user');
}

/* ---------------- Kullanıcı Yönetimi sekmesi ---------------- */

function statusBadge(status){
  const map = {
    pending:  ['badge-pending', 'dash.status_pending'],
    approved: ['badge-approved', 'dash.status_approved'],
    rejected: ['badge-rejected', 'dash.status_rejected']
  };
  const [cls, key] = map[status] || map.pending;
  return `<span class="badge ${cls}">${t(key)}</span>`;
}

function roleBadge(role){
  const key = role === 'admin' ? 'dash.role_admin' : 'dash.role_user';
  const cls = role === 'admin' ? 'badge-admin' : 'badge-user';
  return `<span class="badge ${cls}">${t(key)}</span>`;
}

function renderUserTable(users){
  const tbody = document.getElementById('user-table-body');
  tbody.innerHTML = '';

  if(!users.length){
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;color:var(--text-dim);">${t('dash.no_users')}</td></tr>`;
    return;
  }

  users.forEach(u=>{
    const tr = document.createElement('tr');
    const isSelf = currentUser && u.id === currentUser.id;

    let actions = '';
    if(u.status === 'pending'){
      actions += `<button class="btn-mini approve" data-id="${u.id}" data-action="approve">${t('dash.btn_approve')}</button>`;
      actions += `<button class="btn-mini reject" data-id="${u.id}" data-action="reject">${t('dash.btn_reject')}</button>`;
    }
    if(u.role !== 'admin'){
      actions += `<button class="btn-mini promote" data-id="${u.id}" data-action="promote">${t('dash.btn_promote')}</button>`;
    } else if(!isSelf){
      actions += `<button class="btn-mini demote" data-id="${u.id}" data-action="demote">${t('dash.btn_demote')}</button>`;
    }
    if(!isSelf){
      actions += `<button class="btn-mini force-logout" data-id="${u.id}" data-action="force-logout">${t('dash.btn_force_logout')}</button>`;
      actions += `<button class="btn-mini delete" data-id="${u.id}" data-action="delete">${t('dash.btn_delete')}</button>`;
    }

    tr.innerHTML = `
      <td>${escapeHtml(u.full_name)}</td>
      <td>${escapeHtml(u.email)}</td>
      <td>${escapeHtml(u.phone || '—')}</td>
      <td>${roleBadge(u.role)}</td>
      <td>${statusBadge(u.status)}</td>
      <td>${u.last_login_at ? formatDate(u.last_login_at) : '—'}</td>
      <td class="mono-cell">${escapeHtml(u.last_login_ip || u.registered_ip || '—')}</td>
      <td class="actions-cell">${actions}</td>
    `;
    tbody.appendChild(tr);
  });
}

function renderStats(users){
  document.getElementById('stat-total').textContent = users.length;
  document.getElementById('stat-pending').textContent = users.filter(u=>u.status==='pending').length;
  document.getElementById('stat-approved').textContent = users.filter(u=>u.status==='approved').length;
  document.getElementById('stat-admins').textContent = users.filter(u=>u.role==='admin').length;
}

function applyUserFilters(){
  const q = document.getElementById('user-search').value.trim().toLowerCase();
  let filtered = allUsers;
  if(currentFilter !== 'all'){
    filtered = filtered.filter(u => u.status === currentFilter);
  }
  if(q){
    filtered = filtered.filter(u =>
      u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    );
  }
  renderUserTable(filtered);
}

async function loadAdminUsers(){
  try{
    const res = await fetch('/api/admin/users', { credentials: 'same-origin' });
    if(!res.ok) return;
    const data = await res.json();
    allUsers = data.users || [];
    renderStats(allUsers);
    applyUserFilters();
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
  else if(action === 'force-logout'){ endpoint = '/api/admin/force-logout'; toastKey = 'toast.forced_logout'; }
  else if(action === 'delete'){
    if(!confirm(t('dash.confirm_delete'))) return;
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

/* ---------------- Güvenlik sekmesi ---------------- */

function renderAnomalies(anomalies){
  const container = document.getElementById('anomaly-list');
  const items = [];

  (anomalies.brute_force || []).forEach(a=>{
    items.push(`
      <div class="anomaly-card danger">
        <div class="anomaly-title">🛑 ${t('dash.anomaly_bruteforce')}</div>
        <div class="anomaly-detail"><span class="mono-cell">${escapeHtml(a.ip)}</span> — ${a.attempts} ${t('dash.anomaly_attempts')}</div>
        <div class="anomaly-time">${formatDate(a.last_attempt)}</div>
      </div>
    `);
  });

  (anomalies.credential_stuffing || []).forEach(a=>{
    items.push(`
      <div class="anomaly-card warn">
        <div class="anomaly-title">⚠️ ${t('dash.anomaly_credstuffing')}</div>
        <div class="anomaly-detail">${escapeHtml(a.email)} — ${a.ip_count} ${t('dash.anomaly_diffips')}, ${a.attempts} ${t('dash.anomaly_attempts')}</div>
        <div class="anomaly-time">${formatDate(a.last_attempt)}</div>
      </div>
    `);
  });

  container.innerHTML = items.length
    ? items.join('')
    : `<div class="anomaly-card ok">✅ ${t('dash.anomaly_none')}</div>`;
}

function renderLoginLog(events){
  const tbody = document.getElementById('login-log-body');
  tbody.innerHTML = '';

  if(!events.length){
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-dim);">${t('dash.no_users')}</td></tr>`;
    return;
  }

  events.forEach(ev=>{
    const tr = document.createElement('tr');
    const statusHtml = ev.success
      ? `<span class="badge badge-approved">${t('dash.log_success')}</span>`
      : `<span class="badge badge-rejected">${t('dash.log_failed')}</span>`;
    const ua = (ev.user_agent || '').slice(0, 60);
    tr.innerHTML = `
      <td>${formatDate(ev.created_at)}</td>
      <td>${escapeHtml(ev.email || '—')}</td>
      <td class="mono-cell">${escapeHtml(ev.ip || '—')}</td>
      <td class="ua-cell" title="${escapeHtml(ev.user_agent || '')}">${escapeHtml(ua)}</td>
      <td>${statusHtml}</td>
    `;
    tbody.appendChild(tr);
  });
}

async function loadSecurity(){
  try{
    const res = await fetch('/api/admin/security', { credentials: 'same-origin' });
    if(!res.ok) return;
    const data = await res.json();

    document.getElementById('migration-warning').style.display = data.migration_required ? 'block' : 'none';

    const stats = data.stats || {};
    document.getElementById('sec-total').textContent = stats.total || 0;
    document.getElementById('sec-success').textContent = stats.success_count || 0;
    document.getElementById('sec-fail').textContent = stats.fail_count || 0;
    document.getElementById('sec-ips').textContent = stats.unique_ips || 0;

    renderAnomalies(data.anomalies || {});
    renderLoginLog(data.events || []);
  } catch(err){
    showToast('toast.error', 'error');
  }
}

/* ---------------- Sekme geçişi ---------------- */

function initTabs(){
  const tabs = document.querySelectorAll('.admin-tab');
  const panelIds = ['users','security','analytics','blocked','twofa','content'];
  tabs.forEach(btn=>{
    btn.addEventListener('click', ()=>{
      tabs.forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      const target = btn.dataset.tab;
      panelIds.forEach(id=>{
        const el = document.getElementById('tab-' + id);
        if(el) el.style.display = (target === id) ? 'block' : 'none';
      });
      if(target === 'security' && !securityLoaded){
        securityLoaded = true;
        loadSecurity();
      }
      if(target === 'analytics' && !analyticsLoaded){
        analyticsLoaded = true;
        loadAnalytics();
      }
      if(target === 'blocked' && !blockedLoaded){
        blockedLoaded = true;
        loadBlockedIps();
      }
      if(target === 'twofa' && !twofaLoaded){
        twofaLoaded = true;
        loadTwoFaStatus();
      }
      if(target === 'content' && !contentLoaded){
        contentLoaded = true;
        loadContentEditor();
      }
    });
  });
}

/* ---------------- Admin paneli başlatma ---------------- */

function initAdminPanel(){
  document.getElementById('admin-panel').style.display = 'block';
  initTabs();
  loadAdminUsers();

  document.getElementById('user-table-body').addEventListener('click', (e)=>{
    const btn = e.target.closest('button[data-action]');
    if(!btn) return;
    handleUserAction(Number(btn.dataset.id), btn.dataset.action);
  });

  document.getElementById('user-search').addEventListener('input', applyUserFilters);
  document.getElementById('user-filter').addEventListener('change', (e)=>{
    currentFilter = e.target.value;
    applyUserFilters();
  });

  document.getElementById('block-ip-btn').addEventListener('click', handleManualBlock);
  document.getElementById('blocked-ips-body').addEventListener('click', (e)=>{
    const btn = e.target.closest('button[data-unblock-ip]');
    if(!btn) return;
    handleUnblock(btn.dataset.unblockIp);
  });

  document.getElementById('twofa-start-btn').addEventListener('click', startTwoFaSetup);
  document.getElementById('twofa-confirm-btn').addEventListener('click', confirmTwoFaSetup);
  document.getElementById('twofa-disable-btn').addEventListener('click', disableTwoFa);

  document.getElementById('content-key-select').addEventListener('change', renderSelectedContentKey);
  document.getElementById('content-save-btn').addEventListener('click', saveContentKey);
  document.getElementById('content-reset-btn').addEventListener('click', resetContentKey);
}

function initLogout(){
  const btn = document.getElementById('logout-btn');
  if(!btn) return;
  btn.addEventListener('click', async ()=>{
    await fetch('/api/logout', { method: 'POST', credentials: 'same-origin' }).catch(()=>{});
    window.location.href = 'login.html';
  });
}

/* ---------------- Analitik sekmesi ---------------- */

function destroyChart(id){
  if(chartInstances[id]){
    chartInstances[id].destroy();
    delete chartInstances[id];
  }
}

function renderPieChart(canvasId, rows, labelField, valueField){
  destroyChart(canvasId);
  const ctx = document.getElementById(canvasId);
  if(!ctx || typeof Chart === 'undefined') return;
  const labels = rows.map(r => r[labelField] || '—');
  const data = rows.map(r => r[valueField] || 0);
  const palette = ['#00ff9d','#00b8ff','#ffbd2e','#ff5f56','#8a7cff','#ff7ce5','#5ce1e6','#c9d1c9'];
  chartInstances[canvasId] = new Chart(ctx, {
    type: 'doughnut',
    data: { labels, datasets: [{ data, backgroundColor: palette }] },
    options: {
      plugins: { legend: { position: 'bottom', labels: { color: '#c9d1c9', boxWidth: 12 } } },
      maintainAspectRatio: true
    }
  });
}

function renderTopPages(rows){
  const tbody = document.getElementById('top-pages-body');
  tbody.innerHTML = rows.length
    ? rows.map(r => `<tr><td>${escapeHtml(r.path || '—')}</td><td>${r.cnt}</td></tr>`).join('')
    : `<tr><td colspan="2" style="text-align:center;color:var(--text-dim);">${t('dash.no_users')}</td></tr>`;
}

function renderRecentVisits(rows){
  const tbody = document.getElementById('recent-visits-body');
  tbody.innerHTML = rows.length
    ? rows.map(r => `
        <tr>
          <td>${formatDate(r.created_at)}</td>
          <td class="mono-cell">${escapeHtml(r.ip || '—')}</td>
          <td>${escapeHtml(r.country || '—')}</td>
          <td>${escapeHtml(r.device_type || '—')}</td>
          <td>${escapeHtml((r.browser || '—') + ' / ' + (r.os || '—'))}</td>
          <td>${escapeHtml(r.path || '—')}</td>
        </tr>`).join('')
    : `<tr><td colspan="6" style="text-align:center;color:var(--text-dim);">${t('dash.no_users')}</td></tr>`;
}

async function loadAnalytics(){
  try{
    const res = await fetch('/api/admin/analytics', { credentials: 'same-origin' });
    if(!res.ok) return;
    const data = await res.json();

    document.getElementById('analytics-migration-warning').style.display = data.migration_required ? 'block' : 'none';
    document.getElementById('an-live').textContent = data.live_visitors || 0;
    document.getElementById('an-today-visits').textContent = (data.today && data.today.cnt) || 0;
    document.getElementById('an-today-unique').textContent = (data.today && data.today.unique_ips) || 0;

    renderPieChart('chart-device', data.by_device || [], 'device_type', 'cnt');
    renderPieChart('chart-browser', data.by_browser || [], 'browser', 'cnt');
    renderPieChart('chart-os', data.by_os || [], 'os', 'cnt');
    renderPieChart('chart-country', data.by_country || [], 'country', 'cnt');

    renderTopPages(data.top_pages || []);
    renderRecentVisits(data.recent || []);
  } catch(err){
    showToast('toast.error', 'error');
  }
}

/* ---------------- Engellenen IP'ler sekmesi ---------------- */

function renderBlockedIps(rows){
  const tbody = document.getElementById('blocked-ips-body');
  if(!rows.length){
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text-dim);">${t('dash.no_blocked')}</td></tr>`;
    return;
  }
  tbody.innerHTML = rows.map(r => `
    <tr>
      <td class="mono-cell">${escapeHtml(r.ip)}</td>
      <td>${escapeHtml(r.reason || '—')}</td>
      <td>${formatDate(r.blocked_at)}</td>
      <td>${r.blocked_until ? formatDate(r.blocked_until) : t('dash.blocked_permanent')}</td>
      <td class="actions-cell"><button class="btn-mini" data-unblock-ip="${escapeHtml(r.ip)}">${t('dash.btn_unblock')}</button></td>
    </tr>
  `).join('');
}

async function loadBlockedIps(){
  try{
    const res = await fetch('/api/admin/blocked-ips', { credentials: 'same-origin' });
    if(!res.ok) return;
    const data = await res.json();
    renderBlockedIps(data.blocked || []);
  } catch(err){
    showToast('toast.error', 'error');
  }
}

async function handleManualBlock(){
  const ip = document.getElementById('block-ip-input').value.trim();
  const reason = document.getElementById('block-reason-input').value.trim();
  const minutesRaw = document.getElementById('block-minutes-input').value.trim();
  if(!ip) return;

  try{
    const res = await fetch('/api/admin/blocked-ips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ action: 'block', ip, reason, minutes: minutesRaw ? Number(minutesRaw) : null })
    });
    if(res.ok){
      showToast('toast.blocked', 'ok');
      document.getElementById('block-ip-input').value = '';
      document.getElementById('block-reason-input').value = '';
      document.getElementById('block-minutes-input').value = '';
      loadBlockedIps();
    } else {
      showToast('toast.error', 'error');
    }
  } catch(err){
    showToast('toast.error', 'error');
  }
}

async function handleUnblock(ip){
  try{
    const res = await fetch('/api/admin/blocked-ips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ action: 'unblock', ip })
    });
    if(res.ok){
      showToast('toast.unblocked', 'ok');
      loadBlockedIps();
    } else {
      showToast('toast.error', 'error');
    }
  } catch(err){
    showToast('toast.error', 'error');
  }
}

/* ---------------- 2FA sekmesi ---------------- */

async function loadTwoFaStatus(){
  try{
    const res = await fetch('/api/admin/2fa-setup', { credentials: 'same-origin' });
    if(!res.ok) return;
    const data = await res.json();

    const statusEl = document.getElementById('twofa-status');
    const setupBlock = document.getElementById('twofa-setup-block');
    const startBtn = document.getElementById('twofa-start-btn');
    const disableBlock = document.getElementById('twofa-disable-block');

    if(data.enabled){
      statusEl.innerHTML = `<span class="badge badge-approved">${t('dash.2fa_enabled_msg')}</span>`;
      setupBlock.style.display = 'none';
      startBtn.style.display = 'none';
      disableBlock.style.display = 'block';
    } else {
      // GET her zaman (onaylanmamış) bir secret üretir/yeniden döner, bu yüzden
      // ayrı bir "başlat" adımına gerek yok: doğrudan kurulum bloğunu göster.
      statusEl.innerHTML = `<span class="badge badge-pending">${t('dash.2fa_disabled_msg')}</span>`;
      disableBlock.style.display = 'none';
      startBtn.style.display = 'none';
      document.getElementById('twofa-secret').textContent = data.secret || '—';
      setupBlock.style.display = 'block';
    }
  } catch(err){
    showToast('toast.error', 'error');
  }
}

async function startTwoFaSetup(){
  await loadTwoFaStatus();
}

async function confirmTwoFaSetup(){
  const code = document.getElementById('twofa-confirm-code').value.trim();
  if(!code) return;
  try{
    const res = await fetch('/api/admin/2fa-setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ code })
    });
    const data = await res.json().catch(()=>({}));
    if(res.ok && data.ok){
      showToast('toast.2fa_enabled', 'ok');
      document.getElementById('twofa-confirm-code').value = '';
      loadTwoFaStatus();
    } else {
      showToast('toast.invalid_code', 'error');
    }
  } catch(err){
    showToast('toast.error', 'error');
  }
}

async function disableTwoFa(){
  const code = document.getElementById('twofa-disable-code').value.trim();
  if(!code) return;
  try{
    const res = await fetch('/api/admin/2fa-disable', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ code })
    });
    const data = await res.json().catch(()=>({}));
    if(res.ok && data.ok){
      showToast('toast.2fa_disabled', 'ok');
      document.getElementById('twofa-disable-code').value = '';
      loadTwoFaStatus();
    } else {
      showToast('toast.invalid_code', 'error');
    }
  } catch(err){
    showToast('toast.error', 'error');
  }
}

/* ---------------- İçerik (CMS) sekmesi ---------------- */

let contentOverrides = {};

function populateContentKeySelect(){
  const select = document.getElementById('content-key-select');
  select.innerHTML = '';
  Object.keys(translations).sort().forEach(key=>{
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = key;
    select.appendChild(opt);
  });
}

function renderSelectedContentKey(){
  const key = document.getElementById('content-key-select').value;
  const override = contentOverrides[key] || {};
  const def = translations[key] || { tr: '', en: '' };
  document.getElementById('content-tr-input').value = override.tr || def.tr || '';
  document.getElementById('content-en-input').value = override.en || def.en || '';
}

function renderContentOverridesList(){
  const container = document.getElementById('content-overrides-list');
  const keys = Object.keys(contentOverrides);
  if(!keys.length){
    container.innerHTML = `<div class="anomaly-card ok">${t('dash.content_none')}</div>`;
    return;
  }
  container.innerHTML = keys.map(key => `
    <div class="anomaly-card warn" style="margin-bottom:10px;">
      <div class="anomaly-title mono-cell">${escapeHtml(key)}</div>
      <div class="anomaly-detail">TR: ${escapeHtml((contentOverrides[key].tr || '').slice(0,80))}</div>
      <div class="anomaly-detail">EN: ${escapeHtml((contentOverrides[key].en || '').slice(0,80))}</div>
    </div>
  `).join('');
}

async function loadContentEditor(){
  populateContentKeySelect();
  try{
    const res = await fetch('/api/admin/content', { credentials: 'same-origin' });
    if(res.ok){
      const data = await res.json();
      contentOverrides = data.overrides || {};
    }
  } catch(err){ /* sessizce geç, varsayılanlarla devam */ }
  renderSelectedContentKey();
  renderContentOverridesList();
}

async function saveContentKey(){
  const key = document.getElementById('content-key-select').value;
  const tr = document.getElementById('content-tr-input').value;
  const en = document.getElementById('content-en-input').value;
  try{
    const res = await fetch('/api/admin/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ action: 'save', key, tr, en })
    });
    if(res.ok){
      showToast('toast.saved', 'ok');
      contentOverrides[key] = { tr, en };
      renderContentOverridesList();
    } else {
      showToast('toast.error', 'error');
    }
  } catch(err){
    showToast('toast.error', 'error');
  }
}

async function resetContentKey(){
  const key = document.getElementById('content-key-select').value;
  try{
    const res = await fetch('/api/admin/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ action: 'reset', key })
    });
    if(res.ok){
      showToast('toast.reset', 'ok');
      delete contentOverrides[key];
      renderSelectedContentKey();
      renderContentOverridesList();
    } else {
      showToast('toast.error', 'error');
    }
  } catch(err){
    showToast('toast.error', 'error');
  }
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
