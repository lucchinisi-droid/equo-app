-- Equo: CAVALLI PROPOSTI DAL MANISCALCO · ARRIVANO CON TUTTI I LAVORI (27 ottobre 2026)
-- Il cliente si collega con il QR/invito del maniscalco e accetta i cavalli che il maniscalco aveva preparato.
-- Prima: il cavallo nasceva nel suo account ma i lavori già fatti restavano sulla scheda del maniscalco.
-- Ora: accettando, tutti i lavori di quella scheda passano al cavallo del proprietario; le ferrature, mezze ferrature
-- e pareggi già fatti entrano da soli nel libretto (trigger interventi_registra_nel_libretto), con data e prossima scadenza.
-- In più: «Accetta tutti» (equo_accetta_tutti_proposti) e un messaggio di riepilogo nella chat col maniscalco.
-- Rieseguibile.

-- 1) accettazione di una proposta (interna: la usano «Accetta» e «Accetta tutti»)
create or replace function public.equo_accetta_proposta_interno(p_proposta uuid, p_uid uuid)
returns json language plpgsql security definer set search_path = public as $$
declare v_p cavalli_proposte; v_r cavalli_clienti_mascalcia; v_h horses; v_new uuid; v_horse uuid; v_come text;
        v_lavori int := 0; v_libretto int := 0; v_dal date;
begin
  select * into v_p from cavalli_proposte p where p.id = p_proposta and p.owner_id = p_uid and p.stato = 'in_attesa';
  if v_p.id is null then return json_build_object('ok', false, 'motivo', 'proposta_non_trovata'); end if;
  select * into v_r from cavalli_clienti_mascalcia cv where cv.id = v_p.riga_id;
  if v_r.id is null then return json_build_object('ok', false, 'motivo', 'scheda_non_trovata'); end if;

  if v_r.horse_id is not null then
    v_horse := v_r.horse_id; v_come := 'gia_collegata';
  else
    select h.* into v_h from horses h
     where h.owner_id = p_uid and h.condiviso_ecosistema is true and equo_norm_nome(h.name) = equo_norm_nome(v_r.nome)
     order by h.created_at limit 1;
    if v_h.id is not null then
      update cavalli_clienti_mascalcia set horse_id = v_h.id, nome = v_h.name,
        microchip = coalesce(nullif(microchip, ''), v_h.microchip) where id = v_r.id;
      perform equo_unifica_numero_cavallo(v_h.id, array[v_r.equo_numero]);
      v_horse := v_h.id; v_come := 'collegato_esistente';
    else
      begin
        insert into horses (owner_id, name, breed, microchip, equo_numero)
        values (p_uid, v_r.nome, nullif(trim(coalesce(v_r.razza, '')), ''), nullif(trim(coalesce(v_r.microchip, '')), ''), v_r.equo_numero)
        returning id into v_new;
      exception when others then
        if sqlerrm like 'LIMITE_CAVALLI_FREE%' then
          return json_build_object('ok', false, 'motivo', 'limite_cavalli_free');
        end if;
        raise;
      end;
      update cavalli_clienti_mascalcia set horse_id = v_new where id = v_r.id;
      v_horse := v_new; v_come := 'creato';
    end if;
    insert into cavalli_storico (codice_equo, horse_id, cavallo_cliente_id, tipo, descrizione, autore_user_id, autore_ruolo, app)
    select cv.codice_equo, v_horse, cv.id, 'collegamento',
      'Cavallo preparato dal maniscalco (' || cv.nome || ') e accettato dal proprietario: stessa scheda, nessun doppione',
      p_uid, 'proprietario', 'app' from cavalli_clienti_mascalcia cv where cv.id = v_r.id;
  end if;

  -- i lavori della scheda (già fatti e in agenda) passano al cavallo del proprietario: quelli fatti entrano nel libretto
  update interventi_mascalcia set horse_id = v_horse
   where cavallo_cliente_id = v_r.id and horse_id is distinct from v_horse;
  select count(*) filter (where stato = 'fatto'), count(*) filter (where health_event_id is not null), min(data_intervento) filter (where stato = 'fatto')
    into v_lavori, v_libretto, v_dal
    from interventi_mascalcia where cavallo_cliente_id = v_r.id;

  update cavalli_proposte set stato = 'accettata', horse_id = v_horse, risposto_il = now() where id = v_p.id;
  return json_build_object('ok', true, 'horse_id', v_horse, 'esito', v_come,
    'codice', (select h.codice_equo from horses h where h.id = v_horse),
    'nome', (select h.name from horses h where h.id = v_horse),
    'lavori', v_lavori, 'nel_libretto', v_libretto, 'dal', v_dal,
    'maniscalco_id', v_p.maniscalco_id, 'cliente_mascalcia_id', v_p.cliente_mascalcia_id);
