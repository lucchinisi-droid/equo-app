// Equo Scuderia · sezione CLIENTI (3/11/2026 · SQL 37) · script normale: le funzioni sono globali
// Allievi, genitori e proprietari come clienti veri, anche senza app (salva_cliente).
// Telefono, email, data di nascita e referente stanno in scuderia_clienti_dati: li vedono solo admin e livelli 2 e 3
// (regola nel database: puo_vedere_clienti). Un minore deve avere un genitore o referente.
const RUOLI_CLIENTE = ["allievo", "proprietario"];
let clientiDati = {};
const clientiFiltro = { q: "", ruolo: "" };
let editingClienteId = null;
let clienteDaPacchetto = false;

function puoVedereClienti(){ return !!currentMembro && (currentMembro.ruolo === "admin" || ["admin", "2", "3"].includes(String(currentMembro.livello || ""))); }
function clientiElenco(){ return (teamList || []).filter(m => RUOLI_CLIENTE.includes(m.ruolo)); }
function etaDi(d){
  if(!d) return null;
  const n = new Date(d + "T12:00"), o = new Date(); let e = o.getFullYear() - n.getFullYear();
  if(o.getMonth() < n.getMonth() || (o.getMonth() === n.getMonth() && o.getDate() < n.getDate())) e--;
  return e;
}
function nomeCliente(id){ const m = (teamList || []).find(x => x.id === id); return m ? (m.nome_visualizzato || "Cliente") : "—"; }

async function caricaClienti(){
  const card = document.getElementById("card-clienti"); if(!card) return;
  const ok = puoVedereClienti();
  card.style.display = ok ? "block" : "none";
  const no = document.getElementById("clienti-non-autorizzato"); if(no) no.style.display = ok ? "none" : "block";
  document.querySelectorAll('.nav-item[data-module="clienti"]').forEach(b => { b.style.display = ok ? "" : "none"; });
  if(!ok) return;
  if(DEMO_MODE){
    if(!demoState.clientiDati) demoState.clientiDati = { m3: { membro_id: "m3", telefono: "333 1112223", email: "giulia@esempio.it", data_nascita: "2001-06-12", referente_id: null, note: "", consenso_privacy_il: isoLoc(new Date()) } };
    clientiDati = demoState.clientiDati;
  } else {
    const { data, error } = await sb.from("scuderia_clienti_dati").select("membro_id, telefono, email, data_nascita, referente_id, note, consenso_privacy_il").eq("centro_id", currentCentro.id);
    clientiDati = {};
    if(!error) (data || []).forEach(r => { clientiDati[r.membro_id] = r; });
  }
  renderClienti();
}

function filtraClienti(){
  clientiFiltro.q = (document.getElementById("clienti-cerca")?.value || "").trim().toLowerCase();
  clientiFiltro.ruolo = document.getElementById("clienti-ruolo")?.value || "";
  renderClienti();
}

function renderClienti(){
  const body = document.getElementById("clienti-table-body"); if(!body) return;
  const tutti = clientiElenco();
  const q = clientiFiltro.q;
  const lista = tutti.filter(m => {
    const d = clientiDati[m.id] || {};
    if(clientiFiltro.ruolo === "provvisori"){ if(!m.provvisorio) return false; }
    else if(clientiFiltro.ruolo && m.ruolo !== clientiFiltro.ruolo) return false;
    if(!q) return true;
    return (m.nome_visualizzato || "").toLowerCase().includes(q) || (d.telefono || "").replace(/\s/g, "").includes(q.replace(/\s/g, "")) || (d.email || "").includes(q);
  }).sort((a, b) => (a.nome_visualizzato || "").localeCompare(b.nome_visualizzato || "", "it"));
  const lim = (typeof pianoCentro !== "undefined" && pianoCentro) ? pianoCentro.clienti : null;
  // le schede provvisorie non contano nel limite del pacchetto (SQL 48)
  const definitivi = tutti.filter(m => !m.provvisorio).length, provv = tutti.length - definitivi;
  document.getElementById("clienti-count").textContent = (lim ? `${definitivi} di ${lim}` : definitivi) + (provv ? ` · ${provv} da completare` : "");
  aggiornaBadgeClienti();
  document.getElementById("clienti-empty").style.display = tutti.length ? "none" : "block";
  body.innerHTML = lista.map(m => {
    const d = clientiDati[m.id] || {}, eta = etaDi(d.data_nascita);
    const contatti = [d.telefono ? `<a href="tel:${escapeHtml(d.telefono.replace(/\s/g, ""))}">${escapeHtml(d.telefono)}</a>` : "", d.email ? `<a href="mailto:${escapeHtml(d.email)}">${escapeHtml(d.email)}</a>` : ""].filter(Boolean).join("<br>");
    return `<tr>
      <td>${escapeHtml(m.nome_visualizzato || "Cliente")}${m.provvisorio ? ' <span class="badge-pill badge-yellow" title="Scheda nata dal nome scritto nel cavallo: aggiungi telefono o email">da completare</span>' : ""}${m.user_id ? ' <span class="badge-pill badge-green" title="Usa l\'app Equo">app</span>' : ""}${d.consenso_privacy_il ? "" : ' <span class="badge-pill badge-gray" title="Consenso privacy non registrato">senza consenso</span>'}</td>
      <td>${escapeHtml(RUOLO_LABELS[m.ruolo] || m.ruolo)}</td>
      <td style="font-size:13px">${contatti || '<span style="color:var(--muted)">—</span>'}</td>
      <td>${eta == null ? '<span style="color:var(--muted)">—</span>' : eta + " anni" + (eta < 18 ? ' <span class="badge-pill badge-yellow">minore</span>' : "")}${d.referente_id ? `<div style="color:var(--muted);font-size:12px">ref. ${escapeHtml(nomeCliente(d.referente_id))}</div>` : ""}</td>
      <td style="text-align:right;white-space:nowrap">
        ${m.user_id ? `<button class="btn btn-ghost btn-sm" onclick="chattaConMembro('${m.id}')" title="Chatta"><i class="fa-solid fa-comment-dots"></i></button>` : ""}
        <button class="btn btn-ghost btn-sm" onclick="openClienteForm('${m.id}')" title="Scheda cliente"><i class="fa-solid fa-pen"></i></button></td></tr>`;
  }).join("");
}

