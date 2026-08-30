import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import './styles.css';
import { loadEpisodes, buildEpisodeGroupIndex, groupEpisodesByLocation } from './episodes.js';
import { loadKinds } from './kinds.js';
import { createMap } from './map.js';
import { createSearch } from './search.js';
import { createEpisodePanel } from './components/episode-panel.js';
import { createMapHeader } from './components/header.js';
import { createKindsView } from './components/kinds-view.js';

const viewLanding = document.getElementById('view-landing');
const viewMap = document.getElementById('view-map');
const viewKinds = document.getElementById('view-kinds');
const btnExplore = document.getElementById('btn-explore');
const btnKinds = document.getElementById('btn-kinds');
const mapErrorBox = document.getElementById('map-error');
const btnRetry = document.getElementById('btn-retry');

let allEpisodes = [];
let allKinds = [];
let episodeGroupIndex = new Map();
let mapController = null;

const panel = createEpisodePanel({
  onClose: () => setEpisodeInUrl(null),
  onNavigate: (episode) => setEpisodeInUrl(episode),
  onOpenKind: (kind) => openKindDetail(kind),
});

const search = createSearch({
  onSelect: (episode) => selectEpisode(episode, { zoom: true }),
});

const header = createMapHeader({
  onSestiereChange: (sestiere) => applyFilter(sestiere),
  onBack: () => showView('landing'),
});

const kindsView = createKindsView({
  onBack: () => showView('landing'),
  onRetry: () => loadKindsData(),
});

btnExplore.addEventListener('click', () => showView('map'));
btnKinds.addEventListener('click', () => showView('kinds'));

btnRetry.addEventListener('click', () => init());

function showView(name) {
  viewLanding.hidden = name !== 'landing';
  viewMap.hidden = name !== 'map';
  viewKinds.hidden = name !== 'kinds';
  viewLanding.classList.toggle('is-active', name === 'landing');
  viewMap.classList.toggle('is-active', name === 'map');
  viewKinds.classList.toggle('is-active', name === 'kinds');

  if (name === 'map') {
    updateUrlView('map');
    // Il container deve essere visibile PRIMA di creare la mappa: Leaflet inizializzato
    // su un elemento display:none calcola una size 0x0 e ogni flyTo successivo genera
    // coordinate NaN. ensureMap() va quindi chiamato solo dopo aver tolto "hidden".
    ensureMap();
    requestAnimationFrame(() => mapController.map.invalidateSize());
  } else if (name === 'kinds') {
    updateUrlView('kinds');
  } else {
    updateUrlView(null);
  }
}

function ensureMap() {
  if (mapController) return;
  mapController = createMap({
    container: document.getElementById('map'),
    onMarkerClick: (group) => openGroup(group, 0),
    onResetView: () => header.resetFilter(),
  });
  mapController.setEpisodes(allEpisodes);
}

async function loadKindsData() {
  try {
    allKinds = await loadKinds();
    kindsView.render(allKinds);
    panel.setKinds(allKinds);
  } catch (err) {
    console.error(err);
    kindsView.showError();
  }
}

function openKindDetail(kind) {
  panel.close({ restoreFocus: false });
  showView('kinds');
  kindsView.openKindById(kind.id);
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
  header.setFilteredCount(groupEpisodesByLocation(filtered).length);
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

  // "Nisioeti raccontati": luoghi distinti, non episodi — se due video raccontano lo
  // stesso luogo (stesse coordinate) contano come un solo nisioeto.
  header.setCount(groupEpisodesByLocation(allEpisodes).length);
  header.setSestieri(allEpisodes);
  search.setEpisodes(allEpisodes);
  episodeGroupIndex = buildEpisodeGroupIndex(allEpisodes);

  await loadKindsData();

  const params = new URLSearchParams(window.location.search);
  if (params.get('view') === 'map' || params.get('episode')) {
    showView('map');
  } else if (params.get('view') === 'kinds') {
    showView('kinds');
  }
  openEpisodeFromUrl();
}

init();
