-- CORREZIONE URGENTE: la regola di lettura dei file "cavalli-allegati" leggeva la tabella cavalli_allegati,
-- che ai proprietari e chiusa. Ogni lettura dall'archivio file andava in errore "permission denied" (foto del Diario, album, allegati).
-- Soluzione: la regola chiede il permesso a una funzione protetta invece di leggere la tabella.

create or replace function public.equo_allegato_path_visibile(p_path text) returns boolean
language sql stable security definer set search_path to 'public' as $fn$
  select exists (select 1 from cavalli_allegati a where a.path = p_path and equo_allegato_visibile(a.id))
$fn$;
revoke all on function public.equo_allegato_path_visibile(text) from public, anon;
grant execute on function public.equo_allegato_path_visibile(text) to authenticated;

drop policy if exists cavalli_allegati_leggi on storage.objects;
create policy cavalli_allegati_leggi on storage.objects for select to authenticated
  using (bucket_id = 'cavalli-allegati' and ((storage.foldername(name))[1] = auth.uid()::text or public.equo_allegato_path_visibile(name)));
