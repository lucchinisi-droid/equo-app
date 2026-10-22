# Sorgenti dell'app Equo (multi-file)

Da qui si modifica l'app. `equo-app/index.html` (quello che Netlify pubblica) NON si modifica a mano:
si genera da questi file con `strumenti/unisci.cjs`. L'ordine in cui i pezzi finiscono nella pagina
e deciso da `src/index.modello.html` (segnaposto `<!--@ percorso -->`), non dalle cartelle.

## Dove sta cosa (dal 22/10/2026)
- `src/core/` — fondamenta comuni a tutti: accesso, avvio, navigazione (`script/020-nav.js`: quandoApriPagina),
  pagamenti e piani, legale, notifiche, ricerca; stile comune; `stili/10-regole-ruoli.css` = UNICO posto che decide
  cosa si vede nella Home dei professionisti.
- `src/comune/` — parti condivise da piu ruoli: `barra/` (barra in basso e tasto +: quandoAggiornaBarra),
  `chat/` (chat, allegati, vocali, notifiche dei messaggi), `agenti/` (chat con Pegasus/Hammer/Ares, foto).
- `src/ruoli/proprietario/` — cavalli, codice cavallo, libretto, diario, calendario, spese, chat col maniscalco; pagine del proprietario.
- `src/ruoli/maniscalco/` — clienti, agenda, giro, incassi, conti, ferrature, modalita Lavoro, Home del maniscalco.
- `src/ruoli/allenatore/` — app dell'istruttore in MODULI ES veri (dal 22/10/2026): `moduli/00-strumenti.js` ...
  `moduli/14-*.js` + `moduli/index.js`. Ogni modulo dichiara cosa usa (`import`) e cosa offre (`export`).
  Vite li unisce in `costruito.js` (GENERATO, non modificare), che e cio che entra in index.html.
  Ares (`script/14-ares-js.js`) e lo stile restano fuori dai moduli.
- `src/ruoli/professionisti/pagine/` — pagine comuni ai professionisti (pro-home, pro-agenda, pro-clienti...).
- `src/finestre/` — tutte le finestre (modal) dell'app.

## Comandi (dalla cartella Equo)
1. `node equo-app-src/strumenti/unisci.cjs` — rimette insieme i file in `equo-app/index.html`.
2. `node equo-app-src/strumenti/unisci.cjs --verifica` — controlla che `index.html` corrisponda ai sorgenti.
3. `cd equo-app && npm run controllo` — prova l'app nei 4 ruoli.
0. (solo se tocchi `ruoli/allenatore/moduli/`) `VITE_DIR=$HOME/strumenti-vite node equo-app-src/strumenti/costruisci-moduli.mjs`
   — ricostruisce `costruito.js` con Vite; poi 1. Con `--verifica` controlla che costruito.js corrisponda ai moduli.
   Vite e installato solo nella macchina di lavoro (`$HOME/strumenti-vite`), non nel repository: il sito online
   non lo usa, riceve gia il file costruito.

## Regole
- Si modifica in `src`, si esegue 1, poi 3; commit solo se il controllo e verde.
- Non riassegnare showPage, plAggiorna (usare quandoApriPagina / quandoAggiornaBarra): il controllo fallisce.
- Non modificare `ruoli/allenatore/costruito.js` a mano: si cambia il modulo e si ricostruisce.
- Regole "#page-pro-home > ..." solo in core/stili/10-regole-ruoli.css: unisci.cjs si ferma.
