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
        { k: "indicazioni", titolo: "Terapia e indicazioni", testo: r.terapia || "", modificabile: true, on: true, nota: d.indicazioni ? "Si aggiunge a quella che c'è già." : "" },
        // voci del piano terapeutico (11): si aggiungono al piano, poi orari e giorni si controllano lì
        (r.piano || []).length && typeof ptAggiungiVoci === "function" ? { k: "piano", titolo: "Piano terapeutico · " + r.piano.length + (r.piano.length === 1 ? " voce" : " voci"),
          testo: r.piano.map(v => "• " + v.nome + (v.dose ? " " + v.dose : "") + (v.via ? " · " + v.via.toLowerCase() : "") + (v.volte_giorno ? " · " + v.volte_giorno + (v.volte_giorno === 1 ? " volta" : " volte") + " al giorno" : " · orari da scegliere") + (v.giorni ? " · " + v.giorni + " giorni" : " · giorni da scegliere")).join("\n"),
          on: true, nota: "Si aggiungono al piano della visita: poi controlla orari, giorni e tempo di attesa." } : null
      ].filter(Boolean);
    },
    conferma: async (scelte, r) => {
      const d = { ...(VS.visita.dati || {}) };
      scelte.filter(x => x.k !== "piano").forEach(x => { const t = String(x.testo).trim(); d[x.k] = d[x.k] ? String(d[x.k]).trim() + "\n\n" + t : t; });
      VS.visita.dati = d;
      await vsSalvaSubito(true);
      if(scelte.some(x => x.k === "piano")) await ptAggiungiVoci(r.piano || []);
      if(VS.schermo === "scheda") vsRidisegna();
      else if(VS.schermo === "referto" && typeof vrApri === "function") return vrApri();
      showToast("Inserito nella scheda: lo trovi nel referto");
      setTimeout(() => document.getElementById("vd-box")?.scrollIntoView({ block: "start", behavior: "smooth" }), 60);
    },
    demo: dettato => ({ relazione: dettato, terapia: "", piano: [], da_controllare: "In prova Galeno non risponde: il dettato è riportato così com'è." })
  });
}

/* ---- «Detta» dalla Home e dal «+» (2/11/2026): visite di oggi e degli ultimi 7 giorni, si apre la scheda con la dettatura.
   Senza visite: una riga spiega che serve una visita e c'è «Nuovo appuntamento» (non si apre più Galeno). ---- */
async function vdVisiteRecenti(){
  const oggi = isoLocale(new Date()), d = new Date(); d.setDate(d.getDate() - 7); const da = isoLocale(d);
  const buona = e => e && e.data_intervento >= da && e.data_intervento <= oggi && !["annullato", "rifiutato"].includes(e.stato) && (e.cavallo_cliente_id || e.horse_id);
  let l = [];
  if(DEMO_MODE) l = (demoState.interventiMascalcia || []).filter(buona);
  else {
    const { data, error } = await sb.from("interventi_mascalcia").select("*, clienti_mascalcia(nome), cavalli_clienti_mascalcia(nome)")
      .eq("maniscalco_id", currentUser.id).gte("data_intervento", da).lte("data_intervento", oggi).not("stato", "in", "(annullato,rifiutato)")
      .order("data_intervento", { ascending: false }).order("ora", { ascending: true }).limit(60);
    if(error) console.warn("visite recenti:", error.message);
    l = (data || []).filter(buona);
  }
  // anche quelle già in memoria (agenda, Home) che la lettura non avesse ancora
  (hpAppuntamenti || []).filter(buona).forEach(e => { if(!l.some(x => x.id === e.id)) l.push(e); });
  return l.sort((a, b) => b.data_intervento.localeCompare(a.data_intervento) || String(a.ora || "99").localeCompare(String(b.ora || "99")));
}
async function vdDaHome(){
  const eventi = await vdVisiteRecenti();
  dtScegliDiOggi({ titolo: "Detta", sotto: "Di quale visita?", eventi,
    vuoto: "Per dettare serve una visita: non ne hai oggi né negli ultimi 7 giorni. Crea l'appuntamento, poi apri la sua scheda e tocca «Detta».",
    azioneVuoto: { testo: "Nuovo appuntamento", az: "openInterventoModal(null)" },
    onScelta: ({ e }) => { if(e) vdApriDaEvento(e.id, e); } });
}
async function vdApriDaEvento(id, evento){
  await vsApriDaEvento(id, evento);
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

export { vdVisiteRecenti, vdSezioneHtml, vdContesto, vdDetta, vdDaHome, vdApriDaEvento, vdDopoScheda, vdReset, VD };
