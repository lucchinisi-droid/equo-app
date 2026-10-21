
/* ══════════════════════════════════════════════════════
   EQUO APP — v1 skeleton
   Sostituisci SUPABASE_URL / SUPABASE_ANON_KEY con i valori reali.
   Schema Supabase atteso (da creare):
   - profiles(id, email, full_name, ruolo, ruolo_secondario, piano, referral_code, avatar_url, codice_professionista, codice_proprietario, dati_pagamento_tipo, dati_pagamento_nome, dati_pagamento_piva_cf, dati_pagamento_iban, dati_pagamento_paypal, consenso_termini_privacy, dichiarazione_eta, cancellazione_richiesta_at)
   -- consenso_termini_privacy: timestamptz, valorizzato la prima volta che l'utente completa l'onboarding
   --   (accetta Termini+Privacy e dichiara l'età) — non richiesto di nuovo ai login successivi.
   -- dichiarazione_eta: boolean, true = "ho almeno 14 anni o l'autorizzazione di un genitore/tutore".
   -- cancellazione_richiesta_at: timestamptz, valorizzato quando l'utente chiede la cancellazione
   --   account dal menu. Periodo di grazia 30gg (coerente con l'Informativa Privacy): entro quella
   --   data l'utente può annullare rientrando; la cancellazione DEFINITIVA dei dati dopo i 30gg non è
   --   automatica (nessun cron server-side collegato) — va fatta a mano da chi gestisce Equo finché
   --   non si aggiunge una Supabase Edge Function schedulata.
   - storage bucket pubblico "avatar-utenti" (foto profilo)
   - horses(id, owner_id, name, tipo_proprieta, breed, mantello, birth_date, microchip, gruppo_sanguigno, note, stable_id)
   - health_events(id, horse_id, type, date, next_due_date, notes)
   - expenses(id, horse_id, owner_id, category, amount, date, notes)
   - lezioni_manuali(id, owner_id, horse_id, data, tipo, note, created_at)
   - stables(id, name, join_code)
   - conversazioni_proprietari(id, proprietario_a_id, proprietario_b_id, created_at)
   - messaggi_proprietari(id, conversazione_id, mittente_id, tipo, testo, media_url, letto, created_at)
   - storage bucket pubblico "proprietari-chat-media" (foto/video/note vocali della chat tra proprietari)
   - clienti_mascalcia(id, maniscalco_id, nome, nome_cavallo, telefono, note, cliente_user_id, codice_invito, tipo_cliente[proprietario|struttura], created_at)
   - interventi_mascalcia(id, maniscalco_id, cliente_mascalcia_id, cavallo_cliente_id, horse_id, tipo_ferratura, tipo_altro, misura_sistema, numero_ferro, quantita_ferri, data_intervento, ora, stato[programmato|fatto], prossima_scadenza, importo, stato_pagamento, note, created_at, updated_at)
   - cavalli_clienti_mascalcia(id, maniscalco_id, cliente_mascalcia_id, nome, microchip, horse_id, created_at)
   - horses.condiviso_ecosistema (bool) + RPC cavalli_condivisi_cliente(p_cliente_id)
   - messaggi_mascalcia(id, maniscalco_id, cliente_mascalcia_id, mittente_tipo, tipo[testo|audio|documento], testo, audio_url, file_url, file_nome, letto, created_at)
   - storage bucket pubblico "mascalcia-documenti" (PDF appuntamenti, path <uid>/<cliente>/<uuid>.pdf)
   - storage bucket pubblico "mascalcia-note-vocali" (note vocali)
   ══════════════════════════════════════════════════════ */

const SUPABASE_URL = "https://ncbdrhbpgdcaentoxlfz.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Qf-UTipNPe4Z8g6VpmW8Ag_8zCbNnBC";
/* =====================================================================
   EQUO OFFLINE — App livello 2 (passaggio C)
   1) Copia delle letture: ogni lettura riuscita dal database viene salvata sul telefono (IndexedDB, per utente);
      senza rete l'app mostra l'ultima copia.
   2) Coda delle modifiche principali: messaggi (3 chat), appuntamenti e interventi del maniscalco, nuovi cavalli
      dei clienti, spese, eventi sanitari, calendario lezioni. Senza rete la modifica va in coda (con un id creato
      sul telefono, così un reinvio non crea doppioni), l'app la mostra subito e parte da sola al ritorno della rete.
   Tutto il resto (pagamenti, collegamenti con codice, assistenti AI, foto/video/vocali) richiede la connessione.
   ===================================================================== */
