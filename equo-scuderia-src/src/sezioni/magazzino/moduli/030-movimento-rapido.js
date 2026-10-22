// Equo App · magazzino · modulo (moduli ES, costruiti con Vite in ruoli/magazzino/costruito.js)
import { magCalcola } from "./023-dati.js";
import { magRenderTutto } from "./025-vista-semplice-completa-magazzino-e-stat.js";
import { magOpzioniUbicazioni } from "./031-articolo-nuovo-modifica.js";
/* ---------------- movimento rapido ---------------- */
let magMov = { tipo: "scarico", articolo: null };
function magApriMovimento(articoloId, tipo){
  magMov = { tipo: tipo || "scarico", articolo: articoloId ? mag.articoli.find(a => a.id === articoloId) : null };
  document.getElementById("mag-mov-q").value = "";
  document.getElementById("mag-mov-nota").value = "";
  document.getElementById("mag-mov-err").style.display = "none";
  document.getElementById("mag-mov-cavallo").innerHTML = `<option value="">—</option>` + (cavalliList || []).map(c => `<option value="${c.id}">${escapeHtml(c.nome)}</option>`).join("");
  document.getElementById("mag-mov-fornitore").innerHTML = `<option value="">—</option>` + mag.fornitori.map(f => `<option value="${f.id}">${escapeHtml(f.nome)}</option>`).join("");
  document.getElementById("mag-mov-ubicazione").innerHTML = magOpzioniUbicazioni();
  magMovTipo(magMov.tipo, true);
  magMovMostra();
  openModal("modal-mag-movimento");
  if(!magMov.articolo) setTimeout(() => document.getElementById("mag-mov-q").focus(), 80);
}
function magMovTipo(t, silenzioso){
  magMov.tipo = t;
  document.querySelectorAll("#mag-mov-seg button").forEach(b => b.classList.toggle("active", b.dataset.t === t));
  document.getElementById("mag-mov-extra-carico").style.display = t === "carico" ? "grid" : "none";
  document.getElementById("mag-mov-extra-scarico").style.display = t === "scarico" ? "block" : "none";
  document.getElementById("mag-mov-extra-sposta").style.display = t === "trasferimento" ? "block" : "none";
  document.getElementById("mag-mov-q-box").style.display = t === "trasferimento" ? "none" : "block";
  document.getElementById("mag-mov-q-label").textContent = t === "rettifica" ? "Quantità contata realmente (inventario)" : t === "carico" ? "Quantità arrivata" : "Quantità usata";
  const btn = document.getElementById("mag-mov-salva");
  btn.className = "btn btn-block " + (t === "scarico" ? "btn-danger" : "btn-primary");
  btn.innerHTML = t === "scarico" ? '<i class="fa-solid fa-minus"></i> Registra scarico' : t === "carico" ? '<i class="fa-solid fa-plus"></i> Registra carico' : t === "rettifica" ? '<i class="fa-solid fa-scale-balanced"></i> Salva inventario' : '<i class="fa-solid fa-right-left"></i> Sposta';
  if(!silenzioso) magMovMostra();
}
function magMovMostra(){
  const a = magMov.articolo;
  document.getElementById("mag-mov-pick-box").style.display = a ? "none" : "block";
  document.getElementById("mag-mov-corpo").style.display = a ? "block" : "none";
  if(!a){ magMovRenderPick(); return; }
  const c = mag.calc[a.id];
  document.getElementById("mag-mov-sel").innerHTML = `${magIcona(a.categoria)}<div class="t">${escapeHtml(a.nome)}<small>${escapeHtml([a.formato, magUbiNome(a.ubicazione_id)].filter(Boolean).join(" · ") || a.sottocategoria)} · tocca per cambiare</small></div>
    <div class="q"><i class="mag-sem ${c.stato}"></i> ${magFmt(c.giacenza)} ${escapeHtml(a.unita)}</div>`;
  document.getElementById("mag-mov-unita").textContent = a.unita;
  const qta = document.getElementById("mag-mov-qta");
  qta.value = magMov.tipo === "rettifica" ? magFmt(Math.max(c.giacenza, 0), 3).replace(/\./g, "").replace(",", ".") : 1;
  const rapidi = magMov.tipo === "rettifica" ? [] : (a.unita === "kg" ? [1, 5, 10, 25] : [1, 2, 5, 10]);
  document.getElementById("mag-mov-rapidi").innerHTML = rapidi.map(n => `<button type="button" onclick="document.getElementById('mag-mov-qta').value=${n};magMovAnteprima()">${n}</button>`).join("");
  document.getElementById("mag-mov-costo").value = a.costo_unitario ?? "";
  document.getElementById("mag-mov-fornitore").value = a.fornitore_id || "";
  document.getElementById("mag-mov-lotto").value = ""; document.getElementById("mag-mov-scadenza").value = "";
  document.getElementById("mag-mov-cavallo").value = a.cavallo_id || "";
  document.getElementById("mag-mov-ubicazione").value = a.ubicazione_id || "";
  const lotto = c.lottiAttivi[0];
  document.getElementById("mag-mov-lotto-info").innerHTML = lotto ? `<i class="fa-solid fa-circle-info"></i> Scarico dal lotto che scade prima: <b>${escapeHtml(lotto.lotto || "senza lotto")}</b>${lotto.scadenza ? " (scad. " + magDataIt(lotto.scadenza) + ")" : ""}` : "";
  qta.oninput = magMovAnteprima;
  magMovAnteprima();
}
function magMovAnteprima(){
  const a = magMov.articolo; if(!a) return;
  const c = mag.calc[a.id];
  const q = Number(String(document.getElementById("mag-mov-qta").value).replace(",", ".")) || 0;
  const dopo = magMov.tipo === "scarico" ? c.giacenza - q : magMov.tipo === "carico" ? c.giacenza + q : q;
  const soglia = Number(a.soglia_minima || 0);
  const col = dopo <= 0 || (soglia && dopo < soglia) ? "var(--danger)" : soglia && dopo < soglia * 1.5 ? "#a07400" : "#2f8a4e";
  document.getElementById("mag-mov-anteprima").innerHTML = `Dopo: <b style="color:${col}">${magFmt(dopo)} ${escapeHtml(a.unita)}</b>` +
    (magEquivalente(dopo, a) ? ` <span style="color:var(--muted)">(${magEquivalente(dopo, a)})</span>` : "") +
    (magMov.tipo === "rettifica" ? ` · differenza ${dopo - c.giacenza >= 0 ? "+" : ""}${magFmt(dopo - c.giacenza)}` : "") +
    (magMov.tipo === "scarico" && q > c.giacenza ? ` · <span style="color:var(--danger)">più di quello che risulta!</span>` : "");
}
function magMovStep(d){
  const el = document.getElementById("mag-mov-qta");
  const v = Math.max(0, (Number(String(el.value).replace(",", ".")) || 0) + d);
  el.value = Math.round(v * 1000) / 1000;
  magMovAnteprima();
}
function magMovCambiaArticolo(){ magMov.articolo = null; magMovMostra(); setTimeout(() => document.getElementById("mag-mov-q").focus(), 50); }
function magMovRenderPick(){
  const q = (document.getElementById("mag-mov-q").value || "").trim().toLowerCase();
  // senza ricerca: prima i più usati di recente
  const recenti = [...new Set(mag.movimenti.map(m => m.articolo_id))];
  let lista = mag.articoli.slice();
  if(q) lista = lista.filter(a => [a.nome, a.marca, a.formato, a.sottocategoria, magCats()[a.categoria]?.nome].filter(Boolean).join(" ").toLowerCase().includes(q));
  else lista.sort((x, y) => { const ix = recenti.indexOf(x.id), iy = recenti.indexOf(y.id); return (ix < 0 ? 9999 : ix) - (iy < 0 ? 9999 : iy); });
  document.getElementById("mag-mov-pick").innerHTML = lista.slice(0, 30).map(a => {
    const c = mag.calc[a.id];
    return `<div class="mag-pick" onclick="magMovScegli('${a.id}')">${magIcona(a.categoria)}<div class="t">${escapeHtml(a.nome)}<small>${escapeHtml([a.sottocategoria, a.formato].filter(Boolean).join(" · "))}</small></div>
      <div class="q"><i class="mag-sem ${c.stato}"></i> ${magFmt(c.giacenza)} ${escapeHtml(a.unita)}</div></div>`;
  }).join("") || `<div style="color:var(--muted);font-size:13px;padding:10px">Nessun articolo trovato.${magPuoGestire() ? ` <a href="#" onclick="event.preventDefault();closeModal('modal-mag-movimento');magApriArticolo()">Crealo</a>` : ""}</div>`;
}
function magMovScegli(id){ magMov.articolo = mag.articoli.find(a => a.id === id); magMovMostra(); }

