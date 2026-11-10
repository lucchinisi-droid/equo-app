/* =====================================================================
   MANISCALCO DI FIDUCIA (10/11/2026 · SQL 55) — script normale: funzioni globali.
   Nella scheda del maniscalco: con il flag acceso i suoi appuntamenti nascono già confermati (anche se sposta
   data o servizio) e la scuderia riceve solo l'avviso in chat. Lo decide l'amministratore o un livello 2-3.
   ===================================================================== */
function fiduciaRender(p){
  const box = document.getElementById("scheda-pro-fiducia"); if(!box || !p) return;
  if(p.categoria && p.categoria !== "maniscalco"){ box.innerHTML = ""; return; }
  const puo = typeof puoCollegareProfessionisti === "function" ? puoCollegareProfessionisti() : false;
  const on = !!p.di_fiducia;
  box.innerHTML = `<div class="card" style="padding:12px 14px;margin-bottom:14px;display:flex;gap:12px;align-items:flex-start;${on ? "border-color:rgba(47,138,78,.45)" : ""}">
    <i class="fa-solid fa-handshake" style="color:${on ? "#2f8a4e" : "var(--muted)"};font-size:18px;margin-top:2px"></i>
    <div style="flex:1;min-width:0">
      <div style="font-weight:700;font-size:14px">Maniscalco di fiducia</div>
      <div style="color:var(--muted);font-size:12.5px;line-height:1.45;margin-top:2px">${on
        ? "Si organizza da solo: i suoi appuntamenti sono già confermati e voi ricevete solo l'avviso in chat."
        : "Ogni appuntamento che propone aspetta la vostra conferma. Il lavoro di oggi può comunque segnarlo fatto."}</div>
    </div>
    ${puo ? `<button class="btn ${on ? "btn-ghost" : "btn-primary"} btn-sm" style="flex-shrink:0" onclick="fiduciaCambia('${p.cliente_id}', ${!on}, this)">${on ? "Spegni" : "Accendi"}</button>`
          : `<span style="font-size:12px;font-weight:700;color:${on ? "#2f8a4e" : "var(--muted)"}">${on ? "Attivo" : "Spento"}</span>`}
  </div>`;
}
async function fiduciaCambia(clienteId, on, el){
  if(on && !confirm("Accendere «maniscalco di fiducia»? I suoi appuntamenti non avranno più bisogno della vostra conferma (quelli in attesa diventano confermati).")) return;
  el.disabled = true;
  const p = professionistiList.find(x => x.cliente_id === clienteId);
  if(DEMO_MODE){ if(p) p.di_fiducia = on; showToast(on ? "Maniscalco di fiducia attivo (demo)." : "Tolto (demo)."); fiduciaRender(p); renderProfessionistiList(); return; }
  const { data, error } = await sb.rpc("scuderia_pro_fiducia", { p_cliente: clienteId, p_on: on });
  el.disabled = false;
  if(error || !data?.ok){ showToast((data && data.errore) || "Non riuscito, riprova."); return; }
  if(p) p.di_fiducia = on;
  showToast(on ? "Maniscalco di fiducia attivo" + (data.confermati ? ` · ${data.confermati} appuntament${data.confermati === 1 ? "o confermato" : "i confermati"}` : "") + "." : "Tolto: i nuovi appuntamenti tornano da confermare.");
  fiduciaRender(p);
  if(typeof renderProfessionistiList === "function") renderProfessionistiList();
}
