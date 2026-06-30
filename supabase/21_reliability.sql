-- PadelConnect — fiabilité des joueurs (absences) + commission réglable par club
-- (à coller dans Supabase → SQL Editor → Run). Idempotent.
--
-- 1) Absences (no-show) : le club marque « pas venu » une réservation — y compris quand le
--    joueur a appelé APRÈS le délai des 5h pour annuler (le club annule alors pour lui et
--    marque l'absence). Si le joueur est venu : rien à faire. La résa passe en statut
--    'no_show' → le créneau se libère (slot_occupancy ne compte que 'booked') et l'absence
--    est comptabilisée. Réservé au gérant DE CE club (ou à l'opérateur).
-- 2) Fiabilité : compteurs d'annulations + d'absences par joueur, visibles des clubs et de
--    l'opérateur (un joueur qui annule/abandonne souvent devient repérable).
-- 3) Commission : l'opérateur fixe un % PROPRE À CHAQUE club (accords différents).

-- ─── 1) Marquer une absence (club du club concerné, ou opérateur) ─────────────
create or replace function public.mark_no_show(p_id uuid, p_value boolean default true)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare allowed boolean;
begin
  select exists (
    select 1
    from public.reservations r
    join public.profiles p on p.id = auth.uid()
    where r.id = p_id
      and ((p.role = 'club' and p.managed_club_id = r.club_id) or p.role = 'operator')
  ) into allowed;
  if not allowed then return false; end if;
  if p_value then
    update public.reservations set status = 'no_show' where id = p_id and status in ('booked', 'no_show');
  else
    -- Annule l'absence (repasse en réservé) — possible seulement si le créneau est resté libre.
    update public.reservations set status = 'booked' where id = p_id and status = 'no_show';
  end if;
  return found;
exception when unique_violation then
  return false; -- le créneau a été repris entre-temps : retour à 'booked' impossible
end;
$$;

grant execute on function public.mark_no_show(uuid, boolean) to authenticated;

-- ─── 2) Compteurs de fiabilité par joueur (club / opérateur seulement) ────────
create or replace function public.player_reliability(p_user_ids uuid[])
returns table (user_id uuid, cancelled int, no_show int)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('club', 'operator')) then
    return; -- réservé aux clubs et à l'opérateur
  end if;
  return query
    select r.user_id,
      count(*) filter (where r.status = 'cancelled')::int,
      count(*) filter (where r.status = 'no_show')::int
    from public.reservations r
    where r.user_id = any (p_user_ids)
    group by r.user_id;
end;
$$;

grant execute on function public.player_reliability(uuid[]) to authenticated;

-- ─── 3) Commission propre à chaque club (réglée par l'opérateur) ──────────────
create table if not exists public.club_commission (
  club_id text primary key,
  rate numeric not null check (rate >= 0 and rate <= 1), -- 0.10 = 10 %
  updated_at timestamptz not null default now()
);

alter table public.club_commission enable row level security;

-- Lecture réservée à l'opérateur (donnée commerciale, pas pour les joueurs ni les clubs).
drop policy if exists "club_commission_select" on public.club_commission;
create policy "club_commission_select" on public.club_commission for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'operator'));

create or replace function public.set_club_commission(p_club_id text, p_rate numeric)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'operator') then
    return false; -- réservé à l'opérateur
  end if;
  if p_rate is null or p_rate < 0 or p_rate > 1 then
    return false;
  end if;
  insert into public.club_commission (club_id, rate)
    values (p_club_id, p_rate)
    on conflict (club_id) do update set rate = excluded.rate, updated_at = now();
  return true;
end;
$$;

grant execute on function public.set_club_commission(text, numeric) to authenticated;
