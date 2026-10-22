
/* ===== CODICE CAVALLO A TRE LIVELLI in Equo Scuderia (21/10/2026) =====
   Scheda del cavallo: codice, livello (Provvisorio / Validato / Certificato), cosa manca e "Confermo i dati".
   Home: "Da confermare" con i cavalli del centro che aspettano la conferma dello staff.
   Le regole sono nel database (equo_stato_codice, equo_conferma_cavallo, equo_cavalli_da_confermare):
   lo staff (admin e istruttori) conferma come centro; il centro vale UNA persona. */
const LIVELLI_SCUD = { provvisorio: ["Provvisorio", "#5B6B62", "#E9EEEB"], validato: ["Validato", "#14573A", "#E3F1E9"], certificato: ["Certificato", "#7A5A00", "#F8EDD2"] };
function badgeLivelloScud(l){
  const x = LIVELLI_SCUD[l] || LIVELLI_SCUD.provvisorio;
  return `<span style="font-size:11px;font-weight:700;color:${x[1]};background:${x[2]};border-radius:999px;padding:3px 9px;white-space:nowrap">${x[0]}</span>`;
}
function codiceValidatoScud(c){ return DEMO_MODE || (c && (c.codice_livello === "validato" || c.codice_livello === "certificato")); }

async function renderCodiceScud(c){
  const box = document.getElementById("scud-codice-box");
  if(!box || !c) return;
  const liv = c.codice_livello || "provvisorio";
  const testa = `<div style="display:flex;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:6px"><h3 style="margin:0">Codice Equo <span style="font-family:monospace;font-size:14px">${escapeHtml(c.codice_equo || (DEMO_MODE ? "MAR-000201" : "in assegnazione"))}</span></h3>${badgeLivelloScud(DEMO_MODE ? "validato" : liv)}</div>`;
  box.innerHTML = `<div class="card" style="margin-bottom:16px">${testa}</div>`;
  if(DEMO_MODE) return;
  let st = null;
  try{ const r = await sb.rpc("equo_stato_codice", { p_scuderia_cavallo: c.id }); st = r.data; }catch(e){}
  if(currentCavalloId !== c.id) return;
  if(!st || !st.ok){
    box.innerHTML = `<div class="card" style="margin-bottom:16px">${testa}<p style="margin:0;color:var(--muted);font-size:12.5px">Solo amministratori e istruttori del centro possono confermare i dati del cavallo.</p></div>`;
    return;
  }
  const v = (ok, t) => `<div style="font-size:13px;padding:2px 0;color:${ok ? "var(--primary)" : "var(--muted)"};font-weight:${ok ? 600 : 400}">${ok ? "✓" : "○"} ${t}</div>`;
  const dati = st.nome && st.razza && st.nascita;
  const proprio = st.il_mio_ruolo === "proprietario"; // cavallo di proprieta del centro: il centro fa da proprietario
  const corpo = v(st.nome, "Nome") + v(st.razza, "Razza") + v(st.nascita, "Data di nascita")
    + v(st.conferma_proprietario, proprio ? "Conferma del centro (proprietario)" : "Conferma del proprietario del cavallo")
    + v(st.conferme_valide >= 2, "Seconda conferma da un'altra persona (" + Math.min(st.conferme_valide, 2) + "/2)");
  let msg;
  if(liv === "provvisorio"){
    msg = !dati ? "Completa nome, razza e data di nascita (Modifica) per poter confermare."
      : st.io_ho_confermato ? (proprio ? "Il centro ha confermato. Serve la conferma di un professionista collegato (maniscalco, veterinario o allenatore)." : "Il centro ha confermato. Serve la conferma del proprietario del cavallo dalla sua app.")
      : "Controlla i dati e confermali: con la conferma " + (proprio ? "di un professionista" : "del proprietario") + " il codice diventa definitivo.";
  } else msg = liv === "certificato" ? "Microchip verificato: il cavallo e Certificato." : "Codice definitivo" + (st.codice_definitivo ? " " + st.codice_definitivo : "") + ". Se cambiano nome, razza o data di nascita le conferme vanno rinnovate.";
  const btn = dati && !st.io_ho_confermato ? `<button class="btn btn-primary btn-sm" style="margin-top:10px" onclick="confermaCodiceScud('${c.id}')"><i class="fa-solid fa-circle-check"></i> Confermo i dati</button>` : "";
  box.innerHTML = `<div class="card" style="margin-bottom:16px">${testa}${corpo}<p style="margin:8px 0 0;color:var(--muted);font-size:12.5px;line-height:1.5">${escapeHtml(msg)}</p>${btn}</div>`;
}
async function confermaCodiceScud(id){
  const { data, error } = await sb.rpc("equo_conferma_cavallo", { p_scuderia_cavallo: id });
  if(error || !data?.ok){ showToast(data?.motivo === "dati_incompleti" ? "Completa nome, razza e data di nascita." : "Conferma non riuscita. Riprova."); return; }
  showToast(data.livello === "validato" ? "Codice definitivo assegnato: " + (data.codice_definitivo || "") : "Conferma registrata.");
  await loadCavalli();
  if(currentCavalloId === id) renderCavalloDetail();
  caricaDaConfermareScud(true);
}

let daConfermareScud = [], daConfermareScudTs = 0;
async function caricaDaConfermareScud(forza){
  const box = document.getElementById("scud-da-confermare");
  if(!box || DEMO_MODE) return;
  if(!forza && Date.now() - daConfermareScudTs < 60000) return;
  daConfermareScudTs = Date.now();
  try{ const { data, error } = await sb.rpc("equo_cavalli_da_confermare"); daConfermareScud = (!error && Array.isArray(data)) ? data : []; }catch(e){ daConfermareScud = []; }
  if(!daConfermareScud.length){ box.innerHTML = ""; return; }
  box.innerHTML = `<div class="card" style="margin-bottom:20px"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px"><h3 style="margin:0">Da confermare (${daConfermareScud.length})</h3></div>
    <p style="margin:4px 0 8px;color:var(--muted);font-size:12.5px">Cavalli con nome, razza e data di nascita completi che aspettano la conferma del centro per il codice definitivo.</p>
    ${daConfermareScud.map((x, i) => `<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:8px 0;border-top:1px solid var(--border)">
      <div><b>${escapeHtml(x.nome || "")}</b> <span style="color:var(--muted);font-size:12px;font-family:monospace">${escapeHtml(x.codice || "")}</span>${x.motivo === "dati_modificati" ? ' <span style="color:var(--muted);font-size:12px">· dati cambiati, riconferma</span>' : ""}</div>
      <button class="btn btn-primary btn-sm" onclick="confermaDaHomeScud(${i})">Confermo</button></div>`).join("")}</div>`;
}
async function confermaDaHomeScud(i){
  const x = daConfermareScud[i]; if(!x) return;
  const { data, error } = await sb.rpc("equo_conferma_cavallo", { p_horse: x.horse_id || null, p_scuderia_cavallo: x.scuderia_cavallo_id || null });
  if(error || !data?.ok){ showToast("Conferma non riuscita. Riprova."); return; }
  showToast(data.livello === "validato" ? "Confermato: codice definitivo " + (data.codice_definitivo || "") : "Conferma registrata.");
  caricaDaConfermareScud(true);
  loadCavalli();
}
quandoApriSezione(function(k){ if(k === "home") caricaDaConfermareScud(); });
