/* ---------- avvio ---------- */
async function avvio(){
  applicaLingua();
  if(!S.t) return schermoBenvenuto();
  if(S.pin && dati){ disegna(); aggiorna(); return; }
  try{
    const info = await rpc("groom_info", { p_token: S.t });
    if(!info?.valido) return schermoMsg("non_valido", true);
    if(!S.langScelta && info.lingua){ S.lang = info.lingua; scrivi(K_STATO, S); applicaLingua(); }
    S.nome = info.nome; S.centro = info.centro;
    if(info.bloccato) return schermoMsg("bloccato", true);
    if(info.pin_da_creare){ S.pin = null; return schermoPin("crea"); }
    if(!S.pin) return schermoPin("entra");
    await aggiorna(true);
  } catch(e){
    if(S.pin && dati){ disegna(); return; }
    schermoMsg("errore", false); setTimeout(avvio, 8000);
  }
}

