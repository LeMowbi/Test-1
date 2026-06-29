-- PadelConnect — inscription par e-mail (à coller dans Supabase → SQL Editor → Run).
-- Avec la CONFIRMATION d'e-mail activée, il n'y a PAS de session au moment du signUp :
-- l'app ne peut donc pas créer le profil elle-même (la RLS exige auth.uid()). On crée
-- donc le profil AUTOMATIQUEMENT, côté serveur, à la création du compte, à partir des
-- informations passées à l'inscription (user_metadata). Idempotent.
--
-- ⚙️ À FAIRE AUSSI dans le tableau de bord Supabase (une seule fois) :
--   1) Authentication → Providers → Email : activer « Confirm email ».
--   2) Authentication → URL Configuration → Redirect URLs : ajouter  padelco://
--      (et, pour tester en dev, l'URL Expo affichée par l'app, ex. exp://…).

-- L'e-mail réel est aussi recopié dans le profil (lecture simple côté app ; les comptes
-- « téléphone » historiques gardent un e-mail interne non routable, sans impact).
alter table public.profiles add column if not exists email text;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  ref_code text;
  ref_id uuid;
begin
  -- Profil (créé une seule fois). On NE force aucun rôle ici : il reste 'player'
  -- par défaut. La promotion 'club'/'operator' passe par approve_club_request / SQL.
  insert into public.profiles (id, first_name, last_name, phone, email, birth_date, gender, level, referral_code)
    values (
      new.id,
      nullif(meta->>'first_name', ''),
      nullif(meta->>'last_name', ''),
      nullif(meta->>'phone', ''),
      new.email,
      nullif(meta->>'birth_date', ''),
      nullif(meta->>'gender', ''),
      coalesce((meta->>'level')::numeric, 3.0),
      upper(substr(replace(new.id::text, '-', ''), 1, 12)) -- même code que l'app (referralCodeForUser)
    )
    on conflict (id) do nothing;

  -- Parrainage : si un code a été saisi à l'inscription, on crée le lien parrain→filleul.
  ref_code := upper(trim(coalesce(meta->>'referred_by', '')));
  if length(ref_code) >= 4 then
    select id into ref_id from public.profiles where referral_code = ref_code limit 1;
    if ref_id is not null and ref_id <> new.id then
      insert into public.referrals (referrer_id, referee_id)
        values (ref_id, new.id)
        on conflict (referee_id) do nothing;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
