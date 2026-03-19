/* ============================================================
   app.js — shared helpers for all app pages
   ============================================================ */

/* ── Auth guard ─────────────────────────── */
async function initApp() {
  try {
    const res  = await fetch('/api/auth/me', { credentials: 'include' });
    const data = await res.json();
    if (!data.success) { location.href = '/'; return null; }
    window._user = data.user;
    _fillSidebar(data.user);
    return data.user;
  } catch (e) { location.href = '/'; return null; }
}

function _fillSidebar(u) {
  const initials = u.name.trim().split(/\s+/).map(w => w[0]).join('').slice(0,2).toUpperCase();
  const av = _el('s-av');  if (av) { av.textContent = initials; av.style.background = u.avatar || '#6366f1'; }
  const nm = _el('s-nm');  if (nm) nm.textContent = u.name;
  const em = _el('s-em');  if (em) em.textContent = u.email;
}

/* ── API helper ─────────────────────────── */
async function api(method, url, body) {
  const opts = {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' }
  };
  if (body) opts.body = JSON.stringify(body);
  const res  = await fetch(url, opts);
  const data = await res.json();
  if (res.status === 401) { location.href = '/'; throw new Error('Unauth'); }
  return data;
}

/* ── Formatting ─────────────────────────── */
function fmtINR(n) {
  return new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR', maximumFractionDigits:0 }).format(n||0);
}
function fmtINRShort(n) {
  n = parseFloat(n)||0;
  if (n >= 1e7) return '₹'+(n/1e7).toFixed(1)+'Cr';
  if (n >= 1e5) return '₹'+(n/1e5).toFixed(1)+'L';
  if (n >= 1e3) return '₹'+(n/1e3).toFixed(1)+'K';
  return '₹'+Math.round(n);
}
function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
}

/* ── Toast ──────────────────────────────── */
function toast(msg, type) {
  let t = document.getElementById('_toast');
  if (!t) { t = document.createElement('div'); t.id = '_toast'; document.body.appendChild(t); }
  t.textContent = (type === 'err' ? '❌  ' : '✅  ') + msg;
  t.className   = 'toast ' + (type === 'err' ? 'err' : 'ok');
  t.style.display = 'block';
  clearTimeout(t._tid);
  t._tid = setTimeout(() => t.style.display = 'none', 3800);
}

/* ── Alert in a container ───────────────── */
function showAlert(id, msg, type) {
  const el = _el(id);
  if (!el) return;
  el.textContent = msg;
  el.className   = 'alert alert-' + (type||'error');
  el.classList.remove('hidden');
}
function hideAlert(id) {
  const el = _el(id);
  if (el) { el.className = 'alert hidden'; el.textContent = ''; }
}

/* ── Button loading state ───────────────── */
function setBtn(id, loading, label) {
  const b = _el(id);
  if (!b) return;
  b.disabled    = loading;
  b.textContent = loading ? '...' : label;
}

/* ── Sidebar toggle ─────────────────────── */
function _initSidebar() {
  const sb  = document.querySelector('.sidebar');
  const hbg = document.querySelector('.topbar-hamburger');
  const x   = document.querySelector('.sidebar-x');
  if (hbg) hbg.onclick = () => sb && sb.classList.add('open');
  if (x)   x.onclick   = () => sb && sb.classList.remove('open');
  // close on outside tap (mobile)
  document.addEventListener('click', e => {
    if (sb && sb.classList.contains('open') && !sb.contains(e.target) && e.target !== hbg)
      sb.classList.remove('open');
  });
}

/* ── Logout ─────────────────────────────── */
function _initLogout() {
  const btn = _el('logout-btn');
  if (btn) btn.onclick = async () => {
    await fetch('/api/auth/logout', { method:'POST', credentials:'include' });
    location.href = '/';
  };
}

