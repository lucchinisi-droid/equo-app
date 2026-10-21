# Sorgenti di Equo Scuderia (multi-file)

Da qui si modifica il gestionale. `equo-scuderia/index.html` (quello che Netlify pubblica) NON si modifica a mano.

- `src/index.modello.html` — scheletro con i segnaposto `<!--@ percorso -->`.
- `src/stili/` — stile (comune diviso per argomento + moduli).
- `src/html/` — un file per ogni sezione del menu (`module-...`) e per ogni finestra (`modal-...`).
- `src/script/` — codice: `app/` (principale, diviso per sezione) + un file per ogni modulo.

Comandi (dalla cartella Equo):
1. `node equo-app-src/strumenti/unisci.cjs --app equo-scuderia` — rimette insieme i file in `equo-scuderia/index.html`.
2. `node equo-app-src/strumenti/unisci.cjs --app equo-scuderia --verifica` — controlla che corrisponda ai sorgenti.
3. `node equo-scuderia/tests/controllo-scuderia.cjs` — prova il gestionale in demo su computer e telefono.

Regola: si modifica in `src`, si esegue 1, poi 3; commit solo se il controllo e verde.
