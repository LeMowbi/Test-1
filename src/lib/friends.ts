// Recherche d'un joueur par numéro (pour ajouter un ami EN VRAI) et liste d'amis serveur.
// Tout passe par des fonctions SECURITY DEFINER : on n'expose jamais la table des profils.

import { type Friend } from '@/data/user';
import { supabase } from './supabase';

export type FoundPlayer = { name: string; level?: number };

// Renvoie le joueur PadelConnect correspondant au numéro, ou null s'il n'a pas (encore) de compte.
export async function findPlayerByPhone(phone: string): Promise<FoundPlayer | null> {
  const { data, error } = await supabase.rpc('find_player_by_phone', { p_phone: phone.trim() });
  if (error || !data || (Array.isArray(data) && data.length === 0)) return null;
  const row = (Array.isArray(data) ? data[0] : data) as { first_name: string | null; last_name: string | null; level: number | null };
  const name = `${row.first_name ?? ''} ${row.last_name ?? ''}`.trim();
  if (!name) return null;
  return { name, level: row.level != null ? Number(row.level) : undefined };
}

type FriendRow = { friend_id: string; name: string | null; level: number | null; phone?: string | null };

// Ma liste d'amis (synchronisée). null = échec réseau → l'appelant garde l'existant
// (≠ tableau vide = succès « aucun ami »).
export async function fetchFriends(): Promise<Friend[] | null> {
  const { data, error } = await supabase.rpc('fetch_friends');
  if (error) return null;
  return ((data ?? []) as FriendRow[])
    .filter((r) => (r.name ?? '').trim().length > 0)
    .map((r) => ({
      id: r.friend_id,
      name: (r.name ?? '').trim(),
      phone: r.phone ?? undefined,
      level: r.level != null ? Number(r.level) : undefined,
    }));
}

// Ajoute un ami par numéro, côté serveur. Renvoie son lien (id stable serveur) ou null si
// introuvable / échec — l'appelant ne touche alors pas au miroir local.
export async function addFriendByPhone(phone: string): Promise<Friend | null> {
  const { data, error } = await supabase.rpc('add_friend_by_phone', { p_phone: phone.trim() });
  if (error || !data || (Array.isArray(data) && data.length === 0)) return null;
  const row = (Array.isArray(data) ? data[0] : data) as { friend_id: string; name: string | null; level: number | null };
  const name = (row.name ?? '').trim();
  if (!name) return null;
  return { id: row.friend_id, name, phone: phone.trim() || undefined, level: row.level != null ? Number(row.level) : undefined };
}

// Retire un ami côté serveur. false si le réseau a refusé (on ne touche pas au miroir local).
export async function removeFriendOnServer(friendId: string): Promise<boolean> {
  const { error } = await supabase.rpc('remove_friend', { p_friend_id: friendId });
  return !error;
}
