-- Radar di Merlino: un solo avvio alla volta per centro (anche con clic ripetuti, più utenti o chiamate dirette).
-- Il "posto" dura 20 minuti: il tempo massimo di una generazione. Se la generazione fallisce, dopo 20 minuti si può riprovare.
create table if not exists public.merlino_radar_avvii (
  centro_id uuid primary key references public.centri(id) on delete cascade,
  avviato_il timestamptz not null default now()
);
alter table public.merlino_radar_avvii enable row level security;
revoke all on public.merlino_radar_avvii from anon, authenticated;

create or replace function public.radar_prenota(p_centro_id uuid, p_minuti int default 20) returns boolean
language plpgsql security definer set search_path = public as $$
declare v uuid;
begin
  insert into merlino_radar_avvii as a (centro_id, avviato_il) values (p_centro_id, now())
  on conflict (centro_id) do update set avviato_il = now()
    where a.avviato_il < now() - make_interval(mins => p_minuti)
  returning centro_id into v;
  return v is not null;
end $$;
revoke all on function public.radar_prenota(uuid, int) from public, anon, authenticated;
grant execute on function public.radar_prenota(uuid, int) to service_role;

select 'radar protetto' as esito;
