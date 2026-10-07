-- Equo: SCHEDA CAVALLO UNICA, passo 1 — un solo cavallo, un solo numero Equo (7 ottobre 2026)
-- Legame stabile tra la scheda del proprietario (horses) e la scheda della struttura (scuderia_cavalli).
-- Stesso proprietario + stesso microchip → collegate in automatico. Solo stesso nome → decide il proprietario in App.
-- All'unione resta il numero più vecchio; il vecchio numero resta valido come alias e tutto finisce in cavalli_storico.

-- 1) legame stabile + alias dei numeri sostituiti + rifiuti del proprietario
alter table public.scuderia_cavalli add column if not exists horse_id uuid references public.horses(id) on delete set null;
create unique index if not exists scuderia_cavalli_centro_horse_uq on public.scuderia_cavalli (centro_id, horse_id) where horse_id is not null;
create index if not exists scuderia_cavalli_horse_idx on public.scuderia_cavalli (horse_id);

create table if not exists public.equo_numeri_unificati (
  numero_vecchio bigint primary key,
  numero bigint not null,
  horse_id uuid,
  scuderia_cavallo_id uuid,
  created_at timestamptz not null default now()
);
alter table public.equo_numeri_unificati enable row level security;

create table if not exists public.equo_collegamenti_rifiutati (
  horse_id uuid not null references public.horses(id) on delete cascade,
  scuderia_cavallo_id uuid not null references public.scuderia_cavalli(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (horse_id, scuderia_cavallo_id)
);
alter table public.equo_collegamenti_rifiutati enable row level security;

create or replace function public.equo_chip(t text) returns text language sql immutable as $$
  select nullif(upper(regexp_replace(coalesce(t, ''), '\s', '', 'g')), '')
$$;

-- 2) i trigger del codice permettono di cambiare numero SOLO durante un'unione (flag equo.unifica)
create or replace function public.equo_codice_horses()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    new.equo_numero := coalesce(new.equo_numero, nextval('public.equo_cavalli_seq'));
  elsif coalesce(current_setting('equo.unifica', true), '') = 'on' then
    new.equo_numero := coalesce(new.equo_numero, old.equo_numero);
  else
    new.equo_numero := coalesce(old.equo_numero, new.equo_numero, nextval('public.equo_cavalli_seq'));
  end if;
  new.codice_equo := public.equo_formatta_codice(public.equo_sigla_razza(new.breed), new.equo_numero);
  return new;
end $$;

create or replace function public.equo_codice_scuderia()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    new.equo_numero := coalesce(new.equo_numero, nextval('public.equo_cavalli_seq'));
  elsif coalesce(current_setting('equo.unifica', true), '') = 'on' then
    new.equo_numero := coalesce(new.equo_numero, old.equo_numero);
  else
    new.equo_numero := coalesce(old.equo_numero, new.equo_numero, nextval('public.equo_cavalli_seq'));
  end if;
  new.codice_equo := public.equo_formatta_codice(public.equo_sigla_razza(new.razza), new.equo_numero);
  return new;
end $$;

