// Equo App · maniscalco · modulo (moduli ES, costruiti con Vite in ruoli/maniscalco/costruito.js)
import { onbCodiceScansionato } from "./116-onboarding.js";
/* ---------- SCANNER QR (ripristinato 27/09) ---------- */
let qrScanStream = null;
let qrScanRAF = null;

function openQrScanner(){
  if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){
    showToast("Il tuo browser non supporta la fotocamera.");
    return;
  }
  openModal("modal-qr-scan");
  const video = document.getElementById("qr-scan-video");
  navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }).then(stream => {
    qrScanStream = stream;
    video.srcObject = stream;
    video.setAttribute("playsinline", true);
    video.play();
    qrRilevatore = null;
    try{ if("BarcodeDetector" in window) qrRilevatore = new BarcodeDetector({ formats: ["qr_code"] }); }catch(e){ qrRilevatore = null; }
    qrScanRAF = requestAnimationFrame(scanQrLoop);
  }).catch(() => {
    showToast("Non riesco ad accedere alla fotocamera.");
    closeQrScanner();
  });
}

function closeQrScanner(){
  if(qrScanRAF) cancelAnimationFrame(qrScanRAF);
  qrScanRAF = null;
  if(qrScanStream){ qrScanStream.getTracks().forEach(t => t.stop()); qrScanStream = null; }
  closeModal("modal-qr-scan");
}

// lettura: lettore del telefono se c'è (Android), altrimenti jsQR (incluso nell'app) su un'immagine ridotta, più veloce
let qrRilevatore = null, qrInLettura = false;
function qrTrovato(testo){
  if(!qrScanStream) return;
  closeQrScanner();
  gestisciCodiceScansionato(testo);
}
async function scanQrLoop(){
  const video = document.getElementById("qr-scan-video");
  const canvas = document.getElementById("qr-scan-canvas");
  if(!qrScanStream) return;
  if(!video || video.readyState !== video.HAVE_ENOUGH_DATA || qrInLettura){
    qrScanRAF = requestAnimationFrame(scanQrLoop);
    return;
  }
  qrInLettura = true;
  try{
    if(qrRilevatore){
      try{
        const trovati = await qrRilevatore.detect(video);
        if(trovati && trovati[0] && trovati[0].rawValue){ qrTrovato(trovati[0].rawValue); return; }
      }catch(e){ qrRilevatore = null; }
    }
    if(window.jsQR){
      const lato = Math.max(video.videoWidth, video.videoHeight) || 1;
      const k = Math.min(1, 720 / lato);
      canvas.width = Math.round(video.videoWidth * k);
      canvas.height = Math.round(video.videoHeight * k);
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "attemptBoth" });
      if(code && code.data){ qrTrovato(code.data); return; }
    }
  } finally { qrInLettura = false; }
  if(qrScanStream) qrScanRAF = requestAnimationFrame(scanQrLoop);
}

// Instrada il codice letto dal QR o scritto: OWN = chat tra proprietari, TRA = istruttore, PRO o invito = collega il maniscalco
// (accetta anche i link app.equohub.com/?invito=..., maiuscole/minuscole, con o senza trattini)
function gestisciCodiceScansionato(testo){
  if(onbCodiceScansionato(testo)) return;   // 27/10/2026: Equo Card del cavallo inquadrata da «Aggiungi cavallo»
  const codice = String(codiceEquoDaTesto(testo) || "").trim().toUpperCase();
  const tipo = tipoCodiceEquo(codice);
  if(tipo === "own"){
    closeModal("modal-collega-maniscalco");
    document.getElementById("new-chat-codice").value = codice;
    document.getElementById("new-chat-error").style.display = "none";
    openModal("modal-new-chat");
    startNewChat();
    return;
  }
  if(tipo === "tra" && typeof trCollOwner === "function"){
    closeModal("modal-new-chat");
    trCollOwner().then(() => { const k = document.getElementById("tri-k"); if(k) k.value = codice; });
    return;
  }
  closeModal("modal-new-chat");
  document.getElementById("collega-maniscalco-codice").value = codice;
  document.getElementById("collega-maniscalco-error").style.display = "none";
  openModal("modal-collega-maniscalco");
  collegaManiscalco();
}


export { closeQrScanner, gestisciCodiceScansionato, openQrScanner };
