// Genera ruoli/veterinario/stili/00-colori.css (29/10/2026).
// Il veterinario usa SOLO i colori del mockup C (blu notte, Tiffany, oro champagne, rosso, avorio) con il bianco come base.
// Le pagine e le finestre dei professionisti hanno molti colori scritti a mano negli stili comuni e del maniscalco:
// questo strumento legge quegli stili e, per ogni regola con un colore, scrive la stessa regola valida solo per il
// veterinario (:where(body.pl-vet) …) con il colore del mockup corrispondente. Il maniscalco non cambia.
// Uso: node equo-app-src/strumenti/colori-veterinario.cjs [--verifica]
// Da rilanciare quando cambiano gli stili comuni o del maniscalco (poi costruisci-moduli e unisci come sempre).
const fs = require("fs");
const path = require("path");
const SRC = path.resolve(__dirname, "..", "src");
const DEST = path.join(SRC, "ruoli/veterinario/stili/00-colori.css");
const CARTELLE = ["core/stili", "comune/barra/stili", "comune/chat/stili", "comune/home-widget/stili", "ruoli/maniscalco/stili"];
const SALTA_FILE = ["10-regole-ruoli.css"];
// regole di altri ruoli o di schermate fuori dall'app: non servono al veterinario
const SALTA_SEL = /pl-owner|pl-istr|pl-man\b|home-man|data-vista="owner"|screen-auth|screen-onboarding|#page-home\b|#page-diario|#page-cavalli|#page-chat\b|#page-spese|#page-prenotazioni|\.tr-|#tr-/;

// palette del mockup
const P = { bianco: "#FFFFFF", avorio: "#F7F4EE", sup: "#FFFDFA", bordo: "#E6E0D4", notte: "#1D2D50", notte2: "#2B3F6B", notte3: "#3A4E7A",
  tif: "#7FD1C9", tifScuro: "#2E8F88", tifChiaro: "#E3F4F2", tifTesto: "#1F6E68", oro: "#C9A96E", oroChiaro: "#F4EEE1", oroTesto: "#8A6D2E",
  chip: "#EDE8DD", testo: "#1A2236", testo2: "#677086", suBlu: "#B9C3D9", urg: "#A9443B", urgChiaro: "#FBF0EE", nero: "#000000" };
const PALETTE = new Set(Object.values(P).map(x => x.toLowerCase()));

function hexRgb(h){ h = h.replace("#", ""); if(h.length === 3) h = h.split("").map(c => c + c).join(""); return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); }
function hsl([r, g, b]){ r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; let h = 0, s = 0;
  if(mx !== mn){ const d = mx - mn; s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn);
    h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; }
  return { h, s, l }; }
// colore originale → colore del mockup, secondo il ruolo: testo, sfondo o bordo
function mappa(hex, ruolo){
  const h6 = "#" + hexRgb(hex).map(x => x.toString(16).padStart(2, "0")).join("");
  if(PALETTE.has(h6)) return h6.toUpperCase();
  if(h6 === "#ffffff") return P.bianco;
  const { h, s, l } = hsl(hexRgb(hex));
  const rosso = s > .35 && (h < 18 || h > 340) && l > .2 && l < .8;
  const verdeChiaro = s > .25 && h >= 90 && h <= 175 && l > .55;
  const verde = s > .25 && h >= 90 && h <= 175;
  const oro = s > .3 && h >= 18 && h < 70;
  if(l < .12 && s < .3) return ruolo === "testo" ? P.testo : P.notte;           // quasi nero
  if(rosso) return ruolo === "sfondo" && l > .85 ? P.urgChiaro : P.urg;
  if(l >= .93) return ruolo === "bordo" ? P.bordo : ruolo === "testo" ? P.bianco : (s > .25 ? P.avorio : P.bianco);  // chiarissimi (beige, crema)
  if(l < .35) return ruolo === "testo" ? P.notte : ruolo === "bordo" ? P.notte : P.notte;  // scuri: verdi scuri, marroni → blu notte
  if(verdeChiaro) return ruolo === "testo" ? P.tifScuro : P.tifChiaro;
  if(verde) return ruolo === "testo" ? P.tifScuro : P.tifScuro;
  if(oro){
    if(l > .8) return ruolo === "testo" ? P.oroTesto : ruolo === "bordo" ? P.bordo : P.avorio;   // beige e oro chiaro
    return ruolo === "testo" ? P.tifScuro : ruolo === "bordo" ? P.tif : P.tif;                     // oro dei tasti → Tiffany
  }
  if(s < .2) return ruolo === "testo" ? P.testo2 : l > .75 ? (ruolo === "bordo" ? P.bordo : P.chip) : P.testo2;   // grigi
  if(h >= 175 && h < 260) return ruolo === "testo" ? P.notte2 : P.notte2;                         // blu
  return ruolo === "testo" ? P.testo2 : P.bordo;
}
function ruoloProp(p){ p = p.toLowerCase();
  if(p === "color" || p === "fill" || p === "stroke" || p === "caret-color" || p === "-webkit-text-fill-color" || p === "text-decoration-color") return "testo";
  if(p.startsWith("background")) return "sfondo";
  if(p.startsWith("border") || p.startsWith("outline") || p === "box-shadow" || p === "text-shadow") return "bordo";
  if(p.startsWith("--")) return "sfondo";
  return null; }
