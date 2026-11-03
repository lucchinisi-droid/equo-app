-- Equo: DIARIO DEL CAVALLO PER IL PROPRIETARIO (3 novembre 2026) · SQL 36 · Fase 1 del piano di lavoro Scuderia
-- Il proprietario vede nella scheda del suo cavallo le attività del giorno segnate in scuderia
-- (app Groom o gestionale: tabella scuderia_box_attivita, già piena). Niente dati nuovi da raccogliere.
--  · centri.diario_attivita = quali attività il centro mostra ai proprietari (di default le 7 principali,
--    non «acqua» né le 4 facoltative); si cambia da Cavalli › Box › «Icone del giorno».
--  · mio_diario_scuderia(horse, giorni) = solo per il proprietario del cavallo (horses.owner_id o membro collegato),
--    solo se la scheda della scuderia è collegata a quel cavallo (scuderia_cavalli.horse_id) e non è uscita.
-- Rieseguibile. Il controllo finale deve dare 1 · 1 · false.

-- 1 · cosa mostra il centro ----------------------------------------------------------------------------
alter table public.centri add column if not exists diario_attivita text[] not null
  default array['pasto_mattina','pasto_sera','fieno','paddock','lavorato','farmaco','box_pulito'];
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'centri_diario_attivita_valide') then
    alter table public.centri add constraint centri_diario_attivita_valide check (diario_attivita <@ array[
      'pasto_mattina','pasto_sera','fieno','acqua','paddock','lavorato','farmaco','box_pulito',
      'integratore','coperta','zoccoli','grooming']::text[]);
  end if;
end $$;

-- 2 · il diario per il proprietario --------------------------------------------------------------------
create or replace function public.mio_diario_scuderia(p_horse uuid, p_giorni int default 7)
returns jsonb language plpgsql stable security definer set search_path to 'public' as $$
declare k record; oggi date := (now() at time zone 'Europe/Rome')::date; n int := least(greatest(coalesce(p_giorni, 7), 1), 14);
begin
  if auth.uid() is null or p_horse is null then return null; end if;
  select sc.id, sc.centro_id, c.nome as centro, c.diario_attivita as mostra into k
    from scuderia_cavalli sc join centri c on c.id = sc.centro_id
   where sc.horse_id = p_horse and sc.uscito_il is null
     and (exists (select 1 from horses h where h.id = p_horse and h.owner_id = auth.uid())
          or exists (select 1 from scuderia_membri m where m.id = sc.proprietario_membro_id and m.user_id = auth.uid()))
   order by sc.created_at desc limit 1;
  if k.id is null then return null; end if;
  return jsonb_build_object(
    'scuderia', coalesce(nullif(trim(k.centro), ''), 'La tua scuderia'),
    'oggi', oggi,
    'mostra', to_jsonb(k.mostra),
    -- la scuderia segna le attività? (almeno una negli ultimi 30 giorni, su qualunque cavallo del centro)
    'attiva', exists (select 1 from scuderia_box_attivita a where a.centro_id = k.centro_id and a.giorno >= oggi - 30),
    'voci', coalesce((select jsonb_agg(jsonb_build_object(
        'giorno', a.giorno, 'tipo', a.tipo,
        'ora', to_char(a.fatto_il at time zone 'Europe/Rome', 'HH24:MI'),
        'da', nullif(split_part(trim(coalesce(a.fatto_da_nome, '')), ' ', 1), ''))
        order by a.giorno desc, a.fatto_il)
      from scuderia_box_attivita a
     where a.cavallo_id = k.id and a.giorno > oggi - n and a.tipo = any(k.mostra)), '[]'::jsonb));
end $$;
revoke all on function public.mio_diario_scuderia(uuid, int) from public, anon;
grant execute on function public.mio_diario_scuderia(uuid, int) to authenticated, service_role;

-- controllo finale: deve dare 1 · 1 · false
select (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'centri' and column_name = 'diario_attivita') as colonna,
       (select count(*) from pg_proc where proname = 'mio_diario_scuderia') as funzione,
       has_function_privilege('anon', 'public.mio_diario_scuderia(uuid, integer)', 'EXECUTE') as aperta_a_anon;
