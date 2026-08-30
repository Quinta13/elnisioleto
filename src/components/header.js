// Header della vista mappa: contatore episodi, filtro sestiere, "torna a Venezia".
import { getSestieri } from '../episodes.js';

export function createMapHeader({ onSestiereChange, onBack }) {
  // Il contatore in landing riflette sempre il totale del progetto; quello nell'header
  // della mappa segue anche il filtro sestiere (setFilteredCount).
  const mapCounterEls = document.querySelectorAll('.episode-counter-number');
  const landingCounterEls = document.querySelectorAll('.landing-count-number');
  const sestiereSelect = document.getElementById('sestiere-select');
  const backBtn = document.getElementById('btn-back');

  function setCount(n) {
    mapCounterEls.forEach((el) => (el.textContent = n));
    landingCounterEls.forEach((el) => (el.textContent = n));
  }

  function setFilteredCount(n) {
    mapCounterEls.forEach((el) => (el.textContent = n));
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
  backBtn.addEventListener('click', onBack);

  function resetFilter() {
    sestiereSelect.value = '';
    onSestiereChange('');
  }

  return { setCount, setFilteredCount, setSestieri, resetFilter };
}
