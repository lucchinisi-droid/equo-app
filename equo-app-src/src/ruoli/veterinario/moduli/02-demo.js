// Equo App · veterinario · dati della demo (29/10/2026)
// La demo del veterinario usa le stesse tabelle finte del maniscalco (demoState), riempite con visite veterinarie
// con le date di oggi: è la demo che vedono i veterinari e che usano i controlli automatici.

function vdIso(giorni){ const d = new Date(); d.setDate(d.getDate() + giorni); return isoLocale(d); }

function vdDati(){
  const cli = (id, nome, tipo, extra) => ({ id, nome, nome_cavallo: "", telefono: "", note: "", cliente_user_id: null, codice_invito: "EQUO-" + id.toUpperCase(),
    tipo_cliente: tipo, created_at: "2026-09-01", indirizzo: null, email: null, ...(extra || {}) });
  const cav = (id, cliente, nome, extra) => ({ id, cliente_mascalcia_id: cliente, nome, microchip: null, horse_id: null, created_at: "2026-09-01",
    razza: null, sesso: null, ubicazione_tipo: null, ubicazione_cliente_id: null, ...(extra || {}) });
  const vis = (id, cliente, cavallo, tipo, motivo, giorni, ora, extra) => ({ id, cliente_mascalcia_id: cliente, cavallo_cliente_id: cavallo, horse_id: null,
    tipo_ferratura: tipo, tipo_altro: motivo, misura_sistema: null, numero_ferro: null, quantita_ferri: null, data_intervento: vdIso(giorni), ora,
    stato: giorni < 0 ? "fatto" : "programmato", prossima_scadenza: null, importo: null, stato_pagamento: "da_saldare", note: "", ...(extra || {}) });
  const sc = { ubicazione_tipo: "scuderia" };
  return {
    clientiMascalcia: [
      cli("vc-sr", "Allevamento San Rocco", "struttura", { cliente_user_id: "demo-sr", indirizzo: "Via San Rocco 4" }),
      cli("vc-cl", "Centro Ippico Levante", "struttura", { cliente_user_id: "demo-cl", indirizzo: "Strada del Levante 12" }),
      cli("vc-po", "Scuderia Il Poggio", "struttura", { indirizzo: "Località Il Poggio" }),
      cli("vc-qu", "Maneggio Le Querce", "struttura", { indirizzo: "Via delle Querce 8" }),
      cli("vc-gv", "Giulia Verdi", "proprietario", { cliente_user_id: "demo-gv", nome_cavallo: "Aurora, Ombra" }),
      cli("vc-mb", "Marco Bianchi", "proprietario", { nome_cavallo: "Lampo" }),
      cli("vc-pn", "Paolo Neri", "proprietario", { cliente_user_id: "demo-pn", nome_cavallo: "Tango" }),
      cli("vc-sg", "Sara Gallo", "proprietario", { cliente_user_id: "demo-sg", nome_cavallo: "Luna" })
    ],
    cavalliClientiMascalcia: [
      cav("vv-ne", "vc-sr", "Nerone"), cav("vv-ve", "vc-sr", "Vento"),
      cav("vv-br", "vc-cl", "Brezza"), cav("vv-st", "vc-cl", "Stella"),
      cav("vv-au", "vc-gv", "Aurora", { ...sc, ubicazione_cliente_id: "vc-po" }),
      cav("vv-om", "vc-gv", "Ombra", { ...sc, ubicazione_cliente_id: "vc-po" }),
      cav("vv-la", "vc-mb", "Lampo"),
      cav("vv-ta", "vc-pn", "Tango", { ...sc, ubicazione_cliente_id: "vc-qu" }),
      cav("vv-lu", "vc-sg", "Luna")
    ],
    interventiMascalcia: [
      vis("vi-1", "vc-sr", "vv-ne", "urgenza", "colica lieve", 0, "08:30"),
      vis("vi-2", "vc-gv", "vv-au", "visita", "zoppia ASx", 0, "09:40"),
      vis("vi-3", "vc-gv", "vv-om", "visita", "ecografia tendine", 0, "10:20"),
      vis("vi-4", "vc-pn", "vv-ta", "mtc", "agopuntura 3ª seduta", 0, "11:30"),
      vis("vi-5", "vc-cl", "vv-br", "vaccino", "influenza e tetano", 0, "14:30"),
      vis("vi-6", "vc-sg", "vv-lu", "fisio", "controllo schiena", 1, "09:00"),
      vis("vi-7", "vc-sr", "vv-ve", "visita", "controllo puledro", 2, "10:00"),
      vis("vi-8", "vc-sr", "vv-ne", "visita", "controllo", -12, "09:00", { importo: 120, stato_pagamento: "da_saldare" }),
      vis("vi-9", "vc-gv", "vv-au", "visita", "zoppia ASx", -20, "15:00", { importo: 140, stato_pagamento: "da_saldare" }),
      vis("vi-10", "vc-pn", "vv-ta", "mtc", "agopuntura 2ª seduta", -7, "11:00", { importo: 80, stato_pagamento: "da_saldare" }),
      vis("vi-11", "vc-cl", "vv-st", "vaccino", "influenza", -30, "14:00", { importo: 60, stato_pagamento: "saldato", prossima_scadenza: vdIso(150) })
    ],
    messaggiMascalcia: [
      { id: "vm-1", cliente_mascalcia_id: "vc-pn", mittente_tipo: "cliente", testo: "Tango ha fatto lo stretching, grazie!", letto: false, created_at: vdIso(0) + "T09:12:00" },
      { id: "vm-2", cliente_mascalcia_id: "vc-sr", mittente_tipo: "cliente", testo: "Nerone si rotola, può venire prima?", letto: false, created_at: vdIso(0) + "T07:02:00" },
      { id: "vm-3", cliente_mascalcia_id: "vc-gv", mittente_tipo: "maniscalco", testo: "Ti ho mandato il referto di Aurora", letto: true, created_at: vdIso(-1) + "T18:20:00" },
      { id: "vm-4", cliente_mascalcia_id: "vc-sg", mittente_tipo: "cliente", testo: "Perfetto, ci vediamo alle 14:30", letto: true, created_at: vdIso(-3) + "T12:00:00" },
      { id: "vm-5", cliente_mascalcia_id: "vc-mb", mittente_tipo: "cliente", testo: "Grazie dottoressa, a presto", letto: true, created_at: vdIso(-4) + "T19:00:00" }
    ]
  };
}

let vdFatto = false;
async function vdPrepara(){
  if(vdFatto || typeof DEMO_MODE === "undefined" || !DEMO_MODE || typeof eVeterinario !== "function" || !eVeterinario()) return;
  vdFatto = true;
  Object.assign(demoState, vdDati());
  try{
    if(typeof loadClientiMascalcia === "function") await loadClientiMascalcia();
    if(typeof caricaUbicazioni === "function") await caricaUbicazioni(true);
    if(typeof renderProDeadlines === "function") await renderProDeadlines();
    if(typeof renderIncassi === "function") await renderIncassi();
  }catch(e){ console.warn("demo veterinario:", e); }
  if(typeof renderHomeVet === "function") renderHomeVet();
}
quandoApriPagina(function(){ vdPrepara(); });
quandoAggiornaBarra(function(){ vdPrepara(); });

export { vdPrepara };
