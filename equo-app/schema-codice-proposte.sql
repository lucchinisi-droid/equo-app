-- Equo: IL MANISCALCO PREPARA I CAVALLI, IL PROPRIETARIO LI RICEVE  FASE 2B (database)  18 ottobre 2026
-- Prassi: il maniscalco ha gia' inserito cavalli e proprietario; il proprietario scarica l'app e si abbina; NON crea i cavalli:
-- il maniscalco glieli propone, il proprietario li accetta (o tocca "Non e' mio"), li completa e conferma; poi conferma anche
-- il maniscalco (o un altro professionista) e il cavallo diventa Validato.
-- Accettando, il cavallo nasce nell'account del proprietario con LO STESSO numero provvisorio della scheda del maniscalco:
-- storico, lavori, problemi e allegati restano agganciati e non possono nascere doppioni.
-- Se il proprietario aveva gia' un cavallo con lo stesso nome, la scheda si collega a quello (resta il numero piu' vecchio).
-- Il piano Free (1 cavallo) resta in vigore: se il limite impedisce di accettare, la funzione risponde limite_cavalli_free.
-- Da eseguire a BLOCCHI, uno alla volta, nel SQL Editor. Idempotente.

-- ===== BLOCCO P1 - tabella delle proposte =====
create table if not exists public.cavalli_proposte (
  id uuid primary key default gen_random_uuid(),
  riga_id uuid not null unique references public.cavalli_clienti_mascalcia(id) on delete cascade,
  maniscalco_id uuid not null,
  cliente_mascalcia_id uuid not null,
  owner_id uuid not null,
  stato text not null default 'in_attesa' check (stato in ('in_attesa', 'accettata', 'rifiutata')),
  horse_id uuid,
  created_at timestamptz not null default now(),
  risposto_il timestamptz
);
create index if not exists cavalli_proposte_owner_idx on public.cavalli_proposte (owner_id, stato);
alter table public.cavalli_proposte enable row level security;
revoke all on public.cavalli_proposte from anon, authenticated;

-- ===== BLOCCO P2 - il maniscalco propone i cavalli di un cliente collegato =====
create or replace function public.equo_proponi_interno(p_cliente uuid, p_riga uuid default null) returns int
language plpgsql security definer set search_path to 'public' as $fn$
declare v_c clienti_mascalcia; n int := 0; r record;
begin
  select * into v_c from clienti_mascalcia c where c.id = p_cliente;
  if v_c.id is null or v_c.cliente_user_id is null then return 0; end if;
  for r in
    select cv.id from cavalli_clienti_mascalcia cv
     where cv.cliente_mascalcia_id = p_cliente and cv.horse_id is null and cv.scuderia_cavallo_id is null
       and (p_riga is null or cv.id = p_riga)
  loop
    insert into cavalli_proposte (riga_id, maniscalco_id, cliente_mascalcia_id, owner_id)
    values (r.id, v_c.maniscalco_id, p_cliente, v_c.cliente_user_id)
    on conflict (riga_id) do update set stato = 'in_attesa', risposto_il = null, owner_id = excluded.owner_id
     where p_riga is not null and cavalli_proposte.stato = 'rifiutata';
    if found then n := n + 1; end if;
  end loop;
  return n;
end
$fn$;
revoke all on function public.equo_proponi_interno(uuid, uuid) from public, anon, authenticated;

create or replace function public.equo_proponi_cavalli_cliente(p_cliente uuid, p_riga uuid default null) returns json
language plpgsql security definer set search_path to 'public' as $fn$
declare v_n int;
begin
  if auth.uid() is null then return json_build_object('ok', false, 'motivo', 'non_autenticato'); end if;
  if not exists (select 1 from clienti_mascalcia c where c.id = p_cliente and c.maniscalco_id = auth.uid()) then
    return json_build_object('ok', false, 'motivo', 'cliente_non_trovato');
  end if;
  if not exists (select 1 from clienti_mascalcia c where c.id = p_cliente and c.cliente_user_id is not null) then
    return json_build_object('ok', false, 'motivo', 'cliente_non_collegato');
  end if;
  v_n := equo_proponi_interno(p_cliente, p_riga);
  return json_build_object('ok', true, 'proposti', v_n);
end
$fn$;
revoke all on function public.equo_proponi_cavalli_cliente(uuid, uuid) from public, anon;
grant execute on function public.equo_proponi_cavalli_cliente(uuid, uuid) to authenticated;

-- appena il cliente si collega (prima volta che compare il suo account) le schede manuali diventano proposte
create or replace function public.equo_proposte_al_collegamento() returns trigger
language plpgsql security definer set search_path to 'public' as $fn$
begin
  if old.cliente_user_id is null and new.cliente_user_id is not null then
    perform equo_proponi_interno(new.id, null);
  end if;
  return null;
end
$fn$;
drop trigger if exists trg_proposte_al_collegamento on public.clienti_mascalcia;
create trigger trg_proposte_al_collegamento after update of cliente_user_id on public.clienti_mascalcia
  for each row execute function public.equo_proposte_al_collegamento();

