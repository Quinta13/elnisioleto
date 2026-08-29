// Scheda episodio: drawer laterale su desktop, bottom sheet su mobile.
// Stessa markup, è il CSS a decidere la posizione in base al viewport.
import { episodeBadgeLabel } from '../episodes.js';

export function createEpisodePanel({ onClose, onNavigate }) {
  const panel = document.getElementById('episode-panel');
  const backdrop = document.getElementById('panel-backdrop');
  const content = document.getElementById('panel-content');
  const closeBtn = document.getElementById('panel-close');

  let isOpen = false;
  let lastFocused = null;
  let currentGroup = [];
  let currentIndex = 0;

  function render({ focusNav } = {}) {
    const episode = currentGroup[currentIndex];
    const hasSiblings = currentGroup.length > 1;

    content.innerHTML = `
      ${
        hasSiblings
          ? `
        <div class="panel-nav" role="group" aria-label="Altri episodi in questo luogo">
          <button type="button" class="btn-icon panel-nav-btn" data-nav="-1" aria-label="Episodio precedente in questo luogo">‹</button>
          <span class="panel-nav-indicator">${currentIndex + 1} di ${currentGroup.length} in questo luogo</span>
          <button type="button" class="btn-icon panel-nav-btn" data-nav="1" aria-label="Episodio successivo in questo luogo">›</button>
        </div>`
          : ''
      }
      <p class="nisioeto-sign panel-ep-number">${episodeBadgeLabel(episode)}</p>
      <h2 class="panel-title">${escapeHtml(episode.nisioletoName)}</h2>
      <p class="panel-subtitle">${escapeHtml(episode.episodeTitle || '')}</p>
      <p class="panel-desc">${escapeHtml(episode.description || '')}</p>
      <div class="panel-actions">
        <a class="btn btn-primary" href="${escapeAttr(episode.instagramUrl)}" target="_blank" rel="noopener noreferrer">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><use href="#icon-instagram" /></svg>
          Guarda il video su Instagram
        </a>
        <button class="btn btn-secondary" type="button" data-action="copy-link">Copia link episodio</button>
      </div>
    `;

    content.querySelector('[data-action="copy-link"]').addEventListener('click', (e) => copyEpisodeLink(episode, e.currentTarget));

    if (hasSiblings) {
      content.querySelectorAll('.panel-nav-btn').forEach((btn) => {
        btn.addEventListener('click', () => go(Number(btn.dataset.nav)));
      });
      if (focusNav) content.querySelector(`[data-nav="${focusNav}"]`)?.focus();
    }
  }

  function go(delta) {
    currentIndex = (currentIndex + delta + currentGroup.length) % currentGroup.length;
    render({ focusNav: delta });
    onNavigate?.(currentGroup[currentIndex]);
  }

  function copyEpisodeLink(episode, btn) {
    const url = new URL(window.location.href);
    url.searchParams.set('episode', episode.id);
    navigator.clipboard
      ?.writeText(url.toString())
      .then(() => {
        const original = btn.textContent;
        btn.textContent = 'Link copiato!';
        setTimeout(() => (btn.textContent = original), 1800);
      })
      .catch(() => {});
  }

  function open(group, startIndex = 0) {
    lastFocused = document.activeElement;
    currentGroup = group;
    currentIndex = startIndex;
    render();
    panel.hidden = false;
    backdrop.hidden = false;
    // forza reflow prima di aggiungere la classe, per far partire la transizione
    void panel.offsetWidth;
    panel.classList.add('is-open');
    backdrop.classList.add('is-open');
    panel.setAttribute('aria-hidden', 'false');
    isOpen = true;
    closeBtn.focus();
  }

  function close({ restoreFocus = true } = {}) {
    if (!isOpen) return;
    panel.classList.remove('is-open');
    backdrop.classList.remove('is-open');
    panel.setAttribute('aria-hidden', 'true');
    isOpen = false;
    const finishClose = () => {
      panel.hidden = true;
      backdrop.hidden = true;
    };
    // aspetta la transizione CSS prima di nascondere del tutto
    setTimeout(finishClose, 260);
    if (restoreFocus && lastFocused instanceof HTMLElement) lastFocused.focus();
    onClose?.();
  }

  closeBtn.addEventListener('click', () => close());
  backdrop.addEventListener('click', () => close());
  document.addEventListener('keydown', (e) => {
    if (!isOpen) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft' && currentGroup.length > 1) go(-1);
    else if (e.key === 'ArrowRight' && currentGroup.length > 1) go(1);
  });

  return { open, close, isOpen: () => isOpen };
}

function escapeHtml(str = '') {
  return str.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function escapeAttr(str = '') {
  return escapeHtml(str);
}
