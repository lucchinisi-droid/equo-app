-- Equo · SQL 54 · QR intelligente, fase 3: «Da verificare» (9/11/2026)
-- I cavalli arrivati dal maniscalco (accettati dal proprietario o aggiunti dalla scuderia dalle sue proposte) possono avere
-- dati incompleti o imprecisi. Ora:
--   · il cavallo nasce «Da verificare» (badge) finché il proprietario o la scuderia non conferma i dati;
--   · la scheda mostra i campi che mancano e i dati in cui il maniscalco ha scritto qualcosa di diverso:
--     si sceglie «Usa questo» o «Tieni il mio», MAI una sovrascrittura in automatico;
--   · si vede da chi arriva il cavallo; i lavori restano del maniscalco che li ha fatti (nessun registro toccato).

alter table horses add column if not exists da_verificare boolean not null default false;
alter table horses add column if not exists dati_verificati_il timestamptz;
alter table horses add column if not exists differenze_ignorate jsonb not null default '{}'::jsonb;
alter table scuderia_cavalli add column if not exists da_verificare boolean not null default false;
alter table scuderia_cavalli add column if not exists dati_verificati_il timestamptz;
alter table scuderia_cavalli add column if not exists differenze_ignorate jsonb not null default '{}'::jsonb;

-- 1 · nasce «Da verificare» ------------------------------------------------------------------------------------
do $$ declare v_def text; v_vecchio text;
begin
  -- proprietario: cavallo creato dalla proposta del maniscalco
  v_def := pg_get_functiondef('public.equo_accetta_proposta_interno(uuid, uuid, uuid, boolean)'::regprocedure);
  if position('da_verificare' in v_def) = 0 then
    v_vecchio := 'update cavalli_clienti_mascalcia set horse_id = v_new where id = v_r.id;';
    if position(v_vecchio in v_def) = 0 then raise exception 'SQL 54: equo_accetta_proposta_interno non è come previsto, avvisa Claude.'; end if;
    execute replace(v_def, v_vecchio, v_vecchio || E'\n      update horses set da_verificare = true where id = v_new;   -- SQL 54');
  end if;
  -- scuderia: cavallo aggiunto dalle proposte del maniscalco
  v_def := pg_get_functiondef('public.scuderia_proposta_rispondi'::regproc);
  if position('da_verificare' in v_def) = 0 then
    v_vecchio := 'returning id, oltre_limite into v_scheda, v_oltre;';
    if position(v_vecchio in v_def) = 0 then raise exception 'SQL 54: scuderia_proposta_rispondi non è come previsto, avvisa Claude.'; end if;
    execute replace(v_def, v_vecchio, v_vecchio || E'\n    update scuderia_cavalli set da_verificare = true where id = v_scheda;   -- SQL 54');
  end if;
end $$;

-- cavalli già accettati dalle proposte e mai controllati (livello ancora provvisorio)
update horses h set da_verificare = true
 where h.codice_livello = 'provvisorio' and h.dati_verificati_il is null and not h.da_verificare
   and exists (select 1 from cavalli_proposte p where p.horse_id = h.id and p.stato = 'accettata')
   and exists (select 1 from cavalli_storico s where s.horse_id = h.id and s.tipo = 'collegamento' and s.descrizione like 'Cavallo preparato dal maniscalco%');

-- 2 · cosa manca e cosa è diverso -----------------------------------------------------------------------------
-- valore confrontabile (minuscole, senza spazi doppi; microchip solo cifre e lettere)
create or replace function equo_val_cmp(p_campo text, p text) returns text
language sql immutable as $$
  select case when p_campo = 'microchip' then nullif(upper(regexp_replace(coalesce(p, ''), '[^A-Za-z0-9]', '', 'g')), '')
              else nullif(lower(btrim(regexp_replace(coalesce(p, ''), '\s+', ' ', 'g'))), '') end
$$;

create or replace function equo_cavallo_verifica(p_horse uuid, p_sc uuid) returns json
language plpgsql stable security definer set search_path = public as $$
declare v jsonb; ign jsonb; vf boolean; vil timestamptz; mancano text[] := '{}'; diff jsonb := '[]'::jsonb; da jsonb; r record; k text; e text; f text[];
        campi text[][] := array[['razza', 'Razza'], ['microchip', 'Microchip'], ['mantello', 'Mantello'], ['sesso', 'Sesso']];
        mio text; anno int;