const OFF_TABELLE_CODA = ["messaggi_proprietari", "chat_messaggi", "messaggi_mascalcia", "interventi_mascalcia", "cavalli_clienti_mascalcia", "expenses", "health_events", "lezioni_manuali", "richiami_stato"];
const OFF_TABELLE_SCARTA = ["app_sessioni", "app_eventi"]; // statistiche d'uso interne: senza rete si saltano
const OFF_RPC_LETTURA = /\/rest\/v1\/rpc\/(appuntamenti_maniscalco_cliente|cavalli_condivisi_cliente|cavalli_maniscalco_da_abbinare|get_nomi_conversazioni_proprietario|lista_colleghi|lista_maniscalchi_collegati|mie_lezioni_scuderia|mie_scuderie_collegate|miei_eventi_scuderia|pro_cavalli_struttura|richiami_maniscalco)(\?|$)/;
const OFF_RPC_CODA = { invia_messaggio_mascalcia_cliente: { ok: true }, segna_letti_mascalcia_cliente: null, segna_letti_chat: null, segna_messaggi_consegnati: null };

let offDb = null;
function offApri(){
  if(offDb) return offDb;
  offDb = new Promise((ok) => {
    try{
      const r = indexedDB.open("equo-app-offline", 1);
      r.onupgradeneeded = () => { r.result.createObjectStore("letture"); r.result.createObjectStore("coda", { keyPath: "n", autoIncrement: true }); };
      r.onsuccess = () => ok(r.result); r.onerror = () => ok(null);
    } catch(e){ ok(null); }
  });
  return offDb;
}
async function offOp(store, modo, fn){
  const db = await offApri(); if(!db) return null;
  return new Promise((ok) => { try{ const tx = db.transaction(store, modo); const q = fn(tx.objectStore(store)); tx.oncomplete = () => ok(q ? q.result : null); tx.onerror = () => ok(null); } catch(e){ ok(null); } });
}
const offLeggi = (k) => offOp("letture", "readonly", (s) => s.get(k));
const offScrivi = (k, v) => offOp("letture", "readwrite", (s) => s.put(v, k));
const offCodaTutta = () => offOp("coda", "readonly", (s) => s.getAll()).then((x) => x || []);
const offCodaAggiungi = (v) => offOp("coda", "readwrite", (s) => s.add(v));
const offCodaTogli = (n) => offOp("coda", "readwrite", (s) => s.delete(n));
// all'uscita si cancella la copia dei dati; la coda resta (è divisa per utente e parte al suo prossimo accesso)
async function offSvuotaLetture(){ await offOp("letture", "readwrite", (s) => s.clear()); }

function offUtente(h){
  try{ const tok = String(h.get("Authorization") || "").replace(/^Bearer\s+/i, ""); return JSON.parse(atob(tok.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))).sub || "anon"; } catch(e){ return "anon"; }
}
const offJson = (stato, corpo, extra = {}) => new Response(corpo === undefined ? null : JSON.stringify(corpo), { status: stato, headers: { "Content-Type": "application/json", ...extra } });
const offUuid = () => (crypto.randomUUID ? crypto.randomUUID() : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => { const r = Math.random() * 16 | 0; return (c === "x" ? r : (r & 3 | 8)).toString(16); }));
function offTabella(url){ const m = url.match(/\/rest\/v1\/([a-z_]+)(\?|$)/); return m ? m[1] : null; }
function offRpc(url){ const m = url.match(/\/rest\/v1\/rpc\/([a-z_]+)/); return m ? m[1] : null; }

// righe in coda della stessa tabella che rispettano i filtri "uguale a" della lettura (es. chat di un cliente)
async function offRigheInCoda(url, utente){
  const tab = offTabella(url); if(!tab) return [];
  const p = new URL(url).searchParams, filtri = [];
  p.forEach((v, k) => { if(!["select", "order", "limit", "offset", "or", "and", "on_conflict", "columns"].includes(k) && v.startsWith("eq.")) filtri.push([k, v.slice(3)]); });
  const coda = await offCodaTutta();
  return coda.filter((x) => x.utente === utente && x.tabella === tab && x.metodo === "POST" && x.riga)
    .map((x) => ({ ...x.riga, _in_coda: true }))
    .filter((r) => filtri.every(([k, v]) => r[k] === undefined || String(r[k]) === v));
}

