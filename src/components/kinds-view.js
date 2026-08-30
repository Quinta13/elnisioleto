// Vista "Tipologie di nisioeti": griglia di anteprime (immagine + nome), ricerca
// testuale che filtra la griglia, dettaglio completo in modale con navigazione.
import { kindImageUrl } from '../kinds.js';
import { createKindsModal } from './kinds-modal.js';

export function createKindsView({ onBack, onRetry }) {
  const grid = document.getElementById('kinds-grid');
  const emptyBox = document.getElementById('kinds-empty');
  const errorBox = document.getElementById('kinds-error');
  const backBtn = document.getElementById('btn-back-kinds');
  const retryBtn = document.getElementById('btn-retry-kinds');
  const searchInput = document.getElementById('kinds-search-input');

  const modal = createKindsModal();

  let allKinds = [];
  let visibleKinds = [];

  backBtn.addEventListener('click', onBack);
  retryBtn.addEventListener('click', onRetry);
  searchInput.addEventListener('input', () => applyFilter(searchInput.value));

  function matches(kind, query) {
    const haystack = [kind.name, kind.description].filter(Boolean).join(' ').toLowerCase();
    return haystack.includes(query);
  }

  function applyFilter(query) {
    const q = query.trim().toLowerCase();
    visibleKinds = q ? allKinds.filter((kind) => matches(kind, q)) : allKinds;
    renderGrid();
  }

  function renderGrid() {
    grid.innerHTML = visibleKinds.map(cardHtml).join('');
    grid.hidden = visibleKinds.length === 0;
    emptyBox.hidden = visibleKinds.length !== 0;

    grid.querySelectorAll('.kind-card').forEach((btn) => {
      btn.addEventListener('click', () => modal.open(visibleKinds, Number(btn.dataset.index)));
    });
  }

  function render(kinds) {
    errorBox.hidden = true;
    searchInput.value = '';
    allKinds = kinds;
    applyFilter('');
  }

  function showError() {
    grid.hidden = true;
    emptyBox.hidden = true;
    errorBox.hidden = false;
  }

  /** Apre direttamente il dettaglio di una tipologia (es. dal suggerimento sulla scheda episodio). */
  function openKindById(id) {
    const index = allKinds.findIndex((kind) => kind.id === id);
    if (index === -1) return;
    searchInput.value = '';
    visibleKinds = allKinds;
    renderGrid();
    modal.open(allKinds, index);
  }

  return { render, showError, openKindById };
}

function cardHtml(kind, index) {
  return `
    <button type="button" class="kind-card" data-index="${index}">
      <span class="kind-card-media">
        <img class="kind-card-image" src="${escapeAttr(kindImageUrl(kind))}" alt="" loading="lazy" />
        <span class="nisioeto-sign kind-card-name">${escapeHtml(kind.name)}</span>
      </span>
    </button>
  `;
}

function escapeHtml(str = '') {
  return str.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function escapeAttr(str = '') {
  return escapeHtml(str);
}
