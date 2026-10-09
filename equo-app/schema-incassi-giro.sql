-- Equo: INCASSI A TRE SCHEDE (data del saldo) + ORDINE DEL GIRO IN AGENDA (9 ottobre 2026)

-- 1. giorno in cui il cliente ha pagato (da oggi in poi; per i saldati di prima vale il giorno del lavoro)
alter table public.interventi_mascalcia add column if not exists saldato_il timestamptz;

create or replace function public.interventi_data_saldo()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.stato_pagamento = 'saldato' then
    if tg_op = 'INSERT' then
      -- registrato già saldato: se il lavoro è di un giorno passato vale quel giorno, altrimenti adesso
      if new.saldato_il is null then
        new.saldato_il := case when new.data_intervento < (now() at time zone 'Europe/Rome')::date
                               then (new.data_intervento::timestamp + time '12:00') at time zone 'Europe/Rome' else now() end;
      end if;
    elsif old.stato_pagamento is distinct from 'saldato' then
      new.saldato_il := now();
    end if;
  else
    new.saldato_il := null;
  end if;
  return new;
end $$;
drop trigger if exists trg_interventi_data_saldo on public.interventi_mascalcia;
create trigger trg_interventi_data_saldo before insert or update of stato_pagamento on public.interventi_mascalcia
  for each row execute function public.interventi_data_saldo();

-- 2. ordine del giro nella giornata (scelto dal maniscalco trascinando; vuoto = in ordine di orario)
alter table public.interventi_mascalcia add column if not exists ordine_giro integer;

-- 3. guide del maniscalco
update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date,
  contenuto = replace(contenuto, '5. Tocca un appuntamento (o ⋯) per le azioni.',
    '5. Tocca un appuntamento (o ⋯) per le azioni.
6. Ordine del giro: nel giorno aperto tieni premuta la maniglia ⋮⋮ e trascina un cavallo dentro il suo cliente, o il nome del cliente per spostare tutto il gruppo. Se metti un appuntamento con orario prima di uno con orario diverso, Equo chiede «Scambiare anche gli orari?» (Sì: si scambiano e i clienti collegati ricevono l''avviso; No: cambia solo l''ordine). L''ordine vale anche per il widget «Oggi» e per «Naviga».')
where id = '2319e387-35cc-4f53-a0c3-83bcd9461938' and contenuto not like '%Ordine del giro%';

insert into public.ai_conoscenze (ambito, categoria, attivo, titolo, contenuto, aggiornato_il, verificato_il)
select 'maniscalco', 'guida', true, 'Come leggo gli incassi (Saldati, Da saldare, Previsti)',
'Dove: barra in basso → "Incassi"
Passi:
1. In alto tre schede con il loro totale: "Saldati", "Da saldare", "Previsti".
2. "Saldati": scegli il periodo (Oggi, Settimana, Mese, Anno o "Scegli date"). Vedi l''incassato con il confronto col periodo prima (▲/▼), il numero di lavori saldati, la media a lavoro, il grafico, gli incassi per tipo di lavoro e per cliente e l''elenco con giorno del lavoro e giorno del pagamento.
3. "Da saldare": i lavori fatti e non ancora pagati, divisi per cliente, con quanti giorni sono passati (in rosso oltre 30). Tocca "Saldato" quando ti pagano.
4. "Previsti": gli appuntamenti in agenda che hanno già un importo, divisi per giorno.
Esempio: Luca sceglie "Mese": 3.140 € incassati a ottobre, ▲ 13% rispetto a settembre; Scuderia Le Querce è il cliente che ha pagato di più.
Note: Conta il giorno in cui il cliente ha pagato (registrato quando segni "Saldato"); per i lavori saldati prima del 9 ottobre 2026 vale il giorno del lavoro. Nel piano Free i Saldati mostrano Oggi e il mese corrente; Settimana, Anno e date a scelta sono Premium. Se hai nascosto gli incassi con il PIN, la sezione resta protetta.
Parole chiave: incassi, incassato, saldati, da saldare, previsti, statistiche, guadagni, fatturato, mese, anno, chi mi deve pagare, media, quanto ho incassato',
now(), current_date
where not exists (select 1 from public.ai_conoscenze where titolo = 'Come leggo gli incassi (Saldati, Da saldare, Previsti)');

-- controllo finale: deve dare 1 · 1 · 1 · 1
select (select count(*) from information_schema.columns where table_name = 'interventi_mascalcia' and column_name = 'saldato_il') as data_saldo,
       (select count(*) from information_schema.columns where table_name = 'interventi_mascalcia' and column_name = 'ordine_giro') as ordine_giro,
       (select count(*) from ai_conoscenze where titolo = 'Come leggo gli incassi (Saldati, Da saldare, Previsti)') as guida_incassi,
       (select count(*) from ai_conoscenze where id = '2319e387-35cc-4f53-a0c3-83bcd9461938' and contenuto like '%Ordine del giro%') as guida_agenda;
