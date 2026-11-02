// Equo App · maniscalco · modulo (moduli ES, costruiti con Vite in ruoli/maniscalco/costruito.js)
import { DETTAGLI_CORRETTIVO, LAVORO_CAV, apriSchedaFerratura, ferRender, ferStatoAttuale } from "./035-ferratura-del-cavallo-scheda-libretto-fe.js";
import { MISURA_SISTEMA_LABEL, MISURE_FERRO, isoLocale, misuraNorm } from "./051-modal-appuntamento-maniscalco-nuovo-modi.js";
import { clienteCollegatoEquo } from "./052-ferro-standard-nella-scheda-del-cavallo.js";
import { cavalliCartella } from "./033-clienti-a-cartelle-stile-telegram-cavall.js";
/* ---------- DETTA A HAMMER (2/11/2026, decisione di Simone) ----------
   Dalla scheda ferratura del cavallo («Detta a Hammer») o dal «+» («Detta»: scegli il cavallo di oggi o cercalo).
   Il maniscalco detta a fine lavoro; Hammer sistema il testo (non aggiunge niente) e propone, da confermare una per una:
     · nota del lavoro → nell'appuntamento di oggi del cavallo (resta nello storico);
     · cambi della scheda ferratura (lavoro, tipo di ferro, correttivo, misura, intervallo, note, avviso) → si applicano alla
       scheda aperta e il maniscalco li salva con «Salva» come sempre;
     · messaggio per il proprietario → in chat, solo se il cliente usa Equo e il maniscalco lascia la spunta.
   Il pannello è quello comune (comune/agenti/moduli/084-dettatura.js). Il problema su un piede resta nel foglio di
   «Segna un problema» (Modalità Lavoro): Hammer lo scrive nella nota del lavoro. */
const FD = { intervento: null };

const fdNomeLavoro = k => LAVORO_CAV[k] ? LAVORO_CAV[k].t + " (" + LAVORO_CAV[k].s + ")" : "";
// scheda attuale, per Hammer
function fdContesto(){
  const f = ferStatoAttuale(); if(!f) return "";
  const misura = f.idx >= 0 ? "n. " + MISURE_FERRO[f.s][f.idx] + " " + (MISURA_SISTEMA_LABEL[f.s] || "") : "non impostata";
  const tipo = (t, det) => (t === "correttivo" ? "correttivo" + (det && det.length ? " (" + det.join(", ") + ")" : "") : "standard");
  return [
    "Cavallo: " + (f.cv?.nome || "—"),
    "Lavoro: " + fdNomeLavoro(f.lavoro),
    f.lavoro !== "pareggio" ? "Misura del ferro: " + misura + " (sistema " + f.s + ")" : "",
    f.lavoro !== "pareggio" ? "Tipo di ferro" + (f.ftp ? " davanti" : "") + ": " + tipo(f.ft, f.det) : "",
    f.lavoro !== "pareggio" && f.ftp ? "Tipo di ferro dietro: " + tipo(f.ftp, f.detp) : "",
    "Intervallo: " + (f.int ? f.int + " giorni" : "non impostato (" + (f.intEff?.giorni || "—") + " giorni di base)"),
    "Note della scheda: " + (document.getElementById("fer-note")?.value || "—"),
    "Avviso di sicurezza: " + (document.getElementById("fer-avviso")?.value || "—"),
    FD.intervento ? "Appuntamento di oggi: " + (FD.intervento.tipo_altro || FD.intervento.tipo_ferratura || "") + (FD.intervento.note ? " · nota già scritta: " + FD.intervento.note : "") : "Oggi non c'è un appuntamento per questo cavallo."
  ].filter(Boolean).join("\n");
}

// cambi della scheda in parole: «Ferrato · correttivo (Pad) · misura 2 · ogni 35 giorni»
function fdDescriviScheda(s){
  const p = [];
  if(s.lavoro) p.push(LAVORO_CAV[s.lavoro]?.t || s.lavoro);
  if(s.ferro_tipo) p.push((s.ferro_tipo_post ? "davanti " : "") + s.ferro_tipo + (s.dettagli?.length ? " (" + s.dettagli.join(", ") + ")" : ""));
  else if(s.dettagli?.length) p.push("correttivo (" + s.dettagli.join(", ") + ")");
  if(s.ferro_tipo_post) p.push("dietro " + s.ferro_tipo_post + (s.dettagli_post?.length ? " (" + s.dettagli_post.join(", ") + ")" : ""));
  if(s.misura) p.push("misura " + s.misura);
  if(s.intervallo_giorni) p.push("ogni " + s.intervallo_giorni + " giorni");
  if(s.note) p.push("note: " + s.note);
  if(s.avviso_sicurezza) p.push("avviso: " + s.avviso_sicurezza);
  return p.join(" · ");
}

