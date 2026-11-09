// Equo App · proprietario · PROFESSIONISTI PROPOSTI DALLA SCUDERIA (4/11/2026 · SQL 43)
// 9/11/2026 (SQL 50): la proposta può essere un cambio («al posto di»), un sostituto a tempo o partire da una data
const ppPeriodo = p => { const d = x => x ? new Date(x + "T12:00").toLocaleDateString("it-IT") : ""; const oggi = new Date().toISOString().slice(0, 10);
  return (p.dal && p.dal > oggi ? " dal " + d(p.dal) : "") + (p.ruolo === "sostituto" && p.al ? " fino al " + d(p.al) : ""); };
// Quando la scuderia abbina un maniscalco a un mio cavallo, l'abbinamento aspetta la mia conferma:
// in Home compare «Professionisti da confermare» con Accetta / Rifiuta (core/dati/db-01: proposteProfessionisti,
// rispondiPropostaProfessionista). Accettando, il professionista riceve il cavallo nella sua app; rifiutando no.
// Si aggancia con le estensioni (renderHome): nessun file del proprietario cambia.

const ppEsc = s => escapeHtml(s == null ? "" : String(s));
const PP = { lista: [], il: 0 };

async function ppCarica(forza){
  if(!forza && PP.il && Date.now() - PP.il < 60000) return PP.lista;
  PP.lista = await DB.proposteProfessionisti().catch(() => []);
  PP.il = Date.now();
  return PP.lista;
}

async function ppRenderHome(){
  const home = document.getElementById("page-home"); if(!home || !currentUser) return;
  let box = document.getElementById("home-proposte-pro");
  if(!box){
    box = document.createElement("div"); box.id = "home-proposte-pro";
    const dopo = document.getElementById("home-oggi");
    if(dopo && dopo.parentNode) dopo.parentNode.insertBefore(box, dopo.nextSibling); else home.prepend(box);
  }
  const lista = await ppCarica();
  if(!lista.length){ box.innerHTML = ""; return; }
  box.innerHTML = `<div class="card ter-card"><div class="ter-tit">🐴 Professionisti da confermare</div>
    ${lista.map(p => `<div class="ter-piano" style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
      <div style="flex:1 1 180px;min-width:0;font-size:13.5px;line-height:1.45"><b>${ppEsc(p.scuderia)}</b> propone <b>${ppEsc(p.professionista)}</b> come ${ppEsc(p.professione)}${p.ruolo === "sostituto" ? " sostituto" : ""} di <b>${ppEsc(p.cavallo)}</b>${p.al_posto_di ? " al posto di " + ppEsc(p.al_posto_di) : ""}${ppPeriodo(p)}.
        <div class="muted" style="font-size:12px">Se accetti, vede il cavallo nella sua app e registra i lavori.</div></div>
      <div style="display:flex;gap:6px;flex-shrink:0">
        <button type="button" class="btn btn-outline btn-sm" onclick="ppRispondi('${p.id}', false, this)">Rifiuta</button>
        <button type="button" class="btn btn-primary btn-sm" onclick="ppRispondi('${p.id}', true, this)">Accetta</button></div></div>`).join("")}</div>`;
}

async function ppRispondi(id, accetta, btn){
  if(btn) btn.disabled = true;
  const { data, error } = await DB.rispondiPropostaProfessionista(id, accetta);
  if(error || !data?.ok){ if(btn) btn.disabled = false; return showToast((data && data.errore) || "Non salvato: riprova"); }
  showToast(accetta ? "Confermato: la scuderia riceve il tuo sì" : "Rifiutato: la scuderia riceve il tuo no");
  await ppCarica(true);
  ppRenderHome();
}

function ppAggancia(){
  try{ estendiDopo("renderHome", function(){ ppRenderHome(); }); }catch(err){ console.error("proposte professionisti:", err); }
}
if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", ppAggancia, { once: true }); else ppAggancia();

export { ppCarica, ppRenderHome, ppRispondi, PP };
