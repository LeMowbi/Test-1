-- PadelConnect — suppression de compte (exigence App Store / Google Play) + réinitialisation
-- du mot de passe. À coller dans Supabase → SQL Editor → Run. Idempotent.
--
-- Pourquoi : Apple et Google imposent qu'un utilisateur puisse SUPPRIMER son compte depuis
-- l'app. On le fait côté SERVEUR (fonction SECURITY DEFINER) car seul le rôle propriétaire
-- peut toucher auth.users. La suppression de la ligne auth.users cascade automatiquement sur
-- profiles / reservations / referrals / reservation_participants (toutes en ON DELETE CASCADE),
-- et met à NULL les traces conservées (support_messages, club_requests).

-- ─── Suppression définitive de MON compte (l'utilisateur connecté, lui seul) ───
create or replace function public.delete_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;
  -- La cascade ON DELETE depuis auth.users efface profil, réservations, parrainages et
  -- participations ; les messages de support et demandes de club gardent leur trace (auteur
  -- mis à NULL). Aucune donnée personnelle ne subsiste après cette ligne.
  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_account() from public, anon;
grant execute on function public.delete_account() to authenticated;
