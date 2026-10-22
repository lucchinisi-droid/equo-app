# Sorgenti di Equo Scuderia (multi-file)

Da qui si modifica il gestionale. `equo-scuderia/index.html` (quello che Netlify pubblica) NON si modifica a mano.

- `src/index.modello.html` — scheletro con i segnaposto `<!--@ percorso -->` (decide l'ordine dei pezzi nella pagina).
- `src/core/` — accesso, avvio, navigazione (`quandoApriSezione`), permessi, tema, legale, assistenza, stile comune.
- `src/sezioni/<nome>/` — una cartella per ogni voce del menu, con `pagina/`, `script/` e `stili/`:
  home, centro, cavalli (anche box/stalla e codice cavallo), lezioni-pacchetti-comunicazioni, messaggi, professionisti,
  magazzino, statistiche, agenti (Athena), groom, altre (store, fatturazione).
- `src/comune/barra/` — barra a pillola e tasto + del telefono.
- `src/finestre/` — tutte le finestre (modal).

Comandi (dalla cartella Equo):
1. `node equo-app-src/strumenti/unisci.cjs --app equo-scuderia` — rimette insieme i file in `equo-scuderia/index.html`.
2. `node equo-app-src/strumenti/unisci.cjs --app equo-scuderia --verifica` — controlla che corrisponda ai sorgenti.
3. `node equo-scuderia/tests/controllo-scuderia.cjs` — prova il gestionale in demo su computer e telefono.

Regola: si modifica in `src`, si esegue 1, poi 3; commit solo se il controllo e verde.

## Groom (dal 22/10/2026)
L'app Groom (`equo-scuderia/groom.html`) ha i suoi sorgenti in `equo-scuderia-src/groom/` (stili, script divisi per
argomento: accesso, dati e sincronizzazione, vista box, azioni, scanner QR, installazione, demo).
- Rimettere insieme: `node equo-app-src/strumenti/unisci.cjs --app equo-scuderia --pagina groom.html`
- Controllare: aggiungere `--verifica`. Poi `node equo-scuderia/tests/controllo-groom.cjs`.
