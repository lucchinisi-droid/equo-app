# Sorgenti dell'app Equo (multi-file)

Da qui si modifica l'app. `equo-app/index.html` (quello che Netlify pubblica) NON si modifica a mano:
si genera da questi file.

- `src/index.modello.html` — lo scheletro della pagina, con i segnaposto `<!--@ percorso -->`.
- `src/stili/` — lo stile: `base/` (stile comune, diviso per argomento) e un file per ogni modulo (diario, allenatore, ecc.).
- `src/html/` — un file per ogni pagina (`page-...`) e per ogni finestra (`modal-...`).
- `src/script/` — il codice: `app/` (il codice principale, diviso per sezione) e un file per ogni modulo (allenatore, menu, Ares, ecc.).

Comandi (dalla cartella Equo):
1. `node equo-app-src/strumenti/unisci.cjs` — rimette insieme i file in `equo-app/index.html`.
2. `node equo-app-src/strumenti/unisci.cjs --verifica` — controlla che `index.html` corrisponda ai sorgenti.
3. `cd equo-app && npm run controllo` — prova l'app nei 4 ruoli (proprietario, maniscalco, istruttore, veterinario).

Regola: si modifica in `src`, si esegue 1, poi 3; si fa il commit solo se il controllo e verde.
`strumenti/dividi.cjs` serve solo a rigenerare i sorgenti partendo da `index.html` (usato la prima volta, il 21/10/2026).
