// Recherche d'un joueur par numéro (pour ajouter un ami EN VRAI). La résolution se fait
// côté serveur (fonction SECURITY DEFINER) : on n'expose jamais la table des profils.

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
