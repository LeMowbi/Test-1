-- PadelConnect — messages d'aide / signalements (à coller dans Supabase → SQL Editor → Run).
-- Un joueur écrit un problème → l'opérateur le lit dans son espace. Idempotent.

create table if not exists public.support_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  name text,            -- nom affiché (copié au moment de l'envoi)
  contact_phone text,   -- numéro pour recontacter
  message text not null,
  status text not null default 'new', -- new | read | resolved
  created_at timestamptz not null default now()
);

alter table public.support_messages enable row level security;

-- Tout utilisateur connecté peut envoyer SON message.
drop policy if exists "support_insert_own" on public.support_messages;
create policy "support_insert_own" on public.support_messages
  for insert with check (auth.uid() = user_id);

-- Seul l'OPÉRATEUR lit et gère les messages.
drop policy if exists "support_operator_select" on public.support_messages;
create policy "support_operator_select" on public.support_messages
  for select using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'operator'));

drop policy if exists "support_operator_update" on public.support_messages;
create policy "support_operator_update" on public.support_messages
  for update using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'operator'));