function clienteNascitaCambiata(){
  const eta = etaDi(document.getElementById("cli-nascita").value);
  document.getElementById("cli-ref-obbl").style.display = eta != null && eta < 18 ? "inline" : "none";
}

async function clienteCollegati(id){
  const box = document.getElementById("cli-collegati");
  if(!id){ box.style.display = "none"; return; }
  try{
    await Promise.all([
      (typeof lezioniList !== "undefined" && lezioniList.length) || typeof loadLezioni !== "function" ? null : loadLezioni(),
      (typeof pacchettiList !== "undefined" && pacchettiList.length) || typeof loadPacchetti !== "function" ? null : loadPacchetti(),
      (typeof cavalliList !== "undefined" && cavalliList.length) || typeof loadCavalli !== "function" ? null : loadCavalli(),
    ]);
  }catch(_){}
  const oggi = isoLoc(new Date());
  const lez = (typeof lezioniList !== "undefined" ? lezioniList : []).filter(l => l.allievo_id === id);
  const prossime = lez.filter(l => l.data >= oggi && l.stato !== "annullata").length;
  const pac = (typeof pacchettiList !== "undefined" ? pacchettiList : []).filter(p => p.membro_id === id);
  const cav = (typeof cavalliList !== "undefined" ? cavalliList : []).filter(c => c.proprietario_membro_id === id);
  box.innerHTML = `<i class="fa-solid fa-link"></i> ${lez.length} lezion${lez.length === 1 ? "e" : "i"} (${prossime} in programma) · ${pac.length} pacchett${pac.length === 1 ? "o" : "i"}${cav.length ? " · cavall" + (cav.length === 1 ? "o" : "i") + ": " + cav.map(c => escapeHtml(c.nome)).join(", ") : ""}`;
  box.style.display = "block";
}