begin
  if p_horse is not null then
    select jsonb_build_object('razza', breed, 'microchip', microchip, 'mantello', mantello, 'sesso', sesso), extract(year from birth_date)::int, da_verificare, dati_verificati_il, differenze_ignorate
      into v, anno, vf, vil, ign from horses where id = p_horse and owner_id = auth.uid();
  else
    select jsonb_build_object('razza', razza, 'microchip', microchip, 'mantello', mantello, 'sesso', sesso), extract(year from data_nascita)::int, da_verificare, dati_verificati_il, differenze_ignorate
      into v, anno, vf, vil, ign from scuderia_cavalli where id = p_sc and is_member_of_centro(centro_id);
  end if;
  if v is null then return json_build_object('errore', 'Non autorizzato'); end if;
  if anno is null then mancano := mancano || 'Data di nascita'; end if;
  foreach f slice 1 in array campi loop
    if equo_val_cmp(f[1], v->>f[1]) is null then mancano := mancano || f[2]; end if;
  end loop;
  -- quello che hanno scritto i maniscalchi che seguono il cavallo
  for r in select cv.id, cv.razza, cv.microchip, cv.mantello, cv.sesso, cv.anno_nascita, equo_nome_profilo(cv.maniscalco_id) as chi
             from cavalli_clienti_mascalcia cv
            where cv.archiviato_il is null and ((p_horse is not null and cv.horse_id = p_horse) or (p_sc is not null and cv.scuderia_cavallo_id = p_sc)) loop
    foreach f slice 1 in array campi loop
      e := case f[1] when 'razza' then r.razza when 'microchip' then r.microchip when 'mantello' then r.mantello else r.sesso end;
      mio := v->>f[1];
      if equo_val_cmp(f[1], e) is null then continue; end if;
      if equo_val_cmp(f[1], mio) is distinct from equo_val_cmp(f[1], e)
         and coalesce(ign->>f[1], '') <> equo_val_cmp(f[1], e) then
        diff := diff || jsonb_build_object('campo', f[1], 'etichetta', f[2], 'tuo', mio, 'suo', e, 'chi', r.chi, 'manca', equo_val_cmp(f[1], mio) is null);
      end if;
    end loop;
    if r.anno_nascita is not null and anno is not null and r.anno_nascita <> anno and coalesce(ign->>'anno', '') <> r.anno_nascita::text then
      diff := diff || jsonb_build_object('campo', 'anno', 'etichetta', 'Anno di nascita', 'tuo', anno, 'suo', r.anno_nascita, 'chi', r.chi, 'solo_info', true);
    elsif r.anno_nascita is not null and anno is null then
      diff := diff || jsonb_build_object('campo', 'anno', 'etichetta', 'Anno di nascita', 'tuo', null, 'suo', r.anno_nascita, 'chi', r.chi, 'manca', true, 'solo_info', true);
    end if;
  end loop;
  select coalesce(jsonb_agg(distinct x), '[]'::jsonb) into da from (
    select equo_nome_profilo(cv.maniscalco_id) x from cavalli_clienti_mascalcia cv
     where (p_horse is not null and cv.horse_id = p_horse) or (p_sc is not null and cv.scuderia_cavallo_id = p_sc)) y where x is not null;
  return json_build_object('da_verificare', vf, 'verificato_il', vil, 'mancano', to_jsonb(mancano), 'differenze', diff, 'da', da);
end $$;
revoke all on function equo_cavallo_verifica(uuid, uuid) from public, anon;
grant execute on function equo_cavallo_verifica(uuid, uuid) to authenticated;

