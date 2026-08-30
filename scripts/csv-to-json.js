// Converte data/episodes.csv in public/data/episodes.json.
// Nessuna dipendenza esterna: parser CSV scritto a mano (basta per il nostro caso,
// con supporto ai campi tra virgolette che contengono virgole).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSV_PATH = path.join(__dirname, '..', 'data', 'episodes.csv');
const SESTIERI_PATH = path.join(__dirname, '..', 'data', 'sestieri_venezia.geojson');
const OUT_DIR = path.join(__dirname, '..', 'public', 'data');
const OUT_PATH = path.join(OUT_DIR, 'episodes.json');

const KINDS_CSV_PATH = path.join(__dirname, '..', 'data', 'kinds.csv');
const KINDS_OUT_PATH = path.join(OUT_DIR, 'kinds.json');
const KINDS_REQUIRED_FIELDS = ['id', 'name', 'description', 'image', 'link'];

const REQUIRED_FIELDS = ['nisioleto_name', 'instagram_url'];

// --- Calcolo del sestiere per point-in-polygon --------------------------
// Nessuna dipendenza esterna (vedi commento in testa al file): ray casting
// scritto a mano, con supporto a poligoni con buchi (Polygon) e MultiPolygon.

function pointInRing(lon, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersects = yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

// Un punto è nel poligono se è dentro l'anello esterno e fuori da ogni buco (anelli successivi).
function pointInPolygonRings(lon, lat, rings) {
  if (!pointInRing(lon, lat, rings[0])) return false;
  for (let i = 1; i < rings.length; i++) {
    if (pointInRing(lon, lat, rings[i])) return false;
  }
  return true;
}

function pointInFeatureGeometry(lon, lat, geometry) {
  if (geometry.type === 'Polygon') {
    return pointInPolygonRings(lon, lat, geometry.coordinates);
  }
  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.some((rings) => pointInPolygonRings(lon, lat, rings));
  }
  return false;
}

function loadSestieri() {
  const geojson = JSON.parse(readFileSync(SESTIERI_PATH, 'utf-8'));
  return geojson.features.map((feature) => ({
    nome: feature.properties.A_SCOM_NOM,
    geometry: feature.geometry,
  }));
}

function findSestiere(sestieri, latitude, longitude) {
  const match = sestieri.find((s) => pointInFeatureGeometry(longitude, latitude, s.geometry));
  return match ? match.nome : null;
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && next === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.some((cell) => cell.trim() !== ''));
}

function toEpisode(headers, rawRow, lineNumber, sestieri) {
  const row = {};
  headers.forEach((header, i) => {
    row[header] = (rawRow[i] ?? '').trim();
  });

  const warnings = [];
  for (const field of REQUIRED_FIELDS) {
    if (!row[field]) warnings.push(`campo "${field}" mancante`);
  }

  // Coordinate del tutto assenti = episodio non ancora geolocalizzato: riga ignorata senza warning.
  if (!row.latitude && !row.longitude) {
    return null;
  }

  const latitude = Number(row.latitude);
  const longitude = Number(row.longitude);
  if (!row.latitude || Number.isNaN(latitude)) warnings.push('latitude non numerica');
  if (!row.longitude || Number.isNaN(longitude)) warnings.push('longitude non numerica');

  // episode_number vuoto o "Extra" = episodio speciale (mostrato come "Speciale" invece di "EP. NNN").
  // Se presente ma non numerico e diverso da "Extra" è un errore di battitura: la riga viene scartata.
  const isSpecial = !row.episode_number || row.episode_number.toLowerCase() === 'extra';
  const episodeNumber = isSpecial ? null : Number(row.episode_number);
  if (!isSpecial && Number.isNaN(episodeNumber)) warnings.push('episode_number non numerico');

  if (warnings.length > 0) {
    console.warn(`⚠️  Riga ${lineNumber} (id=${row.id || '?'}) scartata: ${warnings.join(', ')}`);
    return null;
  }

  const sestiere = findSestiere(sestieri, latitude, longitude);
  if (!sestiere) {
    console.warn(`⚠️  Riga ${lineNumber} (id=${row.id || '?'}): nessun sestiere trovato per le coordinate (${latitude}, ${longitude})`);
  }

  return {
    id: row.id || String(lineNumber),
    episodeNumber,
    isSpecial,
    nisioletoName: row.nisioleto_name,
    episodeTitle: row.episode_title,
    description: row.description,
    latitude,
    longitude,
    instagramUrl: row.instagram_url,
    sestiere,
  };
}

function toKind(headers, rawRow, lineNumber) {
  const row = {};
  headers.forEach((header, i) => {
    row[header] = (rawRow[i] ?? '').trim();
  });

  const warnings = [];
  for (const field of KINDS_REQUIRED_FIELDS) {
    if (!row[field]) warnings.push(`campo "${field}" mancante`);
  }
  if (warnings.length > 0) {
    console.warn(`⚠️  Riga ${lineNumber} (id=${row.id || '?'}) di kinds.csv scartata: ${warnings.join(', ')}`);
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    image: row.image,
    link: row.link,
  };
}

function convertKinds() {
  const csv = readFileSync(KINDS_CSV_PATH, 'utf-8');
  const rows = parseCsv(csv);
  if (rows.length === 0) {
    console.warn('⚠️  kinds.csv è vuoto: nessuna tipologia da convertire.');
    mkdirSync(OUT_DIR, { recursive: true });
    writeFileSync(KINDS_OUT_PATH, '[]\n');
    return;
  }

  const [headerRow, ...dataRows] = rows;
  const headers = headerRow.map((h) => h.trim());

  const kinds = dataRows.map((row, i) => toKind(headers, row, i + 2)).filter(Boolean);

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(KINDS_OUT_PATH, JSON.stringify(kinds, null, 2) + '\n');

  console.log(`✅ Generate ${kinds.length} tipologie in public/data/kinds.json`);
}

function main() {
  const sestieri = loadSestieri();
  const csv = readFileSync(CSV_PATH, 'utf-8');
  const rows = parseCsv(csv);
  if (rows.length === 0) {
    console.warn('⚠️  Il CSV è vuoto: nessun episodio da convertire.');
    mkdirSync(OUT_DIR, { recursive: true });
    writeFileSync(OUT_PATH, '[]\n');
    return;
  }

  const [headerRow, ...dataRows] = rows;
  const headers = headerRow.map((h) => h.trim());

  const episodes = dataRows
    .map((row, i) => toEpisode(headers, row, i + 2, sestieri)) // +2: 1-based + header row
    .filter(Boolean)
    // Gli episodi speciali (senza numero) restano in fondo, nell'ordine del CSV.
    .sort((a, b) => (a.isSpecial || b.isSpecial ? Number(a.isSpecial) - Number(b.isSpecial) : a.episodeNumber - b.episodeNumber));

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(episodes, null, 2) + '\n');

  console.log(`✅ Generati ${episodes.length} episodi in public/data/episodes.json`);

  convertKinds();
}

main();
