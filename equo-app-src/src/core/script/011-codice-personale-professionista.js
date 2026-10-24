/* ---------- CODICE PERSONALE PROFESSIONISTA ---------- */
async function openCodicePersonaleModal(){
  const codice = await DB.ensureCodiceProfessionista();
  document.getElementById("codice-personale-testo").textContent = codice;
  const descr = document.querySelector("#modal-codice-personale .muted");
  if(descr){
    const rp = typeof plRuolo === "function" ? plRuolo() : "pro";
    descr.textContent = rp === "istr" ? "Dallo ai proprietari dei cavalli che alleni: lo inseriscono in «I miei istruttori» e tu accetti il collegamento. Serve anche ai colleghi per scriverti in chat."
      : rp === "vet" ? "Dallo ai proprietari e ai colleghi: chi lo usa entra subito in contatto con te."
      : "Condividilo con chi non è ancora tuo cliente su Equo — chi lo usa entra subito in contatto con te.";
  }
  const qrBox = document.getElementById("codice-personale-qr");
  qrBox.innerHTML = "";
  if(window.QRCode){ new QRCode(qrBox, { text: linkCodiceEquo(codice), width: 160, height: 160 }); }   // il QR apre Equo e collega
  closeModal("modal-menu");
  openModal("modal-codice-personale");
}

function copyCodicePersonale(){
  const codice = currentUser.codiceProfessionista;
  if(!codice) return;
  const text = codice + "\nhttps://app.equohub.com";
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(() => showToast("Codice copiato negli appunti!"))
      .catch(() => showToast("Non sono riuscito a copiare, riprova."));
  } else {
    showToast("Codice: " + codice);
  }
}

function shareCodicePersonale(){
  const codice = currentUser.codiceProfessionista;
  if(!codice) return;
  const text = codice + "\nhttps://app.equohub.com";
  if(navigator.share){
    navigator.share({ text }).catch(() => {});
    return;
  }
  window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank");
}

