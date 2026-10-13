-- Equo: MODALITÀ LAVORO DEL MANISCALCO · prima e dopo l'intervento (13 ottobre 2026)
-- Durante il lavoro il telefono non si usa. Prima: scheda da leggere (avvisi di sicurezza e problemi lasciati per piede).
-- Dopo: chiusura della tappa; i problemi si segnano solo se ci sono, sul piede giusto, e restano nello storico a vita.

-- 1. avviso di sicurezza del cavallo (es. «scalcia dietro»): nota del maniscalco, mostrata all'arrivo
alter table public.cavalli_clienti_mascalcia add column if not exists avviso_sicurezza text;

-- 2. al lavoro: le notifiche dei messaggi restano in pausa fino alla chiusura (o al massimo 4 ore)
alter table public.profiles add column if not exists lavoro_fino timestamptz;

-- 3. problemi per piede (as = anteriore sinistro, ad = anteriore destro, ps = posteriore sinistro, pd = posteriore destro)
create table if not exists public.cavalli_problemi_piede (
  id uuid primary key default gen_random_uuid(),
  maniscalco_id uuid not null default auth.uid(),
  cavallo_cliente_id uuid not null references public.cavalli_clienti_mascalcia(id) on delete cascade,
  horse_id uuid,
  intervento_id uuid references public.interventi_mascalcia(id) on delete set null,
  piede text not null check (piede in ('as','ad','ps','pd')),
  voci text[] not null default '{}',
  nota text,
  foto_path text,
  ricontrolla_il date,
  avvisato_proprietario boolean not null default false,
  serve_veterinario boolean not null default false,
  risolto_il timestamptz,
  creato_il timestamptz not null default now()
);
create index if not exists cavalli_problemi_piede_cavallo on public.cavalli_problemi_piede (cavallo_cliente_id, piede, creato_il desc);
alter table public.cavalli_problemi_piede enable row level security;
grant select, update on public.cavalli_problemi_piede to authenticated;
drop policy if exists problemi_piede_lettura on public.cavalli_problemi_piede;
create policy problemi_piede_lettura on public.cavalli_problemi_piede for select to authenticated using (maniscalco_id = auth.uid());
drop policy if exists problemi_piede_risolvi on public.cavalli_problemi_piede;
create policy problemi_piede_risolvi on public.cavalli_problemi_piede for update to authenticated using (maniscalco_id = auth.uid()) with check (maniscalco_id = auth.uid());
-- nessun delete: lo storico resta a vita; si inserisce solo con la funzione qui sotto

create or replace function public.equo_nome_piede(p text)
returns text language sql immutable as $$
  select case p when 'as' then 'anteriore sinistro' when 'ad' then 'anteriore destro' when 'ps' then 'posteriore sinistro' when 'pd' then 'posteriore destro' else p end;
$$;

