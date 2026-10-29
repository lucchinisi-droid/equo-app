-- Equo: CODICI DI PROVA per entrare come veterinario (29 ottobre 2026) · SQL 27
-- Il veterinario non si sceglie più liberamente: dal modulo «Equo per veterinari» si entra con un codice di prova
-- (oppure si manda la candidatura / si chiede il codice per email). Qui:
--  1. tabella codici_prova (codice, professione, usi, scadenza, attivo) + codici_prova_usi (chi l'ha usato);
--  2. equo_attiva_codice_prova(codice, consenso): controlla il codice e assegna il profilo
--     (principale al primo accesso, secondario per chi è già proprietario); una sola professione per utente come sempre;
--  3. profiles_ruoli_guard: dall'app non si diventa veterinario senza codice;
--  4. primo codice: GALENO26 (10 usi, scade il 31/12/2026).
-- Per aggiungere un codice: insert into codici_prova (codice, professione, usi_max, scade_il, note) values ('LAURA26', 'veterinario', 1, null, 'Laura');
-- Per spegnerlo: update codici_prova set attivo = false where codice = 'GALENO26';
-- Rieseguibile.

create table if not exists public.codici_prova (
  codice text primary key check (codice = upper(codice) and length(codice) between 4 and 40),
  professione text not null default 'veterinario' check (professione in ('veterinario','istruttore')),
  usi_max int not null default 1 check (usi_max >= 1),
  usati int not null default 0,
  attivo boolean not null default true,
  scade_il date,
  note text,
  creato_il timestamptz not null default now()
);
create table if not exists public.codici_prova_usi (
  codice text not null references public.codici_prova(codice) on update cascade,
  user_id uuid not null,
  usato_il timestamptz not null default now(),
  primary key (codice, user_id)
);
alter table public.codici_prova enable row level security;
alter table public.codici_prova_usi enable row level security;
revoke all on public.codici_prova, public.codici_prova_usi from anon, authenticated;

-- 2 · attivazione con il codice ------------------------------------------------------------
create or replace function public.equo_attiva_codice_prova(p_codice text, p_consenso boolean default false)
returns json language plpgsql security definer set search_path to 'public' as $$
declare
  v_uid uuid := auth.uid();
  v_cod text := upper(regexp_replace(coalesce(p_codice, ''), '\s', '', 'g'));
  c record; p record; v_campo text; v_ha boolean;
begin
  if v_uid is null then return json_build_object('ok', false, 'errore', 'non_autenticato'); end if;
  select * into c from codici_prova where codice = v_cod for update;
  if not found or not c.attivo then return json_build_object('ok', false, 'errore', 'codice_non_valido'); end if;
  if c.scade_il is not null and c.scade_il < current_date then return json_build_object('ok', false, 'errore', 'codice_scaduto'); end if;
  select id, ruolo, ruolo_secondario, consenso_termini_privacy into p from profiles where id = v_uid;
  v_ha := found;
  -- già con questa professione: si entra e basta (il codice non si consuma)
  if v_ha and c.professione in (p.ruolo, p.ruolo_secondario) then
    return json_build_object('ok', true, 'professione', c.professione, 'campo', case when p.ruolo = c.professione then 'ruolo' else 'ruolo_secondario' end);
  end if;
  if exists (select 1 from codici_prova_usi where codice = c.codice and user_id = v_uid) then null;
  elsif c.usati >= c.usi_max then return json_build_object('ok', false, 'errore', 'codice_esaurito'); end if;
  if v_ha and (p.ruolo in ('maniscalco','veterinario','istruttore') or p.ruolo_secondario in ('maniscalco','veterinario','istruttore')) then
    return json_build_object('ok', false, 'errore', 'altra_professione');
  end if;
  if v_ha and p.ruolo = 'gestore_struttura' then return json_build_object('ok', false, 'errore', 'profilo_struttura'); end if;
  if not v_ha and not coalesce(p_consenso, false) then return json_build_object('ok', false, 'errore', 'consenso'); end if;
  if v_ha and p.consenso_termini_privacy is null and not coalesce(p_consenso, false) then return json_build_object('ok', false, 'errore', 'consenso'); end if;

  perform set_config('equo.ruoli', 'on', true);
  if not v_ha then
    insert into profiles (id, email, ruolo, consenso_termini_privacy, dichiarazione_eta)
    select v_uid, u.email, c.professione, now(), true from auth.users u where u.id = v_uid;
    v_campo := 'ruolo';
  elsif p.ruolo is null then
    update profiles set ruolo = c.professione,
      consenso_termini_privacy = coalesce(consenso_termini_privacy, case when p_consenso then now() end),
      dichiarazione_eta = case when p_consenso then true else dichiarazione_eta end
     where id = v_uid;
    v_campo := 'ruolo';
  else
    update profiles set ruolo_secondario = c.professione where id = v_uid;
    v_campo := 'ruolo_secondario';
  end if;
  perform set_config('equo.ruoli', '', true);
  insert into codici_prova_usi (codice, user_id) values (c.codice, v_uid) on conflict do nothing;
  update codici_prova set usati = (select count(*) from codici_prova_usi u where u.codice = c.codice) where codice = c.codice;
  return json_build_object('ok', true, 'professione', c.professione, 'campo', v_campo);
end $$;
revoke all on function public.equo_attiva_codice_prova(text, boolean) from public, anon;
grant execute on function public.equo_attiva_codice_prova(text, boolean) to authenticated;

-- 3 · dall'app non si diventa veterinario senza codice ------------------------------------
create or replace function public.profiles_ruoli_guard()
returns trigger language plpgsql security definer set search_path to 'public' as $function$
declare
  v_old text[]; v_new text[]; r text; n_pro int;
begin
  if new.ruolo_secondario is not null and new.ruolo_secondario not in ('proprietario','maniscalco','veterinario','istruttore') then
    raise exception 'Ruolo secondario non valido.';
  end if;
  if new.ruolo_secondario is not null and new.ruolo_secondario = new.ruolo then
    new.ruolo_secondario := null;
  end if;
  v_new := array_remove(array[new.ruolo, new.ruolo_secondario], null);
  select count(*) into n_pro from unnest(v_new) x where x in ('maniscalco','veterinario','istruttore');
  if n_pro > 1 then
    raise exception 'Puoi avere una sola professione su Equo. Per casi particolari scrivici dall''app.';
  end if;
  if new.ruolo_secondario is not null and 'gestore_struttura' = any(v_new) then
    raise exception 'Il profilo struttura non si combina con altri profili.';
  end if;
  if auth.uid() is null or coalesce(current_setting('equo.ruoli', true), '') = 'on' then return new; end if;
  v_old := case when tg_op = 'UPDATE' then array_remove(array[old.ruolo, old.ruolo_secondario], null) else '{}'::text[] end;
  -- 29/10/2026: il profilo veterinario si attiva solo con un codice di prova (equo_attiva_codice_prova)
  if 'veterinario' = any(v_new) and not ('veterinario' = any(v_old)) then
    raise exception 'Per il profilo veterinario serve un codice di prova: chiedilo a gestione.equo@gmail.com.';
  end if;
  if tg_op = 'UPDATE' and old.ruolo is not null then
    foreach r in array v_old loop
      if not (r = any(v_new)) then
        raise exception 'Il profilo non si può cambiare dall''app. Chiedici la modifica da "Hai bisogno di un altro profilo?".';
      end if;
    end loop;
  end if;
  return new;
end $function$;

-- 4 · primo codice ------------------------------------------------------------------------
insert into public.codici_prova (codice, professione, usi_max, scade_il, note)
values ('GALENO26', 'veterinario', 10, '2026-12-31', 'Prova veterinari ottobre 2026 (Riccardo, Laura e altri invitati)')
on conflict (codice) do nothing;
