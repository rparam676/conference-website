// =============================================
//  TechSummit 2026 — Session Catalog JS
//  js/sessions.js
// =============================================

// ── localStorage helpers ─────────────────────
const KEY     = 'conf_sessions';
const getAll  = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
const saveAll = arr => { try { localStorage.setItem(KEY, JSON.stringify(arr)); return true; } catch { return false; } };
const uid     = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

// ── Utility helpers ───────────────────────────
const esc     = s => String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const fmtDate = s => s ? new Date(s).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }) : '';
const catIcon = { Keynote:'🎤', Workshop:'🛠', Panel:'💬', 'Lightning Talk':'⚡', Networking:'🤝' };

// ── Toast Notifications ───────────────────────
function toast(msg, err = false) {
  const wrap = document.getElementById('toasts');
  if (!wrap) return;
  const el = document.createElement('div');
  el.className = 'toast-msg' + (err ? ' err' : '');
  el.innerHTML = `<span>${err ? '✕' : '✓'}</span><span>${msg}</span>`;
  wrap.appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 300); }, 3200);
}

// ── Field Validation ──────────────────────────
function validateField(field) {
  const id    = field.id;
  const val   = field.value.trim();
  const errEl = document.getElementById(id + 'Error');
  if (!errEl) return true;

  let ok = true, msg = '';

  if (field.required && !val) { ok = false; msg = 'This field is required.'; }

  if (ok && val) {
    if (id === 'sessionTitle' && val.length < 3) {
      ok = false; msg = 'Title must be at least 3 characters.';
    }
  }

  field.classList.toggle('is-valid',   ok && !!val);
  field.classList.toggle('is-invalid', !ok);
  errEl.textContent = msg;
  errEl.classList.toggle('show', !ok);
  return ok;
}

function validateForm(form) {
  let valid = true;
  form.querySelectorAll('input, select').forEach(f => {
    if (!validateField(f)) valid = false;
  });
  return valid;
}

// ── Render a single session card ─────────────
function renderCard(s) {
  const wrap      = document.createElement('div');
  wrap.className  = 'col-md-6';
  wrap.dataset.id = s.id;

  const icon = catIcon[s.category] || '📋';

  wrap.innerHTML = `
    <div class="att-card h-100">
      <div class="att-head">
        <div class="att-initials" style="font-size:1.4rem;">${icon}</div>
        <div>
          <div class="att-name session-title">${esc(s.sessionTitle)}</div>
          <span class="att-badge session-category">${esc(s.category)}</span>
        </div>
      </div>
      <div class="att-body">
        <div class="att-row">⏱ &nbsp;<strong style="color:var(--cream)">${esc(s.duration)}</strong></div>
        <div class="att-row">🎟 &nbsp;<strong style="color:var(--cream)">${esc(s.fee)}</strong></div>
        ${s.speaker ? `<div class="att-row">🎤 &nbsp;${esc(s.speaker)}</div>` : ''}
        <div class="att-row" style="font-size:0.72rem;opacity:0.45;margin-top:4px;">
          🆔 &nbsp;${esc(s.id)}
        </div>
        <div class="att-row" style="font-size:0.72rem;opacity:0.45;">
          📅 &nbsp;Added ${fmtDate(s.addedDate)}
        </div>
      </div>
      <div class="att-foot">
        <button class="btn-edit" onclick="editSession('${s.id}')">Edit</button>
        <button class="btn-del"  onclick="deleteSession('${s.id}')">Remove</button>
      </div>
    </div>`;
  return wrap;
}

// ── Render all sessions ───────────────────────
function renderAll() {
  const grid     = document.getElementById('grid');
  const empty    = document.getElementById('empty');
  const count    = document.getElementById('count');
  if (!grid) return;

  const sessions = getAll();
  if (count) count.textContent = sessions.length;
  grid.innerHTML = '';

  if (!sessions.length) {
    if (empty) empty.style.display = 'block';
    return;
  }
  if (empty) empty.style.display = 'none';

  sessions.forEach(s => grid.appendChild(renderCard(s)));

  // Re-apply any active search filter after re-render
  const q = $('#searchInput').val().toLowerCase().trim();
  if (q) applyFilter(q);
}

