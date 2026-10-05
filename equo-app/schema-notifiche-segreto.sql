-- Le notifiche (iscrizioni, certificazione, ticket, segnalazioni, richieste di contatto) ora richiedono
-- lo stesso segreto già usato dai webhook della chat. Questo script lo copia dal webhook della chat
-- (così il segreto non compare mai in chiaro) e lo aggiunge ai webhook delle notifiche.
do $$
declare
  segreto text; r record; def text; nuovo text; n int := 0;
begin
  select (regexp_match(pg_get_triggerdef(t.oid), '"x-webhook-secret"\s*:\s*"([^"]+)"'))[1] into segreto
    from pg_trigger t where t.tgname = 'notify-chat-scuderia' limit 1;
  if segreto is null then raise exception 'Segreto della chat non trovato: nessuna modifica fatta.'; end if;
  for r in
    select t.oid, t.tgname, t.tgrelid::regclass::text as tabella
      from pg_trigger t join pg_proc p on p.oid = t.tgfoid
     where not t.tgisinternal and p.proname = 'http_request'
       and pg_get_triggerdef(t.oid) like '%/.netlify/functions/notify-%'
       and pg_get_triggerdef(t.oid) not like '%x-webhook-secret%'
  loop
    def := pg_get_triggerdef(r.oid);
    nuovo := replace(def, '''{"Content-Type":"application/json"}''',
                     '''{"Content-Type":"application/json","x-webhook-secret":"' || segreto || '"}''');
    if nuovo = def then raise notice 'Saltato (intestazioni diverse): %', r.tgname; continue; end if;
    execute format('drop trigger %I on %s', r.tgname, r.tabella);
    execute nuovo;
    n := n + 1;
  end loop;
  raise notice 'Webhook aggiornati: %', n;
end $$;

select t.tgname as webhook, (pg_get_triggerdef(t.oid) like '%x-webhook-secret%') as con_segreto
from pg_trigger t join pg_proc p on p.oid = t.tgfoid
where not t.tgisinternal and p.proname = 'http_request' order by 1;
