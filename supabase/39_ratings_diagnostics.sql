-- PadelConnect — NOTES MOYENNES sur les cartes + DIAGNOSTICS opérateur in-app
-- (à coller dans Supabase → SQL Editor → Run). Idempotent.
--
-- 1) fetch_club_ratings : moyenne + nombre d'avis PAR CLUB en un seul appel léger, pour que
--    les cartes (accueil, liste des clubs) affichent la vraie note « 4.2 ★ (12) » comme la
--    fiche — sans télécharger tous les avis ni un fetch par club.
-- 2) operator_diag_summary / operator_recent_errors : le porteur (non technique, sans
--    terminal) lit la santé de l'app DANS l'Espace opérateur au lieu du Dashboard Supabase.

-- ── 1) Agrégat public des avis (les avis sont déjà en lecture publique) ─────────
create or replace function public.fetch_club_ratings()
returns table (club_id text, avg_rating numeric, review_count integer)
language sql
security definer
set search_path = public
as $$
  select r.club_id,
         round(avg(r.rating)::numeric, 1),
         count(*)::integer
  from public.reviews r
  group by r.club_id;
$$;

grant execute on function public.fetch_club_ratings() to authenticated;

-- ── 2) Diagnostics — résumé 7 jours (réservé à l'opérateur) ────────────────────
create or replace function public.operator_diag_summary()
returns table (errors_7d integer, events_7d integer, top_context text)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'operator') then
    return; -- pas opérateur → aucune ligne (l'app affiche « indisponible »)
  end if;
  return query
    select
      (select count(*)::integer from public.app_errors e where e.created_at > now() - interval '7 days'),
      (select count(*)::integer from public.app_events v where v.created_at > now() - interval '7 days'),
      (select e.context from public.app_errors e
         where e.created_at > now() - interval '7 days' and e.context is not null
         group by e.context order by count(*) desc limit 1);
end;
$$;

grant execute on function public.operator_diag_summary() to authenticated;

-- ── Dernières erreurs anonymisées (réservé à l'opérateur) ──────────────────────
create or replace function public.operator_recent_errors(p_limit integer default 5)
returns table (message text, context text, platform text, app_version text, created_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'operator') then
    return;
  end if;
  return query
    select e.message, e.context, e.platform, e.app_version, e.created_at
    from public.app_errors e
    order by e.created_at desc
    limit least(greatest(coalesce(p_limit, 5), 1), 20);
end;
$$;

grant execute on function public.operator_recent_errors(integer) to authenticated;