-- 3 · le scelte: usa il dato del maniscalco · tieni il mio · confermo i dati ---------------------------------------
create or replace function equo_cavallo_scelta(p_horse uuid, p_sc uuid, p_azione text, p_campo text default null, p_valore text default null)
returns json language plpgsql security definer set search_path = public as $$
declare v_centro uuid; v_chi text;
begin
  if p_horse is not null then
    if not exists (select 1 from horses where id = p_horse and owner_id = auth.uid()) then return json_build_object('ok', false, 'errore', 'Solo il proprietario può modificare il cavallo.'); end if;
  else
    select centro_id into v_centro from scuderia_cavalli where id = p_sc;
    if v_centro is null or not can_collegare_professionisti(v_centro) then return json_build_object('ok', false, 'errore', 'Solo l''amministratore o un membro di livello 2 o 3 può confermare i dati.'); end if;
  end if;
  v_chi := coalesce(equo_nome_profilo(auth.uid()), case when p_horse is not null then 'proprietario' else 'scuderia' end);
  if p_azione = 'conferma' then
    if p_horse is not null then update horses set da_verificare = false, dati_verificati_il = now() where id = p_horse;
    else update scuderia_cavalli set da_verificare = false, dati_verificati_il = now() where id = p_sc; end if;
    insert into cavalli_storico (codice_equo, horse_id, scuderia_cavallo_id, tipo, descrizione, autore_user_id, autore_ruolo, app)
    values ('', p_horse, p_sc, 'verifica', 'Dati del cavallo controllati e confermati da ' || v_chi, auth.uid(), case when p_horse is not null then 'proprietario' else 'scuderia' end, 'equo');
    return json_build_object('ok', true);
  end if;
  if p_campo not in ('razza', 'microchip', 'mantello', 'sesso', 'anno') then return json_build_object('ok', false, 'errore', 'Campo non valido.'); end if;
  if p_azione = 'tieni' then
    if p_horse is not null then update horses set differenze_ignorate = differenze_ignorate || jsonb_build_object(p_campo, case when p_campo = 'anno' then p_valore else equo_val_cmp(p_campo, p_valore) end) where id = p_horse;
    else update scuderia_cavalli set differenze_ignorate = differenze_ignorate || jsonb_build_object(p_campo, case when p_campo = 'anno' then p_valore else equo_val_cmp(p_campo, p_valore) end) where id = p_sc; end if;
    return json_build_object('ok', true);
  end if;
  if p_azione = 'usa' and p_campo <> 'anno' and nullif(btrim(coalesce(p_valore, '')), '') is not null then
    if p_horse is not null then
      update horses set breed = case when p_campo = 'razza' then btrim(p_valore) else breed end,
                        microchip = case when p_campo = 'microchip' then btrim(p_valore) else microchip end,
                        mantello = case when p_campo = 'mantello' then btrim(p_valore) else mantello end,
                        sesso = case when p_campo = 'sesso' then btrim(p_valore) else sesso end where id = p_horse;
    else
      update scuderia_cavalli set razza = case when p_campo = 'razza' then btrim(p_valore) else razza end,
                        microchip = case when p_campo = 'microchip' then btrim(p_valore) else microchip end,
                        mantello = case when p_campo = 'mantello' then btrim(p_valore) else mantello end,
                        sesso = case when p_campo = 'sesso' then btrim(p_valore) else sesso end where id = p_sc;
    end if;
    insert into cavalli_storico (codice_equo, horse_id, scuderia_cavallo_id, tipo, descrizione, autore_user_id, autore_ruolo, app)
    values ('', p_horse, p_sc, 'dato_maniscalco', initcap(p_campo) || ' preso dalla scheda del maniscalco: «' || btrim(p_valore) || '» (scelto da ' || v_chi || ')',
            auth.uid(), case when p_horse is not null then 'proprietario' else 'scuderia' end, 'equo');
    return json_build_object('ok', true);
  end if;
  return json_build_object('ok', false, 'errore', 'Azione non valida.');
end $$;
revoke all on function equo_cavallo_scelta(uuid, uuid, text, text, text) from public, anon;
grant execute on function equo_cavallo_scelta(uuid, uuid, text, text, text) to authenticated;

select (select count(*) from horses where da_verificare) as cavalli_proprietari_da_verificare,
       position('da_verificare' in pg_get_functiondef('public.scuderia_proposta_rispondi'::regproc)) > 0 as scuderia_ok,
       exists (select 1 from pg_proc where proname = 'equo_cavallo_scelta') as scelte_ok;
