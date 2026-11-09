// Equo App · proprietario · «DA VERIFICARE» (9/11/2026 · SQL 54, QR intelligente fase 3)
// Un cavallo arrivato dal maniscalco può avere dati incompleti o diversi dai tuoi. Nella scheda del cavallo:
// badge «Da verificare», campi che mancano, dati in cui il maniscalco ha scritto altro (Usa questo / Tieni il mio),
// e «I dati sono giusti». Niente si sovrascrive da solo; i lavori restano del maniscalco.
import { loadHorses } from "./023-horses.js";
import { openHorseDetail, renderHorsesList } from "./026-ultimo-messaggio-home.js";

const dvEsc = s => escapeHtml(s == null ? "" : String(s));
(function dvStile(){
  if(document.getElementById("dv-stile")) return;
  const st = document.createElement("style"); st.id = "dv-stile";
  st.textContent = `.dv-card{border:1.5px solid rgba(232,176,75,.8);margin-bottom:14px}
.dv-badge{font-size:11px;font-weight:800;color:#7A5A00;background:#F8EDD2;border-radius:999px;padding:3px 10px;letter-spacing:.02em}
.dv-riga{padding:8px 0;border-top:1px solid var(--border,#DDE5E0);font-size:13.5px;line-height:1.45}
.dv-bottoni{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}`;
  document.head.appendChild(st);
})();

async function verificaRender(id){
  const info = document.getElementById("horse-info-box");
  if(!info || DEMO_MODE) return;
  let box = document.getElementById("horse-verifica");
  if(!box){ box = document.createElement("div"); box.id = "horse-verifica"; info.parentNode.insertBefore(box, info); }
  box.innerHTML = "";
  const { data, error } = await sb.rpc("equo_cavallo_verifica", { p_horse: id, p_sc: null });
  if(error || !data || data.errore || currentHorseId !== id) return;
  const diff = data.differenze || [], manca = data.mancano || [];
  if(!data.da_verificare && !diff.length) return;
  const da = (data.da || []).join(", ");
  const righe = diff.map(d => {
    const tuo = d.tuo == null || d.tuo === "" ? "—" : d.tuo;
    const val = String(d.suo).replace(/'/g, "\\'");
    return `<div class="dv-riga"><div><b>${dvEsc(d.etichetta)}</b>: tu <i>${dvEsc(tuo)}</i> · ${dvEsc(d.chi || "il maniscalco")} <i>${dvEsc(d.suo)}</i></div>
      <div class="dv-bottoni">${d.solo_info ? "" : `<button type="button" class="btn btn-primary btn-sm" onclick="verificaScelta('${id}','usa','${d.campo}','${dvEsc(val)}')">Usa ${dvEsc(d.suo)}</button>`}
        <button type="button" class="btn btn-outline btn-sm" onclick="verificaScelta('${id}','tieni','${d.campo}','${dvEsc(val)}')">${d.solo_info ? "Ok, tengo il mio" : d.manca ? "Lascia vuoto" : "Tieni il mio"}</button></div></div>`;
  }).join("");
  box.innerHTML = `<div class="card dv-card">
    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><span class="dv-badge">Da verificare</span>
      ${da ? `<span class="muted" style="font-size:12.5px">Scheda arrivata da ${dvEsc(da)}</span>` : ""}</div>
    ${manca.length ? `<div style="font-size:13.5px;margin-top:8px">Mancano: <b>${manca.map(dvEsc).join(", ")}</b> <button type="button" class="btn btn-ghost btn-sm" onclick="openHorseForm('${id}')">Completa</button></div>` : ""}
    ${righe ? `<div style="font-size:13px;margin-top:8px">Il maniscalco ha scritto qualcosa di diverso: scegli tu cosa tenere.</div>${righe}` : ""}
    ${data.da_verificare ? `<button type="button" class="btn btn-primary" style="width:100%;margin-top:10px" onclick="verificaScelta('${id}','conferma')">I dati sono giusti</button>` : ""}
    <div class="muted" style="font-size:11.5px;margin-top:6px">Nulla cambia da solo. I lavori del maniscalco restano nel libretto con il suo nome.</div></div>`;
}
async function verificaScelta(id, azione, campo, valore){
  const { data, error } = await sb.rpc("equo_cavallo_scelta", { p_horse: id, p_sc: null, p_azione: azione, p_campo: campo || null, p_valore: valore || null });
  if(error || !data?.ok){ showToast((data && data.errore) || "Non riuscito, riprova."); return; }
  showToast(azione === "conferma" ? "Dati confermati." : azione === "usa" ? "Dato aggiornato." : "Ok, tieni il tuo.");
  await loadHorses();
  if(typeof renderHorsesList === "function") renderHorsesList();
  if(currentHorseId === id) await openHorseDetail(id);
}
try{ estendiDopo("openHorseDetail", function(id){ return verificaRender(id); }); }catch(err){ console.error("da verificare:", err); }

export { verificaRender, verificaScelta };
