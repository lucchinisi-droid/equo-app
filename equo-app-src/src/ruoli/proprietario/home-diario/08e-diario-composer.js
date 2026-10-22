/* ---- composer ---- */
function diarioApri(tipo, data){
  if(!horses || !horses.length){ showToast("Aggiungi prima un cavallo"); showPage("cavalli"); return; }
  diarioCavallo();
  diarioFile = null; diarioRecBlob = null; diarioDataNuova = data || null;
  document.getElementById("dr-titolo").textContent = data ? "Nuovo momento · " + new Date(data + "T12:00:00").toLocaleDateString("it-IT", { day: "numeric", month: "short" }) : "Nuovo momento";
  document.getElementById("dr-testo").value = "";
  document.getElementById("dr-file").value = "";
  document.getElementById("dr-anteprima").style.display = "none";
  document.getElementById("dr-audio").style.display = "none";
  document.getElementById("dr-rec-lab").textContent = "Tocca per registrare (massimo 3 minuti)";
  document.getElementById("dr-cavallo").innerHTML = cavalliUsabili().map(h => `<option value="${h.id}"${h.id === diarioHorseId ? " selected" : ""}>${escapeHtml(h.name)}</option>`).join("");
  document.getElementById("dr-cats").innerHTML = DIARIO_CATS.map(c => `<button type="button" class="dr-chip${c[0] === diarioCat ? " on" : ""}" onclick="diarioCatScegli('${c[0]}')">${c[1]}</button>`).join("");
  diarioTipoScegli(tipo || "foto");
  document.getElementById("dr-salva").disabled = false;
  openModal("modal-diario");
}
function diarioVideoPremium(){
  closeModal("modal-diario");
  diarioSheet("Video del tuo cavallo", `<div class="eq-card" style="margin:0 0 12px"><div class="im" style="aspect-ratio:16/10;background-image:url('assets/equo/e-16.jpg')"><span class="bd">Premium</span></div></div><div class="muted" style="font-size:14px;line-height:1.5;margin-bottom:12px">I video delle lezioni e il filmato del mese sono per chi ha Premium. Sono in preparazione: appena pronti li trovi qui. Intanto foto, note e vocali sono liberi.</div>` + (isPremium() ? "" : `<button class="btn btn-primary" style="width:100%;margin-bottom:8px" onclick="closeModal('modal-dr-sheet');togglePiano()">Scopri Premium</button>`) + `<button class="btn btn-outline" style="width:100%" onclick="closeModal('modal-dr-sheet');diarioApri('foto')">Torna al nuovo momento</button>`);
}
function diarioCatScegli(c){ diarioCat = c; document.querySelectorAll("#dr-cats .dr-chip").forEach(b => b.classList.toggle("on", b.getAttribute("onclick").includes("'" + c + "'"))); }
function diarioTipoScegli(t){
  diarioTipo = t;
  document.querySelectorAll("#dr-tipi .dr-chip[data-t]").forEach(b => b.classList.toggle("on", b.dataset.t === t));
  document.getElementById("dr-box-foto").style.display = t === "foto" ? "block" : "none";
  document.getElementById("dr-box-vocale").style.display = t === "vocale" ? "block" : "none";
  document.getElementById("dr-testo").placeholder = t === "nota" ? "Scrivi la nota di oggi…" : "Una riga su questo momento (facoltativa)";
}
function diarioFilePronto(inp){
  const f = inp.files && inp.files[0]; if(!f) return;
  diarioFile = f;
  const img = document.getElementById("dr-anteprima");
  img.src = URL.createObjectURL(f); img.style.display = "block";
}
function diarioComprimi(file){
  return new Promise((ok, ko) => {
    const url = URL.createObjectURL(file), im = new Image();
    im.onload = () => {
      const max = 1600, r = Math.min(1, max / Math.max(im.width, im.height));
      const c = document.createElement("canvas"); c.width = Math.round(im.width * r); c.height = Math.round(im.height * r);
      c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
      c.toBlob(b => { URL.revokeObjectURL(url); b ? ok(b) : ko(new Error("compressione")); }, "image/jpeg", 0.82);
    };
    im.onerror = () => { URL.revokeObjectURL(url); ko(new Error("immagine non leggibile")); };
    im.src = url;
  });
}
async function diarioRegistra(){
  const btn = document.getElementById("dr-rec"), lab = document.getElementById("dr-rec-lab");
  if(diarioRec){ diarioRec.stop(); return; }
  try{
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    diarioRecChunks = [];
    diarioRec = new MediaRecorder(stream);
    diarioRec.ondataavailable = e => { if(e.data.size) diarioRecChunks.push(e.data); };
    diarioRec.onstop = () => {
      stream.getTracks().forEach(t => t.stop());
      clearInterval(diarioRecTimer);
      diarioRecBlob = new Blob(diarioRecChunks, { type: diarioRec.mimeType || "audio/webm" });
      diarioRec = null; btn.classList.remove("on");
      const a = document.getElementById("dr-audio"); a.src = URL.createObjectURL(diarioRecBlob); a.style.display = "block";
      lab.textContent = "Registrato. Tocca per rifare";
    };
    diarioRec.start(); btn.classList.add("on");
    let s = 0; lab.textContent = "Registro… 0:00 (tocca per fermare)";
    diarioRecTimer = setInterval(() => { s++; lab.textContent = "Registro… " + Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0") + " (tocca per fermare)"; if(s >= 180) diarioRec && diarioRec.stop(); }, 1000);
  } catch(e){ showToast("Microfono non disponibile: controlla i permessi del telefono"); }
}
async function diarioSalva(){
  const horseId = document.getElementById("dr-cavallo").value, testo = document.getElementById("dr-testo").value.trim();
  if(diarioTipo === "foto" && !diarioFile){ showToast("Scegli prima una foto"); return; }
  if(diarioTipo === "nota" && !testo){ showToast("Scrivi qualcosa"); return; }
  if(diarioTipo === "vocale" && !diarioRecBlob){ showToast("Registra prima il vocale"); return; }
  if(DEMO_MODE){ showToast("Il Diario non è disponibile nella demo"); return; }
  const btn = document.getElementById("dr-salva"); btn.disabled = true;
  try{
    let path = null, mime = null, byte = null;
    if(diarioTipo !== "nota"){
      const blob = diarioTipo === "foto" ? await diarioComprimi(diarioFile) : diarioRecBlob;
      mime = diarioTipo === "foto" ? "image/jpeg" : (blob.type || "audio/webm");
      const ext = diarioTipo === "foto" ? "jpg" : (mime.includes("mp4") ? "m4a" : mime.includes("ogg") ? "ogg" : "webm");
      path = currentUser.id + "/" + horseId + "/" + Date.now() + "." + ext;
      const up = await sb.storage.from("diario-media").upload(path, blob, { contentType: mime, upsert: false });
      if(up.error) throw up.error;
      byte = blob.size;
    }
    const riga = { horse_id: horseId, tipo: diarioTipo, categoria: diarioCat, testo: testo || null, media_path: path, media_mime: mime, media_byte: byte, privacy: "solo_io" };
    if(diarioDataNuova) riga.data_voce = new Date(diarioDataNuova + "T12:00:00").toISOString();
    const { error } = await sb.from("diario_voci").insert(riga);
    if(error) throw error;
    closeModal("modal-diario");
    diarioHorseId = horseId;
    showToast("Momento salvato nel Diario");
    await diarioAggiorna();
  } catch(e){ showToast("Non riesco a salvare: " + (e.message || "errore")); }
  finally{ btn.disabled = false; }
}