// appuntamento di oggi del cavallo (quello scelto dal «+» o il primo di oggi nello storico)
async function fdInterventoDiOggi(cv, evId){
  const oggi = isoLocale(new Date());
  if(evId){ const e = (hpAppuntamenti || []).find(x => x.id === evId) || (typeof agEventiCache !== "undefined" ? agEventiCache[evId] : null); if(e) return e; }
  try{ return (await DB.listInterventiCavallo(cv)).find(i => i.data_intervento === oggi && !["annullato", "rifiutato"].includes(i.stato)) || null; }
  catch(_){ return null; }
}

/* ---- «Detta a Hammer» nella scheda ferratura aperta ---- */
async function ferDetta(evId){
  const f = ferStatoAttuale(); if(!f) return;
  FD.intervento = await fdInterventoDiOggi(f.cv, evId);
  const clienteId = FD.intervento?.cliente_mascalcia_id || f.cv?.cliente_mascalcia_id || f.clienteId;
  const cliente = typeof clienteDiId === "function" ? clienteDiId(clienteId) : null;
  const collegato = clienteId && clienteCollegatoEquo(clienteId);
  apriDettatura({
    tipo: "ferratura", agente: "Hammer",
    titolo: "Detta a Hammer", sotto: (f.cv?.nome || "Cavallo") + " · " + fdNomeLavoro(f.lavoro),
    aiuto: "Racconta il lavoro di oggi: cosa hai fatto, cosa hai visto, cosa cambia nella ferratura e cosa deve fare il proprietario.",
    segnaposto: "Es. ferrato completo, misura 2; anteriore sinistro tallone basso, messo il pad; da ora ogni cinque settimane. Il proprietario tenga il box asciutto.",
    contesto: fdContesto,
    tastoConferma: "Conferma",
    proposte: r => {
      const s = r.scheda || {}, desc = fdDescriviScheda(s);
      return [
        desc ? { k: "scheda", titolo: "Cambi della scheda ferratura", testo: desc, on: true, nota: "Si applicano alla scheda aperta: poi tocca «Salva»." } : null,
        r.nota_lavoro ? { k: "nota", titolo: "Nota del lavoro", testo: r.nota_lavoro, modificabile: true, on: !!FD.intervento, disabilitata: !FD.intervento,
          nota: FD.intervento ? "Va nell'appuntamento di oggi e resta nello storico del cavallo." : "Oggi non c'è un appuntamento per questo cavallo: segna prima il lavoro, poi detta di nuovo." } : null,
        r.per_proprietario ? { k: "msg", titolo: "Messaggio a " + (cliente?.nome || "il proprietario"), testo: r.per_proprietario, modificabile: true, on: false, disabilitata: !collegato,
          nota: collegato ? "Arriva in chat solo se metti la spunta." : "Il proprietario non usa Equo: copia il testo se vuoi mandarglielo." } : null
      ].filter(Boolean);
    },
    conferma: async (scelte, r) => {
      const fatto = [];
      for(const x of scelte){
        if(x.k === "scheda" && fdApplicaScheda(r.scheda || {})) fatto.push("scheda da salvare");
        if(x.k === "nota" && FD.intervento){
          const i = FD.intervento, note = (i.note ? String(i.note).trim() + "\n" : "") + String(x.testo).trim();
          const { error } = await DB.updateInterventoMascalcia(i.id, { note });
          if(error) throw new Error("nota del lavoro non salvata");
          i.note = note; [hpAppuntamenti || [], typeof agEventiCache !== "undefined" ? Object.values(agEventiCache || {}) : []].forEach(l => l.forEach(e => { if(e.id === i.id) e.note = note; }));
          fatto.push("nota del lavoro");
        }
        if(x.k === "msg" && collegato){
          const { error } = await DB.insertMessaggioMascalcia({ cliente_mascalcia_id: clienteId, tipo: "testo", testo: String(x.testo).trim() });
          if(error) throw new Error("messaggio non inviato");
          fatto.push("messaggio in chat");
        }
      }
      showToast(fatto.includes("scheda da salvare") ? "Scheda aggiornata: controlla e tocca «Salva»" : fatto.length ? "Fatto: " + fatto.join(", ") : "Niente da inserire");
    },
    demo: dettato => ({ nota_lavoro: dettato, scheda: {}, per_proprietario: "", da_controllare: "In prova Hammer non risponde: il dettato è riportato così com'è." })
  });
}

