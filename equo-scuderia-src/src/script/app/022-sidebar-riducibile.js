/* ---------- SIDEBAR RIDUCIBILE ---------- */
function applySavedSidebarState(){
  let collapsed = false;
  try{ collapsed = localStorage.getItem("equo-scuderia-sidebar-collapsed") === "1"; }catch(e){}
  setSidebarCollapsed(collapsed);
}
function toggleSidebarCollapse(){
  const isCollapsed = document.getElementById("sidebar").classList.contains("collapsed");
  setSidebarCollapsed(!isCollapsed);
}
function setSidebarCollapsed(collapsed){
  document.getElementById("sidebar").classList.toggle("collapsed", collapsed);
  document.getElementById("app-shell").classList.toggle("collapsed", collapsed);
  const icon = document.getElementById("sidebar-toggle-icon");
  if(icon) icon.className = collapsed ? "fa-solid fa-chevron-right" : "fa-solid fa-chevron-left";
  try{ localStorage.setItem("equo-scuderia-sidebar-collapsed", collapsed ? "1" : "0"); }catch(e){}
}

function renderPlaceholderModules(){
  Object.keys(ACTIVE_PLACEHOLDER_COPY).forEach(key => {
    const c = ACTIVE_PLACEHOLDER_COPY[key];
    document.getElementById("module-" + key).innerHTML = comingSoonHtml(c.icon, c.titolo, c.testo, "IN SVILUPPO");
  });
  Object.keys(COMING_SOON_COPY).forEach(key => {
    const c = COMING_SOON_COPY[key];
    document.getElementById("module-" + key).innerHTML = comingSoonHtml(c.icon, c.titolo, c.testo, "PRESTO DISPONIBILE");
  });
}


/* =====================================================================
   MAGAZZINO (Equo Scuderia)
   - la giacenza si calcola SEMPRE dai movimenti (carico / scarico / rettifica): storico completo
   - semaforo per articolo, sottocategoria, categoria e voce di menu:
       rosso  = esaurito, sotto la soglia minima, lotto scaduto, da sostituire
       giallo = vicino alla soglia (≤150%), meno di 7 giorni di scorta, lotto in scadenza entro 30 gg, da lavare/riparare
       verde  = in ordine
   - tabelle Supabase: mag_articoli, mag_movimenti, mag_ubicazioni, mag_fornitori, mag_ordini (RLS per centro)
   - permessi: tutto lo staff vede e registra movimenti; admin e livello 2-3 gestiscono articoli, depositi, fornitori, ordini
   ===================================================================== */