end $$;
revoke all on function public.equo_accetta_proposta_interno(uuid, uuid) from public, anon, authenticated;

-- 2) messaggio di riepilogo nella chat col maniscalco
create or replace function public.equo_msg_cavalli_accettati(p_maniscalco uuid, p_cliente uuid, p_nomi text[], p_lavori int, p_libretto int, p_dal date)
returns void language plpgsql security definer set search_path = public as $$
declare n int := coalesce(array_length(p_nomi, 1), 0);
begin
  if n = 0 then return; end if;
  perform set_config('equo.collegamento', 'on', true);
  insert into messaggi_mascalcia (maniscalco_id, cliente_mascalcia_id, mittente_tipo, mittente_user_id, tipo, testo, letto)
  values (p_maniscalco, p_cliente, 'maniscalco', p_maniscalco, 'testo',
    '📘 Equo: ' || case when n = 1 then p_nomi[1] || ' è nel tuo account' else n || ' cavalli sono nel tuo account (' || array_to_string(p_nomi, ', ') || ')' end
    || case when coalesce(p_lavori, 0) > 0
         then ' con ' || p_lavori || case when p_lavori = 1 then ' lavoro già fatto' else ' lavori già fatti' end
              || case when p_dal is not null then ' dal ' || to_char(p_dal, 'DD/MM/YYYY') else '' end
              || case when coalesce(p_libretto, 0) > 0 then '; ' || p_libretto || case when p_libretto = 1 then ' è nel libretto' else ' sono nel libretto' end else '' end
         else ': da qui in poi ogni lavoro finisce nel suo libretto' end || '.', false);
  perform set_config('equo.collegamento', '', true);
end $$;
revoke all on function public.equo_msg_cavalli_accettati(uuid, uuid, text[], int, int, date) from public, anon, authenticated;

-- 3) «Accetta» (uno) e «Accetta tutti»
create or replace function public.equo_accetta_cavallo_proposto(p_proposta uuid)
returns json language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); r json;
begin
  if v_uid is null then return json_build_object('ok', false, 'motivo', 'non_autenticato'); end if;
  r := equo_accetta_proposta_interno(p_proposta, v_uid);
  if (r->>'ok')::boolean then
    perform equo_msg_cavalli_accettati((r->>'maniscalco_id')::uuid, (r->>'cliente_mascalcia_id')::uuid, array[r->>'nome'],
      (r->>'lavori')::int, (r->>'nel_libretto')::int, (r->>'dal')::date);
  end if;
  return r;
end $$;
revoke all on function public.equo_accetta_cavallo_proposto(uuid) from public, anon;
grant execute on function public.equo_accetta_cavallo_proposto(uuid) to authenticated;

create or replace function public.equo_accetta_tutti_proposti()
returns json language plpgsql security definer set search_path = public as $$
declare v_uid uuid := auth.uid(); p record; r json; v_ok int := 0; v_lavori int := 0; v_libretto int := 0; v_limite boolean := false; g record;
        v_acc jsonb := '[]'::jsonb;
begin
  if v_uid is null then return json_build_object('ok', false, 'motivo', 'non_autenticato'); end if;
  for p in select id from cavalli_proposte where owner_id = v_uid and stato = 'in_attesa' order by created_at loop
    r := equo_accetta_proposta_interno(p.id, v_uid);
    if (r->>'ok')::boolean then
      v_ok := v_ok + 1; v_lavori := v_lavori + (r->>'lavori')::int; v_libretto := v_libretto + (r->>'nel_libretto')::int;
      v_acc := v_acc || jsonb_build_array(r::jsonb);
    elsif r->>'motivo' = 'limite_cavalli_free' then
      v_limite := true; exit;
    end if;
  end loop;
  -- un solo messaggio per maniscalco
  for g in select (x->>'maniscalco_id')::uuid as maniscalco_id, (x->>'cliente_mascalcia_id')::uuid as cliente_id, array_agg(x->>'nome' order by x->>'nome') as nomi,
                  sum((x->>'lavori')::int)::int as lavori, sum((x->>'nel_libretto')::int)::int as libretto, min((x->>'dal')::date) as dal
             from jsonb_array_elements(v_acc) x group by 1, 2 loop
    perform equo_msg_cavalli_accettati(g.maniscalco_id, g.cliente_id, g.nomi, g.lavori, g.libretto, g.dal);
  end loop;
  return json_build_object('ok', true, 'accettati', v_ok, 'lavori', v_lavori, 'nel_libretto', v_libretto, 'limite', v_limite,
    'rimasti', (select count(*) from cavalli_proposte where owner_id = v_uid and stato = 'in_attesa'));
