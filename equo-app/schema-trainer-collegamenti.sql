-- TRAINER · COLLEGAMENTI istruttore ↔ proprietario ↔ struttura (16/10/2026) — da eseguire DOPO schema-trainer-sedute.sql
-- Regole: nessuna seduta arriva a un proprietario senza il suo consenso; chiunque può revocare; revocare = nascondere (storico resta);
-- le sedute già ricevute restano al proprietario. Struttura: l'istruttore entra col codice invito del centro (già esistente in Scuderia)
-- e segue i cavalli del centro; il centro (titolare/admin/livelli 2-3) vede le sedute inviate sui cavalli del centro.

-- 1) Codice personale del trainer (per farsi invitare dal proprietario): TR-XXXXXX
create table if not exists public.trainer_codici (
  user_id uuid primary key references auth.users(id) on delete cascade,
  codice text not null unique,
  created_at timestamptz not null default now()
);
alter table public.trainer_codici enable row level security;
drop policy if exists trainer_codici_sel on public.trainer_codici;
create policy trainer_codici_sel on public.trainer_codici for select to authenticated using (user_id = auth.uid());

create or replace function public.equo_mio_codice_trainer() returns text
language plpgsql security definer set search_path = public as $$
declare c text; i int := 0;
begin
  if auth.uid() is null then raise exception 'Accedi di nuovo'; end if;
  select codice into c from trainer_codici where user_id = auth.uid();
  if found then return c; end if;
  loop
    i := i + 1;
    c := 'TR-' || upper(substr(md5(random()::text || clock_timestamp()::text || auth.uid()::text), 1, 6));
    begin
      insert into trainer_codici (user_id, codice) values (auth.uid(), c);
      return c;
    exception when unique_violation then
      select codice into c from trainer_codici where user_id = auth.uid();
      if found then return c; end if;
      if i > 10 then raise; end if;
    end;
  end loop;
end $$;

-- 2) Collegamenti trainer ↔ cavallo (proprietario)
create table if not exists public.trainer_collegamenti (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references auth.users(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  horse_id uuid not null references public.horses(id) on delete cascade,
  stato text not null default 'da_confermare_proprietario'
    check (stato in ('da_confermare_proprietario','da_confermare_trainer','attivo','revocato')),
  origine text not null default 'trainer' check (origine in ('trainer','proprietario','centro')),
  centro_id uuid,
  risposto_il timestamptz,
  revocato_il timestamptz,
  revocato_da uuid,
  created_at timestamptz not null default now(),
  unique (trainer_id, horse_id)
);
create index if not exists trainer_coll_owner_idx on public.trainer_collegamenti (owner_id, created_at desc);
alter table public.trainer_collegamenti enable row level security;
drop policy if exists trainer_coll_sel on public.trainer_collegamenti;
create policy trainer_coll_sel on public.trainer_collegamenti for select to authenticated
  using (trainer_id = auth.uid() or owner_id = auth.uid());
-- nessuna insert/update/delete dal client: si passa solo dalle funzioni qui sotto

-- 3) Cavalli seguiti dal centro + sedute legate al centro
alter table public.trainer_cavalli add column if not exists centro_id uuid;
alter table public.trainer_cavalli add column if not exists scuderia_cavallo_id uuid;
create unique index if not exists trainer_cavalli_sc_uq on public.trainer_cavalli (trainer_id, scuderia_cavallo_id) where scuderia_cavallo_id is not null;
alter table public.sedute add column if not exists centro_id uuid;

create or replace function public.sedute_set_centro() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.cavallo_id is not null and (new.centro_id is null or new.horse_id is null) then
    select coalesce(new.centro_id, t.centro_id), coalesce(new.horse_id, t.horse_id) into new.centro_id, new.horse_id
      from trainer_cavalli t where t.id = new.cavallo_id and t.trainer_id = new.trainer_id;
  end if;
  return new;
end $$;
drop trigger if exists trg_sedute_set_centro on public.sedute;
create trigger trg_sedute_set_centro before insert on public.sedute for each row execute function public.sedute_set_centro();