// ── jQuery Search / Filter ────────────────────
function applyFilter(query) {
  let visible = 0;

  $('.col-md-6[data-id]').each(function () {
    const title    = $(this).find('.session-title').text().toLowerCase();
    const category = $(this).find('.session-category').text().toLowerCase();
    const match    = title.indexOf(query) > -1 || category.indexOf(query) > -1;

    if (match) { $(this).show(); visible++; }
    else        { $(this).hide(); }
  });

  $('#noResults').toggle(visible === 0 && getAll().length > 0);
}

// ── Delete a session ──────────────────────────
function deleteSession(id) {
  if (!confirm('Remove this session from the catalog?')) return;

  const el = document.querySelector(`[data-id="${id}"]`);
  if (el) el.style.cssText = 'opacity:0;transform:scale(0.95);transition:all 0.25s;';

  setTimeout(() => {
    if (saveAll(getAll().filter(s => s.id !== id))) {
      renderAll();
      toast('Session removed.');
    }
  }, 250);
}

// ── Edit a session ────────────────────────────
function editSession(id) {
  const s = getAll().find(x => x.id === id);
  if (!s) return;

  const form              = document.getElementById('sessionForm');
  form.dataset.editId     = id;
  form.sessionTitle.value = s.sessionTitle;
  form.category.value     = s.category;
  form.duration.value     = s.duration;
  form.fee.value          = s.fee;
  form.speaker.value      = s.speaker || '';

  document.getElementById('editBanner')?.classList.add('show');
  document.getElementById('submitBtn').textContent = 'Update Session';
  document.getElementById('sessionFormSection')
    ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  toast('Edit mode — update the fields and save.');
}

// ── Cancel edit mode ──────────────────────────
function cancelEdit() {
  resetForm();
  document.getElementById('editBanner')?.classList.remove('show');
  document.getElementById('submitBtn').textContent = 'Add Session';
}

// ── Reset form to blank ───────────────────────
function resetForm() {
  const form = document.getElementById('sessionForm');
  if (!form) return;
  delete form.dataset.editId;
  form.reset();
  form.querySelectorAll('input, select').forEach(f => f.classList.remove('is-valid', 'is-invalid'));
  form.querySelectorAll('.field-error').forEach(e => { e.textContent = ''; e.classList.remove('show'); });
  document.getElementById('editBanner')?.classList.remove('show');
  document.getElementById('submitBtn').textContent = 'Add Session';
}

// ── Form submit handler ───────────────────────
function handleSubmit(e) {
  e.preventDefault();
  const form   = e.target;
  if (!validateForm(form)) return;

  const d      = new FormData(form);
  const isEdit = !!form.dataset.editId;

  const entry = {
    id:           form.dataset.editId || uid(),
    sessionTitle: d.get('sessionTitle').trim(),
    category:     d.get('category'),
    duration:     d.get('duration'),
    fee:          d.get('fee'),
    speaker:      d.get('speaker').trim() || null,
    addedDate:    isEdit
      ? (getAll().find(s => s.id === form.dataset.editId)?.addedDate || new Date().toISOString())
      : new Date().toISOString()
  };

  let sessions = getAll();

  if (isEdit) {
    const i = sessions.findIndex(s => s.id === entry.id);
    sessions[i] = entry;
  } else {
    sessions.push(entry);
  }

  if (saveAll(sessions)) {
    toast(isEdit ? 'Session updated!' : `"${entry.sessionTitle}" added to the catalog!`);
    cancelEdit();
    renderAll();
    setTimeout(() => {
      document.getElementById('grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 400);
  } else {
    toast('Save failed. Please try again.', true);
  }
}

// =============================================
//  jQuery — DOM Ready
// =============================================
$(document).ready(function () {

  renderAll();

  const form = document.getElementById('sessionForm');
  if (form) {
    form.addEventListener('submit', handleSubmit);
    form.querySelectorAll('input, select').forEach(f => {
      f.addEventListener('blur',  () => validateField(f));
      f.addEventListener('input', () => { if (f.classList.contains('is-invalid')) validateField(f); });
    });
  }

  // jQuery real-time search
  $('#searchInput').on('keyup input', function () {
    const query = $(this).val().toLowerCase().trim();
    $('#clearSearch').toggle(query.length > 0);
    applyFilter(query);
  });

  // Clear search ✕ button
  $('#clearSearch').on('click', function () {
    $('#searchInput').val('').trigger('input');
    $(this).hide();
  });

});