// Equo App · maniscalco · modulo (moduli ES, costruiti con Vite in ruoli/maniscalco/costruito.js)
import { clientiAttivi } from "./032-richiamo-prossimo-intervento-sempre-in-g.js";
import { isStruttura } from "./033-clienti-a-cartelle-stile-telegram-cavall.js";
import { creaCavalliDaTesto, nomiCavalliDaTesto, openClienteDetail, openEditCliente } from "./034-strutture-collegate-a-equo-scuderia-prof.js";
import { chiediSiNo } from "./052-ferro-standard-nella-scheda-del-cavallo.js";
import { isoLocale } from "./051-modal-appuntamento-maniscalco-nuovo-modi.js";
import { condividiInvitoCliente } from "./108-invito-qr.js";
/* ---------- ONBOARDING PREDITTIVO (27/10/2026, casi Sara/Francesco e Simone/Riccardo) ----------
   1. Tipo di cliente proposto dal nome («Scuderia…», «Centro…», «ASD…» → scuderia).
   2. Email del cliente: chi si iscrive con quella email trova «ti segue già» (equo_professionisti_che_mi_seguono).
   3. Prima di creare un cavallo: c'è già uno con lo stesso nome o microchip? (equo_cavalli_simili)
   4. «Di chi è?»: cavallo aggiunto a una scuderia ma di un cliente privato → scheda al proprietario, ubicazione la scuderia.
   5. Equo Card: in «Aggiungi cavallo» si inquadra il QR e il codice si compila da solo.
   6. Stato del collegamento nella scheda cliente con il tasto per il passo che manca (equo_stato_onboarding_cliente). */

// ---- 1. tipo di cliente dal nome
const ONB_STRUTTURA = /^(scuderia|scuderie|centro|circolo|maneggio|asd|a\.s\.d\.?|ssd|s\.s\.d\.?|allevamento|club|tenuta|azienda agricola|agriturismo|ranch|associazione|equitazione|horse|team|pony club)\b|\b(asd|a\.s\.d\.?|ssd|srl|s\.r\.l\.|ranch|club|equestre|ippico|ippica)$/i;
function onbTipoDaNome(nome){ return ONB_STRUTTURA.test(String(nome || "").trim()) ? "struttura" : "proprietario"; }
let onbTipoAuto = false, onbTipoToccato = false;
function onbResetTipo(){ onbTipoAuto = false; onbTipoToccato = false; const n = document.getElementById("cliente-tipo-auto"); if(n) n.style.display = "none"; }
// 28/10/2026: vale per «Nuovo cliente» e per «+ Nuovo cliente» dentro l'appuntamento (stessa regola ovunque)
const ONB_CAMPI_TIPO = { "cliente-nome": ["cliente-tipo", "cliente-tipo-auto"], "intervento-nuovo-cliente-nome": ["intervento-nuovo-cliente-tipo", "intervento-nuovo-cliente-tipo-auto"] };
const onbTipoStato = {};
document.addEventListener("input", e => {
  const campi = ONB_CAMPI_TIPO[e.target?.id]; if(!campi) return;
  const st = e.target.id === "cliente-nome" ? { get auto(){ return onbTipoAuto; }, set auto(v){ onbTipoAuto = v; }, get toccato(){ return onbTipoToccato; } }
    : (onbTipoStato[e.target.id] = onbTipoStato[e.target.id] || { auto: false, toccato: false });
  if(st.toccato) return;
  const sel = document.getElementById(campi[0]); if(!sel) return;
  const t = onbTipoDaNome(e.target.value);
  if(t === "struttura" && sel.value !== "struttura"){ sel.value = "struttura"; st.auto = true; }
  else if(t === "proprietario" && st.auto && sel.value === "struttura"){ sel.value = "proprietario"; st.auto = false; }
  else return;
  if(campi[0] === "cliente-tipo" && typeof window.aggiornaEtichetteNuovoCliente === "function") window.aggiornaEtichetteNuovoCliente();
  const n = document.getElementById(campi[1]);
  if(n){ n.style.display = st.auto ? "block" : "none"; }
});
document.addEventListener("change", e => {
  if(e.target?.id === "cliente-tipo"){ onbTipoToccato = true; const n = document.getElementById("cliente-tipo-auto"); if(n) n.style.display = "none"; }
  if(e.target?.id === "intervento-nuovo-cliente-tipo"){ (onbTipoStato["intervento-nuovo-cliente-nome"] = onbTipoStato["intervento-nuovo-cliente-nome"] || {}).toccato = true; const n = document.getElementById("intervento-nuovo-cliente-tipo-auto"); if(n) n.style.display = "none"; }
});
function onbResetTipoAppuntamento(){ delete onbTipoStato["intervento-nuovo-cliente-nome"]; const n = document.getElementById("intervento-nuovo-cliente-tipo-auto"); if(n) n.style.display = "none"; }

