-- PadelConnect — ANTI-TRICHE RÉSERVATIONS, SUITE (à coller dans Supabase → SQL Editor → Run).
-- Idempotent.
--
-- Constat d'audit (confirmé par relecture croisée) : deux portes dérobées restaient ouvertes
-- à un client forgé (l'app officielle, elle, passe toujours par les bonnes fonctions) :
--
-- 1. La policy `reservations_delete_own` (schema.sql) autorisait un DELETE direct par le
--    joueur : la ligne disparaissait SANS passer par `cancel_reservation` (09) → plus de
--    barrière des 5 h, plus de trace 'cancelled', rien dans `player_reliability` (24/29).
--    Un joueur pouvait annuler tardivement à l'infini sans jamais être repéré — et une
--    réservation née d'un cours laissait la ligne `lessons` en 'accepted' orpheline
--    (le suivi cours↔réservation (38) n'écoute que les UPDATE).
--    L'app ne supprime JAMAIS une réservation directement (tout passe par la RPC) :
--    on retire la policy, sans aucun impact sur l'app.
--
-- 2. La policy `reservations_insert_own` ne contrôle que user_id, jamais les colonnes :
--    un INSERT forgé avec `club_confirmed = true` s'auto-validait « confirmée par le club »
--    (et court-circuitait la double validation coach + club des cours). Toutes les créations
--    légitimes (app + respond_lesson) posent club_confirmed=false et status='booked' :
--    un trigger force ces deux valeurs à l'insertion — seules les RPC SECURITY DEFINER
--    (set_club_confirmed, cancel_reservation, mark_no_show) les modifient ensuite.

-- 1) Plus de suppression directe : l'annulation passe par cancel_reservation, point.
drop policy if exists "reservations_delete_own" on public.reservations;

-- 2) À l'insertion, une réservation naît TOUJOURS 'booked' et non confirmée.
create or replace function public.reservations_insert_guard()
returns trigger
language plpgsql
as $$
begin
  new.club_confirmed := false;
  new.status := 'booked';
  return new;
end;
$$;

drop trigger if exists reservations_insert_guard on public.reservations;
create trigger reservations_insert_guard
  before insert on public.reservations
  for each row execute function public.reservations_insert_guard();
