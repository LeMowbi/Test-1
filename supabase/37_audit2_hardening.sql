-- PadelConnect — Durcissements audit n°2 (à coller dans Supabase → SQL Editor → Run). Idempotent.
--
-- Deux corrections issues du grand audit :
--   1) AVIS DES INVITÉS : `submit_review` n'acceptait que le RÉSERVATAIRE d'une partie jouée.
--      Or l'app considère (à juste titre) qu'un ami INVITÉ qui a accepté et joué « a joué ici » :
--      il voyait le formulaire d'avis… et le serveur le refusait à chaque fois (impasse).
--      → on accepte aussi une PARTICIPATION ACCEPTÉE à une réservation passée du club.
--   2) DOUBLE OCCUPATION : un club pouvait créer/valider un tournoi sur des terrains+créneaux
--      portant DÉJÀ des réservations payées (le garde existant empêche seulement l'inverse :
--      réserver par-dessus un tournoi). → create_competition (branche club, publiée direct) et
--      approve_competition refusent désormais si une réservation « booked » occupe la plage.

-- ── 1) submit_review : le joueur invité (participation acceptée) peut noter ─────
create or replace function public.submit_review(p_club_id text, p_rating int, p_text text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  aname text;
  now_ms bigint := (extract(epoch from now()) * 1000)::bigint;
begin
  if uid is null or p_rating < 1 or p_rating > 5 then return false; end if;
  -- « A réellement joué ici » = réservation CONFIRMÉE passée dont il est l'AUTEUR,
  -- OU participation ACCEPTÉE à une réservation confirmée passée de ce club (invité par un ami).
  if not exists (
    select 1 from public.reservations r
    where r.user_id = uid and r.club_id = p_club_id and r.status = 'booked' and r.starts_at <= now_ms
  ) and not exists (
    select 1
    from public.reservation_participants p
    join public.reservations r on r.id = p.reservation_id
    where p.user_id = uid and p.status = 'accepted'
      and r.club_id = p_club_id and r.status = 'booked' and r.starts_at <= now_ms
  ) then
    return false;
  end if;
  select coalesce(nullif(trim(coalesce(first_name, '') || ' ' || coalesce(last_name, '')), ''), 'Joueur')
    into aname from public.profiles where id = uid;
  insert into public.reviews (club_id, user_id, author_name, rating, text)
    values (p_club_id, uid, aname, p_rating, nullif(trim(coalesce(p_text, '')), ''))
    on conflict (club_id, user_id)
      do update set rating = excluded.rating, text = excluded.text, created_at = now();
  return true;
end;
$$;

grant execute on function public.submit_review(text, int, text) to authenticated;

-- ── 2) Anti double-occupation : pas de tournoi par-dessus des réservations ──────
-- Une réservation « booked » occupe-t-elle la plage (dates × créneaux × terrains) du tournoi ?
-- (Même logique que reservations_availability_guard, appliquée en sens inverse.)
create or replace function public.competition_overlaps_reservations(
  p_club_id text, p_date_key text, p_end_date_key text, p_slots text[], p_courts text[]
)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.reservations r
    where r.club_id = p_club_id
      and r.status = 'booked'
      and r.date_key >= p_date_key
      and r.date_key <= coalesce(nullif(p_end_date_key, ''), p_date_key)
      and (coalesce(array_length(p_slots, 1), 0) = 0 or r.time = any (p_slots))
      and (coalesce(array_length(p_courts, 1), 0) = 0 or r.court = any (p_courts))
  );
$$;

-- create_competition : identique à 26, MAIS la branche CLUB (publiée immédiatement) refuse si
-- des réservations occupent déjà la plage → renvoie null (l'app affiche l'échec, rien n'est créé).
-- Un tournoi JOUEUR reste créé en « pending » : le conflit est contrôlé à la VALIDATION du club.
-- L'ORDRE des paramètres change par rapport à la 26 → on SUPPRIME l'ancienne signature d'abord,
-- sinon deux surcharges coexistent et l'appel par paramètres nommés devient AMBIGU (PGRST203) :
-- plus aucun tournoi ne pourrait être créé.
drop function if exists public.create_competition(
  text, text, text, text, text, text, text, text, text[], text[], int, text, text, text, text
);
create or replace function public.create_competition(
  p_organizer_type text, p_organizer_name text, p_organizer_phone text, p_club_id text, p_club_name text,
  p_title text, p_format text, p_level text, p_date_key text, p_end_date_key text,
  p_courts text[], p_slots text[], p_capacity int, p_fee text, p_reward text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
  v_official boolean;
  v_status text;
  v_commission int := 0;
begin
  if auth.uid() is null then return null; end if;
  if coalesce(trim(p_title), '') = '' or coalesce(trim(p_date_key), '') = '' then return null; end if;

  if p_organizer_type = 'club' then
    if not public.can_manage_club(p_club_id) then return null; end if; -- réservé au gérant du club
    -- Refus si des réservations « booked » occupent déjà ces terrains/créneaux (double occupation).
    if public.competition_overlaps_reservations(p_club_id, p_date_key, p_end_date_key, coalesce(p_slots, '{}'), coalesce(p_courts, '{}')) then
      return null;
    end if;
    v_official := true;
    v_status := 'published';
  else
    v_official := false;
    v_status := 'pending';
    select player_fee into v_commission from public.tournament_config where id = true;
    v_commission := coalesce(v_commission, 0);
  end if;

  insert into public.competitions (
    organizer_id, organizer_type, organizer_name, organizer_phone, club_id, club_name,
    title, format, level, date_key, end_date_key, courts, slots,
    capacity, fee, reward, official, status, commission
  ) values (
    auth.uid(), p_organizer_type, coalesce(p_organizer_name, ''), nullif(trim(coalesce(p_organizer_phone, '')), ''), p_club_id, p_club_name,
    trim(p_title), coalesce(p_format, ''), coalesce(p_level, ''), p_date_key, nullif(p_end_date_key, ''),
    coalesce(p_courts, '{}'), coalesce(p_slots, '{}'),
    greatest(coalesce(p_capacity, 8), 1), coalesce(p_fee, ''), coalesce(p_reward, ''),
    v_official, v_status, v_commission
  ) returning id into new_id;
  return new_id;
end;
$$;

grant execute on function public.create_competition(text, text, text, text, text, text, text, text, text, text, text[], text[], int, text, text) to authenticated;

-- approve_competition : refuse la publication si des réservations occupent déjà la plage.
create or replace function public.approve_competition(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_club text;
  v_date text;
  v_end text;
  v_slots text[];
  v_courts text[];
begin
  select club_id, date_key, end_date_key, slots, courts
    into v_club, v_date, v_end, v_slots, v_courts
    from public.competitions where id = p_id and status = 'pending';
  if v_club is null then return false; end if;
  if not public.can_manage_club(v_club) then return false; end if;
  -- Des joueurs ont déjà réservé ces créneaux : publier créerait une double occupation.
  if public.competition_overlaps_reservations(v_club, v_date, v_end, coalesce(v_slots, '{}'), coalesce(v_courts, '{}')) then
    return false;
  end if;
  update public.competitions set status = 'published' where id = p_id and status = 'pending';
  return true;
end;
$$;

grant execute on function public.approve_competition(uuid) to authenticated;
