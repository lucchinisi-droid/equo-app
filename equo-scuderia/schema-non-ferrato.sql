-- Equo · SQL 62 · «Questo cavallo non viene ferrato» (puledri, anziani, scalzi) · 11/11/2026
-- Scuderia e proprietario possono segnare un cavallo come non ferrato (con un motivo facoltativo) e togliere la spunta
-- quando inizia a essere ferrato. Con la spunta lo scadenzario non chiede più la ferratura: al suo posto segue il
-- PAREGGIO (scadenza dai pareggi registrati, avviso solo se ce n'è almeno uno). Niente «dato mancante».
--   · colonne non_ferrato / non_ferrato_motivo / non_ferrato_il su scuderia_cavalli e horses;
--   · la spunta si tiene allineata tra la scheda della scuderia e il libretto del proprietario (stesso cavallo);
--   · se il maniscalco registra una FERRATURA su un cavallo segnato non ferrato, arriva un avviso a scuderia e
--     proprietario per togliere la spunta (niente si cambia da solo).
-- Solo aggiunte. Per annullare: drop dei trigger trg_non_ferrato_* e delle funzioni equo_non_ferrato_*, poi delle colonne.

alter table scuderia_cavalli add column if not exists non_ferrato boolean not null default false;
alter table scuderia_cavalli add column if not exists non_ferrato_motivo text;
alter table scuderia_cavalli add column if not exists non_ferrato_il timestamptz;
alter table horses add column if not exists non_ferrato boolean not null default false;
alter table horses add column if not exists non_ferrato_motivo text;
alter table horses add column if not exists non_ferrato_il timestamptz;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'scuderia_cavalli_non_ferrato_motivo_check') then
    alter table scuderia_cavalli add constraint scuderia_cavalli_non_ferrato_motivo_check check (non_ferrato_motivo is null or non_ferrato_motivo in ('puledro', 'anziano', 'scalzo', 'altro'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'horses_non_ferrato_motivo_check') then
    alter table horses add constraint horses_non_ferrato_motivo_check check (non_ferrato_motivo is null or non_ferrato_motivo in ('puledro', 'anziano', 'scalzo', 'altro'));
  end if;
end $$;

-- data della spunta e allineamento scuderia ↔ proprietario (stesso cavallo, collegato con horse_id)
create or replace function equo_non_ferrato_prima() returns trigger language plpgsql as $$
begin
  if not new.non_ferrato then new.non_ferrato_motivo := null; new.non_ferrato_il := null;
  elsif tg_op = 'INSERT' or not old.non_ferrato then new.non_ferrato_il := coalesce(new.non_ferrato_il, now()); end if;
  return new;
end $$;
drop trigger if exists trg_non_ferrato_prima on scuderia_cavalli;
create trigger trg_non_ferrato_prima before insert or update of non_ferrato, non_ferrato_motivo on scuderia_cavalli for each row execute function equo_non_ferrato_prima();
drop trigger if exists trg_non_ferrato_prima on horses;
create trigger trg_non_ferrato_prima before insert or update of non_ferrato, non_ferrato_motivo on horses for each row execute function equo_non_ferrato_prima();

create or replace function equo_non_ferrato_allinea() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce(current_setting('equo.non_ferrato', true), '') = 'on' then return null; end if;
  if (old.non_ferrato, coalesce(old.non_ferrato_motivo, '')) is not distinct from (new.non_ferrato, coalesce(new.non_ferrato_motivo, '')) then return null; end if;
  perform set_config('equo.non_ferrato', 'on', true);
  if tg_table_name = 'scuderia_cavalli' then
    if new.horse_id is not null then
      update horses set non_ferrato = new.non_ferrato, non_ferrato_motivo = new.non_ferrato_motivo where id = new.horse_id;
    end if;
  else
    update scuderia_cavalli set non_ferrato = new.non_ferrato, non_ferrato_motivo = new.non_ferrato_motivo where horse_id = new.id and uscito_il is null;
  end if;
  perform set_config('equo.non_ferrato', '', true);
  return null;
end $$;
drop trigger if exists trg_non_ferrato_allinea on scuderia_cavalli;
create trigger trg_non_ferrato_allinea after update of non_ferrato, non_ferrato_motivo on scuderia_cavalli for each row execute function equo_non_ferrato_allinea();
drop trigger if exists trg_non_ferrato_allinea on horses;
create trigger trg_non_ferrato_allinea after update of non_ferrato, non_ferrato_motivo on horses for each row execute function equo_non_ferrato_allinea();

-- il maniscalco registra una FERRATURA su un cavallo segnato non ferrato → avviso (la spunta la toglie chi vuole)
create or replace function equo_non_ferrato_avviso() returns trigger language plpgsql security definer set search_path = public as $$
declare v_sc record; v_h record; v_chi text; v_card uuid;
begin
  if new.stato <> 'fatto' or (tg_op = 'UPDATE' and old.stato = 'fatto') or new.tipo_ferratura not in ('ferratura', 'mezza_ferratura') then return null; end if;
  if new.data_intervento < current_date - 7 then return null; end if;
  v_chi := coalesce(equo_nome_profilo(new.maniscalco_id), 'Il maniscalco');
  -- scuderia: avviso nelle Comunicazioni dello staff
  for v_sc in select sc.id, sc.nome, sc.centro_id from scuderia_cavalli sc
               where sc.non_ferrato and sc.uscito_il is null
                 and (sc.id = (select scuderia_cavallo_id from cavalli_clienti_mascalcia where id = new.cavallo_cliente_id)
                      or (coalesce(new.horse_id, (select horse_id from cavalli_clienti_mascalcia where id = new.cavallo_cliente_id)) is not null
                          and sc.horse_id = coalesce(new.horse_id, (select horse_id from cavalli_clienti_mascalcia where id = new.cavallo_cliente_id)))) loop
    insert into scuderia_messaggi (centro_id, mittente_id, destinatario_tipo, testo, priorita)
    values (v_sc.centro_id, null, 'tutti', '🔨 ' || v_chi || ' ha registrato una ferratura su ' || v_sc.nome || ' (' || to_char(new.data_intervento, 'DD/MM/YYYY')
            || '), ma nella scheda è segnato «non ferrato». Se ora viene ferrato, togli la spunta: Cavalli › ' || v_sc.nome || ' › Modifica.', 'normale');
  end loop;
  -- proprietario con l'app: avviso nella chat con il maniscalco
  for v_h in select h.id, h.name, h.owner_id from horses h
              where h.non_ferrato and h.id = coalesce(new.horse_id, (select horse_id from cavalli_clienti_mascalcia where id = new.cavallo_cliente_id)) loop
    select id into v_card from clienti_mascalcia where maniscalco_id = new.maniscalco_id and cliente_user_id = v_h.owner_id and centro_id is null limit 1;
    if v_card is not null then
      perform set_config('equo.collegamento', 'on', true);
      insert into messaggi_mascalcia (maniscalco_id, cliente_mascalcia_id, mittente_tipo, mittente_user_id, tipo, testo, letto)
      values (new.maniscalco_id, v_card, 'maniscalco', new.maniscalco_id, 'testo',
              'ℹ️ Nel libretto ' || v_h.name || ' è segnato «non ferrato», ma è stata registrata una ferratura. Se ora viene ferrato, togli la spunta nella scheda del cavallo.', false);
      perform set_config('equo.collegamento', '', true);
    end if;
  end loop;
  return null;
end $$;
drop trigger if exists trg_non_ferrato_avviso on interventi_mascalcia;
create trigger trg_non_ferrato_avviso after insert or update of stato on interventi_mascalcia for each row execute function equo_non_ferrato_avviso();

select (select count(*) from information_schema.columns where column_name = 'non_ferrato' and table_name in ('scuderia_cavalli', 'horses')) as colonne_ok,
       (select count(*) from pg_trigger where tgname like 'trg_non_ferrato_%') as trigger_ok;
