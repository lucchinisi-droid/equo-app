-- 24/10/2026 MISURE DEI FERRI: "x" al posto di "/" (4x0, 3x0, 2x0) e nome intero del sistema ("olandese" al posto di "NL")
-- Converte i dati gia salvati e le frasi dello storico. Si puo rieseguire senza danni.

-- 1) sigla del sistema scritta per intero (storico e testi generati dal database)
create or replace function public.equo_sigla_misura(s text) returns text
language sql immutable as $fn$
  select case s when 'italiana' then 'italiana' when 'olandese' then 'olandese' when 'tedesca' then 'tedesca' else '' end
$fn$;

-- 2) misure gia salvate: 4/0 -> 4x0 (senza scrivere nello storico un finto "ferro cambiato")
do $c$
begin
  perform set_config('equo.ferro_iniziale', 'on', true);
  update public.cavalli_clienti_mascalcia set ferro_numero = replace(ferro_numero, '/', 'x') where ferro_numero like '%/%';
  perform set_config('equo.ferro_iniziale', '', true);
  update public.interventi_mascalcia set numero_ferro = replace(numero_ferro, '/', 'x') where numero_ferro like '%/%';
end
$c$;

-- 3) frasi gia scritte nello storico dei cavalli: "n. 3/0 NL" -> "n. 3x0 olandese" (solo le righe del ferro)
update public.cavalli_storico
   set descrizione = regexp_replace(regexp_replace(regexp_replace(regexp_replace(descrizione,
         'n\. ([0-9])/0', 'n. \1x0', 'g'),
         '(n\. [0-9x]+) NL\M', '\1 olandese', 'g'),
         '(n\. [0-9x]+) IT\M', '\1 italiana', 'g'),
         '(n\. [0-9x]+) DE\M', '\1 tedesca', 'g')
 where tipo = 'ferro_standard' and (descrizione ~ 'n\. [0-9]/0' or descrizione ~ 'n\. [0-9x]+ (NL|IT|DE)\M');

-- 4) guida degli agenti: l'esempio con "n. 0 NL"
update public.ai_conoscenze set contenuto = replace(contenuto, 'n. 0 NL', 'n. 0 olandese'), aggiornato_il = now()
 where titolo = 'Come invio il riepilogo di un appuntamento in chat' and contenuto like '%n. 0 NL%';

-- controllo: atteso 0 | 0 | 0 | olandese
select (select count(*) from public.cavalli_clienti_mascalcia where ferro_numero like '%/%') cavalli_con_barra,
       (select count(*) from public.interventi_mascalcia where numero_ferro like '%/%') ferrature_con_barra,
       (select count(*) from public.cavalli_storico where tipo = 'ferro_standard' and descrizione ~ 'n\. [0-9x/]+ (NL|IT|DE)\M') storico_con_sigle,
       public.equo_sigla_misura('olandese') prova;