-- ===== BLOCCO P3 - il proprietario vede, accetta o rifiuta =====
create or replace function public.equo_proposte_cavalli_proprietario() returns json
language sql stable security definer set search_path to 'public' as $fn$
  select coalesce(json_agg(json_build_object(
    'proposta', p.id, 'riga', cv.id, 'nome', cv.nome, 'razza', cv.razza, 'microchip', cv.microchip,
    'codice', cv.codice_equo, 'maniscalco', equo_nome_profilo(p.maniscalco_id), 'cliente', c.nome,
    'dal', p.created_at,
    'esiste_gia', exists (select 1 from horses h where h.owner_id = auth.uid() and equo_norm_nome(h.name) = equo_norm_nome(cv.nome))
  ) order by p.created_at, cv.nome), '[]'::json)
  from cavalli_proposte p
  join cavalli_clienti_mascalcia cv on cv.id = p.riga_id
  join clienti_mascalcia c on c.id = p.cliente_mascalcia_id
  where p.owner_id = auth.uid() and p.stato = 'in_attesa' and auth.uid() is not null
$fn$;
revoke all on function public.equo_proposte_cavalli_proprietario() from public, anon;
grant execute on function public.equo_proposte_cavalli_proprietario() to authenticated;

create or replace function public.equo_accetta_cavallo_proposto(p_proposta uuid) returns json
language plpgsql security definer set search_path to 'public' as $fn$
declare v_uid uuid := auth.uid(); v_p cavalli_proposte; v_r cavalli_clienti_mascalcia; v_h horses; v_new uuid; v_horse uuid; v_come text;
begin
  if v_uid is null then return json_build_object('ok', false, 'motivo', 'non_autenticato'); end if;
  select * into v_p from cavalli_proposte p where p.id = p_proposta and p.owner_id = v_uid and p.stato = 'in_attesa';
  if v_p.id is null then return json_build_object('ok', false, 'motivo', 'proposta_non_trovata'); end if;
  select * into v_r from cavalli_clienti_mascalcia cv where cv.id = v_p.riga_id;
  if v_r.id is null then return json_build_object('ok', false, 'motivo', 'scheda_non_trovata'); end if;

  if v_r.horse_id is not null then
    v_horse := v_r.horse_id; v_come := 'gia_collegata';
  else
    select h.* into v_h from horses h
     where h.owner_id = v_uid and h.condiviso_ecosistema is true and equo_norm_nome(h.name) = equo_norm_nome(v_r.nome)
     order by h.created_at limit 1;
    if v_h.id is not null then
      update cavalli_clienti_mascalcia set horse_id = v_h.id, nome = v_h.name,
        microchip = coalesce(nullif(microchip, ''), v_h.microchip) where id = v_r.id;
      perform equo_unifica_numero_cavallo(v_h.id, array[v_r.equo_numero]);
      v_horse := v_h.id; v_come := 'collegato_esistente';
    else
      begin
        insert into horses (owner_id, name, breed, microchip, equo_numero)
        values (v_uid, v_r.nome, nullif(trim(coalesce(v_r.razza, '')), ''), nullif(trim(coalesce(v_r.microchip, '')), ''), v_r.equo_numero)
        returning id into v_new;
      exception when others then
        if sqlerrm like 'LIMITE_CAVALLI_FREE%' then
          return json_build_object('ok', false, 'motivo', 'limite_cavalli_free');
        end if;
        raise;
      end;
      update cavalli_clienti_mascalcia set horse_id = v_new where id = v_r.id;
      v_horse := v_new; v_come := 'creato';
    end if;
    insert into cavalli_storico (codice_equo, horse_id, cavallo_cliente_id, tipo, descrizione, autore_user_id, autore_ruolo, app)
    select cv.codice_equo, v_horse, cv.id, 'collegamento',
      'Cavallo preparato dal maniscalco (' || cv.nome || ') e accettato dal proprietario: stessa scheda, nessun doppione',
      v_uid, 'proprietario', 'app' from cavalli_clienti_mascalcia cv where cv.id = v_r.id;
  end if;

  update cavalli_proposte set stato = 'accettata', horse_id = v_horse, risposto_il = now() where id = v_p.id;
  return json_build_object('ok', true, 'horse_id', v_horse, 'esito', v_come,
    'codice', (select h.codice_equo from horses h where h.id = v_horse));
end
$fn$;
revoke all on function public.equo_accetta_cavallo_proposto(uuid) from public, anon;
grant execute on function public.equo_accetta_cavallo_proposto(uuid) to authenticated;

create or replace function public.equo_rifiuta_cavallo_proposto(p_proposta uuid) returns json
language plpgsql security definer set search_path to 'public' as $fn$
begin
  if auth.uid() is null then return json_build_object('ok', false, 'motivo', 'non_autenticato'); end if;
  update cavalli_proposte set stato = 'rifiutata', risposto_il = now()
   where id = p_proposta and owner_id = auth.uid() and stato = 'in_attesa';
  if not found then return json_build_object('ok', false, 'motivo', 'proposta_non_trovata'); end if;
  return json_build_object('ok', true);