-- condivisioni: ruoli ammessi anche istruttore (staff del centro)
do $$ declare r record; begin
  for r in select conname from pg_constraint where conrelid = 'public.sedute_condivisioni'::regclass and contype = 'c' and pg_get_constraintdef(oid) ilike '%ruolo%' loop
    execute format('alter table public.sedute_condivisioni drop constraint %I', r.conname);
  end loop;
  alter table public.sedute_condivisioni add constraint sedute_condivisioni_ruolo_check
    check (ruolo in ('proprietario','cavaliere','veterinario','maniscalco','istruttore'));
end $$;

-- chi vede una seduta: trainer, destinatari (se inviata), staff di direzione del centro (se inviata e legata al centro)
create or replace function public.equo_vede_seduta(p_seduta uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from sedute s where s.id = p_seduta and s.trainer_id = auth.uid())
      or exists (select 1 from sedute_condivisioni c join sedute s on s.id = c.seduta_id
                 where c.seduta_id = p_seduta and c.user_id = auth.uid() and s.stato = 'inviata')
      or exists (select 1 from sedute s where s.id = p_seduta and s.stato = 'inviata' and s.centro_id is not null
                 and (exists (select 1 from centri c where c.id = s.centro_id and c.owner_id = auth.uid())
                      or exists (select 1 from scuderia_membri m where m.centro_id = s.centro_id and m.user_id = auth.uid()
                                 and (m.ruolo = 'admin' or m.livello in ('admin','2','3')))));
$$;

-- storage: stessa regola della seduta (cartella 1 = trainer, cartella 2 = seduta)
drop policy if exists sedute_media_obj_sel on storage.objects;
create policy sedute_media_obj_sel on storage.objects for select to authenticated using (
  bucket_id = 'sedute-media' and (
    (storage.foldername(name))[1] = auth.uid()::text
    or exists (select 1 from public.sedute s
               where s.id::text = (storage.foldername(name))[2] and s.trainer_id::text = (storage.foldername(name))[1]
                 and public.equo_vede_seduta(s.id))));

