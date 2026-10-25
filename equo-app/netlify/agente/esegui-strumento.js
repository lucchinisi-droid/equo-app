// Equo · agenti AI (netlify/functions/agent.js) · esecuzione degli strumenti chiesti dagli agenti
const { SEL_INTERVENTO, aggiungiGiorni, cavalliCliente, clientiManiscalco, descrTipo, interventoDelManiscalco, isoValida, oggiISO, rigaIntervento, risolviCliente, trovaCavallo, trovaPerNome } = require("./aiuti");
const { TIPI_EVENTO } = require("./configurazione");
const { strumentoMeteo } = require("./meteo");
const { STRUMENTI_GESTIONE, TIPI_INTERVENTO } = require("./strumenti");

async function eseguiStrumento(nome, input, ctx) {
  if (ctx.incassiNascosti && ["incassi", "proponi_segna_saldato", "proponi_conto"].includes(nome)) {
    return "L'utente ha nascosto gli incassi nell'app (interruttore con PIN): non parlare di importi, pagamenti o incassi. Se te li chiede, digli che può farli ricomparire dal menu profilo → Home → «Mostra gli incassi».";
  }
  const { db, userId, cavalli } = ctx;
  input = input || {};
  if (nome !== "naviga_verso" && STRUMENTI_GESTIONE.some((t) => t.name === nome) && ctx.ambito !== "maniscalco") return "Strumento riservato ai maniscalchi.";
  if (ctx.vista === "scuderia" && !(ctx.strumenti || []).some((t) => t.name === nome)) return "Strumento non disponibile.";
  if (["situazione_centro", "statistiche_centro", "ultimo_radar"].includes(nome) && ctx.vista !== "scuderia") return "Strumento disponibile solo in Equo Scuderia.";
  switch (nome) {
    case "elenco_cavalli":
      return cavalli.length ? cavalli.map((c) => ({ nome: c.name, razza: c.breed, nascita: c.birth_date, microchip: c.microchip, mantello: c.mantello, note: c.note, condiviso_con_professionisti: c.condiviso_ecosistema !== false })) : "Nessun cavallo registrato.";

    case "scadenze": {
      if (!cavalli.length) return "Nessun cavallo registrato.";
      const fino = aggiungiGiorni(oggiISO(), Math.min(Math.max(Number(input.giorni_avanti) || 90, 1), 730));
      const { data, error } = await db.from("health_events").select("type, date, next_due_date, notes, horse_id").in("horse_id", cavalli.map((c) => c.id)).order("date", { ascending: false });
      if (error) return "Errore nel leggere le scadenze.";
      const ultimo = {};
      (data || []).forEach((e) => { const k = e.horse_id + "|" + e.type; if (!ultimo[k]) ultimo[k] = e; });
      const righe = Object.values(ultimo).filter((e) => e.next_due_date && e.next_due_date <= fino)
        .sort((a, b) => a.next_due_date.localeCompare(b.next_due_date))
        .map((e) => ({ cavallo: cavalli.find((c) => c.id === e.horse_id)?.name, tipo: TIPI_EVENTO[e.type] || e.type, ultimo_evento: e.date, scadenza: e.next_due_date, stato: e.next_due_date < oggiISO() ? "SCADUTA" : "in arrivo" }));
      const senza = cavalli.filter((c) => !(data || []).some((e) => e.horse_id === c.id)).map((c) => c.name);
      return { oggi: oggiISO(), scadenze: righe, cavalli_senza_eventi_registrati: senza };
    }

    case "storico_sanitario": {
      if (!cavalli.length) return "Nessun cavallo registrato.";
      let ids = cavalli.map((c) => c.id);
      if (input.cavallo) { const c = trovaCavallo(cavalli, input.cavallo); if (!c) return `Non trovo il cavallo "${input.cavallo}". Cavalli: ${cavalli.map((x) => x.name).join(", ")}.`; ids = [c.id]; }
      let q = db.from("health_events").select("type, date, next_due_date, notes, horse_id").in("horse_id", ids).order("date", { ascending: false }).limit(Math.min(Number(input.limite) || 15, 50));
      if (input.tipo) q = q.eq("type", input.tipo);
      const { data, error } = await q;
      if (error) return "Errore nel leggere lo storico.";
      return (data || []).map((e) => ({ cavallo: cavalli.find((c) => c.id === e.horse_id)?.name, tipo: TIPI_EVENTO[e.type] || e.type, data: e.date, prossima_scadenza: e.next_due_date, note: e.notes }));
    }

    case "spese": {
      const da = input.da || oggiISO().slice(0, 4) + "-01-01";
      const a = input.a || oggiISO();
      let q = db.from("expenses").select("category, amount, date, notes, horse_id").eq("owner_id", userId).gte("date", da).lte("date", a).order("date", { ascending: false }).limit(1000);
      if (input.categoria) q = q.eq("category", input.categoria);
      const { data, error } = await q;
      if (error) return "Errore nel leggere le spese.";
      const tot = (arr) => Math.round(arr.reduce((s, e) => s + Number(e.amount || 0), 0) * 100) / 100;
      const per = (f) => { const m = {}; (data || []).forEach((e) => { const k = f(e) || "—"; m[k] = (m[k] || 0) + Number(e.amount || 0); }); Object.keys(m).forEach((k) => (m[k] = Math.round(m[k] * 100) / 100)); return m; };
      return {
        periodo: { da, a }, numero_voci: (data || []).length, totale_euro: tot(data || []),
        per_categoria: per((e) => e.category), per_mese: per((e) => (e.date || "").slice(0, 7)),
        per_cavallo: per((e) => cavalli.find((c) => c.id === e.horse_id)?.name),
        ultime_voci: (data || []).slice(0, 8).map((e) => ({ data: e.date, categoria: e.category, euro: Number(e.amount), note: e.notes })),
      };
    }

    case "appuntamenti_maniscalco": {
      const { data: mani, error } = await db.rpc("lista_maniscalchi_collegati");
      if (error) return "Errore nel leggere i maniscalchi collegati.";
      if (!Array.isArray(mani) || !mani.length) return "Nessun maniscalco collegato. Si collega da Chat → 'Il tuo maniscalco' → '+ Collega' con il codice del maniscalco.";
      const out = [];
      for (const m of mani) {
        const { data: app } = await db.rpc("appuntamenti_maniscalco_cliente", { p_cliente_id: m.cliente_mascalcia_id });
        out.push({ maniscalco: m.nome_maniscalco, equo_certified: !!m.certificato, messaggi_non_letti: m.non_letti,
          appuntamenti: (app || []).map((x) => ({ data: x.data_intervento, ora: x.ora ? String(x.ora).slice(0, 5) : null, tipo: x.tipo_ferratura === "altro" ? x.tipo_altro : x.tipo_ferratura, cavallo: x.nome_cavallo, stato: { richiesto: "in attesa di conferma", programmato: "confermato", rifiutato: "non disponibile" }[x.stato] || x.stato })) });
      }
      return out;
    }

    case "lezioni": {
      const da = input.da || aggiungiGiorni(oggiISO(), -30);
      const a = input.a || aggiungiGiorni(oggiISO(), 60);
      const { data, error } = await db.from("lezioni_manuali").select("data, tipo, note, horse_id").eq("owner_id", userId).gte("data", da).lte("data", a).order("data", { ascending: true });
      if (error) return "Errore nel leggere il calendario.";
      return (data || []).map((l) => ({ data: l.data, tipo: l.tipo, cavallo: cavalli.find((c) => c.id === l.horse_id)?.name, note: l.note }));
    }

    case "guida_app": {
      const ambitoGuida = ctx.guida || "proprietario";
      if (input.elenco) {
        const { data, error } = await db.rpc("indice_guida", { p_ambito: ambitoGuida });
        if (error) return "Errore nel leggere la guida.";
        return { schede_disponibili: data || [], nota: "Per i passi di una funzione richiama guida_app con la domanda." };
      }
      const domanda = String(input.domanda || "").slice(0, 300);
      if (!domanda.trim()) return "Scrivi cosa cercare.";
      const { data, error } = await db.rpc("cerca_guida", { p_query: domanda, p_ambito: ambitoGuida, p_limite: 3 });
      if (error) { console.error("guida_app:", error); return "Errore nel leggere la guida."; }
      if (!(data || []).length) return "Nessuna scheda trovata: riprova con altre parole (sinonimi, nome del menu) o con elenco = true per vedere tutte le schede. Non inventare percorsi.";
      return data;
    }

    case "cavalli_centro": {
      if (!ctx.centroId) return "Strumento disponibile solo in Equo Scuderia.";
      let q = db.from("scuderia_cavalli").select("id, nome, razza, mantello, data_nascita, proprietario, note, nota_box").eq("centro_id", ctx.centroId).is("uscito_il", null).order("nome").limit(60);
      const cerca = String(input.cerca || "").replace(/[%,()]/g, "").trim().slice(0, 60);
      if (cerca) q = q.ilike("nome", `%${cerca}%`);
      const { data, error } = await q;
      if (error) { console.error("cavalli_centro:", error); return "Errore nel leggere i cavalli del centro."; }
      if (!(data || []).length) return cerca ? "Nessun cavallo con questo nome nel centro." : "Nel centro non ci sono ancora cavalli registrati.";
      const { data: box } = await db.from("scuderia_box").select("numero, nome, cavallo_id").eq("centro_id", ctx.centroId).in("cavallo_id", data.map((c) => c.id));
      const boxDi = {}; (box || []).forEach((b) => { boxDi[b.cavallo_id] = b.nome || ("Box " + b.numero); });
      const anni = (d) => d ? Math.floor((Date.now() - new Date(d).getTime()) / 31557600000) : null;
      return data.map((c) => ({ nome: c.nome, razza: c.razza, mantello: c.mantello, eta_anni: anni(c.data_nascita), proprietario: c.proprietario, box: boxDi[c.id] || null, note: [c.note, c.nota_box].filter(Boolean).join(" · ") || null }));
    }

    case "situazione_centro": {
      if (!ctx.centroId) return "Nessun centro selezionato.";
      const { data, error } = await db.rpc("athena_situazione", { p_centro_id: ctx.centroId });
      if (error) { console.error("situazione_centro:", error); return "Errore nel leggere la situazione del centro."; }
      return data;
    }

    case "statistiche_centro": {
      const { data, error } = await db.rpc("statistiche_centro", { p_centro_id: ctx.centroId });
      if (error) { console.error("statistiche_centro:", error); return "Errore nel leggere le statistiche."; }
      return data;
    }

    case "ultimo_radar": {
      const { data } = await db.from("merlino_radar").select("testo, fonti, zona, created_at").eq("centro_id", ctx.centroId).order("created_at", { ascending: false }).limit(1).maybeSingle();
      return data || "Nessun radar ancora generato: si genera dalla pagina Statistiche → \"Aggiorna il radar\" (e ogni lunedì in automatico).";
    }

    case "cerca_conoscenze": {
      const { data, error } = await db.rpc("cerca_conoscenze", { p_query: String(input.domanda || "").slice(0, 300), p_ambito: ctx.ambito || "proprietario", p_limite: 4 });
      if (error) return "Ricerca non disponibile al momento.";
      if (!Array.isArray(data) || !data.length) return "Nessuna scheda verificata su questo argomento: rispondi con indicazioni generali prudenti e dillo.";
      return data.map((s) => ({ titolo: s.titolo, contenuto: s.contenuto, fonte: s.fonte_titolo, link_fonte: s.fonte_url, verificata_il: s.verificato_il }));
    }

    case "salva_memoria": {
      const testo = String(input.testo || "").trim().slice(0, 500);
      if (!testo) return "Niente da salvare.";
      const c = trovaCavallo(cavalli, input.cavallo);
      const { error } = await db.from("ai_memoria").insert({ user_id: userId, horse_id: c?.id || null, testo });
      return error ? "Non sono riuscito a salvare la nota." : "Nota salvata.";
    }

    case "proponi_evento_sanitario": {
      const c = trovaCavallo(cavalli, input.horse_name);
      if (!c) return `Non trovo il cavallo "${input.horse_name}". Cavalli dell'utente: ${cavalli.map((x) => x.name).join(", ") || "nessuno"}.`;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date || "")) return "Data non valida: chiedi la data all'utente.";
      const dati = { horse_name: c.name, type: input.type, date: input.date, next_due_date: /^\d{4}-\d{2}-\d{2}$/.test(input.next_due_date || "") ? input.next_due_date : null, notes: input.notes || null };
      if (!ctx.proposta) ctx.proposta = dati;
      ctx.azioni.push({ tipo: "evento", dati });
      return "Scheda mostrata all'utente: sarà salvata solo quando la conferma. Diglielo in una frase.";
    }

    case "proponi_spesa": {
      const importo = Math.round(Number(input.importo) * 100) / 100;
      if (!(importo > 0)) return "Importo non valido: chiedilo all'utente.";
      if (!isoValida(input.data)) return "Data non valida: chiedila all'utente.";
      const cat = ["pensione", "mangime", "veterinario", "maniscalco", "attrezzatura", "altro"].includes(input.categoria) ? input.categoria : "altro";
      let c = trovaCavallo(cavalli, input.cavallo);
      if (!c && input.cavallo) return `Non trovo il cavallo "${input.cavallo}". Cavalli: ${cavalli.map((x) => x.name).join(", ")}.`;
      if (!c && cavalli.length === 1) c = cavalli[0];
      ctx.azioni.push({ tipo: "spesa", dati: { horse_id: c?.id || null, horse_name: c?.name || null, category: cat, amount: importo, date: input.data, notes: (input.note || "").slice(0, 300) || null } });
      return "Scheda spesa mostrata all'utente, da confermare.";
    }

    case "proponi_lezione": {
      if (!isoValida(input.data)) return "Data non valida: chiedila all'utente.";
      const tipo = ["lezione", "allenamento", "gara", "altro"].includes(input.tipo) ? input.tipo : "altro";
      let c = trovaCavallo(cavalli, input.cavallo);
      if (!c && input.cavallo) return `Non trovo il cavallo "${input.cavallo}". Cavalli: ${cavalli.map((x) => x.name).join(", ")}.`;
      if (!c && cavalli.length === 1) c = cavalli[0];
      ctx.azioni.push({ tipo: "lezione", dati: { horse_id: c?.id || null, horse_name: c?.name || null, tipo, data: input.data, note: (input.note || "").slice(0, 300) || null } });
      return "Scheda calendario mostrata all'utente, da confermare.";
    }

    case "proponi_richiesta_maniscalco": {
      if (!isoValida(input.data) || input.data < oggiISO()) return "La data deve essere da oggi in poi: chiedila all'utente.";
      const { data: mani } = await db.rpc("lista_maniscalchi_collegati");
      if (!Array.isArray(mani) || !mani.length) return "L'utente non ha maniscalchi collegati: spiegagli che si collega da Chat → 'Il tuo maniscalco' → '+ Collega' con il codice del maniscalco.";
      let m = null;
      if (input.maniscalco) { const n = input.maniscalco.toLowerCase(); m = mani.find((x) => (x.nome_maniscalco || "").toLowerCase().includes(n)); }
      if (!m && mani.length === 1) m = mani[0];
      if (!m) return `Più maniscalchi collegati: chiedi a quale inviare (${mani.map((x) => x.nome_maniscalco).join(", ")}).`;
      const tipo = ["ferratura", "mezza_ferratura", "pareggio", "altro"].includes(input.tipo) ? input.tipo : "altro";
      if (tipo === "altro" && !input.tipo_altro) return "Chiedi all'utente che tipo di intervento serve.";
      let c = trovaCavallo(cavalli, input.cavallo);
      if (!c && cavalli.length === 1) c = cavalli[0];
      if (!c && !input.cavallo) return "Chiedi per quale cavallo è l'appuntamento.";
      const ora = /^\d{1,2}:\d{2}$/.test(input.ora || "") ? input.ora.padStart(5, "0") : null;
      ctx.azioni.push({ tipo: "richiesta_maniscalco", dati: { cliente_mascalcia_id: m.cliente_mascalcia_id, nome_maniscalco: m.nome_maniscalco, horse_id: c?.id || null, nome_cavallo: c ? null : input.cavallo, horse_name: c?.name || input.cavallo, tipo, tipo_altro: tipo === "altro" ? input.tipo_altro : null, data: input.data, ora, note: (input.note || "").slice(0, 300) || null } });
      return `Scheda richiesta per ${m.nome_maniscalco} mostrata all'utente: partirà quando la conferma.`;
    }

    case "clienti_e_cavalli": {
      let clienti = await clientiManiscalco(ctx);
      if (!clienti.length) return "Nessun cliente registrato: si aggiungono dall'agenda o dalla sezione Clienti.";
      const cerca = String(input.cerca || "").trim().toLowerCase();
      const out = [];
      for (const c of clienti) {
        const cavalli = await cavalliCliente(ctx, c);
        if (cerca && !(c.nome || "").toLowerCase().includes(cerca) && !cavalli.some((h) => (h.nome || "").toLowerCase().includes(cerca))) continue;
        out.push({ cliente: c.nome, telefono: c.telefono || null, su_equo: !!c.cliente_user_id, tipo: c.tipo_cliente || null, cavalli: cavalli.map((h) => h.nome) });
        if (out.length >= 40) break;
      }
      return out.length ? out : `Nessun cliente o cavallo corrisponde a "${input.cerca}".`;
    }

    case "le_mie_sedute": {
      if (ctx.agente !== "ares") return "Strumento riservato agli istruttori.";
      let q = db.from("sedute").select("id, titolo, stato, inviata_il, created_at, trainer_cavalli(nome), sedute_annotazioni(id, nascosta), sedute_commenti(id)")
        .eq("trainer_id", userId).eq("nascosta", false).order("created_at", { ascending: false }).limit(Math.min(Number(input.limite) || 15, 30));
      if (["bozza", "inviata"].includes(input.stato)) q = q.eq("stato", input.stato);
      const { data, error } = await q;
      if (error) return "Errore nel leggere le sedute.";
      const cerca = String(input.cerca || "").toLowerCase().trim();
      return (data || []).filter((x) => !cerca || (x.titolo + " " + (x.trainer_cavalli?.nome || "")).toLowerCase().includes(cerca)).map((x) => ({
        id: x.id, titolo: x.titolo, cavallo: x.trainer_cavalli?.nome || null, stato: x.stato, data: (x.inviata_il || x.created_at || "").slice(0, 10),
        annotazioni: (x.sedute_annotazioni || []).filter((a) => !a.nascosta).length, commenti: (x.sedute_commenti || []).length }));
    }

    case "dettaglio_seduta": {
      if (ctx.agente !== "ares") return "Strumento riservato agli istruttori.";
      const id = String(input.id || "");
      if (!/^[0-9a-f-]{36}$/i.test(id)) return "Id seduta non valido: leggilo da le_mie_sedute.";
      const { data: se, error } = await db.from("sedute").select("id, titolo, note, stato, inviata_il, created_at, trainer_cavalli(nome, cavaliere)").eq("id", id).eq("trainer_id", userId).maybeSingle();
      if (error || !se) return "Seduta non trovata.";
      const [an, co] = await Promise.all([
        db.from("sedute_annotazioni").select("t_sec, tipo, testo, created_at").eq("seduta_id", id).eq("nascosta", false).order("t_sec", { ascending: true }).limit(60),
        db.from("sedute_commenti").select("testo, autore_id, created_at").eq("seduta_id", id).order("created_at", { ascending: true }).limit(40)]);
      return { titolo: se.titolo, stato: se.stato, cavallo: se.trainer_cavalli?.nome || null, cavaliere: se.trainer_cavalli?.cavaliere || null, note: se.note || null,
        annotazioni: (an.data || []).map((a) => ({ secondo: Math.round(Number(a.t_sec) * 10) / 10, tipo: a.tipo, testo: a.testo || null })),
        commenti: (co.data || []).map((c) => ({ di: c.autore_id === userId ? "istruttore" : "proprietario", testo: c.testo, il: (c.created_at || "").slice(0, 10) })) };
    }

    case "cavalli_seguiti": {
      if (ctx.agente !== "ares") return "Strumento riservato agli istruttori.";
      const { data, error } = await db.from("trainer_cavalli").select("id, nome, cavaliere, note, horse_id, sedute(id)").eq("trainer_id", userId).is("archiviato_il", null).order("created_at", { ascending: false }).limit(60);
      if (error) return "Errore nel leggere i cavalli seguiti.";
      const { data: coll } = await db.from("trainer_collegamenti").select("horse_id, stato").eq("trainer_id", userId);
      const stato = Object.fromEntries((coll || []).map((k) => [k.horse_id, k.stato]));
      const testo = { attivo: "collegato: il proprietario riceve le sedute", da_confermare_proprietario: "in attesa che il proprietario accetti", da_confermare_trainer: "invito del proprietario da accettare", revocato: "collegamento chiuso" };
      return (data || []).map((c) => ({ nome: c.nome, cavaliere: c.cavaliere || null, note: c.note || null, collegamento: c.horse_id ? (testo[stato[c.horse_id]] || "da collegare") : "non collegato a un cavallo Equo", sedute: (c.sedute || []).length }));
    }

    case "agenda": {
      const da = isoValida(input.da) ? input.da : oggiISO();
      const a = isoValida(input.a) ? input.a : aggiungiGiorni(da, 7);
      const { data, error } = await db.from("interventi_mascalcia").select(SEL_INTERVENTO).eq("maniscalco_id", userId).not("stato", "in", "(rifiutato,annullato)")
        .gte("data_intervento", da).lte("data_intervento", a).order("data_intervento", { ascending: true }).order("ora", { ascending: true, nullsFirst: false }).limit(200);
      if (error) return "Errore nel leggere l'agenda.";
      return { periodo: { da, a }, appuntamenti: (data || []).map(rigaIntervento) };
    }

    case "richieste_da_confermare": {
      const { data, error } = await db.from("interventi_mascalcia").select(SEL_INTERVENTO).eq("maniscalco_id", userId).eq("stato", "richiesto").order("data_intervento", { ascending: true }).limit(50);
      if (error) return "Errore nel leggere le richieste.";
      return (data || []).length ? data.map(rigaIntervento) : "Nessuna richiesta da confermare.";
    }

    case "ferrature_scadute": {
      const fino = aggiungiGiorni(oggiISO(), Math.min(Math.max(Number(input.giorni_avanti) || 0, 0), 60));
      const { data, error } = await db.from("interventi_mascalcia").select(SEL_INTERVENTO).eq("maniscalco_id", userId).eq("stato", "fatto")
        .not("prossima_scadenza", "is", null).lte("prossima_scadenza", fino).order("data_intervento", { ascending: false }).limit(500);
      if (error) return "Errore nel leggere le scadenze.";
      if (!(data || []).length) return "Nessuna ferratura o pareggio scaduto.";
      const chiave = (i) => i.cavallo_cliente_id || "c:" + i.cliente_mascalcia_id;
      const clientiIds = [...new Set(data.map((i) => i.cliente_mascalcia_id))];
      const { data: tutti } = await db.from("interventi_mascalcia").select("id, cliente_mascalcia_id, cavallo_cliente_id, data_intervento, stato")
        .eq("maniscalco_id", userId).in("cliente_mascalcia_id", clientiIds).not("stato", "in", "(richiesto,rifiutato,proposto,annullato)");
      const visti = new Set(); const out = [];
      for (const i of data) {
        const k = chiave(i);
        if (visti.has(k)) continue; visti.add(k);
        if ((tutti || []).some((x) => x.id !== i.id && chiave(x) === k && x.data_intervento > i.data_intervento)) continue;
        const ritardo = Math.round((new Date(oggiISO() + "T12:00:00Z") - new Date(i.prossima_scadenza + "T12:00:00Z")) / 86400000);
        out.push({ cliente: i.clienti_mascalcia?.nome, cliente_su_equo: !!i.clienti_mascalcia?.cliente_user_id, cavallo: i.cavalli_clienti_mascalcia?.nome || null,
          ultimo_intervento: descrTipo(i), fatto_il: i.data_intervento, scadenza: i.prossima_scadenza, giorni_di_ritardo: ritardo > 0 ? ritardo : 0, stato: ritardo > 0 ? "SCADUTA" : "in scadenza" });
      }
      out.sort((x, y) => x.scadenza.localeCompare(y.scadenza));
      return out.length ? { oggi: oggiISO(), scadenze: out } : "Nessuna scadenza aperta: i cavalli scaduti hanno già un appuntamento successivo.";
    }

    case "incassi": {
      const da = isoValida(input.da) ? input.da : oggiISO().slice(0, 8) + "01";
      const a = isoValida(input.a) ? input.a : oggiISO();
      const { data, error } = await db.from("interventi_mascalcia").select(SEL_INTERVENTO).eq("maniscalco_id", userId).in("stato", ["fatto", "programmato"]).order("data_intervento", { ascending: false }).limit(2000);
      if (error) return "Errore nel leggere gli incassi.";
      const euro = (arr) => Math.round(arr.reduce((t, i) => t + Number(i.importo || 0), 0) * 100) / 100;
      const daSaldare = (data || []).filter((i) => i.stato === "fatto" && i.stato_pagamento !== "saldato");
      const perCliente = {};
      daSaldare.forEach((i) => { const n = i.clienti_mascalcia?.nome || "—"; (perCliente[n] = perCliente[n] || []).push(i); });
      const incassati = (data || []).filter((i) => i.stato === "fatto" && i.stato_pagamento === "saldato" && i.data_intervento >= da && i.data_intervento <= a);
      const programmati = (data || []).filter((i) => i.stato === "programmato");
      return {
        da_incassare_totale_euro: euro(daSaldare),
        da_incassare_per_cliente: Object.entries(perCliente).map(([cliente, arr]) => ({ cliente, totale_euro: euro(arr), interventi: arr.slice(0, 10).map(rigaIntervento) })).sort((x, y) => y.totale_euro - x.totale_euro).slice(0, 25),
        interventi_senza_importo: daSaldare.filter((i) => i.importo == null).length,
        incassato_nel_periodo: { da, a, euro: euro(incassati), interventi: incassati.length },
        programmati_previsti_euro: euro(programmati), programmati: programmati.length,
      };
    }

    case "proponi_appuntamento": {
      const { cliente, errore } = await risolviCliente(ctx, input.cliente);
      if (errore) return errore;
      if (!isoValida(input.data)) return "Data non valida: chiedila.";
      const tipo = TIPI_INTERVENTO.includes(input.tipo) ? input.tipo : "altro";
      if (tipo === "altro" && !input.tipo_altro) return "Chiedi che tipo di intervento è.";
      const cavalli = await cavalliCliente(ctx, cliente);
      let cavallo = null, nuovo_cavallo_nome = null;
      if (input.cavallo) {
        const t = trovaPerNome(cavalli, input.cavallo);
        if (t.length > 1) return `Più cavalli di ${cliente.nome} corrispondono a "${input.cavallo}": ${t.map((c) => c.nome).join(", ")}. Chiedi quale.`;
        if (t.length === 1) cavallo = t[0]; else nuovo_cavallo_nome = String(input.cavallo).trim().slice(0, 60);
      } else if (cavalli.length === 1) cavallo = cavalli[0];
      else if (cavalli.length > 1) return `${cliente.nome} ha più cavalli (${cavalli.map((c) => c.nome).join(", ")}): chiedi per quale.`;
      const ora = /^\d{1,2}:\d{2}$/.test(input.ora || "") ? input.ora.padStart(5, "0") : null;
      const importo = Number(input.importo) > 0 ? Math.round(Number(input.importo) * 100) / 100 : null;
      ctx.azioni.push({ tipo: "appuntamento", dati: { cliente_mascalcia_id: cliente.id, nome_cliente: cliente.nome, cavallo, nuovo_cavallo_nome,
        tipo, tipo_altro: tipo === "altro" ? String(input.tipo_altro).slice(0, 80) : null, data: input.data, ora, importo,
        stato_pagamento: input.pagato ? "saldato" : "da_saldare", note: (input.note || "").slice(0, 300) || null } });
      return `Scheda appuntamento per ${cliente.nome} mostrata, da confermare${nuovo_cavallo_nome ? ` (il cavallo "${nuovo_cavallo_nome}" non c'era: verrà aggiunto ai cavalli del cliente)` : ""}.`;
    }

    case "proponi_accetta_richiesta":
    case "proponi_rifiuta_richiesta": {
      const r = await interventoDelManiscalco(ctx, input.id);
      if (!r || r.stato !== "richiesto") return "Richiesta non trovata o già gestita: rileggi richieste_da_confermare e usa l'id giusto.";
      const dati = { id: r.id, cliente_mascalcia_id: r.cliente_mascalcia_id, nome_cliente: r.clienti_mascalcia?.nome || null, cliente_su_equo: !!r.clienti_mascalcia?.cliente_user_id,
        cavallo: r.cavalli_clienti_mascalcia?.nome || null, tipo_ferratura: r.tipo_ferratura, tipo_altro: r.tipo_altro, data_intervento: r.data_intervento,
        ora: r.ora ? String(r.ora).slice(0, 5) : null, note: r.note || null, gruppo_id: r.gruppo_id || null };
      if (nome === "proponi_rifiuta_richiesta") { ctx.azioni.push({ tipo: "rifiuta_richiesta", dati }); return "Scheda di rifiuto mostrata, da confermare."; }
      if (Number(input.importo) > 0) dati.importo = Math.round(Number(input.importo) * 100) / 100;
      dati.invia_riepilogo = !!input.invia_riepilogo;
      ctx.azioni.push({ tipo: "accetta_richiesta", dati });
      return "Scheda di conferma mostrata" + (dati.invia_riepilogo ? ": dopo la conferma si apre la chat con il PDF di riepilogo." : ".");
    }

    case "meteo": return await strumentoMeteo(input, ctx);

    case "naviga_verso": {
      const dest = String(input.destinazione || "").trim().slice(0, 150);
      if (!dest) return "Chiedi dove vuole andare.";
      if (ctx.azioni.some((x) => x.tipo === "naviga")) return "Scheda Naviga già mostrata in questa risposta.";
      if (ctx.ambito === "maniscalco") {
        const clienti = await clientiManiscalco(ctx);
        let trovati = trovaPerNome(clienti, dest);
        if (!trovati.length) {
          // per nome del cavallo
          const { data: cav } = await ctx.db.from("cavalli_clienti_mascalcia").select("cliente_mascalcia_id, nome").ilike("nome", `%${dest.replace(/[%_]/g, "")}%`).limit(10);
          const ids = [...new Set((cav || []).map((c) => c.cliente_mascalcia_id))];
          trovati = clienti.filter((c) => ids.includes(c.id));
        }
        if (!trovati.length) {
          ctx.azioni.push({ tipo: "naviga", dati: { nome: dest, indirizzo: null, ricerca: dest } });
          return `"${dest}" non è tra i clienti del maniscalco: scheda Naviga mostrata con ricerca per nome nelle mappe. Di' di controllare che sia il posto giusto; se intendeva un cliente, chiedigli il nome esatto.`;
        }
        if (trovati.length > 1) return `Più clienti corrispondono a "${dest}": ${trovati.slice(0, 6).map((c) => c.nome).join(", ")}. Chiedi quale.`;
        const c = trovati[0];
        let indirizzo = null;
        const { data: ci, error: eInd } = await ctx.db.from("clienti_mascalcia").select("indirizzo, centro_id").eq("id", c.id).maybeSingle();
        if (!eInd) indirizzo = (ci?.indirizzo || "").trim() || null;
        if (!indirizzo && ci?.centro_id) {
          const { data: st } = await ctx.db.rpc("pro_indirizzi_strutture");
          const r = (st || []).find((x) => x.cliente_id === c.id);
          if (r?.indirizzo) indirizzo = [r.indirizzo, [r.citta, r.provincia ? `(${r.provincia})` : ""].filter(Boolean).join(" ")].filter(Boolean).join(", ");
        }
        ctx.azioni.push({ tipo: "naviga", dati: { cliente_mascalcia_id: c.id, nome: c.nome, indirizzo } });
        return indirizzo ? `Scheda Naviga verso ${c.nome} (${indirizzo}) mostrata: il maniscalco la tocca e sceglie l'app di mappe.`
          : `Scheda Naviga verso ${c.nome} mostrata. Non c'è ancora un indirizzo: toccandola cerca il luogo e il maniscalco sceglie quello giusto, che resta salvato nella scheda del cliente.`;
      }
      // proprietario: scuderie collegate (solo nome e indirizzo), altrimenti ricerca per nome nelle mappe
      const { data: sc } = await ctx.db.rpc("prop_indirizzi_scuderie");
      const scuderie = sc || [];
      const generico = /^(la mia |il mio )?(scuderia|maneggio|centro( ippico)?|circolo)$/i.test(dest);
      let trovate = generico ? scuderie : trovaPerNome(scuderie, dest);
      if (generico && scuderie.length > 1) return `L'utente è collegato a più scuderie: ${scuderie.map((x) => x.nome).join(", ")}. Chiedi quale.`;
      if (trovate.length > 1) return `Più scuderie corrispondono a "${dest}": ${trovate.map((x) => x.nome).join(", ")}. Chiedi quale.`;
      if (trovate.length === 1) {
        const r = trovate[0];
        const indirizzo = r.indirizzo ? [r.indirizzo, [r.citta, r.provincia ? `(${r.provincia})` : ""].filter(Boolean).join(" ")].filter(Boolean).join(", ") : null;
        const ricerca = indirizzo ? null : [r.nome, r.citta].filter(Boolean).join(", ");
        ctx.azioni.push({ tipo: "naviga", dati: { nome: r.nome, indirizzo, ricerca } });
        return indirizzo ? `Scheda Naviga verso ${r.nome} (${indirizzo}) mostrata.` : `Scheda Naviga verso ${r.nome} mostrata: la scuderia non ha indicato l'indirizzo, quindi le mappe cercano per nome${r.citta ? " e città" : ""}. Suggerisci di controllare che sia il posto giusto.`;
      }
      if (generico) return "L'utente non è collegato a nessuna scuderia su Equo. Chiedigli il nome del posto, oppure spiega che può collegarsi alla sua scuderia con il codice invito.";
      ctx.azioni.push({ tipo: "naviga", dati: { nome: dest, indirizzo: null, ricerca: dest } });
      return `"${dest}" non è una scuderia collegata: scheda Naviga mostrata con ricerca per nome nelle mappe. Di' all'utente di controllare che sia il posto giusto.`;
    }

    case "proponi_promemoria": {
      const { cliente, errore } = await risolviCliente(ctx, input.cliente);
      if (errore) return errore;
      const testo = String(input.testo || "").trim().slice(0, 600);
      if (!testo) return "Scrivi il testo del messaggio.";
      if (ctx.azioni.filter((x) => x.tipo === "promemoria").length >= 8) return "Già 8 promemoria in questa risposta: fermati qui e dì al maniscalco che può chiederne altri.";
      ctx.azioni.push({ tipo: "promemoria", dati: { cliente_mascalcia_id: cliente.id, nome_cliente: cliente.nome, collegato: !!cliente.cliente_user_id, testo } });
      return cliente.cliente_user_id ? `Promemoria per ${cliente.nome} pronto da inviare in chat.` : `${cliente.nome} non è su Equo: la scheda permette di copiare il testo (e conviene invitarlo con il suo codice).`;
    }

    case "proponi_segna_saldato": {
      const ids = (Array.isArray(input.ids) ? input.ids : []).slice(0, 30);
      const righe = [];
      for (const id of ids) { const i = await interventoDelManiscalco(ctx, id); if (i && i.stato === "fatto" && i.stato_pagamento !== "saldato") righe.push(i); }
      if (!righe.length) return "Nessun intervento da saldare con questi id: rileggi incassi.";
      const totale = Math.round(righe.reduce((t, i) => t + Number(i.importo || 0), 0) * 100) / 100;
      ctx.azioni.push({ tipo: "saldato", dati: { ids: righe.map((i) => i.id), totale, righe: righe.map((i) => `${i.clienti_mascalcia?.nome || ""} · ${descrTipo(i)} del ${i.data_intervento}${i.importo != null ? " · € " + Number(i.importo).toFixed(2) : ""}`) } });
      return `Scheda "segna come saldato" (${righe.length} interventi, € ${totale.toFixed(2)}) mostrata, da confermare.`;
    }

    case "proponi_promemoria_personale": {
      const testo = String(input.testo || "").replace(/\s+/g, " ").trim().slice(0, 300);
      if (!testo) return "Manca cosa ricordare: chiedilo.";
      if (!isoValida(input.data)) return "Data non valida: chiedila.";
      const ora = /^\d{1,2}:\d{2}$/.test(input.ora || "") ? String(input.ora).padStart(5, "0") : "08:00";
      const adesso = new Date().toLocaleString("sv-SE", { timeZone: "Europe/Rome" }).slice(0, 16).replace(" ", "T");
      if (`${input.data}T${ora}` <= adesso) return `Il ${input.data} alle ${ora} è già passato (adesso è ${adesso.replace("T", " ")}): proponi un'ora futura.`;
      let cliente = null;
      if (input.cliente) { const r = await risolviCliente(ctx, input.cliente); if (r.errore) return r.errore; cliente = r.cliente; }
      const azione = ["conto", "chat", "naviga"].includes(input.azione) && cliente ? input.azione : null;
      if (ctx.azioni.filter((x) => x.tipo === "promemoria_personale").length >= 5) return "Già 5 promemoria in questa risposta: fermati qui.";
      ctx.azioni.push({ tipo: "promemoria_personale", dati: { testo, data: input.data, ora, cliente_mascalcia_id: cliente?.id || null, nome_cliente: cliente?.nome || null, azione } });
      return `Scheda promemoria (${input.data} ore ${ora}) mostrata, da confermare. Quando confermato, all'ora giusta scrivi tu qui in chat e arriva la notifica.`;
    }

    case "i_miei_promemoria": {
      const da = new Date(Date.now() - 7 * 86400000).toISOString();
      const { data, error } = await db.from("promemoria_personali").select("id, testo, quando, stato, azione, clienti_mascalcia(nome)")
        .eq("user_id", userId).neq("stato", "annullato").or(`stato.eq.attivo,fatto_il.gte.${da}`).order("quando", { ascending: true }).limit(40);
      if (error) return "Promemoria non disponibili (funzione appena aggiunta: riprova dopo l'aggiornamento).";
      if (!(data || []).length) return "Nessun promemoria personale.";
      return data.map((p) => ({ id: p.id, testo: p.testo, quando: new Date(p.quando).toLocaleString("it-IT", { timeZone: "Europe/Rome", weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
        stato: p.stato === "attivo" ? "da fare" : "fatto", cliente: p.clienti_mascalcia?.nome || null, azione: p.azione || null }));
    }

    case "proponi_conto": {
      if (ctx.incassiNascosti) return "Incassi nascosti: non preparare conti.";
      const { cliente, errore } = await risolviCliente(ctx, input.cliente);
      if (errore) return errore;
      const { data: lav, error } = await db.from("interventi_mascalcia").select("id, importo")
        .eq("maniscalco_id", userId).eq("stato", "fatto").neq("stato_pagamento", "saldato")
        .or(`cliente_mascalcia_id.eq.${cliente.id},luogo_cliente_id.eq.${cliente.id}`).limit(1000);
      if (error) return "Errore nel leggere i lavori del cliente.";
      const ids = (lav || []).map((i) => i.id);
      let usati = new Set();
      if (ids.length) {
        const { data: righe } = await db.from("conti_mascalcia_righe").select("intervento_id, conti_mascalcia!inner(stato)").in("intervento_id", ids).neq("conti_mascalcia.stato", "annullato");
        usati = new Set((righe || []).map((r) => r.intervento_id));
      }
      const liberi = (lav || []).filter((i) => !usati.has(i.id));
      const totale = Math.round(liberi.reduce((t, i) => t + Number(i.importo || 0), 0) * 100) / 100;
      const { data: aperti } = await db.from("conti_mascalcia").select("id, anno, numero, totale, n_lavori, creato_il").eq("maniscalco_id", userId).eq("cliente_mascalcia_id", cliente.id).eq("stato", "da_incassare").order("creato_il");
      const conti = (aperti || []).map((c) => ({ id: c.id, codice: `C-${c.anno}-${String(c.numero).padStart(3, "0")}`, totale: Number(c.totale || 0), n_lavori: c.n_lavori, creato_il: String(c.creato_il).slice(0, 10) }));
      ctx.azioni.push({ tipo: "conto", dati: { cliente_mascalcia_id: cliente.id, nome_cliente: cliente.nome, n_liberi: liberi.length, totale_liberi: totale, senza_importo: liberi.filter((i) => i.importo == null).length, aperti: conti } });
      return { cliente: cliente.nome, lavori_da_mettere_in_conto: liberi.length, totale_euro: totale, conti_gia_fatti_da_incassare: conti,
        nota: "Scheda mostrata: «Fai il conto» apre il foglio già sul cliente (lì può togliere i cavalli che non vuole), «Apri il conto» apre un conto già fatto per rimandarlo o segnarlo pagato." };
    }

    case "riferisci_ai_boss": {
      const tipo = ["problema", "richiesta", "idea", "domanda"].includes(input.tipo) ? input.tipo : "richiesta";
      const riassunto = String(input.riassunto || "").trim().slice(0, 1000);
      if (!riassunto) return "Manca il riassunto della richiesta.";
      if ((ctx._segnalate || 0) >= 2) return "Hai già girato due segnalazioni in questa risposta: basta così.";
      const { count } = await ctx.admin.from("segnalazioni_boss").select("id", { count: "exact", head: true })
        .eq("user_id", userId).gte("created_at", new Date(Date.now() - 86400000).toISOString());
      if ((count || 0) >= 10) return "Oggi sono già arrivate molte segnalazioni da questo utente: di' che i Boss le stanno già guardando e non girarne altre.";
      const { error } = await ctx.admin.from("segnalazioni_boss").insert({
        user_id: userId, agente: ctx.agente, vista: ctx.vista, centro_id: ctx.centroId || null, tipo, riassunto,
        parole_utente: String(input.parole_utente || "").trim().slice(0, 2000) || null,
        dettagli: String(input.dettagli || "").trim().slice(0, 2000) || null,
        contesto: ctx.contestoConversazione || null,
      });
      if (error) { console.error("riferisci_ai_boss:", error); return "Non sono riuscito a girarla: dillo all'utente e suggerisci di scrivere a gestione.equo@gmail.com."; }
      ctx._segnalate = (ctx._segnalate || 0) + 1;
      return "Girata ai Boss: riceveranno una email. Conferma all'utente che la risposta arriverà qui in chat, senza promettere tempi.";
    }

    case "le_mie_segnalazioni": {
      const { data, error } = await db.from("segnalazioni_boss").select("tipo, riassunto, stato, risposta, created_at, risposta_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(10);
      if (error) return "Errore nel leggere le segnalazioni.";
      if (!(data || []).length) return "Nessuna segnalazione girata ai Boss finora.";
      return data.map((x) => ({ tipo: x.tipo, riassunto: x.riassunto, inviata_il: x.created_at.slice(0, 10),
        stato: x.stato === "risposta" ? "i Boss hanno risposto" : x.stato === "chiusa" ? "chiusa" : "in attesa di risposta", risposta: x.risposta || null }));
    }

    default:
      return "Strumento sconosciuto.";
  }
}

// Prova gratuita di un agente extra: 1 giorno e 10 messaggi (si avvia dal gestionale, vedi SQL schema-agenti-prezzi-prove)

module.exports = { eseguiStrumento };