async function fetchOffline(input, init = {}){
  const url = typeof input === "string" ? input : input.url;
  const metodo = (init.method || (typeof input === "string" ? "GET" : input.method) || "GET").toUpperCase();
  const rest = url.includes("/rest/v1/"), storage = url.includes("/storage/v1/");
  if(!rest && !storage) return fetch(input, init);
  const h = new Headers(init.headers || (typeof input === "string" ? {} : input.headers));
  const utente = offUtente(h), rpc = offRpc(url), tab = rpc ? null : offTabella(url);
  const lettura = rest && (metodo === "GET" || metodo === "HEAD" || (metodo === "POST" && OFF_RPC_LETTURA.test(url)));
  const chiave = lettura ? [utente, metodo, url, metodo === "POST" ? String(init.body || "") : "", h.get("Prefer") || "", h.get("Accept") || "", h.get("Range") || ""].join("|") : null;

  // nuovi inserimenti delle tabelle in coda: l'id lo creiamo noi, così un secondo invio non fa doppioni
  let corpo = init.body;
  if(rest && metodo === "POST" && tab && OFF_TABELLE_CODA.includes(tab) && typeof corpo === "string"){
    try{ const b = JSON.parse(corpo); const conId = (r) => (r && typeof r === "object" && !r.id && tab !== "richiami_stato" ? { ...r, id: offUuid() } : r);
      corpo = JSON.stringify(Array.isArray(b) ? b.map(conId) : conId(b)); init = { ...init, body: corpo }; } catch(e){}
  }

  let res;
  try{ res = await fetch(input, init); }
  catch(err){ return offSenzaRete({ url, metodo, h, init, corpo, utente, rpc, tab, lettura, chiave }); }
  if(lettura && res.ok){
    res.clone().text().then((c) => offScrivi(chiave, { t: Date.now(), stato: res.status, corpo: c, cr: res.headers.get("content-range"), ct: res.headers.get("content-type") })).catch(() => {});
  }
  return res;
}

async function offSenzaRete({ url, metodo, h, init, corpo, utente, rpc, tab, lettura, chiave }){
  if(lettura){
    const c = await offLeggi(chiave);
    if(c){
      let testo = c.corpo;
      if(metodo === "GET" && tab){ // aggiungi in coda alla lista quello che è in attesa di invio
        try{ const extra = await offRigheInCoda(url, utente); const v = JSON.parse(testo); if(Array.isArray(v) && extra.length){ const ids = new Set(v.map((r) => r.id)); testo = JSON.stringify(v.concat(extra.filter((r) => !ids.has(r.id)))); } } catch(e){}
      }
      const hh = { "Content-Type": c.ct || "application/json", "X-Equo-Copia": String(c.t) }; if(c.cr) hh["Content-Range"] = c.cr;
      return new Response(metodo === "HEAD" ? null : testo, { status: c.stato, headers: hh });
    }
    if(metodo === "GET" && tab){ const extra = await offRigheInCoda(url, utente); if(extra.length && !String(h.get("Accept") || "").includes("object")) return offJson(200, extra); }
    return offJson(503, { message: "Sei offline e questi dati non sono ancora stati salvati sul telefono.", code: "OFFLINE" });
  }
  const rappresentazione = /return=representation/.test(h.get("Prefer") || ""), singolo = String(h.get("Accept") || "").includes("vnd.pgrst.object");
  if(tab && OFF_TABELLE_SCARTA.includes(tab)){
    let r = {}; try{ r = JSON.parse(corpo || "{}"); } catch(e){}
    return rappresentazione ? offJson(201, singolo ? r : [r]) : offJson(201);
  }
  const inCoda = (tab && OFF_TABELLE_CODA.includes(tab)) || (rpc && Object.prototype.hasOwnProperty.call(OFF_RPC_CODA, rpc));
  if(!inCoda) return offJson(503, { message: "Sei offline: questa operazione richiede la connessione. Riprova appena torna la rete.", code: "OFFLINE" });
  let riga = null; try{ riga = corpo ? JSON.parse(corpo) : null; } catch(e){}
  const intest = {}; ["Prefer", "Accept", "Content-Type", "Content-Profile", "Accept-Profile"].forEach((k) => { const v = h.get(k); if(v) intest[k] = v; });
  await offCodaAggiungi({ utente, url, metodo, intest, corpo: corpo || null, tabella: tab, rpc, riga: metodo === "POST" && riga && !Array.isArray(riga) ? { ...riga, created_at: riga.created_at || new Date().toISOString() } : null, quando: Date.now() });
  offAggiornaPill();
  if(rpc) return offJson(200, OFF_RPC_CODA[rpc]);
  if(!rappresentazione) return offJson(metodo === "DELETE" ? 204 : 201);
  let out = riga && typeof riga === "object" ? riga : {};
  if(metodo !== "POST"){ const id = new URL(url).searchParams.get("id"); if(id && id.startsWith("eq.")) out = { ...out, id: id.slice(3) }; }
  if(metodo === "POST" && !Array.isArray(out)) out = { ...out, created_at: out.created_at || new Date().toISOString() };
  return offJson(metodo === "DELETE" ? 200 : 201, singolo ? (Array.isArray(out) ? out[0] : out) : (Array.isArray(out) ? out : [out]));
}

