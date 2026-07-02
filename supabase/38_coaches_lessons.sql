-- PadelConnect — COACHS & COURS + PHOTOS DE CLUB (à coller dans Supabase → SQL Editor → Run).
-- Idempotent.
--
-- 1) PHOTOS : la fiche club gagne une photo « de profil » (cover, montrée sur la carte avant
--    d'ouvrir la fiche) et une photo PAR TERRAIN — en plus de la galerie générale existante.
-- 2) COACHS : le gérant promeut un COMPTE JOUEUR existant (retrouvé par téléphone) en coach de
--    son club. Le coach obtient alors son « Espace Coach » : disponibilités, tarif indicatif,
--    demandes de cours à accepter/refuser.
-- 3) COURS : un joueur demande un cours = coach + créneau + terrain du club. LE TERRAIN N'EST
--    RÉSERVÉ QUE LORSQUE LE COACH ACCEPTE : l'acceptation crée la réservation (soumise aux
--    mêmes barrières anti double-réservation), que le club confirme ensuite comme d'habitude.
--    La commission PadelConnect reste calculée sur la réservation du terrain — inchangée.

-- ── 1) club_config : cover + photos par terrain ─────────────────────────────────
alter table public.club_config add column if not exists cover_url text;
alter table public.club_config add column if not exists court_photos jsonb; -- {"Terrain 1": "https://…", …}

