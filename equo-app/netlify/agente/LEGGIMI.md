# Agenti AI · parti di netlify/functions/agent.js (dal 22/10/2026)

`netlify/functions/agent.js` contiene solo il gestore delle richieste (login, limiti, chiamata al modello, giri degli strumenti).
Il resto sta qui, un file per argomento:
- `configurazione.js` — modello, prezzi, limiti, costanti
- `istruzioni-proprietario.js` — regole comuni + Pegasus + Equo AI
- `istruzioni-hammer.js`, `istruzioni-ares.js`, `istruzioni-scuderia.js` (Athena e agenti in Scuderia), `istruzioni-merlino.js`
- `strumenti.js` — gli strumenti (tool) di ogni agente
- `esegui-strumento.js` — cosa succede quando un agente usa uno strumento
- `aiuti.js`, `meteo.js` — funzioni di aiuto

Netlify impacchetta tutto con esbuild seguendo i `require`. Questa cartella sta FUORI da netlify/functions apposta:
cosi Netlify non scambia questi file per funzioni. Le parti non si richiamano mai in cerchio.
