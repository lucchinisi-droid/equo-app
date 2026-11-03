-- Equo: numero di ferri sempre scritto nei lavori (03/11/2026, per tutti i maniscalchi). Rieseguibile.
-- Prima: i lavori importati dalle foto (24/10) e alcuni vecchi non avevano il numero di ferri, quindi nel
-- resoconto, nel conto e in agenda comparivano come «Ferratura» invece di «Ferratura · 4 ferri».
-- 1) Lavori già scritti senza numero: ferratura = 4 ferri, mezza ferratura = 2 ferri.
--    Controllato il 03/11: cambiando solo il numero di ferri nessun avviso automatico parte
--    (niente notifiche a clienti o scuderie, niente eventi nuovi nel libretto, niente «modifica» sugli appuntamenti).
-- 2) Da adesso in poi: se un lavoro di ferratura arriva senza numero, il database mette 4 (o 2 per la mezza).
--    Il ferro correttivo (davanti, dietro, pad, binda larga…) era già copiato dalla scheda del cavallo e resta così.

update public.interventi_mascalcia
   set quantita_ferri = case when tipo_ferratura = 'mezza_ferratura' then 2 else 4 end
 where tipo_ferratura in ('ferratura', 'mezza_ferratura') and quantita_ferri is null;

create or replace function public.interventi_ferro_da_scheda()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
declare cv record;
begin
  if tg_op = 'UPDATE' and new.stato = 'fatto' then return new; end if;
  if new.tipo_ferratura not in ('ferratura','mezza_ferratura') then return new; end if;
  if new.cavallo_cliente_id is not null then
    select ferro_sistema, ferro_numero, ferratura_tipo, ferro_tipo, ferro_tipo_post, ferro_note, ferro_dettagli, ferro_dettagli_post into cv
      from cavalli_clienti_mascalcia where id = new.cavallo_cliente_id;
    if found then
      if tg_op = 'INSERT' and new.tipo_ferratura = 'ferratura' and auth.uid() = new.maniscalco_id then
        if cv.ferratura_tipo = 'mezza' then new.tipo_ferratura := 'mezza_ferratura';
        elsif cv.ferratura_tipo = 'pareggio' then new.tipo_ferratura := 'pareggio'; new.quantita_ferri := null; return new;
        end if;
      end if;
      if new.numero_ferro is null and cv.ferro_numero is not null then
        new.numero_ferro := cv.ferro_numero;
        new.misura_sistema := coalesce(cv.ferro_sistema, 'italiana');
      end if;
      if new.ferro_tipo is null then
        new.ferro_tipo := case
          when new.tipo_ferratura = 'ferratura' and cv.ferro_tipo_post is not null and cv.ferro_tipo_post <> cv.ferro_tipo
            then case when cv.ferro_tipo = 'correttivo' then 'corr_davanti' else 'corr_dietro' end
          else cv.ferro_tipo end;
        new.ferro_note := equo_testo_ferro_dettagli(cv.ferro_dettagli,
          case when new.tipo_ferratura = 'ferratura' then cv.ferro_dettagli_post end, cv.ferro_note);
      end if;
    end if;
  end if;
  -- 03/11/2026: il numero di ferri non manca mai
  if new.quantita_ferri is null then
    new.quantita_ferri := case when new.tipo_ferratura = 'mezza_ferratura' then 2 else 4 end;
  end if;
  return new;
end $function$;

-- controllo: deve dare 0 (nessuna ferratura senza numero di ferri)
select count(*) as senza_numero from public.interventi_mascalcia
 where tipo_ferratura in ('ferratura', 'mezza_ferratura') and quantita_ferri is null;
