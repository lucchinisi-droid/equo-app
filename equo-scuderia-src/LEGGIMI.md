# Sorgenti di Equo Scuderia (multi-file)

Da qui si modifica il gestionale. `equo-scuderia/index.html` (quello che Netlify pubblica) NON si modifica a mano.

- `src/index.modello.html` — scheletro con i segnaposto `<!--@ percorso -->` (decide l'ordine dei pezzi nella pagina).
- `src/core/` — accesso, avvio, navigazione (`quandoApriSezione`), permessi, tema, legale, assistenza, stile comune.
- `src/sezioni/<nome>/` — una cartella per ogni voce del menu, con `pagina/`, `script/` e `stili/`:
  home, centro, cavalli (anche box/stalla e codice cavallo), lezioni-pacchetti-comunicazioni, messaggi, professionisti,
  magazzino, statistiche, agenti (Athena), groom, altre (store, fatturazione).
- `src/comune/barra/` — barra a pillola e tasto + del telefono.
- `src/finestre/` — tutte le finestre (modal).
- Le cartelle vuote `src/html`, `src/script/app`, `src/stili/base` sono resti dello spostamento del 22/10 (cancellabili).

Comandi (dalla cartella Equo):
1. `node equo-app-src/strumenti/unisci.cjs --app equo-scuderia` — rimette insieme i file in `equo-scuderia/index.html`.
2. `node equo-app-src/strumenti/unisci.cjs --app equo-scuderia --verifica` — controlla che corrisponda ai sorgenti.
3. `node equo-scuderia/tests/controllo-scuderia.cjs` — prova il gestionale in demo su computer e telefono.

Regola: si modifica in `src`, si esegue 1, poi 3; commit solo se il controllo e verde.
