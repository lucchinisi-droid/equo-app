/* ---------- EQUO OFFLINE (passaggio B, Scuderia livello 1): ultimi dati visti in sola lettura ----------
   Ogni lettura riuscita dal database viene copiata sul dispositivo (IndexedDB, per utente).
   Senza rete le letture rispondono con l'ultima copia; i salvataggi rispondono "Sei offline" senza perdere la pagina. */
const COPIA_LETTURE_RPC = /\/rest\/v1\/rpc\/(centro_piano|statistiche_centro|groom_elenco|has_equo_app_profile|scuderia_appuntamenti_professionista|scuderia_chat_professionista|scuderia_lista_professionisti|cavalli_da_importare)(\?|$)/;
let copiaDb = null;
function copiaApri(){
  if(copiaDb) return copiaDb;
  copiaDb = new Promise((ok) => {
    try{
      const r = indexedDB.open("equo-scuderia-copia", 1);
      r.onupgradeneeded = () => r.result.createObjectStore("letture");
      r.onsuccess = () => ok(r.result);
      r.onerror = () => ok(null);
    } catch(e){ ok(null); }
  });
  return copiaDb;
}
async function copiaLeggi(k){ const db = await copiaApri(); if(!db) return null; return new Promise((ok) => { try{ const q = db.transaction("letture").objectStore("letture").get(k); q.onsuccess = () => ok(q.result || null); q.onerror = () => ok(null); } catch(e){ ok(null); } }); }
async function copiaScrivi(k, v){ const db = await copiaApri(); if(!db) return; try{ db.transaction("letture", "readwrite").objectStore("letture").put(v, k); } catch(e){} }
async function copiaSvuota(){ const db = await copiaApri(); if(!db) return; try{ db.transaction("letture", "readwrite").objectStore("letture").clear(); } catch(e){} }
function copiaUtente(h){
  try{ const tok = String(h.get("Authorization") || "").replace(/^Bearer\s+/i, ""); return JSON.parse(atob(tok.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))).sub || "anon"; } catch(e){ return "anon"; }
}
function copiaRisposta(stato, corpo){ return new Response(JSON.stringify(corpo), { status: stato, headers: { "Content-Type": "application/json" } }); }
async function fetchConCopia(input, init = {}){
  const url = typeof input === "string" ? input : input.url;
  const metodo = (init.method || (typeof input === "string" ? "GET" : input.method) || "GET").toUpperCase();
  const rest = url.includes("/rest/v1/"), storage = url.includes("/storage/v1/");
  if(!rest && !storage) return fetch(input, init);
  const lettura = rest && (metodo === "GET" || metodo === "HEAD" || (metodo === "POST" && COPIA_LETTURE_RPC.test(url)));
  const h = new Headers(init.headers || (typeof input === "string" ? {} : input.headers));
  const chiave = lettura ? [copiaUtente(h), metodo, url, metodo === "POST" ? String(init.body || "") : "", h.get("Prefer") || "", h.get("Accept") || "", h.get("Range") || ""].join("|") : null;
  try{
    const res = await fetch(input, init);
    if(lettura && res.ok){
      res.clone().text().then((corpo) => copiaScrivi(chiave, { t: Date.now(), stato: res.status, corpo, cr: res.headers.get("content-range"), ct: res.headers.get("content-type") })).catch(() => {});
    }
    return res;
  } catch(err){
    if(lettura){
      const c = await copiaLeggi(chiave);
      if(c){ const hh = { "Content-Type": c.ct || "application/json", "X-Equo-Copia": String(c.t) }; if(c.cr) hh["Content-Range"] = c.cr; return new Response(metodo === "HEAD" ? null : c.corpo, { status: c.stato, headers: hh }); }
      return copiaRisposta(503, { message: "Sei offline e questi dati non sono ancora stati salvati sul dispositivo.", code: "OFFLINE" });
    }
    return copiaRisposta(503, { message: "Sei offline: per salvare serve la connessione. Riprova appena torna la rete.", error: "Sei offline", code: "OFFLINE" });
  }
}
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { fetch: fetchConCopia } });