-- 4) Il trainer chiede il collegamento con un cavallo tramite il suo codice: ora è una RICHIESTA, il proprietario deve accettare
create or replace function public.equo_trainer_collega_cavallo(p_cavallo uuid, p_codice text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare n bigint; h horses%rowtype; l trainer_collegamenti%rowtype; st text;
begin
  if not exists (select 1 from trainer_cavalli where id = p_cavallo and trainer_id = auth.uid()) then raise exception 'Cavallo non trovato'; end if;
  n := nullif(regexp_replace(coalesce(p_codice,''), '\D', '', 'g'), '')::bigint;
  if n is null then raise exception 'CODICE_NON_VALIDO'; end if;
  select * into h from horses where equo_numero = n limit 1;
  if not found then raise exception 'CODICE_NON_TROVATO'; end if;
  if h.owner_id is null then raise exception 'CODICE_NON_TROVATO'; end if;
  update trainer_cavalli set horse_id = h.id where id = p_cavallo;
  update sedute set horse_id = h.id where cavallo_id = p_cavallo and horse_id is null;
  if h.owner_id = auth.uid() then st := 'attivo';
  else
    select * into l from trainer_collegamenti where trainer_id = auth.uid() and horse_id = h.id;
    if not found then
      insert into trainer_collegamenti (trainer_id, owner_id, horse_id, stato, origine) values (auth.uid(), h.owner_id, h.id, 'da_confermare_proprietario', 'trainer');
      st := 'da_confermare_proprietario';
    elsif l.stato = 'revocato' then
      if l.revocato_da is not null and l.revocato_da = l.owner_id then raise exception 'RIFIUTATO_DAL_PROPRIETARIO'; end if;
      update trainer_collegamenti set stato = 'da_confermare_proprietario', origine = 'trainer', revocato_il = null, revocato_da = null, risposto_il = null where id = l.id;
      st := 'da_confermare_proprietario';
    elsif l.stato = 'da_confermare_trainer' then
      update trainer_collegamenti set stato = 'attivo', risposto_il = now() where id = l.id;
      st := 'attivo';
    else st := l.stato; end if;
  end if;
  return jsonb_build_object('ok', true, 'nome', h.name, 'stato', st);
end $$;

-- 5) Il proprietario invita il suo trainer con il codice TR-… del trainer; il trainer deve accettare
create or replace function public.equo_proprietario_invita_trainer(p_horse uuid, p_codice text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare t uuid; l trainer_collegamenti%rowtype; st text; nome text;
begin
  if not exists (select 1 from horses where id = p_horse and owner_id = auth.uid()) then raise exception 'Cavallo non trovato'; end if;
  select user_id into t from trainer_codici where codice = upper(trim(coalesce(p_codice,'')));
  if t is null then raise exception 'CODICE_NON_TROVATO'; end if;
  if t = auth.uid() then raise exception 'CODICE_PROPRIO'; end if;
  select * into l from trainer_collegamenti where trainer_id = t and horse_id = p_horse;
  if not found then
    insert into trainer_collegamenti (trainer_id, owner_id, horse_id, stato, origine) values (t, auth.uid(), p_horse, 'da_confermare_trainer', 'proprietario');
    st := 'da_confermare_trainer';
  elsif l.stato = 'da_confermare_proprietario' then
    update trainer_collegamenti set stato = 'attivo', risposto_il = now() where id = l.id; st := 'attivo';
    insert into trainer_cavalli (trainer_id, horse_id, nome) select t, p_horse, h.name from horses h where h.id = p_horse
      and not exists (select 1 from trainer_cavalli x where x.trainer_id = t and x.horse_id = p_horse and x.archiviato_il is null);
  elsif l.stato = 'revocato' then
    update trainer_collegamenti set stato = 'da_confermare_trainer', origine = 'proprietario', revocato_il = null, revocato_da = null, risposto_il = null where id = l.id;
    st := 'da_confermare_trainer';
  else st := l.stato; end if;
  select coalesce(nullif(trim(full_name),''),'Istruttore') into nome from profiles where id = t;
  return jsonb_build_object('ok', true, 'trainer', nome, 'stato', st);
end $$;

-- 6) Risposta (accetta/rifiuta) dell'altra parte
create or replace function public.equo_rispondi_collegamento(p_id uuid, p_accetta boolean)
returns jsonb language plpgsql security definer set search_path = public as $$
declare l trainer_collegamenti%rowtype; hn text;
begin
  select * into l from trainer_collegamenti where id = p_id;
  if not found then raise exception 'Collegamento non trovato'; end if;
  if not ((l.stato = 'da_confermare_proprietario' and l.owner_id = auth.uid()) or (l.stato = 'da_confermare_trainer' and l.trainer_id = auth.uid())) then
    raise exception 'NON_IN_ATTESA';
  end if;
  if p_accetta then
    update trainer_collegamenti set stato = 'attivo', risposto_il = now() where id = l.id;
    select name into hn from horses where id = l.horse_id;
    -- se l'invito veniva dal proprietario, il cavallo compare tra quelli seguiti dal trainer
    if l.origine = 'proprietario' and l.trainer_id = auth.uid() then
      if exists (select 1 from trainer_cavalli x where x.trainer_id = l.trainer_id and x.horse_id = l.horse_id and x.archiviato_il is null) then null;
      else insert into trainer_cavalli (trainer_id, horse_id, nome) values (l.trainer_id, l.horse_id, coalesce(hn,'Cavallo')); end if;
    end if;
  else
    update trainer_collegamenti set stato = 'revocato', revocato_il = now(), revocato_da = auth.uid(), risposto_il = now() where id = l.id;
  end if;
  return jsonb_build_object('ok', true, 'stato', case when p_accetta then 'attivo' else 'revocato' end);
end $$;

