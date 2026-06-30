-- PadelConnect — configuration de club partagée (à coller dans Supabase → SQL Editor → Run).
-- Idempotent.
--
-- Jusqu'ici, les horaires d'ouverture, terrains, offres/actus, coachs et photos saisis dans
-- l'Espace Club restaient SUR LE TÉLÉPHONE du gérant : invisibles des joueurs et perdus en cas
-- de réinstallation. Cette table les met côté serveur, lisibles par TOUS (comme club_overrides
-- pour la fiche), écrits UNIQUEMENT par le gérant du club (ou l'opérateur).
--
-- Mise à jour PARTIELLE : chaque paramètre nul est ignoré (on ne réécrit que ce qui change),
-- pour pouvoir pousser les horaires sans toucher aux photos, etc.

create table if not exists public.club_config (
  club_id text primary key,
  slots text[], -- horaires d'ouverture proposés (ex. {'07:30','09:00'})
  courts text[], -- noms des terrains (ex. {'Terrain 1','Terrain 2'})
  offers jsonb, -- [{id,kind,title,detail}]
  coaches jsonb, -- [{id,name,specialty,phone?}]
  photos text[], -- URLs publiques (bucket club-photos)
  updated_at timestamptz not null default now()
);

alter table public.club_config enable row level security;

-- Lecture publique : tout joueur connecté voit la config (affichage fiche + dispo).
drop policy if exists "club_config_select" on public.club_config;
create policy "club_config_select" on public.club_config for select using (true);

-- Écriture réservée au gérant du club concerné (ou à l'opérateur), via la fonction ci-dessous.
create or replace function public.upsert_club_config(
  p_club_id text,
  p_slots text[] default null,
  p_courts text[] default null,
  p_offers jsonb default null,
  p_coaches jsonb default null,
  p_photos text[] default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and (p.managed_club_id = p_club_id or p.role = 'operator')
  ) then
    return false; -- ni gérant de ce club, ni opérateur
  end if;
  insert into public.club_config (club_id, slots, courts, offers, coaches, photos)
    values (p_club_id, p_slots, p_courts, p_offers, p_coaches, p_photos)
    on conflict (club_id) do update set
      slots = coalesce(excluded.slots, public.club_config.slots),
      courts = coalesce(excluded.courts, public.club_config.courts),
      offers = coalesce(excluded.offers, public.club_config.offers),
      coaches = coalesce(excluded.coaches, public.club_config.coaches),
      photos = coalesce(excluded.photos, public.club_config.photos),
      updated_at = now();
  return true;
end;
$$;

grant execute on function public.upsert_club_config(text, text[], text[], jsonb, jsonb, text[]) to authenticated;

-- ─── Stockage des PHOTOS de club (bucket public « club-photos ») ──────────────
-- Chemin « {club_id}/... » → le 1er dossier est l'id du club. Lecture par tous ; écriture/
-- suppression réservées au gérant de ce club (ou à l'opérateur).
insert into storage.buckets (id, name, public)
values ('club-photos', 'club-photos', true)
on conflict (id) do nothing;

drop policy if exists "club_photos_read" on storage.objects;
create policy "club_photos_read" on storage.objects
  for select using (bucket_id = 'club-photos');

drop policy if exists "club_photos_write" on storage.objects;
create policy "club_photos_write" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'club-photos'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (p.managed_club_id = (storage.foldername(name))[1] or p.role = 'operator')
    )
  );

drop policy if exists "club_photos_update" on storage.objects;
create policy "club_photos_update" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'club-photos'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (p.managed_club_id = (storage.foldername(name))[1] or p.role = 'operator')
    )
  );

drop policy if exists "club_photos_delete" on storage.objects;
create policy "club_photos_delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'club-photos'
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and (p.managed_club_id = (storage.foldername(name))[1] or p.role = 'operator')
    )
  );
