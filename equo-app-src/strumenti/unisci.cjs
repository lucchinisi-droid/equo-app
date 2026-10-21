// Rimette insieme equo-app-src/src/ in un unico equo-app/index.html (quello che Netlify pubblica).
// Uso: node equo-app-src/strumenti/unisci.cjs            -> scrive equo-app/index.html
//      node equo-app-src/strumenti/unisci.cjs --verifica -> controlla che index.html sia gia uguale ai sorgenti
const fs = require("fs");
const path = require("path");
const RADICE = path.resolve(__dirname, "..", "..");
const SRC = path.join(RADICE, "equo-app-src", "src");
const DEST = path.join(RADICE, "equo-app", "index.html");
const modello = fs.readFileSync(path.join(SRC, "index.modello.html"), "utf8");
const usati = new Set();
const out = modello.replace(/<!--@ ([^ ]+) -->/g, (_, rel) => {
  const p = path.join(SRC, rel);
  if(!fs.existsSync(p)) throw new Error("Manca il file " + rel);
  usati.add(rel); return fs.readFileSync(p, "utf8");
});
// file dimenticati: esistono in src ma il modello non li usa
const tutti = []; (function giro(d, pre){ for(const f of fs.readdirSync(d, { withFileTypes: true })){ const r = pre + f.name; if(f.isDirectory()) giro(path.join(d, f.name), r + "/"); else if(r !== "index.modello.html") tutti.push(r); } })(SRC, "");
const orfani = tutti.filter(r => !usati.has(r));
if(orfani.length){ console.error("File non collegati nel modello:\n- " + orfani.join("\n- ")); process.exit(1); }
if(process.argv.includes("--verifica")){
  const ora = fs.readFileSync(DEST, "utf8");
  if(ora !== out){ console.error("equo-app/index.html NON corrisponde ai sorgenti in equo-app-src/src: rilanciare unisci.cjs"); process.exit(1); }
  console.log("OK: equo-app/index.html corrisponde ai sorgenti (" + usati.size + " file).");
} else {
  fs.writeFileSync(DEST, out);
  console.log("Scritto equo-app/index.html da " + usati.size + " file (" + out.length + " caratteri).");
}