-- 7) Revoca da entrambe le parti (resta nello storico; le sedute già ricevute restano al proprietario)
create or replace function public.equo_revoca_collegamento(p_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
begin
  update trainer_collegamenti set stato = 'revocato', revocato_il = now(), revocato_da = auth.uid()
   where id = p_id and (trainer_id = auth.uid() or owner_id = auth.uid()) and stato <> 'revocato';
  if not found then raise exception 'Collegamento non trovato'; end if;
  return jsonb_build_object('ok', true);
end $$;

-- 8) Elenco dei miei collegamenti (come trainer e/o come proprietario), con i nomi dell'altra parte
create or replace function public.equo_miei_collegamenti() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
      'id', x.id, 'stato', x.stato, 'origine', x.origine, 'horse_id', x.horse_id, 'cavallo', x.hname,
      'trainer', x.tn, 'proprietario', x.pn, 'centro', x.cn,
      'mio_ruolo', case when x.trainer_id = auth.uid() then 'trainer' else 'proprietario' end,
      'da_rispondere', ((x.stato = 'da_confermare_proprietario' and x.owner_id = auth.uid()) or (x.stato = 'da_confermare_trainer' and x.trainer_id = auth.uid())),
      'created_at', x.created_at) order by x.created_at desc), '[]'::jsonb)
  from (select l.*, h.name as hname, coalesce(nullif(trim(pt.full_name),''),'Istruttore') as tn,
               coalesce(nullif(trim(po.full_name),''),'Proprietario') as pn, c.nome as cn
        from trainer_collegamenti l
        join horses h on h.id = l.horse_id
        left join profiles pt on pt.id = l.trainer_id
        left join profiles po on po.id = l.owner_id
        left join centri c on c.id = l.centro_id
        where l.trainer_id = auth.uid() or l.owner_id = auth.uid()) x;
$$;

-- 9) Struttura: centri dove sono istruttore/admin, cavalli del centro, segui un cavallo del centro
create or replace function public.equo_trainer_miei_centri() returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'nome', c.nome, 'ruolo', m.ruolo)), '[]'::jsonb)
  from scuderia_membri m join centri c on c.id = m.centro_id
  where m.user_id = auth.uid() and m.ruolo in ('istruttore','admin');
$$;

