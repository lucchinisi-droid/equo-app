-- Equo · SQL 57 · Avvisi sugli eventi sanitari solo al professionista giusto, con l'icona giusta (10/11/2026)
-- Problema (Francesco Bizzarri): quando Giulius Caesar registrava vaccino, Coggins, sverminazione o ferratura di un
-- cavallo, TUTTI i professionisti del cavallo ricevevano «🩺 … ha registrato …», maniscalco compreso, e anche la
-- ferratura arrivava con lo stetoscopio. Stessa cosa quando registra il proprietario dalla sua app.
-- Ora:
--   · al maniscalco arrivano solo ferratura / pareggio / lavori agli zoccoli, con 🔨;
--   · al veterinario arriva tutto il resto (vaccino, Coggins, sverminazione, altro), con 🩺;
--   · i testi e le altre regole restano come prima.

create or replace function equo_avvisa_pro_evento(p_horse uuid, p_scheda uuid, p_tipo text, p_tipo_altro text, p_testo text, p_escludi uuid)
returns void language plpgsql security definer set search_path = public as $$
declare r record; v_mascalcia boolean;
begin
  v_mascalcia := p_tipo in ('ferratura', 'pareggio', 'mezza_ferratura')
                 or (p_tipo = 'altro' and coalesce(p_tipo_altro, '') ~* '(ferr|pareg|zocc|piede|piedi)');
  for r in
    select distinct on (cv.maniscalco_id) cv.maniscalco_id, cv.cliente_mascalcia_id,
           coalesce(nullif(cv.professione, ''), equo_professione(cv.maniscalco_id), 'maniscalco') as professione
      from cavalli_clienti_mascalcia cv
     where cv.maniscalco_id is distinct from p_escludi and cv.archiviato_il is null
       and ((p_horse is not null and cv.horse_id = p_horse) or (p_scheda is not null and cv.scuderia_cavallo_id = p_scheda))
     order by cv.maniscalco_id
  loop
    if (r.professione = 'veterinario') = v_mascalcia then continue; end if;   -- ognuno riceve solo la sua materia
    perform set_config('equo.collegamento', 'on', true);
    insert into messaggi_mascalcia (maniscalco_id, cliente_mascalcia_id, mittente_tipo, tipo, testo, letto)
    values (r.maniscalco_id, r.cliente_mascalcia_id, 'cliente', 'testo', case when v_mascalcia then '🔨 ' else '🩺 ' end || p_testo, false);
    perform set_config('equo.collegamento', '', true);
  end loop;
end $$;
revoke all on function equo_avvisa_pro_evento(uuid, uuid, text, text, text, uuid) from public, anon, authenticated;

do $$ declare v_def text; a text; b text;
begin
  -- dalla scuderia
  v_def := pg_get_functiondef('public.scuderia_eventi_registro_comune()'::regprocedure);
  if position('equo_avvisa_pro_evento' in v_def) = 0 then
    a := 'perform equo_avvisa_maniscalchi_cavallo(v_horse, new.cavallo_id,' || E'\n' || '      ''🩺 '' || coalesce(v_sc.nome, ''Cavallo'')';
    if position(a in v_def) = 0 then raise exception 'SQL 57: scuderia_eventi_registro_comune non è come previsto, avvisa Claude.'; end if;
    execute replace(v_def, a, 'perform equo_avvisa_pro_evento(v_horse, new.cavallo_id, new.tipo, new.tipo_altro,' || E'\n' || '      coalesce(v_sc.nome, ''Cavallo'')');
  end if;
  -- dal proprietario
  v_def := pg_get_functiondef('public.health_events_registro_comune()'::regprocedure);
  if position('equo_avvisa_pro_evento' in v_def) = 0 then
    a := 'v_testo := ''🩺 '' || v_h.name || '': il proprietario ha registrato '' || v_cosa || ''.'';';
    b := 'perform equo_avvisa_maniscalchi_cavallo(new.horse_id, null, v_testo, auth.uid());';
    if position(a in v_def) = 0 or position(b in v_def) = 0 then raise exception 'SQL 57: health_events_registro_comune non è come previsto, avvisa Claude.'; end if;
    v_def := replace(v_def, a, 'v_testo := v_h.name || '': il proprietario ha registrato '' || v_cosa || ''.'';');
    v_def := replace(v_def, b, 'perform equo_avvisa_pro_evento(new.horse_id, null, new.type, null, v_testo, auth.uid());');
    execute v_def;
  end if;
end $$;

select position('equo_avvisa_pro_evento' in pg_get_functiondef('public.scuderia_eventi_registro_comune()'::regprocedure)) > 0 as scuderia_ok,
       position('equo_avvisa_pro_evento' in pg_get_functiondef('public.health_events_registro_comune()'::regprocedure)) > 0 as proprietario_ok;