end
$fn$;
revoke all on function public.equo_rifiuta_cavallo_proposto(uuid) from public, anon;
grant execute on function public.equo_rifiuta_cavallo_proposto(uuid) to authenticated;

-- ===== BLOCCO P4 - elenchi per l'app: proposte inviate (maniscalco) e cavalli da confermare (tutti) =====
create or replace function public.equo_proposte_inviate(p_cliente uuid default null) returns json
language sql stable security definer set search_path to 'public' as $fn$
  select coalesce(json_agg(json_build_object(
    'proposta', p.id, 'riga', cv.id, 'nome', cv.nome, 'cliente', p.cliente_mascalcia_id, 'stato', p.stato,
    'horse_id', p.horse_id, 'dal', p.created_at, 'risposto_il', p.risposto_il
  ) order by p.created_at, cv.nome), '[]'::json)
  from cavalli_proposte p
  join cavalli_clienti_mascalcia cv on cv.id = p.riga_id
  where p.maniscalco_id = auth.uid() and auth.uid() is not null and (p_cliente is null or p.cliente_mascalcia_id = p_cliente)
$fn$;
revoke all on function public.equo_proposte_inviate(uuid) from public, anon;
grant execute on function public.equo_proposte_inviate(uuid) to authenticated;

create or replace function public.equo_cavalli_da_confermare() returns json
language plpgsql stable security definer set search_path to 'public' as $fn$
declare v_uid uuid := auth.uid(); r record; v_out jsonb := '[]'::jsonb;
  v_persona text; v_ruolo text; v_nome text; v_razza text; v_nasc date; v_cod text; v_chiave text; v_valide int; v_mie_vecchie int;
begin
  if v_uid is null then return '[]'::json; end if;
  for r in
    select h.id as hid, null::uuid as sid from horses h where h.owner_id = v_uid
    union select cv.horse_id, null::uuid from cavalli_clienti_mascalcia cv where cv.maniscalco_id = v_uid and cv.horse_id is not null
    union select t.horse_id, null::uuid from trainer_collegamenti t where t.trainer_id = v_uid and t.stato = 'attivo' and t.horse_id is not null
    union select sc.horse_id, null::uuid from scuderia_cavalli sc join scuderia_membri m on m.centro_id = sc.centro_id
           where m.user_id = v_uid and m.ruolo in ('admin', 'istruttore') and sc.horse_id is not null
    union select null::uuid, sc.id from scuderia_cavalli sc join scuderia_membri m on m.centro_id = sc.centro_id
           where m.user_id = v_uid and m.ruolo in ('admin', 'istruttore') and sc.horse_id is null
    union select null::uuid, cv.scuderia_cavallo_id from cavalli_clienti_mascalcia cv
           join scuderia_cavalli sc on sc.id = cv.scuderia_cavallo_id
           where cv.maniscalco_id = v_uid and cv.horse_id is null and sc.horse_id is null
    union select null::uuid, tc.scuderia_cavallo_id from trainer_cavalli tc where tc.trainer_id = v_uid and tc.scuderia_cavallo_id is not null and tc.archiviato_il is null
  loop
    v_persona := null;
    select c.persona, c.ruolo into v_persona, v_ruolo from equo_chi_conferma(v_uid, r.hid, r.sid) c limit 1;
    if v_persona is null then continue; end if;
    if r.hid is not null then
      select h.name, h.breed, h.birth_date, h.codice_equo into v_nome, v_razza, v_nasc, v_cod from horses h where h.id = r.hid;
    else
      select s.nome, s.razza, s.data_nascita, s.codice_equo into v_nome, v_razza, v_nasc, v_cod from scuderia_cavalli s where s.id = r.sid;
    end if;
    if nullif(trim(coalesce(v_nome, '')), '') is null or nullif(trim(coalesce(v_razza, '')), '') is null or v_nasc is null then continue; end if;
    v_chiave := equo_dati_chiave(v_nome, v_razza, v_nasc);
    select count(*) filter (where c.dati_chiave = v_chiave),
           count(*) filter (where c.persona = v_persona and c.dati_chiave <> v_chiave)
      into v_valide, v_mie_vecchie
      from cavalli_conferme c where coalesce(c.horse_id, c.scuderia_cavallo_id) = coalesce(r.hid, r.sid);
    if exists (select 1 from cavalli_conferme c where coalesce(c.horse_id, c.scuderia_cavallo_id) = coalesce(r.hid, r.sid) and c.persona = v_persona and c.dati_chiave = v_chiave) then
      continue;
    end if;
    v_out := v_out || jsonb_build_object('horse_id', r.hid, 'scuderia_cavallo_id', r.sid, 'nome', v_nome, 'codice', v_cod,
      'ruolo', v_ruolo, 'conferme_valide', v_valide,
      'motivo', case when v_mie_vecchie > 0 then 'dati_modificati' else 'da_confermare' end);
  end loop;
  return v_out::json;
end
$fn$;
revoke all on function public.equo_cavalli_da_confermare() from public, anon;
grant execute on function public.equo_cavalli_da_confermare() to authenticated;