create or replace function public.equo_trainer_cavalli_centro(p_centro uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not exists (select 1 from scuderia_membri where centro_id = p_centro and user_id = auth.uid() and ruolo in ('istruttore','admin')) then raise exception 'Non fai parte di questo centro'; end if;
  return (select coalesce(jsonb_agg(jsonb_build_object('id', s.id, 'nome', s.nome, 'proprietario', s.proprietario, 'su_equo', s.horse_id is not null,
            'seguito', exists (select 1 from trainer_cavalli t where t.trainer_id = auth.uid() and t.scuderia_cavallo_id = s.id and t.archiviato_il is null)) order by s.nome), '[]'::jsonb)
          from scuderia_cavalli s where s.centro_id = p_centro);
end $$;

create or replace function public.equo_trainer_segui_cavallo_centro(p_centro uuid, p_scuderia uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare s scuderia_cavalli%rowtype; own uuid; l trainer_collegamenti%rowtype; st text := null;
begin
  if not exists (select 1 from scuderia_membri where centro_id = p_centro and user_id = auth.uid() and ruolo in ('istruttore','admin')) then raise exception 'Non fai parte di questo centro'; end if;
  select * into s from scuderia_cavalli where id = p_scuderia and centro_id = p_centro;
  if not found then raise exception 'Cavallo del centro non trovato'; end if;
  if not exists (select 1 from trainer_cavalli where trainer_id = auth.uid() and scuderia_cavallo_id = s.id) then
    insert into trainer_cavalli (trainer_id, nome, cavaliere, centro_id, scuderia_cavallo_id, horse_id) values (auth.uid(), s.nome, s.proprietario, p_centro, s.id, s.horse_id);
  else
    update trainer_cavalli set archiviato_il = null, centro_id = p_centro, horse_id = coalesce(horse_id, s.horse_id) where trainer_id = auth.uid() and scuderia_cavallo_id = s.id;
  end if;
  if s.horse_id is not null then
    select owner_id into own from horses where id = s.horse_id;
    if own is not null and own <> auth.uid() then
      select * into l from trainer_collegamenti where trainer_id = auth.uid() and horse_id = s.horse_id;
      if not found then
        insert into trainer_collegamenti (trainer_id, owner_id, horse_id, stato, origine, centro_id, risposto_il) values (auth.uid(), own, s.horse_id, 'attivo', 'centro', p_centro, now());
        st := 'attivo';
      elsif l.stato = 'revocato' then
        if l.revocato_da = l.owner_id then raise exception 'RIFIUTATO_DAL_PROPRIETARIO'; end if;
        update trainer_collegamenti set stato = 'attivo', origine = 'centro', centro_id = p_centro, revocato_il = null, revocato_da = null, risposto_il = now() where id = l.id; st := 'attivo';
      elsif l.stato in ('da_confermare_proprietario','da_confermare_trainer') then
        update trainer_collegamenti set stato = 'attivo', centro_id = coalesce(centro_id, p_centro), risposto_il = now() where id = l.id; st := 'attivo';
      else st := l.stato; end if;
    end if;
  end if;
  update sedute set horse_id = s.horse_id, centro_id = p_centro where cavallo_id in (select id from trainer_cavalli where trainer_id = auth.uid() and scuderia_cavallo_id = s.id) and stato = 'bozza';
  return jsonb_build_object('ok', true, 'nome', s.nome, 'collegamento', st);
end $$;

-- 10) A chi posso inviare una seduta: proprietario (se collegato) + staff/allievi del centro della seduta
create or replace function public.equo_destinatari_seduta(p_seduta uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare s sedute%rowtype; own uuid; ost text := 'nessuno'; onome text; res jsonb;
begin
  select * into s from sedute where id = p_seduta and trainer_id = auth.uid();
  if not found then raise exception 'Seduta non trovata'; end if;
  if s.horse_id is not null then
    select owner_id into own from horses where id = s.horse_id;
    if own is not null and own <> auth.uid() then
      select coalesce(nullif(trim(full_name),''),'Proprietario') into onome from profiles where id = own;
      select case l.stato when 'attivo' then 'attivo' when 'revocato' then 'revocato' else 'in_attesa' end into ost
        from trainer_collegamenti l where l.trainer_id = auth.uid() and l.horse_id = s.horse_id;
      ost := coalesce(ost, 'nessuno');
    end if;
  end if;
  select coalesce(jsonb_agg(jsonb_build_object('user_id', m.user_id, 'nome', coalesce(nullif(trim(m.nome_visualizzato),''), nullif(trim(p.full_name),''), m.ruolo), 'ruolo', m.ruolo) order by m.ruolo, m.nome_visualizzato), '[]'::jsonb) into res
    from scuderia_membri m left join profiles p on p.id = m.user_id
    where s.centro_id is not null and m.centro_id = s.centro_id and m.user_id is not null and m.user_id <> auth.uid()
      and m.ruolo in ('allievo','veterinario','maniscalco','istruttore');
  return jsonb_build_object('proprietario', case when own is null or own = auth.uid() then null else jsonb_build_object('user_id', own, 'nome', onome, 'stato', ost) end, 'membri', res);
end $$;

-- 11) Invio: il proprietario riceve SOLO se il collegamento è attivo; destinatari extra solo tra lo staff/allievi del centro della seduta.
--     Serve almeno un destinatario reale, altrimenti non si consuma lo slot.
create or replace function public.equo_invia_seduta(p_seduta uuid, p_destinatari uuid[] default '{}')
returns jsonb language plpgsql security definer set search_path = public as $$
declare s sedute%rowtype; prem boolean; usati bigint; prop uuid; d uuid; rr text; n int := 0; prop_ok boolean := false;
begin
  select * into s from sedute where id = p_seduta and trainer_id = auth.uid();
  if not found then raise exception 'Seduta non trovata'; end if;
  if s.stato = 'inviata' then return jsonb_build_object('ok', true, 'gia_inviata', true); end if;
  if not exists (select 1 from sedute_media where seduta_id = s.id) then raise exception 'SEDUTA_SENZA_VIDEO: aggiungi almeno un video.'; end if;
  prem := coalesce((select piano from profiles where id = auth.uid()),'free') = 'premium';
  select count(*) into usati from sedute where trainer_id = auth.uid() and stato = 'inviata';
  if not prem and usati >= 10 then raise exception 'SLOT_ESAURITI: hai usato i 10 slot di prova. Passa a Premium per continuare.'; end if;

  if s.horse_id is null and s.cavallo_id is not null then
    select horse_id into s.horse_id from trainer_cavalli where id = s.cavallo_id and trainer_id = auth.uid();
  end if;
  if s.horse_id is not null then
    select owner_id into prop from horses where id = s.horse_id;
    if prop is not null and prop <> auth.uid()
       and exists (select 1 from trainer_collegamenti where trainer_id = auth.uid() and horse_id = s.horse_id and stato = 'attivo') then
      insert into sedute_condivisioni (seduta_id, user_id, ruolo) values (s.id, prop, 'proprietario') on conflict do nothing;
      prop_ok := true; n := n + 1;
    end if;
  end if;
  foreach d in array coalesce(p_destinatari, '{}') loop
    if d = auth.uid() or d = prop then continue; end if;
    rr := null;
    if s.centro_id is not null then
      select case m.ruolo when 'allievo' then 'cavaliere' when 'veterinario' then 'veterinario' when 'maniscalco' then 'maniscalco' else 'istruttore' end into rr
        from scuderia_membri m where m.centro_id = s.centro_id and m.user_id = d and m.ruolo in ('allievo','veterinario','maniscalco','istruttore','admin') limit 1;
    end if;
    if rr is null then raise exception 'DESTINATARIO_NON_VALIDO: puoi inviare solo al proprietario collegato o allo staff e agli allievi del centro.'; end if;
    insert into sedute_condivisioni (seduta_id, user_id, ruolo) values (s.id, d, rr) on conflict do nothing;
    n := n + 1;
  end loop;
  if n = 0 then raise exception 'NESSUN_DESTINATARIO: collega il cavallo a un proprietario che ha accettato, oppure scegli un destinatario del centro.'; end if;
  update sedute set stato = 'inviata', inviata_il = now() where id = s.id;
  return jsonb_build_object('ok', true, 'slot_usati', usati + 1, 'proprietario', prop_ok, 'destinatari', n);
end $$;

-- 12) Guide AI (Ares e Pegasus) sui collegamenti — si possono rieseguire
insert into public.ai_conoscenze (ambito, categoria, titolo, contenuto, attivo, verificato_il) values
('istruttore','guida','Come collego un cavallo al proprietario (Trainer)',
'Dove: Cavalli seguiti → tocca il cavallo
Passi:
1. Aggiungi il cavallo da «+ Cavallo» (nome e cavaliere).
2. Tocca il cavallo, inserisci il codice Equo del cavallo e premi «Invia richiesta».
3. Il proprietario riceve la richiesta nella sua Home e deve accettare: finché non accetta, il cavallo risulta «In attesa» e non può ricevere sedute.
4. In alternativa mostra al proprietario il tuo codice trainer (Cavalli seguiti → «Il tuo codice trainer» → Mostra): lui ti invita e tu accetti dall''elenco «Inviti dei proprietari».
Esempio: Marco inserisce il codice di Aurora, Sara accetta e da quel momento riceve le sedute di Aurora.
Note: Se il proprietario rifiuta o revoca, non puoi richiedere di nuovo: deve invitarti lui. Tu e lui potete interrompere il collegamento in qualsiasi momento; le sedute già inviate restano al proprietario.
Parole chiave: collegare cavallo, codice equo, richiesta, consenso, codice trainer, invito, revoca, in attesa', true, current_date),
('istruttore','guida','Come entro in una struttura e seguo i cavalli del centro (Trainer)',
'Dove: Cavalli seguiti → «Strutture» → «+ Entra»
Passi:
1. Chiedi al centro il codice invito (lo trova in Equo Scuderia → Il tuo Centro).
2. Inseriscilo in «Entra in una struttura»: entri come istruttore del centro.
3. Tocca il nome del centro per vedere i suoi cavalli e premi «Segui» sui cavalli che alleni.
4. Seguire un cavallo del centro ti collega al suo proprietario (se è su Equo), che può sempre revocare.
Esempio: Marco entra in «Centro Blu» e segue Luna di Anna.
Note: Il titolare e gli amministratori del centro vedono le sedute che invii sui cavalli del centro. Quando invii una seduta di un cavallo del centro puoi scegliere come destinatari anche allievi e staff del centro.
Parole chiave: struttura, centro, scuderia, codice invito, cavalli del centro, allievi, staff, segui', true, current_date),
('istruttore','guida','Come invio una seduta al proprietario e cosa sono gli slot',
'Dove: Sedute → apri la bozza → «Invia»
Passi:
1. Controlla il video e le annotazioni.
2. Tocca «Invia»: l''app mostra a chi arriva. Il proprietario è già spuntato se ha accettato il collegamento; per i cavalli di un centro puoi aggiungere allievi e staff.
3. Conferma: la seduta arriva ai destinatari e il proprietario può risponderti con un commento.
Esempio: Marco invia la seduta e Sara risponde «Grazie, la ripetiamo giovedì».
Note: Serve almeno un destinatario reale: se il proprietario non ha ancora accettato il collegamento il tasto resta spento e non si consuma lo slot. Nel piano Free hai 10 slot: uno si consuma quando una seduta viene INVIATA, non si possono cancellare né rinnovare. Il Premium offre più capienza. Un proprietario Free può ricevere e rispondere ma non annotare.
Parole chiave: invia seduta, slot, esauriti, proprietario, destinatari, collegamento, premium, risposta, commento', true, current_date),
('istruttore','guida','Come aggiungo un cavallo seguito (Trainer)',
'Dove: Home → «Cavalli seguiti» oppure «+» → Cavallo seguito
Passi:
1. Tocca «+ Cavallo» e scrivi nome e cavaliere.
2. Per mandare le sedute al proprietario collega il cavallo: tocca il cavallo e inserisci il codice Equo (il proprietario dovrà accettare).
3. Senza collegamento puoi comunque lavorare sul video, ma non inviarlo al proprietario.
Esempio: Marco aggiunge «Aurora» e invia la richiesta con il codice che gli ha dato Sara.
Note: Nel piano Free puoi seguire fino a 10 cavalli. Le sedute restano nello storico del cavallo.
Parole chiave: cavalli seguiti, aggiungere cavallo, limite 10, collegare, codice equo', true, current_date),
('proprietario','guida','Come collego il mio istruttore e cosa vede (I miei istruttori)',
'Dove: barra in basso → «+» → «I miei istruttori»
Passi:
1. L''istruttore usa l''app Equo Trainer e ti mostra il suo codice (inizia con TR-).
2. In «I miei istruttori» scegli il cavallo, inserisci il codice e premi «Invita»: l''istruttore deve accettare.
3. Se invece è l''istruttore a chiederti il collegamento con il codice del cavallo, trovi la richiesta nella Home («Richieste dei tuoi istruttori») e la accetti o la rifiuti.
4. Dopo l''accettazione ricevi le sedute (video con annotazioni) nella Home e puoi rispondere con un commento.
Esempio: Sara invita Marco per Aurora; Marco accetta e le sedute di Aurora arrivano nella Home di Sara.
Note: Nessun istruttore può inviarti sedute senza il tuo consenso. Puoi revocare quando vuoi da «I miei istruttori» → Revoca: le sedute già ricevute restano tue. Spese, note private e incassi non sono mai visibili all''istruttore.
Parole chiave: istruttore, trainer, collegare, codice TR, richiesta, consenso, revoca, sedute, video', true, current_date)
on conflict (titolo) do update set contenuto = excluded.contenuto, ambito = excluded.ambito, attivo = true, verificato_il = current_date, aggiornato_il = now();
