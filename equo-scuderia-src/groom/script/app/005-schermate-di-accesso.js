/* ---------- schermate di accesso ---------- */
const LOGO = `<img src="/assets/icona-equo.png" alt="">`;
function schermoBenvenuto(){
  document.getElementById("app").innerHTML = `<div class="schermo">${LOGO}<h1>${tr("app")}</h1><p>${tr("benvenuto")}</p><i class="fa-solid fa-qrcode" style="font-size:70px;opacity:.9;margin:10px 0"></i>${btnLinguaHtml()}</div>`;
}
function btnLinguaHtml(){ return `<button class="lnk" onclick="apriLingue()"><i class="fa-solid fa-language"></i> ${LINGUE[S.lang] || "Italiano"}</button>`; }
function schermoMsg(k, esci){
  document.getElementById("app").innerHTML = `<div class="schermo">${LOGO}<h1>${tr("app")}</h1><p>${tr(k)}</p>${esci ? `<i class="fa-solid fa-circle-exclamation" style="font-size:46px;opacity:.85"></i>` : `<i class="fa-solid fa-wifi" style="font-size:46px;opacity:.85"></i>`}${btnLinguaHtml()}</div>`;
}
function schermoPin(modo, errore){
  pinIns = "";
  const titolo = modo === "crea" ? (pinPrimo ? tr("ripeti_pin") : tr("crea_pin")) : tr("inserisci_pin");
  const tasti = [1,2,3,4,5,6,7,8,9,"",0,"⌫"].map(k => k === "" ? `<span></span>` : `<button onclick="tastoPin('${k}','${modo}')">${k}</button>`).join("");
  document.getElementById("app").innerHTML = `<div class="schermo">${LOGO}<h1>${esc(tr("ciao", { n: S.nome || "" }))}</h1>
    <p>${esc(S.centro || "")}</p><p style="font-weight:700;font-size:18px;opacity:1">${titolo}</p>
    <div class="pin-punti" id="pin-punti">${"<i></i>".repeat(4)}</div><div class="err" id="pin-err">${errore ? esc(errore) : ""}</div>
    <div class="tast">${tasti}</div>${btnLinguaHtml()}</div>`;
}
let pinInVerifica = false;
async function tastoPin(k, modo){
  if(pinInVerifica) return;
  if(k === "⌫") pinIns = pinIns.slice(0, -1); else if(pinIns.length < 4) pinIns += k;
  document.querySelectorAll("#pin-punti i").forEach((p, i) => p.classList.toggle("on", i < pinIns.length));
  if(pinIns.length < 4) return;
  const pin = pinIns; pinIns = "";
  if(modo === "crea" && !pinPrimo){ pinPrimo = pin; return schermoPin("crea"); }
  if(modo === "crea" && pinPrimo !== pin){ pinPrimo = null; return schermoPin("crea", tr("pin_diversi")); }
  pinPrimo = null;
  pinInVerifica = true;
  try{
    const r = await rpc("groom_stalla", { p_token: S.t, p_pin: pin });
    if(r?.errore){ return schermoPin("entra", tr("pin_errato")); }
    S.pin = pin; scrivi(K_STATO, S); ricevi(r); avviaPoll();
  } catch(e){
    if(/BLOCCATO/.test(e.message)) return schermoMsg("bloccato", true);
    if(/NON_VALIDO/.test(e.message)) return schermoMsg("non_valido", true);
    schermoPin(modo === "crea" ? "crea" : "entra", tr("errore"));
  } finally { pinInVerifica = false; }
}

