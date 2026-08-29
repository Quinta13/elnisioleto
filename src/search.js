// Ricerca client-side: filtra su nisioleto_name, episode_title, description.
import { episodeBadgeLabel } from './episodes.js';

export function createSearch({ onSelect }) {
  const input = document.getElementById('search-input');
  const resultsBox = document.getElementById('search-results');

  let episodes = [];

  function setEpisodes(list) {
    episodes = list;
  }

  function matches(episode, query) {
    const haystack = [episode.nisioletoName, episode.episodeTitle, episode.description]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(query);
  }

  function renderResults(query) {
    const q = query.trim().toLowerCase();

    if (!q) {
      hideResults();
      return;
    }

    const results = episodes.filter((e) => matches(e, q));

    if (results.length === 0) {
      resultsBox.innerHTML = `<p class="search-empty">Nessun nisioeto trovato</p>`;
    } else {
      resultsBox.innerHTML = `
        <p class="search-count">${results.length} risultat${results.length === 1 ? 'o' : 'i'}</p>
        <ul class="search-list" role="listbox">
          ${results
            .map(
              (e) => `
            <li role="option">
              <button class="search-result" type="button" data-id="${escapeAttr(e.id)}">
                <span class="nisioeto-sign search-result-ep">${episodeBadgeLabel(e)}</span>
                <span class="search-result-text">
                  <span class="search-result-name">${escapeHtml(e.nisioletoName)}</span>
                  <span class="search-result-title">${escapeHtml(e.episodeTitle || '')}</span>
                </span>
              </button>
            </li>`
            )
            .join('')}
        </ul>
      `;
    }

    resultsBox.hidden = false;
    input.setAttribute('aria-expanded', 'true');

    resultsBox.querySelectorAll('.search-result').forEach((btn) => {
      btn.addEventListener('click', () => {
        const episode = episodes.find((e) => String(e.id) === btn.dataset.id);
        if (episode) {
          hideResults();
          input.value = '';
          onSelect(episode);
        }
      });
    });
  }

  function hideResults() {
    resultsBox.hidden = true;
    resultsBox.innerHTML = '';
    input.setAttribute('aria-expanded', 'false');
  }

  input.addEventListener('input', () => renderResults(input.value));
  input.addEventListener('focus', () => {
    if (input.value.trim()) renderResults(input.value);
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-wrap')) hideResults();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !resultsBox.hidden) {
      hideResults();
      input.blur();
    }
  });

  return { setEpisodes };
}

function escapeHtml(str = '') {
  return str.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function escapeAttr(str = '') {
  return escapeHtml(str);
}