end $$;
revoke all on function public.equo_accetta_tutti_proposti() from public, anon;
grant execute on function public.equo_accetta_tutti_proposti() to authenticated;

-- 4) allineamento: schede già collegate a un cavallo con lavori rimasti senza cavallo (al 27/10: 1 lavoro)
update public.interventi_mascalcia i set horse_id = cv.horse_id
  from public.cavalli_clienti_mascalcia cv
 where cv.id = i.cavallo_cliente_id and cv.horse_id is not null and i.horse_id is null;

-- 5) guida degli agenti AI
insert into public.ai_conoscenze (ambito, categoria, attivo, titolo, contenuto, aggiornato_il, verificato_il)
select 'proprietario', 'guida', true, 'Cavalli preparati dal maniscalco: accettarli con tutti i lavori',
'Dove: Home → riquadro dei cavalli proposti (dopo il collegamento col maniscalco, anche dal QR della scheda cliente)
Passi:
1. Collegati al maniscalco con il suo QR o invito: i cavalli che ha già registrato per te compaiono come proposte.
2. Tocca "Accetta" su un cavallo o "Accetta tutti": il cavallo nasce nel tuo account con lo stesso codice della scheda del maniscalco.
3. Tutti i lavori già fatti dal maniscalco su quel cavallo passano a te: ferrature, mezze ferrature e pareggi entrano nel libretto con data e prossima scadenza.
4. Nella chat col maniscalco arriva il riepilogo: quanti cavalli, quanti lavori e da quando.
5. Se un cavallo non è tuo tocca "Non è mio".
Esempio: Marco inquadra il QR di Luca, accetta Furia e Stella con "Accetta tutti" e trova 12 lavori dal 2025 nel libretto.
Note: Con il piano Free puoi avere un cavallo: gli altri restano in attesa finché non passi a Premium. Se avevi già un cavallo con lo stesso nome, la scheda si collega a quello senza doppioni.
Parole chiave: cavalli proposti, accetta cavallo, accetta tutti, storico maniscalco, lavori passati, libretto, collegamento maniscalco, qr maniscalco',
now(), current_date
where not exists (select 1 from public.ai_conoscenze where titolo = 'Cavalli preparati dal maniscalco: accettarli con tutti i lavori');

insert into public.ai_conoscenze (ambito, categoria, attivo, titolo, contenuto, aggiornato_il, verificato_il)
select 'maniscalco', 'guida', true, 'Scegliere i cavalli per scadenza nel nuovo appuntamento',
'Dove: tasto + → "Nuovo appuntamento" (o Agenda) → scegli il cliente; anche "Proponi appuntamento" a una scuderia su Equo
Passi:
1. Con 4 o più cavalli la lista diventa una linea del tempo: in alto quanti sono scaduti, entro 10 giorni e con tempo.
2. I cavalli con scadenze vicine (entro 7 giorni) sono nello stesso gruppo, in ordine di data, con i segni "Oggi" e "Appuntamento".
3. Tocca "Prendi tutti" su un gruppo, oppure i tasti rapidi "Scaduti", "Scaduti + entro 10 giorni", "Entro il <data>".
4. Puoi sempre togliere o aggiungere un cavallo toccandolo. Rosso = scaduto, arancione = entro 10 giorni, verde = più in là.
5. In fondo "Fuori dalla linea": cavalli già in agenda (in grigio) e senza scadenza.
Esempio: Luca apre un appuntamento per Le Querce il 4 novembre, tocca "Entro il 4 nov" e prende 9 cavalli in un tocco.
Note: Le scadenze sono le stesse di "Da richiamare" (prossima ferratura o data rimandata). Cambiando la data la linea si aggiorna e le spunte restano. Nessun cavallo è spuntato da solo.
Parole chiave: scegliere cavalli, appuntamento scuderia, cavalli in scadenza, scaduti, seleziona tutti, gruppo cavalli, linea del tempo',
now(), current_date
where not exists (select 1 from public.ai_conoscenze where titolo = 'Scegliere i cavalli per scadenza nel nuovo appuntamento');

-- controllo finale: deve dare 4 · 0 · 2
select (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public'
         and p.proname in ('equo_accetta_proposta_interno','equo_msg_cavalli_accettati','equo_accetta_cavallo_proposto','equo_accetta_tutti_proposti')) as funzioni,
       (select count(*) from interventi_mascalcia i join cavalli_clienti_mascalcia cv on cv.id = i.cavallo_cliente_id
         where cv.horse_id is not null and i.horse_id is null) as lavori_senza_cavallo,
       (select count(*) from ai_conoscenze where titolo in ('Cavalli preparati dal maniscalco: accettarli con tutti i lavori','Scegliere i cavalli per scadenza nel nuovo appuntamento')) as guide;
