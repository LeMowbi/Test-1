-- PadelConnect — réservations « source de vérité serveur » (à coller dans Supabase →
-- SQL Editor → Run). Complète schema.sql : la table reservations existe déjà ; ici on
-- ajoute la sécurité club/opérateur, l'anti double-réservation et l'occupation publique.
-- Idempotent : peut être relancé sans casser l'existant.

-- ─── Anti double-réservation ─────────────────────────────────────────────────
-- Un même terrain ne peut être réservé qu'UNE fois par créneau (parmi les résas
-- ACTIVES). Deux joueurs différents ne peuvent donc plus prendre le même terrain.
create unique index if not exists reservations_slot_unique
  on public.reservations (club_id, date_key, "time", court)
  where status = 'booked';

-- ─── Lecture côté CLUB / OPÉRATEUR (en plus de « ses propres résas ») ─────────
-- Le gérant lit les réservations de SON club (managed_club_id).
drop policy if exists "reservations_select_club" on public.reservations;
create policy "reservations_select_club" on public.reservations
  for select using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'club' and p.managed_club_id = reservations.club_id
    )
  );

-- L'opérateur lit toutes les réservations (commissions, suivi plateforme).
drop policy if exists "reservations_select_operator" on public.reservations;
create policy "reservations_select_operator" on public.reservations
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'operator')
  );

-- Le club (son club) et l'opérateur peuvent CONFIRMER une réservation (club_confirmed).
drop policy if exists "reservations_update_club" on public.reservations;
create policy "reservations_update_club" on public.reservations
  for update using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and ((p.role = 'club' and p.managed_club_id = reservations.club_id) or p.role = 'operator')
    )
  );

-- ─── OCCUPATION publique (sans identité) ─────────────────────────────────────
-- Pour que CHAQUE joueur voie les créneaux déjà pris par les AUTRES, on expose une
-- vue qui ne révèle QUE l'occupation (club, jour, heure, terrain) — jamais qui a
-- réservé. La vue tourne en droits « définisseur » (security_invoker = off) pour
-- contourner la RLS de la table et montrer l'occupation de tous, colonnes sûres only.
create or replace view public.slot_occupancy as
  select club_id, date_key, "time", court
  from public.reservations
  where status = 'booked';

alter view public.slot_occupancy set (security_invoker = off);
grant select on public.slot_occupancy to anon, authenticated;
