-- Contatori pubblici delle promo Early Adopter (Premium a vita) per il sito equohub.com.
-- Su 150 posti proprietari, 30 sono riservati a tester e partner della beta: in vendita ne restano 120.
-- Su 50 posti professionisti, 5 sono riservati: in vendita ne restano 45.
-- Acquisto a vita = profilo Premium pagato su Stripe senza abbonamento ricorrente.
create or replace function public.promo_posti() returns jsonb
language sql stable security definer set search_path = public as $$
  with v as (
    select
      count(*) filter (where ruolo = 'proprietario') as prop,
      count(*) filter (where ruolo in ('maniscalco','veterinario','istruttore')) as pro
    from profiles
    where piano = 'premium' and stripe_customer_id is not null and stripe_subscription_id is null
  )
  select jsonb_build_object(
    'proprietari',   jsonb_build_object('totale', 150, 'riservati', 30, 'rimasti', greatest(120 - prop, 0)),
    'professionisti', jsonb_build_object('totale', 50,  'riservati', 5,  'rimasti', greatest(45 - pro, 0)))
  from v;
$$;
revoke all on function public.promo_posti() from public;
grant execute on function public.promo_posti() to anon, authenticated;

select public.promo_posti() as contatori;
