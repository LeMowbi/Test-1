-- PadelConnect — fiabilité TEMPORAIRE : flag réinitialisé après 2 semaines (à coller dans
-- Supabase → SQL Editor → Run). Idempotent — remplace la fonction de 21_reliability.sql.
--
-- Une erreur ponctuelle (annulation, voire absence) ne doit pas coller à un joueur pour
-- toujours. On ne compte donc que les annulations ET les absences des 14 DERNIERS JOURS
-- (référence : la date du créneau concerné). Au-delà, le compteur retombe naturellement à 0.

create or replace function public.player_reliability(p_user_ids uuid[])
returns table (user_id uuid, cancelled int, no_show int)
language plpgsql
security definer
set search_path = public
as $$
declare
  cutoff bigint := (extract(epoch from now()) * 1000)::bigint - 14 * 86400000; -- il y a 14 jours (ms)
begin
  if not exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('club', 'operator')) then
    return; -- réservé aux clubs et à l'opérateur
  end if;
  return query
    select r.user_id,
      count(*) filter (where r.status = 'cancelled' and r.starts_at >= cutoff)::int,
      count(*) filter (where r.status = 'no_show' and r.starts_at >= cutoff)::int
    from public.reservations r
    where r.user_id = any (p_user_ids)
    group by r.user_id;
end;
$$;

grant execute on function public.player_reliability(uuid[]) to authenticated;
