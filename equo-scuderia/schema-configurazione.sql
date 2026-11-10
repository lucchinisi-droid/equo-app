-- Equo · SQL 58 · Configurazione guidata della scuderia, blocco B1: stato dei passi (10/11/2026)
-- Una riga per scuderia con il passo dove riprendere, lo stato di ogni passo e i 30 messaggi bonus di Athena.
-- Tutto il resto (anagrafica, box, cavalli, clienti, lezioni, incassi) resta nelle tabelle dei moduli: qui NON si
-- salvano dati della scuderia, solo l'avanzamento. Migrazione solo additiva: per annullarla basta
--   drop function configurazione_leggi(uuid); drop function configurazione_salva(uuid, int, text, jsonb, text, int);
--   drop table scuderia_configurazione;

create table if not exists scuderia_configurazione (
  centro_id        uuid primary key references centri(id) on delete cascade,
  versione_passi   int  not null default 1,               -- versione dell'elenco dei passi
  passo_corrente   int  not null default 1 check (passo_corrente between 1 and 10),
  passi            jsonb not null default '{}'::jsonb,     -- {"1":"fatto","2":"in_corso","5":"saltato","8":"non_applicabile"}
  stato            text not null default 'nuova' check (stato in ('nuova', 'rimandata', 'in_corso', 'completata')),
  proposta_vista_il timestamptz,                           -- la proposta «Inizia ora / Più tardi» si mostra una volta sola
  ai_bonus_usati   int  not null default 0 check (ai_bonus_usati between 0 and 30),
  rev              int  not null default 0,                -- cresce a ogni salvataggio: due amministratori insieme non si sovrascrivono
  aggiornato_da    uuid,
  aggiornato_da_nome text,
  ultima_attivita  timestamptz not null default now(),
  completata_il    timestamptz,
  created_at       timestamptz not null default now()
);
alter table scuderia_configurazione enable row level security;
-- nessuna policy: si legge e si scrive solo con le due funzioni qui sotto (controllano chi può)
revoke all on scuderia_configurazione from anon, authenticated;

-- legge lo stato (e lo crea alla prima lettura). Lo vedono amministratore e livelli 2-3.
create or replace function configurazione_leggi(p_centro uuid) returns json
language plpgsql security definer set search_path = public as $$
declare r scuderia_configurazione;
begin
  if not can_collegare_professionisti(p_centro) then
    return json_build_object('ok', false, 'puo', false);
  end if;
  insert into scuderia_configurazione (centro_id) values (p_centro) on conflict (centro_id) do nothing;
  select * into r from scuderia_configurazione where centro_id = p_centro;
  return json_build_object('ok', true, 'puo', true, 'versione_passi', r.versione_passi, 'passo_corrente', r.passo_corrente,
    'passi', r.passi, 'stato', r.stato, 'proposta_vista', r.proposta_vista_il is not null, 'ai_bonus_usati', r.ai_bonus_usati,
    'rev', r.rev, 'aggiornato_da_nome', r.aggiornato_da_nome, 'aggiornato_da_me', r.aggiornato_da = auth.uid(),
    'ultima_attivita', r.ultima_attivita, 'completata_il', r.completata_il);
end $$;
revoke all on function configurazione_leggi(uuid) from public, anon;
grant execute on function configurazione_leggi(uuid) to authenticated;

-- salva l'avanzamento. p_rev = la rev letta: se nel frattempo un altro ha salvato, risponde «conflitto» con lo stato nuovo.
-- p_passo_stato: lo stato del passo p_passo (in_corso, fatto, saltato, non_applicabile) oppure null.
-- p_azione: null | 'proposta_vista' | 'rimanda' | 'completa'
create or replace function configurazione_salva(p_centro uuid, p_passo int, p_passo_stato text, p_passi jsonb, p_azione text, p_rev int)
returns json language plpgsql security definer set search_path = public as $$
declare r scuderia_configurazione; v_nome text; v_passi jsonb; k text;
begin
  if not can_collegare_professionisti(p_centro) then
    return json_build_object('ok', false, 'errore', 'Solo l''amministratore o un membro di livello 2 o 3 può configurare la scuderia.');
  end if;
  insert into scuderia_configurazione (centro_id) values (p_centro) on conflict (centro_id) do nothing;
  select * into r from scuderia_configurazione where centro_id = p_centro for update;
  if p_rev is not null and p_rev <> r.rev then
    return json_build_object('ok', false, 'conflitto', true, 'conf', configurazione_leggi(p_centro));
  end if;
  if p_passo is not null and (p_passo < 1 or p_passo > 10) then return json_build_object('ok', false, 'errore', 'Passo non valido.'); end if;
  if p_passo_stato is not null and p_passo_stato not in ('in_corso', 'fatto', 'saltato', 'non_applicabile') then
    return json_build_object('ok', false, 'errore', 'Stato del passo non valido.');
  end if;
  v_passi := r.passi;
  -- p_passi: più passi insieme (es. quelli già soddisfatti dai dati esistenti); accetta solo chiavi 1-10 e stati validi
  if p_passi is not null then
    for k in select jsonb_object_keys(p_passi) loop
      if k ~ '^(10|[1-9])$' and p_passi->>k in ('in_corso', 'fatto', 'saltato', 'non_applicabile') then
        v_passi := v_passi || jsonb_build_object(k, p_passi->>k);
      end if;
    end loop;
  end if;
  if p_passo is not null and p_passo_stato is not null then v_passi := v_passi || jsonb_build_object(p_passo::text, p_passo_stato); end if;
  select coalesce(nullif(trim(m.nome_visualizzato), ''), equo_nome_profilo(auth.uid())) into v_nome
    from scuderia_membri m where m.centro_id = p_centro and m.user_id = auth.uid() limit 1;
  update scuderia_configurazione set
    passi = v_passi,
    passo_corrente = coalesce(p_passo, passo_corrente),
    stato = case when p_azione = 'completa' then 'completata'
                 when p_azione = 'rimanda' and stato <> 'completata' then 'rimandata'
                 when p_passo is not null and stato in ('nuova', 'rimandata') then 'in_corso'
                 else stato end,
    proposta_vista_il = case when p_azione in ('proposta_vista', 'rimanda') or p_passo is not null then coalesce(proposta_vista_il, now()) else proposta_vista_il end,
    completata_il = case when p_azione = 'completa' then coalesce(completata_il, now()) else completata_il end,
    rev = rev + 1, aggiornato_da = auth.uid(), aggiornato_da_nome = v_nome, ultima_attivita = now()
  where centro_id = p_centro;
  return json_build_object('ok', true, 'conf', configurazione_leggi(p_centro));
end $$;
revoke all on function configurazione_salva(uuid, int, text, jsonb, text, int) from public, anon;
grant execute on function configurazione_salva(uuid, int, text, jsonb, text, int) to authenticated;

select exists (select 1 from information_schema.tables where table_name = 'scuderia_configurazione') as tabella_ok,
       exists (select 1 from pg_proc where proname = 'configurazione_salva') as funzioni_ok;
