-- ===== Conto della scuderia / del cliente (maniscalco) =====
-- Il conto è uno SNAPSHOT: raccoglie i lavori fatti e non ancora saldati, prende un numero
-- (C-anno-numero, per maniscalco) e resta salvato. Stati: da_incassare → pagato, oppure annullato.
-- Un lavoro può stare in un solo conto attivo alla volta. Niente cancellazioni: si annulla.

create table if not exists public.conti_mascalcia (
  id uuid primary key default gen_random_uuid(),
  maniscalco_id uuid not null references auth.users(id) on delete cascade,
  cliente_mascalcia_id uuid not null references public.clienti_mascalcia(id),
  anno int not null,
  numero int not null,
  modo text not null default 'unico' check (modo in ('unico','per_proprietario')),
  periodo_da date,
  periodo_a date,
  totale numeric(10,2) not null default 0,
  n_lavori int not null default 0,
  stato text not null default 'da_incassare' check (stato in ('da_incassare','pagato','annullato')),
  creato_il timestamptz not null default now(),
  pagato_il timestamptz,
  annullato_il timestamptz,
  unique (maniscalco_id, anno, numero)
);
create index if not exists conti_mascalcia_cliente_idx on public.conti_mascalcia (maniscalco_id, cliente_mascalcia_id, creato_il desc);

create table if not exists public.conti_mascalcia_righe (
  id uuid primary key default gen_random_uuid(),
  conto_id uuid not null references public.conti_mascalcia(id) on delete cascade,
  intervento_id uuid not null references public.interventi_mascalcia(id),
  horse_id uuid,
  cavallo_nome text,
  proprietario_nome text,
  data_intervento date not null,
  descrizione text,
  importo numeric(10,2) not null
);
create index if not exists conti_righe_conto_idx on public.conti_mascalcia_righe (conto_id);
create index if not exists conti_righe_interv_idx on public.conti_mascalcia_righe (intervento_id);

create table if not exists public.conti_mascalcia_contatori (
  maniscalco_id uuid not null,
  anno int not null,
  ultimo int not null default 0,
  primary key (maniscalco_id, anno)
);

alter table public.conti_mascalcia enable row level security;
alter table public.conti_mascalcia_righe enable row level security;
alter table public.conti_mascalcia_contatori enable row level security;

drop policy if exists conti_sel on public.conti_mascalcia;
create policy conti_sel on public.conti_mascalcia for select to authenticated using (maniscalco_id = auth.uid());
drop policy if exists conti_righe_sel on public.conti_mascalcia_righe;
create policy conti_righe_sel on public.conti_mascalcia_righe for select to authenticated
  using (exists (select 1 from public.conti_mascalcia c where c.id = conto_id and c.maniscalco_id = auth.uid()));
-- scrittura solo tramite le funzioni qui sotto
revoke all on public.conti_mascalcia, public.conti_mascalcia_righe, public.conti_mascalcia_contatori from anon, authenticated;
grant select on public.conti_mascalcia, public.conti_mascalcia_righe to authenticated;