const RUOLO_LABELS = { admin:"Amministratore", istruttore:"Istruttore", veterinario:"Veterinario", maniscalco:"Maniscalco", allievo:"Allievo/Genitore", collaboratore:"Collaboratore", proprietario:"Proprietario", segretario:"Segretario", giardiniere:"Giardiniere", altro:"Altro" };
const LIVELLO_LABELS = { "1":"Livello 1", "2":"Livello 2", "3":"Livello 3", admin:"Admin" };
const PERMESSI_FLAGS = ["cavalli","eventi","lezioni","pacchetti","messaggi","contatti","fiscali"];
const CONTATTO_TIPO_LABELS = {
  istruttore_esterno:"Istruttore esterno", veterinario:"Veterinario", maniscalco:"Maniscalco",
  commercialista:"Commercialista", giardiniere:"Giardiniere / Manutenzione verde", manutenzione:"Manutenzione centro ippico",
  fornitore:"Fornitore", altro:"Altro",
};
const COMING_SOON_COPY = {
  store: { icon:"fa-store", titolo:"Store", testo:"Vendi ai tuoi clienti prodotti e servizi del centro (lezioni, pacchetti, attrezzatura, mangimi) con pagamento online." },
  fatturazione: { icon:"fa-file-invoice", titolo:"Fatturazione elettronica SDI", testo:"Genera e invia fatture elettroniche conformi SDI direttamente dagli abbonamenti e dalle lezioni registrate nel gestionale." },
};
const ACTIVE_PLACEHOLDER_COPY = {};

const TIPO_LABELS = { vaccino:"Vaccino", coggins:"Coggins test", ferratura:"Ferratura", sverminazione:"Sverminazione", altro:"Altro" };
const TIPO_ICONS = { vaccino:"fa-syringe", coggins:"fa-vial", ferratura:"svg:horseshoe", sverminazione:"fa-pills", altro:"fa-ellipsis" };
const TIPO_PROPRIETA_LABELS = { proprieta:"Proprietà del centro ippico", pensione:"Pensione privata", soci:"Soci/istruttori" };
const TIPO_ORDER = ["vaccino","coggins","ferratura","sverminazione"];

/* Icone custom (non presenti nel set gratuito di Font Awesome) */
const CUSTOM_ICONS = {
  owl: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-0.14em"><path d="M6.5 3.5 9 6.8h6l2.5-3.3v6.8c1.6 1.4 2.3 3.2 2.3 5.1 0 3.6-3.4 6.1-7.8 6.1s-7.8-2.5-7.8-6.1c0-1.9.7-3.7 2.3-5.1Z"/><circle cx="9.4" cy="10.2" r="2.1"/><circle cx="14.6" cy="10.2" r="2.1"/><circle cx="9.4" cy="10.2" r=".75" fill="currentColor" stroke="none"/><circle cx="14.6" cy="10.2" r=".75" fill="currentColor" stroke="none"/><path d="M11.2 12.6 12 14l.8-1.4Z" fill="currentColor"/><path d="M7.6 14.6c.9 1.5 1 3.4.4 5M16.4 14.6c-.9 1.5-1 3.4-.4 5"/><path d="M11 16.6h.01M13 16.6h.01M12 18.2h.01"/></svg>',
  horseshoe: '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" style="vertical-align:-0.14em"><path d="M6 20 L6 12 A6 6 0 0 1 18 12 L18 20"/><circle cx="6" cy="20.3" r="1.15" fill="currentColor" stroke="none"/><circle cx="18" cy="20.3" r="1.15" fill="currentColor" stroke="none"/></svg>',
};
function iconHtml(icon, extraStyle){
  const style = extraStyle ? ` style="${extraStyle}"` : "";
  if(icon && icon.startsWith("svg:")) return CUSTOM_ICONS[icon.slice(4)] || "";
  return `<i class="fa-solid ${icon}"${style}></i>`;
}

let DEMO_MODE = false;