-- 3) collega scheda struttura ↔ cavallo del proprietario e tiene il numero più vecchio
create or replace function public.equo_collega_cavallo(p_horse uuid, p_scheda uuid, p_come text, p_avvisa boolean default true)
returns json language plpgsql security definer set search_path = public as $$
declare v_h horses; v_s scuderia_cavalli; v_min bigint; v_vecchi text; r record; v_membro uuid; v_centro text;
begin
  select * into v_h from horses where id = p_horse;
  select * into v_s from scuderia_cavalli where id = p_scheda;
  if v_h.id is null or v_s.id is null then return json_build_object('ok', false, 'motivo', 'non_trovato'); end if;
  if v_s.horse_id is not null and v_s.horse_id <> p_horse then return json_build_object('ok', false, 'motivo', 'gia_collegata_ad_altro'); end if;
  if exists (select 1 from scuderia_cavalli where centro_id = v_s.centro_id and horse_id = p_horse and id <> p_scheda) then
    return json_build_object('ok', false, 'motivo', 'cavallo_gia_collegato_nel_centro');
  end if;
  if v_s.horse_id is null then
    update scuderia_cavalli set horse_id = p_horse where id = p_scheda;
    select nome into v_centro from centri where id = v_s.centro_id;
    insert into cavalli_storico (codice_equo, horse_id, scuderia_cavallo_id, tipo, descrizione, autore_user_id, autore_ruolo, app)
    values (v_h.codice_equo, p_horse, p_scheda, 'collegamento',
            'Scheda di ' || coalesce(v_centro, 'struttura') || ' collegata alla scheda del proprietario: è lo stesso cavallo ('
            || case p_come when 'microchip' then 'stesso microchip' when 'proprietario' then 'confermato dal proprietario' else p_come end || ')',
            auth.uid(), case p_come when 'proprietario' then 'proprietario' else 'sistema' end, 'equo');
  end if;

  -- numero più vecchio fra tutte le copie collegate (scheda del proprietario + schede di tutte le strutture)
  select min(n) into v_min from (
    select v_h.equo_numero n union all select equo_numero from scuderia_cavalli where horse_id = p_horse
  ) x where n is not null;
  select string_agg(distinct codice_equo, ', ') into v_vecchi from (
    select codice_equo, equo_numero from horses where id = p_horse
    union all select codice_equo, equo_numero from scuderia_cavalli where horse_id = p_horse
  ) x where equo_numero <> v_min;

  if v_vecchi is not null then
    perform set_config('equo.unifica', 'on', true);
    insert into equo_numeri_unificati (numero_vecchio, numero, horse_id, scuderia_cavallo_id)
    select x.equo_numero, v_min, p_horse, x.sid from (
      select equo_numero, null::uuid sid from horses where id = p_horse
      union all select equo_numero, id from scuderia_cavalli where horse_id = p_horse
    ) x where x.equo_numero <> v_min
    on conflict (numero_vecchio) do update set numero = excluded.numero;
    update equo_numeri_unificati set numero = v_min where numero in (select numero_vecchio from equo_numeri_unificati where numero = v_min) and numero <> v_min;
    update horses set equo_numero = v_min where id = p_horse and equo_numero <> v_min;
    update scuderia_cavalli set equo_numero = v_min where horse_id = p_horse and equo_numero <> v_min;
    perform set_config('equo.unifica', '', true);
    select codice_equo into v_h.codice_equo from horses where id = p_horse;
    insert into cavalli_storico (codice_equo, horse_id, scuderia_cavallo_id, tipo, descrizione, autore_user_id, autore_ruolo, app)
    values (v_h.codice_equo, p_horse, p_scheda, 'codice_unificato',
            'Codice Equo unificato: resta il n. ' || v_min || ' (il più vecchio). Prima: ' || v_vecchi || ' (vale ancora per la ricerca)',
            auth.uid(), 'sistema', 'equo');
  end if;

  -- avviso nella chat struttura ↔ proprietario (la leggono entrambi)
  if p_avvisa then
    select m.id into v_membro from scuderia_membri m where m.id = v_s.proprietario_membro_id and m.user_id = v_h.owner_id;
    if v_membro is not null then
      insert into chat_messaggi (centro_id, membro_id, mittente_user_id, tipo, testo, letto)
      values (v_s.centro_id, v_membro, v_h.owner_id, 'testo',
              'ℹ️ Avviso automatico di Equo — ' || v_h.name || ': la scheda della scuderia e quella del proprietario ora sono un unico cavallo, codice Equo n. ' || v_min
              || coalesce(' (prima ' || v_vecchi || ')', '') || '. Registro sanitario, appuntamenti e storico sono condivisi.', false);
    end if;
  end if;
  return json_build_object('ok', true, 'numero', v_min, 'prima', v_vecchi);
end $$;
revoke execute on function public.equo_collega_cavallo(uuid, uuid, text, boolean) from public, anon, authenticated;

