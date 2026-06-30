-- PadelConnect — liste d'amis côté serveur (à coller dans Supabase → SQL Editor → Run).
-- Idempotent.
--
-- Jusqu'ici les amis vivaient SEULEMENT dans le téléphone → perdus à la réinstallation, et
-- invisibles d'un appareil à l'autre. Cette table rend la liste RÉELLE et synchronisée : un
-- lien (moi → un ami), résolu par numéro sans jamais exposer la table profiles. Chacun ne voit
-- QUE ses propres liens (RLS). L'ajout se fait via une fonction SECURITY DEFINER (même règle de
-- correspondance que find_player_by_phone / link_participants : 10 derniers chiffres).

create table if not exists public.friends (
  user_id uuid not null references auth.users (id) on delete cascade,
  friend_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id),
  check (user_id <> friend_id)
);

alter table public.friends enable row level security;

-- Je ne vois (et ne retire) que MES liens. L'insertion passe par la RPC ci-dessous.
drop policy if exists "friends_select" on public.friends;
create policy "friends_select" on public.friends for select using (auth.uid() = user_id);

drop policy if exists "friends_delete" on public.friends;
create policy "friends_delete" on public.friends for delete using (auth.uid() = user_id);

-- Ma liste d'amis, enrichie du profil de chacun (nom, niveau, numéro) — pour l'affichage.
create or replace function public.fetch_friends()
returns table (friend_id uuid, name text, level numeric, phone text)
language sql
security definer
set search_path = public
as $$
  select f.friend_id,
    trim(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, '')),
    p.level,
    p.phone
  from public.friends f
  join public.profiles p on p.id = f.friend_id
  where f.user_id = auth.uid()
  order by f.created_at desc;
$$;

grant execute on function public.fetch_friends() to authenticated;

-- Ajoute un ami par son numéro : résout le numéro → joueur PadelConnect (10 derniers chiffres),
-- crée le lien (idempotent), et renvoie son vrai nom + niveau. Aucune ligne si introuvable.
create or replace function public.add_friend_by_phone(p_phone text)
returns table (friend_id uuid, name text, level numeric)
language plpgsql
security definer
set search_path = public
as $$
declare
  fid uuid;
begin
  if length(regexp_replace(p_phone, '\D', '', 'g')) < 8 then
    return;
  end if;
  select p.id into fid from public.profiles p
    where right(regexp_replace(p.phone, '\D', '', 'g'), 10) = right(regexp_replace(p_phone, '\D', '', 'g'), 10)
      and p.id <> auth.uid()
    limit 1;
  if fid is null then
    return;
  end if;
  insert into public.friends (user_id, friend_id) values (auth.uid(), fid)
    on conflict do nothing;
  return query
    select p.id,
      trim(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, '')),
      p.level
    from public.profiles p
    where p.id = fid;
end;
$$;

grant execute on function public.add_friend_by_phone(text) to authenticated;

-- Retire un ami (mon lien vers lui). Renvoie toujours true (idempotent).
create or replace function public.remove_friend(p_friend_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.friends where user_id = auth.uid() and friend_id = p_friend_id;
  return true;
end;
$$;

grant execute on function public.remove_friend(uuid) to authenticated;
