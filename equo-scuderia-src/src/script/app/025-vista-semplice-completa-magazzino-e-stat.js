/* ---------- VISTA SEMPLICE / COMPLETA (Magazzino e Statistiche) ----------
   Scelta per persona (su questo dispositivo). All'inizio: Semplice per lo staff di livello 1, Completa per admin e livelli 2-3. */
function vistaChiave(modulo){ return `equo-vista-${modulo}-${currentUser?.id || "demo"}`; }
function vistaSemplice(modulo){
  let v = null; try{ v = localStorage.getItem(vistaChiave(modulo)); }catch(e){}
  if(v) return v === "semplice";
  const staffBase = !(currentMembro?.ruolo === "admin" || ["admin","2","3"].includes(String(currentMembro?.livello)) || currentCentro?.owner_id === currentUser?.id);
  return staffBase;
}
function vistaCambia(modulo, completa){
  try{ localStorage.setItem(vistaChiave(modulo), completa ? "completa" : "semplice"); }catch(e){}
  if(typeof Registro !== "undefined") Registro.azione(`vista-${modulo}:${completa ? "completa" : "semplice"}`);
  if(modulo === "magazzino") magRenderTutto(); else if(statDati) renderStatistiche(statDati);
}
function vistaSincronizza(modulo){ const t = document.getElementById("vs-" + modulo); if(t) t.checked = !vistaSemplice(modulo); }

let magSempliceCerca = "";
function magRenderSemplice(){
  const box = document.getElementById("mag-semplice");
  const durevole = a => !!magCats()[a.categoria]?.durevole;
  const ordine = { rosso: 0, giallo: 1, verde: 2 };
  const daComprare = mag.articoli.filter(a => !durevole(a) && (mag.calc[a.id]?.daOrdinare > 0 || mag.calc[a.id]?.stato === "rosso"))
    .sort((x, y) => ordine[mag.calc[x.id].stato] - ordine[mag.calc[y.id].stato]);
  const g = magStatoGruppo(mag.articoli.filter(a => !durevole(a)));
  const q = magSempliceCerca.trim().toLowerCase();
  const lista = mag.articoli.filter(a => !q || [a.nome, a.marca, a.sottocategoria].filter(Boolean).join(" ").toLowerCase().includes(q))
    .sort((x, y) => ordine[mag.calc[x.id].stato] - ordine[mag.calc[y.id].stato] || x.nome.localeCompare(y.nome, "it"));
  const forn = id => mag.fornitori.find(f => f.id === id)?.nome;
  const riga = a => { const c = mag.calc[a.id];
    return `<div class="ms-riga"><i class="mag-sem ${c.stato}" data-tip="${escapeHtml(c.motivo)}"></i>
      <div class="ms-t" onclick="magApriDettaglio('${a.id}')"><b>${escapeHtml(a.nome)}</b><span>${magFmt(c.giacenza)} ${escapeHtml(a.unita)}${c.stato !== "verde" ? " · " + escapeHtml(c.motivo) : ""}</span></div>
      <button class="ms-btn meno" data-tip="Ne ho usato 1 ${escapeHtml(MAG_SINGOLARE[a.unita] || a.unita)}" onclick="magRapido('${a.id}','scarico')">−</button>
      <button class="ms-btn piu" data-tip="Ne è arrivato 1 ${escapeHtml(MAG_SINGOLARE[a.unita] || a.unita)}" onclick="magRapido('${a.id}','carico')">+</button></div>`; };
  box.innerHTML = `
    <div class="card ms-testa ${g.rosso ? "rosso" : g.giallo ? "giallo" : "verde"}"><i class="fa-solid ${g.rosso ? "fa-triangle-exclamation" : g.giallo ? "fa-hourglass-half" : "fa-circle-check"}"></i>
      <div><b>${g.rosso || g.giallo ? [g.rosso ? `${g.rosso} ${g.rosso === 1 ? "articolo" : "articoli"} da comprare` : "", g.giallo ? `${g.giallo} ${g.giallo === 1 ? "sta" : "stanno"} finendo` : ""].filter(Boolean).join(" · ") : "Il magazzino è a posto"}</b>
      <span>Tocca − quando usi qualcosa, + quando arriva.</span></div></div>
    ${daComprare.length ? `<div class="card ms-sez"><h3><i class="fa-solid fa-cart-shopping"></i> Da comprare</h3>${daComprare.map(a => { const c = mag.calc[a.id];
      return `<div class="ms-riga"><i class="mag-sem ${c.stato}"></i><div class="ms-t"><b>${escapeHtml(a.nome)}</b><span>ne hai ${magFmt(c.giacenza)} ${escapeHtml(a.unita)}${c.daOrdinare ? ` · compra ${magFmt(c.daOrdinare)}` : ""}${forn(a.fornitore_id) ? " · " + escapeHtml(forn(a.fornitore_id)) : ""}</span></div>
        <button class="btn btn-primary btn-conferma btn-sm" data-tip="Registra l'arrivo della merce" onclick="magComprato('${a.id}')"><i class="fa-solid fa-check"></i> Comprato</button></div>`; }).join("")}</div>` : ""}
    <div class="card ms-sez"><div class="mag-search" style="margin-bottom:8px"><i class="fa-solid fa-magnifying-glass"></i><input class="input" id="ms-cerca" placeholder="Cerca un articolo…" value="${escapeHtml(magSempliceCerca)}" oninput="magSempliceCerca=this.value;magRenderSemplice();const i=document.getElementById('ms-cerca');i.focus();i.setSelectionRange(i.value.length,i.value.length)"></div>
      ${lista.length ? lista.map(riga).join("") : `<div style="color:var(--muted);font-size:13.5px;padding:10px 0">${mag.articoli.length ? "Nessun articolo trovato." : "Ancora nessun articolo: passa alla vista Completa per aggiungerli."}</div>`}</div>`;
}
// un tocco = 1 unità (lo scarico usa prima i lotti che scadono prima)
async function magRapido(id, tipo){
  const a = mag.articoli.find(x => x.id === id), c = mag.calc[id]; if(!a) return;
  if(tipo === "scarico" && c.giacenza <= 0){ showToast(`${a.nome}: non risulta disponibile.`); return; }
  const base = { centro_id: currentCentro.id, articolo_id: id, quantita: 1, tipo };
  if(tipo === "scarico"){ const l = c.lottiAttivi.find(x => x.qta >= 1); if(l){ base.lotto = l.lotto; base.scadenza = l.scadenza; } }
  const errore = await magInserisciMovimenti([base]);
  if(errore){ showToast("Non salvato: " + errore); return; }
  magCalcola(); magRenderTutto();
  const cn = mag.calc[id];
  showToast(`${tipo === "scarico" ? "−1" : "+1"} ${MAG_SINGOLARE[a.unita] || a.unita} · ${a.nome}: ${magFmt(cn.giacenza)} ${a.unita}${cn.stato === "rosso" ? " ⚠️ da comprare" : ""}`);
}
function magComprato(id){
  const q = mag.calc[id]?.daOrdinare || "";
  magApriMovimento(id, "carico");
  setTimeout(() => { const i = document.getElementById("mag-mov-qta"); if(i && q){ i.value = q; if(typeof magMovAnteprima === "function") magMovAnteprima(); } }, 60);
}