-- 4) collegamento automatico: stesso proprietario + stesso microchip (mai se ambiguo)
create or replace function public.equo_auto_collega_scheda()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_h uuid; v_n int;
begin
  if new.horse_id is not null or new.proprietario_membro_id is null or equo_chip(new.microchip) is null then return null; end if;
  select count(*), min(h.id::text)::uuid into v_n, v_h
    from horses h join scuderia_membri m on m.user_id = h.owner_id
   where m.id = new.proprietario_membro_id and equo_chip(h.microchip) = equo_chip(new.microchip);
  if v_n = 1 and not exists (select 1 from equo_collegamenti_rifiutati where horse_id = v_h and scuderia_cavallo_id = new.id) then
    perform equo_collega_cavallo(v_h, new.id, 'microchip', true);
  end if;
  return null;
end $$;
drop trigger if exists trg_scuderia_cavalli_auto_collega on public.scuderia_cavalli;
create trigger trg_scuderia_cavalli_auto_collega after insert or update of microchip, proprietario_membro_id on public.scuderia_cavalli
  for each row execute function public.equo_auto_collega_scheda();

create or replace function public.equo_auto_collega_horse()
returns trigger language plpgsql security definer set search_path = public as $$
declare r record;
begin
  if equo_chip(new.microchip) is null then return null; end if;
  for r in
    select sc.id from scuderia_cavalli sc join scuderia_membri m on m.id = sc.proprietario_membro_id
     where m.user_id = new.owner_id and sc.horse_id is null and equo_chip(sc.microchip) = equo_chip(new.microchip)
       and (select count(*) from scuderia_cavalli s2 join scuderia_membri m2 on m2.id = s2.proprietario_membro_id
             where s2.centro_id = sc.centro_id and m2.user_id = new.owner_id and equo_chip(s2.microchip) = equo_chip(new.microchip)) = 1
       and (select count(*) from horses h2 where h2.owner_id = new.owner_id and equo_chip(h2.microchip) = equo_chip(new.microchip)) = 1
       and not exists (select 1 from equo_collegamenti_rifiutati x where x.horse_id = new.id and x.scuderia_cavallo_id = sc.id)
  loop
    perform equo_collega_cavallo(new.id, r.id, 'microchip', true);
  end loop;
  return null;
end $$;
drop trigger if exists trg_horses_auto_collega on public.horses;
create trigger trg_horses_auto_collega after insert or update of microchip, owner_id on public.horses
  for each row execute function public.equo_auto_collega_horse();

-- 5) stesso nome ma senza microchip comune: decide il proprietario (App)
create or replace function public.equo_proposte_collegamento()
returns table(horse_id uuid, horse_nome text, scuderia_cavallo_id uuid, scheda_nome text, centro_nome text, codice_scheda text)
language sql stable security definer set search_path = public as $$
  select h.id, h.name, sc.id, sc.nome, c.nome, sc.codice_equo
    from horses h
    join scuderia_membri m on m.user_id = h.owner_id
    join scuderia_cavalli sc on sc.proprietario_membro_id = m.id and sc.centro_id = m.centro_id
    join centri c on c.id = sc.centro_id
   where h.owner_id = auth.uid()
     and sc.horse_id is null
     and equo_norm(sc.nome) = equo_norm(h.name) and equo_norm(h.name) <> ''
     and not (equo_chip(sc.microchip) is not null and equo_chip(h.microchip) is not null and equo_chip(sc.microchip) <> equo_chip(h.microchip))
     and not exists (select 1 from scuderia_cavalli x where x.centro_id = sc.centro_id and x.horse_id = h.id)
     and not exists (select 1 from equo_collegamenti_rifiutati r where r.horse_id = h.id and r.scuderia_cavallo_id = sc.id)
   order by h.name;
$$;
grant execute on function public.equo_proposte_collegamento() to authenticated;

