-- Equo: guide Premium — il prezzo segue il profilo, non la vista (7 ottobre 2026)
-- Chi ha anche un profilo professionale (maniscalco) paga sempre il prezzo da professionista; il Premium vale per tutto l'account.

update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date,
  contenuto = replace(contenuto,
    'Note: Prezzi validi nella vista professionista (la vista proprietario ha prezzi diversi).',
    'Note: Il Premium vale per tutto l''account: se hai anche il profilo da proprietario, è sbloccato anche quello. Chi ha un profilo da professionista paga sempre questi prezzi, da qualsiasi vista lo attivi.')
where titolo = 'Come passo a Premium e quanto costa';

update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date,
  contenuto = replace(contenuto,
    'I prezzi del profilo professionista sono diversi.',
    'Se hai anche un profilo da professionista (es. maniscalco) paghi il prezzo da professionista (7,99 €/mese, 59 €/anno, 99 € lifetime) e il Premium vale per entrambi i profili.')
where titolo = 'Quanto costa Premium e cosa include';

update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date,
  contenuto = replace(contenuto,
    'Per i professionisti Premium costa 7,99 €/mese, 59 €/anno o 99 € lifetime.',
    'Per i professionisti Premium costa 7,99 €/mese, 59 €/anno o 99 € lifetime. Il Premium vale per tutto l''account: chi ha sia il profilo professionista sia quello da proprietario paga il prezzo da professionista e li sblocca entrambi.')
where titolo = 'Piani Equo: Free e Premium';

-- controllo finale: deve dare 3
select count(*) as guide_aggiornate from ai_conoscenze
where titolo in ('Come passo a Premium e quanto costa','Quanto costa Premium e cosa include','Piani Equo: Free e Premium')
  and (contenuto like '%tutto l''account%' or contenuto like '%vale per entrambi i profili%');
