# El Nisioeto

Sito web del progetto Instagram [**@elnisioeto**](https://www.instagram.com/elnisioeto/): una mappa
interattiva della toponomastica di Venezia. Per ogni episodio raccontiamo, in un breve video, la
storia o la curiosità legata al nome di un luogo veneziano — calle, campo, fondamenta, ponte, rio,
corte, sotoportego.

Il sito è **completamente statico**: nessun backend, nessun database, nessuna API key. È pensato
per essere ospitato gratuitamente su GitHub Pages e mantenuto nel tempo modificando un semplice
file CSV.

## Stack

- [Vite](https://vitejs.dev/) — build tool, vanilla JavaScript (nessun framework)
- [Leaflet](https://leafletjs.com/) + [Leaflet.markercluster](https://github.com/Leaflet/Leaflet.markercluster) — mappa e clustering dei marker
- [OpenStreetMap](https://www.openstreetmap.org/) — tile della mappa
- CSS custom scritto a mano, nessun framework grafico

## Come funzionano i dati

Gli episodi vivono in [`data/episodes.csv`](data/episodes.csv). Uno script Node
([`scripts/csv-to-json.js`](scripts/csv-to-json.js)) lo converte in `public/data/episodes.json`,
che è il file effettivamente caricato dal sito. La conversione avviene automaticamente prima di
`dev` e prima di `build` (vedi gli script `predev`/`prebuild` in `package.json`), quindi non serve
lanciarla a mano — ma puoi farlo con:

```bash
npm run data
```

Durante la conversione lo script valida ogni riga (nome nisioeto, coordinate numeriche, URL
Instagram) e stampa un warning leggibile in console per le righe non valide, che vengono scartate
senza bloccare la build.

Due comportamenti speciali del CSV:

- **Episodi speciali**: lascia vuota la colonna `episode_number` e l'episodio verrà mostrato come
  "Speciale" invece che con un numero (es. dietro le quinte, speciali fuori numerazione).
- **Più episodi nello stesso luogo**: se due o più righe hanno **esattamente le stesse**
  `latitude`/`longitude`, sulla mappa comparirà un unico marker con un badge `+N`; aprendolo si
  vedono delle frecce per scorrere tra gli episodi di quel luogo.

## Avviare il progetto in locale

```bash
npm install
npm run dev
```

Il sito sarà disponibile su `http://localhost:5173`.

Per generare la build di produzione:

```bash
npm run build
npm run preview   # per verificarla in locale
```

## Come aggiungere un nuovo nisioeto

1. Apri [`data/episodes.csv`](data/episodes.csv) e aggiungi una nuova riga con le colonne:

   ```
   id,episode_number,nisioleto_name,episode_title,description,latitude,longitude,instagram_url,sestiere
   ```

   Esempio:

   ```csv
   9,9,Calle del Forner,Perché Calle del Forner?,"Il nome ricorda l'antico forno che riforniva di pane il sestiere.",45.4368,12.3395,https://www.instagram.com/reel/XXXXX/,Cannaregio
   ```

2. **Trova latitudine e longitudine**: il modo più semplice è aprire
   [OpenStreetMap](https://www.openstreetmap.org/), cercare il luogo o cliccarci sopra col tasto
   destro e scegliere "Mostra indirizzo" / "Show address" — le coordinate compaiono nell'URL e nel
   pannello laterale. In alternativa usa Google Maps: click destro sul punto → le coordinate sono
   il primo elemento del menu, cliccale per copiarle.

3. **Aggiungi l'URL Instagram** del reel/post dedicato all'episodio nella colonna
   `instagram_url`.

4. Fai commit e push su `main`:

   ```bash
   git add data/episodes.csv
   git commit -m "Aggiunge episodio 9: Calle del Forner"
   git push
   ```

5. La GitHub Action si occuperà automaticamente di rigenerare `episodes.json`, buildare il sito e
   pubblicarlo su GitHub Pages: in un paio di minuti il nuovo nisioeto sarà online, il contatore
   si aggiornerà da solo e comparirà un nuovo marker sulla mappa.

Nessun altro file va toccato: contatore episodi, filtro sestieri e risultati di ricerca sono
calcolati automaticamente dai dati nel CSV.

## Pubblicazione su GitHub Pages

1. Crea un repository su GitHub (es. `elnisioleto`) e fai push di questo progetto sul branch
   `main`.
2. Su GitHub vai in **Settings → Pages** e imposta **Source: GitHub Actions**.
3. Ad ogni push su `main`, il workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)
   farà automaticamente: checkout → `npm ci` → `npm run build` (con il `base` di Vite impostato
   dinamicamente sul nome del repository) → pubblicazione della cartella `dist/` su GitHub Pages.
4. Il sito sarà raggiungibile su `https://TUO-USERNAME.github.io/NOME-REPO/`.

Il `base` path di Vite **non è hardcoded**: viene passato dal workflow tramite la variabile
d'ambiente `BASE_PATH`, calcolata dal nome del repository (`github.event.repository.name`). Questo
significa che il sito funziona correttamente sia in locale (`base: '/'`) sia pubblicato su un
sottopercorso, senza bisogno di modificare `vite.config.js` per ogni repo.

### Dominio custom (opzionale, in futuro)

Se in futuro vorrai un dominio personalizzato (es. `elnisioeto.it`):

1. Crea un file `public/CNAME` contenente solo il dominio (es. `elnisioeto.it`).
2. Configura sul tuo provider DNS un record `CNAME` verso `TUO-USERNAME.github.io` (o i record `A`
   indicati nella [documentazione ufficiale di GitHub Pages](https://docs.github.com/pages/configuring-a-custom-domain-for-your-github-pages-site)).
3. Imposta `BASE_PATH: /` nel workflow (il sito sarebbe servito dalla root del dominio custom, non
   più da un sottopercorso).

## Struttura del progetto

```
elnisioleto/
├── index.html                  markup della pagina (landing + vista mappa)
├── data/episodes.csv           dati sorgente: un episodio per riga
├── scripts/csv-to-json.js      converte il CSV in JSON con validazione
├── public/
│   ├── data/episodes.json      generato automaticamente, non modificare a mano
│   ├── images/                 logo del progetto (nessuna immagine per episodio)
│   ├── favicon.svg
│   ├── og-image.png            placeholder, sostituiscilo con un'immagine 1200×630
│   ├── robots.txt
│   └── sitemap.xml
├── src/
│   ├── main.js                 bootstrap app, routing landing/mappa, deep link
│   ├── episodes.js             caricamento/validazione dati
│   ├── map.js                  mappa Leaflet, marker e cluster custom
│   ├── search.js                ricerca client-side
│   ├── styles.css              tutto lo stile del sito
│   └── components/
│       ├── episode-panel.js    drawer (desktop) / bottom sheet (mobile)
│       └── header.js           contatore, filtro sestiere, reset vista
└── .github/workflows/deploy.yml
```

## Condividere un episodio

Ogni episodio ha un URL condivisibile nella forma:

```
https://tuo-sito/?view=map&episode=9
```

Aprendo questo link, il sito carica direttamente la mappa, centra il marker dell'episodio e apre
la scheda con la storia. Il bottone "Copia link episodio" nella scheda genera questo URL
automaticamente.

## Note

- L'immagine `public/og-image.png` è un placeholder (il logo del progetto): sostituiscila con
  un'immagine 1200×630 dedicata quando ne avrai una.
- Il `<link rel="canonical">` e `sitemap.xml` in [`index.html`](index.html) puntano a
  `https://elnisioeto.github.io/` come placeholder: aggiornali con l'URL reale del sito una volta
  pubblicato (username/nome-repo definitivi).
- I dati demo in `data/episodes.csv` sono **inventati** a scopo dimostrativo: sostituiscili con gli
  episodi reali prima della pubblicazione.
- Nessuna dipendenza a pagamento, nessuna chiave API richiesta: le tile mappa arrivano dai server
  pubblici di OpenStreetMap (rispettane la [tile usage policy](https://operations.osmfoundation.org/policies/tiles/)
  se il traffico dovesse crescere molto).
