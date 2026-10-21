/* ---------- LEGALE (Privacy / Cookie / Termini) ----------
   Testi completi anche in claude/equo-informativa-privacy.md, equo-cookie-policy.md,
   equo-termini-condizioni.md nel progetto — qui la versione mobile, adattata per lo schermo. */
const LEGAL_CONTENT = {
  privacy: `
    <h3>Informativa Privacy (artt. 13-14 GDPR)</h3>
    <p><strong>Titolare</strong>: Lo Sportivo di Lucchini Simone — Via Rocco Dolce 4, 00034 Colleferro (RM) — P.IVA IT17742111002 — PEC simone.lucchini@pec.it — gestione.equo@gmail.com</p>
    <h3>Quali dati raccogliamo</h3>
    <ul>
      <li>Dati account: nome, email, password (Supabase Auth), foto profilo</li>
      <li>Dati del cavallo: nome, razza, eventi sanitari (vaccini, Coggins, ferrature, sverminazioni) — riguardano l'animale, non sono "dati particolari" ex art. 9 GDPR</li>
      <li>Spese di mantenimento e dati per ricevere pagamenti (mai numeri di carta in chiaro)</li>
      <li>Dati professionali (categoria, clienti) per maniscalchi/veterinari/istruttori</li>
      <li>Messaggi di chat (testo, note vocali, foto, video)</li>
      <li>Dati di pagamento abbonamento, gestiti da Stripe</li>
      <li>Dati tecnici e cookie (vedi tab Cookie)</li>
    </ul>
    <h3>Perché li trattiamo</h3>
    <p>Per erogarti il servizio richiesto ed eseguire il contratto (account, reminder, assistente AI, pagamenti), per obblighi di legge (fatturazione), con il tuo consenso per marketing/newsletter, e per legittimo interesse nella prevenzione di abusi.</p>
    <h3>Con chi condividiamo i dati</h3>
    <p>Fornitori che trattano dati per nostro conto (responsabili ex art. 28 GDPR): Supabase (database, UE-Frankfurt), Resend (email), Anthropic/Claude API (assistente AI), Stripe (pagamenti), Netlify (hosting). Non vendiamo i tuoi dati a terzi.</p>
    <h3>Conservazione</h3>
    <p>I dati restano attivi finché mantieni l'account. Se lo cancelli, restano recuperabili per 30 giorni (periodo di grazia), poi vengono eliminati definitivamente, salvo obblighi fiscali (10 anni).</p>
    <h3>I tuoi diritti</h3>
    <p>Accesso, rettifica, cancellazione, limitazione, portabilità, opposizione, revoca del consenso: scrivi a gestione.equo@gmail.com. Hai diritto di reclamo al Garante Privacy (garanteprivacy.it).</p>
    <h3>Minori</h3>
    <p>Sotto i 14 anni serve l'autorizzazione di un genitore/tutore, dichiarata in fase di registrazione.</p>
    <p class="legal-note">Versione completa: doc "Informativa Privacy" nel progetto Equo.</p>
  `,
  cookie: `
    <h3>Cookie Policy</h3>
    <h3>Cookie tecnici (nessun consenso richiesto)</h3>
    <ul>
      <li>Sessione di autenticazione (Supabase Auth)</li>
      <li>Preferenza di consenso cookie (12 mesi)</li>
      <li>Cookie di sicurezza/anti-frode</li>
    </ul>
    <h3>Cookie di analytics — Google Analytics (richiede consenso)</h3>
    <p>Usiamo Google Analytics per statistiche d'uso aggregate. Non è un cookie tecnico: rientra tra i cookie di misurazione che richiedono il tuo consenso esplicito e preventivo (linee guida Garante Privacy 2021). Lo script si carica solo se scegli "Accetta" nel banner. Dati trattati anche da Google Ireland Ltd, con trasferimento extra-UE su base Clausole Contrattuali Standard. Durata: fino a 14 mesi.</p>
    <h3>Come gestire il consenso</h3>
    <p>Puoi cambiare scelta in qualsiasi momento da qui sotto.</p>
    <div style="display:flex;gap:8px;margin-top:10px">
      <button class="btn btn-outline btn-sm" style="flex:1" onclick="reopenCookieBanner()">Rivedi la scelta sui cookie</button>
    </div>
    <p class="legal-note" style="margin-top:14px">Versione completa: doc "Cookie Policy" nel progetto Equo.</p>
  `,
  termini: `
    <h3>Termini e Condizioni di Servizio</h3>
    <p><strong>Fornitore</strong>: Lo Sportivo di Lucchini Simone — P.IVA IT17742111002 — gestione.equo@gmail.com</p>
    <h3>Il servizio</h3>
    <p>Equo comprende l'app proprietari (libretto sanitario, spese, chat, assistente AI), l'app professionisti e Equo Scuderia. Il servizio è fornito "così com'è" ed è in evoluzione continua.</p>
    <h3>Account e minori</h3>
    <p>Sei responsabile della riservatezza delle tue credenziali. Sotto i 14 anni serve l'autorizzazione di un genitore/tutore, dichiarata in registrazione.</p>
    <h3>Piani, pagamento e disdetta</h3>
    <p>I pagamenti sono gestiti da Stripe. Gli abbonamenti si rinnovano automaticamente salvo disdetta, sempre disponibile con un click dal menu ("Torna a Free"), con effetto dal rinnovo successivo. Se sei un consumatore, hai diritto di recesso entro 14 giorni dal primo acquisto (salvo utilizzo immediato del servizio digitale già iniziato).</p>
    <h3>Cancellazione account</h3>
    <p>Puoi chiedere la cancellazione in ogni momento. I dati restano recuperabili 30 giorni, poi vengono eliminati definitivamente.</p>
    <h3>Assistente AI — limiti</h3>
    <p>L'assistente (Claude API) fornisce supporto informativo e gestionale. Può commettere errori e <strong>non sostituisce il parere di un veterinario, maniscalco o altro professionista qualificato</strong>. Le operazioni sull'app richiedono sempre la tua conferma.</p>
    <h3>Uso corretto</h3>
    <p>Non usare Equo per contenuti illeciti, spam, o per accedere senza autorizzazione a dati di altri utenti.</p>
    <h3>Legge applicabile</h3>
    <p>Legge italiana. Per i consumatori, foro competente quello di residenza/domicilio; altrimenti Foro di Roma.</p>
    <p class="legal-note">Versione completa: doc "Termini e Condizioni" nel progetto Equo.</p>
  `,
};

function openLegalPage(tab){
  document.getElementById("legal-body").innerHTML = LEGAL_CONTENT[tab] || "";
  ["privacy","cookie","termini"].forEach(t => {
    document.getElementById("legal-tab-" + t).classList.toggle("active", t === tab);
  });
  document.getElementById("legal-overlay").classList.add("active");
  document.getElementById("legal-body").scrollTop = 0;
}

function closeLegalPage(){
  document.getElementById("legal-overlay").classList.remove("active");
}

