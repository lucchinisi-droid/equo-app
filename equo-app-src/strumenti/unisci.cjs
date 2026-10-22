// Rimette insieme equo-app-src/src/ in un unico equo-app/index.html (quello che Netlify pubblica).
// Uso: node equo-app-src/strumenti/unisci.cjs            -> scrive equo-app/index.html
//      node equo-app-src/strumenti/unisci.cjs --verifica -> controlla che index.html sia gia uguale ai sorgenti
const fs = require("fs");
const path = require("path");
const RADICE = path.resolve(__dirname, "..", "..");
// --app equo-scuderia per Equo Scuderia (sorgenti in equo-scuderia-src/src); senza: l'app Equo
const APP = process.argv.includes("--app") ? process.argv[process.argv.indexOf("--app") + 1] : "equo-app";
// --pagina groom.html: un'altra pagina della stessa app (sorgenti in <app>-src/<nome pagina>, es. equo-scuderia-src/groom)
const PAGINA = process.argv.includes("--pagina") ? process.argv[process.argv.indexOf("--pagina") + 1] : "index.html";
const SRC = path.join(RADICE, APP + "-src", PAGINA === "index.html" ? "src" : PAGINA.replace(/\.html$/, ""));
const DEST = path.join(RADICE, APP, PAGINA);
const modello = fs.readFileSync(path.join(SRC, "index.modello.html"), "utf8");
const usati = new Set();
const out = modello.replace(/<!--@ ([^ ]+) -->/g, (_, rel) => {
  const p = path.join(SRC, rel);
  if(!fs.existsSync(p)) throw new Error("Manca il file " + rel);
  usati.add(rel); return fs.readFileSync(p, "utf8");
});
// file dimenticati: esistono in src ma il modello non li usa
const tutti = []; (function giro(d, pre){ for(const f of fs.readdirSync(d, { withFileTypes: true })){ const r = pre + f.name; if(f.isDirectory()) giro(path.join(d, f.name), r + "/"); else if(r !== "index.modello.html") tutti.push(r); } })(SRC, "");
// i moduli ES (cartelle "moduli/") non entrano direttamente: Vite li costruisce in un file "costruito.js" (costruisci-moduli.mjs)
const orfani = tutti.filter(r => !usati.has(r) && !r.includes("/moduli/"));
if(orfani.length){ console.error("File non collegati nel modello:\n- " + orfani.join("\n- ")); process.exit(1); }
// regola di confinamento: cosa mostra la Home dei professionisti si decide SOLO in core/stili/10-regole-ruoli.css
const violazioni = APP !== "equo-app" ? [] : tutti.filter(r => r.endsWith(".css") && r !== "core/stili/10-regole-ruoli.css")
  .filter(r => /#page-pro-home\s*>/.test(fs.readFileSync(path.join(SRC, r), "utf8")));
if(violazioni.length){ console.error("Regole su \"#page-pro-home > ...\" fuori da core/stili/10-regole-ruoli.css:\n- " + violazioni.join("\n- ")); process.exit(1); }
if(process.argv.includes("--verifica")){
  const ora = fs.readFileSync(DEST, "utf8");
  if(ora !== out){ console.error(APP + "/" + PAGINA + " NON corrisponde ai sorgenti in " + APP + "-src/src: rilanciare unisci.cjs"); process.exit(1); }
  console.log("OK: " + APP + "/" + PAGINA + " corrisponde ai sorgenti (" + usati.size + " file).");
} else {
  fs.writeFileSync(DEST, out);
  console.log("Scritto " + APP + "/" + PAGINA + " da " + usati.size + " file (" + out.length + " caratteri).");
}
