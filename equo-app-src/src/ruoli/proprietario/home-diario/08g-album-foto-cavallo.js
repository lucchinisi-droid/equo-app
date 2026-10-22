/* ---- album foto del cavallo (condiviso con l'app: copertina di Diario e Home) ---- */
let albumCache = {}, albumUrlMap = {};
async function albumFetch(horseId){
  if(DEMO_MODE){ albumCache[horseId] = []; return []; }
  const { data, error } = await sb.from("cavalli_album").select("*").eq("horse_id", horseId).eq("nascosta", false).order("created_at", { ascending: false }).limit(60);
  const rows = error ? [] : (data || []);
  await firmaUrl("cavalli-album", rows.map(r => r.path), albumUrlMap);
  albumCache[horseId] = rows;
  return rows;
}
function cavalloHero(h){
  const rows = albumCache[h.id] || [], cov = rows.find(r => r.copertina) || rows[0];
  if(cov && albumUrlMap[cov.path]) return albumUrlMap[cov.path];
  const f = (diarioVoci || []).filter(v => v.horse_id === h.id).map(diarioFotoUrl).find(Boolean);
  if(f) return f;
  const i = Math.max(0, horses.findIndex(x => x.id === h.id));
  return EQUO_HERO[i % EQUO_HERO.length];
}
function apriSchedaCavallo(id){
  const h = id ? horses.find(x => x.id === id) : (horses.length === 1 ? horses[0] : diarioCavallo());
  showPage("cavalli");
  if(h) openHorseDetail(h.id);
}
async function albumRender(horseId){
  const box = document.getElementById("horse-album"); if(!box) return;
  const rows = await albumFetch(horseId);
  box.innerHTML = '<div class="f piu" onclick="document.getElementById(\'album-file\').click()"><svg class="ic-d" style="width:28px;height:28px"><use href="#i-plus"/></svg></div>' +
    rows.map(r => `<div class="f${r.copertina ? " cop" : ""}" style="background-image:url('${albumUrlMap[r.path] || ""}')" onclick="albumApriFoto('${r.id}')">${r.copertina ? '<span class="cb">Copertina</span>' : ""}</div>`).join("");
}
async function albumCarica(inp){
  const files = Array.from(inp.files || []); inp.value = "";
  if(!files.length || !currentHorseId) return;
  if(DEMO_MODE){ showToast("L'album non è disponibile nella demo"); return; }
  showToast("Carico " + files.length + " foto…");
  let ok = 0;
  const rows0 = albumCache[currentHorseId] || [];
  let haCop = rows0.some(r => r.copertina);
  for(const f of files){
    try{
      const blob = await diarioComprimi(f);
      const path = currentUser.id + "/" + currentHorseId + "/" + Date.now() + "-" + ok + ".jpg";
      const up = await sb.storage.from("cavalli-album").upload(path, blob, { contentType: "image/jpeg", upsert: false });
      if(up.error) throw up.error;
      const { error } = await sb.from("cavalli_album").insert({ horse_id: currentHorseId, path, mime: "image/jpeg", byte: blob.size, copertina: !haCop });
      if(error) throw error;
      haCop = true; ok++;
    } catch(e){ showToast("Foto non caricata: " + (e.message || "errore")); }
  }
  if(ok) showToast(ok + (ok > 1 ? " foto aggiunte all'album" : " foto aggiunta all'album"));
  await albumRender(currentHorseId); diarioHomeRender();
}
let albumFotoId = null;
function albumApriFoto(id){
  const r = (albumCache[currentHorseId] || []).find(x => x.id === id); if(!r) return;
  albumFotoId = id;
  document.getElementById("album-img").src = albumUrlMap[r.path] || "";
  document.getElementById("album-cop").style.display = r.copertina ? "none" : "block";
  openModal("modal-album-foto");
}
async function albumCopertina(){
  const id = albumFotoId; if(!id) return;
  await sb.from("cavalli_album").update({ copertina: false }).eq("horse_id", currentHorseId).eq("copertina", true);
  const { error } = await sb.from("cavalli_album").update({ copertina: true }).eq("id", id);
  if(error){ showToast("Non riesco: " + error.message); return; }
  closeModal("modal-album-foto"); showToast("Copertina aggiornata");
  await albumRender(currentHorseId); diarioHomeRender();
}
async function albumNascondi(){
  const id = albumFotoId; if(!id) return;
  if(!confirm("Nascondere questa foto dall'album?")) return;
  const { error } = await sb.from("cavalli_album").update({ nascosta: true, copertina: false }).eq("id", id);
  if(error){ showToast("Non riesco: " + error.message); return; }
  closeModal("modal-album-foto");
  await albumRender(currentHorseId); diarioHomeRender();
}
