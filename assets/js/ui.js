/* ═══════════════════════════════════════════════════════════
   UI.JS — Toast, Modal, Loader, Tags input helpers
═══════════════════════════════════════════════════════════ */

/* ── Toast ─────────────────────────────────────────────────── */
const toast = {
  container: null,

  _init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  },

  _show(msg, type = 'info', duration = 3500) {
    this._init();
    const icons = {
      success: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>`,
      error  : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
      info   : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="8"/><line x1="12" y1="12" x2="12" y2="16"/></svg>`
    };
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.innerHTML = `${icons[type] || icons.info}<span>${msg}</span>`;
    this.container.appendChild(el);
    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateX(12px)';
      el.style.transition = '0.2s ease';
      setTimeout(() => el.remove(), 200);
    }, duration);
  },

  success: (msg) => toast._show(msg, 'success'),
  error  : (msg) => toast._show(msg, 'error', 5000),
  info   : (msg) => toast._show(msg, 'info')
};

/* ── Modal ──────────────────────────────────────────────────── */
const modal = {
  open(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('open');
  },
  close(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('open');
  },
  closeAll() {
    document.querySelectorAll('.modal-backdrop.open').forEach(el => el.classList.remove('open'));
  }
};

/* Close modal on backdrop click */
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-backdrop')) modal.closeAll();
});

/* ── Page loader ──────────────────────────────────────────── */
const loader = {
  show(el, msg = 'Loading...') {
    if (!el) return;
    el.innerHTML = `<div class="page-loader"><div class="spinner"></div>${msg}</div>`;
  },
  empty(el, title = 'No data yet', sub = 'Add your first entry using the button above.') {
    if (!el) return;
    el.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <line x1="3" y1="9" x2="21" y2="9"/>
          <line x1="9" y1="21" x2="9" y2="9"/>
        </svg>
        <h4>${title}</h4>
        <p>${sub}</p>
      </div>`;
  }
};

/* ── Confirm dialog ─────────────────────────────────────────── */
function confirm(msg) {
  return new Promise(resolve => {
    const id = 'confirm-modal';
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement('div');
      el.id = id;
      el.className = 'modal-backdrop';
      el.innerHTML = `
        <div class="modal" style="max-width:380px">
          <div class="modal-header"><h3>Confirm</h3></div>
          <div class="modal-body"><p id="confirm-msg" style="color:var(--white)"></p></div>
          <div class="modal-footer">
            <button class="btn btn-ghost btn-sm" id="confirm-no">Cancel</button>
            <button class="btn btn-danger btn-sm" id="confirm-yes">Delete</button>
          </div>
        </div>`;
      document.body.appendChild(el);
    }
    document.getElementById('confirm-msg').textContent = msg;
    el.classList.add('open');
    const cleanup = (val) => {
      el.classList.remove('open');
      resolve(val);
    };
    document.getElementById('confirm-yes').onclick = () => cleanup(true);
    document.getElementById('confirm-no').onclick  = () => cleanup(false);
    el.onclick = e => { if (e.target === el) cleanup(false); };
  });
}

/* ── Tags input helper ──────────────────────────────────────── */
function initTagsInput(wrapEl, inputEl, onChange) {
  let tags = [];

  function render() {
    const chips = wrapEl.querySelectorAll('.tag-chip');
    chips.forEach(c => c.remove());
    tags.forEach((tag, i) => {
      const chip = document.createElement('span');
      chip.className = 'tag-chip';
      chip.innerHTML = `${tag}<button class="tag-chip-remove" data-i="${i}" aria-label="Remove ${tag}">×</button>`;
      wrapEl.insertBefore(chip, inputEl);
    });
    if (onChange) onChange([...tags]);
  }

  inputEl.addEventListener('keydown', e => {
    if ((e.key === 'Enter' || e.key === ',') && inputEl.value.trim()) {
      e.preventDefault();
      const val = inputEl.value.trim().replace(/,$/, '');
      if (val && !tags.includes(val)) { tags.push(val); render(); }
      inputEl.value = '';
    }
    if (e.key === 'Backspace' && !inputEl.value && tags.length) {
      tags.pop(); render();
    }
  });

  wrapEl.addEventListener('click', e => {
    const btn = e.target.closest('.tag-chip-remove');
    if (btn) { tags.splice(+btn.dataset.i, 1); render(); }
    else inputEl.focus();
  });

  return {
    setTags(arr) { tags = [...(arr || [])]; render(); },
    getTags()    { return [...tags]; },
    clear()      { tags = []; render(); }
  };
}

/* ── Set button loading state ─────────────────────────────── */
function setBtnLoading(btn, loading, text = '') {
  if (loading) {
    btn._origHTML = btn.innerHTML;
    btn.disabled  = true;
    btn.innerHTML = `<div class="spinner" style="width:14px;height:14px;border-width:1.5px"></div>${text}`;
  } else {
    btn.disabled  = false;
    btn.innerHTML = btn._origHTML || text;
  }
}

export { toast, modal, loader, confirm, initTagsInput, setBtnLoading };
