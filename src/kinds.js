// Caricamento delle tipologie di nisioeti (generate da data/kinds.csv).

const DATA_URL = `${import.meta.env.BASE_URL}data/kinds.json`;

/** Scarica e valida le tipologie. Ritorna sempre un array (eventualmente vuoto). */
export async function loadKinds() {
  const res = await fetch(DATA_URL);
  if (!res.ok) throw new Error(`Impossibile caricare ${DATA_URL} (status ${res.status})`);
  const kinds = await res.json();
  if (!Array.isArray(kinds)) throw new Error('Formato dati inatteso: kinds.json non è un array');
  return kinds;
}

export function kindImageUrl(kind) {
  return `${import.meta.env.BASE_URL}images/kinds/${kind.image}`;
}

function normalize(str = '') {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Tipologie il cui nome compare come parola intera nel nome di un nisioeto (es. "CALLE DEL
 * FORNO" -> [Calle], "SOTOPORTEGO E CALLE DEL VINA" -> [Sotoportego, Calle] se entrambe le
 * tipologie esistono). Confronto normalizzato: case e accenti non contano.
 */
export function matchKindsInName(name, kinds) {
  const normalizedName = normalize(name || '');
  return kinds.filter((kind) => {
    const pattern = new RegExp(`\\b${escapeRegExp(normalize(kind.name))}\\b`);
    return pattern.test(normalizedName);
  });
}
