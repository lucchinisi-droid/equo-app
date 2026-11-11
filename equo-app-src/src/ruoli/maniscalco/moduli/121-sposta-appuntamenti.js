// Equo App · maniscalco · «SPOSTA» APPUNTAMENTI (11/11/2026 · SQL 60, mockup «Sposta appuntamenti»)
// Dalla finestra dell'appuntamento: nuova data e ora, poi i cavalli di quel giorno presso lo stesso cliente o la stessa
// scuderia, con la spunta solo su quello toccato. «Seleziona tutti» per spostare tutta la giornata; anche solo alcuni.
// Il database (pro_sposta_appuntamenti) sposta i cavalli scelti e manda UN messaggio per cliente o scuderia.
import { agDescrizioneTipo, agNomeCavalloTesto } from "./053-agenda-settimanale-maniscalco.js";
import { clienteDiId, luogoEvento } from "./050-sposta-cavallo-dove-sta-il-cavallo-a-cas.js";

let spCtx = null;
const spEsc = s => escapeHtml(s == null ? "" : String(s));
const spOggi = () => new Date().toLocaleDateString("sv-SE");
function spDataLunga(iso){
  if(!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });
}
function spLuogoKey(e){
  try { return luogoEvento(e, true)?.key || ("c:" + e.cliente_mascalcia_id); } catch(_){ return "c:" + e.cliente_mascalcia_id; }
}
function spNomeLuogo(e){
  try { const l = luogoEvento(e, true); if(l?.nome) return l.nome; } catch(_){}
  return clienteDiId(e.cliente_mascalcia_id)?.nome || e.clienti_mascalcia?.nome || "Cliente";
}

