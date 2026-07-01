-- PadelConnect — durcissements complémentaires (audit total). Supabase → SQL Editor → Run.
-- Idempotent.

-- 1) AVATARS : autoriser la suppression de SA propre photo (parité avec le bucket club-photos).
--    Sans cette policy, les avatars restaient orphelins (cf. CGU « suppression de tes données »).
drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- 2) Policies UPDATE de l'OPÉRATEUR sans WITH CHECK → on ajoute la clause (la ligne résultante
--    doit rester conforme, sinon un UPDATE pourrait la sortir du périmètre autorisé).
drop policy if exists "club_requests_operator_update" on public.club_requests;
create policy "club_requests_operator_update" on public.club_requests
  for update
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'operator'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'operator'));

drop policy if exists "support_operator_update" on public.support_messages;
create policy "support_operator_update" on public.support_messages
  for update
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'operator'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'operator'));

-- 3) Barrière de disponibilité : elle ne couvrait que l'INSERT. Un UPDATE qui repasse une
--    réservation en 'booked' sur un créneau fermé/tournoi la contournait. Même fonction, aussi
--    en BEFORE UPDATE (la fonction ne bloque que si la ligne devient 'booked').
drop trigger if exists reservations_availability_guard_upd on public.reservations;
create trigger reservations_availability_guard_upd
  before update on public.reservations
  for each row execute function public.reservations_availability_guard();
