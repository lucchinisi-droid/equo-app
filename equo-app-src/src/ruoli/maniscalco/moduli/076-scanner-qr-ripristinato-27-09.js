// Equo App · maniscalco · modulo (moduli ES, costruiti con Vite in ruoli/maniscalco/costruito.js)
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

function scanQrLoop(){
  const video = document.getElementById("qr-scan-video");
  const canvas = document.getElementById("qr-scan-canvas");
  if(!video || video.readyState !== video.HAVE_ENOUGH_DATA){
    qrScanRAF = requestAnimationFrame(scanQrLoop);
    return;
  }
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const code = window.jsQR ? jsQR(imageData.data, imageData.width, imageData.height) : null;
  if(code && code.data){
    closeQrScanner();
    gestisciCodiceScansionato(code.data);
    return;
  }
  qrScanRAF = requestAnimationFrame(scanQrLoop);
}

// Instrada il codice letto dal QR: EQUO-OWN-… = chat tra proprietari, EQUO-PRO-… o EQUO-XXXXX = collega il maniscalco
function gestisciCodiceScansionato(testo){
  const raw = String(testo || "").trim().toUpperCase();
  const m = raw.match(/EQUO-(?:PRO-|OWN-|TRA-|MED-)?[A-Z0-9]{4,8}/);
  const codice = m ? m[0] : raw;
  if(codice.startsWith("EQUO-OWN-") || codice === "EQUO-OWN-DEMO"){
    closeModal("modal-collega-maniscalco");
    document.getElementById("new-chat-codice").value = codice;
    document.getElementById("new-chat-error").style.display = "none";
    openModal("modal-new-chat");
    startNewChat();
    return;
  }
  if(codice.startsWith("EQUO-TRA-") && typeof trCollOwner === "function"){
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
