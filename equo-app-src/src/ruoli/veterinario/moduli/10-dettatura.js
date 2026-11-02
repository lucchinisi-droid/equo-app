// Equo App · veterinario · DETTATURA della relazione (2/11/2026, passo 4 del piano di Simone)
// Il referto è come un esame vero: prima i DATI (campi compilati a mano nella scheda), poi la PARTE SCRITTA:
// «Relazione del veterinario» (cosa ha visto, cosa significa, conclusione) e «Terapia e indicazioni».
// La parte scritta si detta: Galeno la sistema (non aggiunge niente), il veterinario la corregge e la conferma.
// Si salva solo il testo confermato (dati.relazione, dati.indicazioni della visita); il dettato grezzo no.
// Il pannello è comune (comune/agenti/moduli/084-dettatura.js): lo usa anche il maniscalco con Hammer.

import { VS, vsCambia, vsSalvaSubito, vsNomeCavallo, vsApriDaEvento, vsRidisegna } from "./07-scheda-visita.js";
import { vrSezioni } from "./08-referto.js";

const vdEsc = s => escapeHtml(s == null ? "" : String(s));
const VD = { attesa: false };

/* ---- sezione nella scheda: «Relazione per il referto» ---- */
function vdSezioneHtml(){
  const v = VS.visita; if(!v) return "";
  // la parte scritta è il testo del referto: si può scrivere anche a visita conclusa (il referto si manda spesso dopo)
  const d = v.dati || {}, dis = "";
  return `<section class="vs-sez vd-sez" id="vd-box"><h3>Relazione per il referto</h3>
    <div class="vs-nota">La parte scritta del referto: cosa hai visto, cosa significa e cosa fare. Dettala: Galeno la sistema e tu la confermi.</div>
    ${`<button type="button" class="vd-detta" onclick="vdDetta()"><span class="c"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v5"/></svg></span><span><b>Detta</b><small>Galeno scrive relazione e terapia</small></span></button>`}
    <div class="vs-griglia">
      <div class="vs-campo pieno"><label for="vs-f-relazione">Relazione del veterinario</label><textarea id="vs-f-relazione" rows="4" placeholder="Si rileva…"${dis} oninput="vsCambia('relazione', this.value)">${vdEsc(d.relazione || "")}</textarea></div>
      <div class="vs-campo pieno"><label for="vs-f-indicazioni">Terapia e indicazioni</label><textarea id="vs-f-indicazioni" rows="3" placeholder="Farmaci, dosi, durata, cosa fare a casa, ricontrollo"${dis} oninput="vsCambia('indicazioni', this.value)">${vdEsc(d.indicazioni || "")}</textarea></div>
    </div></section>`;
}

/* ---- dati della scheda per Galeno (così non li ripete e li spiega) ---- */
function vdContesto(){
  const v = VS.visita || {};
  const righe = [`Visita: ${v.modello_nome || "Visita"} · cavallo ${vsNomeCavallo(VS.e) || "—"} · data ${v.data_visita || ""}`];
  try{ vrSezioni().forEach(s => s.r.forEach(([k, val]) => righe.push(`${s.n} · ${k}: ${val}`))); }catch(_){}
  const d = v.dati || {};
  ["diagnosi", "conclusioni", "terapia", "cosa_fare"].forEach(k => { if(d[k] && !righe.some(r => r.endsWith(": " + d[k]))) righe.push(k + ": " + d[k]); });
  if(d.relazione) righe.push("Relazione già scritta: " + d.relazione);
  if(d.indicazioni) righe.push("Terapia e indicazioni già scritte: " + d.indicazioni);
  return righe.join("\n");
}

/* ---- «Detta» ---- */
function vdDetta(){
  const v = VS.visita; if(!v) return;
  apriDettatura({
    tipo: "referto", agente: "Galeno",
    titolo: "Detta la relazione", sotto: (vsNomeCavallo(VS.e) || "Visita") + " · " + (v.modello_nome || ""),
    aiuto: "Racconta la visita come la spiegheresti al proprietario: cosa hai visto, cosa significa, cosa fare. I dati già nella scheda non serve ripeterli.",
    segnaposto: "Es. zoppia 2 su 5 all'anteriore sinistro, peggiora sul duro; pinza positiva in punta. Sospetto ascesso subsolare: apertura e impacco per tre giorni, riposo in box, ricontrollo tra una settimana.",
    contesto: vdContesto,
    proposte: (r) => {
      const d = VS.visita?.dati || {};
      return [
        { k: "relazione", titolo: "Relazione del veterinario", testo: r.relazione || "", modificabile: true, on: true, nota: d.relazione ? "Si aggiunge alla relazione che c'è già." : "" },
        { k: "indicazioni", titolo: "Terapia e indicazioni", testo: r.terapia || "", modificabile: true, on: true, nota: d.indicazioni ? "Si aggiunge a quella che c'è già." : "" }
      ];
    },
    conferma: async scelte => {
      const d = { ...(VS.visita.dati || {}) };
      scelte.forEach(x => { const t = String(x.testo).trim(); d[x.k] = d[x.k] ? String(d[x.k]).trim() + "\n\n" + t : t; });
      VS.visita.dati = d;
      await vsSalvaSubito(true);
      if(VS.schermo === "scheda") vsRidisegna();
      else if(VS.schermo === "referto" && typeof vrApri === "function") return vrApri();
      showToast("Inserito nella scheda: lo trovi nel referto");
      setTimeout(() => document.getElementById("vd-box")?.scrollIntoView({ block: "start", behavior: "smooth" }), 60);
    },
    demo: dettato => ({ relazione: dettato, terapia: "", da_controllare: "In prova Galeno non risponde: il dettato è riportato così com'è." })
  });
}

/* ---- «Detta» dalla Home: scegli la visita di oggi, si apre la sua scheda con la dettatura ---- */
function vdDaHome(){
  if(!dtDiOggi().length) return openAiSheet();
  dtScegliDiOggi({ titolo: "Detta", sotto: "Di quale visita di oggi?", onScelta: ({ e }) => { if(e) vdApriDaEvento(e.id); } });
}
async function vdApriDaEvento(id){
  await vsApriDaEvento(id);
  // visita già iniziata: si detta subito; altrimenti prima «Che visita fai?» e la dettatura parte appena c'è la scheda
  if(VS.schermo === "scheda") vdDetta();
  else if(VS.schermo === "scelta"){ VD.attesa = true; showToast("Scegli il tipo di visita: poi si apre la dettatura"); }
}
function vdDopoScheda(){
  if(!VD.attesa) return;
  VD.attesa = false;
  if(VS.visita) vdDetta();
}
function vdReset(){ VD.attesa = false; }

export { vdSezioneHtml, vdContesto, vdDetta, vdDaHome, vdApriDaEvento, vdDopoScheda, vdReset, VD };
