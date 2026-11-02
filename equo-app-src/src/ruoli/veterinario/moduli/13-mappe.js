// Equo App · veterinario · MAPPE (2/11/2026, decisioni di Simone)
// Un solo componente per tutti i disegni (sagome di Simone, vettoriali in 13a e 13b):
//  · cavallo in 5 viste (sinistra, destra = sinistra specchiata, davanti, dietro, dall'alto);
//  · arti: anteriore e posteriore (vista laterale + palmare/plantare), lato scelto; zone dei tendini 1A–3C e pastorale (P1A, P1B, P2);
//  · zoccoli: suola anteriore e posteriore, piede scelto (ASx, ADx, PSx, PDx; i destri sono i sinistri specchiati);
//  · lingua: 5 zone MTC (radice, lati, centro, punta) con colore, patina, umidità, segni;
//  · dentatura: 42 denti con numero Triadan, stato per dente.
// Campo della scheda visita di tipo «mappa» (c.disegno: cavallo · arto · zoccoli; c.modo):
//  · punti (agopuntura/MTC): il veterinario tocca il disegno DOVE trova il punto, sceglie il nome e la reattività 0–3;
//    la volta dopo propone dove LUI l'aveva messo;
//  · segni (dolore, ferita, gonfiore, lesione…): tocca il disegno, numero progressivo, nota (negli arti anche la zona del tendine);
//  · zone (lingua): dati[k] = { punta: { colore, patina, patina_c, umidita, segni: [], nota }, … };
//  · denti: dati[k] = { "106": { s: ["punte", "limato"], nota }, … }.
// Pallini e segni si spostano trascinandoli. Punti e segni: dati[k] = [{ id, v, x, y, n, g, tipo, num, nota, z }], x e y da 0 a 1 nella vista.
// I disegni compilati vanno anche nel PDF del referto (mpImmaginiPdf). Niente SQL: tutto nei dati della scheda.

import { VS, vsCambia } from "./07-scheda-visita.js";
import { MP_DISEGNI } from "./13a-mappe-disegni.js";
import { MP_DISEGNI_2, MP_DENTI, MP_LINGUA } from "./13b-mappe-disegni.js";

const MP_D = { ...MP_DISEGNI, ...MP_DISEGNI_2 };
const mpEsc = s => escapeHtml(s == null ? "" : String(s));
const mpJs = s => mpEsc(JSON.stringify(s));
const NOTTE = "#1D2D50", URG = "#A9443B", ORO = "#C9A96E", TIFS = "#2E8F88", GRIGIO = "#677086";

/* ---------------- disegni e viste ---------------- */
// vista: [id, nome, { d: disegno, spec: specchiata, specLat: solo la vista laterale specchiata, crop: [x, y, w, h], t: nome nel testo }]
const LAB_A = ["Laterale", "Palmare"], LAB_P = ["Laterale", "Plantare"];
const MP_SET = {
  cavallo: { viste: [["sx", "Sinistra", { d: "sx" }], ["dx", "Destra", { d: "sx", spec: true }], ["av", "Davanti", { d: "av" }], ["po", "Dietro", { d: "po" }], ["al", "Dall'alto", { d: "al" }]],
    tipi: [["dolore", "Dolore", URG], ["ferita", "Ferita", ORO], ["gonfiore", "Gonfiore", TIFS], ["altro", "Altro", GRIGIO]] },
  arto: { viste: [["as", "Ant. sinistro", { d: "arto_a", lab: LAB_A }], ["ad", "Ant. destro", { d: "arto_a", specLat: true, lab: LAB_A }],
      ["ps", "Post. sinistro", { d: "arto_p", lab: LAB_P }], ["pd", "Post. destro", { d: "arto_p", specLat: true, lab: LAB_P }]],
    tipi: [["lesione", "Lesione", URG], ["gonfiore", "Gonfiore", TIFS], ["dolore", "Dolore", "#8A6D2E"], ["ferita", "Ferita", ORO], ["altro", "Altro", GRIGIO]] },
  zoccoli: { viste: [["as", "ASx", { d: "zoccoli", crop: [15, 130, 770, 830], t: "ASx" }], ["ad", "ADx", { d: "zoccoli", crop: [15, 130, 770, 830], spec: true, t: "ADx" }],
      ["ps", "PSx", { d: "zoccoli", crop: [795, 130, 615, 830], t: "PSx" }], ["pd", "PDx", { d: "zoccoli", crop: [795, 130, 615, 830], spec: true, t: "PDx" }]],
    tipi: [["ascesso", "Ascesso", URG], ["contusione", "Contusione", ORO], ["fessura", "Fessura", TIFS], ["altro", "Altro", GRIGIO]] },
  lingua: { viste: [["li", "Lingua", { d: "lingua" }]] },
  denti: { viste: [["de", "Dentatura", { d: "denti" }]] }
};
// asse della vista laterale degli arti (specchiata per il lato destro) e confine con la vista palmare/plantare
const MP_LAT = { da: 200, fino: 760, asse: 470 };   // da: oltre, nella vista specchiata, finirebbe un pezzo della palmare
// zone dei tendini (ecografia) per altezza, sulla vista palmare/plantare: [nome, y da, y a]
const mpBande = (y0, passo, pas) => { const n = ["1A", "1B", "2A", "2B", "3A", "3B", "3C"].map((z, i) => [z, y0 + i * passo, y0 + (i + 1) * passo]); const f = y0 + 7 * passo;
  return [...n, ["P1A", f, f + pas[0]], ["P1B", f + pas[0], f + pas[0] + pas[1]], ["P2", f + pas[0] + pas[1], f + pas[0] + pas[1] + pas[2]]]; };
const MP_BANDE = { arto_a: mpBande(255, 70, [55, 50, 50]), arto_p: mpBande(350, 61, [53, 45, 40]) };
const MP_BANDE_X = [885, 1075];

// lingua: zone MTC (lato destro del cavallo = sinistra di chi guarda, punta in basso)
const MP_ZONE = [["punta", "Punta", "Cuore / Polmone"], ["centro", "Centro", "Milza / Stomaco"], ["lato_sx", "Lato sinistro", "Fegato / Vescica biliare"],
  ["lato_dx", "Lato destro", "Fegato / Vescica biliare"], ["radice", "Radice", "Rene"]];
const MP_LINGUA_SCELTE = [["colore", "Colore", ["Rosa", "Pallida", "Rossa", "Rosso scuro", "Viola"]], ["patina", "Patina", ["Assente", "Sottile", "Spessa"]],
  ["patina_c", "Colore della patina", ["Bianca", "Gialla", "Grigia"]], ["umidita", "Umidità", ["Secca", "Normale", "Umida"]]];
const MP_LINGUA_SEGNI = ["Gonfia", "Impronte dei denti", "Fessure", "Punti rossi", "Macchie"];

