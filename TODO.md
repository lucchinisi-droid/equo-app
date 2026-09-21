# Equo — Roadmap di lancio

Ordine di priorità per arrivare da "codebase pronta" a "prodotto live e testabile".

**Nota struttura progetto**: il repo contiene DUE deploy separati sullo stesso account Netlify (gestione.equo@gmail.com):
- root (`src/app/`) → landing page Next.js → **https://equo-land.netlify.app**
- `equo-app/` → Web App / PWA single-file (stile Classly) → **https://equo-app.netlify.app**

## 1. Landing Page ✅
- [x] Struttura landing (`src/app/page.tsx`) con hero, feature, waitlist form
- [x] API `/api/waitlist` (salva su Supabase + email conferma Resend)
- [x] Rifinire copy, logo, sezioni Equo App / Equo Scuderia separate per gerarchia
- [x] Sezione "Come funziona Equo Scuderia" con foto+descrizione
- [x] WaitlistForm a doppio banner (proprietario / scuderia) senza scelta manuale
- [x] Deploy su Netlify (account gestione.equo@gmail.com) — **equo-land.netlify.app** live
- [ ] Verifica responsive reale su dispositivo (solo verificato via codice finora)

## 2. Equo App (PWA) — stato attuale
- [x] Scheletro completo stile Classly (auth, bottom nav, modali)
- [x] Demo mode (in-memory) per testare senza account
- [x] Icone SVG eleganti + logo ufficiale + icona cavallo (Font Awesome horse-head)
- [x] Menù profilo: dark mode, metodi di pagamento (carta/PayPal/IBAN, no numeri carta salvati), accesso Google
- [x] AI spostata da tab a pulsante flottante (chat a mezzo schermo)
- [x] Bottom nav: Home - Cavalli - Calendario - Spese
- [x] AI può PROPORRE eventi sanitari (vaccino/coggins/ferratura/sverminazione) via tool-use Claude, con conferma utente obbligatoria prima del salvataggio — implementato anche in demo mode
- [x] **AI collegata davvero** (era dietro un pulsante "presto disponibile"): FAB ora apre la chat reale per proprietari e professionisti, con limite mensile 5 msg Free / 500 msg Premium (contatore in chat, reset automatico a fine mese, CTA upgrade al limite) — commit 412f5f0
- [x] Deploy su Netlify (secondo sito, base directory `equo-app`) — **equo-app.netlify.app** live, reso pubblico
- [x] `ANTHROPIC_API_KEY` configurata su Netlify (sito equo-app) — chiave dedicata a Equo (organizzazione Anthropic separata). **Resta da fare**: aggiungere credito sulla console Anthropic (piano Free non esegue chiamate reali), poi verificare con un test end-to-end
- [x] SQL contatore messaggi AI eseguita su Supabase + push in produzione — confermato 20/09/2026
- [ ] Test navigazione completa con un utente reale end-to-end (login vero, non demo)
- [ ] Upload foto cavallo + documenti sanitari (Supabase Storage) — non ancora implementato
- [ ] Pagina profilo utente / impostazioni scuderia
- [ ] Playlist Spotify Equo: creare playlist pubblica (account gestione.equo@gmail.com), integrare via embed ufficiale Spotify (iframe) — salvataggio/condivisione gestiti nativamente da Spotify, no OAuth/backend necessario
- [ ] Modulo Mascalcia (equo-app): Step 1-6 completati (doppio ruolo, nav pro/proprietario a 5 voci, profilo pro, calendario lezioni manuale, chat proprietario testo/vocali/foto/video, condivisione esterna con watermark) — **Step 7: Community in Equo Scuderia** (bacheca pubblica dei contenuti condivisi, tocca equo-scuderia non equo-app) ancora da fare, dettagli in claude/equo-app-mascalcia.md
- [x] Onboarding legale minimo (equo-app): checkbox unica Termini+Privacy+dichiarazione eta in onboarding (una sola volta per account), pagina in-app "Legale" (Privacy/Cookie/Termini), banner cookie Accetta/Rifiuta con Google Analytics gated dietro consenso, bottone Premium/Free finalmente collegato in UI (mancava), disclaimer AI sotto la chat — vedi commit 7cee147.
- [x] Migrazione SQL eseguita su Supabase (progetto equo-prod): colonne `consenso_termini_privacy`, `dichiarazione_eta`, `cancellazione_richiesta_at` su `profiles` — confermato 20/09/2026
- [x] SQL colonne `ai_msg_count`/`ai_msg_month` eseguita su Supabase — confermato 20/09/2026
- [x] Replicato su Equo Scuderia (checkbox onboarding condivisa via `profiles`, pagina Legale, cookie banner) — commit 75ecefc. Non replicati: bottone Premium/Free (Scuderia non ha ancora un campo piano/gating in UI) e disclaimer AI (la chat AI è ancora "SOON", nulla da disclaimare finché non è live)
- [x] **Blocco auto-Premium gratis**: "Passa a Premium" non scrive più `piano=premium` da solo — apre un'email precompilata per richiesta manuale (Stripe non ancora collegato). "Torna a Free" resta self-service. Commit ec7f2a7
- [x] **Eliminazione account (GDPR)**: bottone nel menu, richiesta salvata con 30gg di grazia, modale di riattivazione al login. La cancellazione DEFINITIVA dei dati dopo i 30gg **non è automatica** (nessun cron/Edge Function collegato) — per ora va fatta a mano da chi gestisce Equo quando arriva una richiesta scaduta. Solo su Equo App per ora, non ancora su Equo Scuderia. Commit ec7f2a7
- [x] **Deploy in produzione confermato** (equo-app.netlify.app + equo-scuderia) — push del 20/09/2026, tutti i commit sopra live
- [ ] Sostituire `GA_MEASUREMENT_ID` (placeholder "G-XXXXXXXXXX", in equo-app e equo-scuderia) con l'ID reale di Google Analytics 4, altrimenti GA non traccia nulla anche dopo consenso
- [ ] Replicare "Eliminazione account" (GDPR) anche su Equo Scuderia — al momento solo su Equo App

