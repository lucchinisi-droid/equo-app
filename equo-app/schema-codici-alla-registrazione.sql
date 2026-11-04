-- Equo: il codice Equo del profilo nasce con il ruolo, non quando si apre «Il mio codice» (04/11/2026). Rieseguibile.
-- Prima: all'iscrizione il profilo aveva solo email e id; il codice lo creava l'app la prima volta che serviva
-- («Il mio codice», chat tra colleghi, Equo CV, agenda). Chi non apriva quelle voci restava senza codice.
-- Ora:
-- 1) appena un profilo riceve un ruolo (all'iscrizione o aggiungendo il secondo ruolo) il database crea il codice:
--    proprietario → EQUOOWN…; maniscalco → EQUOPRO…; veterinario → EQUOMED…; istruttore → EQUOTRA…
--    (stesso formato e stesse lettere dell'app: 5 caratteri senza O, I, L; mai uguale a un codice già esistente).
-- 2) i profili che oggi non hanno il codice lo ricevono subito. Chi ha già un codice lo tiene.
-- L'app non cambia: le funzioni che creavano il codice «al bisogno» lo trovano già pronto.

create or replace function public.equo_nuovo_codice_profilo(p_tipo text)
 returns text
 language plpgsql
 volatile
 set search_path to 'public'
as $f$
declare
  alfabeto constant text := '0123456789ABCDEFGHJKMNPQRSTUVWXYZ';
  c text; i int; n int := 0;
begin
  loop
    n := n + 1;
    c := 'EQUO' || p_tipo;
    for i in 1..5 loop
      c := c || substr(alfabeto, 1 + floor(random() * length(alfabeto))::int, 1);
    end loop;
    if not exists (select 1 from profiles
                    where equo_norm_codice(codice_proprietario) = c or equo_norm_codice(codice_professionista) = c) then
      return c;
    end if;
    if n > 50 then raise exception 'Codice Equo: troppi tentativi'; end if;
  end loop;
end $f$;

-- prefisso del codice professionista, come nell'app (maniscalco prima di istruttore e veterinario)
create or replace function public.equo_prefisso_professionista(p_ruolo text, p_secondario text)
 returns text
 language sql
 immutable
as $f$
  select case
    when 'maniscalco' in (p_ruolo, p_secondario) then 'PRO'
    when 'istruttore' in (p_ruolo, p_secondario) then 'TRA'
    when 'veterinario' in (p_ruolo, p_secondario) then 'MED'
  end
$f$;

create or replace function public.profiles_assegna_codici()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $f$
declare pref text;
begin
  if new.codice_proprietario is null and 'proprietario' in (new.ruolo, new.ruolo_secondario) then
    new.codice_proprietario := equo_nuovo_codice_profilo('OWN');
  end if;
  pref := equo_prefisso_professionista(new.ruolo, new.ruolo_secondario);
  if new.codice_professionista is null and pref is not null then
    new.codice_professionista := equo_nuovo_codice_profilo(pref);
  end if;
  return new;
end $f$;

-- servono solo al database: non si chiamano dall'app
revoke execute on function public.equo_nuovo_codice_profilo(text) from public, anon, authenticated;
revoke execute on function public.profiles_assegna_codici() from public, anon, authenticated;

drop trigger if exists trg_profiles_assegna_codici on public.profiles;
create trigger trg_profiles_assegna_codici
  before insert or update of ruolo, ruolo_secondario on public.profiles
  for each row execute function public.profiles_assegna_codici();

-- profili di oggi senza codice (uno alla volta, così due nuovi codici non possono coincidere)
do $d$
declare r record; pref text;
begin
  for r in select id, ruolo, ruolo_secondario, codice_proprietario, codice_professionista from public.profiles loop
    if r.codice_proprietario is null and 'proprietario' in (r.ruolo, r.ruolo_secondario) then
      update public.profiles set codice_proprietario = equo_nuovo_codice_profilo('OWN') where id = r.id;
    end if;
    pref := equo_prefisso_professionista(r.ruolo, r.ruolo_secondario);
    if r.codice_professionista is null and pref is not null then
      update public.profiles set codice_professionista = equo_nuovo_codice_profilo(pref) where id = r.id;
    end if;
  end loop;
end $d$;

-- controllo: deve dare 0 · 0 (nessun profilo senza il codice che gli spetta)
select
  (select count(*) from public.profiles where codice_proprietario is null and 'proprietario' in (ruolo, ruolo_secondario)) as senza_codice_proprietario,
  (select count(*) from public.profiles where codice_professionista is null and public.equo_prefisso_professionista(ruolo, ruolo_secondario) is not null) as senza_codice_professionista;
