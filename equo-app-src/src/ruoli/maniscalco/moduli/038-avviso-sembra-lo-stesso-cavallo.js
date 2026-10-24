// Equo App · maniscalco · modulo (moduli ES, costruiti con Vite in ruoli/maniscalco/costruito.js)
import { renderClientiList } from "./033-clienti-a-cartelle-stile-telegram-cavall.js";
import { openEditCliente } from "./034-strutture-collegate-a-equo-scuderia-prof.js";
import { closeClienteDetail, descrFerraturaCavallo, lavoroCav, testoFerroIntervento } from "./035-ferratura-del-cavallo-scheda-libretto-fe.js";
import { descrFerroBreve, fotoCavalloPro, iniziale, loadClienteInterventi, statoCavalloPro } from "./037-scheda-cliente-a-box-scheda-del-cavallo.js";
import { renderProDeadlines } from "./040-home-pro-prossimi-appuntamenti-da-richia.js";
import { renderIncassi } from "./047-incassi-saldati-per-periodo-da-saldare-p.js";
import { luogoDi, renderDoveCavalloPro, spostamentoHtml } from "./050-sposta-cavallo-dove-sta-il-cavallo-a-cas.js";
import { MISURA_SISTEMA_LABEL, isoLocale } from "./051-modal-appuntamento-maniscalco-nuovo-modi.js";
import { chiediSiNo, openInterventoModal, siglaFerro } from "./052-ferro-standard-nella-scheda-del-cavallo.js";
import { AG_MESI } from "./053-agenda-settimanale-maniscalco.js";
import { formatDataBreve } from "./054-richieste-di-appuntamento-step-5d.js";
import { giorniTra } from "./032-richiamo-prossimo-intervento-sempre-in-g.js";
import { anagraficaRighe, apriAnagraficaCavallo, riquadroIntervalloPrezzo } from "./103-intervallo-prezzo-anagrafica-cavallo.js";
/* ---------- AVVISO «SEMBRA LO STESSO CAVALLO» ----------
   Una scheda inserita a mano e una inserita dal proprietario con nomi uguali si uniscono da sole (database).
   Con nomi solo simili (es. «White» e «White night») si propone l'unione con un tocco: vince il nome del proprietario. */
