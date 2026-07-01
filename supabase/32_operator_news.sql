-- PadelConnect — actu d'accueil de l'opérateur, SYNCHRONISÉE (Supabase → SQL Editor → Run).
-- Idempotent.
--
-- L'opérateur publie une actu (bandeau en haut de l'accueil joueur). Jusqu'ici elle ne vivait
-- QUE dans son téléphone → les joueurs ne la voyaient jamais, alors que l'écran l'affirmait.
-- Cette table la rend RÉELLE : une seule ligne (clé 'home'), lisible par tous, modifiable par le
-- seul opérateur. `news_id` change quand le contenu change → l'actu réapparaît chez le joueur qui
-- l'avait fermée (la fermeture retient l'ancien id).

create table if not exists public.operator_news (
  key text primary key default 'home',
  news_id text not null,
  title text not null,
  subtitle text,
  link text,
  updated_at timestamptz not null default now()
);

alter table public.operator_news enable row level security;

-- Lecture par TOUS les utilisateurs connectés (bandeau d'accueil).
drop policy if exists "operator_news_select" on public.operator_news;
create policy "operator_news_select" on public.operator_news for select to authenticated using (true);

-- Écriture (insert/update/delete) réservée à l'OPÉRATEUR.
drop policy if exists "operator_news_write" on public.operator_news;
create policy "operator_news_write" on public.operator_news
  for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'operator'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'operator'));
