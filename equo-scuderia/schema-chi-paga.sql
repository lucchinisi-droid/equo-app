-- Equo · SQL 56 · Chi paga i lavori del maniscalco: la struttura o il proprietario (10/11/2026)
-- Problema (Francesco Bizzarri): Giulius Caesar vedeva in Professionisti › Francesco › Lavori il prezzo e lo stato del
-- pagamento anche dei cavalli che paga il proprietario, perché nell'app del maniscalco tutti i cavalli che segue lì
-- stanno nella scheda della struttura.
-- Ora:
--   · ogni cavallo della scheda di una struttura ha «chi paga»: struttura (vuoto = struttura, come prima) o proprietario;
--   · se paga il proprietario, la scuderia vede il lavoro (data, servizio, ferri, prossima) ma NON prezzo né pagamento;
--   · punto di partenza (scelta B di Simone): dove la scuderia ha classificato il cavallo, «proprietà del centro» →
--     struttura; pensione, mezza pensione, soci → proprietario. I cavalli non collegati o senza categoria restano
--     «struttura» finché il maniscalco non sceglie. Il maniscalco può cambiarlo dalla scheda del cavallo.

alter table cavalli_clienti_mascalcia add column if not exists chi_paga text;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'cavalli_clienti_mascalcia_chi_paga_check') then
    alter table cavalli_clienti_mascalcia add constraint cavalli_clienti_mascalcia_chi_paga_check check (chi_paga is null or chi_paga in ('struttura', 'proprietario'));
  end if;
end $$;

-- 1 · la scheda del maniscalco vista dalla scuderia: niente prezzo sui cavalli che paga il proprietario ---------------
do $$ declare v_def text;
  a text := '''importo'', i.importo, ''pagamento'', i.stato_pagamento, ''saldato_il'', i.saldato_il,';
  b text := 'left join cavalli_clienti_mascalcia cv on cv.id = i.cavallo_cliente_id), ''[]''::json),';
begin
  v_def := pg_get_functiondef('public.scuderia_pro_scheda(uuid)'::regprocedure);
  if position('chi_paga' in v_def) = 0 then
    if position(a in v_def) = 0 or position(b in v_def) = 0 then raise exception 'SQL 56: scuderia_pro_scheda non è come previsto, avvisa Claude.'; end if;
    v_def := replace(v_def, a,
      '''importo'', case when cv.chi_paga = ''proprietario'' then null else i.importo end,'
      || ' ''pagamento'', case when cv.chi_paga = ''proprietario'' then null else i.stato_pagamento end,'
      || ' ''saldato_il'', case when cv.chi_paga = ''proprietario'' then null else i.saldato_il end,'
      || ' ''paga_proprietario'', coalesce(cv.chi_paga = ''proprietario'', false),');
    execute v_def;
  end if;
end $$;

-- 2 · punto di partenza (B): dalla categoria che la scuderia ha dato al cavallo -------------------------------------
update cavalli_clienti_mascalcia cv
   set chi_paga = case when sc.tipo_proprieta = 'proprieta' then 'struttura' else 'proprietario' end
  from clienti_mascalcia k, scuderia_cavalli sc
 where k.id = cv.cliente_mascalcia_id and k.centro_id is not null
   and sc.id = cv.scuderia_cavallo_id and sc.tipo_proprieta in ('proprieta', 'pensione', 'mezza_pensione', 'soci')
   and cv.chi_paga is null;

select k.nome as struttura,
       count(*) filter (where cv.chi_paga = 'proprietario') as paga_proprietario,
       count(*) filter (where cv.chi_paga = 'struttura') as paga_struttura,
       count(*) filter (where cv.chi_paga is null) as non_deciso
  from cavalli_clienti_mascalcia cv join clienti_mascalcia k on k.id = cv.cliente_mascalcia_id
 where k.centro_id is not null and cv.archiviato_il is null
 group by k.nome order by 1;