function nomeConfronto(s){ return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim(); }
function distanzaNomi(a, b){
  const m = a.length, n = b.length;
  if(!m) return n; if(!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for(let i = 1; i <= m; i++){
    const cur = [i];
    for(let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}
function nomiSimili(a, b){
  const x = nomeConfronto(a), y = nomeConfronto(b);
  if(!x || !y) return false;
  if(x === y) return true;
  const corto = x.length <= y.length ? x : y, lungo = x.length <= y.length ? y : x;
  if(corto.length >= 3 && lungo.startsWith(corto + " ")) return true;
  return corto.length >= 4 && distanzaNomi(x, y) <= 1;
}
function simiIgnorati(){ try{ return new Set(JSON.parse(localStorage.getItem("eq_simili_no") || "[]")); }catch(e){ return new Set(); } }
function ignoraSimili(chiave){
  try{ const s = simiIgnorati(); s.add(chiave); localStorage.setItem("eq_simili_no", JSON.stringify([...s].slice(-200))); }catch(e){}
  renderAvvisoSimili();
}
let similiCorrenti = [];
function renderAvvisoSimili(){
  const box = document.getElementById("cliente-simili-box");
  if(!box) return;
  const no = simiIgnorati();
  const manuali = (schedaCavalli || []).filter(c => c.id && !c.horse_id && !c.scuderia_cavallo_id && !c.presso);
  const collegati = (schedaCavalli || []).filter(c => c.horse_id && !c.presso && c.tipo === "equo");
  const usati = new Set(), coppie = [];
  manuali.forEach(m => {
    const c = collegati.find(x => !usati.has(x.horse_id) && nomiSimili(m.nome, x.nome) && !no.has(m.id + "|" + x.horse_id));
    if(c){ usati.add(c.horse_id); coppie.push({ m, c, chiave: m.id + "|" + c.horse_id }); }
  });
  similiCorrenti = coppie;
  box.innerHTML = coppie.slice(0, 3).map((p, i) => `<div style="background:var(--surface2);border:1px solid var(--border);border-left:3px solid var(--accent);border-radius:10px;padding:12px 14px;margin:0 0 10px">
    <div style="font-weight:600;font-size:14px;margin-bottom:4px">È lo stesso cavallo?</div>
    <div style="font-size:13px;color:var(--muted);line-height:1.5">«${escapeHtml(p.m.nome)}» (l'hai inserito tu) e «${escapeHtml(p.c.nome)}» (inserito dal proprietario) sembrano lo stesso cavallo. Se li unisci resta una scheda sola, con il nome del proprietario: lavori e avvisi si conservano.</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
      <button type="button" class="btn btn-primary btn-sm" onclick="unisciSimili(${i})">Unisci in «${escapeHtml(p.c.nome)}»</button>
      <button type="button" class="btn btn-outline btn-sm" onclick="ignoraSimili('${p.chiave}')">Sono diversi</button>
    </div></div>`).join("");
}
async function unisciSimili(i){
  const p = similiCorrenti[i];
  if(!p || !currentClienteId) return;
  if(!confirm(`Unire «${p.m.nome}» in «${p.c.nome}»? Resta una scheda sola, con lavori e avvisi di entrambe.`)) return;
  if(DEMO_MODE){
    demoState.interventiMascalcia.forEach(x => { if(x.cavallo_cliente_id === p.m.id) x.cavallo_cliente_id = p.c.id || null; });
    demoState.cavalliClientiMascalcia = demoState.cavalliClientiMascalcia.filter(x => x.id !== p.m.id);
  } else {
    const { data, error } = await sb.rpc("equo_unisci_cavalli_cliente", { p_togli: p.m.id, p_tieni: p.c.id || null, p_horse: p.c.id ? null : p.c.horse_id });
    if(error || !data || data.ok === false){ console.error("equo_unisci_cavalli_cliente:", error || data); showToast("Non sono riuscito a unire le schede, riprova"); return; }
  }
  showToast("Schede unite in «" + p.c.nome + "»");
  schedaCavalli = [];
  await loadClienteInterventi(currentClienteId);
}
function renderBoxCavalliCliente(){
  const grid = document.getElementById("cliente-cavalli-grid");
  if(!grid) return;
  const cerca = document.getElementById("cliente-cavalli-cerca");
  cerca.style.display = schedaCavalli.length > 4 ? "block" : "none";
  const q = cerca.value.trim().toLowerCase();
  document.getElementById("cliente-cavalli-titolo").textContent = `CAVALLI (${schedaCavalli.length})`;
  const ordinati = schedaCavalli.slice().sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "it", { sensitivity: "base" }))
    .filter(c => !q || (c.nome || "").toLowerCase().includes(q) || (c.codice_equo || "").toLowerCase().includes(q));
  const box = c => {
    const st = statoCavalloPro(c, clienteInterventiCache), foto = fotoCavalloPro(c), ferro = descrFerroBreve(c);
    return `<button type="button" class="cav-box" onclick="apriSchedaCavalloPro('${c.key}')">
      <span class="cav-box-foto"${foto ? ` style="background-image:${cssUrlApp(foto)}"` : ""}>${foto ? "" : iniziale(c.nome)}${st.sem ? `<i class="cav-sem ${st.sem}"></i>` : ""}</span>
      <span class="cav-box-nome">${escapeHtml(c.nome)}</span>
      <span class="cav-box-cod">${escapeHtml([c.codice_equo, ferro ? "ferro " + ferro : ""].filter(Boolean).join(" · ") || (c.tipo === "equo" ? "su Equo" : "—"))}</span>
      <span class="cav-box-riga">${c.presso ? `📍 presso ${escapeHtml(c.presso)}` : `Ultimo: <b>${st.ultimo ? escapeHtml((TIPO_FERRATURA_LABELS[st.ultimo.tipo_ferratura] || st.ultimo.tipo_ferratura) + " · " + formatDataBreve(st.ultimo.data_intervento)) : "—"}</b>`}</span>
      ${c.presso ? "" : `<span class="cav-box-riga">Prossimo: <b>${st.prossimo ? escapeHtml((st.prossimo.fissato ? st.prossimo.testo + " · " : "") + formatDataBreve(st.prossimo.data)) : "—"}</b></span>`}
    </button>`;
  };
  grid.innerHTML = `<button type="button" class="cav-box nuovo" onclick="aggiungiCavalloDaScheda()"><span class="cav-box-piu">+</span><span class="cav-box-nome">Aggiungi cavallo</span><span class="cav-box-cod">nuovo o con codice Equo</span></button>`
    + (ordinati.length ? ordinati.map(box).join("") : (q ? '<div class="muted" style="font-size:13px;padding:10px 4px;grid-column:1/-1">Nessun cavallo con questo nome.</div>' : ""));
}
function cssUrlApp(u){ return "url('" + String(u).replace(/['\\()]/g, c => "\\" + c) + "')"; }
// aggiunta: si usa la sezione Cavalli di «Modifica cliente» (nuovo cavallo o con codice Equo)
async function aggiungiCavalloDaScheda(){
  await openEditCliente();
  setTimeout(() => { const el = document.getElementById("edit-cliente-nuovo-cavallo"); if(el){ el.scrollIntoView({ block: "center" }); el.focus(); } }, 250);
}

// interventi vecchi senza cavallo: Assegna a un cavallo o Elimina
function renderInterventiSenzaCavallo(){
  const box = document.getElementById("cliente-orfani");
  const orfani = (clienteInterventiCache || []).filter(i => !i.cavallo_cliente_id && !i.horse_id);
  if(!orfani.length){ box.style.display = "none"; box.innerHTML = ""; return; }
  const opz = schedaCavalli.slice().sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "it")).map(c => `<option value="${c.key}">${escapeHtml(c.nome)}</option>`).join("");
  box.style.display = "block";
  box.innerHTML = `<div class="clienti-sez-title" style="margin-bottom:8px">INTERVENTI SENZA CAVALLO (${orfani.length})</div>
    <div class="muted" style="font-size:12px;line-height:1.5;margin-bottom:6px">Registrati senza indicare il cavallo: assegnali al cavallo giusto così entrano nel suo storico.</div>
    ${orfani.map(i => `<div class="orfano-riga">
      <div style="flex:1;min-width:0"><div style="font-weight:600;font-size:13.5px">${escapeHtml(TIPO_FERRATURA_LABELS[i.tipo_ferratura] || i.tipo_ferratura)}${i.tipo_ferratura === "altro" && i.tipo_altro ? " · " + escapeHtml(i.tipo_altro) : ""} · ${formatDate(i.data_intervento)}</div>
        <div class="muted" style="font-size:11.5px">${i.stato === "fatto" ? "fatto" : "da fare"}${i.importo != null ? " · " + Number(i.importo).toLocaleString("it-IT") + " € · " + (i.stato_pagamento === "saldato" ? "saldato" : "da saldare") : ""}${i.note ? " · " + escapeHtml(i.note) : ""}</div>
        ${opz ? `<div style="display:flex;gap:6px;margin-top:6px"><select class="input" id="orfano-${i.id}" style="flex:1;padding:6px 8px;font-size:13px"><option value="">Scegli il cavallo…</option>${opz}</select>
          <button class="btn btn-outline btn-sm" onclick="assegnaInterventoCavallo('${i.id}', this)">Assegna</button></div>` : ""}
      </div>
      <button class="btn btn-ghost btn-sm" style="color:var(--red);align-self:flex-start" onclick="eliminaInterventoOrfano('${i.id}', this)">Elimina</button>
    </div>`).join("")}`;
}
async function assegnaInterventoCavallo(id, btn){
  const k = document.getElementById("orfano-" + id)?.value;
  if(!k){ showToast("Scegli il cavallo"); return; }
  const cv = schedaCavalli.find(c => c.key === k);
  if(!cv) return;
  btn.disabled = true;
  try{
    const { cavallo_cliente_id, horse_id } = await DB.risolviCavalloPerIntervento(currentClienteId, cv);
    const { error } = await DB.updateInterventoMascalcia(id, { cavallo_cliente_id, horse_id });
    if(error){ showToast("Errore: " + error.message); return; }
    showToast(`Assegnato a ${cv.nome}`);
    await loadClienteInterventi(currentClienteId);
  } finally { btn.disabled = false; }
}
async function eliminaInterventoOrfano(id, btn){
  const i = (clienteInterventiCache || []).find(x => x.id === id);
  if(!i) return;
  const ok = await chiediSiNo("Eliminare questo intervento?", `${TIPO_FERRATURA_LABELS[i.tipo_ferratura] || i.tipo_ferratura} del ${formatDate(i.data_intervento)}${i.importo != null ? " (" + i.importo + " €)" : ""}: sparisce anche da incassi e scadenze.`);
  if(!ok) return;
  btn.disabled = true;
  const { error } = await DB.deleteInterventoMascalcia(id);
  btn.disabled = false;
  if(error){ showToast("Errore: " + error.message); return; }
  showToast("Intervento eliminato");
  await loadClienteInterventi(currentClienteId);
  try{ await renderProDeadlines(); await renderIncassi(); }catch(e){}
}

// ---------- ALLEGATI DEL CAVALLO (condivisi: maniscalco, proprietario collegato, scuderia) ----------
let allegatiCtx = {};
async function chiaveAllegati(vista, cv){
  if(vista !== "maniscalco") return cv.id;
  if(cv.id) return cv.id;
  const r = await DB.risolviCavalloPerIntervento(currentClienteId, cv);   // cavallo del proprietario senza scheda del maniscalco: la crea
  if(r.cavallo_cliente_id){ cv.id = r.cavallo_cliente_id; }
  return cv.id;
}
async function caricaAllegatiCavallo(boxId, vista, cv){
  allegatiCtx[boxId] = { vista, cv };
  const box = document.getElementById(boxId);
  if(DEMO_MODE){ if(box) box.innerHTML = '<div class="muted" style="font-size:13px">In demo gli allegati non sono disponibili.</div>'; return; }
  const id = await chiaveAllegati(vista, cv);
  if(!id){ if(box) box.innerHTML = '<div class="muted" style="font-size:13px">Nessun allegato.</div>'; return; }
  const { data, error } = await sb.rpc("equo_allegati_cavallo", { p_vista: vista, p_id: id });
  const b = document.getElementById(boxId);
  if(!b || allegatiCtx[boxId]?.cv !== cv) return;
  if(error){ b.innerHTML = '<div class="muted" style="font-size:13px">Allegati non disponibili ora. Riprova più tardi.</div>'; return; }
  allegatiCtx[boxId].lista = data || [];
  const chi = { maniscalco: "dal maniscalco", proprietario: "dal proprietario", scuderia: "dalla scuderia" };
  b.innerHTML = (data || []).length ? data.map(a => {
    const pdf = (a.mime || "").includes("pdf") || /\.pdf$/i.test(a.nome);
    return `<div class="allegato-riga"><div class="allegato-ic">${pdf ? "PDF" : "FOTO"}</div>
      <div style="flex:1;min-width:0"><div style="font-weight:700;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(a.nome)}</div>
        <div class="muted" style="font-size:11.5px">${a.mio ? "caricato da te" : "caricato " + (chi[a.autore_ruolo] || "") + (a.autore_nome ? " " + escapeHtml(a.autore_nome) : "")} · ${formatDataBreve(String(a.created_at).slice(0, 10))}${a.byte ? " · " + (a.byte > 1048576 ? (a.byte / 1048576).toFixed(1).replace(".", ",") + " MB" : Math.max(1, Math.round(a.byte / 1024)) + " KB") : ""}</div></div>
      <button class="btn btn-outline btn-sm" onclick="apriAllegato('${boxId}', '${a.id}', this)">Apri</button>
      ${a.mio ? `<button class="btn btn-ghost btn-sm" style="color:var(--red);padding:6px" aria-label="Elimina" onclick="eliminaAllegato('${boxId}', '${a.id}')">✕</button>` : ""}
    </div>`;
  }).join("") : '<div class="muted" style="font-size:13px">Nessun allegato. Carica lastre, referti o foto: li vedranno anche gli altri che seguono il cavallo.</div>';
}
async function caricaAllegatoCavallo(input, boxId, vista){
  const f = input.files && input.files[0];
  input.value = "";
  const ctx = allegatiCtx[boxId];
  if(!f || !ctx) return;
  if(DEMO_MODE){ showToast("In demo gli allegati non sono disponibili."); return; }
  if(f.size > 15 * 1048576){ showToast("File troppo grande: massimo 15 MB"); return; }
  if(!/^(application\/pdf|image\/)/.test(f.type || "")){ showToast("Puoi caricare PDF o foto"); return; }
  const id = await chiaveAllegati(vista, ctx.cv);
  if(!id){ showToast("Non riuscito, riprova."); return; }
  showToast("Caricamento in corso…");
  const est = (f.name.match(/\.[a-z0-9]{1,5}$/i) || [""])[0].toLowerCase();
  const path = `${currentUser.id}/${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}${est}`;
  const up = await sb.storage.from("cavalli-allegati").upload(path, f, { contentType: f.type || undefined });
  if(up.error){ showToast("Caricamento non riuscito: " + up.error.message); return; }
  const { data, error } = await sb.rpc("equo_aggiungi_allegato", { p_vista: vista, p_id: id, p_nome: f.name, p_path: path, p_mime: f.type || null, p_byte: f.size });
  if(error || !data?.ok){
    await sb.storage.from("cavalli-allegati").remove([path]);
    showToast((data && data.errore) || "Caricamento non riuscito, riprova."); return;
  }
  showToast("Allegato caricato");
  await caricaAllegatiCavallo(boxId, vista, ctx.cv);
}
async function apriAllegato(boxId, id, btn){
  const a = (allegatiCtx[boxId]?.lista || []).find(x => x.id === id);
  if(!a) return;
  // il link va aperto subito (iPhone blocca le finestre aperte dopo un'attesa)
  const w = window.open("", "_blank");
  if(btn) btn.disabled = true;
  const { data, error } = await sb.storage.from("cavalli-allegati").createSignedUrl(a.path, 600);
  if(btn) btn.disabled = false;
  if(error || !data?.signedUrl){ if(w) w.close(); showToast("Non riesco ad aprire il file, riprova."); return; }
  if(w) w.location.href = data.signedUrl; else window.location.href = data.signedUrl;
}
async function eliminaAllegato(boxId, id){
  const a = (allegatiCtx[boxId]?.lista || []).find(x => x.id === id);
  if(!a) return;
  if(!(await chiediSiNo("Eliminare questo allegato?", `«${a.nome}» sparisce per tutti quelli che seguono il cavallo. L'eliminazione resta nello storico.`))) return;
  const { data, error } = await sb.rpc("equo_elimina_allegato", { p_id: id });
  if(error || !data?.ok){ showToast((data && data.errore) || "Non riuscito, riprova."); return; }
  if(data.path) await sb.storage.from("cavalli-allegati").remove([data.path]);
  showToast("Allegato eliminato");
  const ctx = allegatiCtx[boxId];
  await caricaAllegatiCavallo(boxId, ctx.vista, ctx.cv);
}

// ---------- scheda del singolo cavallo ----------
async function apriSchedaCavalloPro(key, soloAggiorna){
  const cv = schedaCavalli.find(c => c.key === key);
  if(!cv) return;
  schedaCavalloKey = key;
  if(!soloAggiorna) schedaCavalloTab = "tutto";
  const cli = clientiMascalcia.find(x => x.id === currentClienteId);
  document.getElementById("clienti-detail-view").style.display = "none";
  document.getElementById("cavallo-pro-view").style.display = "block";
  document.getElementById("cavpro-cliente").textContent = cli ? cli.nome : "Cliente";
  const st = statoCavalloPro(cv, clienteInterventiCache), foto = fotoCavalloPro(cv);
  document.getElementById("cavpro-hero").innerHTML = `
    <span class="cav-box-foto grande"${foto ? ` style="background-image:${cssUrlApp(foto)}"` : ""}>${foto ? "" : iniziale(cv.nome)}${st.sem ? `<i class="cav-sem ${st.sem}"></i>` : ""}</span>
    <div style="min-width:0"><div class="cavpro-nome">${escapeHtml(cv.nome)}</div>
      <div class="muted" style="font-size:12.5px">${escapeHtml([cv.codice_equo, cv.razza].filter(Boolean).join(" · ") || (cv.tipo === "equo" ? "cavallo del proprietario su Equo" : ""))}</div>
      ${cv.presso ? `<div class="muted" style="font-size:12.5px">Riga del maniscalco presso ${escapeHtml(cv.presso)}</div>` : ""}</div>`;
  renderDoveCavalloPro(cv);
  if(!soloAggiorna) window.scrollTo({ top: 0 });
  if(!soloAggiorna) document.getElementById("cavpro-corpo").innerHTML = '<div class="loading"><div class="spinner"></div> Caricamento...</div>';
  renderTabCavalloPro();
  // storico: tutti gli interventi del cavallo con questo maniscalco, anche presso altri clienti
  [schedaStoricoCavallo, schedaSpostamenti] = await Promise.all([DB.listInterventiCavallo(cv), DB.spostamentiCavallo("maniscalco", cv.id)]);
  if(schedaCavalloKey !== key) return;
  renderCorpoCavalloPro();
}
function chiudiSchedaCavalloPro(){
  schedaCavalloKey = null;
  if(schedaDaCartella){ schedaDaCartella = false; document.getElementById("cavallo-pro-view").style.display = "none"; closeClienteDetail(); renderClientiList(); return; }
  document.getElementById("cavallo-pro-view").style.display = "none";
  document.getElementById("clienti-detail-view").style.display = "block";
  renderBoxCavalliCliente();
}
function renderTabCavalloPro(){
  const tabs = [["tutto", "Tutto"], ["ana", "Anagrafica"], ["fer", "Ferratura"], ["sto", "Storico"], ["all", "Allegati"]];
  document.getElementById("cavpro-tab").innerHTML = tabs.map(([k, t]) => `<button class="${schedaCavalloTab === k ? "on" : ""}" onclick="schedaCavalloTab='${k}';renderTabCavalloPro();renderCorpoCavalloPro()">${t}</button>`).join("");
}
function renderCorpoCavalloPro(){
  const cv = schedaCavalli.find(c => c.key === schedaCavalloKey);
  if(!cv) return;
  const vedi = k => schedaCavalloTab === "tutto" || schedaCavalloTab === k;
  const sez = (k, titolo, azione, corpo) => vedi(k) ? `<div class="card cavpro-sez"><div class="cavpro-sez-testa"><span>${titolo}</span>${azione || ""}</div>${corpo}</div>` : "";
  const st = statoCavalloPro(cv, schedaStoricoCavallo);
  const ultimiNuovi = schedaStoricoCavallo.filter(i => i.stato === "fatto" && i.ferri_nuovi === true).sort((a, b) => b.data_intervento.localeCompare(a.data_intervento))[0];
  const modificabile = cv.tipo === "manuale";
  const allegatiPrima = document.getElementById("cavpro-allegati")?.innerHTML;
  document.getElementById("cavpro-corpo").innerHTML =
    sez("ana", "Anagrafica", `<button class="btn btn-outline btn-sm" onclick="modificaAnagraficaCavalloPro()">Modifica</button>`, `
      <dl class="cavpro-kv">
        <dt>Codice Equo</dt><dd>${escapeHtml(cv.codice_equo || "—")}</dd>
        <dt>Microchip</dt><dd>${escapeHtml(cv.microchip || "—")}</dd>
        <dt>Razza</dt><dd>${escapeHtml(cv.razza || "—")}</dd>
        ${anagraficaRighe(cv).map(([k, v]) => `<dt>${escapeHtml(k)}</dt><dd>${escapeHtml(String(v))}</dd>`).join("")}
        <dt>Proprietario</dt><dd>${cv.tipo === "equo" ? "su Equo (collegato)" : escapeHtml(clientiMascalcia.find(x => x.id === currentClienteId)?.nome || "—")}${modificabile && !cv.horse_id ? ` <button type="button" class="cavpro-link" onclick="apriCambiaProprietario(false)">Cambia</button>` : ""}</dd>
        <dt>Dove sta</dt><dd>${escapeHtml(luogoDi(cv.ub || { cliente_mascalcia_id: currentClienteId }).nome)}</dd>
      </dl>
      ${cv.tipo === "equo" ? '<div class="muted" style="font-size:11.5px;margin-top:8px">Nome, razza e nascita li gestisce il proprietario nella sua app; con «Modifica» aggiungi altezza, peso, sesso, disciplina e segni particolari.</div>' : ""}`)
    + sez("fer", "Ferratura", `<button class="btn btn-outline btn-sm" onclick="apriFerroCavallo('${cv.key}')">Modifica</button>`, `
      <div class="cavpro-ferro"><div class="cavpro-ferro-n">${lavoroCav(cv) === "pareggio" ? "Pareggio" : cv.ferro_numero ? escapeHtml(cv.ferro_numero + " " + (MISURA_SISTEMA_LABEL[cv.ferro_sistema || "italiana"] || "")) : "—"}</div>
        <div class="muted" style="font-size:12.5px;line-height:1.5"><b style="color:var(--text)">${escapeHtml(descrFerraturaCavallo(cv))}</b><br>
        ${ultimiNuovi ? '<span class="solo-completa">Ultimi ferri nuovi: ' + formatDataBreve(ultimiNuovi.data_intervento) + "<br></span>" : ""}
        ${st.prossimo ? (() => { const g = giorniTra(isoLocale(new Date()), st.prossimo.data);
          const q = g < 0 ? `scaduta da ${-g} ${-g === 1 ? "giorno" : "giorni"}` : g === 0 ? "oggi" : g === 1 ? "domani" : `tra ${g} giorni`;
          return `<button type="button" class="cav-prox${g < 0 ? " scad" : ""}" onclick="apriScadenzaCavallo()">Prossima: <b>${formatDataBreve(st.prossimo.data)}</b> · ${q}${st.prossimo.fissato ? " · appuntamento" : ""} <span>›</span></button>`; })()
          : 'Prossima: <b style="color:var(--text)">—</b>'}</div></div>
      ${riquadroIntervalloPrezzo(cv, currentClienteId, schedaStoricoCavallo)}
      <div class="muted" style="font-size:11.5px;line-height:1.5;margin-top:8px">Vale per tutti i suoi appuntamenti: nel nuovo appuntamento basta scegliere il cavallo. Lavoro e tipo di ferro vanno anche nel libretto del proprietario e nella scheda della scuderia; «ferri nuovi/rimessa» resta solo tuo.</div>`)
    + sez("sto", "Storico di " + escapeHtml(cv.nome), `<span style="display:flex;gap:6px"><button class="btn btn-outline btn-sm solo-completa" onclick="nuovoInterventoCavalloPro('straordinario')">Straordinario</button><button class="btn btn-outline btn-sm" onclick="nuovoInterventoCavalloPro()">+ Intervento</button></span>`, storicoCavalloHtml(schedaStoricoCavallo, schedaSpostamenti))
    + (vedi("all") ? `<div class="card cavpro-sez"><div class="cavpro-sez-testa"><span>Allegati</span><button class="btn btn-outline btn-sm" onclick="document.getElementById('cavpro-allegati-file').click()">+ Carica</button></div>
        <input type="file" id="cavpro-allegati-file" accept="application/pdf,image/*" style="display:none" onchange="caricaAllegatoCavallo(this, 'cavpro-allegati', 'maniscalco')">
        <div id="cavpro-allegati">${allegatiPrima || '<div class="muted" style="font-size:13px">Caricamento…</div>'}</div>
        <div class="muted" style="font-size:11.5px;line-height:1.5;margin-top:8px">Li vedono anche il proprietario collegato e la scuderia dove sta il cavallo. Ognuno può eliminare solo i file caricati da lui.</div></div>` : "");
  if(vedi("all") && (!allegatiPrima || allegatiCtx["cavpro-allegati"]?.cv !== cv)) caricaAllegatiCavallo("cavpro-allegati", "maniscalco", cv);
}
function storicoCavalloHtml(lista, spostamenti){
  if(!lista.length && !(spostamenti || []).length) return '<div class="muted" style="font-size:13px">Nessun intervento per questo cavallo.</div>';
  const voci = [...lista.map(i => ({ d: i.data_intervento || "", i })), ...(spostamenti || []).map(s => ({ d: isoLocale(new Date(s.creato)), s }))]
    .sort((a, b) => b.d.localeCompare(a.d));
  return voci.map(({ i, s }) => {
    if(s) return spostamentoHtml(s);
    const d = new Date(i.data_intervento + "T12:00");
    const ferro = (i.tipo_ferratura === "ferratura" || i.tipo_ferratura === "mezza_ferratura")
      ? [i.quantita_ferri ? i.quantita_ferri + " ferri" : null, i.numero_ferro ? siglaFerro(i.misura_sistema, i.numero_ferro) : null].filter(Boolean).join(" ") : "";
    const extra = [i.ferri_nuovi === true ? "ferri nuovi" : i.ferri_nuovi === false ? "rimessa" : null, testoFerroIntervento(i),
      i.importo != null ? Number(i.importo).toLocaleString("it-IT") + " €" : null,
      i.luogo_nome ? (/^A casa/.test(i.luogo_nome) ? "a casa" : "presso " + i.luogo_nome) : i.clienti_mascalcia?.nome && i.cliente_mascalcia_id !== currentClienteId ? "presso " + i.clienti_mascalcia.nome : null, i.note || null].filter(Boolean).join(" · ");
    return `<div class="cavpro-int" onclick="openInterventoModal(null, schedaStoricoCavallo.find(x => x.id === '${i.id}'))">
      <div class="cavpro-int-data"><b>${d.getDate()}</b>${AG_MESI[d.getMonth()]} ${d.getFullYear()}</div>
      <div style="flex:1;min-width:0"><div style="font-weight:700;font-size:13.5px">${escapeHtml(TIPO_FERRATURA_LABELS[i.tipo_ferratura] || i.tipo_ferratura)}${i.tipo_ferratura === "altro" && i.tipo_altro ? " · " + escapeHtml(i.tipo_altro) : ""}${ferro ? " · " + escapeHtml(ferro) : ""}</div>
        <div class="muted" style="font-size:12px">${i.stato !== "fatto" ? (i.stato === "richiesto" ? "richiesta da confermare · " : "da fare · ") : ""}${escapeHtml(extra)}</div></div>
      ${i.stato === "fatto" ? `<span class="badge solo-incassi ${i.stato_pagamento === "saldato" ? "badge-green" : "badge-red"}" style="align-self:flex-start">${i.stato_pagamento === "saldato" ? "Saldato" : "Da saldare"}</span>` : ""}
    </div>`;
  }).join("");
}
function nuovoInterventoCavalloPro(modo){
  const cv = schedaCavalli.find(c => c.key === schedaCavalloKey);
  if(!cv) return;
  openInterventoModal(currentClienteId, null, { cavallo_cliente_id: cv.id || null, horse_id: cv.horse_id || null, modo: modo || null });
}
async function salvaFerraturaCavallo(campi){
  const cv = schedaCavalli.find(c => c.key === schedaCavalloKey);
  if(!cv) return;
  let id = cv.id;
  if(!id){ ({ cavallo_cliente_id: id } = await DB.risolviCavalloPerIntervento(currentClienteId, cv)); }
  if(!id){ showToast("Non riuscito, riprova."); return; }
  if("ferro_note" in campi && campi.ferro_note === (cv.ferro_note || null)) return;
  if(Object.keys(campi).every(k => cv[k] === campi[k])) return;
  const { error } = await DB.updateCavalloCliente(id, campi);
  if(error){ showToast("Errore: " + error.message); return; }
  Object.assign(cv, campi, { id });
  showToast(campi.ferratura_tipo ? (campi.ferratura_tipo === "mezza" ? `${cv.nome}: mezza ferratura (2 anteriori)` : `${cv.nome}: ferratura completa`)
    : campi.ferro_tipo ? `${cv.nome}: ferro ${campi.ferro_tipo}` : "Note del ferro salvate");
  renderCorpoCavalloPro();
}
// «Modifica» dell'anagrafica: apre i dati del cavallo (prima apriva per errore la scheda del cliente)
function modificaAnagraficaCavalloPro(){ apriAnagraficaCavallo(); }
/* -> stato-condiviso.js */
function storicoNomeCavallo(i){ return i.cavalli_clienti_mascalcia?.nome || ""; }
function filtraStoricoCavallo(k){ storicoFiltroCavallo = k; renderStoricoCliente(); }
function renderStoricoCliente(){
  const box = document.getElementById("cliente-interventi-list");
  const data = clienteInterventiCache || [];
  const nomi = [...new Set(data.map(storicoNomeCavallo).filter(Boolean))].sort((a, b) => a.localeCompare(b, "it"));
  const senza = data.some(i => !storicoNomeCavallo(i));
  if(storicoFiltroCavallo !== "tutti" && storicoFiltroCavallo !== "__senza__" && !nomi.includes(storicoFiltroCavallo)) storicoFiltroCavallo = "tutti";
  const filtri = nomi.length > 1 || (nomi.length && senza)
    ? `<div class="hp-filtri" style="margin:0 0 8px">${[["tutti", "Tutti (" + data.length + ")"], ...nomi.map(n => [n, n + " (" + data.filter(i => storicoNomeCavallo(i) === n).length + ")"]), ...(senza ? [["__senza__", "Senza cavallo"]] : [])]
        .map(([k, t]) => `<button class="${storicoFiltroCavallo === k ? "on" : ""}" onclick="filtraStoricoCavallo(${escapeHtml(JSON.stringify(k))})">${escapeHtml(t)}</button>`).join("")}</div>` : "";
  const lista = data.filter(i => storicoFiltroCavallo === "tutti" || (storicoFiltroCavallo === "__senza__" ? !storicoNomeCavallo(i) : storicoNomeCavallo(i) === storicoFiltroCavallo));
  box.innerHTML = filtri + lista.map(i => {
    const ferroInfo = (i.tipo_ferratura === "ferratura" || i.tipo_ferratura === "mezza_ferratura") && (i.numero_ferro || i.quantita_ferri)
      ? " · " + [i.numero_ferro ? "n. " + escapeHtml(i.numero_ferro) + (i.misura_sistema ? " " + MISURA_SISTEMA_LABEL[i.misura_sistema] : "") : null, i.quantita_ferri ? i.quantita_ferri + (i.ferri_nuovi === true ? " ferri nuovi" : " ferri") : null, i.ferri_nuovi === false ? "rimessa" : null].filter(Boolean).join(", ")
      : "";
    const cav = storicoNomeCavallo(i);
    return `
    <div class="event-item" style="cursor:pointer" onclick="openInterventoModal(null, clienteInterventiCache.find(x => x.id === '${i.id}'))">
      <div style="min-width:0">
        <div class="storico-cav${cav ? "" : " vuoto"}"><span class="fa-icon"><i class="fa-solid fa-horse-head"></i></span> ${cav ? escapeHtml(cav) : "Cavallo non indicato"}</div>
        <div style="font-weight:600;font-size:13.5px">${TIPO_FERRATURA_LABELS[i.tipo_ferratura] || i.tipo_ferratura}${i.tipo_ferratura === "altro" && i.tipo_altro ? " · " + escapeHtml(i.tipo_altro) : ""}${ferroInfo}</div>
        <div class="muted" style="font-size:12px">${formatDate(i.data_intervento)}${i.ora ? " · " + String(i.ora).slice(0,5) : ""}${i.stato === "programmato" ? " · da fare" : i.stato === "richiesto" ? " · richiesta da confermare" : ""}${i.note ? " · " + escapeHtml(i.note) : ""}</div>
      </div>
      <span class="badge solo-incassi ${i.stato_pagamento === 'saldato' ? 'badge-green' : 'badge-red'}">${i.stato_pagamento === 'saldato' ? 'Saldato' : 'Da saldare'}</span>
    </div>
  `;
  }).join("");
}




export { aggiungiCavalloDaScheda, apriAllegato, apriSchedaCavalloPro, assegnaInterventoCavallo, caricaAllegatiCavallo, caricaAllegatoCavallo, chiudiSchedaCavalloPro, eliminaAllegato, eliminaInterventoOrfano, filtraStoricoCavallo, ignoraSimili, modificaAnagraficaCavalloPro, nuovoInterventoCavalloPro, renderAvvisoSimili, renderBoxCavalliCliente, renderCorpoCavalloPro, renderInterventiSenzaCavallo, renderTabCavalloPro, unisciSimili };