create or replace function public.equo_conferma_collegamento(p_horse uuid, p_scheda uuid, p_stesso boolean)
returns json language plpgsql security definer set search_path = public as $$
declare v_ok boolean; v_res json; v_h horses; v_s scuderia_cavalli;
begin
  select exists (select 1 from equo_proposte_collegamento() p where p.horse_id = p_horse and p.scuderia_cavallo_id = p_scheda) into v_ok;
  if not v_ok then return json_build_object('ok', false, 'motivo', 'non_disponibile'); end if;
  if not p_stesso then
    insert into equo_collegamenti_rifiutati (horse_id, scuderia_cavallo_id) values (p_horse, p_scheda) on conflict do nothing;
    select * into v_h from horses where id = p_horse;
    insert into cavalli_storico (codice_equo, horse_id, scuderia_cavallo_id, tipo, descrizione, autore_user_id, autore_ruolo, app)
    values (v_h.codice_equo, p_horse, p_scheda, 'collegamento_rifiutato', 'Il proprietario ha indicato che la scheda omonima della struttura NON è questo cavallo', auth.uid(), 'proprietario', 'app');
    return json_build_object('ok', true, 'collegato', false);
  end if;
  v_res := equo_collega_cavallo(p_horse, p_scheda, 'proprietario', true);
  return v_res;
end $$;
grant execute on function public.equo_conferma_collegamento(uuid, uuid, boolean) to authenticated;

-- 6) il legame stabile sostituisce l'abbinamento per nome/microchip (registro sanitario, avvisi appuntamenti)
create or replace function public.equo_schede_scuderia_di(p_horse uuid)
returns table(scuderia_cavallo_id uuid, centro_id uuid, membro_id uuid, nome text)
language sql stable security definer set search_path = public as $$
  select sc.id, sc.centro_id, m.id, sc.nome
    from horses h
    join scuderia_cavalli sc on sc.horse_id = h.id
    join scuderia_membri m on m.id = sc.proprietario_membro_id and m.user_id = h.owner_id and m.centro_id = sc.centro_id
   where h.id = p_horse;
$$;

create or replace function public.equo_horse_di_scheda(p_scheda uuid)
returns uuid language sql stable security definer set search_path = public as $$
  select h.id
    from scuderia_cavalli sc
    join horses h on h.id = sc.horse_id
    join scuderia_membri m on m.id = sc.proprietario_membro_id and m.user_id = h.owner_id
   where sc.id = p_scheda;
$$;

-- 7) un codice vecchio continua a funzionare (ricerca del maniscalco col codice Equo)
do $$
declare v_def text;
begin
  select pg_get_functiondef(p.oid) into v_def from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'pro_cavallo_da_codice';
  if v_def is not null and v_def not like '%equo_numeri_unificati%' then
    v_def := replace(v_def, 'v_num := v_m[2]::bigint;',
      'v_num := v_m[2]::bigint; v_num := coalesce((select u.numero from public.equo_numeri_unificati u where u.numero_vecchio = v_num), v_num);');
    execute v_def;
  end if;
end $$;

-- 8) collega subito le coppie già esistenti con lo stesso microchip (oggi: Rio, n. 2 e n. 7 → resta 2)
do $$
declare r record;
begin
  for r in
    select h.id hid, sc.id sid
      from horses h
      join scuderia_membri m on m.user_id = h.owner_id
      join scuderia_cavalli sc on sc.proprietario_membro_id = m.id and sc.centro_id = m.centro_id
     where sc.horse_id is null and equo_chip(sc.microchip) is not null and equo_chip(sc.microchip) = equo_chip(h.microchip)
  loop
    perform public.equo_collega_cavallo(r.hid, r.sid, 'microchip', true);
  end loop;
end $$;

