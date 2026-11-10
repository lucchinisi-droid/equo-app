// Equo · agenti AI · ATHENA NELLA CONFIGURAZIONE GUIDATA della scuderia (blocco B3, 10/11/2026)
// Athena spiega il passo in corso (modalità B) e, quando l'utente scrive i dati a parole, PROPONE i valori dei campi
// (modalità C): l'app li mostra evidenziati e li salva solo quando l'utente conferma, con le stesse funzioni dei moduli.
// L'AI non scrive mai nel database. Bonus: 30 messaggi per scuderia, contati a parte (chiave «…:athena:config»).

const BONUS_CONFIGURAZIONE = 30;
const PASSI = {
  1: { titolo: "Il tuo maniscalco", campi: { codice: "codice o link d'invito del maniscalco (es. EQUOPRO1A2B3C)" } },
  2: { titolo: "Dati della struttura", campi: { nome: "nome della struttura", telefono: "telefono", indirizzo: "via e numero", citta: "città", provincia: "sigla provincia (2 lettere)", email: "email", forma_giuridica: "una tra asd, ssd, ditta_individuale, societa_agricola, snc, sas, srl, srls, spa, associazione, altro" } },
  3: { titolo: "ASD e amministrazione", campi: { asd: "true se è (o ha) un'ASD/SSD, false se no", asd_nome: "denominazione", asd_cf: "codice fiscale", asd_sede: "sede legale", asd_rasd: "numero RASD", asd_affiliazioni: "affiliazioni (FISE, enti…)", asd_quota: "quota associativa annuale in euro (numero)" } },
  4: { titolo: "Collaboratori", campi: {} },
  5: { titolo: "Box e paddock", campi: { box_totali: "numero totale di box (intero 0-100)", paddock: "elenco di paddock [{nome, capienza}] con capienza 1-60" } },
  6: { titolo: "Il primo cavallo", campi: { nome: "nome del cavallo", categoria: "pensione, mezza_pensione, proprieta o soci", razza: "razza", sesso: "femmina, castrone o stallone", data_nascita: "YYYY-MM-DD", microchip: "microchip", proprietario: "nome e cognome del proprietario" } },
  7: { titolo: "Il primo proprietario", campi: { proprietario_nome: "nome e cognome", telefono: "telefono", email: "email", cavallo: "nome del cavallo da collegare" } },
  8: { titolo: "La prima lezione", campi: { data: "YYYY-MM-DD (da oggi in poi)", ora: "HH:MM", allievo: "nome dell'allievo", cavallo: "nome del cavallo", istruttore: "nome dell'istruttore" } },
  9: { titolo: "Il primo incasso", campi: { cliente: "nome del cliente che ha pagato", importo: "euro (numero)", metodo: "contanti, bonifico, pos, assegno o altro", data: "YYYY-MM-DD (oggi o passata)", causale: "causale", cassa: "scuderia o asd" } },
  10: { titolo: "Riepilogo", campi: {} },
};

function istruzioniConfigurazione(passo, contesto) {
  const p = PASSI[passo] || PASSI[1];
  const campi = Object.entries(p.campi).map(([k, d]) => `  - ${k}: ${d}`).join("\n");
  return `Sei ATHENA, la segretaria di Equo Scuderia, e stai guidando il responsabile nella CONFIGURAZIONE della sua scuderia.
È al passo ${passo} di 10: «${p.titolo}».
${contesto ? "Cosa vede ora nel passo (dati dell'app):\n" + contesto + "\n" : ""}
COME RISPONDI
- In italiano, brevissima: 1-3 frasi, tono caldo e pratico, come in un fumetto. Niente elenchi lunghi, niente tabelle.
- Rispondi solo su questo passo e sulla configurazione; per il resto di' che se ne parla dopo, nella chat di Athena.
- Mai inventare dati: usa SOLO quello che l'utente ha scritto. Se manca qualcosa di necessario, chiedilo.
- Non dire mai che hai salvato: i dati si salvano solo quando l'utente tocca «Conferma».
${campi ? `COMPILAZIONE ASSISTITA
Quando l'utente scrive dati per questo passo, chiama proponi_campi con SOLO i campi che ha detto davvero:
${campi}
Poi scrivi una riga tipo «Ho compilato i campi in verde: controlla e conferma.»` : "In questo passo non ci sono campi da compilare: spiega e incoraggia."}
Salute dei cavalli: non è materia della configurazione; per sintomi o emergenze la prima frase è «Chiama subito il veterinario».`;
}

const STRUMENTI_CONFIGURAZIONE = [
  { name: "proponi_campi", description: "Propone i valori dei campi del passo corrente della configurazione. L'app li mostra evidenziati e li salva solo dopo la conferma dell'utente. Usa solo dati scritti dall'utente.",
    input_schema: { type: "object", properties: { campi: { type: "object", description: "Coppie campo → valore, solo tra i campi elencati nelle istruzioni del passo." } }, required: ["campi"] } },
];

// pulisce la proposta: solo i campi del passo, valori brevi e del tipo giusto
function eseguiConfigurazione(nome, input, ctx) {
  if (nome !== "proponi_campi") return null;
  const p = PASSI[ctx.configurazione?.passo] || null;
  if (!p || !Object.keys(p.campi).length) return "In questo passo non ci sono campi da compilare.";
  const out = {};
  for (const [k, v] of Object.entries((input && input.campi) || {})) {
    if (!(k in p.campi) || v == null || v === "") continue;
    if (k === "paddock") {
      if (Array.isArray(v)) out.paddock = v.slice(0, 12).map((x) => ({ nome: String(x?.nome || "").slice(0, 40), capienza: Math.max(1, Math.min(60, parseInt(x?.capienza, 10) || 0)) })).filter((x) => x.nome && x.capienza);
    } else if (k === "asd") out.asd = v === true || v === "true" || v === "si" || v === "sì";
    else if (["box_totali"].includes(k)) { const n = parseInt(v, 10); if (n >= 0 && n <= 100) out[k] = n; }
    else if (["importo", "asd_quota"].includes(k)) { const n = Math.round(Number(String(v).replace(",", ".")) * 100) / 100; if (n >= 0) out[k] = n; }
    else out[k] = String(v).trim().slice(0, 200);
  }
  if (!Object.keys(out).length) return "Nessun campo valido da proporre: chiedi all'utente i dati che mancano.";
  ctx.azioni.push({ tipo: "conf_campi", dati: { passo: ctx.configurazione.passo, campi: out } });
  return "Campi proposti e mostrati evidenziati: l'utente deve controllarli e confermare.";
}

module.exports = { BONUS_CONFIGURAZIONE, PASSI_CONFIGURAZIONE: PASSI, STRUMENTI_CONFIGURAZIONE, eseguiConfigurazione, istruzioniConfigurazione };