-- upsert_club_config gagne 2 paramètres → la signature change : on supprime l'ancienne
-- (les clients existants appellent par paramètres NOMMÉS : les nouveaux défauts s'appliquent).
drop function if exists public.upsert_club_config(text, text[], text[], jsonb, jsonb, text[]);
create or replace function public.upsert_club_config(
  p_club_id text,
  p_slots text[] default null,
  p_courts text[] default null,
  p_offers jsonb default null,
  p_coaches jsonb default null,
  p_photos text[] default null,
  p_cover_url text default null,
  p_court_photos jsonb default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and (p.managed_club_id = p_club_id or p.role = 'operator')
  ) then
    return false;
  end if;
  insert into public.club_config (club_id, slots, courts, offers, coaches, photos, cover_url, court_photos)
    values (p_club_id, p_slots, p_courts, p_offers, p_coaches, p_photos, nullif(p_cover_url, ''), p_court_photos)
    on conflict (club_id) do update set
      slots = coalesce(excluded.slots, public.club_config.slots),
      courts = coalesce(excluded.courts, public.club_config.courts),
      offers = coalesce(excluded.offers, public.club_config.offers),
      coaches = coalesce(excluded.coaches, public.club_config.coaches),
      photos = coalesce(excluded.photos, public.club_config.photos),
      -- '' = « retirer la cover » (null = champ non fourni → on garde l'existante).
      cover_url = case
        when p_cover_url = '' then null
        else coalesce(p_cover_url, public.club_config.cover_url)
      end,
      court_photos = coalesce(excluded.court_photos, public.club_config.court_photos),
      updated_at = now();
  return true;
end;
$$;

grant execute on function public.upsert_club_config(text, text[], text[], jsonb, jsonb, text[], text, jsonb) to authenticated;

-- ── 2) Coachs : comptes promus par leur club ────────────────────────────────────
create table if not exists public.coaches (
  user_id uuid primary key references auth.users (id) on delete cascade,
  club_id text not null,
  specialty text not null default '',
  price integer, -- tarif indicatif du cours (FCFA, réglé au coach, hors app)
  slots text[] not null default '{}', -- créneaux où il donne cours (mêmes heures 1h30 que le club)
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.coaches enable row level security;

-- Lecture publique (fiche club, annuaire) — les infos coach sont volontairement publiques.
drop policy if exists "coaches_select" on public.coaches;
create policy "coaches_select" on public.coaches for select using (true);
-- Aucune policy d'écriture : tout passe par les fonctions SECURITY DEFINER ci-dessous.

-- Le gérant promeut un compte en coach de SON club (retrouvé par les 10 derniers chiffres).
create or replace function public.club_add_coach(p_club_id text, p_phone text, p_specialty text default '')
returns table (status text, coach_id uuid, name text)
language plpgsql
security definer
set search_path = public
as $$
declare
  cid uuid;
  cname text;
begin
  if not public.can_manage_club(p_club_id) then
    return query select 'forbidden'::text, null::uuid, null::text; return;
  end if;
  if length(regexp_replace(coalesce(p_phone, ''), '\D', '', 'g')) < 8 then
    return query select 'not_found'::text, null::uuid, null::text; return;
  end if;
  select p.id, trim(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, ''))
    into cid, cname
    from public.profiles p
    where right(regexp_replace(p.phone, '\D', '', 'g'), 10) = right(regexp_replace(p_phone, '\D', '', 'g'), 10)
    limit 1;
  if cid is null then
    return query select 'not_found'::text, null::uuid, null::text; return;
  end if;
  if exists (select 1 from public.coaches c where c.user_id = cid and c.active) then
    return query select 'already'::text, cid, cname; return;
  end if;
  -- (Ré)activation : un coach retiré puis re-promu retrouve sa fiche (dispos conservées).
  insert into public.coaches (user_id, club_id, specialty, active)
    values (cid, p_club_id, coalesce(p_specialty, ''), true)
    on conflict (user_id) do update set club_id = excluded.club_id, active = true;
  return query select 'ok'::text, cid, cname;
end;
$$;

grant execute on function public.club_add_coach(text, text, text) to authenticated;

-- Le gérant retire un coach de SON club (désactivation — l'historique de cours reste).
create or replace function public.club_remove_coach(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_club text;
begin
  select club_id into v_club from public.coaches where user_id = p_user_id;
  if v_club is null or not public.can_manage_club(v_club) then return false; end if;
  update public.coaches set active = false where user_id = p_user_id;
  return true;
end;
$$;

grant execute on function public.club_remove_coach(uuid) to authenticated;

-- Le coach règle SA fiche : spécialité, tarif indicatif, disponibilités.
create or replace function public.coach_update_profile(p_specialty text, p_price integer, p_slots text[])
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.coaches
    set specialty = coalesce(p_specialty, specialty),
        price = p_price,
        slots = coalesce(p_slots, slots)
    where user_id = auth.uid() and active;
  return found;
end;
$$;

grant execute on function public.coach_update_profile(text, integer, text[]) to authenticated;

-- Coachs ACTIFS d'un club, avec leur nom de profil (profiles n'est jamais exposé directement).
create or replace function public.fetch_club_coaches(p_club_id text)
returns table (user_id uuid, name text, specialty text, price integer, slots text[])
language sql
security definer
set search_path = public
as $$
  select c.user_id,
         coalesce(nullif(trim(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, '')), ''), 'Coach'),
         c.specialty, c.price, c.slots
  from public.coaches c
  join public.profiles p on p.id = c.user_id
  where c.club_id = p_club_id and c.active
  order by 2;
$$;

grant execute on function public.fetch_club_coaches(text) to authenticated;

-- Ma fiche coach (pour afficher l'« Espace Coach » au bon compte) — null si pas coach actif.
create or replace function public.my_coach_profile()
returns table (club_id text, specialty text, price integer, slots text[])
language sql
security definer
set search_path = public
as $$
  select c.club_id, c.specialty, c.price, c.slots
  from public.coaches c
  where c.user_id = auth.uid() and c.active;
$$;

grant execute on function public.my_coach_profile() to authenticated;

-- ── 3) Cours : demande → acceptation du coach → réservation du terrain ─────────
create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references auth.users (id) on delete cascade,
  coach_name text not null default '', -- figé à la demande (affichage « Cours avec X » côté élève)
  club_id text not null,
  club_name text not null default '', -- fourni à la demande (les 9 clubs de base ne sont pas en table clubs)
  student_id uuid not null references auth.users (id) on delete cascade,
  student_name text not null default '',
  date_key text not null,
  date_label text not null default '',
  "time" text not null,
  court text not null,
  starts_at bigint not null,
  price integer, -- prix du TERRAIN (figé à la demande — repris par la réservation créée)
  status text not null default 'pending', -- pending | accepted | declined | cancelled
  reservation_id uuid,
  created_at timestamptz not null default now(),
  responded_at timestamptz
);

alter table public.lessons enable row level security;

-- Visible par l'élève, le coach, et le gérant du club concerné.
drop policy if exists "lessons_select" on public.lessons;
create policy "lessons_select" on public.lessons
  for select using (auth.uid() = student_id or auth.uid() = coach_id or public.can_manage_club(club_id));
-- Aucune policy d'écriture : tout passe par les RPC SECURITY DEFINER.

