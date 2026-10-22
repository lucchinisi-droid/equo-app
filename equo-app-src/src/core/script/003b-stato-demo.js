/* ---------- STATO DELLA DEMO (dati finti in memoria per la modalita demo) ---------- */
let demoIdCounter = 1;
const demoState = {
  horses: [
    { id: "demo-1", name: "Aurora", breed: "Maremmano", birth_date: "2018-04-12", stable_id: null, tipo_proprieta: "proprieta", mantello: "Baio", microchip: "", gruppo_sanguigno: "", note: "" },
  ],
  events: {
    "demo-1": [
      { id: "de-1", type: "vaccino", date: "2026-06-01", next_due_date: "2026-12-01", notes: "Dr. Bianchi" },
      { id: "de-2", type: "ferratura", date: "2026-08-10", next_due_date: "2026-09-25", notes: "" },
    ],
  },
  expenses: [
    { id: "dx-1", horse_id: "demo-1", horse_name: "Aurora", category: "pensione", amount: 220, date: "2026-09-01", notes: "" },
    { id: "dx-2", horse_id: "demo-1", horse_name: "Aurora", category: "maniscalco", amount: 60, date: "2026-08-10", notes: "" },
  ],
  stables: [{ id: "demo-stable-1", name: "Scuderia Le Querce", join_code: "EQUO-DEMO" }],
  lezioniManuali: [
    { id: "dl-1", horse_id: "demo-1", data: "2026-09-24", tipo: "lezione", note: "Con l'istruttore Luca", created_at: "2026-09-16" },
  ],
  altriProprietari: [
    { id: "demo-owner-2", full_name: "Giulia Verdi", avatar_url: null, codice_proprietario: "EQUO-OWN-DEMO" },
  ],
  conversazioniProprietari: [
    { id: "co-1", proprietario_a_id: "demo-user", proprietario_b_id: "demo-owner-2", created_at: "2026-09-10T10:00:00" },
  ],
  messaggiProprietari: [
    { id: "mo-1", conversazione_id: "co-1", mittente_id: "demo-owner-2", tipo: "testo", testo: "Ciao! Portiamo i cavalli al maneggio sabato?", media_url: null, letto: false, created_at: "2026-09-17T09:00:00" },
    { id: "mo-2", conversazione_id: "co-1", mittente_id: "demo-user", tipo: "testo", testo: "Perfetto, ci sono!", media_url: null, letto: true, created_at: "2026-09-16T18:20:00" },
  ],
  services: [
    { id: "ds-1", tipo: "veterinario", nome: "Clinica Veterinaria Equina Demo", indirizzo: "Via delle Scuderie 1", telefono: "0212345678", lat: 45.4642, lng: 9.19, note: "H24", fonte: "curato" },
  ],
  paymentMethods: [],
  clientiMascalcia: [
    { id: "dc-1", nome: "Marco Bianchi", nome_cavallo: "Aurora", telefono: "333 1112222", note: "", cliente_user_id: null, codice_invito: "EQUO-DC1AB", tipo_cliente: "proprietario", created_at: "2026-08-01" },
    { id: "dc-s1", nome: "Scuderia Le Querce", nome_cavallo: "", telefono: "06 1234567", note: "", cliente_user_id: null, codice_invito: "EQUO-DC2QR", tipo_cliente: "struttura", created_at: "2026-08-05" },
  ],
  cavalliClientiMascalcia: [
    { id: "dcv-1", cliente_mascalcia_id: "dc-1", nome: "Aurora", microchip: null, horse_id: null, created_at: "2026-08-01" },
  ],
  interventiMascalcia: [
    { id: "di-1", cliente_mascalcia_id: "dc-1", cavallo_cliente_id: "dcv-1", horse_id: null, tipo_ferratura: "ferratura", tipo_altro: null, misura_sistema: "italiana", numero_ferro: "4", quantita_ferri: 4, data_intervento: "2026-08-10", ora: "09:00", stato: "fatto", prossima_scadenza: "2026-09-14", importo: 90, stato_pagamento: "saldato", note: "", created_at: "2026-08-10" },
    { id: "di-2", cliente_mascalcia_id: "dc-1", cavallo_cliente_id: "dcv-1", horse_id: null, tipo_ferratura: "pareggio", tipo_altro: null, misura_sistema: null, numero_ferro: null, quantita_ferri: null, data_intervento: "2026-09-05", ora: "10:30", stato: "fatto", prossima_scadenza: "2026-10-31", importo: 60, stato_pagamento: "saldato", note: "", created_at: "2026-09-05" },
    { id: "di-3", cliente_mascalcia_id: "dc-1", cavallo_cliente_id: "dcv-1", horse_id: null, tipo_ferratura: "ferratura", tipo_altro: null, misura_sistema: "italiana", numero_ferro: "4", quantita_ferri: 4, data_intervento: "2026-09-16", ora: "15:00", stato: "fatto", prossima_scadenza: "2026-10-21", importo: 95, stato_pagamento: "da_saldare", note: "", created_at: "2026-09-16" },
  ],
  messaggiMascalcia: [
    { id: "dm-1", cliente_mascalcia_id: "dc-1", mittente_tipo: "cliente", testo: "Ciao! Quando puoi passare per Aurora?", letto: false, created_at: "2026-09-15T09:00:00" },
    { id: "dm-2", cliente_mascalcia_id: "dc-1", mittente_tipo: "maniscalco", testo: "Ciao Marco, ti confermo per venerdì mattina.", letto: true, created_at: "2026-09-14T18:20:00" },
  ],
};
