-- Evita le schede doppie dello stesso cavallo nel cliente di un maniscalco.
-- Caso: il maniscalco inserisce a mano «Venere» per il cliente Marco; poi Marco (collegato) inserisce «Venere»
-- nel suo account e nell'elenco del maniscalco compaiono due schede.
-- Criterio: stesso cliente + stesso nome (senza maiuscole, accenti, spazi doppi). Vince sempre il nome del proprietario.
-- Nomi solo simili (es. «White» e «White night») NON si uniscono da soli: vanno uniti a mano.
-- Idempotente.

create or replace function equo_norm_nome(t text) returns text
language sql immutable as $$
  select nullif(trim(regexp_replace(translate(lower(coalesce(t, '')), 'àáâäèéêëìíîïòóôöùúûü', 'aaaaeeeeiiiioooouuuu'), '\s+', ' ', 'g')), '')
$$;

-- 1) Nuova scheda inserita a mano: se il cliente è collegato e ha già un cavallo con lo stesso nome,
--    la scheda nasce già agganciata a quel cavallo (con il nome scelto dal proprietario).
create or replace function equo_cavalli_clienti_aggancia() returns trigger
language plpgsql security definer set search_path to 'public' as $$
declare v_user uuid; v_h horses;
begin
  if new.horse_id is not null or new.scuderia_cavallo_id is not null then return new; end if;
  select cliente_user_id into v_user from clienti_mascalcia where id = new.cliente_mascalcia_id;
  if v_user is null or equo_norm_nome(new.nome) is null then return new; end if;
  select h.* into v_h from horses h
   where h.owner_id = v_user and h.condiviso_ecosistema is true and equo_norm_nome(h.name) = equo_norm_nome(new.nome)
     and not exists (select 1 from cavalli_clienti_mascalcia x where x.maniscalco_id = new.maniscalco_id and x.horse_id = h.id)
   order by h.created_at limit 1;
  if v_h.id is not null then
    new.horse_id := v_h.id;
    new.nome := v_h.name;
    new.microchip := coalesce(nullif(new.microchip, ''), v_h.microchip);
  end if;
  return new;
end $$;

drop trigger if exists trg_cavalli_clienti_aggancia on cavalli_clienti_mascalcia;
create trigger trg_cavalli_clienti_aggancia before insert on cavalli_clienti_mascalcia
  for each row execute function equo_cavalli_clienti_aggancia();

-- 2) Scheda collegata creata (o collegata) dopo: le schede manuali dello stesso cliente con lo stesso nome
--    vengono unite a quella collegata: lavori, problemi, allegati e arrivi passano alla scheda collegata,
--    impostazioni e avvisi di sicurezza si conservano, il nome resta quello del proprietario.
create or replace function equo_cavalli_clienti_unisci_manuali() returns trigger
language plpgsql security definer set search_path to 'public' as $$
declare d cavalli_clienti_mascalcia;
begin
  if new.horse_id is null or new.scuderia_cavallo_id is not null then return null; end if;
  if coalesce(current_setting('equo.unisci_manuali', true), '') = 'on' then return null; end if;
  perform set_config('equo.unisci_manuali', 'on', true);
  for d in
    select * from cavalli_clienti_mascalcia
     where maniscalco_id = new.maniscalco_id and cliente_mascalcia_id = new.cliente_mascalcia_id and id <> new.id
       and horse_id is null and scuderia_cavallo_id is null and equo_norm_nome(nome) = equo_norm_nome(new.nome)
  loop
    update interventi_mascalcia set cavallo_cliente_id = new.id where cavallo_cliente_id = d.id;
    update cavalli_problemi_piede set cavallo_cliente_id = new.id where cavallo_cliente_id = d.id;
    update cavalli_allegati set cavallo_cliente_id = new.id where cavallo_cliente_id = d.id;
    update cavalli_arrivi set cavallo_cliente_id = new.id where cavallo_cliente_id = d.id;
    update cavalli_clienti_mascalcia set
      avviso_sicurezza = coalesce(nullif(avviso_sicurezza, ''), d.avviso_sicurezza),
      ferratura_tipo   = case when ferratura_tipo = 'completa' and d.ferratura_tipo is not null then d.ferratura_tipo else ferratura_tipo end,
      ferro_tipo       = case when ferro_tipo = 'standard' and d.ferro_tipo is not null then d.ferro_tipo else ferro_tipo end,
      ferro_note       = coalesce(nullif(ferro_note, ''), d.ferro_note),
      ferro_tipo_post  = coalesce(ferro_tipo_post, d.ferro_tipo_post),
      ferro_sistema    = coalesce(ferro_sistema, d.ferro_sistema),
      ferro_numero     = coalesce(ferro_numero, d.ferro_numero),
      razza            = coalesce(nullif(razza, ''), d.razza),
      microchip        = coalesce(nullif(microchip, ''), d.microchip)
     where id = new.id;
    insert into cavalli_storico (codice_equo, horse_id, scuderia_cavallo_id, cavallo_cliente_id, tipo, descrizione, autore_user_id, autore_ruolo, app)
    values (new.codice_equo, new.horse_id, null, new.id, 'unione',
      'Scheda inserita a mano dal maniscalco («' || d.nome || '», codice ' || coalesce(d.codice_equo, '-') || ') unita alla scheda del proprietario («' || new.nome || '»): resta il nome scelto dal proprietario',
      null, 'sistema', 'app');
    delete from cavalli_clienti_mascalcia where id = d.id;
  end loop;
  perform set_config('equo.unisci_manuali', '', true);
  return null;
end $$;

drop trigger if exists trg_cavalli_clienti_unisci_manuali on cavalli_clienti_mascalcia;
create trigger trg_cavalli_clienti_unisci_manuali after insert or update of horse_id on cavalli_clienti_mascalcia
  for each row execute function equo_cavalli_clienti_unisci_manuali();
