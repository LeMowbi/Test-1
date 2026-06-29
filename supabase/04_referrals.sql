-- PadelConnect — parrainage (à coller dans Supabase → SQL Editor → Run).
-- Chaque profil a un CODE de parrainage ; un filleul « réclame » le code de son parrain.
-- Idempotent : relançable sans casser l'existant.

-- Code de parrainage par profil (dérivé du userId côté app, stocké ici pour la résolution).
alter table public.profiles add column if not exists referral_code text;
create unique index if not exists profiles_referral_code_idx
  on public.profiles (referral_code) where referral_code is not null;

-- Lien parrain → filleul (1 parrain max par filleul).
create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references auth.users (id) on delete cascade,
  referee_id uuid not null references auth.users (id) on delete cascade unique,
  created_at timestamptz not null default now()
);

alter table public.referrals enable row level security;

-- Parrain ET filleul peuvent lire leurs lignes (le parrain pour COMPTER ses filleuls).
drop policy if exists "referrals_select_own" on public.referrals;
create policy "referrals_select_own" on public.referrals
  for select using (auth.uid() = referrer_id or auth.uid() = referee_id);

-- « Réclamer » un parrainage : fonction SECURITY DEFINER pour résoudre le code SANS
-- exposer les profils des autres (la RLS profiles reste « ma ligne seulement »).
-- Garde-fous : pas d'auto-parrainage, un seul parrain par filleul (on conflict do nothing).
create or replace function public.claim_referral(code text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare ref uuid;
begin
  if auth.uid() is null then return false; end if;
  select id into ref from public.profiles where referral_code = upper(trim(code)) limit 1;
  if ref is null or ref = auth.uid() then return false; end if;
  insert into public.referrals (referrer_id, referee_id)
    values (ref, auth.uid())
    on conflict (referee_id) do nothing;
  return true;
end;
$$;

grant execute on function public.claim_referral(text) to authenticated;