// ---- 2. email del cliente: «» = vuota, null = non valida
function onbEmail(id){
  const v = String(document.getElementById(id)?.value || "").trim().toLowerCase();
  if(!v) return "";
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) && v.length <= 200 ? v : null;
}

// ---- 3. cavalli simili prima di crearne uno nuovo
const onbNorm = s => String(s || "").trim().toLowerCase().replace(/\s+/g, " ");
async function onbSimili(nome, chip){
  if(!nome && !chip) return [];
  if(DEMO_MODE){
    const cli = demoState.clientiMascalcia || [];
    return (demoState.cavalliClientiMascalcia || []).filter(x => (nome && onbNorm(x.nome) === onbNorm(nome)) || (chip && x.microchip && onbNorm(x.microchip) === onbNorm(chip)))
      .map(x => { const c = cli.find(k => k.id === x.cliente_mascalcia_id) || {}; return { id: x.id, nome: x.nome, cliente: c.nome || "", cliente_id: c.id, codice: x.codice_equo || "", archiviato: !!(x.archiviato_il || c.archiviato_il), motivo: chip && onbNorm(x.microchip) === onbNorm(chip) ? "microchip" : "nome", tipo: "mio" }; });
  }
  try{
    const { data, error } = await sb.rpc("equo_cavalli_simili", { p_nome: nome || null, p_microchip: chip || null });
    return !error && Array.isArray(data) ? data : [];
  }catch(e){ return []; }
}
function onbDove(x){
  return x.tipo === "proprietario" ? `è già su Equo, nell'account di ${x.cliente}`
    : x.archiviato ? `c'è già tra gli archiviati di «${x.cliente}»` : `c'è già sotto «${x.cliente}»`;
}
// true = crea il cavallo nuovo; false = il maniscalco ha scelto di aprire quello che c'è già
async function onbApriEsistente(x){
  if(!x?.cliente_id) return;
  try{ showPage("pro-clienti"); }catch(e){}
  await openClienteDetail(x.cliente_id);
  if(x.archiviato) showToast(`${x.nome} è archiviato: ripristinalo da «Modifica» → Cavalli archiviati.`);
}
// stesso nome o microchip già presente? → { crea: true } · { usa: {id, nome} } (stesso cliente, si usa quello) · { stop: x }
async function verificaNuovoCavallo(nome, chip, clienteId, usaEsistente){
  const lista = await onbSimili(nome, chip);
  if(!lista.length) return { crea: true };
  const x = lista[0], altri = lista.length - 1;
  const stesso = usaEsistente && x.tipo === "mio" && !x.archiviato && x.id && clienteId && x.cliente_id === clienteId;
  const ok = await chiediSiNo(`${x.nome} ${onbDove(x)}`,
    `${x.motivo === "microchip" ? "Stesso microchip. " : ""}${x.codice ? "Codice " + x.codice + ". " : ""}${altri > 0 ? "Ci sono altri " + altri + " cavalli simili. " : ""}È un altro cavallo? «Sì» crea una scheda nuova; «No» ${stesso ? "usa quello che c'è già" : usaEsistente ? "si ferma, così scegli quello che c'è già" : "apre quello che c'è già"}: niente doppioni.`);
  if(ok) return { crea: true };
  if(stesso) return { usa: { id: x.id, nome: x.nome } };
  return { stop: x };
}
// testo per chi si ferma: dove sta il cavallo che c'è già
function testoGiaPresente(x){
  return x.tipo === "proprietario" ? `${x.nome} è già su Equo con ${x.cliente}: sceglilo dall'elenco dei cavalli di quel cliente.`
    : x.archiviato ? `${x.nome} è tra gli archiviati di «${x.cliente}»: ripristinalo da «Modifica».`
    : `${x.nome} c'è già sotto «${x.cliente}»: usa quel cliente (oppure rispondi «Sì» se è un altro cavallo).`;
}
async function onbControllaDoppione(nome, chip){
  const v = await verificaNuovoCavallo(nome, chip, null, false);
  if(v.stop){ await onbApriEsistente(v.stop); return false; }
  return true;
}
/* ---- UNA SOLA STRADA per creare cavalli e clienti (28/10/2026) ----
   La usano: cartella Cavalli, Modifica cliente, Nuovo cliente, nuovo appuntamento, Hammer, Cambia proprietario.
   creaCavalloUnico(campi, { chiedi, usaEsistente, ubicazioneDa }) → { data } · { data, riusato } · { annullato, esistente } · { error } */
