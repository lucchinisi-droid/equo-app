// Equo App · proprietario · I CONTI DELLA SCUDERIA (6/11/2026 · SQL 44)
// Quando la scuderia (o la sua ASD) invia il conto del mese, in Home compare «I tuoi conti»: voci, totale, quanto manca.
// «Ho già pagato» scrive alla scuderia in chat; il pagamento lo registra la scuderia. Il conto è un riepilogo, non una fattura.
// core/dati/db-01: mieiConti, segnalaContoPagato. Si aggancia con le estensioni (renderHome).

const ctEsc = s => escapeHtml(s == null ? "" : String(s));
const ctEuro = n => (Number(n) || 0).toLocaleString("it-IT", { style: "currency", currency: "EUR" });
const ctMese = iso => { const d = new Date(String(iso).slice(0, 10) + "T12:00:00"); return d.toLocaleDateString("it-IT", { month: "long", year: "numeric" }); };
const CT = { lista: [], il: 0, aperto: null };

async function ctCarica(forza){
  if(!forza && CT.il && Date.now() - CT.il < 60000) return CT.lista;
  CT.lista = await DB.mieiConti().catch(() => []);
  CT.il = Date.now();
  return CT.lista;
}
function ctDaMostrare(){
  const limite = Date.now() - 45 * 864e5;
  return CT.lista.filter(c => Number(c.residuo) > 0.004 || new Date(c.inviato_il || c.mese).getTime() > limite);
}
async function ctRenderHome(){
  const home = document.getElementById("page-home"); if(!home || !currentUser) return;
  let box = document.getElementById("home-conti-scuderia");
  if(!box){
    box = document.createElement("div"); box.id = "home-conti-scuderia";
    const dopo = document.getElementById("home-proposte-pro") || document.getElementById("home-oggi");
    if(dopo && dopo.parentNode) dopo.parentNode.insertBefore(box, dopo.nextSibling); else home.prepend(box);
  }
  await ctCarica();
  const lista = ctDaMostrare();
  if(!lista.length){ box.innerHTML = ""; return; }
  box.innerHTML = `<div class="card ter-card"><div class="ter-tit">🧾 I tuoi conti</div>${lista.map(c => {
    const pagato = Number(c.residuo) <= 0.004, aperto = CT.aperto === c.id;
    return `<div class="ter-piano">
      <button type="button" style="all:unset;display:flex;align-items:center;gap:10px;width:100%;cursor:pointer" onclick="ctApri('${c.id}')">
        <span style="flex:1;min-width:0;font-size:13.5px;line-height:1.4"><b>${ctEsc(c.emittente)}</b> · ${ctEsc(ctMese(c.mese))}
          <span class="muted" style="display:block;font-size:12px">n. ${ctEsc(c.numero)} · ${pagato ? "pagato ✓" : Number(c.pagato) > 0 ? "pagati " + ctEuro(c.pagato) + ", mancano " + ctEuro(c.residuo) : "da pagare"}</span></span>
        <b style="white-space:nowrap">${ctEuro(c.totale)}</b><span class="muted">${aperto ? "▴" : "▾"}</span></button>
      ${aperto ? `<div style="margin-top:8px;font-size:13px">${(c.righe || []).map(r => `<div style="display:flex;justify-content:space-between;gap:10px;padding:5px 0;border-bottom:1px solid var(--border,#eee)">
          <span>${ctEsc(r.descrizione)}${r.per ? `<small class="muted" style="display:block">per ${ctEsc(r.per)}</small>` : ""}</span><span style="white-space:nowrap">${ctEuro(r.importo)}</span></div>`).join("")}
        ${!pagato ? `<button type="button" class="btn btn-primary btn-sm" style="margin-top:10px" onclick="ctHoPagato('${c.id}', this)">Ho già pagato</button>` : ""}
        <div class="muted" style="font-size:11.5px;margin-top:8px">Riepilogo della scuderia: non è una fattura.</div></div>` : ""}
    </div>`;
  }).join("")}</div>`;
}
function ctApri(id){ CT.aperto = CT.aperto === id ? null : id; ctRenderHome(); }
async function ctHoPagato(id, btn){
  if(btn) btn.disabled = true;
  const { data, error } = await DB.segnalaContoPagato(id);
  if(error || !data?.ok){ if(btn) btn.disabled = false; return showToast((data && data.errore) || "Non inviato: riprova"); }
  showToast("Fatto: la scuderia riceve il messaggio e registra il pagamento");
}

function ctAggancia(){
  try{ estendiDopo("renderHome", function(){ ctRenderHome(); }); }catch(err){ console.error("conti scuderia:", err); }
}
if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", ctAggancia, { once: true }); else ctAggancia();

export { ctCarica, ctRenderHome, ctApri, ctHoPagato, CT };
