-- Equo: caso Daniela Cipollina / Nusi (11/11/2026). Rieseguibile (se è già fatto non cambia nulla).
-- Francesco Bizzarri voleva passare Nusi a Daniela (iscritta oggi, codice EQUOOWN8TFQ6). Nusi stava nella scheda
-- «Scuderia Macchia grande» senza proprietario; Daniela aveva creato da sola il suo «NUSI» (PRV-000645).
-- Si fa con le stesse funzioni dell'app, come se Francesco e Daniela avessero toccato i tasti:
--   1) cliente «Daniela Cipollina» tra i clienti di Francesco;
--   2) «Assegna proprietario»: Nusi passa a Daniela, resta a Macchia grande (in «Qui stanno»), paga Daniela;
--   3) collegamento con il codice di Daniela (lei riceve in chat «Ti ho aggiunto come mio cliente»);
--   4) la proposta di Nusi accettata scegliendo il suo «NUSI»: un solo cavallo, con le 2 ferrature nel libretto.
-- I 2 lavori già fatti di Nusi (1/10 e 11/11) sono saldati: restano come sono.

do $fix$
declare
  v_man  uuid := 'f170bc74-a189-4d68-bab5-31d9613726bb';   -- Francesco Bizzarri
  v_dan  uuid := '9d4a87d6-bcc3-47c3-81c2-fad78f81b12f';   -- Daniela Cipollina
  v_nusi uuid := '73ca65c3-142f-4e02-aff6-3df6cd10bbcc';   -- Nusi nella scheda di Francesco
  v_hdan uuid := '8ea7e27d-2797-411a-a77f-010f53baebe0';   -- NUSI creato da Daniela
  v_cli uuid; v_prop uuid; r json; rj jsonb; v_cod text;
begin
  -- come Francesco
  perform set_config('request.jwt.claims', json_build_object('sub', v_man, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', v_man::text, true);

  -- 1) cliente Daniela (se c'è già, si usa quello)
  select id into v_cli from clienti_mascalcia
   where maniscalco_id = v_man and archiviato_il is null and (cliente_user_id = v_dan or lower(trim(nome)) = 'daniela cipollina')
   order by (cliente_user_id = v_dan) desc nulls last limit 1;
  if v_cli is null then
    -- codice invito come lo crea l'app (EQUO + 5 caratteri senza O, I, L), mai uguale a uno esistente
    loop
      v_cod := 'EQUO' || (select string_agg(substr('0123456789ABCDEFGHJKMNPQRSTUVWXYZ', 1 + floor(random() * 33)::int, 1), '') from generate_series(1, 5));
      exit when not exists (select 1 from clienti_mascalcia where equo_norm_codice(codice_invito) = v_cod);
    end loop;
    insert into clienti_mascalcia (maniscalco_id, nome, tipo_cliente, codice_invito) values (v_man, 'Daniela Cipollina', 'proprietario', v_cod) returning id into v_cli;
  end if;

  -- 2) Nusi a Daniela (resta dove sta), i lavori futuri a lei; paga il proprietario
  if (select cliente_mascalcia_id from cavalli_clienti_mascalcia where id = v_nusi) <> v_cli then
    rj := pro_cambia_proprietario(array[v_nusi], v_cli, true);
    if not coalesce((rj->>'ok')::boolean, false) then raise exception 'Cambia proprietario: %', rj; end if;
  end if;
  update cavalli_clienti_mascalcia set chi_paga = 'proprietario' where id = v_nusi and chi_paga is distinct from 'proprietario';

  -- 3) collegamento con il codice di Daniela (crea la proposta di Nusi per lei)
  if (select cliente_user_id from clienti_mascalcia where id = v_cli) is null then
    r := collega_cliente_mascalcia_da_codice(v_cli, 'EQUOOWN8TFQ6');
    if not coalesce((r->>'ok')::boolean, false) then raise exception 'Collegamento: %', r; end if;
  end if;

  -- 4) come Daniela: «è il mio NUSI»
  if (select horse_id from cavalli_clienti_mascalcia where id = v_nusi) is null then
    select id into v_prop from cavalli_proposte where riga_id = v_nusi and owner_id = v_dan and stato = 'in_attesa' order by created_at desc limit 1;
    if v_prop is null then raise exception 'Proposta di Nusi per Daniela non trovata'; end if;
    perform set_config('request.jwt.claims', json_build_object('sub', v_dan, 'role', 'authenticated')::text, true);
    perform set_config('request.jwt.claim.sub', v_dan::text, true);
    r := equo_accetta_proposta_interno(v_prop, v_dan, v_hdan, false);
    if not coalesce((r->>'ok')::boolean, false) then raise exception 'Accetta proposta: %', r; end if;
  end if;
end $fix$;

-- controllo: Nusi di Daniela, collegato al suo cavallo, paga il proprietario, resta a Macchia grande
select cv.nome, c.nome as proprietario, c.cliente_user_id is not null as collegata, cv.horse_id = '8ea7e27d-2797-411a-a77f-010f53baebe0' as suo_nusi,
       cv.chi_paga, cv.ubicazione_nome as sta_in,
       (select count(*) from health_events he where he.horse_id = '8ea7e27d-2797-411a-a77f-010f53baebe0' and he.type = 'ferratura') as ferrature_nel_libretto
  from cavalli_clienti_mascalcia cv join clienti_mascalcia c on c.id = cv.cliente_mascalcia_id
 where cv.id = '73ca65c3-142f-4e02-aff6-3df6cd10bbcc';