async function creaCavalloUnico(campi, opz = {}){
  const nome = String(campi?.nome || "").trim(), chip = campi?.microchip ? String(campi.microchip).trim() : null;
  if(!nome) return { error: { message: "Scrivi il nome del cavallo." } };
  if(opz.chiedi !== false){
    const v = await verificaNuovoCavallo(nome, chip, campi.cliente_mascalcia_id, !!opz.usaEsistente);
    if(v.usa) return { data: v.usa, riusato: true };
    if(v.stop){ if(!opz.usaEsistente) await onbApriEsistente(v.stop); return { annullato: true, esistente: v.stop, messaggio: testoGiaPresente(v.stop) }; }
  }
  const r = await DB.insertCavalloCliente({ cliente_mascalcia_id: campi.cliente_mascalcia_id, nome, microchip: chip, horse_id: campi.horse_id || null, razza: campi.razza || null, ferratura_tipo: campi.ferratura_tipo || null });
  if(!r.error && r.data?.id && opz.ubicazioneDa) await onbUbicaInScuderia(r.data.id, opz.ubicazioneDa);
  return r;
}
// creaClienteUnico({ nome, tipo_cliente, telefono, email, indirizzo, note, cavalli (testo «Aurora, Baia»), nome_cavallo, chiediCavalli })
async function creaClienteUnico(c){
  const nome = String(c?.nome || "").trim();
  if(!nome) return { error: { message: "Scrivi il nome del cliente." } };
  const email = c.email ? String(c.email).trim().toLowerCase() : "";
  const tipo_cliente = c.tipo_cliente || onbTipoDaNome(nome);
  const nomi = nomiCavalliDaTesto(c.cavalli || "");
  const salta = nomi.length && c.chiediCavalli !== false ? await onbNomiGiaPresenti(nomi) : [];
  const restano = nomi.filter(n => !salta.some(x => x.toLowerCase() === n.toLowerCase()));
  const { error, data } = await DB.insertClienteMascalcia({ nome, nome_cavallo: c.nome_cavallo != null ? c.nome_cavallo : restano.join(", "), telefono: c.telefono || "", note: c.note || "", tipo_cliente });
  if(error || !data) return { error: error || { message: "salvataggio non riuscito" } };
  const extra = {};
  if(email) extra.email = email;
  if(c.indirizzo) extra.indirizzo = String(c.indirizzo).trim();
  if(Object.keys(extra).length) await DB.updateClienteMascalcia(data.id, extra);
  const cavalli = restano.length ? await creaCavalliDaTesto(data.id, restano.join(", ")) : [];
  return { data, cavalli, saltati: salta };
}
// nuovo cliente con «Aurora, Baia»: i nomi che esistono già, tutti insieme in una domanda
async function onbNomiGiaPresenti(nomi){
  const trovati = [];
  for(const n of nomi.slice(0, 12)){
    const l = (await onbSimili(n, null)).filter(x => !x.archiviato);
    if(l.length) trovati.push(`${n} (${l[0].tipo === "proprietario" ? "su Equo con " : "sotto "}${l[0].cliente})`);
  }
  if(!trovati.length) return [];
  const ok = await chiediSiNo(trovati.length === 1 ? "Questo cavallo c'è già" : "Questi cavalli ci sono già",
    trovati.join(", ") + ". Sono altri cavalli? «Sì» crea lo stesso le schede; «No» salva il cliente senza questi cavalli (li colleghi poi dalla scheda giusta).");
  return ok ? [] : trovati.map(t => t.replace(/ \(.*$/, ""));
}

// ---- 4. «Di chi è?» quando il cavallo va in una scuderia
function onbDiChiAggiorna(clienteId){
  const box = document.getElementById("ncav-dichi-box"), sel = document.getElementById("ncav-dichi");
  if(!box || !sel) return;
  const c = (clientiMascalcia || []).find(x => x.id === clienteId);
  if(!c || !isStruttura(c)){ box.style.display = "none"; sel.value = ""; return; }
  const pr = clientiAttivi().filter(k => !isStruttura(k)).sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "it", { sensitivity: "base" }));
  sel.innerHTML = `<option value="">Della scuderia (paga la scuderia)</option>` + (pr.length ? `<optgroup label="Di un mio cliente, sta in ${escapeHtml(c.nome)}">${pr.map(k => `<option value="${k.id}">${escapeHtml(k.nome)}</option>`).join("")}</optgroup>` : "");
  box.style.display = "block";
}
document.addEventListener("change", e => { if(e.target?.id === "ncav-cliente") onbDiChiAggiorna(e.target.value); });
function onbDiChiScelto(){
  const box = document.getElementById("ncav-dichi-box");
  return box && box.style.display !== "none" ? (document.getElementById("ncav-dichi")?.value || "") : "";
}
// la scheda appena creata (o aggiunta col codice) risulta nella scuderia
async function onbUbicaInScuderia(rigaId, strutturaId){
  const s = (clientiMascalcia || []).find(x => x.id === strutturaId);
  if(!rigaId || !s) return;
  const campi = { ubicazione_tipo: "scuderia", ubicazione_cliente_id: s.id, ubicazione_nome: s.nome, ubicazione_indirizzo: s.indirizzo || null, ubicazione_dal: isoLocale(new Date()) };
  if(DEMO_MODE){ const r = (demoState.cavalliClientiMascalcia || []).find(x => x.id === rigaId); if(r) Object.assign(r, campi); return; }
  const { error } = await sb.from("cavalli_clienti_mascalcia").update(campi).eq("id", rigaId);
  if(error) console.error("onbUbicaInScuderia:", error);
}

