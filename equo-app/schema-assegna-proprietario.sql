-- Equo: «Proprietari dei cavalli» diventa «+ Assegna proprietario a cavallo» (28 ottobre 2026). Eseguito da Claude. Rieseguibile.

-- guida di Hammer
update public.ai_conoscenze set aggiornato_il = now(), verificato_il = current_date,
  titolo = 'Assegna proprietario a cavallo in scuderia (chi paga)',
  contenuto = $t$Dove: "Clienti" → apri la scuderia → tasto "+ Assegna proprietario a cavallo"; oppure scheda del cavallo → "Proprietario" → "Cambia"
Passi:
1. Scegli i cavalli ("Quali cavalli?"): puoi sceglierne più di uno insieme.
2. In "Proprietario (chi paga)" scrivi nella ricerca con la lente il nome del proprietario, di un suo cavallo o il telefono e tocca il nome; con la ✕ lo cambi. In cima c'è "+ Nuovo proprietario" (nome e telefono).
3. Se ci sono lavori già fatti e da saldare, l'app chiede chi li paga: il nuovo proprietario o la scuderia.
4. Tocca "Conferma".
Esempio: Al Centro Le Querce tre cavalli sono di Mario Rossi: Francesco tocca "+ Assegna proprietario a cavallo", spunta i tre cavalli, scrive «ross» e tocca Mario Rossi: da ora i conti di quei cavalli vanno a Mario.
Note: Il cavallo resta dove sta (nella scuderia, in "Qui stanno"): cambia solo chi paga. Gli appuntamenti futuri passano al nuovo proprietario. Un cavallo collegato al suo proprietario su Equo non si cambia da qui. Prima il tasto si chiamava "Proprietari dei cavalli".
Parole chiave: assegna proprietario, cambia proprietario, intestare, chi paga, proprietario cavallo, scuderia, proprietari dei cavalli, pagante, cerca proprietario$t$
 where id = 'ebd9a797-2fc6-42bb-a572-0a1588b6c291';

-- promemoria settimanale di Hammer sui cavalli doppi (SQL 19)
do $$
declare v_def text;
begin
  v_def := pg_get_functiondef('public.equo_solleciti_onboarding'::regproc);
  if position('«Proprietari dei cavalli»' in v_def) > 0 then
    execute replace(v_def, 'dalla scuderia usa «Proprietari dei cavalli»', 'dalla scuderia usa «+ Assegna proprietario a cavallo»');
  end if;
end $$;

-- controllo: deve dare 1 · 0
select (select count(*) from ai_conoscenze where titolo = 'Assegna proprietario a cavallo in scuderia (chi paga)') as guida,
       (select count(*) from pg_proc where proname = 'equo_solleciti_onboarding' and prosrc like '%«Proprietari dei cavalli»%') as testo_vecchio;
