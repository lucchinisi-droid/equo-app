# Equo 🐴 — Prenditi cura del tuo cavallo

PWA/Web App mobile-first per la gestione sanitaria e amministrativa del cavallo.

## Stack

- **Frontend**: Next.js 16 (App Router) + Tailwind CSS v4 + componenti stile shadcn/ui + Lucide Icons
- **Backend & DB**: Supabase (Auth, Postgres, RLS, Storage)
- **Email**: Resend
- **AI**: Claude API (Anthropic) — assistente esperto equestre
- **Hosting**: Netlify o Vercel

## Setup

1. **Dipendenze**
   ```bash
   npm install
   ```

2. **Variabili d'ambiente** — copia `.env.local.example` in `.env.local` e compila:
   - `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`: dal progetto Supabase (Settings → API)
   - `RESEND_API_KEY` / `EMAIL_FROM`: da resend.com
   - `ANTHROPIC_API_KEY`: da console.anthropic.com
   - `CRON_SECRET`: stringa a caso, usata per proteggere `/api/reminders`

3. **Database Supabase** — applica la migration in `supabase/migrations/0001_init.sql` (via SQL Editor su supabase.com, oppure `supabase db push` con la CLI). Crea le tabelle: `profiles`, `horses`, `health_records`, `expenses`, `services`, `waitlist`, `assistant_messages`, tutte con Row Level Security già configurata.

4. **Avvio locale**
   ```bash
   npm run dev
   ```

## Struttura cartelle

```
src/
  app/
    (marketing)/          → landing page + waitlist (route "/")
    (auth)/login|signup   → autenticazione
    (dashboard)/          → area protetta: dashboard, horses, expenses, assistant, services
    api/
      chat/                → endpoint Claude (assistente AI)
      waitlist/             → salva lead + email di conferma
      reminders/            → da chiamare via cron giornaliero (scadenze in 7gg)
  components/
    ui/                    → primitive stile shadcn (button, card, input, dialog, ...)
    horse/, expenses/, assistant/, waitlist/, layout/
  lib/
    supabase/              → client browser, server, middleware/proxy
    resend/                → client + template email
    claude/                → client Anthropic + system prompt
    constants.ts, utils.ts
  types/database.ts        → tipi TS manuali (da sostituire con `supabase gen types`)
supabase/migrations/       → schema SQL
```

## Reminder automatici

`/api/reminders` va chiamato una volta al giorno (Netlify Scheduled Functions, cron-job.org, GitHub Actions...) con header `x-cron-secret: <CRON_SECRET>`. Manda una email per ogni scadenza sanitaria nei prossimi 7 giorni.

## Deploy

Build di produzione testata (`npm run build`) ✅. Pronta per Netlify o Vercel: imposta le variabili d'ambiente sulla piattaforma e collega il repo.
