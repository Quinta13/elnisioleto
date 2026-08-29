// Converte data/episodes.csv in public/data/episodes.json.
// Nessuna dipendenza esterna: parser CSV scritto a mano (basta per il nostro caso,
// con supporto ai campi tra virgolette che contengono virgole).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSV_PATH = path.join(__dirname, '..', 'data', 'episodes.csv');
const OUT_DIR = path.join(__dirname, '..', 'public', 'data');
const OUT_PATH = path.join(OUT_DIR, 'episodes.json');

const REQUIRED_FIELDS = ['nisioleto_name', 'instagram_url'];

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

function toEpisode(headers, rawRow, lineNumber) {
  const row = {};
  headers.forEach((header, i) => {
    row[header] = (rawRow[i] ?? '').trim();
  });

  const warnings = [];
  for (const field of REQUIRED_FIELDS) {
    if (!row[field]) warnings.push(`campo "${field}" mancante`);
  }

  const latitude = Number(row.latitude);
  const longitude = Number(row.longitude);
  if (!row.latitude || Number.isNaN(latitude)) warnings.push('latitude non numerica');
  if (!row.longitude || Number.isNaN(longitude)) warnings.push('longitude non numerica');

  // episode_number vuoto = episodio speciale (mostrato come "Speciale" invece di "EP. NNN").
  // Se presente ma non numerico è un errore di battitura: la riga viene scartata.
  const isSpecial = !row.episode_number;
  const episodeNumber = isSpecial ? null : Number(row.episode_number);
  if (!isSpecial && Number.isNaN(episodeNumber)) warnings.push('episode_number non numerico');

  if (warnings.length > 0) {
    console.warn(`⚠️  Riga ${lineNumber} (id=${row.id || '?'}) scartata: ${warnings.join(', ')}`);
    return null;
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
    sestiere: row.sestiere || null,
  };
}

function main() {
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
    .map((row, i) => toEpisode(headers, row, i + 2)) // +2: 1-based + header row
    .filter(Boolean)
    // Gli episodi speciali (senza numero) restano in fondo, nell'ordine del CSV.
    .sort((a, b) => (a.isSpecial || b.isSpecial ? Number(a.isSpecial) - Number(b.isSpecial) : a.episodeNumber - b.episodeNumber));

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_PATH, JSON.stringify(episodes, null, 2) + '\n');

  console.log(`✅ Generati ${episodes.length} episodi in public/data/episodes.json`);
}

main();
