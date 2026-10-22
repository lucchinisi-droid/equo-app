/* ---------- scanner QR del box ---------- */
let stream = null, scanTimer = null, rilevatore = null;
function fermaCamera(){ clearInterval(scanTimer); scanTimer = null; if(stream){ stream.getTracks().forEach(t => t.stop()); stream = null; } }
function caricaJsQR(){ return new Promise(ok => { if(window.jsQR) return ok(true); const s = document.createElement("script"); s.src = "https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js"; s.onload = () => ok(true); s.onerror = () => ok(false); document.head.appendChild(s); }); }
async function apriScanner(){
  foglio(`<h3><i class="fa-solid fa-qrcode"></i> ${tr("scansiona")}</h3><p>${tr("inquadra")}</p><div class="scan-wrap"><video id="scan-v" playsinline muted></video><div class="mirino"></div></div>
    <div class="azioni"><button onclick="chiudiFoglio()">${tr("chiudi")}</button></div>`);
  try{
    stream = await navigator.mediaDevices.getUserMedia({ video:{ facingMode:"environment" }, audio:false });
    const v = document.getElementById("scan-v"); if(!v){ fermaCamera(); return; } v.srcObject = stream; await v.play();
    if("BarcodeDetector" in window){ try{ rilevatore = new BarcodeDetector({ formats:["qr_code"] }); } catch(e){ rilevatore = null; } }
    if(!rilevatore) await caricaJsQR();
    const c = document.createElement("canvas"), ctx = c.getContext("2d", { willReadFrequently:true });
    scanTimer = setInterval(async () => {
      if(!v.videoWidth) return;
      let testo = null;
      if(rilevatore){ try{ const r = await rilevatore.detect(v); testo = r[0]?.rawValue; } catch(e){} }
      else if(window.jsQR){ c.width = v.videoWidth; c.height = v.videoHeight; ctx.drawImage(v, 0, 0); const r = jsQR(ctx.getImageData(0, 0, c.width, c.height).data, c.width, c.height); testo = r?.data; }
      if(testo) letto(testo);
    }, 250);
  } catch(e){ chiudiFoglio(); toast(tr("camera_no")); }
}
function letto(testo){
  let b = null, t = null;
  try{ const u = new URL(testo, location.origin); b = u.searchParams.get("b"); t = u.searchParams.get("t"); } catch(e){}
  if(t && t !== S.t){ chiudiFoglio(); location.href = "/groom?t=" + encodeURIComponent(t); return; }
  if(!b) return;
  chiudiFoglio();
  if(!dati.box.some(x => x.id === b)){ toast(tr("box_no")); return; }
  focusBox = b; disegna(); scrollTo(0, 0);
}

