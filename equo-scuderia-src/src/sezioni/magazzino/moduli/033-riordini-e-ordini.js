// Equo App · magazzino · modulo (moduli ES, costruiti con Vite in ruoli/magazzino/costruito.js)
import { loadMagazzino, magCalcola } from "./023-dati.js";
import { magRenderTutto } from "./025-vista-semplice-completa-magazzino-e-stat.js";
import { magInserisciMovimenti } from "./030-movimento-rapido.js";
/* ---------------- riordini e ordini ---------------- */
function magRenderOrdini(){
  const box = document.getElementById("mag-ordini");
  const daOrd = mag.articoli.filter(a => mag.calc[a.id].daOrdinare > 0);
  const gruppi = {};
  daOrd.forEach(a => { const k = a.fornitore_id || "-"; (gruppi[k] = gruppi[k] || []).push(a); });
  let html = "";
  if(daOrd.length){
    html += `<div style="font-size:13px;color:var(--muted)">Quantità suggerite per tornare alla scorta ottimale (o al doppio della soglia minima). Modificale se serve, poi crea l'ordine: puoi mandarlo al fornitore via WhatsApp o email.</div>`;
    Object.entries(gruppi).forEach(([fid, arts]) => {
      const f = mag.fornitori.find(x => x.id === fid);
      const totale = arts.reduce((t, a) => t + mag.calc[a.id].daOrdinare * Number(a.costo_unitario || 0), 0);
      html += `<div class="card mag-riordino-g"><h3><i class="fa-solid fa-truck-ramp-box" style="color:var(--primary)"></i> ${f ? escapeHtml(f.nome) : "Senza fornitore"}
        <span class="badge-pill badge-gray" style="margin-left:auto">${arts.length} articoli${totale ? " · ≈ " + magEuro(totale) : ""}</span></h3>
        <div style="margin-top:8px">${arts.map(a => { const c = mag.calc[a.id]; return `<div class="mag-riordino-row"><div><i class="mag-sem ${c.stato}" style="margin-right:6px"></i><b>${escapeHtml(a.nome)}</b>
          <div style="color:var(--muted);font-size:12px;margin-left:16px">ora ${magFmt(c.giacenza)} ${escapeHtml(a.unita)} · soglia ${magFmt(a.soglia_minima)}</div></div>
          <div style="color:var(--muted);font-size:12px;text-align:right">${escapeHtml(a.unita)}</div><input type="number" min="0" step="any" data-ord-art="${a.id}" data-ord-forn="${fid}" value="${c.daOrdinare}"></div>`; }).join("")}</div>
        ${magPuoGestire() ? `<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px;flex-wrap:wrap">
          <button class="btn btn-sm btn-outline" onclick="magCopiaOrdine('${fid}')"><i class="fa-solid fa-copy"></i> Copia testo</button>
          <button class="btn btn-sm btn-primary" onclick="magCreaOrdine('${fid}')"><i class="fa-solid fa-paper-plane"></i> Crea e invia ordine</button></div>` : ""}
      </div>`;
    });
  } else {
    html += `<div class="card" style="display:flex;gap:12px;align-items:center"><i class="fa-solid fa-circle-check" style="color:#2f8a4e;font-size:26px"></i><div><b>Niente da riordinare</b><div style="color:var(--muted);font-size:13px">Tutte le scorte sono sopra la soglia. Imposta soglia minima e scorta ottimale negli articoli per ricevere i suggerimenti.</div></div></div>`;
  }
  const ordini = mag.ordini.filter(o => o.stato !== "annullato");
  if(ordini.length){
    html += `<h3 style="margin:10px 0 0;font-size:15px">Ordini</h3>` + ordini.map(o => {
      const f = mag.fornitori.find(x => x.id === o.fornitore_id);
      const pill = { bozza: ["badge-gray", "Bozza"], inviato: ["badge-yellow", "Inviato · in arrivo"], ricevuto: ["badge-green", "Ricevuto"] }[o.stato] || ["badge-gray", o.stato];
      const righe = (o.righe || []).map(r => { const a = mag.articoli.find(x => x.id === r.articolo_id); return `${magFmt(r.quantita)} ${escapeHtml(a?.unita || "")} ${escapeHtml(a?.nome || "articolo")}`; }).join(", ");
      return `<div class="card mag-ordine"><div class="t"><b>${f ? escapeHtml(f.nome) : "Ordine"}</b> <span class="badge-pill ${pill[0]}">${pill[1]}</span>
        <div style="color:var(--muted);font-size:12.5px;margin-top:4px">${magDataIt(o.created_at)} · ${righe}</div></div>
        ${o.stato === "inviato" ? `<button class="btn btn-sm btn-primary" onclick="magRiceviOrdine('${o.id}')"><i class="fa-solid fa-box-open"></i> Ricevuto: carica in magazzino</button>` : ""}
        ${o.stato === "bozza" && magPuoGestire() ? `<button class="btn btn-sm btn-outline" onclick="magInviaOrdine('${o.id}')"><i class="fa-solid fa-paper-plane"></i> Invia</button>` : ""}</div>`;
    }).join("");
  }
  box.innerHTML = html;
}
function magRigheOrdine(fid){
  return [...document.querySelectorAll(`[data-ord-forn="${fid}"]`)].map(i => ({ articolo_id: i.dataset.ordArt, quantita: Number(i.value) || 0 })).filter(r => r.quantita > 0);
}
function magTestoOrdine(fid, righe){
  const f = mag.fornitori.find(x => x.id === fid);
  return `Buongiorno${f?.referente ? " " + f.referente : ""},\nvorremmo ordinare:\n` +
    righe.map(r => { const a = mag.articoli.find(x => x.id === r.articolo_id); return `- ${magFmt(r.quantita)} ${a.unita} ${a.nome}${a.marca ? " (" + a.marca + ")" : ""}${a.formato ? " – " + a.formato : ""}`; }).join("\n") +
    `\n\nConsegna presso ${currentCentro?.nome || "il nostro centro"}${currentCentro?.indirizzo ? ", " + currentCentro.indirizzo : ""}.\nGrazie!`;
}
function magCopiaOrdine(fid){
  const righe = magRigheOrdine(fid); if(!righe.length){ showToast("Nessuna quantità da ordinare."); return; }
  navigator.clipboard?.writeText(magTestoOrdine(fid, righe)).then(() => showToast("Testo dell'ordine copiato.")).catch(() => showToast("Copia non riuscita."));
}
async function magCreaOrdine(fid){
  const righe = magRigheOrdine(fid); if(!righe.length){ showToast("Nessuna quantità da ordinare."); return; }
  const row = { centro_id: currentCentro.id, fornitore_id: fid === "-" ? null : fid, stato: "bozza", righe };
  let ordine;
  if(DEMO_MODE){ ordine = { id: "do" + Math.random().toString(36).slice(2), created_at: new Date().toISOString(), ...row }; mag.ordini.unshift(ordine); }
  else {
    const { data, error } = await sb.from("mag_ordini").insert(row).select().single();
    if(error){ showToast("Ordine non creato: " + error.message); return; }
    ordine = data; mag.ordini.unshift(data);
  }
  await magInviaOrdine(ordine.id);
}
async function magInviaOrdine(id){
  const o = mag.ordini.find(x => x.id === id); if(!o) return;
  const f = mag.fornitori.find(x => x.id === o.fornitore_id);
  const testo = magTestoOrdine(o.fornitore_id || "-", o.righe || []);
  const tel = (f?.telefono || "").replace(/[^\d+]/g, "").replace(/^\+/, "");
  if(tel) window.open(`https://wa.me/${tel.startsWith("39") || tel.length > 10 ? tel : "39" + tel}?text=${encodeURIComponent(testo)}`, "_blank");
  else if(f?.email) window.location.href = `mailto:${f.email}?subject=${encodeURIComponent("Ordine " + (currentCentro?.nome || ""))}&body=${encodeURIComponent(testo)}`;
  else navigator.clipboard?.writeText(testo).catch(() => {});
  const agg = { stato: "inviato", inviato_at: new Date().toISOString() };
  if(DEMO_MODE) Object.assign(o, agg);
  else { const { error } = await sb.from("mag_ordini").update(agg).eq("id", id); if(error){ showToast("Stato ordine non aggiornato: " + error.message); return; } Object.assign(o, agg); }
  magRenderTutto();
  showToast(tel ? "Ordine aperto in WhatsApp: segnato come inviato." : f?.email ? "Ordine aperto nella tua email: segnato come inviato." : "Testo copiato: incollalo dove vuoi. Ordine segnato come inviato.");
}
async function magRiceviOrdine(id){
  const o = mag.ordini.find(x => x.id === id); if(!o) return;
  if(!confirm("Merce arrivata? Le quantità dell'ordine vengono caricate in magazzino.")) return;
  if(DEMO_MODE){
    await magInserisciMovimenti((o.righe || []).map(r => ({ centro_id: currentCentro.id, articolo_id: r.articolo_id, tipo: "carico", quantita: r.quantita, fornitore_id: o.fornitore_id, nota: "Ricevuto da ordine" })));
    o.stato = "ricevuto"; o.ricevuto_at = new Date().toISOString();
  } else {
    const { data, error } = await sb.rpc("mag_ricevi_ordine", { p_ordine_id: id });
    if(error || !data?.ok){ showToast((data && data.errore) || ("Non riuscito: " + (error?.message || ""))); return; }
    await loadMagazzino();
  }
  magCalcola(); magRenderTutto();
  showToast("Merce caricata in magazzino ✅");
}


export { magCopiaOrdine, magCreaOrdine, magInviaOrdine, magRenderOrdini, magRiceviOrdine };
