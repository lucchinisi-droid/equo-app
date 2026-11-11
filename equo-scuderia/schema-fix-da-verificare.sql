-- Equo · SQL 61 · Correzione: il riquadro «Da verificare» andava in errore sui cavalli con dati mancanti (11/11/2026)
-- In equo_cavallo_verifica (SQL 54) «mancano || 'testo'» veniva letto come un array e la funzione si fermava con
-- «malformed array literal». Ora si usa array_append. Nessun dato toccato.
do $$ declare v_def text;
begin
  v_def := pg_get_functiondef('public.equo_cavallo_verifica(uuid, uuid)'::regprocedure);
  if position('mancano := mancano || ''Data di nascita'';' in v_def) = 0 or position('mancano := mancano || f[2];' in v_def) = 0 then
    raise exception 'SQL 61: equo_cavallo_verifica non è come previsto, avvisa Claude.';
  end if;
  v_def := replace(v_def, 'mancano := mancano || ''Data di nascita'';', 'mancano := array_append(mancano, ''Data di nascita'');');
  v_def := replace(v_def, 'mancano := mancano || f[2];', 'mancano := array_append(mancano, f[2]);');
  execute v_def;
end $$;
select position('array_append' in pg_get_functiondef('public.equo_cavallo_verifica(uuid, uuid)'::regprocedure)) > 0 as corretta;
