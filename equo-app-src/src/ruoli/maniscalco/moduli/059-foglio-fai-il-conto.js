// Equo App · maniscalco · modulo (moduli ES, costruiti con Vite in ruoli/maniscalco/costruito.js)
import { loadClientiMascalcia } from "./032-richiamo-prossimo-intervento-sempre-in-g.js";
import { renderIncassi } from "./047-incassi-saldati-per-periodo-da-saldare-p.js";
import { clienteDiId, eLuogoScuderia } from "./050-sposta-cavallo-dove-sta-il-cavallo-a-cas.js";
import { isoLocale } from "./051-modal-appuntamento-maniscalco-nuovo-modi.js";
import { agDescrizioneTipo, agNomeCavallo } from "./053-agenda-settimanale-maniscalco.js";
import { chiediSiNo } from "./052-ferro-standard-nella-scheda-del-cavallo.js";
import { ContoDB, contoCodice, contoData, contoEuro, contoLavori } from "./057-pdf-appuntamento-invio-in-chat-maniscalc.js";
import { caricaContiCliente } from "./058-scheda-cliente-pulsante-elenco-dei-conti.js";
import { apriInvioConto } from "./060-foglio-di-invio-gestione-del-conto.js";
import { caricaCavalliMiei } from "./086-indice-dei-cavalli-dei-clienti-professio.js";
/* ---- foglio «Fai il conto» ---- */
async function apriNuovoConto(clienteId){
  if(incassiNascosti()){ showToast("Hai nascosto gli incassi: mostrali dal menu (serve il PIN) per fare il conto."); return; }
  if(!clienteDiId(clienteId)) await loadClientiMascalcia().catch(() => {});
  const cli = clienteDiId(clienteId);
  contoCtx = { clienteId, scuderia: eLuogoScuderia(cli), modo: "unico", periodo: "tutto", da: "", a: "", tutti: [], lavori: [], sel: new Set() };
  document.getElementById("conto-nuovo-titolo").textContent = "Conto · " + (cli?.nome || "cliente");
  document.getElementById("conto-nuovo-corpo").innerHTML = '<div class="loading"><div class="spinner"></div> Carico i lavori…</div>';
  openModal("modal-conto-nuovo");
  await caricaCavalliMiei().catch(() => {});
  [contoCtx.tutti, contoCtx.aperti] = await Promise.all([ContoDB.lavoriLiberi(clienteId), ContoDB.aperti(clienteId)]);
  contoApplicaPeriodo();
}
// i lavori da saldare sono già in un conto aperto: si apre quello, oppure si annulla e si rifà
function contoApriEsistente(id){ closeModal("modal-conto-nuovo"); apriInvioConto(id); }
async function contoAnnullaERifai(id){
  const c = (contoCtx?.aperti || []).find(x => x.id === id); if(!c) return;
  if(!await chiediSiNo("Annullare e rifare il conto?", `Il conto ${contoCodice(c)} diventa «annullato» e i suoi ${contoLavori(c.n_lavori)} tornano liberi: subito dopo puoi fare il conto nuovo, anche con i lavori aggiunti nel frattempo.`)) return;
  const { error } = await ContoDB.annulla(id);
  if(error){ showToast("Errore: " + (error.message || "riprova")); return; }
  showToast("Conto " + contoCodice(c) + " annullato");
  [contoCtx.tutti, contoCtx.aperti] = await Promise.all([ContoDB.lavoriLiberi(contoCtx.clienteId), ContoDB.aperti(contoCtx.clienteId)]);
  contoApplicaPeriodo();
  if(currentClienteId) caricaContiCliente(currentClienteId);
  if(typeof renderIncassi === "function") renderIncassi();
}
function contoApplicaPeriodo(){
  const c = contoCtx; if(!c) return;
  const oggi = new Date(), iso = isoLocale;
  let da = "", a = "";
  if(c.periodo === "mese"){ da = iso(new Date(oggi.getFullYear(), oggi.getMonth(), 1)); a = iso(new Date(oggi.getFullYear(), oggi.getMonth() + 1, 0)); }
  else if(c.periodo === "scorso"){ da = iso(new Date(oggi.getFullYear(), oggi.getMonth() - 1, 1)); a = iso(new Date(oggi.getFullYear(), oggi.getMonth(), 0)); }
  else if(c.periodo === "date"){ da = c.da; a = c.a; }
  c.pDa = da; c.pA = a;
  c.lavori = c.tutti.filter(i => (!da || i.data_intervento >= da) && (!a || i.data_intervento <= a));
  c.sel = new Set(c.lavori.map(i => i.id));
  renderNuovoConto();
}
function contoSetPeriodo(p){ contoCtx.periodo = p; if(p !== "date") contoApplicaPeriodo(); else renderNuovoConto(); }
function contoSetDate(){
  contoCtx.da = document.getElementById("conto-da").value; contoCtx.a = document.getElementById("conto-a").value;
  contoApplicaPeriodo();
}
function contoSetModo(m){ contoCtx.modo = m; renderNuovoConto(); }
function contoToggleGruppo(nome){
  const c = contoCtx; if(!c) return;
  const ids = c.lavori.filter(i => contoNomeProprietario(i) === nome).map(i => i.id);
  const tutti = ids.every(id => c.sel.has(id));
  ids.forEach(id => tutti ? c.sel.delete(id) : c.sel.add(id));
  renderNuovoConto();
}
function contoToggle(id){ contoCtx.sel.has(id) ? contoCtx.sel.delete(id) : contoCtx.sel.add(id); renderNuovoConto(); }
function contoNomeProprietario(i){ return clienteDiId(i.cliente_mascalcia_id)?.nome || "Cliente"; }
function contoNomeCavallo(i){ return agNomeCavallo(i) || clienteDiId(i.cliente_mascalcia_id)?.nome_cavallo || "Cavallo"; }
function renderNuovoConto(){
  const c = contoCtx; if(!c) return;
  const chip = (k, t) => `<button type="button" class="btn ${c.periodo === k ? "btn-primary" : "btn-outline"} btn-sm" onclick="contoSetPeriodo('${k}')">${t}</button>`;
  const scelti = c.lavori.filter(i => c.sel.has(i.id));
  const tot = scelti.reduce((s, i) => s + Number(i.importo), 0);
  const gruppi = {};
  c.lavori.forEach(i => { (gruppi[contoNomeProprietario(i)] = gruppi[contoNomeProprietario(i)] || []).push(i); });
  const nomi = Object.keys(gruppi).sort((a, b) => a.localeCompare(b, "it"));
  const nPag = new Set(scelti.map(i => i.cliente_mascalcia_id)).size;
  // 28/10/2026 (caso Francesco, Centro Ippico Levante): i conti ancora aperti si vedono sempre, anche quando ci sono lavori nuovi,
  // così è chiaro dove sono gli altri lavori e si può «Annulla e rifai» per metterli tutti in un conto solo
  const righeAperti = (c.aperti || []).map(k => `<div class="conto-gia-r"><span><b>${contoCodice(k)}</b> del ${contoData(k.creato_il)} · ${contoLavori(k.n_lavori)} · ${contoEuro(k.totale)}<small>Da incassare</small></span>
            <span class="conto-gia-a"><button type="button" class="btn btn-primary btn-sm" onclick="contoApriEsistente('${k.id}')">Apri il conto</button><button type="button" class="btn btn-outline btn-sm" onclick="contoAnnullaERifai('${k.id}')">Annulla e rifai</button></span></div>`).join("");
  const nGia = (c.aperti || []).reduce((s, k) => s + Number(k.n_lavori || 0), 0);
  const giaSopra = c.lavori.length && righeAperti ? `<div class="conto-gia" style="margin-top:14px">
      <b>${nGia === 1 ? "Un altro lavoro è" : "Altri " + nGia + " lavori sono"} già in un conto da incassare: qui sotto ci sono solo quelli nuovi.</b>
      <div class="muted" style="font-size:12px;margin:2px 0 4px">Per un conto unico con tutto tocca «Annulla e rifai»: il vecchio conto si annulla e i suoi lavori tornano qui.</div>
      ${righeAperti}</div>` : "";
  const modoHtml = c.scuderia ? `<div class="clienti-sez-title" style="margin:14px 0 6px">CHI PAGA</div>
    <div style="display:flex;gap:6px;flex-wrap:wrap">
      <button type="button" class="btn ${c.modo === "unico" ? "btn-primary" : "btn-outline"} btn-sm" onclick="contoSetModo('unico')">Paga la scuderia · conto unico</button>
      <button type="button" class="btn ${c.modo === "per_proprietario" ? "btn-primary" : "btn-outline"} btn-sm" onclick="contoSetModo('per_proprietario')">Un conto per proprietario</button>
    </div>` : "";
  document.getElementById("conto-nuovo-corpo").innerHTML = `
    ${modoHtml}
    <div class="clienti-sez-title" style="margin:14px 0 6px">PERIODO</div>
    <div style="display:flex;gap:6px;flex-wrap:wrap">${chip("tutto", "Non ancora saldato")}${chip("mese", "Questo mese")}${chip("scorso", "Mese scorso")}${chip("date", "Scegli le date")}</div>
    ${c.periodo === "date" ? `<div style="display:flex;gap:8px;margin-top:8px"><input class="input" type="date" id="conto-da" value="${c.da}" onchange="contoSetDate()"><input class="input" type="date" id="conto-a" value="${c.a}" onchange="contoSetDate()"></div>` : ""}
    ${giaSopra}
    <div class="clienti-sez-title" style="margin:14px 0 6px">LAVORI INCLUSI (${scelti.length} di ${c.lavori.length})</div>
    ${c.lavori.length ? nomi.map(n => `
      ${(c.scuderia || nomi.length > 1) ? `<label style="display:flex;align-items:center;gap:10px;margin:10px 0 2px;font-size:13px;font-weight:700;color:var(--accent)">
        <input type="checkbox" data-gruppo="${escapeHtml(n)}" ${gruppi[n].every(i => c.sel.has(i.id)) ? "checked" : ""} onchange="contoToggleGruppo(this.dataset.gruppo)">
        <span style="flex:1">${escapeHtml(n)}</span><span class="muted" style="font-size:12px;font-weight:600">${gruppi[n].filter(i => c.sel.has(i.id)).length}/${gruppi[n].length}</span></label>` : ""}
      ${gruppi[n].map(i => `<label style="display:flex;align-items:center;gap:10px;padding:7px 0;border-top:1px solid var(--border)">
        <input type="checkbox" ${c.sel.has(i.id) ? "checked" : ""} onchange="contoToggle('${i.id}')">
        <span style="flex:1;min-width:0"><b>${escapeHtml(contoNomeCavallo(i))}</b><span class="muted" style="font-size:12px;display:block">${contoData(i.data_intervento)} · ${escapeHtml(agDescrizioneTipo(i))}</span></span>
        <b>${contoEuro(i.importo)}</b></label>`).join("")}`).join("")
      : (c.aperti || []).length ? `<div class="conto-gia">
          <b>${c.tutti.length ? "In questo periodo non ci sono altri lavori da mettere nel conto." : "Tutti i lavori da saldare sono già in un conto."}</b>
          ${righeAperti}
        </div>`
      : '<div class="muted" style="font-size:13px;padding:8px 0">Nessun lavoro da saldare in questo periodo.</div>'}
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px;padding-top:12px;border-top:2px solid var(--border)"><span style="font-weight:700">Totale</span><b style="font-size:20px">${contoEuro(tot)}</b></div>
    ${c.scuderia && c.modo === "per_proprietario" && nPag > 1 ? `<div class="muted" style="font-size:12px;margin-top:6px">Verranno creati ${nPag} conti, uno per ciascun proprietario.</div>` : ""}
    <button class="btn btn-primary" id="conto-crea-btn" style="width:100%;margin-top:14px" ${scelti.length ? "" : "disabled"} onclick="creaContoDaScelte()">Crea il PDF</button>
    <div class="muted" style="font-size:11.5px;line-height:1.5;margin-top:8px">Il conto prende un numero e resta salvato. Non è una fattura.</div>`;
  document.querySelectorAll("#conto-nuovo-corpo input[data-gruppo]").forEach(cb => {
    const l = gruppi[cb.dataset.gruppo] || [], n = l.filter(i => c.sel.has(i.id)).length;
    cb.indeterminate = n > 0 && n < l.length;
  });
}
async function creaContoDaScelte(){
  const c = contoCtx; if(!c) return;
  const btn = document.getElementById("conto-crea-btn"); btn.disabled = true;
  const scelti = c.lavori.filter(i => c.sel.has(i.id));
  const riga = i => ({ intervento_id: i.id, cavallo_nome: contoNomeCavallo(i), proprietario_nome: contoNomeProprietario(i), descrizione: agDescrizioneTipo(i) });
  const per = c.scuderia && c.modo === "per_proprietario";
  const mappa = new Map();
  scelti.forEach(i => { const k = per ? i.cliente_mascalcia_id : c.clienteId; (mappa.get(k) || mappa.set(k, []).get(k)).push(i); });
  const creati = [];
  for(const [clienteId, lav] of mappa){
    const { data, error } = await ContoDB.crea(clienteId, per ? "per_proprietario" : "unico", c.pDa || null, c.pA || null, lav.map(riga));
    if(error){ showToast("Conto non creato: " + (error.message || "riprova")); btn.disabled = false; break; }
    creati.push(data);
  }
  if(!creati.length) return;
  closeModal("modal-conto-nuovo");
  contoCtx = null;
  if(currentClienteId) caricaContiCliente(currentClienteId);
  if(typeof renderIncassi === "function") renderIncassi();
  if(creati.length === 1) return apriInvioConto(creati[0].id);
  showToast(creati.length + " conti creati: li trovi nella scheda di ogni proprietario");
}


export { contoAnnullaERifai, contoApriEsistente, apriNuovoConto, contoSetDate, contoSetModo, contoSetPeriodo, contoToggle, contoToggleGruppo, creaContoDaScelte };
