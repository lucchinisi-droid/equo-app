// Divide equo-app/index.html in tanti file piccoli dentro equo-app-src/src/.
// Il risultato, rimesso insieme da unisci.cjs, e IDENTICO byte per byte all'originale.
// Uso: node equo-app-src/strumenti/dividi.cjs [--app equo-scuderia]   (dalla cartella Equo)
// ATTENZIONE: serve solo la PRIMA volta. Se i sorgenti esistono gia si ferma (si lavora nei sorgenti, non nell'index.html).
const fs = require("fs");
const path = require("path");
const RADICE = path.resolve(__dirname, "..", "..");
const APP = (process.argv[process.argv.indexOf("--app") + 1] && process.argv.includes("--app")) ? process.argv[process.argv.indexOf("--app") + 1] : "equo-app";
// --pagina groom.html: un'altra pagina della stessa app (sorgenti in <app>-src/<nome pagina>, es. equo-scuderia-src/groom)
const PAGINA = process.argv.includes("--pagina") ? process.argv[process.argv.indexOf("--pagina") + 1] : "index.html";
const SRC = path.join(RADICE, APP + "-src", PAGINA === "index.html" ? "src" : PAGINA.replace(/\.html$/, ""));
const ORIGINE = path.join(RADICE, APP, PAGINA);
if(fs.existsSync(SRC) && !process.argv.includes("--forza")){ console.error("I sorgenti esistono gia in " + APP + "-src/src: non li sovrascrivo."); process.exit(1); }
const S = fs.readFileSync(ORIGINE, "utf8");
if(S.includes("<!--@ ")) throw new Error("index.html contiene gia la sequenza <!--@ : scegliere un altro segnaposto");

const slug = (t) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
  .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40).replace(/-+$/, "") || "parte";
const pad = (n, l = 3) => String(n).padStart(l, "0");
const file = {};           // percorso relativo -> contenuto
const usati = new Set();
function scrivi(rel, testo){
  let r = rel, k = 2;
  while(usati.has(r)){ r = rel.replace(/(\.[a-z]+)$/, "-" + k++ + "$1"); }
  usati.add(r); file[r] = testo; return "<!--@ " + r + " -->";
}
// divide un testo in pezzi all'inizio delle righe che soddisfano "segna"; nome dal testo della riga
function aPezzi(testo, segna, nomeDa){
  const righe = testo.split(/(?<=\n)/);
  const pezzi = []; let cur = { nome: "inizio", testo: "" };
  for(const r of righe){
    const m = segna(r);
    if(m && cur.testo.length){ pezzi.push(cur); cur = { nome: nomeDa(m, r), testo: "" }; }
    else if(m){ cur.nome = nomeDa(m, r); }
    cur.testo += r;
  }
  if(cur.testo.length) pezzi.push(cur);
  return pezzi;
}

// 1) blocchi <style> e <script> in linea
const blocchi = [];
const re = /<(style|script)(\s[^>]*)?>/g; let m;
while((m = re.exec(S))){
  const attr = m[2] || "";
  if(m[1] === "script" && /\ssrc=/.test(attr)) continue;
  const inizio = m.index + m[0].length, fine = S.indexOf("</" + m[1] + ">", inizio);
  const id = (attr.match(/id="([^"]+)"/) || [])[1] || null;
  blocchi.push({ tipo: m[1], inizio, fine, id, righe: S.slice(inizio, fine).split("\n").length });
  re.lastIndex = fine;
}
const maxStyle = Math.max(...blocchi.filter(b => b.tipo === "style").map(b => b.righe));
const maxScript = Math.max(...blocchi.filter(b => b.tipo === "script").map(b => b.righe));

let modello = "", pos = 0, nStile = 0, nScript = 0, nHtml = 0;
function html(testo){
  // il testo HTML con pagine e finestre (modali) va diviso: un file per pagina o finestra
  if(/<div class="(page-content|modal-overlay|module-page)/.test(testo)){
    const pezzi = aPezzi(testo, r => r.match(/^\s*<div class="(?:page-content|modal-overlay|module-page)[^"]*" id="([^"]+)"/), (mm) => mm[1]);
    return pezzi.map(p => scrivi("html/" + pad(++nHtml) + "-" + slug(p.nome) + ".html", p.testo)).join("");
  }
  return testo;
}
for(const b of blocchi){
  modello += html(S.slice(pos, b.inizio));
  const dentro = S.slice(b.inizio, b.fine);
  if(b.tipo === "style"){
    nStile++;
    if(b.righe === maxStyle){
      const pezzi = aPezzi(dentro, r => r.match(/^\/\* ?-*\s*(.+?)\s*(?:-+ ?\*\/|\*\/|$)/), (mm) => mm[1]);
      modello += pezzi.map((p, i) => scrivi("stili/base/" + pad(i + 1, 2) + "-" + slug(p.nome) + ".css", p.testo)).join("");
    } else modello += scrivi("stili/" + pad(nStile, 2) + "-" + slug(b.id || (dentro.match(/\/\*\s*(.+?)\s*\*\//) || [])[1] || "stile") + ".css", dentro);
  } else {
    nScript++;
    if(b.righe === maxScript){
      const pezzi = aPezzi(dentro, r => r.match(/^\/\* -{3,}\s*(.+?)\s*(?:-{3,}|\*\/|$)/), (mm) => mm[1]);
      modello += pezzi.map((p, i) => scrivi("script/app/" + pad(i + 1) + "-" + slug(p.nome) + ".js", p.testo)).join("");
    } else {
      const titolo = b.id || (dentro.match(/^\s*\/[*/]\s*([^\n*]{3,60})/) || [])[1] || "script";
      modello += scrivi("script/" + pad(nScript, 2) + "-" + slug(titolo) + ".js", dentro);
    }
  }
  pos = b.fine;
}
modello += html(S.slice(pos));

fs.rmSync(SRC, { recursive: true, force: true });
for(const [rel, testo] of Object.entries(file)){
  const p = path.join(SRC, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, testo);
}
fs.writeFileSync(path.join(SRC, "index.modello.html"), modello);
console.log("File creati:", Object.keys(file).length + 1, "· modello:", modello.split("\n").length, "righe");
