-- Equo: PIANO FREE PROPRIETARIO A 3 CAVALLI + SISTEMAZIONE SARA MATTEUCCI / FRANCESCO BIZZARRI (27 ottobre 2026)
-- Eseguito da Claude su richiesta di Simone (27/10 sera). Rieseguibile senza danni.

-- 1) limite del piano Free: 3 cavalli invece di 1
create or replace function public.limite_cavalli_free()
returns trigger language plpgsql security definer set search_path = public as $$
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
  if n >= 3 then
    raise exception 'LIMITE_CAVALLI_FREE: il piano Free comprende 3 cavalli. Passa a Premium per aggiungerne altri.';
  end if;
  return new;
end $$;

-- cavalli bloccati col piano Free: solo quelli accettati dal maniscalco oltre i primi 3 (per data di creazione)
create or replace function public.equo_cavallo_bloccato(p_horse uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select p_horse is not null and exists (
    select 1 from cavalli_proposte p
     where p.horse_id = p_horse and p.stato = 'accettata'
       and coalesce((select pr.piano from profiles pr where pr.id = p.owner_id), 'free') <> 'premium'
       and p.horse_id not in (select h.id from horses h where h.owner_id = p.owner_id order by h.created_at, h.id limit 3))
$$;

-- 2) guide degli agenti: da 1 a 3 cavalli
update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date,
  contenuto = replace(contenuto, 'Free (1 cavallo,', 'Free (fino a 3 cavalli,')
 where titolo = 'Piani Equo: Free e Premium' and contenuto like '%Free (1 cavallo,%';
update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date,
  contenuto = replace(replace(replace(replace(contenuto,
    'un cavallo completo con libretto sanitario', 'fino a 3 cavalli completi con libretto sanitario'),
    'Luca usa Free per un solo cavallo: libretto, spese e chat col maniscalco gli bastano; passa a Premium quando il maniscalco gli prepara anche il secondo cavallo.',
    'Luca usa Free per i suoi 2 cavalli: libretto, spese e chat col maniscalco gli bastano; passa a Premium quando arriva il quarto cavallo.'),
    'Limiti Free: un solo cavallo completo. Se ne hai di più (per esempio quelli preparati dal tuo maniscalco), il più vecchio resta completo e gli altri',
    'Limiti Free: 3 cavalli completi. Se ne hai di più (per esempio quelli preparati dal tuo maniscalco), i 3 più vecchi restano completi e gli altri'),
    'secondo cavallo', 'quarto cavallo')
 where titolo = 'Cosa posso fare con il piano Free';
update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date,
  contenuto = replace(contenuto, 'Con il piano Free è completo un solo cavallo (il più vecchio): gli altri si aggiungono',
                                 'Con il piano Free sono completi 3 cavalli (i più vecchi): dal quarto in poi si aggiungono')
 where titolo = 'Il mio maniscalco mi ha preparato dei cavalli: come li accetto';
update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date,
  contenuto = replace(contenuto, 'Con il piano Free puoi avere un cavallo: gli altri restano in attesa finché non passi a Premium.',
                                 'Con il piano Free sono completi 3 cavalli: dal quarto in poi si aggiungono ma restano bloccati finché non passi a Premium.')
 where titolo = 'Cavalli preparati dal maniscalco: accettarli con tutti i lavori';
update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date,
  contenuto = replace(contenuto, 'torni al piano Free (1 cavallo)', 'torni al piano Free (fino a 3 cavalli)')
 where titolo = 'Codice invito: 3 mesi di Premium gratis';

-- 3) Sara Matteucci (cliente) e Francesco Bizzarri (maniscalco): Hermes e Klaus nell'account di Sara, con i lavori nel libretto
do $$
declare
  v_sara uuid := 'bee7ffa2-e97d-4baf-b184-ee0573da7f3b';
  v_fra uuid := 'f170bc74-a189-4d68-bab5-31d9613726bb';
  v_cli uuid := 'f6ff3f34-2f14-4089-8168-ce497c5f3e7a';
  r json; v_nomi text[] := '{}'; v_lavori int := 0; v_lib int := 0; v_dal date; p record;
begin
  for p in select id from cavalli_proposte where owner_id = v_sara and cliente_mascalcia_id = v_cli and stato = 'in_attesa' order by created_at loop
    r := equo_accetta_proposta_interno(p.id, v_sara);
    if (r->>'ok')::boolean then
      v_nomi := v_nomi || (r->>'nome');
      v_lavori := v_lavori + (r->>'lavori')::int; v_lib := v_lib + (r->>'nel_libretto')::int;
      v_dal := least(coalesce(v_dal, (r->>'dal')::date), coalesce((r->>'dal')::date, v_dal));
    else
      raise notice 'proposta %: %', p.id, r;
    end if;
  end loop;
  if array_length(v_nomi, 1) > 0 then
    perform equo_msg_cavalli_accettati(v_fra, v_cli, v_nomi, v_lavori, v_lib, v_dal);
  end if;
  -- le schede doppie del primo cliente (creato come scuderia e già archiviato): archiviate anche loro
  -- (i loro numeri PRV-000449/450 non si uniscono: Klaus e Hermes tengono i codici 456 e 457 che Sara ha già)
  update cavalli_clienti_mascalcia set archiviato_il = now()
   where cliente_mascalcia_id = '71a4b982-24ce-4d6b-b9b2-676987376d91' and archiviato_il is null;
end $$;

-- controllo finale
select (select count(*) from horses where owner_id = 'bee7ffa2-e97d-4baf-b184-ee0573da7f3b') as cavalli_sara,
       (select string_agg(name, ', ' order by name) from horses where owner_id = 'bee7ffa2-e97d-4baf-b184-ee0573da7f3b') as nomi,
       (select count(*) from cavalli_proposte where owner_id = 'bee7ffa2-e97d-4baf-b184-ee0573da7f3b' and stato = 'in_attesa') as proposte_in_attesa,
       (select count(*) from interventi_mascalcia where cliente_mascalcia_id = 'f6ff3f34-2f14-4089-8168-ce497c5f3e7a' and health_event_id is not null) as lavori_nel_libretto,
       (select count(*) from ai_conoscenze where contenuto ~ '(Free \(1 cavallo|un solo cavallo completo|Free è completo un solo cavallo|Free puoi avere un cavallo)') as guide_vecchie;