## 3. Infrastruttura
- [x] Account dedicati creati con gestione.equo@gmail.com (Supabase + Netlify, separati dagli altri progetti)
- [x] Progetto Supabase produzione **"equo-prod"** (regione Frankfurt/eu-central-1) — URL: `https://ncbdrhbpgdcaentoxlfz.supabase.co`
- [x] Schema creato: `profiles`, `horses`, `health_events`, `expenses`, `stables` + Row Level Security attivo su tutte + trigger auto-crea profilo alla registrazione
- [x] `SUPABASE_URL` / publishable key inseriti in `equo-app/index.html`
- [x] Repo Git remoto — github.com/lucchinisi-droid/equo-app (root = landing, `equo-app/` = PWA)
- [x] Deploy automatico su Netlify ad ogni push su master (due siti separati)
- [x] Visitor access impostato su Public per entrambi i siti (di default era privato sul nuovo team)
- [x] `ANTHROPIC_API_KEY` configurata su Netlify (sito equo-app) — v. sezione 2
- [x] `GEMINI_API_KEY` configurata su Netlify (sito equo-app) — in vista della voce Gemini Live (v. sezione 4bis), non ancora usata dal codice
- [x] `RESEND_API_KEY` configurata su Netlify (sito equo-app) — chiave dedicata `equo-prod` (scope "Sending access", non Full access), dominio email non ancora verificato (si usa `onboarding@resend.dev` finché non si aggiunge un dominio custom su Resend) — confermato 20/09/2026
  - [ ] **Idea da implementare**: email automatica di recupero carrello — intercettare l'evento webhook Stripe `checkout.session.expired` (sessione di checkout aperta ma non completata entro 24h) e mandare via Resend una mail con link diretto al checkout a chi ha cliccato "Passa a Premium" ma non ha concluso l'acquisto
- [ ] Configurare Supabase Storage (bucket foto cavalli e documenti PDF)
- [ ] Dominio custom (opzionale, per ora *.netlify.app)
- [ ] Quando si acquista equohub.com: aggiornare dominio custom su Netlify (equo-land + equo-app), redirect URI OAuth Google, Authorized JavaScript origins, e URL di callback Supabase con il nuovo dominio
- [x] **Stripe collegato davvero** (era skeleton non collegato): checkout reale mensile/annuale (proprietari + professionisti), Payment Link dedicati per i lifetime (150 posti prop, 50 posti pro, limite gestito nativamente da Stripe), webhook che attiva Premium, "Torna a Free" annulla davvero l'abbonamento su Stripe — commit 0be6ff1
  - [ ] **SQL da eseguire su Supabase**: `alter table profiles add column if not exists stripe_customer_id text; alter table profiles add column if not exists stripe_subscription_id text;`
  - [x] Webhook Stripe configurato (`equo-app`, endpoint `https://app.equohub.com/.netlify/functions/stripe-webhook`, eventi `checkout.session.completed` + `customer.subscription.deleted`) e `STRIPE_WEBHOOK_SECRET` impostata su Netlify — confermato 20/09/2026
  - [x] Verificato: nessuna imposta automatica su nessuno dei 6 prezzi/link — il cliente paga sempre esattamente il prezzo mostrato, IVA (se dovuta) già considerata inclusa
  - [ ] Account Stripe attualmente in modalità **Live** (non Test) — primi test di pagamento saranno reali, fare un acquisto di prova con importo minimo e poi rimborsarlo dalla dashboard Stripe
  - [ ] Verificare "Riscuoti le imposte automaticamente" (Stripe Tax) sui prodotti creati — se non configurato in Impostazioni → Tax potrebbe non calcolare l'IVA correttamente

## 4. Altro fondamentale prima del lancio
- [ ] **Monetizzazione**: definire piano free vs pro (limite cavalli? assistente AI limitato? export PDF a pagamento?) — nessuna feature senza logica di business
- [x] **Privacy & Cookie (equo-app + equo-scuderia)**: Privacy Policy, Cookie Policy, Termini di Servizio, cookie banner, diritto di cancellazione account — vedi sezione 2 sopra e doc `claude/equo-normativa-privacy.md`
  - [ ] Cookie banner su equo-land (landing) — non ancora fatto, solo su equo-app/equo-scuderia finora
