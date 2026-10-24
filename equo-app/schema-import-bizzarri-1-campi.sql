-- 24/10/2026 IMPORTAZIONE FRANCESCO BIZZARRI · PARTE 1 di 2: campi nuovi e funzioni del pop-up
-- Si puo rieseguire senza danni. Non importa ancora nulla: prepara solo il database.

-- intervallo di ferratura della struttura (35, 40, 45... giorni), servira anche per le scadenze allineate
alter table public.clienti_mascalcia add column if not exists intervallo_giorni integer;
do $c$
begin
  if not exists (select 1 from pg_constraint where conname = 'clienti_mascalcia_intervallo_giorni_check') then
    alter table public.clienti_mascalcia add constraint clienti_mascalcia_intervallo_giorni_check
      check (intervallo_giorni is null or intervallo_giorni between 7 and 180);
  end if;
end
$c$;

-- ferrature importate con data proposta: il maniscalco la conferma nel pop-up
alter table public.interventi_mascalcia add column if not exists data_da_confermare boolean not null default false;

-- scelte che il maniscalco fa nel pop-up di benvenuto all'importazione
create table if not exists public.import_decisioni (
  id uuid primary key default gen_random_uuid(),
  maniscalco_id uuid not null references auth.users(id) on delete cascade,
  ordine integer not null default 0,
  tipo text not null check (tipo in ('rinomina_cavallo', 'debitore', 'pagamento_conflitto', 'appuntamento_vecchio', 'pagamento_ignoto')),
  titolo text not null,
  testo text,
  opzioni jsonb not null,
  dati jsonb not null default '{}'::jsonb,
  scelta text,
  importo numeric,
  risolta_il timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists import_decisioni_aperte_idx on public.import_decisioni (maniscalco_id) where risolta_il is null;
alter table public.import_decisioni enable row level security;
drop policy if exists import_decisioni_sel on public.import_decisioni;
create policy import_decisioni_sel on public.import_decisioni for select using (maniscalco_id = auth.uid());
revoke all on public.import_decisioni from anon, authenticated;
grant select on public.import_decisioni to authenticated;

-- conferma delle date: p = [{"id": "...", "data": "2026-10-07"}, ...]
create or replace function public.equo_import_conferma_date(p jsonb) returns integer
language plpgsql security definer set search_path to 'public' as $fn$
declare e jsonb; v_data date; n integer := 0; k integer;
begin
  if auth.uid() is null then return 0; end if;
  for e in select * from jsonb_array_elements(coalesce(p, '[]'::jsonb)) loop
    v_data := nullif(e->>'data', '')::date;
    if v_data is null or v_data > current_date or v_data < date '2020-01-01' then continue; end if;
    update interventi_mascalcia set data_intervento = v_data, data_da_confermare = false
     where id = (e->>'id')::uuid and maniscalco_id = auth.uid() and data_da_confermare;
    get diagnostics k = row_count; n := n + k;
  end loop;
  return n;
end
$fn$;
revoke all on function public.equo_import_conferma_date(jsonb) from public, anon;
grant execute on function public.equo_import_conferma_date(jsonb) to authenticated;

-- applica una scelta del pop-up
create or replace function public.equo_import_decidi(p_id uuid, p_scelta text, p_importo numeric default null) returns json
language plpgsql security definer set search_path to 'public' as $fn$
declare d import_decisioni; v_int uuid; v_new uuid; n jsonb;
begin
  select * into d from import_decisioni where id = p_id and maniscalco_id = auth.uid() for update;
  if not found then return json_build_object('ok', false, 'motivo', 'non_trovata'); end if;
  if d.risolta_il is not null then return json_build_object('ok', true, 'gia_fatta', true); end if;
  if not exists (select 1 from jsonb_array_elements(d.opzioni) o where o->>'k' = p_scelta) then
    return json_build_object('ok', false, 'motivo', 'scelta_non_valida');
  end if;
  v_int := nullif(d.dati->>'intervento_id', '')::uuid;
  if d.tipo = 'pagamento_conflitto' then
    if p_scelta = 'vecchia' then
      update interventi_mascalcia set stato_pagamento = d.dati->>'vecchia_pagamento' where id = v_int and maniscalco_id = d.maniscalco_id;
    end if;
  elsif d.tipo = 'appuntamento_vecchio' then
    update interventi_mascalcia
       set stato = case when p_scelta = 'annullato' then 'annullato' else 'fatto' end,
           stato_pagamento = case p_scelta when 'fatto_saldato' then 'saldato' when 'fatto_da_saldare' then 'da_saldare' else stato_pagamento end
     where id = v_int and maniscalco_id = d.maniscalco_id;
  elsif d.tipo = 'pagamento_ignoto' then
    if p_scelta = 'da_saldare' then
      if coalesce(p_importo, 0) <= 0 then return json_build_object('ok', false, 'motivo', 'importo_mancante'); end if;
      update interventi_mascalcia set stato_pagamento = 'da_saldare', importo = p_importo where id = v_int and maniscalco_id = d.maniscalco_id;
    else
      update interventi_mascalcia set stato_pagamento = 'saldato' where id = v_int and maniscalco_id = d.maniscalco_id;
    end if;
  elsif d.tipo = 'debitore' then
    if p_scelta = 'struttura' then
      update interventi_mascalcia set cliente_mascalcia_id = (d.dati->>'cliente_struttura')::uuid
       where id in (select x::uuid from jsonb_array_elements_text(d.dati->'interventi') x) and maniscalco_id = d.maniscalco_id;
    end if;
  elsif d.tipo = 'rinomina_cavallo' then
    if p_scelta = 'si' then
      update cavalli_clienti_mascalcia set nome = d.dati->>'nuovo_nome' where id = (d.dati->>'cavallo_id')::uuid and maniscalco_id = d.maniscalco_id;
    else
      n := d.dati->'se_no';
      insert into cavalli_clienti_mascalcia (maniscalco_id, cliente_mascalcia_id, nome)
      values (d.maniscalco_id, (n->>'cliente_id')::uuid, n->>'nome') returning id into v_new;
      insert into interventi_mascalcia (maniscalco_id, cliente_mascalcia_id, cavallo_cliente_id, tipo_ferratura, stato,
        data_intervento, prossima_scadenza, stato_pagamento, note, data_da_confermare)
      values (d.maniscalco_id, (n->>'cliente_id')::uuid, v_new, 'ferratura', 'fatto',
        (n->>'data')::date, (n->>'prossima')::date, n->>'pagamento', 'Importato dalla vecchia app (23/10/2026)', true);
    end if;
  end if;
  update import_decisioni set scelta = p_scelta, importo = p_importo, risolta_il = now() where id = p_id;
  return json_build_object('ok', true);
end
$fn$;
revoke all on function public.equo_import_decidi(uuid, text, numeric) from public, anon;
grant execute on function public.equo_import_decidi(uuid, text, numeric) to authenticated;

-- controllo
select (select count(*) from information_schema.columns where table_name = 'clienti_mascalcia' and column_name = 'intervallo_giorni') intervallo,
       (select count(*) from information_schema.columns where table_name = 'interventi_mascalcia' and column_name = 'data_da_confermare') data_da_confermare,
       (select count(*) from information_schema.tables where table_name = 'import_decisioni') tabella_scelte,
       (select count(*) from pg_proc where proname in ('equo_import_conferma_date', 'equo_import_decidi')) funzioni;
