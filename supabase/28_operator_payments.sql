-- PadelConnect — suivi des RÈGLEMENTS opérateur, côté serveur (à coller dans Supabase →
-- SQL Editor → Run). Idempotent.
--
-- Le statut « Payé / Décompte envoyé » d'une commission (club × semaine) ou d'un tournoi joueur
-- encaissé ne vivait que dans le téléphone de l'opérateur → une réinstallation ou un 2ᵉ appareil
-- faisait réapparaître comme « à facturer » des sommes déjà réglées. On le persiste ici.

create table if not exists public.operator_payments (
  key text primary key, -- « <clubId>:<AAAA-MM-JJ> » (commission hebdo) ou « tourn:<uuid> »
  status text not null check (status in ('sent', 'paid')),
  updated_at timestamptz not null default now()
);

alter table public.operator_payments enable row level security;

-- Réservé à l'opérateur (lecture + écriture). Aucun autre rôle n'y accède.
drop policy if exists "operator_payments_op" on public.operator_payments;
create policy "operator_payments_op" on public.operator_payments for all
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'operator'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'operator'));

-- Fixe (ou retire, si p_status vide/'tofacture') le statut de règlement d'une clé. Opérateur seul.
create or replace function public.set_operator_payment(p_key text, p_status text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'operator') then
    return false;
  end if;
  if coalesce(p_status, '') in ('', 'tofacture') then
    delete from public.operator_payments where key = p_key;
  else
    insert into public.operator_payments (key, status) values (p_key, p_status)
      on conflict (key) do update set status = excluded.status, updated_at = now();
  end if;
  return true;
end;
$$;

grant execute on function public.set_operator_payment(text, text) to authenticated;