create index if not exists lessons_coach_idx on public.lessons (coach_id);
create index if not exists lessons_student_idx on public.lessons (student_id);

-- L'ÉLÈVE demande un cours. Le terrain n'est PAS réservé ici — seulement à l'acceptation.
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
begin
  if auth.uid() is null or auth.uid() = p_coach then return null; end if;
  -- Le coach doit être ACTIF dans CE club et proposer CE créneau.
  if not exists (
    select 1 from public.coaches c
    where c.user_id = p_coach and c.club_id = p_club_id and c.active and p_time = any (c.slots)
  ) then
    return null;
  end if;
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

-- LE COACH répond. Accepter = créer la RÉSERVATION du terrain au nom de l'élève (mêmes
-- barrières anti double-réservation : si le créneau est parti entre-temps → 'conflict').
-- Le club confirme ensuite la réservation comme n'importe laquelle (sa validation à lui).
create or replace function public.respond_lesson(p_id uuid, p_accept boolean)
returns text -- 'ok' | 'declined' | 'conflict' | 'forbidden' | 'gone'
language plpgsql
security definer
set search_path = public
as $$
declare
  l record;
  s record;
  res_id uuid;
begin
  -- « for update » : deux réponses simultanées ne peuvent pas créer deux réservations.
  select * into l from public.lessons where id = p_id and status = 'pending' for update;
  if l.id is null then return 'gone'; end if;
  if l.coach_id <> auth.uid() then return 'forbidden'; end if;

  if not p_accept then
    update public.lessons set status = 'declined', responded_at = now() where id = p_id;
    return 'declined';
  end if;

  -- Coach retiré par le club entre-temps : il ne peut plus accepter — la demande est refusée
  -- proprement (l'élève est prévenu par le push « declined » du webhook lessons).
  if not exists (
    select 1 from public.coaches c where c.user_id = l.coach_id and c.club_id = l.club_id and c.active
  ) then
    update public.lessons set status = 'declined', responded_at = now() where id = p_id;
    return 'gone';
  end if;

  if l.starts_at <= (extract(epoch from now()) * 1000)::bigint then
    update public.lessons set status = 'declined', responded_at = now() where id = p_id;
    return 'gone'; -- le créneau est déjà passé : plus rien à réserver
  end if;

  select first_name, last_name, phone into s from public.profiles where id = l.student_id;
  begin
    insert into public.reservations (
      user_id, club_id, club_name, date_key, date_label, "time", starts_at, court, price,
      players, invited, booked_by_name, booked_by_phone, coach_name, club_confirmed, status
    )
    select l.student_id,
           l.club_id,
           -- Nom du club stocké à la demande (les 9 clubs de base ne sont pas en table clubs).
           coalesce(nullif(l.club_name, ''), (select name from public.clubs c where c.id = l.club_id), l.club_id),
           l.date_key, l.date_label, l."time", l.starts_at, l.court, l.price,
           1, '[]'::jsonb,
           coalesce(nullif(trim(coalesce(s.first_name, '') || ' ' || coalesce(s.last_name, '')), ''), 'Un joueur'),
           s.phone,
           -- Nom du coach figé à la demande ; repli sur le profil si vide (anciennes lignes).
           coalesce(nullif(l.coach_name, ''), (select coalesce(nullif(trim(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, '')), ''), 'Coach')
              from public.profiles p where p.id = l.coach_id)),
           false, 'booked'
    returning id into res_id;
  exception when others then
    -- Terrain pris/bloqué/tournoi entre-temps (barrière reservations_availability_guard).
    return 'conflict';
  end;

  update public.lessons set status = 'accepted', responded_at = now(), reservation_id = res_id where id = p_id;
  return 'ok';
end;
$$;

grant execute on function public.respond_lesson(uuid, boolean) to authenticated;

-- L'ÉLÈVE annule sa demande tant qu'elle est en attente (un cours accepté = une réservation :
-- il s'annule alors comme une réservation normale, règle des 5 h incluse).
create or replace function public.cancel_lesson_request(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.lessons set status = 'cancelled', responded_at = now()
    where id = p_id and student_id = auth.uid() and status = 'pending';
  return found;
end;
$$;

grant execute on function public.cancel_lesson_request(uuid) to authenticated;

-- ── 4) Réservations : trace du cours (affichage « Cours avec X ») ───────────────
alter table public.reservations add column if not exists coach_name text;
