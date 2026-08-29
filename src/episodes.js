// Caricamento dei dati degli episodi (generati da data/episodes.csv).

const DATA_URL = `${import.meta.env.BASE_URL}data/episodes.json`;

/**
 * Scarica e valida gli episodi. Ritorna sempre un array (eventualmente vuoto).
 * Chi chiama può distinguere l'errore di rete controllando `ok`.
 */
export async function loadEpisodes() {
  const res = await fetch(DATA_URL);
  if (!res.ok) throw new Error(`Impossibile caricare ${DATA_URL} (status ${res.status})`);
  const episodes = await res.json();
  if (!Array.isArray(episodes)) throw new Error('Formato dati inatteso: episodes.json non è un array');
  return episodes;
}

/** Elenco ordinato e senza duplicati dei sestieri presenti nei dati. */
export function getSestieri(episodes) {
  return [...new Set(episodes.map((e) => e.sestiere).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'it')
  );
}

/** Etichetta da mostrare per un episodio: "EP. 007" oppure "Speciale". */
export function episodeBadgeLabel(episode) {
  return episode.isSpecial ? 'Speciale' : `EP. ${String(episode.episodeNumber).padStart(3, '0')}`;
}

/**
 * Raggruppa gli episodi che condividono esattamente le stesse coordinate
 * (stesso luogo raccontato in più episodi): un unico marker sulla mappa,
 * navigabile internamente nella scheda.
 */
export function groupEpisodesByLocation(episodes) {
  const groups = new Map();
  episodes.forEach((episode) => {
    const key = `${episode.latitude.toFixed(6)},${episode.longitude.toFixed(6)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(episode);
  });
  return [...groups.values()];
}

/** Mappa episodio.id -> gruppo di episodi nello stesso luogo (incluso se stesso). */
export function buildEpisodeGroupIndex(episodes) {
  const index = new Map();
  groupEpisodesByLocation(episodes).forEach((group) => {
    group.forEach((episode) => index.set(episode.id, group));
  });
  return index;
}