-- 9) guide degli agenti AI
insert into public.ai_conoscenze (ambito, categoria, titolo, contenuto, attivo, verificato_il)
select 'proprietario', 'guida', 'Un solo cavallo, un solo codice Equo',
'Dove: automatico; per i casi dubbi un avviso in App «È lo stesso cavallo?»
Passi:
1. Se la tua scuderia ha una scheda del tuo cavallo con lo stesso microchip, Equo le unisce da solo: è un unico cavallo.
2. Se la scheda ha solo lo stesso nome, all''apertura dell''App ti chiediamo «È lo stesso cavallo?»: tocca «Sì, è lui» per unirle o «No, è un altro» per tenerle separate.
3. Dopo l''unione il cavallo ha un solo codice Equo: resta il numero più vecchio. Il vecchio codice funziona ancora per cercarlo.
4. Registro sanitario, appuntamenti e storico sono condivisi con la scuderia e con i maniscalchi del cavallo.
Esempio: Rio aveva PSI-000002 in App e ALT-000007 in scuderia (stesso microchip): ora è il n. 2 per tutti.
Note: Le 3 lettere del codice seguono la razza e sono solo descrittive: il cavallo lo identifica il NUMERO. Nella chat con la scuderia trovi l''avviso dell''unione. Spese e note personali restano tue. Aggiungi il microchip al cavallo: è il modo più sicuro per collegarlo.
Parole chiave: codice equo, stesso cavallo, doppione, unire schede, microchip, numero cavallo, scheda unica, collegare cavallo scuderia'
, true, current_date
where not exists (select 1 from public.ai_conoscenze where titolo = 'Un solo cavallo, un solo codice Equo');

insert into public.ai_conoscenze (ambito, categoria, titolo, contenuto, attivo, verificato_il)
select 'scuderia', 'guida', 'Scheda cavallo unica con il proprietario',
'Dove: Cavalli → scheda del cavallo (automatico)
Passi:
1. Collega il proprietario alla scheda (codice del proprietario o richiesta dall''App) e inserisci il microchip.
2. Se il proprietario ha in App un cavallo con lo stesso microchip, Equo unisce le due schede: è un unico cavallo con un solo codice Equo (resta il numero più vecchio, quello vecchio vale ancora per la ricerca).
3. Se coincide solo il nome, decide il proprietario dall''App («È lo stesso cavallo?»).
4. Da quel momento registro sanitario, appuntamenti del maniscalco e storico sono condivisi; nella chat con il proprietario arriva l''avviso dell''unione.
Esempio: Rio era ALT-000007 in scuderia e PSI-000002 per il proprietario: ora è il n. 2 per tutti.
Note: Box, note interne, lezioni e contabilità restano solo del centro. Il numero è l''identità del cavallo; le 3 lettere seguono la razza.
Parole chiave: scheda unica, stesso cavallo, codice equo cambiato, doppione, microchip, collegare proprietario, numero cavallo'
, true, current_date
where not exists (select 1 from public.ai_conoscenze where titolo = 'Scheda cavallo unica con il proprietario');

insert into public.ai_conoscenze (ambito, categoria, titolo, contenuto, attivo, verificato_il)
select 'maniscalco', 'guida', 'Perché è cambiato il codice Equo di un cavallo',
'Dove: Clienti → cliente → cavalli (automatico)
Passi:
1. Quando la scheda della scuderia e quella del proprietario risultano lo stesso cavallo (stesso microchip o conferma del proprietario), Equo le unisce.
2. Il cavallo tiene un solo numero, il più vecchio: nelle tue schede vedi il nuovo codice.
3. Il vecchio codice funziona ancora in «Codice Equo del cavallo».
Esempio: Rio era ALT-000007 da Scuderia Colleferro e PSI-000002 dal proprietario: ora è il n. 2 in entrambe.
Note: Se lo stesso cavallo compare in due tuoi clienti (proprietario e struttura), usa «Codice Equo del cavallo» nel cliente dove si trova davvero per spostarlo: resta una sola scheda.
Parole chiave: codice cambiato, numero equo, doppione, stesso cavallo, unione schede'
, true, current_date
where not exists (select 1 from public.ai_conoscenze where titolo = 'Perché è cambiato il codice Equo di un cavallo');

-- controllo finale: deve dare 1 · 2 · 3 (Rio collegato, numero 2 su entrambe le schede, 3 guide)
select (select count(*) from scuderia_cavalli where horse_id is not null) as schede_collegate,
       (select max(equo_numero) from scuderia_cavalli where id = '53ad24ec-c4de-41e0-9c41-5ee893c8879d') as numero_rio,
       (select count(*) from ai_conoscenze where titolo in ('Un solo cavallo, un solo codice Equo','Scheda cavallo unica con il proprietario','Perché è cambiato il codice Equo di un cavallo')) as guide;