// applica i cambi alla scheda aperta (si salvano con «Salva», come un cambio a mano)
function fdApplicaScheda(s){
  const f = ferStatoAttuale(); if(!f) return false;
  if(s.lavoro && LAVORO_CAV[s.lavoro]) f.lavoro = s.lavoro;
  if(s.ferro_tipo) f.ft = s.ferro_tipo;
  if(s.ferro_tipo_post) f.ftp = s.ferro_tipo_post;
  if(s.dettagli?.length){ if(!s.ferro_tipo) f.ft = "correttivo"; f.det = DETTAGLI_CORRETTIVO.filter(d => s.dettagli.includes(d)); }
  if(s.dettagli_post?.length){ if(!s.ferro_tipo_post) f.ftp = "correttivo"; f.detp = DETTAGLI_CORRETTIVO.filter(d => s.dettagli_post.includes(d)); }
  if(s.misura){
    const n = misuraNorm(s.misura), idx = (MISURE_FERRO[f.s] || []).indexOf(n);
    if(idx >= 0) f.idx = idx; else showToast("Misura «" + s.misura + "» non trovata nella " + (MISURA_SISTEMA_LABEL[f.s] || "misura scelta") + ": impostala a mano");
  }
  if(s.intervallo_giorni) f.int = Math.max(7, Math.min(180, Number(s.intervallo_giorni)));
  const note = document.getElementById("fer-note");
  if(s.note && note) note.value = (note.value.trim() ? note.value.trim() + " · " : "") + s.note;
  if(note) note.value = note.value.slice(0, 160);
  const avv = document.getElementById("fer-avviso");
  if(s.avviso_sicurezza && avv) avv.value = s.avviso_sicurezza.slice(0, 160);
  ferRender();
  return true;
}

/* ---- «Detta» dal «+»: scegli il cavallo di oggi (o cercalo), si apre la sua scheda ferratura con la dettatura ---- */
function ferDettaDaMenu(){
  dtScegliDiOggi({ titolo: "Detta a Hammer", sotto: "Di quale cavallo?", cerca: true, vuoto: "Oggi non hai appuntamenti con cavalli: cerca il cavallo qui sopra.",
    onScelta: ({ e, cv }) => ferDettaApri(e || null, cv || null) });
}
function ferDettaApri(e, cv){
  if(e && !cv) cv = cavalliCartella().find(x => (e.cavallo_cliente_id && x.id === e.cavallo_cliente_id) || (e.horse_id && x.horse_id === e.horse_id)) || null;
  if(!cv) return showToast("Cavallo non trovato nelle tue cartelle");
  apriSchedaFerratura(cv, cv.cliente_mascalcia_id || e?.cliente_mascalcia_id || null, null);
  ferDetta(e ? e.id : null);
}

// voce «Detta» nel «+» (maniscalco e veterinario), in «Crea subito» / «Vai a».
// Questo modulo si carica prima del sistema delle estensioni (core): si aggancia quando la pagina è pronta.
function fdRegistraPiu(){
  try{ estendiDopo("plCostruisciMenu", fdVoceDetta); }catch(err){ console.error("detta nel +:", err); }
}
function fdVoceDetta(){
    const m = document.getElementById("hm-menu-piu"); if(!m || typeof plRuolo !== "function") return;
    const r = plRuolo(); if(r !== "man" && r !== "vet") return;
    const griglia = m.querySelector(".pl-tg"); if(!griglia || griglia.querySelector(".pl-detta")) return;
    const ic = '<svg class="hm-svg" viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 17v5"/></svg>';
    const html = plTile(ic, "Detta", r === "man" ? "ferDettaDaMenu()" : "vhDetta()", r === "man" ? 1 : 0, "pl-detta");
    // maniscalco: in fondo a «Crea subito»; veterinario: subito dopo «Nuovo appuntamento»
    if(r === "vet" && griglia.firstElementChild) griglia.firstElementChild.insertAdjacentHTML("afterend", html); else griglia.insertAdjacentHTML("beforeend", html);
}
if(document.readyState === "loading") document.addEventListener("DOMContentLoaded", fdRegistraPiu, { once: true }); else fdRegistraPiu();

export { ferDetta, ferDettaDaMenu, ferDettaApri, fdApplicaScheda, fdContesto, fdDescriviScheda, FD };