function magRenderTutto(){
  vistaSincronizza("magazzino");
  const semplice = vistaSemplice("magazzino");
  document.getElementById("mag-semplice").style.display = semplice ? "" : "none";
  ["mag-hero", "mag-subnav", "mag-v-giacenze", "mag-v-movimenti", "mag-v-ordini", "mag-v-depositi", "mag-v-fornitori"].forEach(id => {
    const el = document.getElementById(id); if(!el) return;
    if(semplice){ if(el.style.display !== "none") el.dataset.vsPrima = el.style.display || "show"; el.style.display = "none"; }
    else if(el.dataset.vsPrima){ el.style.display = el.dataset.vsPrima === "show" ? "" : el.dataset.vsPrima; delete el.dataset.vsPrima; }
  });
  if(semplice){ magRenderSemplice(); return; }
  magRenderHero();
  magRenderCategorie();
  magRender();
  if(magUI.vista === "movimenti") magRenderMovimenti();
  if(magUI.vista === "ordini") magRenderOrdini();
  if(magUI.vista === "depositi") magRenderDepositi();
  if(magUI.vista === "fornitori") magRenderFornitori();
  const nRiordino = mag.articoli.filter(a => mag.calc[a.id]?.daOrdinare > 0).length;
  const b = document.getElementById("mag-n-riordino");
  b.textContent = nRiordino; b.style.display = nRiordino ? "" : "none";
}

function magVista(v){
  magUI.vista = v;
  document.querySelectorAll("#mag-subnav button").forEach(b => b.classList.toggle("active", b.dataset.magVista === v));
  ["giacenze","movimenti","ordini","depositi","fornitori"].forEach(x => { document.getElementById("mag-v-" + x).style.display = x === v ? "block" : "none"; });
  magRenderTutto();
}

