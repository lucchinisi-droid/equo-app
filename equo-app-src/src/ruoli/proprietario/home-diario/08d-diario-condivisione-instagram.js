/* logo Equo + Equohub.com in basso a destra, solo sulla copia che si condivide (la foto salvata non cambia) */
function diarioCaricaImg(src){ return new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ko(new Error("immagine")); i.src = src; }); }
async function diarioMarchia(blob){
  try{
    const url = URL.createObjectURL(blob);
    const [foto, logo] = await Promise.all([diarioCaricaImg(url), diarioCaricaImg("assets/equo/logo-share.png")]);
    URL.revokeObjectURL(url);
    const W = foto.naturalWidth, H = foto.naturalHeight, c = document.createElement("canvas"); c.width = W; c.height = H;
    const g = c.getContext("2d"); g.drawImage(foto, 0, 0, W, H);
    const lato = Math.min(W, H), L = Math.round(lato * 0.15), m = Math.round(lato * 0.035), f = Math.round(L * 0.25);
    g.font = "700 " + f + "px 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";
    const testo = "Equohub.com", tw = g.measureText(testo).width, bloccoW = Math.max(L, tw);
    const cx = W - m - bloccoW / 2, yLogo = H - m - f - Math.round(f * 0.45) - L;
    g.save(); g.shadowColor = "rgba(0,0,0,.45)"; g.shadowBlur = Math.round(L * 0.12); g.shadowOffsetY = Math.round(L * 0.02);
    g.drawImage(logo, Math.round(cx - L / 2), yLogo, L, L);
    g.fillStyle = "#ffffff"; g.textAlign = "center"; g.textBaseline = "top";
    g.fillText(testo, cx, yLogo + L + Math.round(f * 0.35));
    g.restore();
    return await new Promise((ok, ko) => c.toBlob(b => b ? ok(b) : ko(new Error("marchio")), "image/jpeg", 0.9));
  } catch(e){ return blob; }
}
async function diarioCondividi(id){
  const v = diarioVoci.find(x => x.id === id); if(!v) return;
  const h = horses.find(x => x.id === v.horse_id) || {};
  const testo = [v.testo, (h.name ? h.name + " · " : "") + "Equo", "#equo #cavalli"].filter(Boolean).join("\n");
  try{
    if(v.tipo === "nota"){
      if(navigator.share){ await navigator.share({ text: testo }); }
      else if(navigator.clipboard){ await navigator.clipboard.writeText(testo); showToast("Testo copiato: incollalo su Instagram"); }
      return;
    }
    let blob = diarioShareBlob && diarioShareBlob.id === id ? diarioShareBlob.b : null;
    if(!blob){
      await firmaUrl("diario-media", [v.media_path], diarioUrl);
      const u = diarioUrl[v.media_path]; if(!u) throw new Error("foto non disponibile");
      blob = await diarioMarchia(await (await fetch(u)).blob());
    }
    const file = new File([blob], "equo-" + (h.name || "cavallo").replace(/[^a-z0-9]+/gi, "-").toLowerCase() + ".jpg", { type: "image/jpeg" });
    if(navigator.canShare && navigator.canShare({ files: [file] })){
      await navigator.share({ files: [file], text: testo });
    } else {
      // computer o browser senza condivisione file: salva la foto e copia il testo
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = file.name; document.body.appendChild(a); a.click(); a.remove();
      try{ if(navigator.clipboard) await navigator.clipboard.writeText(testo); } catch(e){}
      showToast("Foto salvata e testo copiato: aprila e pubblicala su Instagram");
    }
  } catch(e){
    if(e && e.name === "AbortError") return;
    showToast("Non riesco a condividere: " + ((e && e.message) || "errore"));
  }
}
function diarioDetCatScegli(c){ diarioDetCat = c; document.querySelectorAll("#dr-det-cats .dr-chip").forEach(b => b.classList.toggle("on", b.getAttribute("onclick").includes("'" + c + "'"))); }
async function diarioDetSalva(){
  const { error } = await sb.from("diario_voci").update({ testo: document.getElementById("dr-det-testo").value.trim() || null, categoria: diarioDetCat }).eq("id", diarioDetId);
  if(error){ showToast("Non riesco a salvare: " + error.message); return; }
  closeModal("modal-dr-sheet"); showToast("Modifiche salvate"); await diarioAggiorna();
}
async function diarioNellAlbum(){
  const v = diarioVoci.find(x => x.id === diarioDetId); if(!v || !v.media_path) return;
  try{
    const dl = await sb.storage.from("diario-media").download(v.media_path);
    if(dl.error) throw dl.error;
    const path = currentUser.id + "/" + v.horse_id + "/" + Date.now() + "-d.jpg";
    const up = await sb.storage.from("cavalli-album").upload(path, dl.data, { contentType: "image/jpeg", upsert: false });
    if(up.error) throw up.error;
    const rows = await albumFetch(v.horse_id);
    const { error } = await sb.from("cavalli_album").insert({ horse_id: v.horse_id, path, mime: "image/jpeg", byte: dl.data.size, copertina: !rows.some(r => r.copertina) });
    if(error) throw error;
    closeModal("modal-dr-sheet"); showToast("Foto aggiunta all'album di " + (diarioCavallo() || {}).name);
    await albumFetch(v.horse_id); diarioHomeRender();
  } catch(e){ showToast("Non riesco: " + (e.message || "errore") + " (hai eseguito l'SQL dell'album?)"); }
}
async function diarioNascondi(id){
  if(!confirm("Nascondere questo momento dal Diario? Resta nello storico del cavallo ma non lo vedrai più.")) return;
  const { error } = await sb.from("diario_voci").update({ nascosta: true }).eq("id", id);
  if(error){ showToast("Non riesco a nasconderlo: " + error.message); return; }
  closeModal("modal-dr-sheet"); await diarioAggiorna();
}
