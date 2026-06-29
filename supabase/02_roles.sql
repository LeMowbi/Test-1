-- PadelConnect — rôles & demandes de club (à coller dans Supabase → SQL Editor → Run).
-- Ajoute la sécurité par RÔLE : operator (toi) / club (gérant) / player (par défaut).

-- ─── RÔLE sur les profils ────────────────────────────────────────────────────
alter table public.profiles add column if not exists role text not null default 'player';
alter table public.profiles add column if not exists managed_club_id text; -- club géré (compte club)

-- Empêche un utilisateur de se PROMOUVOIR lui-même.
-- IMPORTANT : il faut couvrir l'INSERT *et* l'UPDATE. À l'inscription, l'app fait un
-- `upsert` → la 1ʳᵉ fois c'est un INSERT : un client malveillant pourrait y glisser
-- `role:'operator'`. On force donc, pour toute écriture faite par le propriétaire du
-- compte (auth.uid() = new.id), role='player' et managed_club_id=null.
-- Seules les modifs côté serveur (SQL Editor / service role, où auth.uid() est nul)
-- peuvent attribuer un rôle 'club' ou 'operator'.
create or replace function public.protect_role_ins()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() = new.id then
    new.role := 'player';
    new.managed_club_id := null;
  end if;
  return new;
end;
$$;

create or replace function public.protect_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() = new.id
     and (new.role is distinct from old.role or new.managed_club_id is distinct from old.managed_club_id) then
    new.role := old.role;
    new.managed_club_id := old.managed_club_id;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_role_ins_trg on public.profiles;
create trigger protect_role_ins_trg
  before insert on public.profiles
  for each row execute function public.protect_role_ins();

drop trigger if exists protect_role_trg on public.profiles;
create trigger protect_role_trg
  before update on public.profiles
  for each row execute function public.protect_role();

-- ─── DEMANDES D'INSCRIPTION DE CLUB ──────────────────────────────────────────
create table if not exists public.club_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  area text,
  type text,
  courts integer,
  price_from integer,
  contact_phone text,
  message text,
  requested_by uuid references auth.users (id) on delete set null,
  status text not null default 'new', -- new | contacted | approved | rejected
  created_at timestamptz not null default now()
);

alter table public.club_requests enable row level security;

-- Tout utilisateur connecté peut soumettre SA demande.
drop policy if exists "club_requests_insert_own" on public.club_requests;
create policy "club_requests_insert_own" on public.club_requests
  for insert with check (auth.uid() = requested_by);

-- Seul l'OPÉRATEUR lit et gère les demandes.
drop policy if exists "club_requests_operator_select" on public.club_requests;
create policy "club_requests_operator_select" on public.club_requests
  for select using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'operator'));

drop policy if exists "club_requests_operator_update" on public.club_requests;
create policy "club_requests_operator_update" on public.club_requests
  for update using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'operator'));
