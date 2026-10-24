// Equo App · maniscalco · modulo (moduli ES, costruiti con Vite in ruoli/maniscalco/costruito.js)
import { loadClientiMascalcia } from "./032-richiamo-prossimo-intervento-sempre-in-g.js";
import { renderProDeadlines } from "./040-home-pro-prossimi-appuntamenti-da-richia.js";
import { renderIncassi } from "./047-incassi-saldati-per-periodo-da-saldare-p.js";
import { isoLocale } from "./051-modal-appuntamento-maniscalco-nuovo-modi.js";
import { formatDataBreve } from "./054-richieste-di-appuntamento-step-5d.js";
/* ---------- IMPORTAZIONE DALLA VECCHIA APP (24/10/2026): pop-up al primo accesso ----------
   Dopo un'importazione (es. Francesco Bizzarri) il maniscalco trova:
   1) le scelte che solo lui puo fare (tabella import_decisioni, funzione equo_import_decidi);
   2) le date delle ultime ferrature, stimate dalla scadenza: le conferma o le corregge struttura per struttura
      (interventi_mascalcia.data_da_confermare, funzione equo_import_conferma_date).
   Il pop-up ricompare a ogni accesso finche non ha finito; «Più tardi» lo chiude fino al prossimo accesso. */
let impScelte = [];      // scelte ancora aperte
let impDate = [];        // ferrature con data da confermare
let impFatte = 0;        // scelte fatte in questa sessione (per il contatore)
let impTotScelte = 0;
let impRimandato = false;
let impInCorso = false;

