-- 21/10/2026 CORREZIONE: l'allenatore non riusciva a creare una seduta ("new row violates row-level security policy for table sedute").
-- La regola di lettura chiedeva a equo_vede_seduta(id) se la seduta e visibile, ma durante l'inserimento la funzione
-- non vede ancora la riga appena creata. Ora l'autore la vede sempre direttamente. Nessuna seduta e mai stata salvata prima.
alter policy sedute_sel on public.sedute using (trainer_id = auth.uid() or public.equo_vede_seduta(id));