create or replace function public.equo_segna_problema_piede(p_cavallo uuid, p_piede text, p_voci text[], p_nota text, p_foto text,
  p_ricontrolla date, p_avvisa boolean, p_vet boolean, p_intervento uuid default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare cv record; v_id uuid; v_descr text;
begin
  select * into cv from cavalli_clienti_mascalcia where id = p_cavallo and maniscalco_id = auth.uid();
  if not found then raise exception 'CAVALLO_NON_TUO'; end if;
  if p_piede not in ('as','ad','ps','pd') then raise exception 'PIEDE_NON_VALIDO'; end if;
  insert into cavalli_problemi_piede (maniscalco_id, cavallo_cliente_id, horse_id, intervento_id, piede, voci, nota, foto_path, ricontrolla_il, avvisato_proprietario, serve_veterinario)
  values (auth.uid(), p_cavallo, cv.horse_id, p_intervento, p_piede, coalesce(p_voci, '{}'), nullif(trim(coalesce(p_nota, '')), ''),
          nullif(p_foto, ''), p_ricontrolla, coalesce(p_avvisa, false), coalesce(p_vet, false))
  returning id into v_id;
  v_descr := 'Problema al piede ' || equo_nome_piede(p_piede) || ': ' || coalesce(nullif(array_to_string(p_voci, ', '), ''), 'da controllare')
    || coalesce(' — ' || nullif(trim(coalesce(p_nota, '')), ''), '')
    || case when p_ricontrolla is not null then ' · ricontrollo il ' || to_char(p_ricontrolla, 'DD/MM/YYYY') else '' end
    || case when coalesce(p_vet, false) then ' · consigliato il veterinario' else '' end
    || ' (maniscalco ' || equo_nome_profilo(auth.uid()) || ')';
  insert into cavalli_storico (codice_equo, horse_id, scuderia_cavallo_id, cavallo_cliente_id, tipo, descrizione, autore_user_id, autore_ruolo, app)
  values (cv.codice_equo, cv.horse_id, cv.scuderia_cavallo_id, cv.id, 'problema_piede', v_descr, auth.uid(), 'maniscalco', 'app');
  return v_id;
end $$;
revoke all on function public.equo_segna_problema_piede(uuid, text, text[], text, text, date, boolean, boolean, uuid) from public;
grant execute on function public.equo_segna_problema_piede(uuid, text, text[], text, text, date, boolean, boolean, uuid) to authenticated;

-- 4. guide di Hammer
insert into public.ai_conoscenze (ambito, categoria, attivo, titolo, contenuto, aggiornato_il, verificato_il)
select 'maniscalco', 'guida', true, 'Modalità Lavoro: prima e dopo la tappa',
'Dove: Home → "Portami da…" → "Lavoro" sulla tappa; oppure l''avviso "Sei arrivato…" quando apri l''app vicino al posto
Passi:
1. Prima (all''arrivo, guanti ancora tolti): leggi la scheda della tappa. In rosso gli avvisi di sicurezza (es. "scalcia dietro"), in oro i piedi con un problema lasciato l''ultima volta (AS, AD, PS, PD). Poi scorri "Ho letto · al lavoro".
2. Durante: il telefono resta in tasca. Le notifiche dei messaggi di Equo sono in pausa finché non chiudi la tappa (al massimo 4 ore).
3. Dopo (al furgone): "Chiudi la tappa". Ogni cavallo è già "Regolare" con l''importo proposto; scegli Saldato o Da saldare e scorri "Scorri per chiudere": i lavori diventano fatti con la prossima data.
4. Solo se c''è un problema: tocca ⚠ accanto al cavallo, tocca il piede (cerchi grandi), scegli cosa è successo, poi foto e nota se servono, Hammer se vuoi un parere, e decidi: ricontrollo tra N giorni (entra in agenda), avvisa il proprietario, serve il veterinario.
Esempio: Luca chiude la tappa alla Scuderia Le Querce; su Brezza segna "posteriore destro: ferro perso, parete sfaldata", ricontrollo tra 14 giorni e avviso al proprietario.
Note: I problemi restano nello storico a vita del cavallo, piede per piede ("già 2 volte quest''anno"). Il proprietario li vede solo se scegli "Avvisa il proprietario" (messaggio in chat; la foto diventa un allegato del cavallo). Un cavallo segnato "Regolare" chiude i problemi aperti di quel cavallo. L''avviso di sicurezza si scrive nella scheda Ferratura del cavallo.
Parole chiave: modalità lavoro, arrivo, tappa, chiudi la tappa, problema al piede, ferro perso, zampa, posteriore destro, sicurezza, scalcia, ricontrollo, notifiche in pausa', now(), current_date
where not exists (select 1 from public.ai_conoscenze where titolo = 'Modalità Lavoro: prima e dopo la tappa' and ambito = 'maniscalco');

-- controllo: deve dare 1 · 1 · 1 · 1 · 1
select (select count(*) from information_schema.columns where table_name = 'cavalli_clienti_mascalcia' and column_name = 'avviso_sicurezza') as avviso,
       (select count(*) from information_schema.columns where table_name = 'profiles' and column_name = 'lavoro_fino') as lavoro_fino,
       (select count(*) from information_schema.tables where table_name = 'cavalli_problemi_piede') as tabella_problemi,
       (select count(*) from pg_proc where proname = 'equo_segna_problema_piede') as funzione,
       (select count(*) from ai_conoscenze where titolo = 'Modalità Lavoro: prima e dopo la tappa') as guida;
