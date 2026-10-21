/* ---------- LEGALE (Privacy / Cookie / Termini) ----------
   Testi completi in claude/equo-informativa-privacy.md, equo-cookie-policy.md,
   equo-termini-condizioni.md nel progetto Equo — qui la versione per il gestionale. */
const LEGAL_CONTENT = {
  privacy: `
    <h3>Informativa Privacy (artt. 13-14 GDPR)</h3>
    <p><strong>Titolare</strong>: Lo Sportivo di Lucchini Simone — Via Rocco Dolce 4, 00034 Colleferro (RM) — P.IVA IT17742111002 — PEC simone.lucchini@pec.it — gestione.equo@gmail.com</p>
    <h3>Quali dati raccogliamo</h3>
    <ul>
      <li>Dati account: nome, email, password (Supabase Auth)</li>
      <li>Dati del centro: nome, indirizzo, telefono, membri del team, dati societari/pagamento se inseriti</li>
      <li>Dati dei clienti del centro: proprietari, cavalli, lezioni, pacchetti, comunicazioni interne</li>
      <li>Dati tecnici e cookie (vedi tab Cookie)</li>
    </ul>
    <h3>Perché li trattiamo</h3>
    <p>Per erogarti il servizio richiesto ed eseguire il contratto (gestione centro, team, clienti), per obblighi di legge (fatturazione), con il tuo consenso per marketing/newsletter.</p>
    <h3>Ruolo del centro come titolare dei dati dei propri clienti</h3>
    <p>Equo fornisce lo strumento; i dati di proprietari/allievi/cavalli inseriti nel gestionale restano sotto la responsabilità del centro che li inserisce, che ne è titolare nei confronti dei propri clienti. Equo agisce come responsabile del trattamento (art. 28 GDPR) per questi dati.</p>
    <h3>Con chi condividiamo i dati</h3>
    <p>Fornitori che trattano dati per nostro conto: Supabase (database, UE-Frankfurt), Resend (email), Netlify (hosting), Stripe (pagamenti abbonamento). Non vendiamo i tuoi dati a terzi.</p>
    <h3>Conservazione</h3>
    <p>I dati restano attivi finché mantieni l'account. Se lo cancelli, restano recuperabili per 30 giorni, poi vengono eliminati definitivamente, salvo obblighi fiscali (10 anni).</p>
    <h3>I tuoi diritti</h3>
    <p>Accesso, rettifica, cancellazione, limitazione, portabilità, opposizione, revoca del consenso: scrivi a gestione.equo@gmail.com. Hai diritto di reclamo al Garante Privacy (garanteprivacy.it).</p>
    <p class="legal-note">Versione completa: doc "Informativa Privacy" nel progetto Equo.</p>
  `,
  cookie: `
    <h3>Cookie Policy</h3>
    <h3>Cookie tecnici (nessun consenso richiesto)</h3>
    <ul>
      <li>Sessione di autenticazione (Supabase Auth)</li>
      <li>Preferenza di consenso cookie</li>
      <li>Cookie di sicurezza/anti-frode</li>
    </ul>
    <h3>Cookie di analytics — Google Analytics (richiede consenso)</h3>
    <p>Usiamo Google Analytics per statistiche d'uso aggregate. Non è un cookie tecnico: richiede il tuo consenso esplicito e preventivo (linee guida Garante Privacy 2021). Lo script si carica solo se scegli "Accetta". Dati trattati anche da Google Ireland Ltd, con trasferimento extra-UE su base Clausole Contrattuali Standard.</p>
    <h3>Come gestire il consenso</h3>
    <div style="display:flex;gap:8px;margin-top:10px">
      <button class="btn btn-outline btn-sm" style="flex:1" onclick="reopenCookieBanner()">Rivedi la scelta sui cookie</button>
    </div>
    <p class="legal-note" style="margin-top:14px">Versione completa: doc "Cookie Policy" nel progetto Equo.</p>
  `,
  termini: `
    <h3>Termini e Condizioni di Servizio</h3>
    <p><strong>Fornitore</strong>: Lo Sportivo di Lucchini Simone — P.IVA IT17742111002 — gestione.equo@gmail.com</p>
    <h3>Il servizio</h3>
    <p>Equo Scuderia è il gestionale per centri ippici, maneggi e scuderie: cavalli, lezioni, pacchetti/abbonamenti, team e comunicazioni. Il servizio è fornito "così com'è" ed è in evoluzione continua.</p>
    <h3>Account, centro e team</h3>
    <p>Chi crea un centro ne è amministratore ed è responsabile dei dati inseriti e della gestione del team (istruttori, veterinari, maniscalchi, allievi) invitato tramite codice. L'amministratore può rimuovere membri e gestire i permessi.</p>
    <h3>Piani, pagamento e disdetta</h3>
    <p>I pagamenti sono gestiti da Stripe. Gli abbonamenti si rinnovano automaticamente salvo disdetta. Se sei un consumatore o comunque hai diritto di recesso, questo è di 14 giorni dal primo acquisto (salvo utilizzo immediato del servizio digitale già iniziato).</p>
    <h3>Cancellazione account</h3>
    <p>Puoi chiedere la cancellazione in ogni momento. I dati restano recuperabili 30 giorni, poi vengono eliminati definitivamente.</p>
    <h3>Uso corretto</h3>
    <p>Non usare Equo Scuderia per contenuti illeciti, spam, o per accedere senza autorizzazione a dati di altri centri o utenti. L'amministratore è responsabile della liceità dei dati che inserisce sui propri clienti (vedi Informativa Privacy).</p>
    <h3>Legge applicabile</h3>
    <p>Legge italiana. Per i consumatori, foro competente quello di residenza/domicilio; altrimenti Foro di Roma.</p>
    <p class="legal-note">Versione completa: doc "Termini e Condizioni" nel progetto Equo.</p>
  `,
};

function openLegalPage(tab){
  document.getElementById("legal-body").innerHTML = LEGAL_CONTENT[tab] || "";
  ["privacy","cookie","termini"].forEach(t => {
    document.getElementById("legal-tab-" + t).classList.toggle("legal-tab-active", t === tab);
  });
  openModal("modal-legal");
  document.getElementById("legal-body").scrollTop = 0;
}

