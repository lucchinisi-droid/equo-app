-- Equo: registro sanitario comune — ognuno cancella solo le voci scritte da sé (ottobre 2026)
-- Proprietario: non può cancellare dal libretto le voci della scuderia o del maniscalco.
-- Scuderia: non può cancellare dalla scheda le voci del proprietario o del maniscalco.
-- Restano possibili: le cancellazioni «a specchio» (chi ha scritto la voce la cancella → sparisce anche la copia),
-- il maniscalco che rimette «da fare» un intervento, e l'eliminazione dell'intero cavallo / scheda.

create or replace function public.health_events_solo_autore()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce(current_setting('equo.registro', true), '') = 'on' or coalesce(current_setting('equo.hard_reset', true), '') = 'on' then return old; end if;
  if old.origine <> 'proprietario'
     and exists (select 1 from horses h where h.id = old.horse_id and h.owner_id = auth.uid()) then
    raise exception '%', case old.origine when 'scuderia' then 'Questa voce l''ha registrata la scuderia: può cancellarla solo la scuderia.'
                                          else 'Questa voce l''ha registrata il maniscalco: può cancellarla solo il maniscalco.' end;
  end if;
  return old;
end $$;
drop trigger if exists trg_health_events_solo_autore on public.health_events;
create trigger trg_health_events_solo_autore before delete on public.health_events
  for each row execute function public.health_events_solo_autore();

create or replace function public.scuderia_eventi_solo_autore()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce(current_setting('equo.registro', true), '') = 'on' or coalesce(current_setting('equo.hard_reset', true), '') = 'on' then return old; end if;
  if old.origine <> 'scuderia'
     and exists (select 1 from scuderia_cavalli sc where sc.id = old.cavallo_id)   -- eliminazione dell'intera scheda: consentita
     and not exists (select 1 from interventi_mascalcia i where i.scuderia_evento_id = old.id and i.maniscalco_id = auth.uid())
     and public.is_member_of_centro(old.centro_id) then
    raise exception '%', case old.origine when 'proprietario' then 'Questa voce l''ha registrata il proprietario: può cancellarla solo il proprietario.'
                                          else 'Questa voce l''ha registrata il maniscalco: può cancellarla solo il maniscalco.' end;
  end if;
  return old;
end $$;
drop trigger if exists trg_scuderia_eventi_solo_autore on public.scuderia_eventi_sanitari;
create trigger trg_scuderia_eventi_solo_autore before delete on public.scuderia_eventi_sanitari
  for each row execute function public.scuderia_eventi_solo_autore();

-- guide degli agenti: la regola della cancellazione
update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date,
  contenuto = replace(contenuto, '4. Se modifichi o cancelli una tua voce, si aggiorna anche la copia della scuderia.',
    '4. Se modifichi o cancelli una tua voce, si aggiorna anche la copia della scuderia. Le voci scritte dalla scuderia o dal maniscalco puoi leggerle ma non cancellarle: può farlo solo chi le ha registrate.')
where titolo = 'Libretto condiviso con scuderia e maniscalco';
update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date,
  contenuto = replace(contenuto, '4. Modifiche e cancellazioni si aggiornano anche sull''altra copia.',
    '4. Modifiche e cancellazioni si aggiornano anche sull''altra copia. Le voci del proprietario e del maniscalco non hanno il cestino: può cancellarle solo chi le ha registrate.')
where titolo = 'Eventi sanitari condivisi con proprietario e maniscalco';

-- controllo finale: deve dare 2 · 2
select (select count(*) from pg_trigger where tgname in ('trg_health_events_solo_autore','trg_scuderia_eventi_solo_autore')) as trigger_nuovi,
       (select count(*) from ai_conoscenze where titolo in ('Libretto condiviso con scuderia e maniscalco','Eventi sanitari condivisi con proprietario e maniscalco') and contenuto like '%solo chi le ha registrate%') as guide;
