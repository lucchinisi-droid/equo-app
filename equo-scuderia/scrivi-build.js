// Eseguito da Netlify a ogni deploy (netlify.toml → [build] command).
// Scrive il codice di build INTERNO (commit git) in index.html e in version.json:
// l'app lo confronta per mostrare il pop-up "È disponibile un aggiornamento" con "Cosa c'è di nuovo" (da novita.json).
// NON è la versione mostrata all'utente (il gestionale non mostra numeri di versione).
const fs = require("fs");
const path = require("path");
const build = (process.env.COMMIT_REF || "").slice(0, 12) || "manuale-" + Date.now();
const radice = __dirname;
const file = path.join(radice, "index.html");
const html = fs.readFileSync(file, "utf8");
if (!html.includes("__EQUO_BUILD__")) { console.log("scrivi-build: segnaposto non trovato, niente da fare"); process.exit(0); }
let novita = null;
try { novita = JSON.parse(fs.readFileSync(path.join(radice, "novita.json"), "utf8")); } catch (e) { console.log("scrivi-build: novita.json assente o non valido"); }
fs.writeFileSync(file, html.split("__EQUO_BUILD__").join(build));
fs.writeFileSync(path.join(radice, "version.json"), JSON.stringify({ build, novita }) + "\n");
console.log("scrivi-build: build", build);
