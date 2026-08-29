// Header della vista mappa: contatore episodi, filtro sestiere, "torna a Venezia".
import { getSestieri } from '../episodes.js';

export function createMapHeader({ onSestiereChange, onResetView, onBack }) {
  const counterEls = document.querySelectorAll('.episode-counter-number, .landing-count-number');
  const sestiereSelect = document.getElementById('sestiere-select');
  const resetBtn = document.getElementById('btn-reset-view');
  const backBtn = document.getElementById('btn-back');

  function setCount(n) {
    counterEls.forEach((el) => (el.textContent = n));
  }

  function setSestieri(episodes) {
    const sestieri = getSestieri(episodes);
    sestieri.forEach((s) => {
      const opt = document.createElement('option');
      opt.value = s;
      opt.textContent = s;
      sestiereSelect.appendChild(opt);
    });
  }

  sestiereSelect.addEventListener('change', () => onSestiereChange(sestiereSelect.value));
  resetBtn.addEventListener('click', () => {
    sestiereSelect.value = '';
    onSestiereChange('');
    onResetView();
  });
  backBtn.addEventListener('click', onBack);

  return { setCount, setSestieri };
}
