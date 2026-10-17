-- Equo · fix registrazione (17/10/2026): il trigger di inserimento azzerava certificazione_stato a NULL,
-- ma la colonna è NOT NULL (default 'nessuno'): la scelta del ruolo falliva per i nuovi utenti. Già applicato in produzione.
create or replace function public.profiles_insert_guard()
 returns trigger language plpgsql security definer set search_path to 'public'
as $function$
begin
  if auth.uid() is null then return new; end if;
  new.piano := 'free';
  new.premium_livello := null;
  new.stripe_customer_id := null;
  new.stripe_subscription_id := null;
  new.certificazione_stato := 'nessuno';
  new.certificazione_motivo := null;
  new.certificazione_richiesta_at := null;
  new.certificazione_verificata_at := null;
  new.certificazione_notificata_at := null;
  new.iscrizione_notificata_at := null;
  new.incassi_nascosti := false;
  new.incassi_pin_hash := null;
  new.incassi_pin_tentativi := 0;
  new.incassi_pin_blocco := null;
  return new;
end $function$;
