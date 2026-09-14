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
- [ ] **Privacy & Cookie**: gestione completa su landing e app —
  - [ ] Privacy Policy + Termini di Servizio (obbligatori per dati sanitari/email)
  - [ ] Cookie banner (accetta/rifiuta/personalizza) su equo-land
  - [ ] Cookie banner su equo-app (se si aggiungono analytics/tracking)
  - [ ] Pagina/consenso trattamento dati sanitari cavallo (dato sensibile-adiacente)
  - [ ] Diritto di cancellazione account e dati (GDPR) da impostazioni profilo
- [ ] Analytics base (Plausible o simile)
- [ ] Seed iniziale tabella `services`/mappa (cliniche 24h, maneggi) — almeno la tua zona
- [ ] Onboarding primo utente
- [ ] Test su dispositivi reali (iPad e Mac mini)
- [ ] Gestione/controllo email raccolte dalla waitlist (to-do aperto)
- [ ] Auto-renew dominio: verificare se attivarlo su Namecheap prima della scadenza

## 5. Feature innovative (wow factor) — in ordine di priorità
- [ ] **1. QR Code passaporto emergenza** — richiede ampliare la scheda cavallo: genera QR univoco per cavallo, pagina pubblica read-only (senza login) con allergie, vaccinazioni, gruppo sanguigno, contatti proprietario, scansionabile da un veterinario in emergenza
- [ ] **2. Voice logging** — richiede creare nuova sezione "Diario Sanitario": nota vocale trascritta e strutturata via AI (Whisper/Claude), utile per loggare osservazioni a mani libere in scuderia
- [ ] **3. Body Condition Score via foto** — carichi foto del cavallo, l'AI (Claude vision) stima il punteggio di condizione corporea (scala 1-9) e segnala sovrappeso/sottopeso

---
**Prossimo step**: aggiungere `ANTHROPIC_API_KEY` su Netlify per rendere l'AI di equo-app pienamente funzionante.
