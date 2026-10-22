/* ---------- Analizza una foto (Focus) ---------- */
const HP_SCATTI = [
  { k: "laterale", t: "Laterale", g: "Zoccolo di lato, a terra, telefono all'altezza del piede" },
  { k: "frontale", t: "Frontale", g: "Di fronte, a terra, tutto il piede dentro la guida" },
  { k: "suola", t: "Suola", g: "Piede alzato e pulito, suola al centro" },
  { k: "lastra", t: "Lastra", g: "Radiografia dritta, tutta dentro la guida" }
];
let hpFoto = { scatto: "laterale", url: null, testo: null, via: false };
function hpApriFoto(){
  hpFineCaso();
  hpFoto = { scatto: "laterale", url: null, testo: null, via: false };
  document.getElementById("hp-f-cav").textContent = hpContesto ? hpContesto.nome : "";
  document.getElementById("hp-f-img").hidden = true; document.getElementById("hp-f-img").removeAttribute("src");
  document.getElementById("hp-f-nota").value = "";
  document.getElementById("hp-f-via").disabled = true;
  document.getElementById("hp-f-passo1").hidden = false;
  document.getElementById("hp-f-passo2").hidden = true;
  const free = !isPremium();
  document.getElementById("hp-f-costo").textContent = free ? "Nel piano Free un'analisi foto vale 3 messaggi." : "Con Premium l'analisi foto vale 1 messaggio.";
  hpScatto("laterale");
  document.getElementById("hp-focus").classList.add("on");
}
function hpChiudiFoto(){ document.getElementById("hp-focus")?.classList.remove("on"); clearInterval(hpFoto.timer); }
function hpScatto(k){
  hpFoto.scatto = k;
  document.getElementById("hp-f-scatti").innerHTML = HP_SCATTI.map(x => `<button type="button" class="${x.k === k ? "on" : ""}" onclick="hpScatto('${x.k}')">${x.t}</button>`).join("");
  document.getElementById("hp-f-guida").textContent = HP_SCATTI.find(x => x.k === k).g;
  document.getElementById("hp-f-guida").hidden = !!hpFoto.url;
}
async function hpFotoScelta(input){
  const f = input.files && input.files[0]; input.value = "";
  if(!f) return;
  if(!(f.type || "").startsWith("image/")){ showToast("Serve una foto."); return; }
  try{ hpFoto.url = await riduciImmagine(f); }catch(e){ showToast("Non riesco a leggere la foto, riprova."); return; }
  const img = document.getElementById("hp-f-img"); img.src = hpFoto.url; img.hidden = false;
  document.getElementById("hp-f-guida").hidden = true;
  document.getElementById("hp-f-via").disabled = false;
}
async function hpAnalizza(){
  if(!hpFoto.url || hpFoto.via) return;
  hpFoto.via = true;
  const scatto = HP_SCATTI.find(x => x.k === hpFoto.scatto);
  const nota = document.getElementById("hp-f-nota").value.trim();
  document.getElementById("hp-f-passo1").hidden = true;
  document.getElementById("hp-f-passo2").hidden = false;
  document.getElementById("hp-f-attesa").hidden = false;
  document.getElementById("hp-f-esito").hidden = true;
  document.getElementById("hp-f-img2").src = hpFoto.url;
  const li = [...document.querySelectorAll("#hp-f-attesa .hp-f-step li")]; li.forEach(x => x.classList.remove("ok"));
  let k = 0; clearInterval(hpFoto.timer); hpFoto.timer = setInterval(() => { if(li[k]) li[k++].classList.add("ok"); }, 2200);
  const testo = `Analisi foto · scatto ${scatto.t.toLowerCase()}${hpContesto && hpContesto.tipo === "cavallo" ? " · " + hpContesto.nome : ""}${nota ? " · " + nota : ""}`;
  let data = {};
  try{
    if(DEMO_MODE){
      await new Promise(r => setTimeout(r, 1200));
      data = { reply: "## Cosa si vede\n- Punta lunga, talloni bassi\n- Asse zoccolo-pastorale spezzato all'indietro\n## Da controllare\n- Angolo dei talloni sull'altro piede\n- Linea bianca in punta\n## Cosa fare\n- Accorciare la punta e arretrare il punto di stacco\n- Valutare un ferro a rotolamento facilitato\n## Limiti\n- Foto un po' dall'alto: rifai lo scatto laterale a terra\nAffidabilità: media", uso: { usati: 3, limite: 5, periodo: "giorno" } };
    } else {
      const res = await fetch("/.netlify/functions/agent", { method: "POST", headers: await authHeaders(),
        body: JSON.stringify({ message: testo, vista: vistaAi(), modalita: "foto", allegati: [{ media_type: "image/jpeg", data: hpFoto.url.split(",")[1] }],
          contesto_app: hpContesto ? hpContesto.testo : null }) });
      data = await res.json().catch(() => ({}));
      if(res.status === 413) data = { reply: null, errore: "Foto troppo pesante: riprova con un'altra." };
      else if(!res.ok && !data.reply) data = { reply: null, errore: "Non riesco ad analizzare la foto adesso, riprova tra poco." };
    }
  }catch(e){ data = { reply: null, errore: "Errore di connessione, riprova." }; }
  clearInterval(hpFoto.timer);
  li.forEach(x => x.classList.add("ok"));
  hpFoto.via = false;
  if(data.uso) aggiornaNotaUsoAi(data.uso);
  const es = document.getElementById("hp-f-esito");
  document.getElementById("hp-f-attesa").hidden = true;
  es.hidden = false;
  if(data.limite_raggiunto){ es.innerHTML = hpLimiteHtml(data).replace("chat-bubble ai ", ""); return; }
  if(!data.reply || data.errore){ es.innerHTML = `<div class="hp-es-disc">${escapeHtml(data.errore || "Non sono riuscito ad analizzare la foto, riprova.")}</div><button type="button" class="hp-b o" onclick="hpApriFoto()">Riprova</button>`; return; }
  hpFoto.testo = data.reply; hpFoto.titolo = testo;
  es.innerHTML = hpEsitoHtml(data.reply);
  // anche nella chat, come gli altri messaggi
  const box = document.getElementById("chat-messages");
  box.insertAdjacentHTML("beforeend", `<div class="chat-bubble user hp-foto-msg"><div class="ai-thumbs"><img src="${hpFoto.url}" alt=""></div>${escapeHtml(testo)}</div><div class="chat-bubble ai hp-foto-msg">${formattaRispostaAi(data.reply)}</div>`);
  box.scrollTop = box.scrollHeight;
}
const HP_SEZ = [["Cosa si vede", '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>'],
  ["Da controllare", '<path d="M9 11l3 3 8-8"/><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9"/>'],
  ["Cosa fare", '<path d="m15 12-8.373 8.373a1 1 0 1 1-3-3L12 9"/><path d="m18 15 4-4"/><path d="m21.5 11.5-1.914-1.914A2 2 0 0 1 19 8.172V7l-2.26-2.26a6 6 0 0 0-4.202-1.756L9 2.96l.92.82A6.18 6.18 0 0 1 12 8.4V10l2 2h1.172a2 2 0 0 1 1.414.586L18.5 14.5"/>'],
  ["Limiti", '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/>']];