/* ── OTP inputs ─────────────────────────── */
function initOTP(containerId) {
  const box    = _el(containerId);
  if (!box) return;
  const inputs = [...box.querySelectorAll('.otp-input')];
  inputs.forEach((inp, i) => {
    inp.addEventListener('input', () => {
      inp.value = inp.value.replace(/\D/g,'').slice(-1);
      inp.classList.toggle('filled', !!inp.value);
      if (inp.value && i < inputs.length-1) inputs[i+1].focus();
    });
    inp.addEventListener('keydown', e => {
      if (e.key === 'Backspace' && !inp.value && i > 0) inputs[i-1].focus();
    });
    inp.addEventListener('paste', e => {
      const txt = (e.clipboardData||window.clipboardData).getData('text').replace(/\D/g,'');
      if (txt.length >= 6) {
        inputs.forEach((d,j) => { d.value = txt[j]||''; d.classList.toggle('filled',!!txt[j]); });
        inputs[Math.min(5,txt.length-1)].focus();
        e.preventDefault();
      }
    });
  });
}
function getOTP(containerId) {
  return [..._el(containerId).querySelectorAll('.otp-input')].map(i => i.value).join('');
}

/* ── Password strength ──────────────────── */
function initPwStrength(inputId, barFillId) {
  const inp  = _el(inputId);
  const fill = _el(barFillId);
  if (!inp || !fill) return;
  inp.addEventListener('input', () => {
    const v = inp.value;
    let pct = 0, color = var_red;
    if (v.length >= 8)  pct = 40;
    if (v.length >= 8 && /[A-Z]/.test(v)) { pct = 70; color = '#f59e0b'; }
    if (v.length >= 10 && /[A-Z]/.test(v) && /[0-9]/.test(v) && /[^A-Za-z0-9]/.test(v)) { pct = 100; color = '#10b981'; }
    fill.style.width      = v ? pct+'%' : '0';
    fill.style.background = color;
  });
}
const var_red = '#ef4444';

/* ── Toggle password visibility ─────────── */
function initPwToggle(inputId, btnId) {
  const inp = _el(inputId);
  const btn = _el(btnId);
  if (!inp || !btn) return;
  btn.onclick = () => {
    inp.type    = inp.type === 'password' ? 'text' : 'password';
    btn.textContent = inp.type === 'password' ? '👁' : '🙈';
  };
}

/* ── Confirm modal ──────────────────────── */
function confirm(msg, onOk) {
  let ov = _el('_confirm-ov');
  if (!ov) {
    ov = document.createElement('div');
    ov.id = '_confirm-ov';
    ov.className = 'overlay hidden';
    ov.innerHTML = `<div class="modal" style="max-width:360px">
      <div class="modal-head"><h3>Confirm</h3><button class="modal-x btn" id="_confirm-x">✕</button></div>
      <p id="_confirm-msg" style="color:var(--text2);margin-bottom:20px;font-size:0.9rem"></p>
      <div class="modal-foot">
        <button class="btn btn-outline btn-sm" id="_confirm-cancel">Cancel</button>
        <button class="btn btn-danger btn-sm" id="_confirm-ok">Delete</button>
      </div>
    </div>`;
    document.body.appendChild(ov);
    _el('_confirm-x').onclick     = () => ov.classList.add('hidden');
    _el('_confirm-cancel').onclick = () => ov.classList.add('hidden');
  }
  _el('_confirm-msg').textContent = msg;
  _el('_confirm-ok').onclick = () => { ov.classList.add('hidden'); onOk(); };
  ov.classList.remove('hidden');
}

/* ── Modal helpers ──────────────────────── */
function openModal(id)  { _el(id) && _el(id).classList.remove('hidden'); }
function closeModal(id) { _el(id) && _el(id).classList.add('hidden'); }

/* ── DOM shorthand ──────────────────────── */
function _el(id) { return document.getElementById(id); }
function _val(id) { const e = _el(id); return e ? e.value.trim() : ''; }

/* ── Boot every app page ────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  _initSidebar();
  _initLogout();
});