- [ ] Analytics base (Plausible o simile)
- [x] Mappa servizi vicino a te implementata (OSM live + tabella `services` curata) — manca solo il seed iniziale, vedi SQL da eseguire su Supabase
- [ ] Seed iniziale tabella `services` (cliniche 24h, maneggi, negozi) — almeno la tua zona, inserimento manuale via Supabase dashboard
- [ ] Onboarding primo utente
- [ ] Test su dispositivi reali (iPad e Mac mini)
- [ ] Gestione/controllo email raccolte dalla waitlist (to-do aperto)
- [ ] Auto-renew dominio: verificare se attivarlo su Namecheap prima della scadenza

## 4bis. AI — agenti verticali e voce (idea da sviluppare, non ancora pianificata in dettaglio)
- [ ] Agenti AI con competenze verticali via tool-use Claude (stessa infrastruttura già in piedi per le proposte AI con conferma utente):
  - Proprietario: 1 agente esperto equestre + esecuzione procedure (allenamenti, appuntamenti, ecc.)
  - App professionisti: 1 agente specializzato per categoria (maniscalco/veterinario/istruttore) + procedure della sua categoria
  - Equo Scuderia: più agenti a scelta (Segretaria, Commercialista, Esperto Equestre...) — 1 incluso nel pack scelto alla prima configurazione, altri ADD-ON a pagamento → serve un modello "moduli/add-on acquistabili" per scuderia, non basta il flag free/premium binario attuale
- [ ] Conversazione vocale in tempo reale: Claude non ha (ad oggi, 18/09/2026) una Live API vocale pubblica per sviluppatori paragonabile a Gemini — solo Voice Mode nelle sue app consumer, non integrabile in Equo
  - Se si vuole voce nativa: valutare Gemini Live API (audio bidirezionale + function calling nella stessa sessione) come provider AI separato solo per quella funzione, oppure dettatura di sistema (STT del telefono) come alternativa a costo zero mantenendo tutto su Claude
  - Gemini Live/TTS usa lo stesso pacchetto di ~30 voci native (maschili/femminili) dell'app Gemini — nessuna differenza di qualità tra API e app
  - Nodo economico: audio in tempo reale costa molto più del testo — da gatare dietro Premium se implementato

## 4ter. Gamification — percorso a punti e badge (idea definita, da sviluppare — non ora, richiede tempo)

- [ ] **Percorso a 5 livelli con nome dal mondo equestre**, punti guadagnati con azioni reali nell'app (scheda cavallo completa, evento sanitario registrato in anticipo sulla scadenza, segnalazione maneggio, referral andato a buon fine, collegamento chat con un professionista, streak accessi settimanali):
  1. **Puledro** — 50 pt — badge profilo (costo zero, ripetibile)
  2. **Scudiero** — 120 pt — 50 messaggi AI extra (ripetibile)
  3. **Cavaliere** — 250 pt — 200 messaggi AI extra oppure 15% sconto sul prossimo rinnovo mensile (ripetibile)
  4. **Fantino** — 500 pt — 1 mese Premium gratis (**una tantum**, o max 1 volta ogni 6 mesi — NON ripetibile a piacere, altrimenti cannibalizza il ricavo abbonamenti)
  5. **Purosangue** — 1000 pt — 1 mese Premium gratis + badge permanente visibile pubblicamente (chat/profilo) + 20% sconto a vita sul rinnovo annuale (**una tantum**)
- [ ] Meccanica di riscatto: il badge raggiunto resta per sempre (bacheca trofei), al riscatto del premio l'utente sceglie tra "riparti da 0" (rifà lo stesso livello, solo per i livelli ripetibili 1-3) o "mantieni i punti e vai avanti" verso il livello successivo
- [ ] Schema dati da definire: tabella livelli (statica), progresso utente (punti correnti + livello max raggiunto), storico riscatti (per audit/anti-abuso sui livelli una tantum)
- [ ] **Non è priorità immediata** — rimandato a dopo il lancio, richiede tempo per essere sviluppato bene

## 5. Feature innovative (wow factor) — in ordine di priorità
- [ ] **1. QR Code passaporto emergenza** — richiede ampliare la scheda cavallo: genera QR univoco per cavallo, pagina pubblica read-only (senza login) con allergie, vaccinazioni, gruppo sanguigno, contatti proprietario, scansionabile da un veterinario in emergenza
- [ ] **2. Voice logging** — richiede creare nuova sezione "Diario Sanitario": nota vocale trascritta e strutturata via AI (Whisper/Claude), utile per loggare osservazioni a mani libere in scuderia
- [ ] **3. Body Condition Score via foto** — carichi foto del cavallo, l'AI (Claude vision) stima il punteggio di condizione corporea (scala 1-9) e segnala sovrappeso/sottopeso

---
**Prossimo step**: aggiungere credito sulla console Anthropic (piano Free non fa chiamate reali) — unico blocco rimasto prima di poter fare un test end-to-end reale della chat AI (Free e Premium) in produzione.