function openClienteForm(id, daPacchetto){
  if(!puoVedereClienti()){ showToast("Solo l'amministratore e lo staff di livello 2 e 3 gestiscono i clienti."); return; }
  const lim = (typeof pianoCentro !== "undefined" && pianoCentro) ? pianoCentro.clienti : null;
  if(!id && lim && clientiElenco().filter(x => !x.provvisorio).length >= lim){ showToast(`Hai raggiunto i ${lim} clienti del tuo pacchetto: per aggiungerne altri serve il pacchetto superiore.`); return; }
  const m = id ? (teamList || []).find(x => x.id === id) : null;
  const d = (m && clientiDati[m.id]) || {};
  editingClienteId = m ? m.id : null;
  clienteDaPacchetto = !!daPacchetto;
  document.getElementById("cliente-error").style.display = "none";
  document.getElementById("modal-cliente-title").textContent = m ? "Scheda cliente" : "Nuovo cliente";
  document.getElementById("cli-nome").value = m?.nome_visualizzato || "";
  document.getElementById("cli-ruolo").value = m && RUOLI_CLIENTE.includes(m.ruolo) ? m.ruolo : "allievo";
  document.getElementById("cli-telefono").value = d.telefono || "";
  document.getElementById("cli-email").value = d.email || "";
  document.getElementById("cli-nascita").value = d.data_nascita || "";
  document.getElementById("cli-note").value = d.note || "";
  document.getElementById("cli-consenso").checked = !!d.consenso_privacy_il;
  document.getElementById("cli-consenso-data").textContent = d.consenso_privacy_il ? "(registrato il " + formatDate(d.consenso_privacy_il) + ")" : "";
  // referente: un altro cliente maggiorenne (o senza data di nascita)
  const adulti = clientiElenco().filter(x => x.id !== editingClienteId && !((etaDi(clientiDati[x.id]?.data_nascita) ?? 99) < 18))
    .sort((a, b) => (a.nome_visualizzato || "").localeCompare(b.nome_visualizzato || "", "it"));
  document.getElementById("cli-referente").innerHTML = `<option value="">— nessuno —</option>` + adulti.map(x => `<option value="${x.id}">${escapeHtml(x.nome_visualizzato || "Cliente")}</option>`).join("");
  document.getElementById("cli-referente").value = d.referente_id || "";
  clienteNascitaCambiata();
  clienteCollegati(editingClienteId);
  const prov = document.getElementById("cli-provvisorio");
  if(prov){
    const cav = m?.provvisorio ? (typeof cavalliList !== "undefined" ? cavalliList : []).filter(c => c.proprietario_membro_id === m.id).map(c => c.nome) : [];
    prov.style.display = m?.provvisorio ? "block" : "none";
    if(m?.provvisorio) prov.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> <b>Scheda provvisoria</b>${cav.length ? ", nata dal cavallo " + cav.map(escapeHtml).join(", ") : ""}. Aggiungi almeno <b>telefono o email</b> per completarla: poi potrai fargli le ricevute ASD.`;
  }
  openModal("modal-cliente");
}

const CLIENTE_ERRORI = {
  MINORE_SENZA_REFERENTE: "È minorenne: scegli il genitore o referente (se non c'è ancora, crealo prima come cliente).",
  NOME_MANCANTE: "Scrivi nome e cognome.",
  NON_AUTORIZZATO: "Solo l'amministratore e lo staff di livello 2 e 3 gestiscono i clienti.",
  NON_E_UN_CLIENTE: "Questa persona fa parte dello staff: si modifica dal riquadro Team.",
  scuderia_clienti_dati_email_check: "L'email non sembra valida.",
  "clienti, il massimo": "Hai raggiunto il numero di clienti del tuo pacchetto: per aggiungerne altri serve il pacchetto superiore.",
};

async function saveCliente(){
  const errBox = document.getElementById("cliente-error"); errBox.style.display = "none";
  const v = {
    nome: document.getElementById("cli-nome").value.trim(), ruolo: document.getElementById("cli-ruolo").value,
    telefono: document.getElementById("cli-telefono").value.trim(), email: document.getElementById("cli-email").value.trim().toLowerCase(),
    nascita: document.getElementById("cli-nascita").value || null, referente: document.getElementById("cli-referente").value || null,
    note: document.getElementById("cli-note").value.trim(), consenso: document.getElementById("cli-consenso").checked,
  };
  const errore = (k) => { errBox.textContent = CLIENTE_ERRORI[k] || k; errBox.style.display = "block"; };
  if(!v.nome) return errore("NOME_MANCANTE");
  if(v.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.email)) return errore("scuderia_clienti_dati_email_check");
  const eta = etaDi(v.nascita);
  if(eta != null && eta < 18 && !v.referente) return errore("MINORE_SENZA_REFERENTE");
  let id = editingClienteId;
  try{
    if(DEMO_MODE){
      if(!id){ id = "m" + (demoIdCounter++ + 500); demoState.membri.push({ id, user_id: null, ruolo: v.ruolo, nome_visualizzato: v.nome, livello: "1", permessi: {} }); }
      else { const m = demoState.membri.find(x => x.id === id); if(m){ m.nome_visualizzato = v.nome; m.ruolo = v.ruolo; } }
      const prima = demoState.clientiDati[id]?.consenso_privacy_il;
      demoState.clientiDati[id] = { membro_id: id, telefono: v.telefono || null, email: v.email || null, data_nascita: v.nascita, referente_id: v.referente, note: v.note || null, consenso_privacy_il: v.consenso ? (prima || isoLoc(new Date())) : null };
      teamList = demoState.membri;
    } else {
      const { data, error } = await sb.rpc("salva_cliente", { p_centro: currentCentro.id, p_membro: id, p_ruolo: v.ruolo, p_nome: v.nome,
        p_telefono: v.telefono || null, p_email: v.email || null, p_data_nascita: v.nascita, p_referente: v.referente, p_note: v.note || null, p_consenso: v.consenso });
      if(error) throw error;
      id = data;
      await loadTeam();
    }
  }catch(err){
    const msg = err?.message || "";
    const k = Object.keys(CLIENTE_ERRORI).find(x => msg.includes(x));
    return errore(k || (/salva_cliente|schema cache/.test(msg) ? "Manca un aggiornamento del database (SQL 37): avvisa l'assistenza." : msg || "Errore nel salvataggio."));
  }
  renderTeam();
  await caricaClienti();
  closeModal("modal-cliente");
  showToast(editingClienteId ? "Cliente aggiornato." : "Cliente aggiunto.");
  if(clienteDaPacchetto && typeof pacchettoScegliCliente === "function") pacchettoScegliCliente(id);
  clienteDaPacchetto = false;
}


// ── Schede provvisorie (9/11/2026 · SQL 48) ──────────────────────────────────
// Contatore giallo accanto a «Clienti» nel menu: schede nate dal nome del proprietario scritto nel cavallo.
function aggiornaBadgeClienti(){
  const b = document.getElementById("clienti-nav-badge"); if(!b) return;
  const n = puoVedereClienti() ? clientiElenco().filter(m => m.provvisorio).length : 0;
  b.textContent = n; b.style.display = n ? "" : "none";
  b.title = n === 1 ? "1 scheda cliente da completare" : n + " schede clienti da completare";
}
// Campo «Proprietario» nella scheda del cavallo: propone i clienti già presenti mentre si scrive
// («rossi m» trova «Mario Rossi»). Se non ce n'è nessuno, avvisa che nascerà una scheda provvisoria.
function parolePersona(s){ return (s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").split(" ").filter(Boolean); }
function propCavReset(){
  const box = document.getElementById("cav-prop-sugg"), hint = document.getElementById("cav-prop-hint");
  if(box) box.style.display = "none";
  if(hint) hint.innerHTML = "";
}
function propCavChiudi(){ const box = document.getElementById("cav-prop-sugg"); if(box) box.style.display = "none"; }
function propCavSuggerisci(){
  const inp = document.getElementById("cav-proprietario"), box = document.getElementById("cav-prop-sugg"), hint = document.getElementById("cav-prop-hint");
  if(!inp || !box || !hint) return;
  const clienti = clientiElenco();
  const scelto = inp.dataset.membroId ? clienti.find(m => m.id === inp.dataset.membroId) : null;
  if(inp.dataset.membroId && (!scelto || (scelto.nome_visualizzato || "") !== inp.value.trim())) inp.dataset.membroId = "";
  const q = parolePersona(inp.value);
  if(!q.length){ propCavReset(); return; }
  if(inp.dataset.membroId){ box.style.display = "none"; hint.innerHTML = '<i class="fa-solid fa-link"></i> Collegato alla scheda cliente.'; return; }
  const lista = clienti.filter(m => { const t = parolePersona(m.nome_visualizzato); return q.every(w => t.some(x => x.startsWith(w))); })
    .sort((a, b) => (a.nome_visualizzato || "").localeCompare(b.nome_visualizzato || "", "it")).slice(0, 6);
  box.innerHTML = lista.map(m => `<button type="button" onmousedown="event.preventDefault();propCavScegli('${m.id}')">${escapeHtml(m.nome_visualizzato || "Cliente")}${m.provvisorio ? ' <span class="badge-pill badge-yellow">da completare</span>' : ""}${m.user_id ? ' <span class="badge-pill badge-green">app</span>' : ""}</button>`).join("");
  box.style.display = lista.length ? "block" : "none";
  const chiave = [...q].sort().join(" ");
  const uguale = clienti.some(m => [...parolePersona(m.nome_visualizzato)].sort().join(" ") === chiave);
  const tipo = document.getElementById("cav-tipo-proprieta")?.value;
  hint.innerHTML = uguale ? '<i class="fa-solid fa-link"></i> Salvando si collega al cliente con questo nome.'
    : tipo === "proprieta" ? ""
    : '<i class="fa-solid fa-user-plus"></i> Non è tra i clienti: salvando creiamo una scheda cliente provvisoria da completare.';
}
function propCavScegli(id){
  const m = clientiElenco().find(x => x.id === id), inp = document.getElementById("cav-proprietario"); if(!m || !inp) return;
  inp.value = m.nome_visualizzato || "";
  inp.dataset.membroId = id;
  propCavSuggerisci();
}

// aprendo la sezione si ricaricano i dati (team compreso: un cliente può essersi collegato con l'app)
quandoApriSezione(function(k){ if(k === "clienti") loadTeam().then(caricaClienti); });
