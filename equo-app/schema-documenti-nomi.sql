-- Equo: NOMI DEI DOCUMENTI dati da Equo, non dal telefono (2 novembre 2026) · SQL 33
-- Decisione di Simone (2/11): il nome del file è costruito dai dati dell'app
--   «Aurora · 2 nov 2026 · Lastra · Piede ASx (2)» → file scaricato «Equo_Aurora_2026-11-02_Lastra_Piede-ASx_2.jpg».
-- Vale per tutti i ruoli (registro comune «documenti», SQL 32). Qui i dati separati per cercare e filtrare in archivio:
--  · data_documento: data della visita o del caricamento;
--  · zona: parte del cavallo (scelta rapida);
--  · nota: breve descrizione facoltativa, modificabile;
--  · numero: progressivo nello stesso giorno, per cavallo, tipo e zona;
--  · tipi per i documenti sanitari della scuderia: coggins, vaccino, passaporto.
-- Il nome (titolo) lo scrive l'app; il nome originale del file del telefono non si salva.
-- Rieseguibile.

alter table public.documenti add column if not exists data_documento date not null default current_date;
alter table public.documenti add column if not exists zona text;
alter table public.documenti add column if not exists nota text;
alter table public.documenti add column if not exists numero int;

alter table public.documenti drop constraint if exists documenti_zona_check;
alter table public.documenti add constraint documenti_zona_check check (zona is null or zona in
  ('as','ad','ps','pd','piede_as','piede_ad','piede_ps','piede_pd','testa','bocca','occhi','collo','dorso','torace','addome','pelle','intero'));
alter table public.documenti drop constraint if exists documenti_nota_check;
alter table public.documenti add constraint documenti_nota_check check (nota is null or length(nota) <= 120);

alter table public.documenti drop constraint if exists documenti_categoria_check;
alter table public.documenti add constraint documenti_categoria_check check (categoria in
  ('referto','lastra','ecografia','esame','foto_clinica','video','documento_sanitario','documento','seduta','coggins','vaccino','passaporto'));

-- Coggins, vaccino e passaporto sono sempre documenti sanitari obbligatori (visibili anche alla scuderia dove sta il cavallo)
create or replace function public.equo_doc_sanitario() returns trigger
language plpgsql set search_path to 'public' as $$
begin
  if new.categoria in ('coggins','vaccino','passaporto') then new.sanitario_obbligatorio := true; end if;
  return new;
end $$;
drop trigger if exists trg_documenti_sanitario on public.documenti;
create trigger trg_documenti_sanitario before insert or update of categoria on public.documenti for each row execute function public.equo_doc_sanitario();

-- archivio del cavallo: per cavallo e data
create index if not exists documenti_archivio_horse_idx on public.documenti (horse_id, data_documento desc) where eliminato_il is null;
create index if not exists documenti_archivio_cavcli_idx on public.documenti (cavallo_cliente_id, data_documento desc) where eliminato_il is null;

-- prossimo numero progressivo (stesso cavallo, giorno, tipo e zona) tra i documenti che chi carica può vedere
create or replace function public.equo_doc_prossimo_numero(p_horse uuid, p_cavcli uuid, p_data date, p_categoria text, p_zona text)
returns int language sql stable security definer set search_path to 'public' as $$
  select coalesce(max(d.numero), 0) + 1 from documenti d
   where d.eliminato_il is null and d.data_documento = p_data and d.categoria = p_categoria
     and coalesce(d.zona, '') = coalesce(p_zona, '')
     and ((p_horse is not null and d.horse_id = p_horse) or (p_cavcli is not null and d.cavallo_cliente_id = p_cavcli))
     and equo_doc_puo_vedere(d.id)
$$;
revoke all on function public.equo_doc_prossimo_numero(uuid, uuid, date, text, text) from public, anon;
grant execute on function public.equo_doc_prossimo_numero(uuid, uuid, date, text, text) to authenticated;
