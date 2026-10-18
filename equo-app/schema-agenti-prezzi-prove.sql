-- ============================================================
-- EQUO SCUDERIA - Agenti extra: prova gratuita (1 giorno, 10 messaggi) e messaggi extra condivisi
-- Prezzi (IVA esclusa, al mese): Merlino 9, Ermes 9, Hammer 4, Ares 4, Galeno 4;
--   tutti gli agenti 24 (19 per PREMIUM); messaggi extra: 200 = 7, 500 = 15 (condivisi fra gli agenti extra).
-- I prezzi stanno nel gestionale e nel Cruscotto; qui ci sono prova e messaggi extra.
-- Idempotente: si puo' rieseguire.
-- ============================================================

-- 1) Messaggi extra del centro (pool condiviso fra gli agenti extra, per mese)
alter table public.centri add column if not exists messaggi_extra integer not null default 0 check (messaggi_extra >= 0);

-- il centro non puo' cambiarseli da solo (aggiunto messaggi_extra all'elenco delle colonne protette)
create or replace function public.centri_guard_pacchetto()
returns trigger language plpgsql as $$
begin
  if current_setting('equo.pacchetti', true) = 'on' or auth.uid() is null then return new; end if;
  if new.pacchetto is distinct from old.pacchetto or new.agente_incluso is distinct from old.agente_incluso
     or new.agenti_extra is distinct from old.agenti_extra or new.sdi_attivo is distinct from old.sdi_attivo
     or new.promo_inizio is distinct from old.promo_inizio or new.promo_fino is distinct from old.promo_fino
     or new.promo_pacchetto_prima is distinct from old.promo_pacchetto_prima
     or new.onboarding_stato is distinct from old.onboarding_stato or new.onboarding_note is distinct from old.onboarding_note
     or new.messaggi_extra is distinct from old.messaggi_extra then
    raise exception 'Il pacchetto si cambia contattando Equo.';
  end if;
  return new;
end $$;

-- Imposta i messaggi extra mensili (0, 200 o 500): select imposta_messaggi_extra_centro('<id centro>', 200);
create or replace function public.imposta_messaggi_extra_centro(p_centro uuid, p_n integer)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_n not in (0, 200, 500) then raise exception 'Messaggi extra ammessi: 0, 200 o 500'; end if;
  perform set_config('equo.pacchetti','on',true);
  update centri set messaggi_extra = p_n where id = p_centro;
  if not found then raise exception 'Centro non trovato'; end if;
end $$;
revoke all on function public.imposta_messaggi_extra_centro(uuid, integer) from public, anon, authenticated;
grant execute on function public.imposta_messaggi_extra_centro(uuid, integer) to service_role;

-- 2) Prova gratuita: 1 giorno, 10 messaggi per agente, un agente ogni 3 giorni, una sola volta per agente
create table if not exists public.centri_prove_agenti (
  id bigint generated always as identity primary key,
  centro_id uuid not null references public.centri(id) on delete cascade,
  agente text not null check (agente in ('merlino','hammer','ares')),
  iniziata_il timestamptz not null default now(),
  unique (centro_id, agente)
);
alter table public.centri_prove_agenti enable row level security;
revoke all on public.centri_prove_agenti from anon, authenticated;

-- puo' gestire il centro: titolare, admin, livello 2 o 3
create or replace function public.centro_e_responsabile(p_centro uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from centri c where c.id = p_centro and c.owner_id = auth.uid())
      or exists (select 1 from scuderia_membri m where m.centro_id = p_centro and m.user_id = auth.uid()
                 and (m.ruolo = 'admin' or m.livello::text in ('admin','2','3')));
$$;
revoke all on function public.centro_e_responsabile(uuid) from public, anon;
grant execute on function public.centro_e_responsabile(uuid) to authenticated;

-- stato delle prove per il gestionale: per agente { stato: disponibile|attiva|usata|attesa, rimasti, fine, dal }
create or replace function public.agenti_prove_stato(p_centro uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare a text; r record; ultimo timestamptz; usati integer; out jsonb := '{}'::jsonb;
begin
  if not (is_member_of_centro(p_centro) or exists (select 1 from centri where id = p_centro and owner_id = auth.uid())) then
    return jsonb_build_object('errore', 'Non autorizzato');
  end if;
  select max(iniziata_il) into ultimo from centri_prove_agenti where centro_id = p_centro;
  foreach a in array array['merlino','hammer','ares'] loop
    select * into r from centri_prove_agenti where centro_id = p_centro and agente = a;
    if r.id is null then
      if ultimo is not null and ultimo + interval '3 days' > now() then
        out := out || jsonb_build_object(a, jsonb_build_object('stato','attesa','dal', ultimo + interval '3 days'));
      else
        out := out || jsonb_build_object(a, jsonb_build_object('stato','disponibile'));
      end if;
    else
      select count(*) into usati from ai_messaggi where centro_id = p_centro and agente = a and ruolo = 'user' and created_at >= r.iniziata_il;
      if now() < r.iniziata_il + interval '1 day' and usati < 10 then
        out := out || jsonb_build_object(a, jsonb_build_object('stato','attiva','rimasti',10 - usati,'fine', r.iniziata_il + interval '1 day'));
      else
        out := out || jsonb_build_object(a, jsonb_build_object('stato','usata'));
      end if;
    end if;
  end loop;
  return out;
end $$;
revoke all on function public.agenti_prove_stato(uuid) from public, anon;
grant execute on function public.agenti_prove_stato(uuid) to authenticated;

-- avvia la prova (solo titolare/responsabili)
create or replace function public.agente_prova_avvia(p_centro uuid, p_agente text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare ultimo timestamptz; lim jsonb;
begin
  if auth.uid() is null or not centro_e_responsabile(p_centro) then raise exception 'SOLO_RESPONSABILI'; end if;
  if p_agente not in ('merlino','hammer','ares') then raise exception 'AGENTE_NON_DISPONIBILE'; end if;
  lim := centro_limiti(p_centro);
  if (lim->'agenti') ? p_agente then raise exception 'AGENTE_GIA_ATTIVO'; end if;
  if exists (select 1 from centri_prove_agenti where centro_id = p_centro and agente = p_agente) then raise exception 'PROVA_GIA_USATA'; end if;
  select max(iniziata_il) into ultimo from centri_prove_agenti where centro_id = p_centro;
  if ultimo is not null and ultimo + interval '3 days' > now() then raise exception 'ATTENDI_3_GIORNI'; end if;
  insert into centri_prove_agenti (centro_id, agente) values (p_centro, p_agente);
  return agenti_prove_stato(p_centro) -> p_agente;
end $$;
revoke all on function public.agente_prova_avvia(uuid, text) from public, anon;
grant execute on function public.agente_prova_avvia(uuid, text) to authenticated;