// denti: stati (categoria: t da trattare · p problema · f fatto oggi · m mancante)
const MP_DENTE = [["punte", "Punte di smalto", "t"], ["gancio", "Gancio", "t"], ["rampa", "Rampa", "t"], ["onda", "Onda", "t"], ["scalino", "Scalino", "t"],
  ["diastema", "Diastema", "p"], ["frattura", "Frattura", "p"], ["carie", "Carie", "p"], ["mobile", "Mobile", "p"], ["eotrh", "EOTRH", "p"],
  ["mancante", "Mancante", "m"], ["limato", "Limato oggi", "f"], ["estratto", "Estratto oggi", "f"]];
const MP_CAT = { f: [TIFS, "fatto oggi"], p: [URG, "problema"], t: [ORO, "da trattare"], m: ["#B9C3D9", "mancante"] };
const MP_NOMI_DENTE = ["", "incisivo centrale", "incisivo intermedio", "incisivo d'angolo", "canino", "primo premolare (dente di lupo)", "secondo premolare",
  "terzo premolare", "quarto premolare", "primo molare", "secondo molare", "terzo molare"];
function mpNomeDente(n){ const q = +String(n)[0], i = +String(n).slice(1); return (MP_NOMI_DENTE[i] || "dente") + (q <= 2 ? " sup. " : " inf. ") + (q === 1 || q === 4 ? "dx" : "sx"); }
function mpCatDente(s){ for(const c of ["f", "p", "t", "m"]) if((s || []).some(x => (MP_DENTE.find(d => d[0] === x) || [])[2] === c)) return c; return null; }

const MP_GRADI = ["#B9C3D9", "#7FD1C9", ORO, URG];   // reattività 0 · 1 lieve · 2 media · 3 forte
const MP_NOMI_GRADO = ["0", "1 lieve", "2 media", "3 forte"];
// elenco proposto (nomi, non posizioni): i punti diagnostici della scheda MTC e i più usati; il veterinario aggiunge i suoi
const MP_PUNTI = [["GV20", "Bai-hui"], ["BL13", "Shu Polmone"], ["BL14", "Shu Pericardio"], ["BL15", "Shu Cuore"], ["BL17", "Shu Diaframma"], ["BL18", "Shu Fegato"],
  ["BL19", "Shu Vescica biliare"], ["BL20", "Shu Milza"], ["BL21", "Shu Stomaco"], ["BL22", "Shu Triplice riscaldatore"], ["BL23", "Shu Rene"], ["BL25", "Shu Grosso intestino"],
  ["BL27", "Shu Intestino tenue"], ["BL28", "Shu Vescica"], ["GB21", "Base del collo"], ["SI9", "Spalla"], ["GB34", "Grassella"], ["ST36", "Sotto la grassella"],
  ["SP6", "Sopra il garretto"], ["LI4", "Arto anteriore"], ["KID1", "Bulbi del tallone"], ["C", "Cervicale"]];

const MP = {};           // stato per campo: { vista, tipo, sel, zoom, attesaNome, cerca }
const mpCampo = k => (VS.campi || []).find(c => c.k === k) || { k, modo: "segni" };
const mpDisegno = c => c.modo === "denti" ? "denti" : c.modo === "zone" ? "lingua" : (MP_SET[c.disegno] ? c.disegno : "cavallo");
const mpSet = c => MP_SET[mpDisegno(c)];
const mpTipi = c => mpSet(c).tipi || MP_SET.cavallo.tipi;
const mpTipo1 = (c, t) => mpTipi(c).find(x => x[0] === t) || mpTipi(c)[mpTipi(c).length - 1];
const mpVistaDi = (c, v) => mpSet(c).viste.find(x => x[0] === v) || mpSet(c).viste[0];
const mpNomeVista = (c, v) => mpVistaDi(c, v)[1];
const mpTestoVista = (c, v) => { const x = mpVistaDi(c, v); return x[2].t || x[1].toLowerCase(); };
const mpStato = k => (MP[k] = MP[k] || { vista: mpSet(mpCampo(k)).viste[0][0], tipo: mpTipi(mpCampo(k))[0][0], sel: null, zoom: false, attesaNome: null, cerca: "" });
const mpOggetto = c => c.modo === "denti" || c.modo === "zone";
const mpVal = k => { const v = VS.visita?.dati?.[k]; return Array.isArray(v) ? v : []; };
const mpObj = k => { const v = VS.visita?.dati?.[k]; return v && typeof v === "object" && !Array.isArray(v) ? v : {}; };
const mpId = () => "m" + Math.random().toString(36).slice(2, 9);
// geometria della vista: disegno, ritaglio, specchio
function mpGeo(c, vista){
  const o = mpVistaDi(c, vista)[2], dis = MP_D[o.d];
  const [cx, cy, cw, ch] = o.crop || [0, 0, dis.w, dis.h];
  return { o, dis, cx, cy, cw, ch };
}
// zona del tendine dall'altezza (solo arti)
function mpZonaArto(c, vista, y){
  if(mpDisegno(c) !== "arto") return null;
  const g = mpGeo(c, vista), py = g.cy + y * g.ch, b = (MP_BANDE[g.o.d] || []).find(([, a, z]) => py >= a && py < z);
  return b ? b[0] : null;
}

/* ---------------- memoria dei punti: dove il veterinario li mette ---------------- */
const mpChiaveMem = () => "equo-mtc-punti-" + (currentUser?.id || "x");
function mpMemLeggi(){ try{ return JSON.parse(localStorage.getItem(mpChiaveMem()) || "{}") || {}; }catch(_){ return {}; } }
function mpMemScrivi(p){ if(!p?.n) return; try{ const m = mpMemLeggi(); m[p.n] = { v: p.v, x: p.x, y: p.y }; localStorage.setItem(mpChiaveMem(), JSON.stringify(m)); }catch(_){} }
// prima le visite precedenti dello stesso cavallo, poi l'ultima posizione usata dal veterinario
function mpPosizioneNota(k, nome){
  for(const pr of VS.precedenti || []){ const l = pr.dati && Array.isArray(pr.dati[k]) ? pr.dati[k] : []; const p = l.find(x => x.n === nome); if(p) return { v: p.v, x: p.x, y: p.y }; }
  return mpMemLeggi()[nome] || null;
}
function mpNomiNoti(k){
  const l = MP_PUNTI.map(([c, n]) => ({ c, n }));
  const extra = new Set(Object.keys(mpMemLeggi()));
  (VS.precedenti || []).forEach(pr => (Array.isArray(pr.dati?.[k]) ? pr.dati[k] : []).forEach(p => p.n && extra.add(p.n)));
  extra.forEach(c => { if(!l.some(x => x.c === c)) l.push({ c, n: "" }); });
  return l;
}

