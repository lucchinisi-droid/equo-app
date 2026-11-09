/* =====================================================================
   «DA VERIFICARE» (9/11/2026 · SQL 54, QR intelligente fase 3) — script normale: funzioni globali.
   I cavalli aggiunti dalle proposte del maniscalco nascono «Da verificare». Nella scheda del cavallo:
   campi che mancano, dati diversi da quelli scritti dal maniscalco (Usa questo / Tieni il nostro), «I dati sono giusti».
   Niente si sovrascrive da solo; i lavori restano del maniscalco che li ha fatti.
   ===================================================================== */
async function cavVerificaRender(id){
  const box = document.getElementById("cav-verifica-box"); if(!box) return;
  box.innerHTML = "";
  if(DEMO_MODE || !id) return;
  const { data, error } = await sb.rpc("equo_cavallo_verifica", { p_horse: null, p_sc: id });
  if(error || !data || data.errore || currentCavalloId !== id) return;
  const diff = data.differenze || [], manca = data.mancano || [];
  if(!data.da_verificare && !diff.length) return;
  const puo = typeof puoCollegareProfessionisti === "function" ? puoCollegareProfessionisti() : true;
  const da = (data.da || []).join(", ");
  const righe = diff.map(d => {
    const tuo = d.tuo == null || d.tuo === "" ? "—" : d.tuo;
    const val = String(d.suo).replace(/'/g, "\\'");
    return `<div class="dv-riga"><div><b>${escapeHtml(d.etichetta)}</b>: voi <i>${escapeHtml(String(tuo))}</i> · ${escapeHtml(d.chi || "il maniscalco")} <i>${escapeHtml(String(d.suo))}</i></div>
      ${puo ? `<div class="dv-bottoni">${d.solo_info ? "" : `<button class="btn btn-primary btn-sm" onclick="cavVerificaScelta('${id}','usa','${d.campo}','${escapeHtml(val)}')">Usa ${escapeHtml(String(d.suo))}</button>`}
        <button class="btn btn-outline btn-sm" onclick="cavVerificaScelta('${id}','tieni','${d.campo}','${escapeHtml(val)}')">${d.solo_info ? "Ok, teniamo il nostro" : d.manca ? "Lascia vuoto" : "Tieni il nostro"}</button></div>` : ""}</div>`;
  }).join("");
  box.innerHTML = `<div class="card dv-card" style="margin-bottom:16px">
    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap"><span class="dv-badge">Da verificare</span>
      ${da ? `<span style="color:var(--muted);font-size:12.5px">Scheda arrivata da ${escapeHtml(da)}</span>` : ""}</div>
    ${manca.length ? `<div style="font-size:13.5px;margin-top:8px">Mancano: <b>${manca.map(escapeHtml).join(", ")}</b> ${puo ? `<button class="btn btn-ghost btn-sm" onclick="openCavalloForm('${id}')">Completa</button>` : ""}</div>` : ""}
    ${righe ? `<div style="font-size:13px;margin-top:8px">Il maniscalco ha scritto qualcosa di diverso: scegliete voi cosa tenere.</div>${righe}` : ""}
    ${data.da_verificare && puo ? `<button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="cavVerificaScelta('${id}','conferma')"><i class="fa-solid fa-check"></i> I dati sono giusti</button>` : ""}
    <p style="color:var(--muted);font-size:11.5px;margin:6px 0 0">Nulla cambia da solo. I lavori restano del maniscalco che li ha fatti.</p></div>`;
}
async function cavVerificaScelta(id, azione, campo, valore){
  const { data, error } = await sb.rpc("equo_cavallo_scelta", { p_horse: null, p_sc: id, p_azione: azione, p_campo: campo || null, p_valore: valore || null });
  if(error || !data?.ok){ showToast((data && data.errore) || "Non riuscito, riprova."); return; }
  showToast(azione === "conferma" ? "Dati confermati." : azione === "usa" ? "Dato aggiornato." : "Ok, tenete il vostro.");
  await loadCavalli();
  if(currentCavalloId === id){ renderCavalloDetail(); cavVerificaRender(id); } else renderCavalliList();
}
