-- Equo · SQL 63 · Il proprietario vede se il professionista è il maniscalco o il veterinario · 11/11/2026
-- Prima: chat e cavalli proposti dicevano sempre «Il tuo maniscalco» / «lavori del maniscalco», anche per i veterinari.
--   · lista_maniscalchi_collegati(): in più 'professione' (maniscalco | veterinario | istruttore) e, senza nome,
--     «Il tuo veterinario» al posto di «Il tuo maniscalco»;
--   · equo_proposte_cavalli_proprietario(): in più 'professione' del professionista che propone il cavallo.
-- Solo campi in più nelle risposte: l'app di adesso continua a funzionare uguale. Niente tabelle toccate.

create or replace function public.lista_maniscalchi_collegati()
 returns json
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  select coalesce(json_agg(x order by x.ultimo_at desc nulls last), '[]'::json) from (
    select c.id as cliente_mascalcia_id, c.maniscalco_id,
      coalesce(nullif(c.professione, ''), 'maniscalco') as professione,
      coalesce(nullif(trim(p.full_name), ''), nullif(trim(p.dati_pagamento_nome), ''),
               case when c.professione = 'veterinario' then 'Il tuo veterinario' when c.professione = 'istruttore' then 'Il tuo istruttore' else 'Il tuo maniscalco' end) as nome_maniscalco,
      coalesce(p.certificazione_stato = 'verificato', false) as certificato,
      (select count(*) from public.messaggi_mascalcia m
        where m.cliente_mascalcia_id = c.id and m.mittente_tipo = 'maniscalco' and not coalesce(m.letto, false)) as non_letti,
      u.testo as ultimo_testo, u.tipo as ultimo_tipo, u.mittente_tipo as ultimo_mittente,
      u.file_nome as ultimo_file_nome, u.created_at as ultimo_at
    from public.clienti_mascalcia c
    left join public.profiles p on p.id = c.maniscalco_id
    left join lateral (
      select m.testo, m.tipo, m.mittente_tipo, m.file_nome, m.created_at
      from public.messaggi_mascalcia m
      where m.cliente_mascalcia_id = c.id
      order by m.created_at desc limit 1
    ) u on true
    where c.cliente_user_id = auth.uid()
  ) x;
$function$;

create or replace function public.equo_proposte_cavalli_proprietario()
 returns json
 language sql
 stable security definer
 set search_path to 'public'
as $function$
  select coalesce(json_agg(json_build_object(
    'proposta', p.id, 'riga', cv.id, 'nome', cv.nome, 'razza', cv.razza, 'microchip', cv.microchip,
    'codice', cv.codice_equo, 'maniscalco', equo_nome_profilo(p.maniscalco_id), 'cliente', c.nome, 'dal', p.created_at,
    'professione', coalesce(nullif(c.professione, ''), 'maniscalco'),
    'candidati', equo_candidati_proprietario(cv.id, auth.uid()),
    'esiste_gia', exists (select 1 from json_array_elements(equo_candidati_proprietario(cv.id, auth.uid())) e where e->>'esito' = 'certo')
  ) order by p.created_at, cv.nome), '[]'::json)
  from cavalli_proposte p
  join cavalli_clienti_mascalcia cv on cv.id = p.riga_id
  join clienti_mascalcia c on c.id = p.cliente_mascalcia_id
  where p.owner_id = auth.uid() and p.stato = 'in_attesa' and auth.uid() is not null
$function$;

-- PROVA_OK: tutte e due le funzioni ora restituiscono la professione
select case when pg_get_functiondef('public.lista_maniscalchi_collegati'::regproc) like '%professione%'
             and pg_get_functiondef('public.equo_proposte_cavalli_proprietario'::regproc) like '%''professione''%'
            then 'PROVA_OK' else 'PROBLEMA' end as esito;
