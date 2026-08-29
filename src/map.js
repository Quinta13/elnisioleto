// Mappa Leaflet: tile OSM, marker custom "targa nisioeto", cluster custom.
import L from 'leaflet';
import 'leaflet.markercluster';
import { groupEpisodesByLocation } from './episodes.js';

const VENICE_CENTER = [45.4371, 12.3346];
const VENICE_ZOOM = 14;

export function createMap({ container, onMarkerClick }) {
  const map = L.map(container, {
    zoomControl: false,
    minZoom: 12,
    maxZoom: 19,
  }).setView(VENICE_CENTER, VENICE_ZOOM);

  L.control.zoom({ position: 'bottomright' }).addTo(map);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }).addTo(map);

  const clusterGroup = L.markerClusterGroup({
    maxClusterRadius: 50,
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: false,
    iconCreateFunction: createClusterIcon,
  });
  map.addLayer(clusterGroup);

  // Ogni marker rappresenta un LUOGO: se più episodi condividono le stesse
  // coordinate, un unico marker li rappresenta tutti (con badge "+N").
  const markersByEpisodeId = new Map();

  function setEpisodes(episodes) {
    clusterGroup.clearLayers();
    markersByEpisodeId.clear();

    groupEpisodesByLocation(episodes).forEach((group) => {
      const primary = group[0];
      const marker = L.marker([primary.latitude, primary.longitude], {
        icon: createMarkerIcon(group),
        title: primary.nisioletoName,
        alt: primary.nisioletoName,
        keyboard: true,
      });
      marker.on('click', () => onMarkerClick(group));
      group.forEach((episode) => markersByEpisodeId.set(episode.id, marker));
      clusterGroup.addLayer(marker);
    });
  }

  function focusEpisode(episode, { zoom = 18 } = {}) {
    map.flyTo([episode.latitude, episode.longitude], zoom, { duration: 0.6 });
    const marker = markersByEpisodeId.get(episode.id);
    if (marker) clusterGroup.zoomToShowLayer(marker, () => marker.openPopup?.());
  }

  function resetView() {
    map.flyTo(VENICE_CENTER, VENICE_ZOOM, { duration: 0.6 });
  }

  return { map, setEpisodes, focusEpisode, resetView };
}

function createMarkerIcon(group) {
  const primary = group[0];
  const label = primary.isSpecial ? 'SPECIALE' : `EP.${primary.episodeNumber}`;
  const extra = group.length - 1;

  return L.divIcon({
    className: 'nisioeto-marker',
    html: `
      <span class="nisioeto-marker-plate">
        ${label}
        ${extra > 0 ? `<span class="nisioeto-marker-more" aria-hidden="true">+${extra}</span>` : ''}
      </span>
      <span class="nisioeto-marker-pin"></span>
    `,
    iconSize: [40, 46],
    iconAnchor: [20, 46],
    popupAnchor: [0, -40],
  });
}

function createClusterIcon(cluster) {
  const count = cluster.getChildCount();
  const size = count < 10 ? 40 : count < 25 ? 48 : 56;
  return L.divIcon({
    className: 'nisioeto-cluster',
    html: `<span class="nisioeto-cluster-badge" style="width:${size}px;height:${size}px">${count}</span>`,
    iconSize: [size, size],
  });
}
