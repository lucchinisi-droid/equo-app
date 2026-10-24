-- 24/10/2026 FRANCESCO BIZZARRI: correzioni dopo il pop-up dell'importazione
-- 1) Bombastik e Ridam: la ferratura del 14/10 era stata fatta davvero (nella vecchia app scadenza 18/11 = 14/10 + 35 giorni),
--    nel pop-up era stata annullata per errore: torna "fatto". Bombastik da saldare 10 euro, Ridam saldato (come nella vecchia app).
-- 2) Moro: la ferratura del 23/10 da 12 euro era stata inserita due volte: si toglie la copia del 24/10.
-- Agisce solo se le righe sono ancora come le abbiamo viste: si puo rieseguire senza danni.

update public.interventi_mascalcia set stato = 'fatto', stato_pagamento = 'da_saldare'
 where id = '2df381c5-2ffe-4e53-9607-3f8fe626c5ea' and maniscalco_id = 'f170bc74-a189-4d68-bab5-31d9613726bb' and stato = 'annullato';

update public.interventi_mascalcia set stato = 'fatto', stato_pagamento = 'saldato'
 where id = '70c60fdc-37c0-46b1-9639-2d5141cb2176' and maniscalco_id = 'f170bc74-a189-4d68-bab5-31d9613726bb' and stato = 'annullato';

delete from public.interventi_mascalcia
 where id = 'fd4d912e-644e-4877-8032-cb84b00ae046' and maniscalco_id = 'f170bc74-a189-4d68-bab5-31d9613726bb'
   and exists (select 1 from public.interventi_mascalcia o where o.id = 'c93d66d8-379a-48b6-81aa-6be0003d8a7f' and o.stato = 'fatto');

-- controllo: atteso 846 - 12 (Moro) + 10 (Bombastik) = 844 euro da saldare
select (select sum(importo) from public.interventi_mascalcia
         where maniscalco_id = 'f170bc74-a189-4d68-bab5-31d9613726bb' and stato = 'fatto' and stato_pagamento = 'da_saldare') da_saldare,
       (select string_agg(id::text || ' ' || stato || ' ' || stato_pagamento, ' | ') from public.interventi_mascalcia
         where id in ('2df381c5-2ffe-4e53-9607-3f8fe626c5ea', '70c60fdc-37c0-46b1-9639-2d5141cb2176')) bombastik_ridam,
       (select count(*) from public.interventi_mascalcia
         where id in ('c93d66d8-379a-48b6-81aa-6be0003d8a7f', 'fd4d912e-644e-4877-8032-cb84b00ae046')) moro_righe;
