# Sorgenti dell'app Equo (multi-file)

Da qui si modifica l'app. `equo-app/index.html` (quello che Netlify pubblica) NON si modifica a mano:
si genera da questi file con `strumenti/unisci.cjs`. L'ordine in cui i pezzi finiscono nella pagina
e deciso da `src/index.modello.html` (segnaposto `<!--@ percorso -->`), non dalle cartelle.

## Dove sta cosa (dal 22/10/2026)
- `src/core/` — fondamenta comuni a tutti: accesso, avvio, navigazione (`script/020-nav.js`: quandoApriPagina),
  pagamenti e piani, legale, notifiche, ricerca; stile comune; `stili/10-regole-ruoli.css` = UNICO posto che decide
  cosa si vede nella Home dei professionisti.
- `src/core/dati/` — DB: tutte le letture e scritture su Supabase, un file per argomento (`db-01-cavalli-salute-spese-lezioni.js`
  ... `db-10-profilo.js`). Un solo oggetto `DB` creato in `db-00-inizio.js`; ogni file aggiunge le sue funzioni con
  `Object.assign(DB, {...})`. Una funzione nuova va nel file del suo argomento. Lo stato della demo e in `core/script/003b-stato-demo.js`.
- `src/comune/` — parti condivise da piu ruoli: `barra/` (barra in basso e tasto +: quandoAggiornaBarra),
  `chat/` (chat, allegati, vocali, notifiche dei messaggi; dal 22/10 in moduli: `chat/moduli/` + API pubblica in `moduli/index.js`, `chat/stato-condiviso.js` con EMOJI_LIST e contatori, costruito in `chat/costruito.js` al posto del vecchio file 062), `agenti/` (chat con Pegasus/Hammer/Ares, foto; dal 22/10 in moduli: `agenti/moduli/` + `agenti/stato-condiviso.js`, costruito in `agenti/costruito.js`).
- `src/ruoli/proprietario/` — cavalli, codice cavallo, libretto, diario, calendario, spese, chat col maniscalco; pagine del proprietario.
  Dal 22/10/2026 in MODULI ES (`moduli/023-*.js ... 101-*.js` + `moduli/index.js` con l'API pubblica), costruiti da Vite in
  `costruito.js`; `stato-condiviso.js` = 25 variabili lette o cambiate anche da altre parti (ml, mlProb, currentFarrier...).
  Entrano nella pagina subito prima di `core/script/084-helpers.js` (084 li usa al caricamento; la chat usa EMOJI_LIST di 062).
  Restano script separati: `script/08-meteo...` (diario in Home), `script/11-hv3-js.js`, `script/12-lib3-js.js`.
- `src/ruoli/maniscalco/` — clienti, agenda, giro, incassi, conti, ferrature, modalita Lavoro, Home del maniscalco.
  Dal 22/10/2026 in MODULI ES (`moduli/031-*.js ... 100-*.js` + `moduli/index.js`), costruiti da Vite in `costruito.js`.
  - `stato-condiviso.js`: le 56 variabili che anche altre parti dell'app leggono o cambiano (clientiMascalcia, wgPro,
    agenda, incassi...). E uno script normale, caricato prima dei moduli: solo dati, nessuna funzione.
  - `moduli/index.js` contiene l'API PUBBLICA: le funzioni chiamate dai pulsanti (onclick) e dalle altre parti dell'app.
    Se un pulsante nuovo chiama una funzione del maniscalco, va aggiunta li: altrimenti il controllo automatico fallisce
    ("pulsanti che chiamano funzioni inesistenti").
  - Vite toglie da costruito.js le funzioni che nessuno chiama (codice morto).
- `src/ruoli/allenatore/` — app dell'istruttore in MODULI ES veri (dal 22/10/2026): `moduli/00-strumenti.js` ...
  `moduli/14-*.js` + `moduli/index.js`. Ogni modulo dichiara cosa usa (`import`) e cosa offre (`export`).
  Vite li unisce in `costruito.js` (GENERATO, non modificare), che e cio che entra in index.html.
  I dati condivisi (TR = sedute/video/cavalli seguiti, T2 = agenda/lezioni/chat) stanno solo in `moduli/stato.js`:
  si importano da li e se ne cambiano i campi, non si sostituiscono mai.
  Ares (`script/14-ares-js.js`) e lo stile restano fuori dai moduli.
- `src/ruoli/professionisti/pagine/` — pagine comuni ai professionisti (pro-home, pro-agenda, pro-clienti...).
- `src/finestre/` — tutte le finestre (modal) dell'app.

## Comandi (dalla cartella Equo)
1. `node equo-app-src/strumenti/unisci.cjs` — rimette insieme i file in `equo-app/index.html`.
2. `node equo-app-src/strumenti/unisci.cjs --verifica` — controlla che `index.html` corrisponda ai sorgenti.
3. `cd equo-app && npm run controllo` — prova l'app nei 4 ruoli.
0. (solo se tocchi una cartella `moduli/`: allenatore, maniscalco, proprietario, chat...) `VITE_DIR=$HOME/strumenti-vite node equo-app-src/strumenti/costruisci-moduli.mjs`
   — ricostruisce tutti i `costruito.js` con Vite; poi 1. Con `--verifica` controlla che corrispondano ai moduli.
   Vite e installato solo nella macchina di lavoro (`$HOME/strumenti-vite`), non nel repository: il sito online
   non lo usa, riceve gia il file costruito.

## Regole
- Si modifica in `src`, si esegue 1, poi 3; commit solo se il controllo e verde.
- Non riassegnare showPage, plAggiorna (usare quandoApriPagina / quandoAggiornaBarra): il controllo fallisce.
- Non modificare i `costruito.js` a mano: si cambia il modulo e si ricostruisce.
- Regole "#page-pro-home > ..." solo in core/stili/10-regole-ruoli.css: unisci.cjs si ferma.
