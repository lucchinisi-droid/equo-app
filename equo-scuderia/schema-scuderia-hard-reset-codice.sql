-- ══════════════════════════════════════════════════════
-- EQUO SCUDERIA — Hard Reset totale protetto da codice via email
-- Da eseguire su Supabase → SQL Editor → New query → Run
-- ══════════════════════════════════════════════════════

alter table centri add column if not exists hard_reset_code text;

create or replace function public.confirm_hard_reset_totale(
  p_centro_id uuid,
  p_code text
)
returns void
language plpgsql
security definer
as $$
begin
  if not is_admin_of_centro(p_centro_id) then
    raise exception 'Solo l''amministratore può eseguire il reset totale';
  end if;

  if p_code is null or length(trim(p_code)) <> 6 then
    raise exception 'Codice non valido.';
  end if;

  if not exists (
    select 1 from centri
    where id = p_centro_id and hard_reset_code is not null and hard_reset_code = trim(p_code)
  ) then
    raise exception 'Codice non valido.';
  end if;

  delete from scuderia_note where centro_id = p_centro_id;
  delete from scuderia_messaggi where centro_id = p_centro_id;
  delete from scuderia_pacchetti where centro_id = p_centro_id;
  delete from scuderia_lezioni where centro_id = p_centro_id;
  delete from scuderia_eventi_sanitari where centro_id = p_centro_id;
  delete from scuderia_cavalli where centro_id = p_centro_id;
  delete from scuderia_contatti where centro_id = p_centro_id;
  delete from scuderia_dati_fiscali where centro_id = p_centro_id;

  update centri set hard_reset_code = null where id = p_centro_id;
end;
$$;

grant execute on function public.confirm_hard_reset_totale(uuid, text) to authenticated;

-- Quando un centro chiede il codice via email, generalo e impostalo così:
-- update centri set hard_reset_code = '482913' where id = 'INCOLLA-QUI-ID-CENTRO';
-- Il codice si autoconsuma al primo uso corretto.
