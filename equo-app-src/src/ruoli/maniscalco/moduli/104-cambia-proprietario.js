// Equo App · maniscalco · modulo (moduli ES, costruiti con Vite in ruoli/maniscalco/costruito.js)
import { clientiAttivi, loadClientiMascalcia } from "./032-richiamo-prossimo-intervento-sempre-in-g.js";
import { isStruttura } from "./033-clienti-a-cartelle-stile-telegram-cavall.js";
import { openClienteDetail } from "./034-strutture-collegate-a-equo-scuderia-prof.js";
import { creaClienteUnico } from "./116-onboarding.js";
import { clienteDiId } from "./050-sposta-cavallo-dove-sta-il-cavallo-a-cas.js";
import { contoEuro } from "./057-pdf-appuntamento-invio-in-chat-maniscalc.js";
import { caricaCavalliMiei, cavalliMieiLista } from "./086-indice-dei-cavalli-dei-clienti-professio.js";
/* ---------- CAMBIA PROPRIETARIO (24/10/2026) ----------
   In scuderia ci sono cavalli della struttura e cavalli di proprietari esterni: il maniscalco intesta un cavallo (o più cavalli
   insieme) al suo proprietario, che da lì paga. Il cavallo resta DOVE STA (nella scuderia, in «Qui stanno»).
   Lavori già fatti e da saldare: decide il maniscalco ogni volta (passano al nuovo proprietario o restano alla scuderia).
   Database: RPC pro_cambia_proprietario (schema-cambia-proprietario.sql). */
let cpCtx = null;

