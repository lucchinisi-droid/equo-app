// Eseguito da Netlify a ogni deploy (netlify.toml → [build] command).
// Scrive il codice di build INTERNO (commit git) in index.html e in version.json:
// l'app lo confronta per mostrare il banner "Nuova versione disponibile → Aggiorna".
// NON è la versione mostrata all'utente (v1.0, decisa solo da Simone: vedi VERSIONI in index.html).
const fs = require("fs");
const path = require("path");
const build = (process.env.COMMIT_REF || "").slice(0, 12) || "manuale-" + Date.now();
const radice = path.join(__dirname, "..");
const file = path.join(radice, "index.html");
const html = fs.readFileSync(file, "utf8");
if (!html.includes("__EQUO_BUILD__")) { console.log("scrivi-build: segnaposto non trovato, niente da fare"); process.exit(0); }
fs.writeFileSync(file, html.split("__EQUO_BUILD__").join(build));
fs.writeFileSync(path.join(radice, "version.json"), JSON.stringify({ build }) + "\n");
console.log("scrivi-build: build", build);
