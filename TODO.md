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
- [x] Deploy su Netlify (secondo sito, base directory `equo-app`) — **equo-app.netlify.app** live, reso pubblico
- [ ] **Manca `ANTHROPIC_API_KEY` su Netlify (env var del sito equo-app)** → senza questa l'AI reale non risponde fuori da demo mode
- [ ] Test navigazione completa con un utente reale end-to-end (login vero, non demo)
- [ ] Upload foto cavallo + documenti sanitari (Supabase Storage) — non ancora implementato
- [ ] Pagina profilo utente / impostazioni scuderia
- [ ] Playlist Spotify Equo: creare playlist pubblica (account gestione.equo@gmail.com), integrare via embed ufficiale Spotify (iframe) — salvataggio/condivisione gestiti nativamente da Spotify, no OAuth/backend necessario
- [ ] Modulo Mascalcia (equo-app): Step 1-6 completati (doppio ruolo, nav pro/proprietario a 5 voci, profilo pro, calendario lezioni manuale, chat proprietario testo/vocali/foto/video, condivisione esterna con watermark) — **Step 7: Community in Equo Scuderia** (bacheca pubblica dei contenuti condivisi, tocca equo-scuderia non equo-app) ancora da fare, dettagli in claude/equo-app-mascalcia.md
- [x] Onboarding legale minimo (equo-app): checkbox unica Termini+Privacy+dichiarazione eta in onboarding (una sola volta per account), pagina in-app "Legale" (Privacy/Cookie/Termini), banner cookie Accetta/Rifiuta con Google Analytics gated dietro consenso, bottone Premium/Free finalmente collegato in UI (mancava), disclaimer AI sotto la chat — vedi commit 7cee147.
- [x] Migrazione SQL eseguita su Supabase (progetto equo-prod): colonne `consenso_termini_privacy`, `dichiarazione_eta`, `cancellazione_richiesta_at` su `profiles` — confermato 20/09/2026
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
- [ ] `ANTHROPIC_API_KEY` da configurare su Netlify (sito equo-app)
- [ ] `RESEND_API_KEY` da configurare (per email transazionali equo-app, se serve oltre alla landing)
- [ ] Configurare Supabase Storage (bucket foto cavalli e documenti PDF)
- [ ] Dominio custom (opzionale, per ora *.netlify.app)
- [ ] Quando si acquista equohub.com: aggiornare dominio custom su Netlify (equo-land + equo-app), redirect URI OAuth Google, Authorized JavaScript origins, e URL di callback Supabase con il nuovo dominio
- [ ] Stripe: skeleton pronto (check-plan, create-checkout, stripe-webhook) ma NON collegato alla UI — da attivare solo quando si decide il piano Pro

## 4. Altro fondamentale prima del lancio
- [ ] **Monetizzazione**: definire piano free vs pro (limite cavalli? assistente AI limitato? export PDF a pagamento?) — nessuna feature senza logica di business
- [x] **Privacy & Cookie (equo-app + equo-scuderia)**: Privacy Policy, Cookie Policy, Termini di Servizio, cookie banner, diritto di cancellazione account — vedi sezione 2 sopra e doc `claude/equo-normativa-privacy.md`
  - [ ] Cookie banner su equo-land (landing) — non ancora fatto, solo su equo-app/equo-scuderia finora
- [ ] Analytics base (Plausible o simile)
- [ ] Seed iniziale tabella `services`/mappa (cliniche 24h, maneggi) — almeno la tua zona
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

## 5. Feature innovative (wow factor) — in ordine di priorità
- [ ] **1. QR Code passaporto emergenza** — richiede ampliare la scheda cavallo: genera QR univoco per cavallo, pagina pubblica read-only (senza login) con allergie, vaccinazioni, gruppo sanguigno, contatti proprietario, scansionabile da un veterinario in emergenza
- [ ] **2. Voice logging** — richiede creare nuova sezione "Diario Sanitario": nota vocale trascritta e strutturata via AI (Whisper/Claude), utile per loggare osservazioni a mani libere in scuderia
- [ ] **3. Body Condition Score via foto** — carichi foto del cavallo, l'AI (Claude vision) stima il punteggio di condizione corporea (scala 1-9) e segnala sovrappeso/sottopeso

---
**Prossimo step**: aggiungere `ANTHROPIC_API_KEY` su Netlify per rendere l'AI di equo-app pienamente funzionante (blocco più urgente rimasto: senza questa, l'AI reale non risponde fuori dalla demo).