function impManiscalco(){
  return !DEMO_MODE && !!currentUser && vistaAi() === "professionista" && (currentUser.vistaAttiva || currentUser.ruolo) === "maniscalco";
}
async function impCarica(){
  const [s, d] = await Promise.all([DB.importScelteAperte(), DB.importDateDaConfermare()]);
  impScelte = s; impDate = d;
}
// chiamata all'avvio della vista professionista (core/script/008)
async function controllaImportVecchiaApp(){
  if(impRimandato || impInCorso || !impManiscalco()) return;
  // prima la scelta Semplice/Completa del primo accesso, se e aperta
  if(document.getElementById("eq-pop-vista")?.classList.contains("attivo")){ setTimeout(controllaImportVecchiaApp, 3000); return; }
  impInCorso = true;
  try {
    await impCarica();
    if(!impScelte.length && !impDate.length) return;
    impFatte = 0; impTotScelte = impScelte.length;
    impDisegna();
    openModal("modal-import-vecchia");
  } catch(e){ console.warn("importazione vecchia app:", e); }
  finally { impInCorso = false; }
}
function impPiuTardi(){
  impRimandato = true;
  closeModal("modal-import-vecchia");
  const n = impScelte.length, d = impDate.length;
  const parti = [];
  if(n) parti.push(n === 1 ? "1 scelta" : n + " scelte");
  if(d) parti.push(d === 1 ? "1 data" : d + " date");
  if(parti.length) showToast("Ti mancano " + parti.join(" e ") + ": te le richiedo al prossimo accesso");
}
function impDisegna(){
  const tit = document.getElementById("imp-tit"), corpo = document.getElementById("imp-corpo");
  if(impScelte.length){
    const s = impScelte[0];
    tit.textContent = "Dalla vecchia app: " + (impFatte + 1) + " di " + impTotScelte;
    const intro = impFatte === 0
      ? `<p class="imp-intro">Abbiamo portato su Equo strutture, cavalli, scadenze e pagamenti della tua vecchia app. Su alcune cose decidi tu: una alla volta, poi controlli le date.</p>` : "";
    const bottoni = (s.opzioni || []).map(o => {
      if(s.tipo === "pagamento_ignoto" && o.k === "da_saldare")
        return `<div class="imp-importo"><label class="prezzi-campo"><span>€</span><input type="number" min="0" step="0.01" inputmode="decimal" id="imp-importo" placeholder="importo"></label>
          <button class="btn btn-outline" onclick="impScegli('${o.k}')">${escapeHtml(o.t)}</button></div>`;
      return `<button class="btn btn-outline" onclick="impScegli('${o.k}')">${escapeHtml(o.t)}</button>`;
    }).join("");
    corpo.innerHTML = `${intro}<div class="imp-scheda"><div class="imp-cosa">${escapeHtml(s.titolo)}</div>
      <p>${escapeHtml(s.testo || "")}</p><div class="imp-opz">${bottoni}</div></div>`;
    return;
  }
  // date da confermare, per struttura
  tit.textContent = "Le date delle ultime ferrature";
  const gruppi = new Map();
  impDate.forEach(i => {
    const k = i.cliente_mascalcia_id || "-";
    if(!gruppi.has(k)) gruppi.set(k, { nome: i.clienti_mascalcia?.nome || "Senza struttura", righe: [] });
    gruppi.get(k).righe.push(i);
  });
  const oggi = isoLocale(new Date());
  const elenco = [...gruppi.entries()].sort((a, b) => a[1].nome.localeCompare(b[1].nome));
  corpo.innerHTML = `<p class="imp-intro">La vecchia app segnava solo la prossima scadenza: la data dell'ultima ferratura l'abbiamo stimata.
      Apri ogni struttura, correggi le date sbagliate e tocca «Confermo». Le scadenze restano quelle della vecchia app.</p>
    <div class="imp-resta">${impDate.length === 1 ? "Manca 1 cavallo" : "Mancano " + impDate.length + " cavalli"} in ${elenco.length === 1 ? "1 struttura" : elenco.length + " strutture"}</div>
    ${elenco.map(([, g]) => `<details class="imp-gruppo"><summary><b>${escapeHtml(g.nome)}</b><span>${g.righe.length}</span></summary>
      ${g.righe.sort((a, b) => (a.cavalli_clienti_mascalcia?.nome || "").localeCompare(b.cavalli_clienti_mascalcia?.nome || "")).map(i => `<div class="imp-riga">
        <div class="n"><b>${escapeHtml(i.cavalli_clienti_mascalcia?.nome || "Cavallo")}</b>${i.prossima_scadenza ? `<small>scade ${escapeHtml(formatDataBreve(i.prossima_scadenza))}</small>` : ""}</div>
        <input type="date" data-id="${i.id}" value="${String(i.data_intervento || "").slice(0, 10)}" min="2020-01-01" max="${oggi}"></div>`).join("")}
      <button class="btn btn-primary imp-conferma" onclick="impConfermaGruppo(this)">Confermo ${g.righe.length === 1 ? "la data" : "le " + g.righe.length + " date"}</button></details>`).join("")}`;
}
async function impScegli(k){
  const s = impScelte[0];
  if(!s) return;
  let importo = null;
  if(s.tipo === "pagamento_ignoto" && k === "da_saldare"){
    importo = Number(document.getElementById("imp-importo")?.value);
    if(!(importo > 0)){ showToast("Scrivi l'importo da saldare"); document.getElementById("imp-importo")?.focus(); return; }
  }
  document.querySelectorAll("#imp-corpo button").forEach(b => b.disabled = true);
  const { data, error } = await DB.importDecidi(s.id, k, importo);
  if(error || !data || data.ok === false){
    document.querySelectorAll("#imp-corpo button").forEach(b => b.disabled = false);
    showToast("Non sono riuscito a salvare: " + (error?.message || data?.motivo || "riprova"));
    return;
  }
  impScelte.shift(); impFatte++;
  // una scelta puo aggiungere un cavallo con la sua data da confermare (es. «sono due cavalli diversi»)
  if(!impScelte.length) impDate = await DB.importDateDaConfermare();
  if(!impScelte.length && !impDate.length) return impFinito();
  impDisegna();
}
async function impConfermaGruppo(btn){
  const box = btn.closest(".imp-gruppo");
  const oggi = isoLocale(new Date());
  const righe = [...box.querySelectorAll("input[type=date]")].map(x => ({ id: x.dataset.id, data: x.value }));
  if(righe.some(r => !r.data || r.data > oggi || r.data < "2020-01-01")){ showToast("Controlla le date: non possono essere vuote né nel futuro"); return; }
  btn.disabled = true;
  const { data, error } = await DB.importConfermaDate(righe);
  if(error){ btn.disabled = false; showToast("Non sono riuscito a salvare: " + error.message); return; }
  const fatte = new Set(righe.map(r => r.id));
  impDate = impDate.filter(i => !fatte.has(i.id));
  showToast((data === 1 ? "1 data confermata" : (data || righe.length) + " date confermate") + " · " + (box.querySelector("summary b")?.textContent || ""));
  if(!impDate.length) return impFinito();
  // tolgo solo questa struttura: le date gia corrette nelle altre restano come le hai scritte
  box.remove();
  const nStr = document.querySelectorAll("#imp-corpo .imp-gruppo").length, resta = document.querySelector("#imp-corpo .imp-resta");
  if(resta) resta.textContent = (impDate.length === 1 ? "Manca 1 cavallo" : "Mancano " + impDate.length + " cavalli") + " in " + (nStr === 1 ? "1 struttura" : nStr + " strutture");
}
async function impFinito(){
  closeModal("modal-import-vecchia");
  showToast("Fatto: i dati della vecchia app sono a posto");
  try { await loadClientiMascalcia(); await renderIncassi(); await renderProDeadlines(); } catch(e){}
}

export { controllaImportVecchiaApp, impConfermaGruppo, impPiuTardi, impScegli };
