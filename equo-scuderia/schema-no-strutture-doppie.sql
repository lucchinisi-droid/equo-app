-- Equo · SQL 51 · Niente scuderie doppie quando un maniscalco si collega (9/11/2026 · segnalazione P0 del 7/11)
-- Il caso: il maniscalco aveva già la scuderia tra i suoi clienti (scritta a mano), poi si collega su Equo
-- (invito della scuderia o richiesta sua) e nasceva una SECONDA scheda della stessa scuderia.
-- Dall'SQL 47 al momento di accettare l'invito gli si chiede se unirle; restavano scoperti:
--   a) l'invito della scuderia e la richiesta del maniscalco riusavano la scheda esistente solo se era già stata collegata prima;
--   b) la richiesta partita dal maniscalco non chiedeva mai di unire;
--   c) se il maniscalco rifiutava un invito su una scheda riusata, la scheda poteva essere cancellata;
--   d) lo spostamento di un cavallo poteva creare una scheda nuova anche se ne esisteva una scollegata della stessa scuderia.
-- Ora: se c'è UNA scheda che è sicuramente la stessa scuderia (già collegata prima, stesso nome esatto o stesso telefono)
-- si riusa quella, con i suoi cavalli e lavori. Se i nomi sono solo simili decide il maniscalco (scelta dell'SQL 47).

-- la scheda del maniscalco che è sicuramente quella scuderia (una sola, altrimenti null)
create or replace function equo_struttura_esistente(p_pro uuid, p_centro uuid) returns uuid
language plpgsql stable security definer set search_path = public as $$
declare v_id uuid; v_n int; ce record; v_tel text;
begin
  select id, nome, asd_nome, telefono into ce from centri where id = p_centro;
  if ce.id is null then return null; end if;
  v_tel := nullif(regexp_replace(coalesce(ce.telefono, ''), '\D', '', 'g'), '');
  if length(v_tel) < 8 then v_tel := null; end if;
  -- 1) era già collegata a questa scuderia
  select count(*), min(id::text)::uuid into v_n, v_id from clienti_mascalcia
   where maniscalco_id = p_pro and centro_id is null and archiviato_il is null and ex_centro_id = p_centro;
  if v_n = 1 then return v_id; end if;
  if v_n > 1 then return null; end if;
  -- 2) stesso nome (anche il nome dell'ASD), oppure stesso telefono
  select count(*), min(id::text)::uuid into v_n, v_id from clienti_mascalcia k
   where k.maniscalco_id = p_pro and k.centro_id is null and k.archiviato_il is null
     and k.cliente_user_id is null   -- mai un proprietario collegato con l'app
     and (equo_norm(k.nome) = equo_norm(ce.nome) or (ce.asd_nome is not null and equo_norm(k.nome) = equo_norm(ce.asd_nome))
          or (v_tel is not null and nullif(regexp_replace(coalesce(k.telefono, ''), '\D', '', 'g'), '') = v_tel));
  if v_n = 1 then return v_id; end if;
  return null;
end $$;
revoke all on function equo_struttura_esistente(uuid, uuid) from public, anon, authenticated;

do $$ declare v_def text; v_vecchio text;
begin
  -- a) invito della scuderia
  v_def := pg_get_functiondef('public.scuderia_aggiungi_maniscalco'::regproc);
  if position('equo_struttura_esistente' in v_def) = 0 then
    v_vecchio := 'select id into v_id from clienti_mascalcia where maniscalco_id = v_pro.id and centro_id is null and ex_centro_id = p_centro_id and archiviato_il is null order by created_at limit 1;';
    if position(v_vecchio in v_def) = 0 then raise exception 'SQL 51: scuderia_aggiungi_maniscalco non è come previsto, avvisa Claude.'; end if;
    execute replace(v_def, v_vecchio, 'v_id := equo_struttura_esistente(v_pro.id, p_centro_id);   -- SQL 51: riusa la scheda che il maniscalco ha già');
  end if;

  -- a/b) richiesta del maniscalco
  v_def := pg_get_functiondef('public.pro_richiedi_collegamento_struttura'::regproc);
  if position('equo_struttura_esistente' in v_def) = 0 then
    v_vecchio := 'select id into p_cliente_id from clienti_mascalcia where maniscalco_id = v_me and centro_id is null and ex_centro_id = v_centro.id and archiviato_il is null order by created_at limit 1;';
    if position(v_vecchio in v_def) = 0 then raise exception 'SQL 51: pro_richiedi_collegamento_struttura non è come previsto, avvisa Claude.'; end if;
    execute replace(v_def, v_vecchio, 'p_cliente_id := equo_struttura_esistente(v_me, v_centro.id);   -- SQL 51: riusa la scheda che ha già');
  end if;

  -- c) invito rifiutato: si cancella solo la scheda nata con l'invito, mai una scheda che il maniscalco aveva già
  v_def := pg_get_functiondef('public.pro_rispondi_collegamento_struttura'::regproc);
  if position('collegamento_il - interval' in v_def) = 0 then
    v_vecchio := 'elsif c.collegamento_origine = ''struttura'' and not exists (select 1 from interventi_mascalcia where cliente_mascalcia_id = c.id) then';
    if position(v_vecchio in v_def) = 0 then raise exception 'SQL 51: pro_rispondi_collegamento_struttura non è come previsto, avvisa Claude.'; end if;
    execute replace(v_def, v_vecchio, 'elsif c.collegamento_origine = ''struttura'' and not exists (select 1 from interventi_mascalcia where cliente_mascalcia_id = c.id)
        and c.created_at >= c.collegamento_il - interval ''1 minute''
        and not exists (select 1 from cavalli_clienti_mascalcia where cliente_mascalcia_id = c.id and scuderia_cavallo_id is null) then');
  end if;

  -- d) spostamento di un cavallo: prima la scheda collegata, poi quella che era collegata a quella scuderia
  v_def := pg_get_functiondef('public.equo_sposta_cavallo'::regproc);
  if position('ex_centro_id = v_dest_centro' in v_def) = 0 then
    v_vecchio := 'select id into v_cli from clienti_mascalcia where maniscalco_id = r.maniscalco_id and centro_id = v_dest_centro and archiviato_il is null limit 1;';
    if position(v_vecchio in v_def) = 0 then raise exception 'SQL 51: equo_sposta_cavallo non è come previsto, avvisa Claude.'; end if;
    execute replace(v_def, v_vecchio, 'select id into v_cli from clienti_mascalcia where maniscalco_id = r.maniscalco_id and (centro_id = v_dest_centro or ex_centro_id = v_dest_centro)
             and archiviato_il is null order by (centro_id is not null) desc limit 1;');
  end if;
end $$;

-- controllo: schede che sono sicuramente doppie oggi (stesso maniscalco, una collegata e una scritta a mano)
select equo_nome_profilo(c.maniscalco_id) as maniscalco, ce.nome as scuderia,
       k.nome as scheda_doppia, (select count(*) from cavalli_clienti_mascalcia v where v.cliente_mascalcia_id = k.id and v.archiviato_il is null) as cavalli_nella_doppia
  from clienti_mascalcia c join centri ce on ce.id = c.centro_id
  join clienti_mascalcia k on k.id = equo_struttura_esistente(c.maniscalco_id, c.centro_id)
 where c.centro_id is not null
 order by 1, 2;