function rgbHex(r, g, b){ return "#" + [r, g, b].map(x => Math.max(0, Math.min(255, Math.round(+x))).toString(16).padStart(2, "0")).join(""); }
function convertiValore(v, ruolo){
  let cambiato = false;
  let out = v.replace(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g, m => { const n = mappa(m, ruolo); if(n.toLowerCase() !== m.toLowerCase() && !(m.length === 4 && n === P.bianco && /^#fff$/i.test(m))) cambiato = true; return n; });
  out = out.replace(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(,\s*[\d.]+\s*)?\)/g, (m, r, g, b, a) => {
    if(+r === 0 && +g === 0 && +b === 0) return m;                 // ombre nere: restano
    if(+r === 255 && +g === 255 && +b === 255) return m;
    const n = hexRgb(mappa(rgbHex(r, g, b), ruolo)); cambiato = true;
    return a ? `rgba(${n.join(",")}${a})` : `rgb(${n.join(",")})`; });
  return cambiato ? out : null;
}
// selettore → stessa cosa solo per il veterinario
function perVet(sel){
  sel = sel.trim();
  if(!sel || SALTA_SEL.test(sel)) return null;
  if(/^(html|:root)\b/.test(sel)){ const m = sel.match(/^((?:html|:root)[^\s>+~]*)(\s*[>+~]?\s*)(.*)$/); if(!m) return null;
    const resto = m[3]; if(/^body\b/.test(resto)) return m[1] + " " + resto.replace(/^body([^\s>+~]*)/, "body$1:where(.pl-vet)");
    return resto ? m[1] + " :where(body.pl-vet) " + resto : null; }
  if(/^body\b/.test(sel)) return sel.replace(/^body([^\s>+~]*)/, "body$1:where(.pl-vet)");
  if(/^\[data-(tono|pagina)/.test(sel)) return "body:where(.pl-vet)" + sel;
  if(/^\*|^::/.test(sel)) return null;
  return ":where(body.pl-vet) " + sel;
}
function togliCommenti(t){ return t.replace(/\/\*[\s\S]*?\*\//g, ""); }
// legge le regole (anche dentro @media / @supports)
function regole(testo, out, wrap){
  let i = 0;
  while(i < testo.length){
    const a = testo.indexOf("{", i); if(a < 0) break;
    const prelude = testo.slice(i, a).trim();
    let d = 1, j = a + 1; while(j < testo.length && d){ if(testo[j] === "{") d++; else if(testo[j] === "}") d--; j++; }
    const corpo = testo.slice(a + 1, j - 1);
    if(/^@(media|supports)/.test(prelude)) regole(corpo, out, (wrap || []).concat(prelude));
    else if(!prelude.startsWith("@")) out.push({ sel: prelude, corpo, wrap: wrap || [] });
    i = j;
  }
  return out;
}
const righe = ["/* GENERATO da equo-app-src/strumenti/colori-veterinario.cjs: NON modificare qui. Colori del mockup C per il veterinario. */"];
let n = 0;
for(const c of CARTELLE){
  const dir = path.join(SRC, c); if(!fs.existsSync(dir)) continue;
  for(const f of fs.readdirSync(dir).filter(f => f.endsWith(".css") && !SALTA_FILE.includes(f)).sort()){
    const testo = togliCommenti(fs.readFileSync(path.join(dir, f), "utf8"));
    const blocco = [];
    for(const r of regole(testo, [])){
      const decl = [];
      r.corpo.split(";").forEach(dc => { const k = dc.indexOf(":"); if(k < 0) return; const p = dc.slice(0, k).trim(), v = dc.slice(k + 1).trim();
        const ru = ruoloProp(p); if(!ru || !/#[0-9a-fA-F]{3,6}\b|rgba?\(/.test(v)) return; const nv = convertiValore(v, ru); if(nv) decl.push(p + ":" + nv); });
      if(!decl.length) continue;
      const sels = r.sel.split(",").map(perVet).filter(Boolean);
      if(!sels.length) continue;
      let riga = sels.join(",") + "{" + decl.join(";") + "}";
      for(const w of [...r.wrap].reverse()) riga = w + "{" + riga + "}";
      blocco.push(riga); n++;
    }
    if(blocco.length) righe.push("/* " + c + "/" + f + " */", ...blocco);
  }
}
const css = righe.join("\n") + "\n";
if(process.argv.includes("--verifica")){
  const ora = fs.existsSync(DEST) ? fs.readFileSync(DEST, "utf8") : "";
  if(ora !== css){ console.error("Da rigenerare: ruoli/veterinario/stili/00-colori.css (node equo-app-src/strumenti/colori-veterinario.cjs)"); process.exit(1); }
  console.log("OK: 00-colori.css corrisponde agli stili comuni (" + n + " regole).");
} else { fs.writeFileSync(DEST, css); console.log("Scritto ruoli/veterinario/stili/00-colori.css (" + n + " regole)."); }
