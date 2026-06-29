-- PadelConnect — CLUBS côté serveur + approbation d'une demande (à coller dans
-- Supabase → SQL Editor → Run). Permet à l'opérateur d'APPROUVER une demande de club :
-- 1) ça crée le club (visible par tous les joueurs, sans rebuild de l'app),
-- 2) ça donne au demandeur l'accès à SON Espace Club (role='club' + managed_club_id).
-- Idempotent : relançable sans casser l'existant.

-- ─── TABLE CLUBS ─────────────────────────────────────────────────────────────
-- Les 9 clubs « de base » restent embarqués dans l'app (offline, stables). Cette table
-- ne contient que les clubs AJOUTÉS via l'app — l'app les fusionne avec les clubs de base.
create table if not exists public.clubs (
  id text primary key,
  name text not null,
  area text,
  city text not null default 'Abidjan',
  type text not null default 'Mixte', -- 'Couvert' | 'Extérieur' | 'Mixte'
  courts integer not null default 1,
  price_from integer not null default 10000,
  contact_phone text,
  blurb text,
  amenities text[] not null default '{}',
  status text not null default 'active', -- active | hidden
  created_at timestamptz not null default now()
);

alter table public.clubs enable row level security;

-- Tout compte connecté lit les clubs ACTIFS (pour la liste, la réservation…).
drop policy if exists "clubs_select_active" on public.clubs;
create policy "clubs_select_active" on public.clubs
  for select using (status = 'active');

-- L'opérateur lit/gère tout (y compris masqués).
drop policy if exists "clubs_operator_all" on public.clubs;
create policy "clubs_operator_all" on public.clubs
  for all using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'operator'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'operator'));

-- ─── APPROBATION d'une demande de club ───────────────────────────────────────
-- Appelable UNIQUEMENT par l'opérateur (SECURITY DEFINER). À partir d'une demande
-- (club_requests), crée le club, donne l'accès gérant au demandeur, et marque la
-- demande « approved ». Renvoie l'id du club créé (ou existant si déjà approuvé).
create or replace function public.approve_club_request(p_request_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  is_op boolean;
  req public.club_requests%rowtype;
  new_id text;
begin
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'operator') into is_op;
  if not is_op then return null; end if;

  select * into req from public.club_requests where id = p_request_id;
  if req.id is null then return null; end if;

  -- id lisible : slug du nom + 8 caractères de l'id de la demande (anti-collision).
  new_id := left(regexp_replace(lower(coalesce(req.name, 'club')), '[^a-z0-9]+', '-', 'g'), 24);
  new_id := trim(both '-' from new_id);
  if new_id = '' then new_id := 'club'; end if;
  new_id := new_id || '-' || substr(replace(p_request_id::text, '-', ''), 1, 8);

  insert into public.clubs (id, name, area, type, courts, price_from, contact_phone)
    values (
      new_id,
      req.name,
      req.area,
      coalesce(req.type, 'Mixte'),
      coalesce(req.courts, 1),
      coalesce(req.price_from, 10000),
      req.contact_phone
    )
    on conflict (id) do nothing;

  -- Accès gérant au demandeur (s'il est connu) : role='club' + son club.
  if req.requested_by is not null then
    update public.profiles
      set role = 'club', managed_club_id = new_id
      where id = req.requested_by;
  end if;

  update public.club_requests set status = 'approved' where id = p_request_id;
  return new_id;
end;
$$;

grant execute on function public.approve_club_request(uuid) to authenticated;