// da: scheda del cavallo (un cavallo) oppure scheda della struttura (scegli i cavalli)
async function apriCambiaProprietario(daStruttura){
  const cli = clienteDiId(currentClienteId);
  if(!cli) return;
  let cavalli;
  if(daStruttura){
    await caricaCavalliMiei().catch(() => {});
    cavalli = (cavalliMieiLista || []).filter(c => c.cliente_mascalcia_id === cli.id && !c.horse_id)
      .sort((a, b) => (a.nome || "").localeCompare(b.nome || "", "it", { sensitivity: "base" }));
    if(!cavalli.length){ showToast("In questa struttura non ci sono cavalli da assegnare."); return; }
  } else {
    const cv = schedaCavalli.find(c => c.key === schedaCavalloKey);
    if(!cv) return;
    if(cv.tipo !== "manuale" || cv.horse_id){ showToast("Questo cavallo è collegato al suo proprietario su Equo: il proprietario non si cambia da qui."); return; }
    if(!cv.id){ showToast("Salva prima il cavallo, poi cambia il proprietario."); return; }
    cavalli = [cv];
  }
  cpCtx = { daId: cli.id, daNome: cli.nome, struttura: isStruttura(cli), cavalli, sel: new Set(daStruttura ? [] : [cavalli[0].id]), multi: !!daStruttura, aperti: null };
  document.getElementById("cp-tit").textContent = daStruttura ? "Proprietari dei cavalli · " + cli.nome : "Cambia proprietario · " + (cavalli[0].nome || "cavallo");
  const alf = (a, b) => (a.nome || "").localeCompare(b.nome || "", "it", { sensitivity: "base" });
  const pr = clientiAttivi().filter(c => c.id !== cli.id && !isStruttura(c)).sort(alf), sc = clientiAttivi().filter(c => c.id !== cli.id && isStruttura(c)).sort(alf);
  document.getElementById("cp-dest").innerHTML = '<option value="">Scegli il proprietario…</option><option value="__nuovo">+ Nuovo proprietario</option>'
    + (pr.length ? `<optgroup label="Proprietari">${pr.map(c => `<option value="${c.id}">${escapeHtml(c.nome)}</option>`).join("")}</optgroup>` : "")
    + (sc.length ? `<optgroup label="Altre scuderie">${sc.map(c => `<option value="${c.id}">${escapeHtml(c.nome)}</option>`).join("")}</optgroup>` : "");
  document.getElementById("cp-nuovo").hidden = true;
  document.getElementById("cp-nuovo-nome").value = ""; document.getElementById("cp-nuovo-tel").value = "";
  document.getElementById("cp-errore").style.display = "none";
  document.getElementById("cp-nota").textContent = cpCtx.struttura
    ? `${daStruttura ? "I cavalli scelti restano" : "Il cavallo resta"} in «${cli.nome}» (lo trovi in «Qui stanno»): cambia solo chi paga. Gli appuntamenti futuri passano al nuovo proprietario.`
    : "Cambia solo chi paga: gli appuntamenti futuri passano al nuovo proprietario.";
  cpRenderCavalli();
  openModal("modal-cambia-proprietario");
  await cpContaAperti();
}
function cpRenderCavalli(){
  const c = cpCtx; if(!c) return;
  const box = document.getElementById("cp-cavalli");
  box.hidden = !c.multi;
  if(c.multi) box.innerHTML = `<div class="cp-sez">Quali cavalli? <span class="muted">(${c.sel.size} scelti)</span></div>` + c.cavalli.map(cv => `<label class="cp-cav">
      <input type="checkbox" ${c.sel.has(cv.id) ? "checked" : ""} onchange="cpScegliCavallo('${cv.id}', this.checked)"><b>${escapeHtml(cv.nome || "Cavallo")}</b>
      ${cv.codice_equo ? `<small>${escapeHtml(cv.codice_equo)}</small>` : ""}</label>`).join("");
}
function cpScegliCavallo(id, on){
  if(!cpCtx) return;
  on ? cpCtx.sel.add(id) : cpCtx.sel.delete(id);
  const t = document.querySelector("#cp-cavalli .cp-sez .muted"); if(t) t.textContent = `(${cpCtx.sel.size} scelti)`;
  clearTimeout(cpCtx.timer); cpCtx.timer = setTimeout(cpContaAperti, 300);
}
function cpDestCambiata(sel){
  document.getElementById("cp-nuovo").hidden = sel.value !== "__nuovo";
  if(sel.value === "__nuovo") document.getElementById("cp-nuovo-nome").focus();
}
// lavori già fatti e da saldare dei cavalli scelti (non già in un conto): chi li paga?
async function cpContaAperti(){
  const c = cpCtx; if(!c) return;
  const ids = [...c.sel];
  const box = document.getElementById("cp-aperti");
  if(!ids.length || incassiNascosti()){ c.aperti = null; box.hidden = true; return; }
  const lav = await DB.lavoriApertiCavalli(ids, c.daId);
  if(cpCtx !== c) return;
  c.aperti = lav;
  if(!lav.length){ box.hidden = true; return; }
  const tot = lav.reduce((s, i) => s + (Number(i.importo) || 0), 0);
  box.hidden = false;
  box.innerHTML = `<div class="cp-sez">${lav.length === 1 ? "C'è 1 lavoro già fatto" : "Ci sono " + lav.length + " lavori già fatti"} e da saldare (${escapeHtml(contoEuro(tot))}). Chi li paga?</div>
    <label class="cp-opz"><input type="radio" name="cp-aperti" value="si" checked> Il nuovo proprietario</label>
    <label class="cp-opz"><input type="radio" name="cp-aperti" value="no"> Restano a «${escapeHtml(c.daNome)}»</label>
    <div class="muted" style="font-size:12px;margin-top:4px">I lavori già saldati restano sempre a «${escapeHtml(c.daNome)}».</div>`;
}
async function confermaCambiaProprietario(btn){
  const c = cpCtx; if(!c) return;
  const err = document.getElementById("cp-errore");
  const errore = t => { err.textContent = t; err.style.display = "block"; };
  err.style.display = "none";
  const ids = [...c.sel];
  if(!ids.length) return errore("Scegli almeno un cavallo.");
  let dest = document.getElementById("cp-dest").value;
  if(!dest) return errore("Scegli il proprietario (oppure «+ Nuovo proprietario»).");
  const aperti = !!(c.aperti && c.aperti.length && document.querySelector('input[name="cp-aperti"]:checked')?.value === "si");
  btn.disabled = true;
  try{
    if(dest === "__nuovo"){
      const nome = document.getElementById("cp-nuovo-nome").value.trim();
      if(!nome) return errore("Scrivi il nome del nuovo proprietario.");
      const { data, error } = await creaClienteUnico({ nome, telefono: document.getElementById("cp-nuovo-tel").value.trim() || null, tipo_cliente: "proprietario" });   // 28/10/2026: strada unica
      if(error || !data) return errore(error?.message || "Proprietario non creato, riprova.");
      dest = data.id;
    }
    const res = await DB.cambiaProprietario(ids, dest, aperti);
    if(!res || !res.ok) return errore(res?.errore || "Non riuscito, riprova.");
    closeModal("modal-cambia-proprietario");
    await loadClientiMascalcia();
    await caricaCavalliMiei().catch(() => {});
    const nomeDest = clienteDiId(dest)?.nome || "nuovo proprietario";
    showToast(`${res.spostati === 1 ? "1 cavallo" : res.spostati + " cavalli"} intestati a «${nomeDest}»` + (res.lavori ? ` · ${res.lavori === 1 ? "1 lavoro da saldare passato" : res.lavori + " lavori da saldare passati"}` : ""));
    cpCtx = null;
    await openClienteDetail(c.daId);   // si torna alla scheda della scuderia: i cavalli ora sono in «Qui stanno»
  } finally { btn.disabled = false; }
}

export { apriCambiaProprietario, confermaCambiaProprietario, cpDestCambiata, cpScegliCavallo };
