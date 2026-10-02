-- Piano Free del maniscalco: massimo 10 clienti (Premium illimitati).
-- Vale per i clienti che il maniscalco aggiunge da solo; i collegamenti avviati da una struttura (Equo Scuderia) non vengono bloccati.
create or replace function public.limite_clienti_free() returns trigger
language plpgsql security definer set search_path = public as $$
declare n bigint;
begin
  if auth.uid() is null or auth.uid() <> new.maniscalco_id then return new; end if;
  if coalesce((select piano from profiles where id = new.maniscalco_id), 'free') = 'premium' then return new; end if;
  select count(*) into n from clienti_mascalcia where maniscalco_id = new.maniscalco_id;
  if n >= 10 then
    raise exception 'LIMITE_CLIENTI_FREE: hai raggiunto i 10 clienti del piano Free. Passa a Premium per aggiungerne altri.';
  end if;
  return new;
end $$;
drop trigger if exists trg_limite_clienti_free on public.clienti_mascalcia;
create trigger trg_limite_clienti_free before insert on public.clienti_mascalcia
  for each row execute function public.limite_clienti_free();

select p.full_name, p.piano, count(c.id) as clienti
from profiles p join clienti_mascalcia c on c.maniscalco_id = p.id
group by p.full_name, p.piano order by clienti desc;