/* ---------------- disegno (anche per il PDF: niente stato, solo dati) ---------------- */
// opz: { sel, uid, pdf }
function mpDisegnoSvg(c, val, vista, opz = {}){
  const g = mpGeo(c, vista), { dis, cx, cy, cw, ch, o } = g, uid = opz.uid || "x";
  let sag = `<path d="${dis.d}"/>`;
  if(o.spec) sag = `<g transform="translate(${2 * cx + cw},0) scale(-1,1)">${sag}</g>`;
  else if(o.specLat) sag = `<defs><clipPath id="mpcl-${uid}"><rect x="${MP_LAT.da}" y="0" width="${MP_LAT.fino - MP_LAT.da}" height="${dis.h}"/></clipPath><clipPath id="mpcr-${uid}"><rect x="${MP_LAT.fino}" y="0" width="${dis.w - MP_LAT.fino}" height="${dis.h}"/></clipPath></defs>
    <g clip-path="url(#mpcl-${uid})"><g transform="translate(${2 * MP_LAT.asse},0) scale(-1,1)">${sag}</g></g><g clip-path="url(#mpcr-${uid})">${sag}</g>`;
  const fs = Math.round(Math.max(cw, ch) * 0.019);
  const scritta = (x, y, t, extra = "") => `<text x="${x}" y="${y}" text-anchor="middle" font-size="${fs}" font-weight="800" fill="${NOTTE}" stroke="#FFFFFF" stroke-width="${fs * 0.3}" paint-order="stroke" font-family="Helvetica,Arial,sans-serif" pointer-events="none"${extra}>${mpEsc(t)}</text>`;
  let sopra = "", segni = "";
  const disegno = mpDisegno(c);
  if(disegno === "arto"){
    const l = Array.isArray(val) ? val.filter(p => p.v === vista) : [], usate = new Set(l.map(p => p.z).filter(Boolean));
    const [x0, x1] = MP_BANDE_X;
    sopra = (MP_BANDE[o.d] || []).map(([z, a, b]) => `${usate.has(z) ? `<rect x="${x0}" y="${a}" width="${x1 - x0}" height="${b - a}" fill="${ORO}" opacity=".4" pointer-events="none"/>` : ""}
      <path d="M${x0 - 10},${b} L${x1},${b}" stroke="${GRIGIO}" stroke-width="2.5" stroke-dasharray="9 7" pointer-events="none"/>
      <text x="${x1 + 14}" y="${(a + b) / 2 + 9}" font-size="26" font-weight="800" fill="${NOTTE}" font-family="Helvetica,Arial,sans-serif" pointer-events="none">${z}</text>`).join("")
      + `<path d="M${x0 - 10},${MP_BANDE[o.d][0][1]} L${x1},${MP_BANDE[o.d][0][1]}" stroke="${GRIGIO}" stroke-width="2.5" stroke-dasharray="9 7" pointer-events="none"/>`
      + (o.lab ? `<text x="${MP_LAT.asse}" y="1072" text-anchor="middle" font-size="28" font-weight="700" fill="${GRIGIO}" font-family="Helvetica,Arial,sans-serif" pointer-events="none">${o.lab[0].toUpperCase()}</text>
        <text x="980" y="1072" text-anchor="middle" font-size="28" font-weight="700" fill="${GRIGIO}" font-family="Helvetica,Arial,sans-serif" pointer-events="none">${o.lab[1].toUpperCase()}</text>` : "");
  }
  if(disegno === "denti"){
    const d = val && typeof val === "object" ? val : {};
    sopra = Object.entries(MP_DENTI).map(([n, t]) => {
      const cat = mpCatDente(d[n]?.s), sel = opz.sel === n;
      return `<polygon class="mp-z" data-z="${n}" points="${t.p}" fill="${cat ? MP_CAT[cat][0] : "#FFFFFF"}" fill-opacity="${cat ? (cat === "m" ? 0.6 : 0.85) : 0.01}"${sel ? ` stroke="${NOTTE}" stroke-width="7"` : ""}/>`;
    }).join("")
      + Object.entries(MP_DENTI).map(([n, t]) => { const i = +n.slice(1), f = i >= 6 ? 22 : 17;
        return `<text x="${t.x}" y="${t.y + f * 0.35}" text-anchor="middle" font-size="${f}" font-weight="800" fill="${NOTTE}" stroke="#FFFFFF" stroke-width="5" paint-order="stroke" font-family="Helvetica,Arial,sans-serif" pointer-events="none">${n}</text>`; }).join("")
      + `<text x="443" y="60" text-anchor="middle" font-size="34" font-weight="800" fill="${GRIGIO}" font-family="Helvetica,Arial,sans-serif" pointer-events="none">SUPERIORE</text>
        <text x="443" y="1745" text-anchor="middle" font-size="34" font-weight="800" fill="${GRIGIO}" font-family="Helvetica,Arial,sans-serif" pointer-events="none">INFERIORE</text>
        <text x="40" y="960" font-size="28" font-weight="700" fill="${GRIGIO}" font-family="Helvetica,Arial,sans-serif" pointer-events="none">DX</text>
        <text x="808" y="960" font-size="28" font-weight="700" fill="${GRIGIO}" font-family="Helvetica,Arial,sans-serif" pointer-events="none">SX</text>`;
  }
  if(disegno === "lingua"){
    const d = val && typeof val === "object" ? val : {};
    sopra = MP_ZONE.map(([z]) => { const t = MP_LINGUA[z], v = d[z], pieno = mpZonaPiena(v), sel = opz.sel === z;
      const col = !pieno ? "#FFFFFF" : /Ross/.test(v.colore || "") ? URG : v.colore === "Viola" ? NOTTE : ORO;
      const op = !pieno ? 0.01 : v.colore === "Rosso scuro" ? 0.45 : /Ross|Viola/.test(v.colore || "") ? 0.3 : 0.35;
      return `<polygon class="mp-z" data-z="${z}" points="${t.p}" fill="${col}" fill-opacity="${op}" stroke="${sel ? NOTTE : GRIGIO}" stroke-width="${sel ? 8 : 3}"${sel ? "" : ' stroke-dasharray="14 10"'}/>`; }).join("")
      + MP_ZONE.map(([z, n]) => { const t = MP_LINGUA[z], v = d[z]; const r = mpZonaPiena(v) ? mpZonaBreve(v) : "";
        return scritta(t.x, t.y, /^Lato/.test(n) ? "Lato" : n) + (r ? `<text x="${t.x}" y="${t.y + fs * 1.25}" text-anchor="middle" font-size="${fs * 0.8}" font-weight="700" fill="${NOTTE}" stroke="#FFFFFF" stroke-width="${fs * 0.25}" paint-order="stroke" font-family="Helvetica,Arial,sans-serif" pointer-events="none">${mpEsc(r)}</text>` : ""); }).join("")
      + `<text x="${MP_LINGUA.lato_dx.x - 120}" y="1430" font-size="28" font-weight="700" fill="${GRIGIO}" font-family="Helvetica,Arial,sans-serif" pointer-events="none">DX</text>
        <text x="${MP_LINGUA.lato_sx.x + 80}" y="1430" font-size="28" font-weight="700" fill="${GRIGIO}" font-family="Helvetica,Arial,sans-serif" pointer-events="none">SX</text>`;
  }
  if(!mpOggetto(c)){
    const r = Math.round(Math.max(cw, ch) * 0.017);
    segni = (Array.isArray(val) ? val : []).filter(p => p.v === vista).map(p => {
      const x = cx + p.x * cw, y = cy + p.y * ch, sel = opz.sel === p.id;
      const col = c.modo === "punti" ? (p.g == null ? "#FFFFFF" : MP_GRADI[p.g]) : mpTipo1(c, p.tipo)[2];
      const testo = c.modo === "punti" ? (p.g > 0 || sel || opz.pdf ? (p.n || "?") : "") : String(p.num || "");
      return `<g class="mp-m${sel ? " sel" : ""}" data-id="${mpEsc(p.id)}" transform="translate(${x.toFixed(1)},${y.toFixed(1)})">
        ${sel ? `<circle r="${r * 1.9}" fill="none" stroke="${NOTTE}" stroke-width="${r * 0.25}"/>` : ""}
        <circle r="${sel ? r * 1.3 : r}" fill="${col}" stroke="${c.modo === "punti" && p.g == null ? NOTTE : "#FFFFFF"}" stroke-width="${r * 0.3}"/>
        ${c.modo !== "punti" ? `<text y="${r * 0.42}" text-anchor="middle" font-size="${r * 1.2}" font-weight="800" fill="#FFFFFF" font-family="Helvetica,Arial,sans-serif">${mpEsc(testo)}</text>`
          : testo ? `<text y="${-r * 1.6}" text-anchor="middle" font-size="${r * 1.35}" font-weight="800" fill="${NOTTE}" stroke="#FFFFFF" stroke-width="${r * 0.45}" paint-order="stroke" font-family="Helvetica,Arial,sans-serif">${mpEsc(testo)}</text>` : ""}
      </g>`; }).join("");
  }
  const dim = opz.pdf ? ` xmlns="http://www.w3.org/2000/svg" width="${cw}" height="${ch}" color="${NOTTE}"` : "";
  return `<svg class="mp-svg mp-${disegno}" viewBox="${cx} ${cy} ${cw} ${ch}"${dim} data-k="${mpEsc(c.k)}" role="img" aria-label="${mpEsc(mpNomeVista(c, vista))}">
    ${opz.pdf ? `<rect x="${cx}" y="${cy}" width="${cw}" height="${ch}" fill="#FFFFFF"/>` : ""}<g class="mp-sag" fill="currentColor" fill-rule="evenodd">${sag}</g>${sopra}${segni}</svg>`;
}
function mpSvg(k){
  const st = mpStato(k), c = mpCampo(k);
  return mpDisegnoSvg(c, VS.visita?.dati?.[k], st.vista, { sel: st.sel, uid: k });
}

