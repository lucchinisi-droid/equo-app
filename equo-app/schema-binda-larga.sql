-- Equo: «banda larga in punta» → «binda larga in punta» (il termine giusto, 03/11/2026). Rieseguibile.
-- PARTE 1 (eseguita da Claude il 03/11): testi già scritti nei lavori e nello storico.
update public.interventi_mascalcia
   set ferro_note = regexp_replace(ferro_note, '([Bb])anda larga in punta', '\1inda larga in punta', 'g')
 where ferro_note ~* 'banda larga in punta';
update public.cavalli_storico
   set descrizione = regexp_replace(descrizione, '([Bb])anda larga in punta', '\1inda larga in punta', 'g')
 where descrizione ~* 'banda larga in punta';

-- PARTE 2 (DA ESEGUIRE DOPO IL DEPLOY dell'app con «Binda»): le scelte salvate nelle schede dei cavalli.
-- Prima del deploy l'app vecchia non riconoscerebbe la parola nuova e, modificando la scheda, la toglierebbe.
-- (L'app nuova legge comunque anche la parola vecchia.)
-- update public.cavalli_clienti_mascalcia
--    set ferro_dettagli = array_replace(ferro_dettagli, 'Banda larga in punta', 'Binda larga in punta'),
--        ferro_dettagli_post = array_replace(ferro_dettagli_post, 'Banda larga in punta', 'Binda larga in punta')
--  where 'Banda larga in punta' = any(coalesce(ferro_dettagli, '{}')) or 'Banda larga in punta' = any(coalesce(ferro_dettagli_post, '{}'));

-- controllo: dopo la parte 1 deve dare 0 · 0 (dopo la parte 2 anche la terza colonna 0)
select (select count(*) from public.interventi_mascalcia where ferro_note ~* 'banda larga') as lavori,
       (select count(*) from public.cavalli_storico where descrizione ~* 'banda larga') as storico,
       (select count(*) from public.cavalli_clienti_mascalcia where array_to_string(coalesce(ferro_dettagli,'{}') || coalesce(ferro_dettagli_post,'{}'), ',') ~* 'banda larga') as schede;
