-- Equo: «TORNA A CASA» A FINE GIORNATA (27 ottobre 2026)
-- Finito l'ultimo lavoro del giorno (modalità Lavoro o Home) il maniscalco tocca «Torna a casa»:
-- si apre il navigatore verso la base, la giornata registra l'ora e il punto di partenza del ritorno
-- e i km si ricalcolano con il ritorno dalla posizione reale. Arrivato a casa, riaprendo l'app
-- compare il riepilogo della giornata (km, carburante, guadagno netto) da chiudere.
-- Lettura del contachilometri facoltativa: una al giorno, la sera al rientro o la mattina alla partenza.

-- 1) giornata: rientro e chiusura
alter table public.officina_giornate add column if not exists rientro_il timestamptz;
alter table public.officina_giornate add column if not exists rientro_lat double precision;
alter table public.officina_giornate add column if not exists rientro_lon double precision;
alter table public.officina_giornate add column if not exists km_cruscotto integer;
alter table public.officina_giornate add column if not exists chiusa_il timestamptz;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'officina_giornate_km_cruscotto_chk') then
    alter table public.officina_giornate add constraint officina_giornate_km_cruscotto_chk check (km_cruscotto is null or km_cruscotto between 0 and 3000000);
  end if;
end $$;

-- 2) impostazione: quando leggi il contachilometri (vuoto = mai)
alter table public.officina_impostazioni add column if not exists lettura_km text;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'officina_impostazioni_lettura_km_chk') then
    alter table public.officina_impostazioni add constraint officina_impostazioni_lettura_km_chk check (lettura_km is null or lettura_km in ('sera', 'mattina'));
  end if;
end $$;

-- 3) guida degli agenti AI
insert into public.ai_conoscenze (ambito, categoria, attivo, titolo, contenuto, aggiornato_il, verificato_il)
select 'maniscalco', 'guida', true, 'Torna a casa e riepilogo della giornata',
'Dove: modalità Lavoro dopo l''ultima tappa del giorno · Home → riquadro "Giornata finita" · impostazioni in Officina mobile → "La tua base"
Passi:
1. Chiusa l''ultima tappa di oggi compare "Giornata finita": tocca "Torna a casa" (anche dalla Home, il riquadro resta fino a sera).
2. Si apre la scelta del navigatore (Google Maps, Apple Mappe, Waze) verso la tua base. Equo salva l''ora e il punto da cui riparti.
3. I km di oggi si ricalcolano: base → tappe nell''ordine del giro → posizione da cui riparti → casa.
4. Arrivato a casa, riapri Equo: compare da solo il riepilogo con km, carburante, lavori fatti, spese e guadagno netto del giorno. Se non compare tocca "Sono arrivato" nel riquadro in Home.
5. Contachilometri (facoltativo): in "La tua base" (Officina mobile) o in fondo al riepilogo scegli se leggerlo la sera al rientro (lo scrivi nel riepilogo) o la mattina alla partenza (te lo chiede la Home). Con due letture di giorni vicini Equo usa i km veri al posto della stima e aggiorna i km del mezzo per tagliando e cinghia.
6. Tocca "Chiudi la giornata": si salvano km, carburante e spese automatiche in Officina mobile.
Esempio: Luca finisce l''ultima ferratura alle 17:40, tocca "Torna a casa" e parte con Waze; alle 18:30 apre Equo e legge: 96 km, gasolio ≈ 13 €, lavori 420 €, spese 93 €, guadagno netto 327 €.
Note: Senza base Equo te la chiede la prima volta. I km sono una stima stradale (Beta): l''app non segue il GPS durante il viaggio. Senza consumo del mezzo o prezzo del carburante il costo non si calcola, i km sì.
Parole chiave: torna a casa, rientro, fine giornata, riepilogo giornata, km di oggi, chilometri, carburante, contachilometri, cruscotto, guadagno netto del giorno, navigazione casa',
now(), current_date
where not exists (select 1 from public.ai_conoscenze where titolo = 'Torna a casa e riepilogo della giornata');

-- controllo finale: deve dare 5 · 1 · 1
select (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'officina_giornate'
          and column_name in ('rientro_il','rientro_lat','rientro_lon','km_cruscotto','chiusa_il')) as colonne_giornata,
       (select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'officina_impostazioni' and column_name = 'lettura_km') as lettura,
       (select count(*) from ai_conoscenze where titolo = 'Torna a casa e riepilogo della giornata') as guida;
