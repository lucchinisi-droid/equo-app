/* ---------- dati e sincronizzazione ---------- */
function ricevi(r){
  dati = r; ultimoAgg = oraAdesso();
  if(r.groom) S.nome = r.groom; if(r.centro) S.centro = r.centro;
  if(!DEMO){ scrivi(K_CACHE, dati); scrivi(K_STATO, S); }
  disegna();
}
async function aggiorna(primaVolta){
  await svuotaCoda();
  if(coda.length && !primaVolta) return disegna();
  try{
    const r = await rpc("groom_stalla", { p_token: S.t, p_pin: S.pin });
    if(r?.errore){ S.pin = null; scrivi(K_STATO, S); return schermoPin("entra", tr("pin_errato")); }
    ricevi(r); avviaPoll();
  } catch(e){
    if(/NON_VALIDO/.test(e.message)){ esciDavvero(true); return schermoMsg("non_valido", true); }
    if(/BLOCCATO/.test(e.message)) return schermoMsg("bloccato", true);
    if(dati) disegna(); else if(primaVolta) throw e;
  }
}
function avviaPoll(){ if(timerPoll) return; timerPoll = setInterval(() => { if(document.visibilityState === "visible" && !document.querySelector(".velo")) aggiorna(); }, 60000); }
// un solo invio alla volta: due invii in parallelo toglievano dalla coda spunte mai spedite
let codaInVolo = null;
function svuotaCoda(){ if(!codaInVolo) codaInVolo = inviaCoda().finally(() => { codaInVolo = null; }); return codaInVolo; }
function togliDallaCoda(x){ const i = coda.indexOf(x); if(i >= 0){ coda.splice(i, 1); scrivi(K_CODA, coda); } }
async function inviaCoda(){
  while(coda.length){
    const x = coda[0];
    let r;
    try{ r = await rpc("groom_segna", { p_token: S.t, p_pin: S.pin, p_box: x.box, p_tipo: x.tipo, p_fatto: x.fatto, p_quando: x.quando }); }
    catch(e){ if(e.server && !/NON_VALIDO|BLOCCATO/.test(e.message)){ togliDallaCoda(x); continue; } return; }
    if(r?.errore === "GROOM_PIN_ERRATO"){ S.pin = null; scrivi(K_STATO, S); schermoPin("entra", tr("pin_errato")); return; }
    if(r?.errore) toast(tr("errore"));
    togliDallaCoda(x);
  }
}
window.addEventListener("online", () => aggiorna());
document.addEventListener("visibilitychange", () => { if(document.visibilityState === "visible" && S.pin && dati) aggiorna(); });

