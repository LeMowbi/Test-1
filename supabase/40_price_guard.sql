-- PadelConnect — GARDE-FOU SUR LES PRIX (à coller dans Supabase → SQL Editor → Run). Idempotent.
--
-- Constat d'audit : le prix d'une réservation (base de la commission PadelConnect) est envoyé
-- par le CLIENT et n'était jamais validé côté serveur. Une requête forgée avec price=0 créait
-- une réservation réelle comptée 0 FCFA dans le décompte hebdomadaire.
-- Les tarifs des 9 clubs de base vivent dans l'app (pas en base) : le serveur ne peut pas
-- recalculer le prix exact — il impose donc des BORNES DE VRAISEMBLANCE (aucune session de
-- padel à Abidjan ne coûte moins de 1 000 F ni plus de 1 000 000 F). Un prix hors bornes est
-- refusé net ; le gérant voit de toute façon le prix sur chaque réservation dans son Espace
-- Club — la borne bloque l'abus grossier, l'affichage attrape le reste.

create or replace function public.reservations_price_guard()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'booked' and (new.price is null or new.price < 1000 or new.price > 1000000) then
    raise exception 'prix de réservation invalide';
  end if;
  return new;
end;
$$;

drop trigger if exists reservations_price_guard on public.reservations;
create trigger reservations_price_guard
  before insert on public.reservations
  for each row execute function public.reservations_price_guard();

-- Même borne à la DEMANDE de cours (le prix y est figé puis repris par la réservation).
-- On remplace request_lesson (38) en ajoutant uniquement ce contrôle en tête.
create or replace function public.request_lesson(
  p_coach uuid, p_club_id text, p_club_name text, p_date_key text, p_date_label text, p_time text, p_court text,
  p_starts_at bigint, p_price integer
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
  sname text;
  cname text;
  cfg record;
begin
  if auth.uid() is null or auth.uid() = p_coach then return null; end if;
  -- Bornes de vraisemblance du prix du terrain (cf. reservations_price_guard ci-dessus).
  if p_price is null or p_price < 1000 or p_price > 1000000 then return null; end if;
  -- Le coach doit être ACTIF dans CE club et proposer CE créneau.
  if not exists (
    select 1 from public.coaches c
    where c.user_id = p_coach and c.club_id = p_club_id and c.active and p_time = any (c.slots)
  ) then
    return null;
  end if;
  -- Créneau/terrain validés contre la CONFIG DU CLUB quand elle existe (cf. 38).
  select slots, courts into cfg from public.club_config where club_id = p_club_id;
  if cfg.slots is not null and not (p_time = any (cfg.slots)) then return null; end if;
  if cfg.courts is not null and not (p_court = any (cfg.courts)) then return null; end if;
  if p_starts_at <= (extract(epoch from now()) * 1000)::bigint then return null; end if;
  -- Pas deux demandes actives identiques (même élève, même coach, même créneau).
  if exists (
    select 1 from public.lessons l
    where l.student_id = auth.uid() and l.coach_id = p_coach and l.date_key = p_date_key
      and l."time" = p_time and l.status = 'pending'
  ) then
    return null;
  end if;
  select coalesce(nullif(trim(coalesce(first_name, '') || ' ' || coalesce(last_name, '')), ''), 'Un joueur')
    into sname from public.profiles where id = auth.uid();
  select coalesce(nullif(trim(coalesce(first_name, '') || ' ' || coalesce(last_name, '')), ''), 'Coach')
    into cname from public.profiles where id = p_coach;
  insert into public.lessons (coach_id, coach_name, club_id, club_name, student_id, student_name, date_key, date_label, "time", court, starts_at, price)
    values (p_coach, cname, p_club_id, coalesce(p_club_name, ''), auth.uid(), sname, p_date_key, coalesce(p_date_label, ''), p_time, p_court, p_starts_at, p_price)
    returning id into new_id;
  return new_id;
end;
$$;

grant execute on function public.request_lesson(uuid, text, text, text, text, text, text, bigint, integer) to authenticated;
