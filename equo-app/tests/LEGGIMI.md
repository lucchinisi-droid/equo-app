# Controllo automatico dell'app Equo

`controllo-app.cjs` apre l'app in modalita demo come proprietario, maniscalco, istruttore e veterinario
(telefono 390x844) e controlla: Home visibile, barra in basso, tasto "+", ogni pagina della barra,
nessun errore JavaScript.

- Su Netlify gira nel comando di build (`npm run controllo:netlify`): se fallisce, il deploy viene bloccato
  e online resta la versione precedente.
- In locale: `npm install` e `npx playwright install chromium` una volta, poi `npm run controllo`.
- Ogni difetto nuovo trovato in produzione diventa un controllo in piu in questo script.
