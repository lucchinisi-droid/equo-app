# Equo — Roadmap di lancio

Ordine di priorità per arrivare da "codebase pronta" a "prodotto live e testabile".

## 1. Landing Page ✅ (base fatta, da rifinire)
- [x] Struttura landing (`src/app/page.tsx`) con hero, feature, waitlist form
- [x] API `/api/waitlist` (salva su Supabase + email conferma Resend)
- [x] Rifinire copy (headline, value prop, CTA)
- [ ] Verificare responsive mobile reale (iPad/iPhone) — verifica solo via codice (mobile-first), da controllare a occhio su dispositivo vero
- [x] Collegare Supabase reale e testare il flusso waitlist end-to-end — testato in produzione, riga salvata correttamente
- [x] Deploy landing su Netlify — **https://equo-app.netlify.app** live

## 2. Web App base navigabile (non ancora funzionante al 100%)
- [x] Auth (login/signup) collegata a Supabase
- [x] Dashboard, Cavalli (lista/dettaglio/nuovo), Spese, Assistente AI, Servizi
- [ ] Test navigazione completa con un utente reale end-to-end
- [ ] Gestione errori/loading states più robusta (skeleton, empty states già presenti ma da rivedere)
- [ ] Upload foto cavallo + documenti sanitari (Supabase Storage) — non ancora implementato
- [ ] Pagina profilo utente / impostazioni scuderia

## 3. Configurazione infrastruttura
- [x] Creare progetto Supabase (produzione) + applicare migration `0001_init.sql` — progetto "equo" (eu-west-1), 7 tabelle con RLS attivo
- [ ] Configurare Supabase Storage (bucket per foto cavalli e documenti PDF)
- [x] `.env.local` compilato con URL + anon key reali (service_role/Resend/Anthropic da inserire manualmente per motivi di sicurezza)
- [ ] Account Resend + dominio email verificato (per non restare su onboarding@resend.dev)
- [ ] API key Anthropic (Claude) per l'assistente
- [x] Repo Git remoto (GitHub) collegato — github.com/lucchinisi-droid/equo-app
- [x] Deploy su Netlify: sito live, build automatica ad ogni push su master
- [ ] Dominio custom (opzionale, per ora equo-app.netlify.app)
- [ ] Cron giornaliero per `/api/reminders` (Netlify Scheduled Functions o cron-job.org)

## 4. Altro fondamentale prima del lancio
- [ ] **Monetizzazione**: definire piano free vs pro (limite cavalli? assistente AI limitato? export PDF a pagamento?) — nessuna feature senza logica di business
- [ ] Privacy Policy + Termini di Servizio (obbligatori per raccogliere dati sanitari/email)
- [ ] Analytics base (Plausible o simile) per capire chi usa cosa
- [ ] Seed iniziale tabella `services` (cliniche 24h, maneggi) — almeno la tua zona/regione
- [ ] Onboarding primo utente (tooltip o schermata guidata alla prima apertura)
- [ ] Test su dispositivi reali (iPad e Mac mini, come da tuo workflow)

---
**Prossimo step**: partiamo dal punto 1 — rifinitura landing page.
