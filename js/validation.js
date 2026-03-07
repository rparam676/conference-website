const KEY = 'conf_attendees';

const getAll = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
const saveAll = (arr) => { try { localStorage.setItem(KEY, JSON.stringify(arr)); return true; } catch { return false; } };
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

function toast(msg, err = false) {
    const wrap = document.getElementById('toasts');
    if (!wrap) return;
    const el = document.createElement('div');
    el.className = 'toast-msg' + (err ? ' err' : '');
    el.innerHTML = `<span>${err ? '✕' : '✓'}</span><span>${msg}</span>`;
    wrap.appendChild(el);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 300); }, 3200);
}

function validateField(field) {
    const id = field.id;
    const val = field.value.trim();
    const errEl = document.getElementById(id + 'Error');
    if (!errEl) return true;

    let ok = true, msg = '';

    if (field.required && !val) { ok = false; msg = 'This field is required.'; }

    if (ok && val) {
        if (id === 'firstName' || id === 'lastName') {
            if (val.length < 2) { ok = false; msg = 'Must be at least 2 characters.'; }
        }
        if (id === 'email') {
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) { ok = false; msg = 'Enter a valid email address.'; }
        }
        if (id === 'phone') {
            if (!/^[\d\s\-\+\(\)\.]{7,20}$/.test(val)) { ok = false; msg = 'Enter a valid phone number.'; }
        }
        if (id === 'institution' && val.length < 3) { ok = false; msg = 'Enter a valid institution name.'; }
    }

    field.classList.toggle('is-valid', ok && !!val);
    field.classList.toggle('is-invalid', !ok);
    errEl.textContent = msg;
    errEl.classList.toggle('show', !ok);
    return ok;
}

function validateForm(form) {
    let valid = true;
    form.querySelectorAll('input,select').forEach(f => { if (!validateField(f)) valid = false; });
    return valid;
}

const yearMap = { '1':'1st Year','2':'2nd Year','3':'3rd Year','4':'4th Year','5':'Graduate','6':'Faculty' };
const initials = (f, l) => `${f?.[0]||''}${l?.[0]||''}`.toUpperCase();
const fmtDate = s => s ? new Date(s).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : '';
const esc = s => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

function renderCard(a) {
    const wrap = document.createElement('div');
    wrap.className = 'col-md-6 col-lg-4';
    wrap.dataset.id = a.id;
    wrap.innerHTML = `
        <div class="att-card h-100">
            <div class="att-head">
                <div class="att-initials">${initials(a.firstName, a.lastName)}</div>
                <div>
                    <div class="att-name">${esc(a.firstName)} ${esc(a.lastName)}</div>
                    <span class="att-badge">Registered</span>
                </div>
            </div>
            <div class="att-body">
                <div class="att-row">✉ &nbsp;${esc(a.email)}</div>
                <div class="att-row">🎓 &nbsp;${yearMap[a.yearLevel] || a.yearLevel}</div>
                <div class="att-row">🏛 &nbsp;${esc(a.institution)}</div>
                ${a.phone ? `<div class="att-row">📞 &nbsp;${esc(a.phone)}</div>` : ''}
                <div class="att-row" style="font-size:0.75rem;opacity:0.5;margin-top:4px;">📅 &nbsp;${fmtDate(a.registrationDate)}</div>
            </div>
            <div class="att-foot">
                <button class="btn-edit" onclick="editAttendee('${a.id}')">Edit</button>
                <button class="btn-del" onclick="deleteAttendee('${a.id}')">Remove</button>
            </div>
        </div>`;
    return wrap;
}

function renderAll() {
    const grid = document.getElementById('grid');
    const empty = document.getElementById('empty');
    const count = document.getElementById('count');
    if (!grid) return;
    const attendees = getAll();
    if (count) count.textContent = attendees.length;
    grid.innerHTML = '';
    if (!attendees.length) { if (empty) empty.style.display = 'block'; return; }
    if (empty) empty.style.display = 'none';
    attendees.forEach(a => grid.appendChild(renderCard(a)));
}

function deleteAttendee(id) {
    if (!confirm('Remove this attendee?')) return;
    const el = document.querySelector(`[data-id="${id}"]`);
    if (el) { el.style.cssText = 'opacity:0;transform:scale(0.95);transition:all 0.25s'; }
    setTimeout(() => {
        if (saveAll(getAll().filter(a => a.id !== id))) { renderAll(); toast('Attendee removed.'); }
    }, 250);
}

function editAttendee(id) {
    const a = getAll().find(x => x.id === id);
    if (!a) return;
    const form = document.getElementById('signupForm');
    form.dataset.editId = id;
    form.firstName.value = a.firstName;
    form.lastName.value = a.lastName;
    form.email.value = a.email;
    form.yearLevel.value = a.yearLevel;
    form.phone.value = a.phone || '';
    form.institution.value = a.institution;
    document.getElementById('editBanner')?.classList.add('show');
    document.getElementById('submitBtn').textContent = 'Update Registration';
    document.getElementById('registrationForm')?.scrollIntoView({ behavior: 'smooth' });
    toast('Edit mode — update and submit to save.');
}

function cancelEdit() {
    const form = document.getElementById('signupForm');
    if (!form) return;
    delete form.dataset.editId;
    form.reset();
    form.querySelectorAll('input,select').forEach(f => f.classList.remove('is-valid','is-invalid'));
    form.querySelectorAll('.field-error').forEach(e => { e.textContent=''; e.classList.remove('show'); });
    document.getElementById('editBanner')?.classList.remove('show');
    document.getElementById('submitBtn').textContent = 'Register Now';
}

function handleSubmit(e) {
    e.preventDefault();
    const form = e.target;
    if (!validateForm(form)) return;

    const d = new FormData(form);
    const isEdit = !!form.dataset.editId;
    const entry = {
        id: form.dataset.editId || uid(),
        firstName: d.get('firstName').trim(),
        lastName: d.get('lastName').trim(),
        email: d.get('email').trim(),
        yearLevel: d.get('yearLevel'),
        phone: d.get('phone').trim() || null,
        institution: d.get('institution').trim(),
        registrationDate: isEdit
            ? getAll().find(a => a.id === form.dataset.editId)?.registrationDate
            : new Date().toISOString()
    };

    let attendees = getAll();
    const dupe = attendees.find(a => a.email.toLowerCase() === entry.email.toLowerCase() && a.id !== entry.id);
    if (dupe) {
        const ef = document.getElementById('email');
        const ee = document.getElementById('emailError');
        ef.classList.add('is-invalid'); ee.textContent = 'This email is already registered.'; ee.classList.add('show');
        return;
    }

    if (isEdit) { const i = attendees.findIndex(a => a.id === entry.id); attendees[i] = entry; }
    else { attendees.push(entry); }

    if (saveAll(attendees)) {
        toast(isEdit ? 'Registration updated!' : 'Welcome to TechSummit 2026!');
        cancelEdit();
        renderAll();
        setTimeout(() => document.getElementById('attendeesSection')?.scrollIntoView({ behavior: 'smooth' }), 400);
    } else {
        toast('Save failed. Try again.', true);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('signupForm');
    if (form) {
        form.addEventListener('submit', handleSubmit);
        form.querySelectorAll('input,select').forEach(f => {
            f.addEventListener('blur', () => validateField(f));
            f.addEventListener('input', () => { if (f.classList.contains('is-invalid')) validateField(f); });
        });
    }
    renderAll();
});