const MAG_CATEGORIE = {
  alimentazione: { nome:"Alimentazione", icon:"fa-wheat-awn", colore:"#b7862b", unita:"kg",
    sub:["Fieno","Mangimi","Cereali e fioccati","Mash e crusca","Snack e carote","Sali e minerali"] },
  lettiera: { nome:"Lettiera", icon:"fa-layer-group", colore:"#9a7b4f", unita:"balle",
    sub:["Paglia","Truciolo","Pellet di legno","Altro"] },
  integratori: { nome:"Integratori", icon:"fa-capsules", colore:"#5d8f4e", unita:"conf",
    sub:["Articolazioni","Vitamine e minerali","Elettroliti","Zoccoli e pelo","Digestione","Altro"] },
  farmaci: { nome:"Farmaci e veterinaria", icon:"fa-kit-medical", colore:"#c0473d", unita:"conf",
    sub:["Vermifughi","Farmaci su prescrizione","Disinfettanti e medicazioni","Pomate e unguenti","Bende e fasce","Altro"] },
  mascalcia: { nome:"Mascalcia", icon:"svg:horseshoe", colore:"#5f6b73", unita:"pz",
    sub:["Ferri","Chiodi","Solette e silicone","Attrezzi","Altro"] },
  coperte: { nome:"Coperte e protezioni", icon:"fa-shirt", colore:"#3b6ea5", unita:"pz", durevole:true,
    sub:["Coperte da box","Coperte impermeabili","Sottocoperte","Maschere antimosche","Paraglomi e stinchiere"] },
  selleria: { nome:"Selleria e finimenti", icon:"fa-horse", colore:"#7a4e2d", unita:"pz", durevole:true,
    sub:["Selle","Sottosella","Briglie e testiere","Imboccature","Redini e martingale","Altro"] },
  pulizia: { nome:"Cura e pulizia", icon:"fa-pump-soap", colore:"#2e8f8a", unita:"pz",
    sub:["Spazzole e strigliatoi","Shampoo e prodotti","Grasso e olio per zoccoli","Cura del cuoio","Altro"] },
  attrezzatura: { nome:"Attrezzatura e scuderia", icon:"fa-toolbox", colore:"#6c5a8e", unita:"pz", durevole:true,
    sub:["Secchi e mangiatoie","Carriole e forche","Ostacoli e campo","Manutenzione","Altro"] },
  personale: { nome:"Abbigliamento del personale", icon:"fa-user-tie", colore:"#2f5d8a", unita:"pz", durevole:true,
    sub:["Polo e magliette","Giacche e gilet","Stivali e scarpe","Caschi","Guanti","Altro"] },
  ufficio: { nome:"Ufficio e segreteria", icon:"fa-print", colore:"#5f7080", unita:"pz",
    sub:["Carta","Toner e cartucce","Registri e moduli","Cancelleria","Altro"] },
  pulizia_struttura: { nome:"Pulizia scuderia", icon:"fa-broom", colore:"#3a9a7a", unita:"pz",
    sub:["Detersivi","Sacchi","Disinfettanti per ambienti","Carta e monouso","Altro"] },
};
// categorie di base + categorie create dal centro (tabella mag_categorie). Le nascoste restano per gli articoli
// già presenti ma non compaiono tra le schede né nei nuovi articoli.
function magCats(){
  const o = { ...MAG_CATEGORIE };
  (mag.categorie || []).forEach(k => { o[k.chiave] = { nome: k.nome, icon: k.icona, colore: k.colore, unita: k.unita, durevole: k.durevole,
    sub: k.sottocategorie || [], custom: k, nascosta: k.nascosta }; });
  return o;
}
const MAG_ICONE_CAT = ["fa-box","fa-shirt","fa-user-tie","fa-helmet-safety","fa-socks","fa-mitten","fa-print","fa-folder-open","fa-broom","fa-spray-can-sparkles",
  "fa-bucket","fa-trash-can","fa-screwdriver-wrench","fa-hammer","fa-bolt","fa-lightbulb","fa-gas-pump","fa-tractor","fa-seedling","fa-mug-hot",
  "fa-kit-medical","fa-fire-extinguisher","fa-gift","fa-trophy","fa-camera","fa-laptop"];
const MAG_COLORI_CAT = ["#b7862b","#c0473d","#2f5d8a","#3a9a7a","#6c5a8e","#7a4e2d","#5f7080","#d0662f","#2e8f8a","#8a3f6b"];
const MAG_UNITA = ["pz","kg","balle","sacchi","conf","litri","paia","rotoli","flaconi","siringhe","scatole"];
// "sacco da 25 kg" → { n: 25, u: "kg" }: serve a mostrare l'equivalente (15 sacchi = 375 kg)
function magContenuto(formato){
  const m = String(formato || "").toLowerCase().match(/(\d+(?:[.,]\d+)?)\s*(kg|g|l|lt|litri|ml)\b/);
  if(!m) return null;
  const n = Number(m[1].replace(",", ".")); if(!n) return null;
  const u = m[2] === "lt" || m[2] === "litri" ? "l" : m[2];
  return { n, u };
}
function magEquivalente(q, a){
  const c = magContenuto(a.formato);
  if(!c || ["kg","litri","l"].includes(a.unita) || !(q > 0)) return "";
  let tot = q * c.n, u = c.u;
  if(u === "g" && tot >= 1000){ tot /= 1000; u = "kg"; }
  if(u === "ml" && tot >= 1000){ tot /= 1000; u = "l"; }
  return `= ${magFmt(tot, 1)} ${u}`;
}
// unità suggerita dal formato ("sacco da 25 kg" → sacchi)
const MAG_UNITA_DA_FORMATO = [[/sacc/, "sacchi"], [/ball/, "balle"], [/scatol/, "scatole"], [/rotol/, "rotoli"], [/flacon/, "flaconi"],
  [/siring/, "siringhe"], [/\bpai[ao]\b/, "paia"], [/confez|\bconf\b|barattol|secchio|vasett|tubett|blister/, "conf"], [/tanic|bidon|fust/, "pz"]];
