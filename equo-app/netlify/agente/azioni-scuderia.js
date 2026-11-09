// Equo · agenti AI · AZIONI DI ATHENA in Equo Scuderia (9/11/2026)
// Athena PROPONE e l'app mostra una scheda: l'azione parte solo con «Conferma» dell'utente, con i suoi permessi (RLS e funzioni del database).
// Qui si leggono i dati (client dell'utente) per riconoscere persone, cavalli e lezioni, e si prepara la scheda (ctx.azioni).
// 1 lezioni · 2 incassi · 3 eventi sanitari/scadenze · 4 messaggi ai clienti · 5 nuovo cliente · 6 appuntamenti con il maniscalco.

const norma = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const isoOk = (d) => /^\d{4}-\d{2}-\d{2}$/.test(String(d || "")) && !isNaN(new Date(d + "T12:00:00").getTime());
const oraOk = (o) => /^([01]\d|2[0-3]):[0-5]\d$/.test(String(o || ""));
const oggiRoma = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Rome" });
const piuGiorni = (iso, n) => { const d = new Date(iso + "T12:00:00"); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
const dataIt = (iso) => iso ? new Date(iso + "T12:00:00").toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" }) : "";
const euro = (n) => "€ " + Number(n || 0).toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const METODI = { contanti: "Contanti", bonifico: "Bonifico", pos: "POS / carta", assegno: "Assegno", altro: "Altro" };
const TIPI_EVENTO_SC = { vaccino: "Vaccino", coggins: "Coggins", ferratura: "Ferratura", sverminazione: "Sverminazione", altro: "Altro" };
const TIPI_MAN = { ferratura: "Ferratura", mezza_ferratura: "Mezza ferratura", pareggio: "Pareggio", altro: "Altro" };
const MAX_SCHEDE = 10;

// trova una sola voce per nome: esatto, poi «contiene»; se sono più d'una restituisce l'elenco per chiedere
function trovaNome(lista, nome, campo) {
  const n = norma(nome);
  if (!n) return { errore: "nome mancante" };
  let ok = lista.filter((x) => norma(x[campo]) === n);
  if (!ok.length) ok = lista.filter((x) => norma(x[campo]).includes(n) || n.split(" ").every((p) => norma(x[campo]).split(" ").includes(p)));
  if (ok.length === 1) return { voce: ok[0] };
  if (ok.length > 1) return { errore: "ambiguo", elenco: ok.slice(0, 8).map((x) => x[campo]) };
  return { errore: "non_trovato" };
}
const msgNome = (r, cosa, nome) => r.errore === "ambiguo"
  ? `Ci sono più ${cosa} che corrispondono a «${nome}»: ${r.elenco.join(", ")}. Chiedi all'utente quale.`
  : `Nessun ${cosa} «${nome}» nel centro. Chiedi all'utente di controllare il nome.`;

async function membri(ctx) {
  if (ctx._membri) return ctx._membri;
  const { data } = await ctx.db.from("scuderia_membri").select("id, user_id, ruolo, nome_visualizzato, provvisorio").eq("centro_id", ctx.centroId);
  ctx._membri = (data || []).map((m) => ({ ...m, nome: m.nome_visualizzato || "" }));
  return ctx._membri;
}
async function cavalli(ctx) {
  if (ctx._cav) return ctx._cav;
  const { data } = await ctx.db.from("scuderia_cavalli").select("id, nome, proprietario, horse_id").eq("centro_id", ctx.centroId).is("uscito_il", null);
  ctx._cav = data || [];
  return ctx._cav;
}
const clienti = async (ctx) => (await membri(ctx)).filter((m) => ["allievo", "proprietario"].includes(m.ruolo));
const staff = async (ctx) => (await membri(ctx)).filter((m) => !["allievo", "proprietario"].includes(m.ruolo));
const troppe = (ctx) => ctx.azioni.length >= MAX_SCHEDE ? `Hai già preparato ${MAX_SCHEDE} schede in questa risposta: fermati qui e di' all'utente che può chiederne altre dopo averle confermate.` : null;

// ---------------------------------------------------------------- strumenti (per strumenti.js)
const STRUMENTI_ATHENA_AZIONI = [
  { name: "sc_lezioni", description: "Lezioni del centro in un periodo (id, data, ora, stato, allievo, cavallo, istruttore). Serve per trovare la lezione da spostare, annullare o segnare fatta. Sola lettura.",
    input_schema: { type: "object", properties: { da: { type: "string", description: "YYYY-MM-DD (default oggi)" }, a: { type: "string", description: "YYYY-MM-DD (default oggi + 7 giorni)" }, cerca: { type: "string", description: "Nome dell'allievo o del cavallo, facoltativo." } } } },
  { name: "sc_proponi_lezione", description: "Prepara una scheda da confermare per: nuova lezione, spostare una lezione, annullarla o segnarla come fatta (presente). Per spostare/annullare/fatta usa l'id da sc_lezioni.",
    input_schema: { type: "object", properties: {
      azione: { type: "string", enum: ["nuova", "sposta", "annulla", "fatta"] },
      lezione_id: { type: "string", description: "Id della lezione (per sposta, annulla, fatta)." },
      allievo: { type: "string", description: "Nome dell'allievo (cliente del centro), per una nuova lezione." },
      cavallo: { type: "string", description: "Nome del cavallo, facoltativo." }, istruttore: { type: "string", description: "Nome dell'istruttore, facoltativo." },
      data: { type: "string", description: "YYYY-MM-DD (nuova lezione o nuova data se sposta)." }, ora: { type: "string", description: "HH:MM (nuova lezione o nuovo orario se sposta)." },
      note: { type: "string" } }, required: ["azione"] } },
  { name: "sc_proponi_incasso", description: "Prepara la scheda per registrare un pagamento ricevuto da un cliente (si scala dalle voci più vecchie da pagare). L'utente conferma.",
    input_schema: { type: "object", properties: {
      cliente: { type: "string", description: "Nome del cliente." }, importo: { type: "number", description: "Euro." },
      metodo: { type: "string", enum: Object.keys(METODI) }, data: { type: "string", description: "YYYY-MM-DD (default oggi)." },
      cassa: { type: "string", enum: ["scuderia", "asd"], description: "Default scuderia; asd solo se l'utente parla di quota/tesseramento ASD." },
      note: { type: "string", description: "Facoltativa, es. «pensione di novembre»." } }, required: ["cliente", "importo", "metodo"] } },
  { name: "sc_proponi_evento", description: "Prepara la scheda per registrare un evento sanitario fatto su un cavallo del centro (vaccino, Coggins, ferratura, sverminazione, altro) con la prossima scadenza. Se l'utente non dice la scadenza proponi quella tipica e scrivila (Coggins 1 anno, sverminazione 3 mesi, ferratura 6 settimane; vaccino: chiedi o proponi 6 mesi).",
    input_schema: { type: "object", properties: {
      cavallo: { type: "string" }, tipo: { type: "string", enum: Object.keys(TIPI_EVENTO_SC) }, tipo_altro: { type: "string", description: "Se tipo = altro." },
      data: { type: "string", description: "YYYY-MM-DD in cui è stato fatto (default oggi)." }, scadenza: { type: "string", description: "YYYY-MM-DD della prossima scadenza." },
      note: { type: "string" } }, required: ["cavallo", "tipo"] } },
  { name: "sc_proponi_messaggio", description: "Prepara un messaggio da mandare nella chat di Equo a UN cliente del centro (solo clienti che usano l'app). Una chiamata per cliente, al massimo 10. Testo breve, cortese, in prima persona plurale («ti ricordiamo…»).",
    input_schema: { type: "object", properties: { cliente: { type: "string" }, testo: { type: "string", description: "Max 600 caratteri." } }, required: ["cliente", "testo"] } },
  { name: "sc_proponi_cliente", description: "Prepara la scheda per creare un nuovo cliente del centro (allievo o genitore, oppure proprietario di un cavallo).",
    input_schema: { type: "object", properties: {
      nome: { type: "string", description: "Nome e cognome." }, ruolo: { type: "string", enum: ["allievo", "proprietario"] },
      telefono: { type: "string" }, email: { type: "string" }, data_nascita: { type: "string", description: "YYYY-MM-DD, facoltativa." }, note: { type: "string" } }, required: ["nome", "ruolo"] } },
  { name: "sc_maniscalchi", description: "Maniscalchi collegati al centro (nome, se il collegamento è attivo, quali cavalli seguono). Sola lettura.", input_schema: { type: "object", properties: {} } },
  { name: "sc_proponi_appuntamento_maniscalco", description: "Prepara la richiesta di appuntamento a un maniscalco collegato per uno o più cavalli del centro. Il maniscalco riceve la richiesta e la conferma o propone un'altra data.",
    input_schema: { type: "object", properties: {
      maniscalco: { type: "string", description: "Nome del maniscalco (da sc_maniscalchi)." }, cavalli: { type: "array", items: { type: "string" }, description: "Nomi dei cavalli." },
      tipo: { type: "string", enum: Object.keys(TIPI_MAN) }, tipo_altro: { type: "string" },
      data: { type: "string", description: "YYYY-MM-DD da oggi in poi." }, ora: { type: "string", description: "HH:MM facoltativa." }, note: { type: "string" } }, required: ["maniscalco", "tipo", "data"] } },
];


// ---------------------------------------------------------------- 7-13 (9/11/2026 sera)
const ICONE_BOX = { pasto_mattina: "Pasto mattina", pasto_sera: "Pasto sera", fieno: "Fieno", acqua: "Acqua", paddock: "Uscito al paddock", lavorato: "Lavorato", farmaco: "Farmaco", box_pulito: "Box pulito", integratore: "Integratore", coperta: "Coperta", zoccoli: "Zoccoli", grooming: "Grooming" };
const MOTIVI_BOX = { pulizia: "Pulizia", disinfezione: "Disinfezione", riparazione: "Riparazione", altro: "Altro" };
const TIPI_PAC = { carnet: "Carnet", abbonamento: "Abbonamento", pensione: "Pensione" };
const CAT_CAV = { pensione: "In pensione", mezza_pensione: "In mezza pensione", proprieta: "Di proprietà del centro", soci: "Di soci/istruttori" };
const RUOLI_STAFF = { istruttore: "Istruttori", collaboratore: "Collaboratori", segretario: "Segreteria", giardiniere: "Giardinieri", admin: "Amministratori", altro: "Altri" };
STRUMENTI_ATHENA_AZIONI.push(
  { name: "sc_box", description: "Box e paddock del centro: numero/nome, cavallo dentro, se in manutenzione, cavalli nei paddock. Sola lettura.", input_schema: { type: "object", properties: {} } },
  { name: "sc_proponi_box", description: "Prepara una scheda per: mettere un cavallo in un box (metti_box), in un paddock (metti_paddock), toglierlo dal paddock (togli_paddock), segnare un'icona del giorno fatta (icona: fieno, pasti, acqua, pulizia…), mettere un box in manutenzione o chiuderla.",
    input_schema: { type: "object", properties: {
      azione: { type: "string", enum: ["metti_box", "metti_paddock", "togli_paddock", "icona", "manutenzione", "fine_manutenzione"] },
      cavallo: { type: "string" }, box: { type: "integer", description: "Numero del box." }, paddock: { type: "string", description: "Nome del paddock." },
      icona: { type: "string", enum: Object.keys(ICONE_BOX) }, motivo: { type: "string", enum: Object.keys(MOTIVI_BOX) }, fino_al: { type: "string", description: "YYYY-MM-DD facoltativa." } }, required: ["azione"] } },
  { name: "sc_proponi_cavallo", description: "Prepara la scheda per aggiungere un nuovo cavallo al centro. Se c'è il proprietario scritto e non è tra i clienti, nasce la sua scheda cliente provvisoria.",
    input_schema: { type: "object", properties: {
      nome: { type: "string" }, categoria: { type: "string", enum: Object.keys(CAT_CAV), description: "Default pensione." }, razza: { type: "string" }, sesso: { type: "string", enum: ["femmina", "castrone", "stallone"] },
      data_nascita: { type: "string", description: "YYYY-MM-DD" }, mantello: { type: "string" }, microchip: { type: "string" }, proprietario: { type: "string", description: "Nome e cognome del proprietario." }, note: { type: "string" } }, required: ["nome"] } },
  { name: "sc_proponi_pacchetto", description: "Prepara la scheda per vendere a un cliente un carnet (N lezioni), un abbonamento o una pensione.",
    input_schema: { type: "object", properties: {
      cliente: { type: "string" }, tipo: { type: "string", enum: Object.keys(TIPI_PAC) }, lezioni: { type: "integer", description: "Numero di lezioni del carnet." },
      prezzo: { type: "number" }, inizio: { type: "string", description: "YYYY-MM-DD (default oggi)" }, scadenza: { type: "string", description: "YYYY-MM-DD facoltativa" },
      cavallo: { type: "string", description: "Per pensione o abbonamento legato a un cavallo." }, note: { type: "string" } }, required: ["cliente", "tipo"] } },
  { name: "sc_da_confermare", description: "Cosa aspetta una conferma del centro: cavalli «Da confermare» (codice definitivo), cavalli proposti dai maniscalchi (con il cavallo del centro che sembra lo stesso e se è certo) e cavalli «Da verificare». Sola lettura.", input_schema: { type: "object", properties: {} } },
  { name: "sc_proponi_conferma", description: "Prepara le schede di conferma (una per voce, max 10): codice = conferma i dati per il codice definitivo; proposta = collega il cavallo proposto dal maniscalco al cavallo del centro indicato; verifica = i dati del cavallo «Da verificare» sono giusti. Usa gli id di sc_da_confermare. Proponi solo le voci che l'utente ha chiesto.",
    input_schema: { type: "object", properties: { voci: { type: "array", items: { type: "object", properties: {
      tipo: { type: "string", enum: ["codice", "proposta", "verifica"] }, id: { type: "string", description: "codice: id del cavallo; proposta: riga_id; verifica: id del cavallo." },
      cavallo_centro_id: { type: "string", description: "Solo per proposta: id del cavallo del centro a cui collegarlo." } }, required: ["tipo", "id"] } } }, required: ["voci"] } },
  { name: "sc_proponi_incarico", description: "Prepara la scheda per assegnare/cambiare (assegna), dare un sostituto a tempo (sostituto) o revocare (revoca) il maniscalco di uno o più cavalli.",
    input_schema: { type: "object", properties: {
      azione: { type: "string", enum: ["assegna", "sostituto", "revoca"] }, maniscalco: { type: "string", description: "Per assegna e sostituto." }, cavalli: { type: "array", items: { type: "string" } },
      dal: { type: "string", description: "YYYY-MM-DD, default oggi." }, al: { type: "string", description: "YYYY-MM-DD, obbligatoria per il sostituto." }, motivo: { type: "string", description: "Per la revoca, facoltativo." } }, required: ["azione", "cavalli"] } },
  { name: "sc_proponi_magazzino", description: "Prepara la scheda per registrare un carico (arrivato) o uno scarico (usato) di un articolo di magazzino. Lo scarico consuma prima i lotti che scadono prima.",
    input_schema: { type: "object", properties: {
      tipo: { type: "string", enum: ["carico", "scarico"] }, articolo: { type: "string" }, quantita: { type: "number" },
      costo_unitario: { type: "number", description: "Solo carico, facoltativo." }, cavallo: { type: "string", description: "Solo scarico, facoltativo." }, nota: { type: "string" } }, required: ["tipo", "articolo", "quantita"] } },
  { name: "sc_proponi_comunicazione", description: "Prepara un avviso per lo STAFF del centro nella sezione Comunicazioni: a tutti, a un ruolo (istruttori, collaboratori…) o a una persona. Per i clienti usa sc_proponi_messaggio.",
    input_schema: { type: "object", properties: {
      a: { type: "string", enum: ["tutti", "ruolo", "singolo"] }, ruolo: { type: "string", enum: Object.keys(RUOLI_STAFF) }, persona: { type: "string" },
      testo: { type: "string", description: "Max 1000 caratteri." }, urgente: { type: "boolean" } }, required: ["a", "testo"] } },
);

// ---------------------------------------------------------------- esecuzione
async function eseguiAzioneScuderia(nome, input, ctx) {
  if (!ctx.centroId) return "Nessun centro selezionato.";
  const pieno = troppe(ctx);
  switch (nome) {
    case "sc_lezioni": {
      const da = isoOk(input.da) ? input.da : oggiRoma(), a = isoOk(input.a) ? input.a : piuGiorni(da, 7);
      const { data, error } = await ctx.db.from("scuderia_lezioni").select("id, data, ora_inizio, stato, allievo_id, cavallo_id, istruttore_id, cavaliere, allievo_nome")
        .eq("centro_id", ctx.centroId).gte("data", da).lte("data", a).order("data").order("ora_inizio").limit(80);
      if (error) return "Errore nel leggere le lezioni.";
      const m = await membri(ctx), c = await cavalli(ctx);
      const nm = (id) => m.find((x) => x.id === id)?.nome || null, nc = (id) => c.find((x) => x.id === id)?.nome || null;
      let righe = (data || []).map((l) => ({ id: l.id, data: l.data, ora: String(l.ora_inizio || "").slice(0, 5), stato: l.stato,
        allievo: nm(l.allievo_id) || l.allievo_nome || l.cavaliere || null, cavallo: nc(l.cavallo_id), istruttore: nm(l.istruttore_id) }));
      if (input.cerca) { const q = norma(input.cerca); righe = righe.filter((r) => norma([r.allievo, r.cavallo].join(" ")).includes(q)); }
      return righe.length ? righe : "Nessuna lezione in questo periodo.";
    }

    case "sc_proponi_lezione": {
      if (pieno) return pieno;
      const az = input.azione;
      if (az === "nuova") {
        if (!isoOk(input.data) || !oraOk(input.ora)) return "Per una nuova lezione servono data (YYYY-MM-DD) e ora (HH:MM): chiedile all'utente.";
        const ra = trovaNome(await clienti(ctx), input.allievo, "nome");
        if (!ra.voce) return msgNome(ra, "allievo", input.allievo);
        let cav = null, ist = null;
        if (input.cavallo) { const rc = trovaNome(await cavalli(ctx), input.cavallo, "nome"); if (!rc.voce) return msgNome(rc, "cavallo", input.cavallo); cav = rc.voce; }
        if (input.istruttore) { const ri = trovaNome(await staff(ctx), input.istruttore, "nome"); if (!ri.voce) return msgNome(ri, "istruttore", input.istruttore); ist = ri.voce; }
        const testo = `${ra.voce.nome} · ${dataIt(input.data)} alle ${input.ora}${cav ? " · " + cav.nome : ""}${ist ? " · con " + ist.nome : ""}`;
        ctx.azioni.push({ tipo: "sc_lezione", dati: { op: "nuova", titolo: "Nuova lezione", testo,
          payload: { data: input.data, ora_inizio: input.ora, allievo_id: ra.voce.id, cavallo_id: cav?.id || null, istruttore_id: ist?.id || null, note: (input.note || "").slice(0, 300) || null, stato: "prenotata" } } });
        return "Scheda «Nuova lezione» mostrata: l'utente deve confermarla.";
      }
      if (!["sposta", "annulla", "fatta"].includes(az)) return "Azione non valida.";
      const { data: l } = await ctx.db.from("scuderia_lezioni").select("id, data, ora_inizio, stato, allievo_id, allievo_nome, cavaliere").eq("id", input.lezione_id || "00000000-0000-0000-0000-000000000000").eq("centro_id", ctx.centroId).maybeSingle();
      if (!l) return "Lezione non trovata: usa prima sc_lezioni per avere l'id giusto.";
      const chi = (await membri(ctx)).find((x) => x.id === l.allievo_id)?.nome || l.allievo_nome || l.cavaliere || "Lezione";
      const quando = `${dataIt(l.data)} alle ${String(l.ora_inizio).slice(0, 5)}`;
      if (az === "sposta") {
        const nd = isoOk(input.data) ? input.data : l.data, no = oraOk(input.ora) ? input.ora : String(l.ora_inizio).slice(0, 5);
        if (nd === l.data && no === String(l.ora_inizio).slice(0, 5)) return "Per spostare serve una nuova data o un nuovo orario.";
        ctx.azioni.push({ tipo: "sc_lezione", dati: { op: "sposta", lezione_id: l.id, titolo: "Sposta la lezione", testo: `${chi}: da ${quando} a ${dataIt(nd)} alle ${no}`, payload: { data: nd, ora_inizio: no } } });
      } else if (az === "annulla") {
        ctx.azioni.push({ tipo: "sc_lezione", dati: { op: "annulla", lezione_id: l.id, titolo: "Annulla la lezione", testo: `${chi} · ${quando}`, payload: { stato: "annullata" } } });
      } else {
        ctx.azioni.push({ tipo: "sc_lezione", dati: { op: "fatta", lezione_id: l.id, titolo: "Lezione fatta (presente)", testo: `${chi} · ${quando}`, payload: { stato: "completata" } } });
      }
      return "Scheda mostrata: l'utente deve confermarla.";
    }

    case "sc_proponi_incasso": {
      if (pieno) return pieno;
      const r = trovaNome(await clienti(ctx), input.cliente, "nome");
      if (!r.voce) return msgNome(r, "cliente", input.cliente);
      const imp = Math.round(Number(input.importo) * 100) / 100;
      if (!(imp > 0) || imp > 100000) return "Importo non valido: chiedilo all'utente.";
      const metodo = METODI[input.metodo] ? input.metodo : "contanti";
      const data = isoOk(input.data) ? input.data : oggiRoma();
      const cassa = input.cassa === "asd" ? "asd" : "scuderia";
      ctx.azioni.push({ tipo: "sc_incasso", dati: { titolo: "Registra un incasso", testo: `${r.voce.nome} · ${euro(imp)} · ${METODI[metodo]} · ${dataIt(data)}${cassa === "asd" ? " · cassa ASD" : ""}${input.note ? " · " + String(input.note).slice(0, 100) : ""}`,
        membro_id: r.voce.id, importo: imp, metodo, data, cassa, note: (input.note || "").slice(0, 200) || null } });
      return "Scheda «Registra un incasso» mostrata: l'utente deve confermarla.";
    }

    case "sc_proponi_evento": {
      if (pieno) return pieno;
      const r = trovaNome(await cavalli(ctx), input.cavallo, "nome");
      if (!r.voce) return msgNome(r, "cavallo", input.cavallo);
      if (!TIPI_EVENTO_SC[input.tipo]) return "Tipo non valido.";
      const data = isoOk(input.data) ? input.data : oggiRoma();
      const scad = isoOk(input.scadenza) && input.scadenza > data ? input.scadenza : null;
      const nomeTipo = input.tipo === "altro" ? (String(input.tipo_altro || "").trim() || "Altro") : TIPI_EVENTO_SC[input.tipo];
      ctx.azioni.push({ tipo: "sc_evento", dati: { titolo: "Registra: " + nomeTipo, testo: `${r.voce.nome} · fatto ${dataIt(data)}${scad ? " · prossima scadenza " + dataIt(scad) : " · senza scadenza"}`,
        cavallo_id: r.voce.id, tipo: input.tipo, tipo_altro: input.tipo === "altro" ? nomeTipo.slice(0, 80) : null, data_evento: data, data_scadenza: scad, note: (input.note || "").slice(0, 300) || null } });
      return "Scheda mostrata: l'utente deve confermarla" + (scad ? "." : " (nessuna scadenza: se serve chiedila).");
    }

    case "sc_proponi_messaggio": {
      if (pieno) return pieno;
      const r = trovaNome(await clienti(ctx), input.cliente, "nome");
      if (!r.voce) return msgNome(r, "cliente", input.cliente);
      if (!r.voce.user_id) return `${r.voce.nome} non usa l'app Equo: non posso scrivergli in chat. Suggerisci all'utente di chiamarlo o mandargli un SMS (il telefono è nella scheda Clienti).`;
      const testo = String(input.testo || "").trim().slice(0, 600);
      if (!testo) return "Testo mancante.";
      ctx.azioni.push({ tipo: "sc_messaggio", dati: { titolo: "Messaggio a " + r.voce.nome, testo, membro_id: r.voce.id } });
      return "Messaggio preparato: parte solo se l'utente conferma.";
    }

    case "sc_proponi_cliente": {
      if (pieno) return pieno;
      const nomeC = String(input.nome || "").trim().replace(/\s+/g, " ").slice(0, 80);
      if (nomeC.split(" ").length < 2) return "Serve nome e cognome: chiedili all'utente.";
      const gia = (await clienti(ctx)).filter((m) => norma(m.nome) === norma(nomeC) || norma(m.nome).split(" ").sort().join(" ") === norma(nomeC).split(" ").sort().join(" "));
      if (gia.length) return `Esiste già un cliente «${gia[0].nome}»${gia[0].provvisorio ? " (scheda provvisoria da completare)" : ""}: chiedi all'utente se vuole completare quello invece di crearne un altro.`;
      const email = String(input.email || "").trim().toLowerCase();
      if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return "L'email non sembra valida: chiedila di nuovo.";
      const ruolo = input.ruolo === "proprietario" ? "proprietario" : "allievo";
      const nascita = isoOk(input.data_nascita) ? input.data_nascita : null;
      ctx.azioni.push({ tipo: "sc_cliente", dati: { titolo: "Nuovo cliente", testo: [nomeC, ruolo === "allievo" ? "allievo" : "proprietario", input.telefono, email, nascita ? "nato il " + dataIt(nascita) : null].filter(Boolean).join(" · "),
        nome: nomeC, ruolo, telefono: String(input.telefono || "").trim().slice(0, 30) || null, email: email || null, data_nascita: nascita, note: (input.note || "").slice(0, 300) || null } });
      return "Scheda «Nuovo cliente» mostrata: l'utente deve confermarla. Ricordagli che il consenso privacy si spunta poi nella scheda del cliente.";
    }

    case "sc_maniscalchi": {
      const { data, error } = await ctx.db.rpc("scuderia_lista_professionisti", { p_centro_id: ctx.centroId });
      if (error) return "Errore nel leggere i maniscalchi.";
      const lista = (data || []).filter((p) => (p.categoria || "maniscalco") === "maniscalco");
      return lista.length ? lista.map((p) => ({ nome: p.nome, collegato: p.stato === "attivo", stato: p.stato })) : "Nessun maniscalco collegato al centro: si collega da Professionisti → Aggiungi maniscalco.";
    }

    case "sc_proponi_appuntamento_maniscalco": {
      if (pieno) return pieno;
      if (!TIPI_MAN[input.tipo]) return "Tipo non valido.";
      if (!isoOk(input.data) || input.data < oggiRoma()) return "Serve una data da oggi in poi (YYYY-MM-DD).";
      const { data } = await ctx.db.rpc("scuderia_lista_professionisti", { p_centro_id: ctx.centroId });
      const attivi = (data || []).filter((p) => p.stato === "attivo" && (p.categoria || "maniscalco") === "maniscalco");
      const rp = trovaNome(attivi, input.maniscalco, "nome");
      if (!rp.voce) return msgNome(rp, "maniscalco collegato", input.maniscalco);
      const cav = [];
      for (const n of (Array.isArray(input.cavalli) ? input.cavalli : []).slice(0, 20)) {
        const rc = trovaNome(await cavalli(ctx), n, "nome");
        if (!rc.voce) return msgNome(rc, "cavallo", n);
        if (!cav.some((x) => x.id === rc.voce.id)) cav.push(rc.voce);
      }
      const ora = oraOk(input.ora) ? input.ora : null;
      const nomeTipo = input.tipo === "altro" ? (String(input.tipo_altro || "").trim() || "Altro") : TIPI_MAN[input.tipo];
      ctx.azioni.push({ tipo: "sc_appuntamento", dati: { titolo: "Richiesta a " + rp.voce.nome, testo: `${nomeTipo} · ${dataIt(input.data)}${ora ? " alle " + ora : ""}${cav.length ? " · " + cav.map((c) => c.nome).join(", ") : " · cavalli da decidere"}`,
        cliente_id: rp.voce.cliente_id, tipo: input.tipo, tipo_altro: input.tipo === "altro" ? nomeTipo.slice(0, 80) : null, data: input.data, ora, cavalli: cav.map((c) => c.id), note: (input.note || "").slice(0, 300) || null } });
      return "Richiesta preparata: parte solo se l'utente conferma. Il maniscalco poi la accetta o propone un'altra data.";
    }

    case "sc_box": {
      const [b, p, pc] = await Promise.all([
        ctx.db.from("scuderia_box").select("id, numero, nome, cavallo_id, manutenzione, manutenzione_motivo").eq("centro_id", ctx.centroId).order("numero"),
        ctx.db.from("scuderia_paddock").select("id, nome, capienza, manutenzione").eq("centro_id", ctx.centroId),
        ctx.db.from("scuderia_paddock_cavalli").select("paddock_id, cavallo_id").eq("centro_id", ctx.centroId)]);
      const c = await cavalli(ctx), nc = (id) => c.find((x) => x.id === id)?.nome || null;
      return { box: (b.data || []).map((x) => ({ numero: x.numero, nome: x.nome, cavallo: nc(x.cavallo_id), manutenzione: x.manutenzione ? (MOTIVI_BOX[x.manutenzione_motivo] || "sì") : null })),
               paddock: (p.data || []).map((x) => ({ nome: x.nome, capienza: x.capienza, manutenzione: x.manutenzione, cavalli: (pc.data || []).filter((r) => r.paddock_id === x.id).map((r) => nc(r.cavallo_id)) })) };
    }

    case "sc_proponi_box": {
      if (pieno) return pieno;
      const az = input.azione;
      let cav = null;
      if (["metti_box", "metti_paddock", "togli_paddock"].includes(az) || (az === "icona" && input.cavallo)) {
        const rc = trovaNome(await cavalli(ctx), input.cavallo, "nome"); if (!rc.voce) return msgNome(rc, "cavallo", input.cavallo); cav = rc.voce;
      }
      const { data: boxes } = await ctx.db.from("scuderia_box").select("id, numero, nome, cavallo_id, manutenzione, assegnato_cavallo_id").eq("centro_id", ctx.centroId);
      const boxNum = (n) => (boxes || []).find((x) => x.numero === Number(n));
      if (az === "metti_box") {
        const b = boxNum(input.box); if (!b) return "Box non trovato: usa sc_box per vedere i numeri.";
        if (b.cavallo_id && b.cavallo_id !== cav.id) return `Il box ${b.numero} è occupato: chiedi all'utente dove spostare l'altro cavallo prima.`;
        if (b.manutenzione) return `Il box ${b.numero} è in manutenzione.`;
        const da = (boxes || []).find((x) => x.cavallo_id === cav.id && x.id !== b.id);
        const ris = b.assegnato_cavallo_id && b.assegnato_cavallo_id !== cav.id ? " (attenzione: box riservato a un altro cavallo)" : "";
        ctx.azioni.push({ tipo: "sc_box", dati: { op: "metti_box", titolo: "Sposta nel box " + b.numero, testo: `${cav.nome}${da ? " dal box " + da.numero : ""} → box ${b.numero}${ris}`, cavallo_id: cav.id, box_id: b.id, da_box_id: da?.id || null } });
        return "Scheda mostrata: l'utente deve confermarla.";
      }
      if (az === "metti_paddock" || (az === "icona" && input.paddock)) {
        const { data: pads } = await ctx.db.from("scuderia_paddock").select("id, nome, capienza, manutenzione").eq("centro_id", ctx.centroId);
        const rp = trovaNome(pads || [], input.paddock, "nome"); if (!rp.voce) return msgNome(rp, "paddock", input.paddock);
        if (az === "metti_paddock") {
          if (rp.voce.manutenzione) return `${rp.voce.nome} è in manutenzione.`;
          const { count } = await ctx.db.from("scuderia_paddock_cavalli").select("id", { count: "exact", head: true }).eq("paddock_id", rp.voce.id);
          const over = (count || 0) + 1 > rp.voce.capienza ? ` (sarà sovraffollato: ${(count || 0) + 1} su ${rp.voce.capienza})` : "";
          ctx.azioni.push({ tipo: "sc_box", dati: { op: "metti_paddock", titolo: "Nel paddock " + rp.voce.nome, testo: cav.nome + over, cavallo_id: cav.id, paddock_id: rp.voce.id } });
          return "Scheda mostrata: l'utente deve confermarla.";
        }
        if (!ICONE_BOX[input.icona]) return "Icona non valida.";
        ctx.azioni.push({ tipo: "sc_box", dati: { op: "icona", titolo: ICONE_BOX[input.icona] + " fatto", testo: rp.voce.nome + " (tutto il paddock) · oggi", paddock_id: rp.voce.id, cavallo_id: null, icona: input.icona } });
        return "Scheda mostrata: l'utente deve confermarla.";
      }
      if (az === "togli_paddock") {
        ctx.azioni.push({ tipo: "sc_box", dati: { op: "togli_paddock", titolo: "Togli dal paddock", testo: cav.nome + " (se ha un box, rientra lì)", cavallo_id: cav.id } });
        return "Scheda mostrata: l'utente deve confermarla.";
      }
      if (az === "icona") {
        if (!ICONE_BOX[input.icona]) return "Icona non valida.";
        let b = cav ? (boxes || []).find((x) => x.cavallo_id === cav.id) : boxNum(input.box);
        let padId = null;
        if (cav && !b) { const { data: r } = await ctx.db.from("scuderia_paddock_cavalli").select("paddock_id").eq("cavallo_id", cav.id).maybeSingle(); padId = r?.paddock_id || null; }
        if (!b && !padId) return cav ? `${cav.nome} non è in un box né in un paddock.` : "Indica il cavallo o il numero del box.";
        ctx.azioni.push({ tipo: "sc_box", dati: { op: "icona", titolo: ICONE_BOX[input.icona] + " fatto", testo: `${cav ? cav.nome : "Box " + b.numero}${b && cav ? " · box " + b.numero : ""} · oggi`, box_id: b?.id || null, paddock_id: b ? null : padId, cavallo_id: cav?.id || b?.cavallo_id || null, icona: input.icona } });
        return "Scheda mostrata: l'utente deve confermarla.";
      }
      if (az === "manutenzione" || az === "fine_manutenzione") {
        const b = boxNum(input.box); if (!b) return "Box non trovato: usa sc_box per vedere i numeri.";
        if (az === "manutenzione") {
          if (b.cavallo_id) return `Nel box ${b.numero} c'è un cavallo: prima va spostato.`;
          const motivo = MOTIVI_BOX[input.motivo] ? input.motivo : "pulizia";
          const fino = isoOk(input.fino_al) ? input.fino_al : null;
          ctx.azioni.push({ tipo: "sc_box", dati: { op: "manutenzione", titolo: "Box " + b.numero + " in manutenzione", testo: MOTIVI_BOX[motivo] + (fino ? " · fino al " + dataIt(fino) : ""), box_id: b.id, motivo, fino } });
        } else {
          if (!b.manutenzione) return `Il box ${b.numero} non è in manutenzione.`;
          ctx.azioni.push({ tipo: "sc_box", dati: { op: "fine_manutenzione", titolo: "Fine manutenzione", testo: "Box " + b.numero + " di nuovo libero", box_id: b.id } });
        }
        return "Scheda mostrata: l'utente deve confermarla.";
      }
      return "Azione non valida.";
    }

    case "sc_proponi_cavallo": {
      if (pieno) return pieno;
      const nomeC = String(input.nome || "").trim().replace(/\s+/g, " ").slice(0, 80);
      if (!nomeC) return "Serve il nome del cavallo.";
      const chip = String(input.microchip || "").replace(/[^0-9A-Za-z]/g, "").toUpperCase();
      const gia = (await cavalli(ctx)).find((c) => norma(c.nome) === norma(nomeC));
      if (gia) return `C'è già un cavallo «${gia.nome}» nel centro: chiedi all'utente se è un altro cavallo (in quel caso serve un nome diverso o il microchip).`;
      const cat = CAT_CAV[input.categoria] ? input.categoria : "pensione";
      const nascita = isoOk(input.data_nascita) ? input.data_nascita : null;
      const prop = String(input.proprietario || "").trim().slice(0, 80) || null;
      ctx.azioni.push({ tipo: "sc_cavallo", dati: { titolo: "Nuovo cavallo", testo: [nomeC, CAT_CAV[cat], input.razza, input.sesso, nascita ? "nato il " + dataIt(nascita) : null, chip ? "chip " + chip : null, prop ? "di " + prop : null].filter(Boolean).join(" · "),
        payload: { nome: nomeC, tipo_proprieta: cat, razza: String(input.razza || "").trim().slice(0, 60) || null, sesso: ["femmina", "castrone", "stallone"].includes(input.sesso) ? input.sesso : null,
          data_nascita: nascita, mantello: String(input.mantello || "").trim().slice(0, 40) || null, microchip: chip || null, proprietario: cat === "proprieta" ? null : prop, note: (input.note || "").slice(0, 300) || null } } });
      return "Scheda «Nuovo cavallo» mostrata: l'utente deve confermarla." + (prop && cat !== "proprieta" ? " Se il proprietario non è tra i clienti nasce la sua scheda provvisoria." : "");
    }

    case "sc_proponi_pacchetto": {
      if (pieno) return pieno;
      const r = trovaNome(await clienti(ctx), input.cliente, "nome");
      if (!r.voce) return msgNome(r, "cliente", input.cliente);
      if (!TIPI_PAC[input.tipo]) return "Tipo non valido.";
      const lez = input.tipo === "carnet" ? parseInt(input.lezioni, 10) : null;
      if (input.tipo === "carnet" && !(lez > 0 && lez <= 200)) return "Per un carnet serve il numero di lezioni.";
      let cav = null;
      if (input.cavallo && input.tipo !== "carnet") { const rc = trovaNome(await cavalli(ctx), input.cavallo, "nome"); if (!rc.voce) return msgNome(rc, "cavallo", input.cavallo); cav = rc.voce; }
      const inizio = isoOk(input.inizio) ? input.inizio : oggiRoma(), scad = isoOk(input.scadenza) && input.scadenza >= inizio ? input.scadenza : null;
      const prezzo = Number(input.prezzo) > 0 ? Math.round(Number(input.prezzo) * 100) / 100 : null;
      ctx.azioni.push({ tipo: "sc_pacchetto", dati: { titolo: TIPI_PAC[input.tipo] + " per " + r.voce.nome, testo: [lez ? lez + " lezioni" : null, cav ? cav.nome : null, prezzo ? euro(prezzo) : "prezzo non indicato", "dal " + dataIt(inizio), scad ? "scade " + dataIt(scad) : null].filter(Boolean).join(" · "),
        payload: { cliente: r.voce.nome, membro_id: r.voce.id, tipo: input.tipo, unita_totali: lez, unita_usate: lez ? 0 : null, data_inizio: inizio, data_scadenza: scad, prezzo, cavallo_id: cav?.id || null, note: (input.note || "").slice(0, 300) || null } } });
      return "Scheda mostrata: l'utente deve confermarla.";
    }

    case "sc_da_confermare": {
      const [a, b, v] = await Promise.all([ctx.db.rpc("equo_cavalli_da_confermare"), ctx.db.rpc("scuderia_proposte_pro", { p_centro: ctx.centroId }),
        ctx.db.from("scuderia_cavalli").select("id, nome").eq("centro_id", ctx.centroId).eq("da_verificare", true).is("uscito_il", null)]);
      const c = await cavalli(ctx);
      return {
        codice: (a.data || []).map((x) => ({ ...x, sc: x.scuderia_cavallo_id ? c.find((k) => k.id === x.scuderia_cavallo_id) : c.find((k) => x.horse_id && k.horse_id === x.horse_id) }))
          .filter((x) => x.sc).map((x) => ({ id: x.sc.id, nome: x.nome, codice: x.codice, motivo: x.motivo === "dati_modificati" ? "dati cambiati dopo l'ultima conferma" : null })),
        proposte_maniscalchi: (b.data || []).map((x) => ({ riga_id: x.riga_id, nome: x.nome, maniscalco: x.professionista, sembra: x.candidato ? { cavallo_centro_id: x.candidato.id, nome: x.candidato.nome, certo: !!x.candidato.certo, perche: x.candidato.perche || null } : null })),
        da_verificare: (v.data || []).map((x) => ({ id: x.id, nome: x.nome })) };
    }

    case "sc_proponi_conferma": {
      const voci = Array.isArray(input.voci) ? input.voci.slice(0, MAX_SCHEDE) : [];
      if (!voci.length) return "Nessuna voce.";
      const c = await cavalli(ctx), nc = (id) => c.find((x) => x.id === id)?.nome;
      let n = 0;
      for (const v of voci) {
        if (troppe(ctx)) break;
        if (v.tipo === "codice" && nc(v.id)) { ctx.azioni.push({ tipo: "sc_conferma", dati: { op: "codice", titolo: "Conferma i dati", testo: nc(v.id) + " · per il codice definitivo", id: v.id } }); n++; }
        else if (v.tipo === "verifica" && nc(v.id)) { ctx.azioni.push({ tipo: "sc_conferma", dati: { op: "verifica", titolo: "Dati giusti", testo: nc(v.id) + " · togli «Da verificare»", id: v.id } }); n++; }
        else if (v.tipo === "proposta" && v.cavallo_centro_id && nc(v.cavallo_centro_id)) {
          if (!ctx._prop) ctx._prop = (await ctx.db.rpc("scuderia_proposte_pro", { p_centro: ctx.centroId })).data || [];
          const r = ctx._prop.map((x) => ({ id: x.riga_id, nome: x.nome })).find((x) => x.id === v.id);
          if (r) { ctx.azioni.push({ tipo: "sc_conferma", dati: { op: "proposta", titolo: "Collega il cavallo del maniscalco", testo: `«${r.nome}» → ${nc(v.cavallo_centro_id)} (lo storico dei lavori passa sul vostro cavallo)`, id: v.id, scheda: v.cavallo_centro_id } }); n++; }
        }
      }
      return n ? `${n} schede mostrate: l'utente deve confermarle.` : "Nessuna voce valida: usa gli id di sc_da_confermare.";
    }

    case "sc_proponi_incarico": {
      if (pieno) return pieno;
      if (!["assegna", "sostituto", "revoca"].includes(input.azione)) return "Azione non valida.";
      const { data: inc, error } = await ctx.db.rpc("scuderia_incarichi", { p_centro: ctx.centroId });
      if (error || !inc || inc.errore) return "Non riesco a leggere gli incarichi.";
      let pro = null;
      if (input.azione !== "revoca" || input.maniscalco) {
        const rp = trovaNome((inc.pro || []).map((p) => ({ ...p, nome: p.nome || "" })), input.maniscalco, "nome");
        if (!rp.voce) return msgNome(rp, "maniscalco", input.maniscalco); pro = rp.voce;
      }
      const cav = [];
      for (const n of (Array.isArray(input.cavalli) ? input.cavalli : []).slice(0, 60)) {
        const rc = trovaNome(inc.cavalli || [], n, "nome"); if (!rc.voce) return msgNome(rc, "cavallo", n);
        if (!cav.some((x) => x.id === rc.voce.id)) cav.push(rc.voce);
      }
      if (!cav.length) return "Indica i cavalli.";
      const dal = isoOk(input.dal) && input.dal > oggiRoma() ? input.dal : null, al = isoOk(input.al) ? input.al : null;
      if (input.azione === "sostituto" && (!al || al < (dal || oggiRoma()))) return "Per un sostituto serve fino a quando (data «al»).";
      const tit = (c) => (c.incarichi || []).find((a) => a.ruolo === "titolare" && a.stato === "attivo")?.nome;
      const righe = cav.map((c) => input.azione === "revoca" ? `${c.nome}: via ${tit(c) || "nessuno"}` : `${c.nome}: ${tit(c) || "nessuno"} → ${pro.nome}${c.chiede_conferma ? " (conferma il proprietario)" : ""}`);
      ctx.azioni.push({ tipo: "sc_incarico", dati: { titolo: { assegna: "Nuovo maniscalco", sostituto: "Sostituto fino al " + dataIt(al), revoca: "Revoca il maniscalco" }[input.azione] + (dal ? " dal " + dataIt(dal) : " da subito"),
        testo: righe.join("\n"), azione: input.azione, cliente: pro?.cliente_id || null, cavalli: cav.map((c) => c.id), dal, al, motivo: (input.motivo || "").slice(0, 200) || null } });
      return "Scheda mostrata: l'utente deve confermarla.";
    }

    case "sc_proponi_magazzino": {
      if (pieno) return pieno;
      const { data: arts } = await ctx.db.from("mag_articoli").select("id, nome, unita, gestisce_lotti").eq("centro_id", ctx.centroId).eq("archiviato", false);
      const ra = trovaNome(arts || [], input.articolo, "nome"); if (!ra.voce) return msgNome(ra, "articolo", input.articolo);
      const q = Math.round(Number(input.quantita) * 1000) / 1000; if (!(q > 0)) return "Quantità non valida.";
      const a = ra.voce, un = a.unita || "pz";
      const { data: mov } = await ctx.db.from("mag_movimenti").select("tipo, quantita, lotto, scadenza").eq("articolo_id", a.id).limit(2000);
      let giac = 0; const lotti = {};
      for (const m of mov || []) {
        const d = m.tipo === "carico" ? Number(m.quantita) : m.tipo === "scarico" ? -Number(m.quantita) : m.tipo === "rettifica" ? Number(m.quantita) : 0;
        giac += d; if (m.lotto) { const k = m.lotto + "|" + (m.scadenza || ""); lotti[k] = (lotti[k] || 0) + d; }
      }
      const righe = [];
      if (input.tipo === "carico") {
        righe.push({ tipo: "carico", quantita: q, costo_unitario: Number(input.costo_unitario) >= 0 && input.costo_unitario != null ? Number(input.costo_unitario) : null });
      } else {
        let cav = null; if (input.cavallo) { const rc = trovaNome(await cavalli(ctx), input.cavallo, "nome"); if (!rc.voce) return msgNome(rc, "cavallo", input.cavallo); cav = rc.voce; }
        let resto = q;
        for (const [k, qt] of Object.entries(lotti).filter(([, v]) => v > 0.0001).sort((x, y) => (x[0].split("|")[1] || "9999").localeCompare(y[0].split("|")[1] || "9999"))) {
          if (resto <= 0) break; const usa = Math.min(resto, qt); const [lotto, scad] = k.split("|");
          righe.push({ tipo: "scarico", quantita: Math.round(usa * 1000) / 1000, lotto, scadenza: scad || null, cavallo_id: cav?.id || null }); resto -= usa;
        }
        if (resto > 0.0001) righe.push({ tipo: "scarico", quantita: Math.round(resto * 1000) / 1000, cavallo_id: cav?.id || null });
      }
      const dopo = Math.round((giac + (input.tipo === "carico" ? q : -q)) * 1000) / 1000;
      ctx.azioni.push({ tipo: "sc_magazzino", dati: { titolo: (input.tipo === "carico" ? "Carico: " : "Scarico: ") + a.nome, testo: `${q} ${un}${input.nota ? " · " + String(input.nota).slice(0, 80) : ""} · in magazzino dopo: ${dopo} ${un}${dopo < 0 ? " (attenzione: sotto zero)" : ""}`,
        righe: righe.map((r) => ({ ...r, articolo_id: a.id, nota: (input.nota || "").slice(0, 500) || null })) } });
      return "Scheda mostrata: l'utente deve confermarla.";
    }

    case "sc_proponi_comunicazione": {
      if (pieno) return pieno;
      const testo = String(input.testo || "").trim().slice(0, 1000); if (!testo) return "Testo mancante.";
      let dest = "a tutto lo staff", ruolo = null, membro = null;
      if (input.a === "ruolo") { if (!RUOLI_STAFF[input.ruolo]) return "Indica il ruolo."; ruolo = input.ruolo; dest = "a: " + RUOLI_STAFF[ruolo]; }
      else if (input.a === "singolo") { const r = trovaNome(await staff(ctx), input.persona, "nome"); if (!r.voce) return msgNome(r, "persona dello staff", input.persona); membro = r.voce.id; dest = "a " + r.voce.nome; }
      ctx.azioni.push({ tipo: "sc_comunicazione", dati: { titolo: (input.urgente ? "Avviso URGENTE " : "Avviso ") + dest, testo, destinatario_tipo: input.a === "ruolo" || input.a === "singolo" ? input.a : "tutti", destinatario_ruolo: ruolo, destinatario_membro_id: membro, priorita: input.urgente ? "urgente" : "normale" } });
      return "Avviso preparato: parte solo se l'utente conferma.";
    }
  }
  return null;
}

const NOMI_AZIONI_SCUDERIA = STRUMENTI_ATHENA_AZIONI.map((t) => t.name);   // calcolato dopo i push dei 7-13
module.exports = { STRUMENTI_ATHENA_AZIONI, NOMI_AZIONI_SCUDERIA, eseguiAzioneScuderia };
