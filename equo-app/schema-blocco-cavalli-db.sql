-- 21/10/2026 BLOCCO VERO DEI CAVALLI FREE (lato database).
-- Un cavallo e "bloccato" se il proprietario non e Premium, il cavallo gli e arrivato da una proposta del maniscalco
-- e non e il suo cavallo piu vecchio. Prima i dati arrivavano al telefono ed erano solo sfocati: ora il database
-- non li consegna proprio al proprietario (libretto sanitario, storico, album, sport, spese, diario, lezioni,
-- allegati e spostamenti). Maniscalco, scuderia e allenatore continuano a vedere e registrare tutto come prima.
-- Quando il proprietario passa a Premium i dati tornano visibili subito, senza fare nulla.

create or replace function public.equo_cavallo_bloccato(p_horse uuid) returns boolean
language sql stable security definer set search_path to 'public' as $fn$
  select p_horse is not null and exists (
    select 1 from cavalli_proposte p
     where p.horse_id = p_horse and p.stato = 'accettata'
       and coalesce((select pr.piano from profiles pr where pr.id = p.owner_id), 'free') <> 'premium'
       and p.horse_id <> (select h.id from horses h where h.owner_id = p.owner_id order by h.created_at, h.id limit 1))
$fn$;
revoke all on function public.equo_cavallo_bloccato(uuid) from public, anon;
grant execute on function public.equo_cavallo_bloccato(uuid) to authenticated;

-- elenco per l'app (stessa regola)
create or replace function public.equo_cavalli_bloccati() returns json
language sql stable security definer set search_path to 'public' as $fn$
  select coalesce(json_agg(h.id), '[]'::json) from horses h
   where auth.uid() is not null and h.owner_id = auth.uid() and equo_cavallo_bloccato(h.id)
$fn$;
revoke all on function public.equo_cavalli_bloccati() from public, anon;
grant execute on function public.equo_cavalli_bloccati() to authenticated;

-- elenco per il riepilogo settimanale di Pegasus (gira con la chiave di servizio)
create or replace function public.equo_cavalli_bloccati_di(p_owner uuid) returns json
language sql stable security definer set search_path to 'public' as $fn$
  select coalesce(json_agg(h.id), '[]'::json) from horses h where h.owner_id = p_owner and equo_cavallo_bloccato(h.id)
$fn$;
revoke all on function public.equo_cavalli_bloccati_di(uuid) from public, anon, authenticated;
grant execute on function public.equo_cavalli_bloccati_di(uuid) to service_role;

-- regole di lettura: si aggiunge "e il cavallo non e bloccato" SOLO al ramo del proprietario
alter policy events_select_own on public.health_events using (
  exists (select 1 from horses h where h.id = health_events.horse_id and h.owner_id = auth.uid())
  and not equo_cavallo_bloccato(health_events.horse_id));

alter policy cavalli_storico_select on public.cavalli_storico using (
  exists (select 1 from horses h where h.id = cavalli_storico.horse_id and h.owner_id = auth.uid())
  and not equo_cavallo_bloccato(cavalli_storico.horse_id));

alter policy cavalli_storico_lettura on public.cavalli_storico using (
  exists (select 1 from cavalli_clienti_mascalcia c where c.id = cavalli_storico.cavallo_cliente_id and c.maniscalco_id = auth.uid())
  or (exists (select 1 from horses h where h.id = cavalli_storico.horse_id and h.owner_id = auth.uid())
      and not equo_cavallo_bloccato(cavalli_storico.horse_id))
  or exists (select 1 from scuderia_cavalli s where s.id = cavalli_storico.scuderia_cavallo_id and is_member_of_centro(s.centro_id)));

alter policy cavalli_album_select on public.cavalli_album using (
  exists (select 1 from horses h where h.id = cavalli_album.horse_id and h.owner_id = auth.uid())
  and not equo_cavallo_bloccato(cavalli_album.horse_id));

alter policy cavalli_sport_sel on public.cavalli_sport using (
  exists (select 1 from horses h where h.id = cavalli_sport.horse_id and h.owner_id = auth.uid())
  and not equo_cavallo_bloccato(cavalli_sport.horse_id));

alter policy sport_voci_sel on public.sport_voci using (
  exists (select 1 from horses h where h.id = sport_voci.horse_id and h.owner_id = auth.uid())
  and not equo_cavallo_bloccato(sport_voci.horse_id));

alter policy expenses_select_own on public.expenses using (
  auth.uid() = owner_id and not equo_cavallo_bloccato(expenses.horse_id));

alter policy diario_voci_select on public.diario_voci using (
  autore_id = auth.uid() and not equo_cavallo_bloccato(diario_voci.horse_id));

alter policy lezioni_manuali_select on public.lezioni_manuali using (
  owner_id = auth.uid() and not equo_cavallo_bloccato(lezioni_manuali.horse_id));

alter policy cavalli_arrivi_lettura on public.cavalli_arrivi using (
  is_member_of_centro(centro_id) or richiesto_da = auth.uid()
  or (exists (select 1 from horses h where h.id = cavalli_arrivi.horse_id and h.owner_id = auth.uid())
      and not equo_cavallo_bloccato(cavalli_arrivi.horse_id)));

-- allegati e spostamenti visti dal proprietario passano da qui
create or replace function public.equo_chiavi_cavallo(p_vista text, p_id uuid, out ok boolean, out horse uuid, out schede uuid[], out righe uuid[])
returns record language plpgsql stable security definer set search_path to 'public' as $fn$
declare v_scheda uuid;
begin
  ok := false;
  if p_vista = 'maniscalco' then
    select cv.horse_id, cv.scuderia_cavallo_id into horse, v_scheda from cavalli_clienti_mascalcia cv where cv.id = p_id and cv.maniscalco_id = auth.uid();
    if not found then return; end if;
    if horse is null and v_scheda is not null then select sc.horse_id into horse from scuderia_cavalli sc where sc.id = v_scheda; end if;
  elsif p_vista = 'proprietario' then
    if not exists (select 1 from horses h where h.id = p_id and h.owner_id = auth.uid()) then return; end if;
    if equo_cavallo_bloccato(p_id) then return; end if;
    horse := p_id;
  elsif p_vista = 'scuderia' then
    select sc.horse_id into horse from scuderia_cavalli sc where sc.id = p_id and is_member_of_centro(sc.centro_id);
    if not found then return; end if;
    v_scheda := p_id;
  else return;
  end if;
  ok := true;
  select coalesce(array_agg(distinct sc.id), '{}') into schede from scuderia_cavalli sc
   where sc.id = v_scheda or (horse is not null and sc.horse_id = horse);
  select coalesce(array_agg(distinct cv.id), '{}') into righe from cavalli_clienti_mascalcia cv
   where (p_vista = 'maniscalco' and cv.id = p_id) or (horse is not null and cv.horse_id = horse) or cv.scuderia_cavallo_id = any(schede);
end $fn$;