function hpSezioni(testo){
  const out = {}; let cur = null;
  String(testo || "").split("\n").forEach(r => {
    const h = r.match(/^#{1,4}\s*(.+?)\s*$/);
    if(h){ cur = HP_SEZ.find(s => h[1].toLowerCase().startsWith(s[0].toLowerCase()))?.[0] || h[1]; out[cur] = out[cur] || []; return; }
    if(/^\s*\**Affidabilit/i.test(r)) return;
    const t = r.replace(/^\s*[-*•]\s*/, "").trim();
    if(t && cur) out[cur].push(t);
  });
  const m = String(testo || "").match(/Affidabilit[àa]:\s*\**\s*(alta|media|bassa)/i);
  return { sez: out, aff: m ? m[1].toLowerCase() : null };
}
function hpEsitoHtml(testo){
  const { sez, aff } = hpSezioni(testo);
  const AFF = { alta: ["100%", "#1f8a52"], media: ["62%", "#e2ab45"], bassa: ["28%", "#c94b40"] };
  const corpo = Object.keys(sez).length ? Object.entries(sez).map(([t, r]) => {
      const ic = HP_SEZ.find(s => s[0] === t)?.[1] || "";
      return `<div class="hp-es-sez"><h4>${ic ? `<svg class="hm-svg" viewBox="0 0 24 24">${ic}</svg>` : ""}${escapeHtml(t)}</h4><ul>${r.map(x => `<li>${formattaRispostaAi(x).replace(/^<p>|<\/p>$/g, "")}</li>`).join("")}</ul></div>`;
    }).join("") : `<div class="hp-es-sez">${formattaRispostaAi(testo)}</div>`;
  return (hpFoto.url ? `<img src="${hpFoto.url}" alt="" style="width:100%;border-radius:18px;margin-bottom:10px;max-height:260px;object-fit:cover">` : "")
    + (aff ? `<div class="hp-es-aff" style="--v:${AFF[aff][0]};--c:${AFF[aff][1]}">Affidabilità ${aff} <i></i></div>` : "")
    + corpo
    + `<div class="hp-es-disc">Valutazione indicativa, non una diagnosi: la decisione resta tua sul cavallo. Per zoppie o infezioni coinvolgi il veterinario.</div>
    <button type="button" class="hp-b v" onclick="hpPdf()"><svg class="hm-svg" viewBox="0 0 24 24"><path d="M12 3v12M7 10l5 5 5-5M5 21h14"/></svg>Scarica PDF (solo per te)</button>
    ${hpContesto && hpContesto.tipo === "cavallo" ? `<button type="button" class="hp-b o" onclick="hpCondividi(this)"><svg class="hm-svg" viewBox="0 0 24 24"><path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2zM22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/></svg>Condividi nel libretto di ${escapeHtml(hpContesto.nome)}</button>` : ""}
    <button type="button" class="hp-b r" onclick="hpElimina()"><svg class="hm-svg" viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/></svg>Elimina</button>`;
}
async function hpCreaPdf(){
  const JsPDF = await caricaJsPdf();
  const doc = new JsPDF({ unit: "mm", format: "a4" });
  const { sez, aff } = hpSezioni(hpFoto.testo);
  const pulito = t => String(t || "").replace(/\*\*|__|\*/g, "").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/[^\x20-\x7E -ÿ€’“”«»–—…]/g, "");
  let y = 18;
  doc.setFont("helvetica", "bold"); doc.setFontSize(17); doc.setTextColor(20, 72, 44); doc.text("Analisi foto · Hammer", 15, y); y += 7;
  doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(110, 95, 60);
  doc.text(pulito([hpContesto && hpContesto.tipo === "cavallo" ? hpContesto.nome : null, new Date().toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" }), aff ? "affidabilità " + aff : null].filter(Boolean).join(" · ")), 15, y); y += 6;
  try{
    const img = await new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = ko; i.src = hpFoto.url; });
    const w = 90, h = Math.min(90, w * img.height / img.width);
    doc.addImage(hpFoto.url, "JPEG", 15, y, h < w * img.height / img.width ? h * img.width / img.height : w, h); y += h + 6;
  }catch(e){}
  doc.setTextColor(40, 30, 10);
  Object.entries(sez).forEach(([t, righe]) => {
    if(y > 265){ doc.addPage(); y = 18; }
    doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.text(pulito(t), 15, y); y += 6;
    doc.setFont("helvetica", "normal"); doc.setFontSize(10.5);
    righe.forEach(r => { doc.splitTextToSize("• " + pulito(r), 180).forEach(l => { if(y > 280){ doc.addPage(); y = 18; } doc.text(l, 15, y); y += 5; }); });
    y += 2;
  });
  if(y > 268){ doc.addPage(); y = 18; }
  doc.setFontSize(9); doc.setTextColor(110, 95, 60);
  doc.splitTextToSize("Valutazione indicativa da foto, non una diagnosi: la decisione resta del maniscalco sul cavallo. Per zoppie o infezioni coinvolgere il veterinario. Generato con Equo.", 180).forEach(l => { doc.text(l, 15, y); y += 4.5; });
  const nome = "Equo_analisi-foto_" + String(hpContesto && hpContesto.tipo === "cavallo" ? hpContesto.nome : "cavallo").normalize("NFD").replace(/[^\w]+/g, "-") + "_" + isoLocale(new Date()) + ".pdf";
  return { doc, nome };
}
async function hpPdf(){
  try{ const { doc, nome } = await hpCreaPdf(); doc.save(nome); showToast("PDF salvato sul telefono"); }
  catch(e){ showToast("PDF non disponibile: " + (e.message || "riprova")); }
}
async function hpCondividi(btn){
  if(!hpContesto || hpContesto.tipo !== "cavallo") return;
  if(DEMO_MODE){ showToast("In demo il libretto non si aggiorna."); return; }
  if(!(await chiediSiNo(`Condividere nel libretto di ${hpContesto.nome}?`, "La vedranno anche il proprietario collegato e la scuderia dove sta il cavallo. Resta nello storico."))) return;
  btn.disabled = true;
  try{
    const { doc, nome } = await hpCreaPdf();
    const blob = doc.output("blob");
    let id = hpContesto.cv.id;
    if(!id){ ({ cavallo_cliente_id: id } = await DB.risolviCavalloPerIntervento(hpContesto.clienteId, hpContesto.cv)); hpContesto.cv.id = id; }
    if(!id){ showToast("Non riuscito, riprova."); return; }
    const path = `${currentUser.id}/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.pdf`;
    const up = await sb.storage.from("cavalli-allegati").upload(path, blob, { contentType: "application/pdf" });
    if(up.error){ showToast("Caricamento non riuscito: " + up.error.message); return; }
    const { data, error } = await sb.rpc("equo_aggiungi_allegato", { p_vista: "maniscalco", p_id: id, p_nome: nome, p_path: path, p_mime: "application/pdf", p_byte: blob.size });
    if(error || !data?.ok){ await sb.storage.from("cavalli-allegati").remove([path]); showToast((data && data.errore) || "Non riuscito, riprova."); return; }
    showToast(`Analisi nel libretto di ${hpContesto.nome}`);
    btn.textContent = "✓ Nel libretto";
    if(document.getElementById("cavpro-allegati") && typeof caricaAllegatiCavallo === "function") caricaAllegatiCavallo("cavpro-allegati", "maniscalco", hpContesto.cv);
  } finally { if(btn.textContent !== "✓ Nel libretto") btn.disabled = false; }
}
async function hpElimina(){
  if(!(await chiediSiNo("Eliminare questa analisi?", "Sparisce dalla chat di Hammer. Se l'hai condivisa nel libretto, l'allegato resta lì."))) return;
  if(!DEMO_MODE && currentUser){
    const { data } = await sb.from("ai_messaggi").select("id, ruolo, contenuto").eq("user_id", currentUser.id).eq("vista", vistaAi()).order("created_at", { ascending: false }).limit(2);
    const ultimi = data || [];
    if(ultimi.length === 2 && ultimi.some(m => m.ruolo === "user" && /^📷 Analisi foto/.test(m.contenuto || ""))){
      const { error } = await sb.from("ai_messaggi").delete().in("id", ultimi.map(m => m.id));
      if(error){ showToast("Non sono riuscito a eliminarla, riprova."); return; }
    }
  }
  [...document.querySelectorAll("#chat-messages .hp-foto-msg")].slice(-2).forEach(el => el.remove());
  hpFoto = { scatto: "laterale", url: null, testo: null, via: false };
  hpChiudiFoto();
  showToast("Analisi eliminata");
}

/* Schede di conferma per le azioni proposte dall'AI (evento, spesa, lezione, richiesta al maniscalco) */
const aiAzioniInAttesa = {};
const CAT_SPESA_LABEL = { pensione: "Pensione", mangime: "Mangime", veterinario: "Veterinario", maniscalco: "Maniscalco", attrezzatura: "Attrezzatura", altro: "Altro" };
const TIPO_MAN_LABEL = { ferratura: "Ferratura", mezza_ferratura: "Mezza ferratura", pareggio: "Pareggio", altro: "Altro" };
const ETICHETTA_CONFERMA_AI = {
  richiesta_maniscalco: () => "Invia richiesta",
  accetta_richiesta: () => "Accetta",
  rifiuta_richiesta: () => "Rifiuta",
  promemoria: x => x.collegato ? "Invia in chat" : "Copia testo",
  saldato: () => "Segna saldato",
};
// dopo un'azione di Hammer aggiorna le schermate del maniscalco già aperte
async function aggiornaViteManiscalco(clienteId){
  try{
    if(typeof renderAgendaSettimana === "function") await renderAgendaSettimana();
    if(typeof renderProDeadlines === "function") await renderProDeadlines();
    if(typeof renderIncassi === "function") await renderIncassi();
    if(clienteId && typeof currentClienteId !== "undefined" && currentClienteId === clienteId && typeof loadClienteInterventi === "function") await loadClienteInterventi(clienteId);
  } catch(e){ console.error("aggiornaViteManiscalco:", e); }
}
function renderAzioneAi(box, azione){
  if(azione.tipo === "evento") return renderEventProposal(box, azione.dati);
  const id = "azione-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6);
  aiAzioniInAttesa[id] = azione;
  const x = azione.dati;
  if(azione.tipo === "naviga"){
    // indicazioni stradali: nessuna conferma da salvare, il tocco apre la scelta delle mappe (resta riutilizzabile)
    const riga = x.indirizzo ? escapeHtml(x.indirizzo) : x.ricerca ? `Ricerca nelle mappe: ${escapeHtml(x.ricerca)}` : "Indirizzo da cercare: scegli il posto giusto";
    box.insertAdjacentHTML("beforeend", `
    <div class="chat-bubble ai event-proposal" id="${id}">
      <div class="event-proposal-title"><span class="fa-icon"><i class="fa-solid fa-location-dot"></i></span> Naviga verso ${escapeHtml(x.nome || "")}</div>
      <div class="event-proposal-row">${riga}</div>
      <div class="event-proposal-actions">
        <button class="btn btn-primary btn-sm btn-conferma" onclick="aiNaviga('${id}')">Naviga</button>
      </div>
    </div>`);
    box.scrollTop = box.scrollHeight;
    return;
  }
  let titolo = "", righe = [];
  if(azione.tipo === "spesa"){
    titolo = `Spesa · ${CAT_SPESA_LABEL[x.category] || escapeHtml(x.category)}`;
    righe = [`Importo: € ${Number(x.amount).toFixed(2)}`, `Data: ${formatDate(x.date)}`, x.horse_name ? `Cavallo: ${escapeHtml(x.horse_name)}` : "", x.notes ? escapeHtml(x.notes) : ""];
  } else if(azione.tipo === "lezione"){
    titolo = `Calendario · ${LEZIONE_TIPO_LABELS[x.tipo] || escapeHtml(x.tipo)}`;
    righe = [`Data: ${formatDate(x.data)}`, x.horse_name ? `Cavallo: ${escapeHtml(x.horse_name)}` : "", x.note ? escapeHtml(x.note) : ""];
  } else if(azione.tipo === "richiesta_maniscalco"){
    titolo = `Richiesta a ${escapeHtml(x.nome_maniscalco || "maniscalco")}`;
    righe = [`${escapeHtml(x.tipo === "altro" && x.tipo_altro ? x.tipo_altro : (TIPO_MAN_LABEL[x.tipo] || x.tipo))}${x.horse_name ? " · " + escapeHtml(x.horse_name) : ""}`, `Data preferita: ${formatDate(x.data)}${x.ora ? " ore " + escapeHtml(x.ora) : ""}`, x.note ? escapeHtml(x.note) : ""];
  } else if(azione.tipo === "appuntamento"){
    // --- Hammer (maniscalco) ---
    const nomeCv = x.cavallo?.nome || x.nuovo_cavallo_nome;
    titolo = `Agenda · ${escapeHtml(x.tipo === "altro" && x.tipo_altro ? x.tipo_altro : (TIPO_MAN_LABEL[x.tipo] || x.tipo))}`;
    righe = [`${escapeHtml(x.nome_cliente || "")}${nomeCv ? " · " + escapeHtml(nomeCv) : ""}${x.nuovo_cavallo_nome ? " (nuovo cavallo)" : ""}`,
      `${formatDataBreve(x.data)}${x.ora ? " ore " + escapeHtml(x.ora) : ""}`,
      x.importo != null ? `<span class="solo-incassi">Importo: € ${Number(x.importo).toFixed(2)} · ${x.stato_pagamento === "saldato" ? "saldato" : "da saldare"}</span>` : "", x.note ? escapeHtml(x.note) : ""];
  } else if(azione.tipo === "accetta_richiesta" || azione.tipo === "rifiuta_richiesta"){
    const acc = azione.tipo === "accetta_richiesta";
    titolo = acc ? "Accetta richiesta" : "Rifiuta richiesta";
    righe = [`${escapeHtml(x.nome_cliente || "")}${x.cavallo ? " · " + escapeHtml(x.cavallo) : ""}`,
      `${escapeHtml(x.tipo_ferratura === "altro" && x.tipo_altro ? x.tipo_altro : (TIPO_MAN_LABEL[x.tipo_ferratura] || x.tipo_ferratura || ""))} · ${formatDataBreve(x.data_intervento)}${x.ora ? " ore " + escapeHtml(x.ora) : ""}`,
      acc && x.importo != null ? `Importo: € ${Number(x.importo).toFixed(2)}` : "",
      acc && x.invia_riepilogo ? "Poi apro la chat con il PDF di riepilogo" : "",
      !acc ? "Il cliente riceve un messaggio per trovare un'altra data" : ""];
  } else if(azione.tipo === "promemoria"){
    titolo = `Messaggio a ${escapeHtml(x.nome_cliente || "")}`;
    righe = [`<span style="white-space:pre-wrap">${escapeHtml(x.testo || "")}</span>`, x.collegato ? "" : "<span class=\"muted\">Cliente non su Equo: copia il testo e mandalo tu.</span>"];
  } else if(azione.tipo === "saldato"){
    titolo = `Segna come saldato · € ${Number(x.totale || 0).toFixed(2)}`;
    righe = (x.righe || []).map(r => escapeHtml(r));
  } else return;
  box.insertAdjacentHTML("beforeend", `
    <div class="chat-bubble ai event-proposal" id="${id}">
      <div class="event-proposal-title">${titolo}</div>
      ${righe.filter(Boolean).map(r => `<div class="event-proposal-row">${r}</div>`).join("")}
      <div class="event-proposal-actions">
        <button class="btn btn-ghost btn-sm" onclick="cancelEventProposal('${id}')">Annulla</button>
        <button class="btn btn-primary btn-sm btn-conferma" onclick="confermaAzioneAi('${id}')">${ETICHETTA_CONFERMA_AI[azione.tipo] ? ETICHETTA_CONFERMA_AI[azione.tipo](x) : "Conferma"}</button>
      </div>
    </div>`);
  box.scrollTop = box.scrollHeight;
}
async function aiNaviga(id){
  const x = aiAzioniInAttesa[id]?.dati;
  if(!x) return;
  if(x.indirizzo) return wgMostraMappe({ nome: x.nome }, x.indirizzo);
  if(x.cliente_mascalcia_id){
    if(!wgClienteDi(x.cliente_mascalcia_id) && typeof loadClientiMascalcia === "function") await loadClientiMascalcia();
    if(wgClienteDi(x.cliente_mascalcia_id)) return wgNaviga(x.cliente_mascalcia_id);
  }
  wgMostraMappe({ nome: x.nome }, x.ricerca || x.nome, "Ricerca per nome: controlla nelle mappe che sia il posto giusto.");
}
async function confermaAzioneAi(id){
  const azione = aiAzioniInAttesa[id];
  const el = document.getElementById(id);
  if(!azione || !el) return;
  el.querySelectorAll("button").forEach(b => b.disabled = true);
  const x = azione.dati;
  let error = null, fatto = "";
  if(azione.tipo === "spesa"){
    const horse_id = x.horse_id || currentHorseId || (horses[0] ? horses[0].id : null);
    ({ error } = await DB.insertExpense({ horse_id, category: x.category, amount: x.amount, date: x.date, notes: x.notes }));
    fatto = "✓ Spesa registrata.";
    if(!error){ if(typeof loadExpenses === "function" && document.getElementById("expenses-list")) loadExpenses(); if(typeof loadExpensesSummary === "function") loadExpensesSummary(); }
  } else if(azione.tipo === "lezione"){
    ({ error } = await DB.insertLezione({ horse_id: x.horse_id, data: x.data, tipo: x.tipo, note: x.note }));
    fatto = "✓ Aggiunto al calendario.";
    if(!error && typeof loadLezioni === "function" && document.getElementById("lezioni-list")) loadLezioni();
  } else if(azione.tipo === "richiesta_maniscalco"){
    ({ error } = await DB.richiediAppuntamento({ cliente_mascalcia_id: x.cliente_mascalcia_id, horse_id: x.horse_id, nome_cavallo: x.nome_cavallo, tipo: x.tipo, tipo_altro: x.tipo_altro, data: x.data, ora: x.ora, note: x.note }));
    fatto = `✓ Richiesta inviata a ${escapeHtml(x.nome_maniscalco || "il maniscalco")}: ti risponde in chat.`;
  } else if(azione.tipo === "appuntamento"){
    let cavallo_cliente_id = null, horse_id = null;
    if(x.nuovo_cavallo_nome){
      const r = await DB.insertCavalloCliente({ cliente_mascalcia_id: x.cliente_mascalcia_id, nome: x.nuovo_cavallo_nome });
      error = r.error; cavallo_cliente_id = r.data?.id || null;
    } else if(x.cavallo){
      ({ cavallo_cliente_id, horse_id } = await DB.risolviCavalloPerIntervento(x.cliente_mascalcia_id, x.cavallo));
    }
    if(!error){
      const futuro = new Date(x.data + "T" + (x.ora || "00:00")).getTime() > Date.now();
      const giorni = (await giorniRichiamoSuggeriti(x.tipo, cavallo_cliente_id, horse_id)).giorni;
      ({ error } = await DB.insertInterventoMascalcia({ cliente_mascalcia_id: x.cliente_mascalcia_id, cavallo_cliente_id, horse_id,
        tipo_ferratura: x.tipo, tipo_altro: x.tipo_altro, misura_sistema: null, numero_ferro: null, quantita_ferri: null,
        data_intervento: x.data, ora: x.ora, stato: futuro ? "programmato" : "fatto",
        prossima_scadenza: giorni ? aggiungiGiorniIso(x.data, giorni) : null, importo: x.importo, stato_pagamento: x.stato_pagamento || "da_saldare", note: x.note }));
    }
    fatto = "✓ Salvato in agenda. Misura e numero di ferri li aggiungi aprendo l'appuntamento.";
    if(!error) await aggiornaViteManiscalco(x.cliente_mascalcia_id);
  } else if((azione.tipo === "accetta_richiesta" || azione.tipo === "rifiuta_richiesta") && x.gruppo_id){
    // richiesta di una struttura Equo Scuderia: si conferma/rifiuta tutto il gruppo con la doppia conferma
    const r = await sb.rpc("pro_azione_appuntamento_struttura", { p_gruppo_id: x.gruppo_id, p_azione: azione.tipo === "accetta_richiesta" ? "conferma" : "rifiuta" });
    error = r.error || (r.data && !r.data.ok ? { message: r.data.errore } : null);
    if(!error) fatto = azione.tipo === "accetta_richiesta" ? "✓ Confermato: la scuderia riceve l'avviso in chat." : "✓ Richiesta rifiutata: la scuderia riceve un messaggio in chat.";
  } else if(azione.tipo === "accetta_richiesta"){
    const giorni = TIPO_FERRATURA_INTERVALLI[x.tipo_ferratura] ? (await giorniRichiamoSuggeriti(x.tipo_ferratura, x.cavallo_cliente_id, x.horse_id, x.id)).giorni : null;
    const payload = { stato: x.data_intervento >= isoLocale(new Date()) ? "programmato" : "fatto", prossima_scadenza: giorni ? aggiungiGiorniIso(x.data_intervento, giorni) : null };
    if(x.importo != null) payload.importo = x.importo;
    ({ error } = await DB.updateInterventoMascalcia(x.id, payload));
    if(!error){
      await DB.insertMessaggioMascalcia({ cliente_mascalcia_id: x.cliente_mascalcia_id, tipo: "testo",
        testo: testoRichiesta("✅ Appuntamento confermato", { tipo_ferratura: x.tipo_ferratura, tipo_altro: x.tipo_altro, data_intervento: x.data_intervento, ora: x.ora }, x.cavallo || "") });
      fatto = "✓ Richiesta accettata: il cliente riceve la conferma in chat.";
      await aggiornaViteManiscalco(x.cliente_mascalcia_id);
      if(x.invia_riepilogo){
        const ev = (await DB.listInterventiPeriodo(x.data_intervento, x.data_intervento)).find(e => e.id === x.id);
        if(ev){ closeAiSheet(); await inviaEventoInChat(ev); }
      }
    }
  } else if(azione.tipo === "rifiuta_richiesta"){
    ({ error } = await DB.updateInterventoMascalcia(x.id, { stato: "rifiutato" }));
    if(!error){
      await DB.insertMessaggioMascalcia({ cliente_mascalcia_id: x.cliente_mascalcia_id, tipo: "testo",
        testo: testoRichiesta("❌ Non riesco per questa richiesta", { tipo_ferratura: x.tipo_ferratura, tipo_altro: x.tipo_altro, data_intervento: x.data_intervento, ora: x.ora, note: x.note }, x.cavallo || "") + " Scrivimi qui per trovare un'altra data." });
      fatto = "✓ Richiesta rifiutata: il cliente riceve un messaggio in chat.";
      await aggiornaViteManiscalco(x.cliente_mascalcia_id);
    }
  } else if(azione.tipo === "promemoria"){
    if(x.collegato){
      ({ error } = await DB.insertMessaggioMascalcia({ cliente_mascalcia_id: x.cliente_mascalcia_id, tipo: "testo", testo: x.testo }));
      fatto = `✓ Messaggio inviato a ${escapeHtml(x.nome_cliente || "")}.`;
    } else {
      try{ await navigator.clipboard.writeText(x.testo); fatto = `✓ Testo copiato: incollalo nel messaggio a ${escapeHtml(x.nome_cliente || "")}.`; }
      catch(e){ error = { message: "copia non riuscita, tieni premuto sul testo per copiarlo" }; }
    }
  } else if(azione.tipo === "saldato"){
    for(const idInt of (x.ids || [])){
      const r = await DB.updateInterventoMascalcia(idInt, { stato_pagamento: "saldato" });
      if(r.error){ error = r.error; break; }
    }
    fatto = `✓ Segnati come saldati (€ ${Number(x.totale || 0).toFixed(2)}).`;
    if(!error) await aggiornaViteManiscalco(null);
  }
  if(error){
    el.querySelectorAll("button").forEach(b => b.disabled = false);
    showToast("Non sono riuscito a salvare: " + (error.message || "riprova"));
    return;
  }
  delete aiAzioniInAttesa[id];
  el.innerHTML = `<div class="event-proposal-title">${fatto}</div>`;
  el.classList.remove("event-proposal");
}

async function sendChatMessage(opz){
  opz = opz && typeof opz === "object" && !opz.type ? opz : {};
  const input = document.getElementById("chat-input");
  const text = (opz.testo != null ? String(opz.testo) : input.value).trim();
  const modalita = opz.modalita || (hpCasoAttivo ? "caso" : null);
  const allegati = aiAllegati.slice();
  if(!text && !allegati.length) return;
  const box = document.getElementById("chat-messages");
  const thumbs = allegati.length ? `<div class="ai-thumbs">${allegati.map(a => a.anteprima ? `<img src="${a.anteprima}" alt="">` : `<span class="ai-allegato" style="width:56px;height:56px">PDF</span>`).join("")}</div>` : "";
  box.insertAdjacentHTML("beforeend", `<div class="chat-bubble user">${thumbs}${escapeHtml(text)}</div>`);
  input.value = "";
  aiAllegati = []; renderAllegatiAi();
  box.scrollTop = box.scrollHeight;
  const thinkingId = "think-" + Date.now();
  box.insertAdjacentHTML("beforeend", `<div class="chat-bubble ai" id="${thinkingId}">…</div>`);
  box.scrollTop = box.scrollHeight;

  if(DEMO_MODE){
    setTimeout(() => {
      const proposed = detectDemoEvent(text);
      if(proposed){
        document.getElementById(thinkingId).textContent =
          `Ho preparato una proposta di evento per ${proposed.horse_name}. Confermi? (demo — nessuna chiamata AI reale)`;
        renderEventProposal(box, proposed);
      } else {
        document.getElementById(thinkingId).textContent =
          "[Risposta demo] In app vera qui risponde l'assistente AI collegato a Claude. Prova a scrivere qualcosa come \"segna un vaccino ad Aurora oggi\" per vedere la proposta di evento.";
      }
      box.scrollTop = box.scrollHeight;
    }, 500);
    return;
  }
  try{
    const res = await fetch("/.netlify/functions/agent", {
      method: "POST",
      headers: await authHeaders(),
      body: JSON.stringify({ message: text, vista: vistaAi(), allegati: allegati.map(a => ({ media_type: a.media_type, data: a.data })), posizione: (typeof meteoUltimaPos === "function" ? meteoUltimaPos() : null),
        modalita, contesto_app: agenteAiHammer() && hpContesto ? hpContesto.testo : null })
    });
    const data = await res.json().catch(() => ({}));
    const bolla = document.getElementById(thinkingId);
    if(res.status === 413){
      bolla.textContent = "Allegati troppo pesanti: prova con meno foto o un PDF più leggero.";
    } else if(res.status === 401){
      bolla.textContent = `Sessione scaduta: esci e rientra per usare ${nomeAgenteAi()}.`;
    } else if(data.limite_raggiunto && agenteAiHammer()){
      bolla.outerHTML = hpLimiteHtml(data);
    } else if(data.limite_raggiunto){
      const alGiorno = data.uso.periodo === "giorno" || (!data.uso.periodo && data.uso.piano !== "premium");
      bolla.innerHTML = `<p>Hai usato tutti i <strong>${data.uso.limite} messaggi AI</strong> di ${alGiorno ? "oggi" : "questo mese"}.</p>` +
        (!alGiorno ? "<p>Il contatore riparte il 1° del mese.</p>" :
          `<p>Il contatore riparte a mezzanotte. Con Premium ne hai 500 al mese, più cavalli illimitati e promemoria automatici.</p><button class="btn btn-primary btn-sm ai-limit-cta" onclick="closeAiSheet();togglePiano()">Passa a Premium</button>`);
    } else {
      const scelte = hpEstraiScelte(data.reply || "");
      bolla.innerHTML = formattaRispostaAi(data.reply || "Non sono riuscito a rispondere, riprova.");
      if(modalita === "caso"){
        if(scelte.length) bolla.insertAdjacentHTML("afterend", `<div class="hp-scelte">${scelte.map(t => `<button type="button" onclick="hpScelta(this)">${escapeHtml(t)}</button>`).join("")}</div>`);
        else hpFineCaso(true);
      }
      if(Array.isArray(data.azioni) && data.azioni.length){
        data.azioni.forEach(a => renderAzioneAi(box, a));
      } else if(data.proposedEvent && data.proposedEvent.horse_name && data.proposedEvent.type && data.proposedEvent.date){
        renderEventProposal(box, data.proposedEvent);
      }
    }
    if(data.uso) aggiornaNotaUsoAi(data.uso);
  } catch(e){
    document.getElementById(thinkingId).textContent = "Errore di connessione, riprova.";
  }
  box.scrollTop = box.scrollHeight;
}

function renderEventProposal(box, proposed){
  const id = "proposal-" + Date.now();
  const label = EVENT_LABELS[proposed.type] || proposed.type;
  box.insertAdjacentHTML("beforeend", `
    <div class="chat-bubble ai event-proposal" id="${id}">
      <div class="event-proposal-title">${escapeHtml(label)} · ${escapeHtml(proposed.horse_name)}</div>
      <div class="event-proposal-row">Data: ${formatDate(proposed.date)}</div>
      ${proposed.next_due_date ? `<div class="event-proposal-row">Prossima scadenza: ${formatDate(proposed.next_due_date)}</div>` : ""}
      ${proposed.notes ? `<div class="event-proposal-row">${escapeHtml(proposed.notes)}</div>` : ""}
      <div class="event-proposal-actions">
        <button class="btn btn-ghost btn-sm" onclick="cancelEventProposal('${id}')">Annulla</button>
        <button class="btn btn-primary btn-sm btn-conferma" onclick="confirmEventProposal(${jsArg(id)}, ${jsArg(proposed)})">Conferma</button>
      </div>
    </div>
  `);
  box.scrollTop = box.scrollHeight;
}

function cancelEventProposal(id){
  const el = document.getElementById(id);
  if(!el) return;
  el.innerHTML = `<div class="event-proposal-title">Proposta annullata.</div>`;
  el.classList.remove("event-proposal");
}

async function confirmEventProposal(id, proposed){
  const el = document.getElementById(id);
  const horse = horses.find(h => (h.name || "").toLowerCase() === (proposed.horse_name || "").toLowerCase());
  if(!horse){
    if(el) el.innerHTML = `<div class="event-proposal-title">Non trovo il cavallo "${escapeHtml(proposed.horse_name)}" — aggiungilo prima da Cavalli.</div>`;
    return;
  }
  const { error } = await DB.insertEvent({
    horse_id: horse.id,
    type: proposed.type,
    date: proposed.date,
    next_due_date: proposed.next_due_date || null,
    notes: proposed.notes || null,
  });
  if(error){
    if(el) el.innerHTML = `<div class="event-proposal-title">Errore nel salvataggio, riprova da Cavalli.</div>`;
    return;
  }
  if(el){
    el.innerHTML = `<div class="event-proposal-title">✓ Evento salvato per ${escapeHtml(horse.name)}.</div>`;
    el.classList.remove("event-proposal");
  }
  if(currentHorseId === horse.id) await loadHorseEvents(horse.id);
  await loadDeadlines();
}