async function apriSposta(e){
  if(!e) return;
  if(!["programmato", "proposto"].includes(e.stato)){ showToast("Si spostano solo gli appuntamenti ancora da fare"); return; }
  const tutti = await DB.interventiGiornoMascalcia(e.data_intervento);
  const chiave = spLuogoKey(e);
  let lista = (tutti || []).filter(x => x.id === e.id || x.cliente_mascalcia_id === e.cliente_mascalcia_id || spLuogoKey(x) === chiave);
  if(!lista.some(x => x.id === e.id)) lista.unshift(e);
  lista = [e, ...lista.filter(x => x.id !== e.id).sort((a, b) => agNomeCavalloTesto(a).localeCompare(agNomeCavalloTesto(b), "it"))];
  spCtx = { e, lista, scelti: new Set([e.id]), data: e.data_intervento, ora: e.ora ? String(e.ora).slice(0, 5) : "", motivo: "" };
  spRender();
  openModal("modal-sposta");
}
function spConScuderiaDaConfermare(){
  return spCtx.lista.some(x => spCtx.scelti.has(x.id) && x.gruppo_id && !clienteDiId(x.cliente_mascalcia_id)?.di_fiducia);
}
function spRender(){
  const c = spCtx; if(!c) return;
  const n = c.scelti.size, tot = c.lista.length, tutti = n === tot;
  const restano = tot - n;
  document.getElementById("sposta-sotto").textContent = spNomeLuogo(c.e) + " · " + spDataLunga(c.e.data_intervento);
  document.getElementById("sposta-corpo").innerHTML = `
    <div class="sp-campi">
      <label class="sp-campo">Nuova data<input class="input" type="date" id="sp-data" min="${spOggi()}" value="${spEsc(c.data)}" onchange="spCampo('data', this.value)"></label>
      <label class="sp-campo">Ora<input class="input" type="time" id="sp-ora" value="${spEsc(c.ora)}" onchange="spCampo('ora', this.value)"></label>
    </div>
    ${tot > 1 ? `<div class="sp-testa"><span>Quali cavalli sposti</span><button type="button" class="sp-link" onclick="spTutti()">${tutti ? "Togli tutti" : `Seleziona tutti (${tot})`}</button></div>` : ""}
    <div class="sp-lista">
      ${c.lista.map(x => `<label class="sp-riga${c.scelti.has(x.id) ? " on" : ""}"><input type="checkbox" ${c.scelti.has(x.id) ? "checked" : ""} onchange="spScegli('${x.id}', this.checked)">
        <span class="sp-cav"><b>${spEsc(agNomeCavalloTesto(x))}</b><small>${spEsc(agDescrizioneTipo(x))}${x.ora ? " · " + spEsc(String(x.ora).slice(0, 5)) : ""}${x.cliente_mascalcia_id !== c.e.cliente_mascalcia_id ? " · di " + spEsc(clienteDiId(x.cliente_mascalcia_id)?.nome || "") : ""}</small></span>
        ${x.id === c.e.id && tot > 1 ? '<span class="sp-toccato">TOCCATO</span>' : ""}</label>`).join("")}
    </div>
    <label class="sp-campo">Motivo (facoltativo, lo legge il cliente)<input class="input" type="text" id="sp-motivo" maxlength="200" value="${spEsc(c.motivo)}" oninput="spCampo('motivo', this.value)" placeholder="Es. imprevisto personale"></label>
    ${n && restano ? `<div class="sp-nota">${restano === 1 ? "L'altro cavallo resta" : `Gli altri ${restano} cavalli restano`} ${spEsc(spDataLunga(c.e.data_intervento))}${c.e.ora ? " alle " + spEsc(String(c.e.ora).slice(0, 5)) : ""}.</div>` : ""}
    ${spConScuderiaDaConfermare() ? `<div class="sp-info"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="M12 8v5M12 16v.5"></path></svg><span>${spEsc(spNomeLuogo(c.e))} è su Equo Scuderia: riceve la nuova data e deve riconfermarla (se sei il loro maniscalco di fiducia non serve).</span></div>` : ""}
    <button type="button" class="btn btn-primary sp-vai" id="sp-vai" ${n ? "" : "disabled"} onclick="spConferma()">${n ? `Sposta ${n} ${n === 1 ? "cavallo" : "cavalli"}` : "Scegli almeno un cavallo"}</button>`;
}
function spCampo(k, v){ if(spCtx) spCtx[k] = v; }
function spScegli(id, on){
  if(!spCtx) return;
  if(on) spCtx.scelti.add(id); else spCtx.scelti.delete(id);
  spRender();
}
function spTutti(){
  if(!spCtx) return;
  spCtx.scelti = spCtx.scelti.size === spCtx.lista.length ? new Set() : new Set(spCtx.lista.map(x => x.id));
  spRender();
}
async function spConferma(){
  const c = spCtx; if(!c) return;
  const data = document.getElementById("sp-data")?.value || c.data;
  const ora = document.getElementById("sp-ora")?.value || "";
  const motivo = (document.getElementById("sp-motivo")?.value || "").trim();
  if(!c.scelti.size){ showToast("Scegli almeno un cavallo"); return; }
  if(!data || data < spOggi()){ showToast("Scegli oggi o un giorno futuro"); return; }
  const ids = [...c.scelti];
  const stessi = c.lista.filter(x => c.scelti.has(x.id)).every(x => x.data_intervento === data && (x.ora ? String(x.ora).slice(0, 5) : "") === ora);
  if(stessi){ showToast("Hai lasciato la stessa data e la stessa ora"); return; }
  const btn = document.getElementById("sp-vai"); if(btn) btn.disabled = true;
  const r = await DB.spostaAppuntamenti(ids, data, ora, motivo);
  if(!r || !r.ok){ if(btn) btn.disabled = false; showToast(r?.errore || "Non sono riuscito a spostare: riprova"); return; }
  closeModal("modal-sposta");
  closeModal("modal-azioni-evento");
  spCtx = null;
  showToast(`${ids.length === 1 ? "Spostato" : ids.length + " cavalli spostati"} a ${spDataLunga(data)}${ora ? " alle " + ora : ""}: è partito un solo avviso`);
  if(typeof renderAgendaSettimana === "function") await renderAgendaSettimana();
  if(typeof renderProDeadlines === "function") await renderProDeadlines();
  if(typeof currentClienteId !== "undefined" && currentClienteId && typeof loadClienteInterventi === "function") await loadClienteInterventi(currentClienteId);
}

export { apriSposta, spCampo, spConferma, spScegli, spTutti };
