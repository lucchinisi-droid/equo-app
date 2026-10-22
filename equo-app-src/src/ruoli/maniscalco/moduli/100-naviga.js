// Equo App · maniscalco · modulo (moduli ES, costruiti con Vite in ruoli/maniscalco/costruito.js)
import { openClienteDetail, openEditCliente } from "./034-strutture-collegate-a-equo-scuderia-prof.js";
import { wgClienteDi } from "./098-professionista.js";
/* ---------- Naviga ---------- */
/* Naviga: indirizzo in quest'ordine
   1) quello scritto dal maniscalco nella scheda cliente
   2) quello della struttura collegata in Equo Scuderia (rpc pro_indirizzi_strutture)
   3) nessuno: ricerca del luogo (cerca-luogo → Google Places), il maniscalco sceglie e si salva nella scheda */
let wgIndirizziStrutture = null;
async function wgIndirizzoStruttura(c){
  if(!c?.centro_id || DEMO_MODE) return null;
  if(!wgIndirizziStrutture){
    try{
      const { data, error } = await sb.rpc("pro_indirizzi_strutture");
      wgIndirizziStrutture = error ? [] : (data || []);
    }catch(_){ wgIndirizziStrutture = []; }
  }
  return wgIndirizziStrutture.find(x => (x.cliente_id || x.id) === c.id) || null;
}
async function wgNaviga(clienteId){
  const c = wgClienteDi(clienteId);
  if(!c){ showToast("Cliente non trovato"); return; }
  const proprio = (c.indirizzo || "").trim();
  if(proprio) return wgMostraMappe(c, proprio);
  const st = await wgIndirizzoStruttura(c);
  const via = (st?.indirizzo || "").trim();
  const citta = [st?.citta, st?.provincia ? "(" + st.provincia + ")" : ""].filter(Boolean).join(" ").trim();
  if(via) return wgMostraMappe(c, [via, citta].filter(Boolean).join(", "), "Indirizzo indicato dalla scuderia in Equo Scuderia");
  wgCercaLuogo(c, [st?.nome || c.nome, st?.citta].filter(Boolean).join(", "));
}
function wgMappeOv(){
  let ov = document.getElementById("modal-naviga");
  if(!ov){
    ov = document.createElement("div"); ov.className = "modal-overlay"; ov.id = "modal-naviga";
    ov.addEventListener("click", ev => { if(ev.target === ov) closeModal("modal-naviga"); });
    document.body.appendChild(ov);
  }
  return ov;
}
function wgMostraMappe(c, indirizzo, nota){
  const q = encodeURIComponent(indirizzo);
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const app = [
    ["Google Maps", `https://www.google.com/maps/dir/?api=1&destination=${q}`, "linear-gradient(135deg,#34a853 0 33%,#fbbc04 33% 66%,#4285f4 66%)"],
    ...(ios ? [["Apple Mappe", `https://maps.apple.com/?daddr=${q}`, "linear-gradient(160deg,#7fd27b,#3aa0f0)"]] : []),
    ["Waze", `https://waze.com/ul?q=${q}&navigate=yes`, "#33ccff"],
  ];
  const ov = wgMappeOv();
  ov.innerHTML = `<div class="modal"><div class="modal-handle"></div>
    <div class="modal-title" style="margin-bottom:2px">Indicazioni per ${wgEsc(c?.nome || "il cliente")}</div>
    <div class="muted" style="font-size:13px;margin-bottom:${nota ? 2 : 14}px">${wgEsc(indirizzo)}</div>
    ${nota ? `<div class="muted" style="font-size:12px;margin-bottom:14px">${wgEsc(nota)}</div>` : ""}
    ${app.map(([n, u, bg]) => `<a class="wg-app-mappa" href="${u}" target="_blank" rel="noopener" onclick="closeModal('modal-naviga')"><i style="background:${bg}"></i>${n}</a>`).join("")}
    <button class="btn btn-outline" style="width:100%;margin-top:6px" onclick="closeModal('modal-naviga')">Annulla</button></div>`;
  openModal("modal-naviga");
}
let wgLuogo = { cliente: null, risultati: [] };
function wgCercaLuogo(c, testo){
  wgLuogo = { cliente: c, risultati: [] };
  const ov = wgMappeOv();
  ov.innerHTML = `<div class="modal"><div class="modal-handle"></div>
    <div class="modal-title" style="margin-bottom:2px">Dove si trova ${wgEsc(c.nome || "il cliente")}?</div>
    <div class="muted" style="font-size:13px;margin-bottom:12px">Manca l'indirizzo. Cerca il luogo e tocca quello giusto: lo salvo nella scheda del cliente.</div>
    <form onsubmit="event.preventDefault();wgCercaLuogoVai()" style="display:flex;gap:8px;margin-bottom:12px">
      <input class="input" id="wg-luogo-testo" style="flex:1" placeholder="Nome del maneggio o della via, città" value="${wgEsc(testo || "")}">
      <button class="btn btn-primary" type="submit" style="flex-shrink:0">Cerca</button>
    </form>
    <div id="wg-luogo-esiti"></div>
    <button class="btn btn-outline" style="width:100%;margin-top:6px" onclick="wgLuogoAMano()">Scrivo l'indirizzo a mano</button>
    <button class="btn btn-outline" style="width:100%;margin-top:8px" onclick="closeModal('modal-naviga')">Annulla</button></div>`;
  openModal("modal-naviga");
  if((testo || "").trim().length >= 3) wgCercaLuogoVai();
  else setTimeout(() => document.getElementById("wg-luogo-testo")?.focus(), 250);
}
async function wgCercaLuogoVai(){
  const testo = (document.getElementById("wg-luogo-testo")?.value || "").trim();
  const box = document.getElementById("wg-luogo-esiti");
  if(!box) return;
  if(testo.length < 3){ box.innerHTML = `<div class="muted" style="font-size:13px;margin-bottom:10px">Scrivi almeno 3 lettere.</div>`; return; }
  box.innerHTML = `<div class="muted" style="font-size:13px;margin-bottom:10px">Cerco…</div>`;
  let d = {};
  if(DEMO_MODE){
    await new Promise(r => setTimeout(r, 400));
    d = { risultati: [
      { nome: testo.split(",")[0] + " (scuderia)", indirizzo: "Via Casilina km 51, 00034 Colleferro RM, Italia" },
      { nome: testo.split(",")[0], indirizzo: "Via dei Prati 12, 00038 Valmontone RM, Italia" },
      { nome: "Centro ippico " + testo.split(",")[0], indirizzo: "Strada provinciale 600, 03012 Anagni FR, Italia" },
    ] };
  } else {
    try{
      const res = await fetch("/.netlify/functions/cerca-luogo", { method: "POST", headers: await authHeaders(), body: JSON.stringify({ testo }) });
      d = await res.json().catch(() => ({}));
      if(res.status === 401) d = { errore: true, sessione: true };
    }catch(_){ d = { errore: true }; }
  }
  const mappe = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(testo)}`;
  const apriMappe = `<a class="wg-app-mappa" href="${mappe}" target="_blank" rel="noopener"><i style="background:linear-gradient(135deg,#34a853 0 33%,#fbbc04 33% 66%,#4285f4 66%)"></i>Cerca su Google Maps</a>`;
  if(d.non_configurato || d.errore || d.limite_raggiunto){
    const motivo = d.limite_raggiunto ? "Hai fatto molte ricerche oggi: riprova domani." : d.sessione ? "Sessione scaduta: esci e rientra." : !navigator.onLine ? "Sei offline: la ricerca riparte con la rete." : "La ricerca non è disponibile in questo momento.";
    box.innerHTML = `<div class="muted" style="font-size:13px;margin-bottom:10px">${motivo} Puoi cercare il luogo direttamente nelle mappe.</div>${apriMappe}`;
    return;
  }
  wgLuogo.risultati = d.risultati || [];
  if(!wgLuogo.risultati.length){
    box.innerHTML = `<div class="muted" style="font-size:13px;margin-bottom:10px">Nessun luogo trovato. Prova con il nome del maneggio e la città, oppure scrivi l'indirizzo a mano.</div>${apriMappe}`;
    return;
  }
  box.innerHTML = wgLuogo.risultati.map((r, i) => `<button class="wg-app-mappa wg-luogo" type="button" onclick="wgSceltaLuogo(${i})">
      <span class="wg-luogo-ico"><i class="fa-solid fa-location-dot"></i></span>
      <span style="min-width:0"><span style="display:block">${wgEsc(r.nome || r.indirizzo)}</span><span class="muted" style="display:block;font-weight:400;font-size:12.5px">${wgEsc(r.indirizzo)}</span></span></button>`).join("");
}
async function wgSceltaLuogo(i){
  const r = wgLuogo.risultati[i], c = wgLuogo.cliente;
  if(!r || !c) return;
  if(!DEMO_MODE){
    const { error } = await DB.updateClienteMascalcia(c.id, { indirizzo: r.indirizzo });
    if(error){ showToast("Non sono riuscito a salvare l'indirizzo, ma ti porto lo stesso"); }
    else showToast("Indirizzo salvato nella scheda del cliente");
  }
  c.indirizzo = r.indirizzo;
  closeModal("modal-naviga");
  setTimeout(() => wgMostraMappe(c, r.indirizzo), 200);
}
function wgLuogoAMano(){
  const c = wgLuogo.cliente;
  closeModal("modal-naviga");
  if(!c) return;
  showPage("pro-clienti");
  openClienteDetail(c.id).then(() => { if(typeof openEditCliente === "function") openEditCliente().then(() => document.getElementById("edit-cliente-indirizzo")?.focus()); });
}


export { wgCercaLuogoVai, wgIndirizzoStruttura, wgLuogoAMano, wgMostraMappe, wgNaviga, wgSceltaLuogo };
