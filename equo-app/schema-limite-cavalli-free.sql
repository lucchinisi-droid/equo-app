-- Piano Free del proprietario: 1 cavallo (Premium illimitati). I cavalli già presenti restano tutti.
create or replace function public.limite_cavalli_free() returns trigger
language plpgsql security definer set search_path = public as $$
declare n bigint;
begin
  if auth.uid() is null or auth.uid() <> new.owner_id then return new; end if;
  if coalesce((select piano from profiles where id = new.owner_id), 'free') = 'premium' then return new; end if;
  select count(*) into n from horses where owner_id = new.owner_id;
  if n >= 1 then
    raise exception 'LIMITE_CAVALLI_FREE: il piano Free comprende 1 cavallo. Passa a Premium per aggiungerne altri.';
  end if;
  return new;
end $$;
drop trigger if exists trg_limite_cavalli_free on public.horses;
create trigger trg_limite_cavalli_free before insert on public.horses
  for each row execute function public.limite_cavalli_free();