// invio della coda, nell'ordine in cui le modifiche sono state fatte, con il login attuale
let offInvioInCorso = null;
function offInviaCoda(){ if(!offInvioInCorso) offInvioInCorso = offInvia().finally(() => { offInvioInCorso = null; }); return offInvioInCorso; }
async function offInvia(){
  if(!navigator.onLine) return;
  const { data: sess } = await sb.auth.getSession().catch(() => ({ data: null }));
  const token = sess?.session?.access_token, mio = sess?.session?.user?.id;
  if(!token) return;
  const coda = (await offCodaTutta()).filter((x) => x.utente === mio);
  let inviati = 0, scartati = [];
  for(const x of coda){
    const intest = { ...x.intest, apikey: SUPABASE_ANON_KEY, Authorization: "Bearer " + token };
    let url = x.url;
    if(x.metodo === "POST" && x.tabella && x.tabella !== "richiami_stato"){ // già arrivato al primo tentativo? niente doppioni
      intest.Prefer = [intest.Prefer, "resolution=ignore-duplicates"].filter(Boolean).join(",");
      if(!/on_conflict=/.test(url)) url += (url.includes("?") ? "&" : "?") + "on_conflict=id";
    }
    let res;
    try{ res = await fetch(url, { method: x.metodo, headers: intest, body: x.corpo }); }
    catch(e){ break; } // rete ancora assente: si riprova dopo, nello stesso ordine
    if(res.ok){ await offCodaTogli(x.n); inviati++; continue; }
    if(res.status >= 500 || res.status === 401){ break; }
    let msg = ""; try{ const j = await res.json(); msg = j.message || j.error || ""; } catch(e){}
    console.warn("coda offline: modifica rifiutata", x.tabella || x.rpc, res.status, msg);
    scartati.push(msg); await offCodaTogli(x.n);
  }
  offAggiornaPill();
  if(inviati) showToast(inviati === 1 ? "La modifica fatta senza rete è stata inviata." : `Le ${inviati} modifiche fatte senza rete sono state inviate.`);
  if(scartati.length) showToast(`${scartati.length === 1 ? "Una modifica" : scartati.length + " modifiche"} fatta senza rete non è stata accettata${scartati[0] ? ": " + scartati[0] : ""}. Controlla e rifalla.`);
  if(inviati && typeof showPage === "function"){ try{ const att = document.querySelector(".page-content.active")?.id?.replace("page-", ""); if(att) showPage(att); } catch(e){} }
}
async function offAggiornaPill(n){
  if(n === undefined){ const { data: sess } = await sb.auth.getSession().catch(() => ({ data: null })); const mio = sess?.session?.user?.id; n = (await offCodaTutta()).filter((x) => x.utente === mio).length; }
  const p = document.getElementById("eq-pill-coda"); if(!p) return;
  p.innerHTML = `<i class="fa-solid fa-clock"></i> ${n === 1 ? "1 modifica da inviare" : n + " modifiche da inviare"}`;
  p.classList.toggle("attivo", n > 0);
}
function dopoRitornoOnline(){ offInviaCoda(); }
setInterval(() => { if(navigator.onLine) offInviaCoda(); }, 45000);
window.addEventListener("load", () => setTimeout(() => { offAggiornaPill(); offInviaCoda(); }, 3000));
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { fetch: fetchOffline } });

let currentUser = null;
let horses = [];
let currentHorseId = null;
let authMode = "login";