/* ---------------- campo nella scheda ---------------- */
function mpCampoHtml(c, val, sola){
  const tit = c.e && c.e !== c.s ? `<span class="vs-lab">${mpEsc(c.e)}</span>` : "";
  return `<div class="vs-campo pieno mp mp-${mpDisegno(c)}-c" id="mp-${mpEsc(c.k)}">${tit ? `<div class="mp-tit">${tit}</div>` : ""}<div class="mp-dentro">${mpInterno(c.k, sola)}</div></div>`;
}
function mpInterno(k, sola){
  const c = mpCampo(k);
  if(c.modo === "denti") return mpInternoDenti(k, sola);
  if(c.modo === "zone") return mpInternoZone(k, sola);
  const st = mpStato(k), l = mpVal(k), punti = c.modo === "punti", set = mpSet(c);
  const conta = v => l.filter(p => p.v === v).length;
  const chip = (on, az, t, stile) => `<button type="button" class="vs-chip${on ? " on" : ""}" aria-pressed="${!!on}"${sola ? " disabled" : ""} onclick="${az}"${stile ? ` style="${stile}"` : ""}>${t}</button>`;
  const sel = l.find(p => p.id === st.sel);
  const tipi = !punti && !sola ? `<div class="vs-chips mp-tipi">${mpTipi(c).map(([t, n, col]) => chip(st.tipo === t, `mpTipo(${mpJs(k)}, '${t}')`, mpEsc(n), st.tipo === t ? `background:${col};border-color:${col};color:#fff` : "")).join("")}</div>` : "";
  const viste = `<div class="mp-viste" role="tablist">${set.viste.map(([v, n]) => `<button type="button" role="tab" aria-selected="${st.vista === v}" class="${st.vista === v ? "on" : ""}" onclick="mpVista(${mpJs(k)}, '${v}')">${n}${conta(v) ? ` <b>${conta(v)}</b>` : ""}</button>`).join("")}</div>`;
  const dove = mpDisegno(c) === "arto" ? " Le zone dei tendini (1A–3C, pastorale) si segnano da sole." : "";
  const aiuto = sola ? "" : punti
    ? (st.attesaNome ? `<div class="mp-aiuto on">Tocca il disegno dove hai trovato <b>${mpEsc(st.attesaNome)}</b>.</div>` : '<div class="mp-aiuto">Tocca il disegno dove trovi il punto, poi scegli il nome e la reattività. Trascina un pallino per spostarlo.</div>')
    : `<div class="mp-aiuto">Tocca il disegno per segnare <b>${mpEsc(mpTipo1(c, st.tipo)[1].toLowerCase())}</b>. Trascina un segno per spostarlo.${dove}</div>`;
  return `${tipi}${viste}${aiuto}
    <div class="mp-box${st.zoom ? " zoom" : ""}">${mpSvg(k)}</div>
    <div class="mp-barra"><button type="button" class="mp-lente" onclick="mpZoom(${mpJs(k)})">${st.zoom ? "Riduci" : "Ingrandisci"}</button>
      ${punti && !sola ? `<button type="button" class="mp-lente" onclick="mpElencoNomi(${mpJs(k)})">${st.cerca === null ? "Chiudi l'elenco" : "Scegli dall'elenco"}</button>` : ""}</div>
    ${punti && !sola && st.cerca === null && !sel ? mpScegliNome(k, null) : ""}
    ${sel && !sola ? mpPannello(k, sel) : ""}
    ${mpElenco(k)}`;
}
// pannello del pallino scelto
function mpPannello(k, p){
  const c = mpCampo(k);
  if(c.modo === "punti") return `<div class="mp-pan">
      <div class="mp-pan-t"><b>${p.n ? mpEsc(p.n) + mpEsc(mpDescr(p.n) ? " · " + mpDescr(p.n) : "") : "Che punto è?"}</b><small>${mpEsc(mpNomeVista(c, p.v))}</small></div>
      ${!p.n ? mpScegliNome(k, p.id) : `<div class="mp-gradi">${[0, 1, 2, 3].map(g => `<button type="button" class="${p.g === g ? "on" : ""}" style="${p.g === g ? `background:${MP_GRADI[g]};border-color:${MP_GRADI[g]};color:${g ? "#fff" : NOTTE}` : ""}" onclick="mpGrado(${mpJs(k)}, ${g})">${g}</button>`).join("")}</div>
        <div class="mp-pan-az"><button type="button" onclick="mpRinomina(${mpJs(k)})">Cambia nome</button><button type="button" class="urg" onclick="mpTogli(${mpJs(k)})">Togli</button><button type="button" onclick="mpChiudi(${mpJs(k)})">Fatto</button></div>`}
    </div>`;
  const tipo = mpTipo1(c, p.tipo);
  return `<div class="mp-pan">
      <div class="mp-pan-t"><b>${p.num} · ${mpEsc(tipo[1])}</b><small>${mpEsc(mpNomeVista(c, p.v))}${p.z ? " · zona " + mpEsc(p.z) : ""}</small></div>
      <div class="vs-chips">${mpTipi(c).map(([t, n, col]) => `<button type="button" class="vs-chip${p.tipo === t ? " on" : ""}" style="${p.tipo === t ? `background:${col};border-color:${col};color:#fff` : ""}" onclick="mpCambiaTipo(${mpJs(k)}, '${t}')">${mpEsc(n)}</button>`).join("")}</div>
      <input class="mp-nota" maxlength="140" value="${mpEsc(p.nota || "")}" placeholder="${mpDisegno(c) === "arto" ? "Nota: struttura, com'è (es. TFDS, lesione centrale)" : "Nota: dove, com'è, da quando"}" oninput="mpNota(${mpJs(k)}, this.value)">
      <div class="mp-pan-az"><button type="button" onclick="mpFoto()">Foto</button><button type="button" class="urg" onclick="mpTogli(${mpJs(k)})">Togli</button><button type="button" onclick="mpChiudi(${mpJs(k)})">Fatto</button></div>
    </div>`;
}
const mpDescr = c => (MP_PUNTI.find(x => x[0] === c) || [])[1] || "";
// scelta del nome: ricerca + elenco + «usa questo nome»
function mpScegliNome(k, id){
  const st = mpStato(k), q = String(st.cercaTesto || "").trim(), ql = q.toLowerCase();
  const nomi = mpNomiNoti(k).filter(x => !ql || x.c.toLowerCase().includes(ql) || x.n.toLowerCase().includes(ql));
  const az = c => id ? `mpNome(${mpJs(k)}, ${mpJs(c)})` : `mpNomePrima(${mpJs(k)}, ${mpJs(c)})`;
  return `<div class="mp-nomi"><input class="mp-cerca" id="mp-cerca-${mpEsc(k)}" value="${mpEsc(q)}" placeholder="Cerca o scrivi il nome del punto" oninput="mpCerca(${mpJs(k)}, this.value)" autocomplete="off">
    <div class="vs-chips">${nomi.slice(0, 30).map(x => `<button type="button" class="vs-chip" onclick="${az(x.c)}"><b>${mpEsc(x.c)}</b>${x.n ? " " + mpEsc(x.n) : ""}</button>`).join("")}
      ${q && !nomi.some(x => x.c.toLowerCase() === ql) ? `<button type="button" class="vs-chip on" onclick="${az(q)}">Usa «${mpEsc(q)}»</button>` : ""}</div></div>`;
}
// elenco sotto il disegno
function mpElenco(k){
  const c = mpCampo(k), l = mpVal(k);
  if(!l.length) return "";
  if(c.modo === "punti"){
    const ord = l.filter(p => p.n).sort((a, b) => (b.g ?? -1) - (a.g ?? -1) || a.n.localeCompare(b.n));
    return `<div class="mp-el">${ord.map(p => `<button type="button" onclick="mpSeleziona(${mpJs(k)}, ${mpJs(p.id)})"><b>${mpEsc(p.n)}${mpDescr(p.n) ? " · " + mpEsc(mpDescr(p.n)) : ""}</b>
      <span><i style="background:${p.g == null ? "#FFFFFF" : MP_GRADI[p.g]}"></i>${p.g == null ? "da valutare" : MP_NOMI_GRADO[p.g]} · ${mpEsc(mpTestoVista(c, p.v))}</span></button>`).join("")}</div>`;
  }
  return `<div class="mp-el">${l.slice().sort((a, b) => a.num - b.num).map(p => { const t = mpTipo1(c, p.tipo);
    const dove = [mpSet(c).viste.length > 1 && mpDisegno(c) !== "cavallo" ? mpTestoVista(c, p.v) : "", p.z ? "zona " + p.z : ""].filter(Boolean).join(" · ");
    return `<button type="button" onclick="mpSeleziona(${mpJs(k)}, ${mpJs(p.id)})"><b><i style="background:${t[2]}"></i>${p.num} · ${mpEsc(t[1])}</b><span>${mpEsc([p.nota, dove].filter(Boolean).join(" · ") || mpTestoVista(c, p.v))}</span></button>`; }).join("")}</div>`;
}

