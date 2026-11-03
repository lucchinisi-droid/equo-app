-- Equo: SICUREZZA FUNZIONI (3 novembre 2026) · Fase 0 del piano di lavoro Scuderia
-- 1) Toglie a chi NON ha fatto l'accesso (ruolo anon, e PUBLIC da cui anon eredita) il permesso di eseguire:
--    a) tutte le funzioni trigger SECURITY DEFINER dello schema public (i trigger scattano lo stesso:
--       il permesso EXECUTE non viene controllato quando un trigger parte);
--    b) 11 funzioni di servizio mai chiamate dalle app (solo da altre funzioni, dal cron o da nessuno).
--    Gli utenti con accesso (authenticated) e service_role mantengono il permesso.
--    Restano aperte a anon, di proposito: groom_* (app Groom con token e PIN), equo_referral_info, promo_posti,
--    e le funzioni usate dalle regole di accesso (RLS).
-- 2) Fissa search_path = public sulle 24 funzioni che non lo avevano (avviso function_search_path_mutable).
-- Rieseguibile. Il controllo finale deve dare 0 · 0.

do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as f
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.prosecdef
       and has_function_privilege('anon', p.oid, 'EXECUTE')
       and (p.prorettype = 'trigger'::regtype
            or p.proname in ('equo_doc_centro','equo_doc_decide','equo_doc_horse','equo_doc_owner','equo_luogo_riga',
                             'equo_descr_intervento_libretto','equo_premium_pro','vocali_free_oggi',
                             'equo_scade_premium_referral','box_limite','nome_pacchetto_superiore'))
  loop
    execute format('revoke execute on function %s from public, anon', r.f);
    execute format('grant execute on function %s to authenticated, service_role', r.f);
  end loop;

  for r in
    select p.oid::regprocedure as f
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.prokind = 'f'
       and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c where c like 'search_path=%')
       and p.oid not in (select objid from pg_depend where deptype = 'e')
  loop
    execute format('alter function %s set search_path = public', r.f);
  end loop;
end $$;

-- controllo finale: deve dare 0 · 0
select
  (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prosecdef and p.prorettype = 'trigger'::regtype
      and has_function_privilege('anon', p.oid, 'EXECUTE')) as trigger_aperti_a_anon,
  (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prokind = 'f'
      and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c where c like 'search_path=%')
      and p.oid not in (select objid from pg_depend where deptype = 'e')) as senza_search_path;
