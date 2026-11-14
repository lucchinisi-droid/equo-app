-- =====================================================================================
-- SQL 70 · 14/11/2026 · Caricamento foto e documenti di nuovo funzionante
-- Problema: caricando dall'Archivio (e dagli altri punti che usano i documenti privati)
-- la foto arrivava nello spazio file, ma la riga in «documenti» veniva rifiutata (errore 403)
-- e l'app cancellava il file. Succedeva a maniscalco e veterinario.
-- Causa: dopo l'inserimento l'app chiede indietro l'id; la regola di lettura controlla
-- con una funzione che cerca il documento nella tabella, ma la riga appena scritta
-- per quella funzione non esiste ancora → «riga non permessa».
-- Correzione: l'autore vede sempre i propri documenti non eliminati, controllato
-- direttamente sulla riga (senza cercarla). Tutto il resto della regola resta uguale.
-- Si può eseguire più volte.
-- =====================================================================================

drop policy if exists documenti_leggi on public.documenti;
create policy documenti_leggi on public.documenti for select to authenticated
  using ((autore_user_id = auth.uid() and eliminato_il is null)
         or equo_doc_puo_vedere(id) or equo_doc_puo_decidere(id));

-- ---------- prova: un veterinario e un maniscalco caricano un documento (poi tutto annullato) ----------
create or replace function pg_temp.equo70_prova(p_ruolo text) returns text language plpgsql as $$
declare u uuid; c uuid; nuovo uuid; esito text := 'nessun cavallo da provare';
begin
  select cv.maniscalco_id, cv.id into u, c from cavalli_clienti_mascalcia cv join profiles p on p.id = cv.maniscalco_id
   where p.ruolo = p_ruolo and cv.archiviato_il is null limit 1;
  if u is null then return esito; end if;
  begin
    perform set_config('request.jwt.claims', json_build_object('sub', u, 'role', 'authenticated')::text, true);
    set local role authenticated;
    insert into documenti (categoria, data_documento, numero, titolo, cavallo_cliente_id, autore_ruolo, mime, byte, path, autore_user_id)
    values ('foto_clinica', current_date, 999, 'prova SQL 70', c, p_ruolo, 'image/jpeg', 1, u || '/prova-sql70.jpg', u)
    returning id into nuovo;
    esito := case when nuovo is not null then 'ok' else 'id mancante' end;
    raise exception 'annulla';            -- annulla l'inserimento di prova
  exception when others then
    if sqlerrm <> 'annulla' then esito := sqlerrm; end if;
  end;
  reset role;
  return esito;
end $$;

select case when pg_temp.equo70_prova('veterinario') in ('ok', 'nessun cavallo da provare')
             and pg_temp.equo70_prova('maniscalco') in ('ok', 'nessun cavallo da provare')
            then 'PROVA_OK'
            else 'PROVA_FALLITA · veterinario: ' || pg_temp.equo70_prova('veterinario') || ' · maniscalco: ' || pg_temp.equo70_prova('maniscalco') end as esito;