-- ---- crea il conto (numerazione atomica) ----
-- p_righe: [{intervento_id, cavallo_nome, proprietario_nome, descrizione}] ; importo e data li legge il database
create or replace function public.equo_crea_conto(p_cliente uuid, p_modo text, p_da date, p_a date, p_righe jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_anno int := extract(year from now())::int;
  v_num int; v_id uuid; v_tot numeric := 0; v_n int := 0;
  r jsonb; iv record;
begin
  if v_uid is null then raise exception 'non autenticato'; end if;
  if not exists (select 1 from clienti_mascalcia where id = p_cliente and maniscalco_id = v_uid) then
    raise exception 'cliente non tuo';
  end if;
  if p_righe is null or jsonb_typeof(p_righe) <> 'array' or jsonb_array_length(p_righe) = 0 then
    raise exception 'nessun lavoro nel conto';
  end if;
  insert into conti_mascalcia_contatori (maniscalco_id, anno, ultimo) values (v_uid, v_anno, 1)
    on conflict (maniscalco_id, anno) do update set ultimo = conti_mascalcia_contatori.ultimo + 1
    returning ultimo into v_num;
  insert into conti_mascalcia (maniscalco_id, cliente_mascalcia_id, anno, numero, modo, periodo_da, periodo_a)
    values (v_uid, p_cliente, v_anno, v_num, case when p_modo = 'per_proprietario' then 'per_proprietario' else 'unico' end, p_da, p_a)
    returning id into v_id;
  for r in select * from jsonb_array_elements(p_righe) loop
    select i.id, i.horse_id, i.data_intervento, i.importo into iv from interventi_mascalcia i
      where i.id = (r->>'intervento_id')::uuid and i.maniscalco_id = v_uid and i.stato = 'fatto'
        and coalesce(i.stato_pagamento, '') <> 'saldato' and coalesce(i.importo, 0) > 0
      for update;
    if not found then raise exception 'lavoro non valido o già saldato'; end if;
    if exists (select 1 from conti_mascalcia_righe cr join conti_mascalcia c on c.id = cr.conto_id
               where cr.intervento_id = iv.id and c.stato <> 'annullato') then
      raise exception 'lavoro già in un altro conto';
    end if;
    insert into conti_mascalcia_righe (conto_id, intervento_id, horse_id, cavallo_nome, proprietario_nome, data_intervento, descrizione, importo)
      values (v_id, iv.id, iv.horse_id, left(r->>'cavallo_nome', 120), left(r->>'proprietario_nome', 120), iv.data_intervento, left(r->>'descrizione', 200), iv.importo);
    v_tot := v_tot + iv.importo; v_n := v_n + 1;
  end loop;
  update conti_mascalcia set totale = v_tot, n_lavori = v_n where id = v_id;
  return jsonb_build_object('id', v_id, 'anno', v_anno, 'numero', v_num, 'totale', v_tot, 'n_lavori', v_n);
end $$;

-- ---- conto pagato: i lavori diventano saldati (la data di incasso la mette il trigger esistente) ----
create or replace function public.equo_conto_pagato(p_conto uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid(); c record; v_n int := 0;
begin
  select * into c from conti_mascalcia where id = p_conto and maniscalco_id = v_uid for update;
  if not found then raise exception 'conto non trovato'; end if;
  if c.stato <> 'da_incassare' then raise exception 'conto non più da incassare'; end if;
  update interventi_mascalcia set stato_pagamento = 'saldato'
    where id in (select intervento_id from conti_mascalcia_righe where conto_id = p_conto) and maniscalco_id = v_uid;
  update conti_mascalcia set stato = 'pagato', pagato_il = now() where id = p_conto;
  -- storico a vita: una riga per cavallo
  insert into cavalli_storico (codice_equo, horse_id, scuderia_cavallo_id, cavallo_cliente_id, tipo, descrizione, autore_user_id, autore_ruolo, app)
  select distinct on (cc.id) cc.codice_equo, cc.horse_id, cc.scuderia_cavallo_id, cc.id, 'pagamento',
         'Lavori saldati con il conto C-' || c.anno || '-' || lpad(c.numero::text, 3, '0') || ' (maniscalco ' || equo_nome_profilo(v_uid) || ')', v_uid, 'maniscalco', 'app'
  from conti_mascalcia_righe r
  join interventi_mascalcia i on i.id = r.intervento_id
  join cavalli_clienti_mascalcia cc on cc.id = i.cavallo_cliente_id
  where r.conto_id = p_conto;
  get diagnostics v_n = row_count;
  return jsonb_build_object('ok', true, 'cavalli', v_n);
end $$;

-- ---- annulla il conto: i lavori tornano liberi (restano da saldare) ----
create or replace function public.equo_conto_annulla(p_conto uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); c record;
begin
  select * into c from conti_mascalcia where id = p_conto and maniscalco_id = v_uid for update;
  if not found then raise exception 'conto non trovato'; end if;
  if c.stato <> 'da_incassare' then raise exception 'si annulla solo un conto da incassare'; end if;
  update conti_mascalcia set stato = 'annullato', annullato_il = now() where id = p_conto;
  return jsonb_build_object('ok', true);
end $$;

revoke all on function public.equo_crea_conto(uuid, text, date, date, jsonb) from public;
revoke all on function public.equo_conto_pagato(uuid) from public;
revoke all on function public.equo_conto_annulla(uuid) from public;
grant execute on function public.equo_crea_conto(uuid, text, date, date, jsonb) to authenticated;
grant execute on function public.equo_conto_pagato(uuid) to authenticated;
grant execute on function public.equo_conto_annulla(uuid) to authenticated;

-- ---- guide di Hammer ----
insert into public.ai_conoscenze (ambito, categoria, attivo, titolo, contenuto, aggiornato_il, verificato_il)
select 'maniscalco', 'guida', true, 'Fare il conto di una scuderia o di un cliente (PDF)',
'Dove: scheda della scuderia o del cliente → "Fai il conto"; oppure Incassi → Da incassare → "Fai il conto".
Passi:
1. Scegli chi paga: "Conto unico" (tutta la scuderia, con i cavalli raggruppati per proprietario) oppure "Un conto per proprietario" (un PDF e un numero per ciascuno).
2. Scegli il periodo: di default tutto quello che non è ancora saldato; in alternativa questo mese, mese scorso o date a scelta.
3. Togli la spunta ai lavori che non vuoi mettere nel conto, controlla il totale e premi "Crea il PDF".
4. Il conto prende un numero (es. C-2026-007), resta salvato in "Conti fatti" come "da incassare" e puoi mandarlo: chat di Equo, email, WhatsApp o scarica il PDF.
5. Quando ti pagano: "Segna pagato" → tutti i lavori del conto diventano saldati. Se hai sbagliato: "Annulla" (il conto resta nell''elenco come annullato e i lavori tornano liberi) e lo rifai.
Note: Il conto è sempre intero (niente pagamento a pezzi). Un lavoro può stare in un solo conto attivo. Il PDF è un resoconto, non una fattura e non ha valore fiscale; mostra cavallo, data, lavoro e importo, mai i ferri nuovi né le note private. Se hai nascosto gli incassi serve il PIN. Nei dati di pagamento del PDF compaiono IBAN e PayPal che hai inserito nel profilo.
Parole chiave: conto, resoconto, saldo, pdf, scuderia, conto unico, per proprietario, da incassare, pagato, annulla, numero conto, incassare', now(), current_date
where not exists (select 1 from public.ai_conoscenze where titolo = 'Fare il conto di una scuderia o di un cliente (PDF)' and ambito = 'maniscalco');

-- controllo: deve dare 3 · 1 · 3 · 1
select (select count(*) from information_schema.tables where table_name in ('conti_mascalcia','conti_mascalcia_righe','conti_mascalcia_contatori')) as tabelle,
       (select count(*) from pg_class where relname = 'conti_mascalcia' and relrowsecurity) as rls,
       (select count(*) from pg_proc where proname in ('equo_crea_conto','equo_conto_pagato','equo_conto_annulla')) as funzioni,
       (select count(*) from ai_conoscenze where titolo = 'Fare il conto di una scuderia o di un cliente (PDF)') as guida;
