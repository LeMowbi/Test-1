// Parrainage : code dérivé du userId (stable, sans collision pour une bêta). Le lien
// parrain→filleul est créé côté SERVEUR au moment de l'inscription (trigger handle_new_user,
// à partir du code saisi) ; ici on ne fait que générer mon code et compter mes filleuls.

import { supabase } from './supabase';

// Code lisible dérivé du userId Supabase (12 hex en MAJUSCULES → 48 bits, collision
// négligeable). Déterministe → régénérable sans stockage côté app ; stocké côté serveur
// pour la résolution du code à l'inscription.
export function referralCodeForUser(userId: string): string {
  return userId.replace(/-/g, '').slice(0, 12).toUpperCase();
}

// Nombre de filleuls : lignes où je suis le PARRAIN. On filtre explicitement sur
// referrer_id (sinon la RLS « referrer OU referee » compterait aussi mon propre parrain).
export async function fetchReferralCount(myUserId: string): Promise<number> {
  const { count, error } = await supabase.from('referrals').select('id', { count: 'exact', head: true }).eq('referrer_id', myUserId);
  if (error || count == null) return 0;
  return count;
}
