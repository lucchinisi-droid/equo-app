// Equo App · chat · modulo (moduli ES, costruiti con Vite in ruoli/chat/costruito.js)
/* ---------- CONDIVISIONE ESTERNA (watermark + share sheet nativo) ----------
   Si sblocca solo su contenuti già condivisi dentro Equo (foto nella chat proprietario↔proprietario).
   Solo foto in questa fase: il watermark su video richiederebbe elaborazione pesante, rimandato. */
function drawRoundedRect(ctx, x, y, w, h, r){
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

async function shareContentExternally(mediaUrl){
  showToast("Preparazione condivisione...");
  try{
    const img = new Image();
    img.crossOrigin = "anonymous";
    const loaded = new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; });
    img.src = mediaUrl;
    await loaded;

    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth || 800;
    canvas.height = img.naturalHeight || 600;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Watermark piccolo e non invasivo in basso a destra
    const label = "Condiviso con Equo";
    const fontSize = Math.max(14, Math.round(canvas.width * 0.028));
    ctx.font = `600 ${fontSize}px sans-serif`;
    const textWidth = ctx.measureText(label).width;
    const padX = fontSize * 0.6, padY = fontSize * 0.45;
    const boxW = textWidth + padX * 2, boxH = fontSize + padY * 2;
    const margin = fontSize * 0.6;
    const x = canvas.width - boxW - margin;
    const y = canvas.height - boxH - margin;
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    drawRoundedRect(ctx, x, y, boxW, boxH, boxH / 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.textBaseline = "middle";
    ctx.fillText(label, x + padX, y + boxH / 2 + 1);

    canvas.toBlob(async (blob) => {
      if(!blob){ showToast("Non sono riuscito a preparare l'immagine."); return; }
      const file = new File([blob], "equo-condiviso.jpg", { type: "image/jpeg" });
      if(navigator.canShare && navigator.canShare({ files: [file] })){
        try{ await navigator.share({ files: [file], text: "Guarda questa foto su Equo!" }); }
        catch(e){ /* l'utente ha annullato la share sheet, non è un errore */ }
      } else {
        const objUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = objUrl; a.download = "equo-condiviso.jpg";
        document.body.appendChild(a); a.click(); a.remove();
        showToast("Immagine scaricata — condividila dal tuo rullino.");
      }
    }, "image/jpeg", 0.92);
  } catch(e){
    showToast("Non sono riuscito a preparare la condivisione. Riprova.");
  }
}


export { shareContentExternally };
