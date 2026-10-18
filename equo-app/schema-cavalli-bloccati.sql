-- Piano Free: i cavalli accettati dal maniscalco vengono aggiunti anche oltre il limite, ma restano bloccati (oltre il primo) finche non si passa a Premium.

create or replace function public.limite_cavalli_free() returns trigger
language plpgsql security definer set search_path = public as $fn$
declare n bigint;
begin
  if auth.uid() is null or auth.uid() <> new.owner_id then return new; end if;
  if coalesce((select piano from profiles where id = new.owner_id), 'free') = 'premium' then return new; end if;
  if exists (
    select 1 from cavalli_proposte p
      join cavalli_clienti_mascalcia cv on cv.id = p.riga_id
     where p.owner_id = new.owner_id and p.stato = 'in_attesa' and cv.equo_numero = new.equo_numero
  ) then return new; end if;
  select count(*) into n from horses where owner_id = new.owner_id;
  if n >= 1 then
    raise exception 'LIMITE_CAVALLI_FREE: il piano Free comprende 1 cavallo. Passa a Premium per aggiungerne altri.';
  end if;
  return new;
end
$fn$;

create or replace function public.equo_cavalli_bloccati() returns json
language sql stable security definer set search_path to 'public' as $fn$
  select coalesce(json_agg(p.horse_id), '[]'::json)
    from cavalli_proposte p
   where auth.uid() is not null and p.owner_id = auth.uid()
     and p.stato = 'accettata' and p.horse_id is not null
     and coalesce((select pr.piano from profiles pr where pr.id = p.owner_id), 'free') <> 'premium'
     and p.horse_id <> (select h.id from horses h where h.owner_id = p.owner_id order by h.created_at, h.id limit 1)
$fn$;
revoke all on function public.equo_cavalli_bloccati() from public, anon;
grant execute on function public.equo_cavalli_bloccati() to authenticated;
