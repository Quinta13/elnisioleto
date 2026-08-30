// Modale di dettaglio per una tipologia di nisioeto: immagine, descrizione, link,
// navigabile con le frecce tra le tipologie visibili in griglia.
import { kindImageUrl } from '../kinds.js';

export function createKindsModal() {
  const modal = document.getElementById('kinds-modal');
  const backdrop = document.getElementById('kinds-modal-backdrop');
  const content = document.getElementById('kinds-modal-content');
  const closeBtn = document.getElementById('kinds-modal-close');

  let isOpen = false;
  let lastFocused = null;
  let list = [];
  let index = 0;

  function render({ focusNav } = {}) {
    const kind = list[index];
    const hasSiblings = list.length > 1;

    content.innerHTML = `
      ${
        hasSiblings
          ? `
        <div class="panel-nav" role="group" aria-label="Altre tipologie">
          <button type="button" class="btn-icon panel-nav-btn" data-nav="-1" aria-label="Tipologia precedente">‹</button>
          <span class="panel-nav-indicator">${index + 1} di ${list.length}</span>
          <button type="button" class="btn-icon panel-nav-btn" data-nav="1" aria-label="Tipologia successiva">›</button>
        </div>`
          : ''
      }
      <img class="kinds-modal-image" src="${escapeAttr(kindImageUrl(kind))}" alt="${escapeAttr(kind.name)}" />
      <h2 class="kinds-modal-title">${escapeHtml(kind.name)}</h2>
      <p class="kinds-modal-desc">${escapeHtml(kind.description)}</p>
      <a class="kind-card-link" href="${escapeAttr(kind.link)}" target="_blank" rel="noopener noreferrer">
        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><use href="#icon-instagram" /></svg>
        Guarda su Instagram
      </a>
    `;

    if (hasSiblings) {
      content.querySelectorAll('.panel-nav-btn').forEach((btn) => {
        btn.addEventListener('click', () => go(Number(btn.dataset.nav)));
      });
      if (focusNav) content.querySelector(`[data-nav="${focusNav}"]`)?.focus();
    }
  }

  function go(delta) {
    index = (index + delta + list.length) % list.length;
    render({ focusNav: delta });
  }

  function open(items, startIndex = 0) {
    lastFocused = document.activeElement;
    list = items;
    index = startIndex;
    render();
    modal.hidden = false;
    backdrop.hidden = false;
    // forza reflow prima di aggiungere la classe, per far partire la transizione
    void modal.offsetWidth;
    modal.classList.add('is-open');
    backdrop.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    isOpen = true;
    closeBtn.focus();
  }

  function close({ restoreFocus = true } = {}) {
    if (!isOpen) return;
    modal.classList.remove('is-open');
    backdrop.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    isOpen = false;
    setTimeout(() => {
      modal.hidden = true;
      backdrop.hidden = true;
    }, 260);
    if (restoreFocus && lastFocused instanceof HTMLElement) lastFocused.focus();
  }

  closeBtn.addEventListener('click', () => close());
  backdrop.addEventListener('click', () => close());
  document.addEventListener('keydown', (e) => {
    if (!isOpen) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft' && list.length > 1) go(-1);
    else if (e.key === 'ArrowRight' && list.length > 1) go(1);
  });

  return { open, close, isOpen: () => isOpen };
}

function escapeHtml(str = '') {
  return str.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function escapeAttr(str = '') {
  return escapeHtml(str);
}