// ---- 5. Equo Card: inquadra il QR del cavallo dentro «Aggiungi cavallo»
let onbScanFino = 0;
function onbScansionaCavallo(){
  onbScanFino = Date.now() + 120000;
  if(typeof window.openQrScanner === "function") window.openQrScanner();
}
function onbCodiceDaTesto(testo){
  const t = String(testo || "").trim();
  const m = t.match(/\/cavallo\/([^/?#\s]+)/i);
  if(m){ try{ return decodeURIComponent(m[1]).toUpperCase(); }catch(e){ return m[1].toUpperCase(); } }
  const k = t.toUpperCase().match(/\b[A-Z]{2,4}[\s-]?\d{4,8}\b/);
  return k ? k[0].replace(/\s/, "-") : "";
}
// chiamata dallo scanner: true se il codice era per «Aggiungi cavallo»
function onbCodiceScansionato(testo){
  if(Date.now() > onbScanFino) return false;
  onbScanFino = 0;
  const cod = onbCodiceDaTesto(testo);
  const campo = document.getElementById("ncav-codice");
  if(!cod || !campo){ showToast("Questo QR non è la Equo Card di un cavallo."); return true; }
  campo.value = cod;
  showToast(`Codice ${cod} letto: scegli il cliente e salva.`);
  return true;
}

// ---- 6. stato del collegamento nella scheda cliente
async function onbStato(c){
  if(DEMO_MODE){
    const cav = (demoState.cavalliClientiMascalcia || []).filter(x => x.cliente_mascalcia_id === c.id && !x.archiviato_il);
    return { ok: true, collegato: !!c.cliente_user_id, email: c.email || null, proposte_attesa: [], cavalli: cav.length, collegati: cav.filter(x => x.horse_id).length, definitivi: 0, da_confermare_io: 0 };
  }
  try{ const { data, error } = await sb.rpc("equo_stato_onboarding_cliente", { p_cliente: c.id }); return !error && data?.ok ? data : null; }catch(e){ return null; }
}
async function onbRenderStato(c){
  const box = document.getElementById("cli-onb");
  if(!box) return;
  box.style.display = "none";
  if(!c || c.archiviato_il || c.centro_id) return;
  const s = await onbStato(c);
  if(!s || currentClienteId !== c.id || !box.isConnected) return;
  const attesa = s.proposte_attesa || [];
  const passi = [
    { fatto: s.collegato, t: s.collegato ? "Collegato a Equo" : "Invito da accettare" },
    { fatto: s.collegato && !attesa.length && s.collegati >= s.cavalli && s.cavalli > 0, t: s.cavalli ? `Cavalli nel suo account ${s.collegati}/${s.cavalli}` : "Nessun cavallo" },
    { fatto: s.collegati > 0 && s.definitivi >= s.collegati, t: `Codici definitivi ${s.definitivi}/${s.collegati || s.cavalli}` }
  ];
  let azione = "";
  if(!s.collegato){
    azione = `<div class="onb-nota">${s.email ? `Quando si iscrive con <b>${escapeHtml(s.email)}</b> ti trova già: «ti segue già», un tocco e siete collegati.` : "Aggiungi la sua email: quando si iscrive a Equo ti trova da solo, anche senza QR."}</div>
      <div class="onb-tasti"><button class="btn btn-primary btn-sm" onclick="condividiInvitoCliente()">Condividi l'invito</button>${s.email ? "" : `<button class="btn btn-outline btn-sm" onclick="openEditCliente()">Aggiungi email</button>`}</div>`;
  } else if(attesa.length){
    azione = `<div class="onb-nota">Deve ancora accettare ${escapeHtml(attesa.join(", "))}: con «Accetta tutti» entrano nel suo account con i lavori già fatti.</div>
      <div class="onb-tasti"><button class="btn btn-primary btn-sm" onclick="onbSollecita('${c.id}', this)">Ricordaglielo</button></div>`;
  } else if(s.da_confermare_io > 0){
    azione = `<div class="onb-nota">${s.da_confermare_io === 1 ? "Un cavallo aspetta" : s.da_confermare_io + " cavalli aspettano"} la tua conferma dei dati per il codice definitivo.</div>
      <div class="onb-tasti"><button class="btn btn-primary btn-sm" onclick="hmConferme()">Conferma i dati</button></div>`;
  } else if(s.collegati > s.definitivi){
    azione = `<div class="onb-nota">Il codice diventa definitivo quando tu e il proprietario confermate nome, razza e data di nascita.</div>`;
  }
  if(passi.every(p => p.fatto) && !azione){
    box.innerHTML = `<div class="onb-ok">✓ Tutto collegato: cavalli nel suo account e codici definitivi</div>`;
  } else {
    box.innerHTML = `<div class="onb-tit">Collegamento a Equo</div>
      <div class="onb-passi">${passi.map(p => `<span class="${p.fatto ? "ok" : ""}"><i>${p.fatto ? "✓" : ""}</i>${escapeHtml(p.t)}</span>`).join("")}</div>${azione}`;
  }
  box.style.display = "block";
}
async function onbSollecita(clienteId, btn){
  if(DEMO_MODE){ showToast("In demo il promemoria non parte."); return; }
  if(btn) btn.disabled = true;
  try{
    const { data, error } = await sb.rpc("equo_sollecita_onboarding", { p_cliente: clienteId });
    if(error || !data?.ok){ showToast(data?.motivo === "non_collegato" ? "Il cliente non è ancora collegato: condividi l'invito." : "Non inviato, riprova."); return; }
    showToast(data.niente ? "Ha già accettato tutti i cavalli." : "Promemoria inviato in chat.");
    const c = (clientiMascalcia || []).find(x => x.id === clienteId);
    if(c) onbRenderStato(c);
  } finally { if(btn) btn.disabled = false; }
}

export { creaCavalloUnico, creaClienteUnico, onbResetTipoAppuntamento, testoGiaPresente, verificaNuovoCavallo, onbCodiceScansionato, onbControllaDoppione, onbDiChiAggiorna, onbDiChiScelto, onbEmail, onbNomiGiaPresenti, onbRenderStato, onbResetTipo, onbScansionaCavallo, onbSollecita, onbTipoDaNome, onbUbicaInScuderia };
