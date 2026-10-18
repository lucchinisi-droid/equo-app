-- ============================================================
-- EQUO SCUDERIA - Contratti economici dei centri (pacchetto, ciclo, prezzo, date)
-- Serve al Cruscotto (scheda "Scuderie") e al passaggio automatico a fine promo.
-- Idempotente: si puo' rieseguire.
-- Importi in centesimi, IVA ESCLUSA (imponibile per ciclo, add-on compresi).
-- I pagamenti ricevuti si registrano con registra_pagamento_scuderia (importo IVA INCLUSA).
-- ============================================================

create table if not exists public.centri_contratti (
  id bigint generated always as identity primary key,
  centro_id uuid not null references public.centri(id) on delete cascade,
  pacchetto text not null check (pacchetto in ('start','advance','premium','enterprise')),
  ciclo text not null check (ciclo in ('mensile','annuale')),
  importo_cent integer not null check (importo_cent >= 0),
  iva_pct numeric not null default 22,
  inizio_pagamento date not null,          -- prima scadenza di pagamento
  fine date,                               -- vuoto = contratto in corso
  note text,
  created_at timestamptz not null default now()
);
create unique index if not exists centri_contratti_uno_attivo on public.centri_contratti (centro_id) where fine is null;
alter table public.centri_contratti enable row level security;
revoke all on public.centri_contratti from anon, authenticated;

-- Imposta (o cambia) il contratto di un centro.
--   select imposta_contratto_centro('<id centro>', 'advance', 'annuale');            -- prezzo di listino, parte a fine promo
--   select imposta_contratto_centro('<id>', 'premium', 'mensile', 4900, '2026-12-01', 'sconto fondatore');
-- Se il centro NON e' in promo, il pacchetto del centro cambia subito; se e' in promo, cambia alla scadenza.
create or replace function public.imposta_contratto_centro(
  p_centro uuid, p_pacchetto text, p_ciclo text,
  p_importo_cent integer default null, p_inizio date default null, p_note text default null)
returns void language plpgsql security definer set search_path = public as $$
declare c centri%rowtype; v_imp integer; v_ini date;
begin
  select * into c from centri where id = p_centro;
  if c.id is null then raise exception 'Centro non trovato'; end if;
  if p_ciclo not in ('mensile','annuale') then raise exception 'Ciclo non valido: mensile o annuale'; end if;
  v_imp := coalesce(p_importo_cent, case p_pacchetto
      when 'start'    then case p_ciclo when 'mensile' then 900   else 8900  end
      when 'advance'  then case p_ciclo when 'mensile' then 2900  else 29000 end
      when 'premium'  then case p_ciclo when 'mensile' then 5900  else 59000 end end);
  if v_imp is null then raise exception 'Per ENTERPRISE indica l''importo (centesimi, IVA esclusa)'; end if;
  v_ini := coalesce(p_inizio, case when c.promo_fino is not null and c.promo_fino >= current_date then c.promo_fino + 1 else current_date end);
  update centri_contratti set fine = current_date where centro_id = p_centro and fine is null;
  insert into centri_contratti (centro_id, pacchetto, ciclo, importo_cent, inizio_pagamento, note)
  values (p_centro, p_pacchetto, p_ciclo, v_imp, v_ini, p_note);
  if c.promo_pacchetto_prima is null then
    perform set_config('equo.pacchetti','on',true);
    update centri set pacchetto = p_pacchetto where id = p_centro;
  end if;
end $$;

-- Chiude il contratto (disdetta): nessun'altra scadenza dopo la data indicata.
create or replace function public.chiudi_contratto_centro(p_centro uuid, p_fine date default current_date)
returns void language plpgsql security definer set search_path = public as $$
begin
  update centri_contratti set fine = p_fine where centro_id = p_centro and fine is null;
  if not found then raise exception 'Nessun contratto in corso per questo centro'; end if;
end $$;

-- A fine promo: il centro passa al pacchetto del contratto (se c'e'), altrimenti torna al precedente.
create or replace function public.equo_scade_promo_centri()
returns integer language plpgsql security definer set search_path = public as $$
declare r record; n integer := 0; v_pk text;
begin
  for r in select id from centri
           where promo_pacchetto_prima is not null and promo_fino is not null and promo_fino < current_date
  loop
    perform termina_promo_centro(r.id);
    select pacchetto into v_pk from centri_contratti where centro_id = r.id and fine is null;
    if v_pk is not null then
      perform set_config('equo.pacchetti','on',true);
      update centri set pacchetto = v_pk where id = r.id;
    end if;
    n := n + 1;
  end loop;
  return n;
end $$;

revoke all on function public.imposta_contratto_centro(uuid, text, text, integer, date, text) from public, anon, authenticated;
revoke all on function public.chiudi_contratto_centro(uuid, date) from public, anon, authenticated;
revoke all on function public.equo_scade_promo_centri() from public, anon, authenticated;
grant execute on function public.imposta_contratto_centro(uuid, text, text, integer, date, text) to service_role;
grant execute on function public.chiudi_contratto_centro(uuid, date) to service_role;
grant execute on function public.equo_scade_promo_centri() to service_role;