const MAG_SINGOLARE = { pz:"pezzo", kg:"kg", balle:"balla", sacchi:"sacco", conf:"confezione", litri:"litro", paia:"paio", rotoli:"rotolo", flaconi:"flacone", siringhe:"siringa", scatole:"scatola" };
let magArtUnitaScelta = false;
function magArtFormatoCambiato(){
  if(!magArtUnitaScelta){
    const f = document.getElementById("mag-art-formato").value.toLowerCase();
    const hit = MAG_UNITA_DA_FORMATO.find(([re]) => re.test(f));
    if(hit) document.getElementById("mag-art-unita").value = hit[1];
  }
  magArtAggiornaUnita();
}
function magArtAggiornaUnita(){
  const u = document.getElementById("mag-art-unita").value || "pz";
  document.querySelectorAll("#modal-mag-articolo .u-lbl").forEach(el => el.textContent = (el.dataset.pre === "per " ? "per " + (MAG_SINGOLARE[u] || u) : "in " + u));
  const c = magContenuto(document.getElementById("mag-art-formato").value);
  const conv = c && !["kg","litri"].includes(u) ? ` · 1 ${MAG_SINGOLARE[u] || u} = ${magFmt(c.n, 2)} ${c.u}, e ti mostro anche l'equivalente (es. 15 ${u} = ${magFmt(15 * c.n, 1)} ${c.u})` : "";
  document.getElementById("mag-art-unita-hint").innerHTML = `<i class="fa-solid fa-circle-info"></i> Quantità, soglia, scorta e costo si contano in <b>${escapeHtml(u)}</b>${conv}.`;
}
const MAG_COND = { ok:"In ordine", da_lavare:"Da lavare", da_riparare:"Da riparare", da_sostituire:"Da sostituire" };
const MAG_TIPI_MOV = { carico:"Carico", scarico:"Scarico", rettifica:"Inventario", trasferimento:"Spostamento" };

let mag = { articoli:[], movimenti:[], ubicazioni:[], fornitori:[], ordini:[], categorie:[], calc:{}, caricato:false };
let magUI = { cat:"tutte", sub:"", layout:"griglia", vista:"giacenze" };
try{ magUI.layout = localStorage.getItem("equo-mag-layout") || "griglia"; }catch(e){}

function magPuoGestire(){
  if(!currentMembro) return false;
  return currentMembro.ruolo === "admin" || ["admin","2","3"].includes(String(currentMembro.livello || ""));
}
const magFmt = (n, dec = 2) => (Math.round(Number(n || 0) * 10 ** dec) / 10 ** dec).toLocaleString("it-IT", { maximumFractionDigits: dec });
const magEuro = (n) => "€ " + Number(n || 0).toLocaleString("it-IT", { minimumFractionDigits: 0, maximumFractionDigits: n >= 100 ? 0 : 2 });
const magDataIt = (iso) => iso ? new Date(String(iso).slice(0, 10) + "T12:00:00").toLocaleDateString("it-IT", { day:"numeric", month:"short", year:"numeric" }) : "—";
const magGiorniA = (iso) => Math.round((new Date(String(iso).slice(0,10) + "T12:00:00") - new Date(oggiLocaleIso() + "T12:00:00")) / 86400000);
const magIcona = (cat, size) => {
  const c = magCats()[cat] || MAG_CATEGORIE.attrezzatura;
  return `<span class="ic" style="background:${c.colore}${size ? ";width:" + size + "px;height:" + size + "px" : ""}">${iconHtml(c.icon)}</span>`;
};
const magUbiNome = (id) => {
  const u = mag.ubicazioni.find(x => x.id === id); if(!u) return null;
  const p = u.parent_id ? mag.ubicazioni.find(x => x.id === u.parent_id) : null;
  const pp = p && p.parent_id ? mag.ubicazioni.find(x => x.id === p.parent_id) : null;
  return [pp?.nome, p?.nome, u.nome].filter(Boolean).join(" › ");
};

