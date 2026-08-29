import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import './styles.css';
import { loadEpisodes, buildEpisodeGroupIndex } from './episodes.js';
import { createMap } from './map.js';
import { createSearch } from './search.js';
import { createEpisodePanel } from './components/episode-panel.js';
import { createMapHeader } from './components/header.js';

const viewLanding = document.getElementById('view-landing');
const viewMap = document.getElementById('view-map');
const btnExplore = document.getElementById('btn-explore');
const mapErrorBox = document.getElementById('map-error');
const btnRetry = document.getElementById('btn-retry');

let allEpisodes = [];
let episodeGroupIndex = new Map();
let mapController = null;

const panel = createEpisodePanel({
  onClose: () => setEpisodeInUrl(null),
  onNavigate: (episode) => setEpisodeInUrl(episode),
});

const search = createSearch({
  onSelect: (episode) => selectEpisode(episode, { zoom: true }),
});

const header = createMapHeader({
  onSestiereChange: (sestiere) => applyFilter(sestiere),
  onResetView: () => mapController?.resetView(),
  onBack: () => showView('landing'),
});

btnExplore.addEventListener('click', () => showView('map'));

btnRetry.addEventListener('click', () => init());

function showView(name) {
  const showMap = name === 'map';
  viewLanding.hidden = showMap;
  viewMap.hidden = !showMap;
  viewLanding.classList.toggle('is-active', !showMap);
  viewMap.classList.toggle('is-active', showMap);

  if (showMap) {
    updateUrlView('map');
    // Il container deve essere visibile PRIMA di creare la mappa: Leaflet inizializzato
    // su un elemento display:none calcola una size 0x0 e ogni flyTo successivo genera
    // coordinate NaN. ensureMap() va quindi chiamato solo dopo aver tolto "hidden".
    ensureMap();
    requestAnimationFrame(() => mapController.map.invalidateSize());
  } else {
    updateUrlView(null);
  }
}

function ensureMap() {
  if (mapController) return;
  mapController = createMap({
    container: document.getElementById('map'),
    onMarkerClick: (group) => openGroup(group, 0),
  });
  mapController.setEpisodes(allEpisodes);
}

function updateUrlView(view) {
  const url = new URL(window.location.href);
  if (view) url.searchParams.set('view', view);
  else url.searchParams.delete('view');
  window.history.replaceState({}, '', url);
}

function applyFilter(sestiere) {
  const filtered = sestiere ? allEpisodes.filter((e) => e.sestiere === sestiere) : allEpisodes;
  mapController.setEpisodes(filtered);
  search.setEpisodes(filtered);
}

function openGroup(group, startIndex = 0) {
  panel.open(group, startIndex);
  setEpisodeInUrl(group[startIndex]);
}

function selectEpisode(episode, { zoom = false } = {}) {
  if (zoom) mapController.focusEpisode(episode);
  const group = episodeGroupIndex.get(episode.id) || [episode];
  openGroup(group, group.indexOf(episode));
}

function setEpisodeInUrl(episode) {
  const url = new URL(window.location.href);
  if (episode) url.searchParams.set('episode', episode.id);
  else url.searchParams.delete('episode');
  window.history.replaceState({}, '', url);
}

function openEpisodeFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const episodeId = params.get('episode');
  if (!episodeId) return;
  const episode = allEpisodes.find((e) => String(e.id) === episodeId);
  if (episode) selectEpisode(episode, { zoom: true });
}

async function init() {
  mapErrorBox.hidden = true;

  try {
    allEpisodes = await loadEpisodes();
  } catch (err) {
    console.error(err);
    mapErrorBox.hidden = false;
    return;
  }

  header.setCount(allEpisodes.length);
  header.setSestieri(allEpisodes);
  search.setEpisodes(allEpisodes);
  episodeGroupIndex = buildEpisodeGroupIndex(allEpisodes);

  const params = new URLSearchParams(window.location.search);
  if (params.get('view') === 'map' || params.get('episode')) {
    showView('map');
  }
  openEpisodeFromUrl();
}

init();
