-- PadelConnect — durcissements de sécurité (à coller dans Supabase → SQL Editor → Run).
-- Idempotent. Remplace des fonctions de 19_grant_manager.sql et 24_reliability_window.sql.
--
-- 1) Promotion gérant par numéro : le téléphone n'est ni unique ni vérifié. Avec « limit 1 »,
--    deux comptes partageant les 10 derniers chiffres (indicatifs différents, ou un attaquant
--    qui a copié le numéro d'un futur gérant) rendaient la cible indéterminée → usurpation
--    possible. On REFUSE désormais toute promotion ambiguë (0 ou >1 correspondance).
-- 2) Fiabilité : un compte « club » pouvait lire les compteurs annulations/absences GLOBAUX
--    (tous clubs) de n'importe quel joueur. On restreint au club de l'appelant.

-- ─── 1) Accès gérant par numéro : refus si ambigu ───────────────────────────────
create or replace function public.grant_club_access_by_phone(p_phone text, p_club_id text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  target uuid;
  full_name text;
  matches int;
begin
  if not exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'operator') then
    return null; -- réservé à l'opérateur
  end if;
  if coalesce(p_club_id, '') = '' or length(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g')) < 8 then
    return null;
  end if;
  select count(*) into matches from public.profiles p
    where right(regexp_replace(p.phone, '\D', '', 'g'), 10) = right(regexp_replace(p_phone, '\D', '', 'g'), 10);
  if matches <> 1 then
    return null; -- 0 = introuvable ; >1 = AMBIGU → on refuse (anti-usurpation)
  end if;
  select p.id, trim(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, ''))
    into target, full_name
  from public.profiles p
  where right(regexp_replace(p.phone, '\D', '', 'g'), 10) = right(regexp_replace(p_phone, '\D', '', 'g'), 10);
  update public.profiles set role = 'club', managed_club_id = p_club_id where id = target;
  return coalesce(nullif(full_name, ''), 'Gérant');
end;
$$;

grant execute on function public.grant_club_access_by_phone(text, text) to authenticated;

create or replace function public.revoke_club_access_by_phone(p_phone text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  target uuid;
  full_name text;
  matches int;
begin
  if not exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'operator') then
    return null;
  end if;
  if length(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g')) < 8 then
    return null;
  end if;
  select count(*) into matches from public.profiles p
    where right(regexp_replace(p.phone, '\D', '', 'g'), 10) = right(regexp_replace(p_phone, '\D', '', 'g'), 10);
  if matches <> 1 then
    return null; -- ambigu → on refuse
  end if;
  select p.id, trim(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, ''))
    into target, full_name
  from public.profiles p
  where right(regexp_replace(p.phone, '\D', '', 'g'), 10) = right(regexp_replace(p_phone, '\D', '', 'g'), 10);
  update public.profiles set role = 'player', managed_club_id = null where id = target;
  return coalesce(nullif(full_name, ''), 'Joueur');
end;
$$;

grant execute on function public.revoke_club_access_by_phone(text) to authenticated;

-- ─── 2) Fiabilité restreinte au club de l'appelant (l'opérateur garde la vue globale) ──
create or replace function public.player_reliability(p_user_ids uuid[])
returns table (user_id uuid, cancelled int, no_show int)
language plpgsql
security definer
set search_path = public
as $$
declare
  cutoff bigint := (extract(epoch from now()) * 1000)::bigint - 14 * 86400000; -- il y a 14 jours (ms)
begin
  return query
    select r.user_id,
      count(*) filter (where r.status = 'cancelled' and r.starts_at >= cutoff)::int,
      count(*) filter (where r.status = 'no_show' and r.starts_at >= cutoff)::int
    from public.reservations r
    join public.profiles me on me.id = auth.uid()
    where me.role in ('club', 'operator')
      and r.user_id = any (p_user_ids)
      and (me.role = 'operator' or r.club_id = me.managed_club_id) -- un club ne voit QUE son club
    group by r.user_id;
end;
$$;

grant execute on function public.player_reliability(uuid[]) to authenticated;
