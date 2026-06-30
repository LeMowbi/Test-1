-- PadelConnect — recherche d'un joueur par numéro (à coller dans Supabase → SQL Editor →
-- Run). Idempotent. Permet d'ajouter un ami EN VRAI : on retrouve un joueur PadelConnect par
-- son numéro, sans jamais exposer la table profiles (fonction SECURITY DEFINER, match exact
-- sur les 10 derniers chiffres comme link_participants). Renvoie au plus une ligne.

create or replace function public.find_player_by_phone(p_phone text)
returns table (first_name text, last_name text, level numeric)
language sql
security definer
set search_path = public
as $$
  select p.first_name, p.last_name, p.level
  from public.profiles p
  where length(regexp_replace(p_phone, '\D', '', 'g')) >= 8
    and right(regexp_replace(p.phone, '\D', '', 'g'), 10) = right(regexp_replace(p_phone, '\D', '', 'g'), 10)
    and p.id <> auth.uid() -- on ne se trouve pas soi-même
  limit 1;
$$;

grant execute on function public.find_player_by_phone(text) to authenticated;