async function magSalvaMovimento(){
  const a = magMov.articolo; if(!a) return;
  const err = document.getElementById("mag-mov-err"); err.style.display = "none";
  const c = mag.calc[a.id];
  const q = Number(String(document.getElementById("mag-mov-qta").value).replace(",", ".")) || 0;
  const nota = document.getElementById("mag-mov-nota").value.trim() || null;
  const righe = [];
  const base = { centro_id: currentCentro.id, articolo_id: a.id, nota };
  if(magMov.tipo === "trasferimento"){
    const u = document.getElementById("mag-mov-ubicazione").value;
    if(!u){ err.textContent = "Scegli la nuova ubicazione."; err.style.display = "block"; return; }
    righe.push({ ...base, tipo: "trasferimento", quantita: Math.max(c.giacenza, 1), ubicazione_a: u });
  } else if(magMov.tipo === "rettifica"){
    const delta = Math.round((q - c.giacenza) * 1000) / 1000;
    if(!delta){ closeModal("modal-mag-movimento"); showToast("Inventario confermato: nessuna differenza."); return; }
    righe.push({ ...base, tipo: "rettifica", quantita: delta, nota: nota || `Inventario: contati ${magFmt(q)} ${a.unita}` });
  } else {
    if(q <= 0){ err.textContent = "Inserisci una quantità maggiore di zero."; err.style.display = "block"; return; }
    if(magMov.tipo === "carico"){
      const costo = document.getElementById("mag-mov-costo").value;
      righe.push({ ...base, tipo: "carico", quantita: q, lotto: document.getElementById("mag-mov-lotto").value.trim() || null,
        scadenza: document.getElementById("mag-mov-scadenza").value || null, costo_unitario: costo === "" ? null : Number(costo),
        fornitore_id: document.getElementById("mag-mov-fornitore").value || null });
    } else {
      // scarico: si consumano prima i lotti che scadono prima (FIFO per scadenza)
      const cavallo = document.getElementById("mag-mov-cavallo").value || null;
      let resto = q;
      for(const l of c.lottiAttivi){
        if(resto <= 0) break;
        const usa = Math.min(resto, l.qta);
        righe.push({ ...base, tipo: "scarico", quantita: Math.round(usa * 1000) / 1000, lotto: l.lotto, scadenza: l.scadenza, cavallo_id: cavallo });
        resto -= usa;
      }
      if(resto > 0.0001) righe.push({ ...base, tipo: "scarico", quantita: Math.round(resto * 1000) / 1000, cavallo_id: cavallo });
    }
  }
  const btn = document.getElementById("mag-mov-salva"); btn.disabled = true;
  const errore = await magInserisciMovimenti(righe);
  btn.disabled = false;
  if(errore){ err.textContent = "Non salvato: " + errore; err.style.display = "block"; return; }
  closeModal("modal-mag-movimento");
  magCalcola(); magRenderTutto();
  const cn = mag.calc[a.id];
  showToast(`${MAG_TIPI_MOV[magMov.tipo]} registrato · ${a.nome}: ${magFmt(cn.giacenza)} ${a.unita}` + (cn.stato === "rosso" ? " ⚠️ da riordinare" : ""));
}
async function magInserisciMovimenti(righe){
  if(DEMO_MODE){
    righe.forEach(r => {
      const m = { id: "dm" + Math.random().toString(36).slice(2), created_at: new Date().toISOString(), creato_da_nome: currentMembro?.nome_visualizzato || "Tu", ...r };
      if(m.tipo === "trasferimento"){ const art = mag.articoli.find(x => x.id === m.articolo_id); if(art) art.ubicazione_id = m.ubicazione_a; }
      mag.movimenti.unshift(m);
    });
    demoState.mag = JSON.parse(JSON.stringify({ articoli: mag.articoli, movimenti: mag.movimenti, ubicazioni: mag.ubicazioni, fornitori: mag.fornitori, ordini: mag.ordini, categorie: mag.categorie }));
    return null;
  }
  const { data, error } = await sb.from("mag_movimenti").insert(righe).select();
  if(error){ console.error("mag_movimenti:", error); return error.message; }
  mag.movimenti.unshift(...(data || []).reverse());
  if(righe.some(r => r.tipo === "trasferimento")){ const r = righe[0]; const art = mag.articoli.find(x => x.id === r.articolo_id); if(art) art.ubicazione_id = r.ubicazione_a; }
  return null;
}


export { magApriMovimento, magInserisciMovimenti, magMovAnteprima, magMovCambiaArticolo, magMovRenderPick, magMovScegli, magMovStep, magMovTipo, magSalvaMovimento };
