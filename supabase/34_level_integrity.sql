-- PadelConnect — INTÉGRITÉ DU NIVEAU (anti-triche). À coller dans Supabase → SQL Editor → Run.
-- Idempotent.
--
-- PROBLÈME corrigé : la policy `profiles_update_own` autorise un joueur à écrire N'IMPORTE QUELLE
-- colonne de SA ligne, y compris `level`. Un tricheur pouvait donc faire
-- `update profiles set level = 7` sans jouer aucun tournoi, contournant toute la logique de
-- `close_competition`. On verrouille : SEULE `close_competition` (SECURITY DEFINER) peut modifier
-- `level`, via un drapeau de transaction que le client ne peut pas poser.

-- Trigger : rejette (revert) toute modification de `level` non estampillée par close_competition.
-- L'attribution à la CRÉATION du compte (handle_new_user, INSERT) n'est pas concernée (BEFORE UPDATE).
create or replace function public.protect_level()
returns trigger
language plpgsql
as $$
begin
  if new.level is distinct from old.level
     and coalesce(current_setting('padel.level_write', true), '') <> 'on' then
    new.level := old.level; -- écriture de niveau non autorisée → on garde l'ancienne valeur
  end if;
  return new;
end;
$$;

drop trigger if exists trg_protect_level on public.profiles;
create trigger trg_protect_level
  before update on public.profiles
  for each row execute function public.protect_level();

-- Redéfinition de close_competition : pose le drapeau `padel.level_write = on` (local à la
-- transaction) AVANT d'écrire `level` → seule cette fonction passe le trigger. Reste identique
-- à 26_competitions.sql par ailleurs (idempotent, garde status='published').
create or replace function public.close_competition(p_id uuid, p_winner text, p_second text, p_third text, p_loser text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
  v_club text;
  v_official boolean;
  v_winner text := nullif(trim(coalesce(p_winner, '')), '');
  v_loser text := nullif(trim(coalesce(p_loser, '')), '');
begin
  select organizer_id, club_id, official into v_owner, v_club, v_official
    from public.competitions where id = p_id and status = 'published';
  if v_owner is null then return false; end if;
  if v_owner <> auth.uid() and not public.can_manage_club(v_club) then return false; end if;
  update public.competitions
    set status = 'closed',
        winner = v_winner,
        second = nullif(trim(coalesce(p_second, '')), ''),
        third = nullif(trim(coalesce(p_third, '')), ''),
        loser = v_loser,
        closed_at = now()
    where id = p_id;

  if v_official then
    -- Autorise l'écriture de `level` pour cette transaction uniquement (le trigger la laissera passer).
    perform set_config('padel.level_write', 'on', true);
    if v_winner is not null then
      update public.profiles pr
        set level = least(7, greatest(1, coalesce(pr.level, 3) + 0.5))
        from public.competition_registrations rg
        where rg.competition_id = p_id and rg.user_id = pr.id
          and trim(coalesce(pr.first_name, '') || ' & ' || rg.partner) = v_winner;
    end if;
    if v_loser is not null then
      update public.profiles pr
        set level = least(7, greatest(1, coalesce(pr.level, 3) - 0.25))
        from public.competition_registrations rg
        where rg.competition_id = p_id and rg.user_id = pr.id
          and trim(coalesce(pr.first_name, '') || ' & ' || rg.partner) = v_loser;
    end if;
  end if;
  return true;
end;
$$;

grant execute on function public.close_competition(uuid, text, text, text, text) to authenticated;
