-- PadelConnect — créneaux FERMÉS hors app + blocage serveur des réservations (à coller dans
-- Supabase → SQL Editor → Run). Idempotent. Nécessite 26_competitions.sql (fonction can_manage_club).
--
-- Jusqu'ici, quand un club fermait un créneau (résa téléphone/WhatsApp, entretien), le blocage
-- restait DANS SON TÉLÉPHONE → un autre joueur pouvait réserver ce terrain (double occupation
-- réelle), et le blocage se perdait à la réinstallation. Cette table le rend RÉEL et partagé,
-- et un trigger empêche VRAIMENT toute réservation sur un créneau fermé ou réservé à un tournoi.

create table if not exists public.blocked_slots (
  club_id text not null,
  date_key text not null,
  time text not null,
  court text not null,
  reason text not null default '',
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (club_id, date_key, time, court)
);

alter table public.blocked_slots enable row level security;

-- Lecture publique : chaque joueur doit voir les créneaux fermés pour ne pas les proposer.
drop policy if exists "blocked_slots_select" on public.blocked_slots;
create policy "blocked_slots_select" on public.blocked_slots for select using (true);
-- Écritures : uniquement via les RPC ci-dessous (gérant du club / opérateur).

-- Ferme un créneau (réservé au club). Refuse si une réservation PadelConnect existe déjà dessus.
create or replace function public.block_slot(p_club_id text, p_date_key text, p_time text, p_court text, p_reason text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.can_manage_club(p_club_id) then
    return false; -- réservé au gérant du club (ou opérateur)
  end if;
  if exists (
    select 1 from public.reservations r
    where r.club_id = p_club_id and r.date_key = p_date_key and r.time = p_time and r.court = p_court and r.status = 'booked'
  ) then
    return false; -- déjà réservé dans l'app → on ne bloque pas par-dessus
  end if;
  insert into public.blocked_slots (club_id, date_key, time, court, reason, created_by)
    values (p_club_id, p_date_key, p_time, p_court, coalesce(p_reason, ''), auth.uid())
    on conflict (club_id, date_key, time, court) do update set reason = excluded.reason;
  return true;
end;
$$;

grant execute on function public.block_slot(text, text, text, text, text) to authenticated;

create or replace function public.unblock_slot(p_club_id text, p_date_key text, p_time text, p_court text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.can_manage_club(p_club_id) then
    return false;
  end if;
  delete from public.blocked_slots
    where club_id = p_club_id and date_key = p_date_key and time = p_time and court = p_court;
  return true;
end;
$$;

grant execute on function public.unblock_slot(text, text, text, text) to authenticated;

-- ─── Barrière serveur : une réservation ne peut PAS tomber sur un créneau fermé ou réservé à
--     un tournoi publié. Complète la contrainte unique (résa vs résa) par « résa vs blocage »
--     et « résa vs tournoi ». S'applique à TOUT chemin d'insertion (RLS/RPC). ──────────────
create or replace function public.reservations_availability_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from 'booked' then
    return new; -- on ne garde que les créneaux réellement réservés
  end if;
  -- Créneau fermé hors app par le club ?
  if exists (
    select 1 from public.blocked_slots b
    where b.club_id = new.club_id and b.date_key = new.date_key and b.time = new.time and b.court = new.court
  ) then
    raise exception 'slot blocked' using errcode = '23514';
  end if;
  -- Créneau réservé à un TOURNOI publié ? (même logique que l'app : terrains/créneaux précis,
  -- ou tout le club si aucun n'est précisé, sur toute la plage début → fin.)
  if exists (
    select 1 from public.competitions c
    where c.club_id = new.club_id
      and c.status = 'published'
      and new.date_key >= c.date_key
      and new.date_key <= coalesce(c.end_date_key, c.date_key)
      and (coalesce(array_length(c.slots, 1), 0) = 0 or new.time = any (c.slots))
      and (coalesce(array_length(c.courts, 1), 0) = 0 or new.court = any (c.courts))
  ) then
    raise exception 'slot reserved for tournament' using errcode = '23514';
  end if;
  return new;
end;
$$;

drop trigger if exists reservations_availability_guard_trg on public.reservations;
create trigger reservations_availability_guard_trg
  before insert on public.reservations
  for each row execute function public.reservations_availability_guard();