/* ---------------- dentatura ---------------- */
function mpInternoDenti(k, sola){
  const st = mpStato(k), c = mpCampo(k), d = mpObj(k), n = st.sel && MP_DENTI[st.sel] ? st.sel : null, s = n ? (d[n]?.s || []) : [];
  const pan = n && !sola ? `<div class="mp-pan"><div class="mp-pan-t"><b>${n} · ${mpEsc(mpNomeDente(n))}</b></div>
      <div class="vs-chips">${MP_DENTE.map(([id, nome, cat]) => { const on = s.includes(id);
        return `<button type="button" class="vs-chip${on ? " on" : ""}" aria-pressed="${on}" style="${on ? `background:${MP_CAT[cat][0]};border-color:${MP_CAT[cat][0]};color:${cat === "m" ? NOTTE : "#fff"}` : ""}" onclick="mpDente(${mpJs(k)}, '${id}')">${mpEsc(nome)}</button>`; }).join("")}</div>
      <input class="mp-nota" maxlength="140" value="${mpEsc(d[n]?.nota || "")}" placeholder="Nota sul dente" oninput="mpNotaOggetto(${mpJs(k)}, this.value)">
      <div class="mp-pan-az"><button type="button" onclick="mpOggettoSvuota(${mpJs(k)})">Normale</button><button type="button" onclick="mpDenteVicino(${mpJs(k)}, -1)">‹ Prima</button><button type="button" onclick="mpDenteVicino(${mpJs(k)}, 1)">Dopo ›</button><button type="button" onclick="mpChiudi(${mpJs(k)})">Fatto</button></div></div>` : "";
  const segnati = Object.keys(d).filter(x => MP_DENTI[x] && (d[x].s?.length || d[x].nota)).sort();
  const el = segnati.length ? `<div class="mp-el">${segnati.map(x => { const cat = mpCatDente(d[x].s);
    return `<button type="button" onclick="mpSelezionaZona(${mpJs(k)}, ${mpJs(x)})"><b><i style="background:${cat ? MP_CAT[cat][0] : "#FFFFFF"}"></i>${x}</b><span>${mpEsc(mpTestoDente(d[x]))}</span></button>`; }).join("")}</div>` : "";
  void c;
  return `${sola ? "" : '<div class="mp-aiuto">Tocca un dente e scegli com\'è. Numeri Triadan: 100 sup. dx · 200 sup. sx · 300 inf. sx · 400 inf. dx (destra del cavallo a sinistra di chi guarda).</div>'}
    <div class="mp-box${st.zoom ? " zoom" : ""}">${mpSvg(k)}</div>
    <div class="mp-barra"><span class="mp-leg">${Object.values(MP_CAT).map(([col, t]) => `<span><i style="background:${col}"></i>${t}</span>`).join("")}</span><button type="button" class="mp-lente" onclick="mpZoom(${mpJs(k)})">${st.zoom ? "Riduci" : "Ingrandisci"}</button></div>
    ${pan}${el}`;
}
const mpTestoDente = v => [...(v?.s || []).map(x => (MP_DENTE.find(d => d[0] === x) || [, x])[1].toLowerCase().replace("eotrh", "EOTRH")), v?.nota || ""].filter(Boolean).join(", ");
function mpDente(k, id){
  const st = mpStato(k), d = { ...mpObj(k) }, v = { ...(d[st.sel] || {}) }, s = new Set(v.s || []);
  s.has(id) ? s.delete(id) : s.add(id);
  // «mancante» ed «estratto oggi» escludono gli stati del dente presente
  if(s.has(id) && ["mancante", "estratto"].includes(id)) [...s].forEach(x => { if(!["mancante", "estratto", id].includes(x)) s.delete(x); });
  if(s.has(id) && !["mancante", "estratto"].includes(id)) s.delete("mancante");
  v.s = MP_DENTE.map(x => x[0]).filter(x => s.has(x));
  d[st.sel] = v; vsCambia(k, d); mpRidisegna(k);
}
function mpDenteVicino(k, dir){
  const st = mpStato(k), ord = Object.keys(MP_DENTI).sort(), i = ord.indexOf(st.sel);
  st.sel = ord[(i + dir + ord.length) % ord.length]; mpRidisegna(k);
}

/* ---------------- lingua per zone ---------------- */
const mpZonaPiena = v => !!(v && (v.colore || v.patina || v.patina_c || v.umidita || v.segni?.length || v.nota));
const mpZonaBreve = v => [v.colore, v.patina && v.patina !== "Assente" ? "patina " + v.patina.toLowerCase() : ""].filter(Boolean).join(", ").toLowerCase();
function mpTestoZona(v){
  if(!mpZonaPiena(v)) return "";
  const patina = v.patina === "Assente" ? "senza patina" : v.patina || v.patina_c ? ["patina", v.patina, v.patina_c].filter(Boolean).join(" ").toLowerCase() : "";
  const umid = v.umidita ? (v.umidita === "Normale" ? "umidità normale" : v.umidita.toLowerCase()) : "";
  return [v.colore?.toLowerCase(), patina, umid, ...(v.segni || []).map(x => x.toLowerCase()), v.nota].filter(Boolean).join(", ");
}
function mpInternoZone(k, sola){
  const st = mpStato(k), d = mpObj(k), z = st.sel && MP_LINGUA[st.sel] ? st.sel : null, v = z ? (d[z] || {}) : {}, info = MP_ZONE.find(x => x[0] === z);
  const gruppo = (campo, nome, opz) => campo === "patina_c" && (!v.patina || v.patina === "Assente") ? "" : `<div class="mp-gr"><span>${mpEsc(nome)}</span><div class="vs-chips">${opz.map(o => `<button type="button" class="vs-chip${v[campo] === o ? " on" : ""}" aria-pressed="${v[campo] === o}" onclick="mpZonaScegli(${mpJs(k)}, '${campo}', ${mpJs(o)})">${mpEsc(o)}</button>`).join("")}</div></div>`;
  const pan = z && !sola ? `<div class="mp-pan"><div class="mp-pan-t"><b>${mpEsc(info[1])}</b><small>${mpEsc(info[2])}</small></div>
      ${MP_LINGUA_SCELTE.map(([campo, nome, opz]) => gruppo(campo, nome, opz)).join("")}
      <div class="mp-gr"><span>Segni</span><div class="vs-chips">${MP_LINGUA_SEGNI.map(o => { const on = (v.segni || []).includes(o); return `<button type="button" class="vs-chip${on ? " on" : ""}" aria-pressed="${on}" onclick="mpZonaSegno(${mpJs(k)}, ${mpJs(o)})">${mpEsc(o)}</button>`; }).join("")}</div></div>
      <input class="mp-nota" maxlength="140" value="${mpEsc(v.nota || "")}" placeholder="Nota sulla zona" oninput="mpNotaOggetto(${mpJs(k)}, this.value)">
      <div class="mp-pan-az"><button type="button" class="urg" onclick="mpOggettoSvuota(${mpJs(k)})">Svuota</button><button type="button" onclick="mpChiudi(${mpJs(k)})">Fatto</button></div></div>` : "";
  const el = MP_ZONE.filter(([x]) => mpZonaPiena(d[x])).map(([x, n, org]) => `<button type="button" onclick="mpSelezionaZona(${mpJs(k)}, ${mpJs(x)})"><b>${mpEsc(n)} · ${mpEsc(org)}</b><span>${mpEsc(mpTestoZona(d[x]))}</span></button>`).join("");
  return `${sola ? "" : '<div class="mp-aiuto">Tocca una zona della lingua: colore, patina, umidità, segni. Punta in basso; destra del cavallo a sinistra di chi guarda.</div>'}
    <div class="mp-box${st.zoom ? " zoom" : ""}">${mpSvg(k)}</div>
    <div class="mp-barra"><button type="button" class="mp-lente" onclick="mpZoom(${mpJs(k)})">${st.zoom ? "Riduci" : "Ingrandisci"}</button></div>
    ${pan}${el ? `<div class="mp-el">${el}</div>` : ""}`;
}
function mpZonaAggiorna(k, fn){ const st = mpStato(k), d = { ...mpObj(k) }, v = { ...(d[st.sel] || {}) }; fn(v); d[st.sel] = v; vsCambia(k, d); }
function mpZonaScegli(k, campo, o){ mpZonaAggiorna(k, v => { v[campo] = v[campo] === o ? "" : o; if(campo === "patina" && v.patina === "Assente") v.patina_c = ""; }); mpRidisegna(k); }
function mpZonaSegno(k, o){ mpZonaAggiorna(k, v => { const s = new Set(v.segni || []); s.has(o) ? s.delete(o) : s.add(o); v.segni = MP_LINGUA_SEGNI.filter(x => s.has(x)); }); mpRidisegna(k); }
// comuni a denti e lingua
function mpNotaOggetto(k, t){ mpZonaAggiorna(k, v => { v.nota = String(t).slice(0, 140); }); }
function mpOggettoSvuota(k){ const st = mpStato(k), d = { ...mpObj(k) }; delete d[st.sel]; vsCambia(k, d); mpRidisegna(k); }
function mpSelezionaZona(k, z){ const st = mpStato(k); st.sel = st.sel === z ? null : z; mpRidisegna(k); }

/* ---------------- azioni ---------------- */
function mpRidisegna(k){
  const box = document.querySelector("#mp-" + CSS.escape(k) + " .mp-dentro"); if(!box) return;
  box.innerHTML = mpInterno(k, VS.visita?.stato === "conclusa");
  mpAttiva(k);
}
function mpSalva(k, l){ vsCambia(k, l); }
function mpVista(k, v){ const st = mpStato(k); st.vista = v; st.sel = null; mpRidisegna(k); }
function mpTipo(k, t){ mpStato(k).tipo = t; mpRidisegna(k); }
function mpZoom(k){ const st = mpStato(k); st.zoom = !st.zoom; mpRidisegna(k); }
function mpElencoNomi(k){ const st = mpStato(k); st.cerca = st.cerca === null ? "" : null; st.sel = null; st.cercaTesto = ""; mpRidisegna(k); }
function mpCerca(k, q){
  const st = mpStato(k); st.cercaTesto = q; mpRidisegna(k);
  const i = document.getElementById("mp-cerca-" + k); if(i){ i.focus(); i.setSelectionRange(q.length, q.length); }
}
function mpSeleziona(k, id){ const st = mpStato(k), p = mpVal(k).find(x => x.id === id); if(!p) return; st.vista = p.v; st.sel = id; st.cerca = ""; mpRidisegna(k); }
function mpChiudi(k){ const st = mpStato(k); st.sel = null; st.cercaTesto = ""; mpRidisegna(k); }
function mpAggiorna(k, id, campi){
  const l = mpVal(k).map(p => p.id === id ? { ...p, ...campi } : p);
  mpSalva(k, l); const p = l.find(x => x.id === id); if(mpCampo(k).modo === "punti") mpMemScrivi(p);
  return p;
}
// nome dato a un pallino appena messo
function mpNome(k, nome){
  const st = mpStato(k); nome = String(nome || "").trim().slice(0, 40); if(!nome) return;
  // stesso punto già segnato in questa vista: si sposta quello, non se ne fa un doppione
  const gia = mpVal(k).find(p => p.n === nome && p.v === st.vista && p.id !== st.sel);
  if(gia){ const nuovo = mpVal(k).find(p => p.id === st.sel); mpSalva(k, mpVal(k).filter(p => p.id !== st.sel)); mpAggiorna(k, gia.id, { x: nuovo.x, y: nuovo.y }); st.sel = gia.id; }
  else mpAggiorna(k, st.sel, { n: nome });
  st.cercaTesto = ""; mpRidisegna(k);
}
// nome scelto prima di toccare: si mette dove il veterinario l'aveva messo, altrimenti si aspetta il tocco
function mpNomePrima(k, nome){
  const st = mpStato(k); nome = String(nome || "").trim().slice(0, 40); if(!nome) return;
  st.cerca = ""; st.cercaTesto = "";
  const gia = mpVal(k).find(p => p.n === nome);
  if(gia){ st.vista = gia.v; st.sel = gia.id; return mpRidisegna(k); }
  const pos = mpPosizioneNota(k, nome);
  if(pos){ const p = { id: mpId(), v: pos.v, x: pos.x, y: pos.y, n: nome, g: null }; mpSalva(k, [...mpVal(k), p]); st.vista = pos.v; st.sel = p.id; showToast("Messo dove l'avevi segnato l'ultima volta: trascinalo se serve"); }
  else { st.attesaNome = nome; showToast("Tocca il disegno dove hai trovato " + nome); }
  mpRidisegna(k);
}
function mpRinomina(k){ const st = mpStato(k); mpAggiorna(k, st.sel, { n: "" }); mpRidisegna(k); }
function mpGrado(k, g){ const st = mpStato(k); const p = mpVal(k).find(x => x.id === st.sel); mpAggiorna(k, st.sel, { g: p && p.g === g ? null : g }); mpRidisegna(k); }
function mpTogli(k){ const st = mpStato(k); mpSalva(k, mpVal(k).filter(p => p.id !== st.sel)); st.sel = null; mpRidisegna(k); }
function mpCambiaTipo(k, t){ const st = mpStato(k); mpAggiorna(k, st.sel, { tipo: t }); st.tipo = t; mpRidisegna(k); }
function mpNota(k, v){ const st = mpStato(k); mpAggiorna(k, st.sel, { nota: String(v).slice(0, 140) }); }
function mpFoto(){ if(typeof vaScegli === "function"){ vaScegli("foto"); setTimeout(() => document.getElementById("va-box")?.scrollIntoView({ block: "start", behavior: "smooth" }), 400); } }
// tocco sul disegno: nuovo pallino o segno
function mpNuovo(k, x, y){
  const st = mpStato(k), c = mpCampo(k), l = mpVal(k);
  if(c.modo === "punti"){
    const p = { id: mpId(), v: st.vista, x, y, n: st.attesaNome || "", g: null };
    st.attesaNome = null; st.cerca = ""; mpSalva(k, [...l, p]); st.sel = p.id;
    if(p.n) mpMemScrivi(p);
  } else {
    const p = { id: mpId(), v: st.vista, x, y, tipo: st.tipo, num: l.reduce((m, q) => Math.max(m, q.num || 0), 0) + 1, nota: "" };
    const z = mpZonaArto(c, st.vista, y); if(z) p.z = z;
    mpSalva(k, [...l, p]); st.sel = p.id;
  }
  mpRidisegna(k);
}

/* ---------------- tocco e trascinamento ---------------- */
function mpAttiva(k){
  const box = document.getElementById("mp-" + k), svg = box?.querySelector(".mp-svg"); if(!svg || VS.visita?.stato === "conclusa") return;
  const vb = svg.viewBox.baseVal, c = mpCampo(k);
  const pos = ev => { const pt = svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY; const m = svg.getScreenCTM(); const q = m ? pt.matrixTransform(m.inverse()) : { x: 0, y: 0 };
    return { x: Math.max(0, Math.min(1, (q.x - vb.x) / vb.width)), y: Math.max(0, Math.min(1, (q.y - vb.y) / vb.height)), sx: q.x, sy: q.y }; };
  if(mpOggetto(c)){
    // denti e lingua: si tocca un dente o una zona (o il più vicino, per i denti piccoli)
    let t0 = null;
    svg.addEventListener("pointerdown", ev => { t0 = { x: ev.clientX, y: ev.clientY }; });
    svg.addEventListener("pointerup", ev => {
      if(!t0 || Math.hypot(ev.clientX - t0.x, ev.clientY - t0.y) > 10){ t0 = null; return; }
      t0 = null;
      let z = ev.target.closest?.("[data-z]")?.dataset.z;
      if(!z && c.modo === "denti"){ const p = pos(ev); let best = null, dmin = 60;
        Object.entries(MP_DENTI).forEach(([n, t]) => { const d = Math.hypot(t.x - p.sx, t.y - p.sy); if(d < dmin){ dmin = d; best = n; } }); z = best; }
      if(z){ mpStato(k).sel = z; mpRidisegna(k); }
    });
    return;
  }
  let tr = null;
  svg.addEventListener("pointerdown", ev => {
    const g = ev.target.closest(".mp-m");
    tr = { id: g ? g.dataset.id : null, g, x0: ev.clientX, y0: ev.clientY, mosso: false };
    if(g){ try{ svg.setPointerCapture(ev.pointerId); }catch(_){} ev.preventDefault(); }
  });
  svg.addEventListener("pointermove", ev => {
    if(!tr || !tr.g) return;
    if(Math.hypot(ev.clientX - tr.x0, ev.clientY - tr.y0) > 6) tr.mosso = true;
    if(tr.mosso){ const p = pos(ev); tr.g.setAttribute("transform", `translate(${p.sx.toFixed(1)},${p.sy.toFixed(1)})`); ev.preventDefault(); }
  });
  svg.addEventListener("pointerup", ev => {
    const t = tr; tr = null; if(!t) return;
    const p = pos(ev);
    if(t.id && t.mosso){ const campi = { x: p.x, y: p.y }; if(mpDisegno(c) === "arto") campi.z = mpZonaArto(c, mpStato(k).vista, p.y) || undefined;
      mpAggiorna(k, t.id, campi); mpStato(k).sel = t.id; return mpRidisegna(k); }
    if(t.id) return mpSeleziona(k, t.id);
    if(Math.hypot(ev.clientX - t.x0, ev.clientY - t.y0) > 10) return;   // era uno scorrimento della pagina
    const st = mpStato(k);
    if(st.sel){ const s = mpVal(k).find(x => x.id === st.sel); if(s && c.modo === "punti" && !s.n){ mpSalva(k, mpVal(k).filter(x => x.id !== st.sel)); } st.sel = null; }
    mpNuovo(k, p.x, p.y);
  });
}
// dopo ogni disegno della scheda si attivano tutte le mappe visibili
function mpAttivaTutte(){ document.querySelectorAll("#vs-corpo .mp").forEach(b => mpAttiva(b.id.slice(3))); }
function mpReset(){ Object.keys(MP).forEach(k => delete MP[k]); }

/* ---------------- testo per il referto e per Galeno ---------------- */
function mpTesto(c, v){
  if(c.modo === "denti"){
    const d = v && typeof v === "object" && !Array.isArray(v) ? v : {};
    const r = Object.keys(d).filter(n => MP_DENTI[n] && (d[n].s?.length || d[n].nota)).sort().map(n => n + " " + mpTestoDente(d[n]));
    return r.length ? r.join("; ") : null;
  }
  if(c.modo === "zone"){
    const d = v && typeof v === "object" && !Array.isArray(v) ? v : {};
    const r = MP_ZONE.filter(([z]) => mpZonaPiena(d[z])).map(([z, n, org]) => `${n} (${org.replace(" / ", "/")}): ${mpTestoZona(d[z])}`);
    return r.length ? r.join("; ") : null;
  }
  const l = Array.isArray(v) ? v : []; if(!l.length) return null;
  if(c.modo === "punti"){
    const r = l.filter(p => p.n && p.g != null).sort((a, b) => b.g - a.g || a.n.localeCompare(b.n));
    return r.length ? r.map(p => `${p.n} ${p.g}/3 (${mpTestoVista(c, p.v)})`).join(", ") : null;
  }
  return l.slice().sort((a, b) => a.num - b.num).map(p => `${p.num}. ${mpTipo1(c, p.tipo)[1]}${p.nota ? ": " + p.nota : ""} (${mpTestoVista(c, p.v)}${p.z ? ", zona " + p.z : ""})`).join("; ");
}

/* ---------------- disegni per il PDF del referto ---------------- */
// [{ titolo, url (JPEG), w, h }] per ogni mappa compilata: una vista per ogni vista con segni; denti e lingua un disegno solo
function mpSvgInImmagine(svg, w, h){
  return new Promise(res => {
    try{
      const img = new Image(), url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
      img.onload = () => { try{ const s = Math.min(1.6, 1500 / Math.max(w, h)), cv = document.createElement("canvas"); cv.width = Math.round(w * s); cv.height = Math.round(h * s);
        const x = cv.getContext("2d"); x.fillStyle = "#FFFFFF"; x.fillRect(0, 0, cv.width, cv.height); x.drawImage(img, 0, 0, cv.width, cv.height);
        res(cv.toDataURL("image/jpeg", 0.88)); }catch(_){ res(null); } URL.revokeObjectURL(url); };
      img.onerror = () => { URL.revokeObjectURL(url); res(null); };
      img.src = url;
    }catch(_){ res(null); }
  });
}
async function mpImmaginiPdf(){
  const d = VS.visita?.dati || {}, out = [];
  for(const c of (VS.campi || []).filter(x => x.t === "mappa")){
    const v = d[c.k];
    if(mpTesto(c, v) == null && !(Array.isArray(v) && v.length)) continue;
    const viste = mpOggetto(c) ? [mpSet(c).viste[0][0]] : mpSet(c).viste.map(x => x[0]).filter(vi => v.some(p => p.v === vi));
    for(const vi of viste){
      const g = mpGeo(c, vi), url = await mpSvgInImmagine(mpDisegnoSvg(c, v, vi, { pdf: true, uid: "pdf" + c.k + vi }), g.cw, g.ch);
      if(url) out.push({ titolo: c.e + (mpSet(c).viste.length > 1 ? " · " + mpNomeVista(c, vi) : ""), url, w: g.cw, h: g.ch, grande: mpOggetto(c) });
    }
  }
  return out;
}

export { mpCampoHtml, mpInterno, mpRidisegna, mpAttiva, mpAttivaTutte, mpReset, mpTesto, mpVista, mpTipo, mpZoom, mpElencoNomi, mpCerca, mpSeleziona, mpChiudi,
  mpNome, mpNomePrima, mpRinomina, mpGrado, mpTogli, mpCambiaTipo, mpNota, mpFoto, mpNuovo, mpDente, mpDenteVicino, mpZonaScegli, mpZonaSegno, mpNotaOggetto,
  mpOggettoSvuota, mpSelezionaZona, mpImmaginiPdf, mpDisegnoSvg, mpNomeDente, MP, MP_PUNTI, MP_DENTI, MP_SET };
