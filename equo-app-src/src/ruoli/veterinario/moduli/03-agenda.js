// Equo App · veterinario · Agenda (29/10/2026, mockup Agenda 1 · Settimana)
// L'agenda è quella del maniscalco (053/055/110: settimana, visite per posto, ordine del giro, «Fatto», 4 schede).
// Per il veterinario: settimana su una riga, sempre le 4 schede, al posto del numero del gruppo un'etichetta.

// etichetta del gruppo di un posto: Urgente · MTC · Fisio · paga la scuderia · N cavalli
function vetEtichettaGruppo(ev, luogo){
  const tipi = new Set((ev || []).map(e => e.tipo_ferratura));
  const nCav = new Set((ev || []).map(e => e.cavallo_cliente_id || e.horse_id || e.id)).size;
  if(tipi.has("urgenza")) return { cls: "vt-urg", html: '<span class="vt-b urg">Urgente</span>' };
  const mf = [tipi.has("mtc") ? "MTC" : "", tipi.has("fisio") ? "Fisio" : ""].filter(Boolean);
  if(mf.length) return { cls: "", html: `<span class="vt-b tif">${mf.join(" · ")}</span>` };
  // paga la scuderia: la visita è della struttura (cliente «struttura») e non del proprietario del cavallo
  const pagaStruttura = (ev || []).length && ev.every(e => { const c = typeof clienteDiId === "function" ? clienteDiId(e.cliente_mascalcia_id) : null; return c && c.tipo_cliente === "struttura"; });
  if(pagaStruttura && luogo && luogo.scuderia) return { cls: "", html: '<span class="vt-b testo">paga la scuderia</span>' };
  return { cls: "", html: `<span class="vt-b testo">${nCav} ${nCav === 1 ? "cavallo" : "cavalli"}</span>` };
}

// nome della scheda come nel mockup: «Da fissare»
function vetTestiAgenda(){
  if(typeof eVeterinario !== "function" || !eVeterinario()) return;
  const s = document.querySelector('#ag-schede [data-s="prog"] span');
  if(s && s.textContent !== "Da fissare") s.textContent = "Da fissare";
  const t = document.getElementById("pro-agenda-title");
  if(t && t.textContent !== "Agenda") t.textContent = "Agenda";
}
quandoApriPagina(function(p){ if(p === "pro-agenda") vetTestiAgenda(); });

export { vetEtichettaGruppo, vetTestiAgenda };
