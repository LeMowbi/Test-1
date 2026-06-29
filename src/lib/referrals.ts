// Parrainage : code dérivé du userId (stable, sans collision pour une bêta), résolution
// et comptage côté serveur (table referrals + fonction claim_referral).

import { supabase } from './supabase';

// Code lisible dérivé du userId Supabase (12 hex en MAJUSCULES → 48 bits, collision
// négligeable). Déterministe → régénérable sans stockage côté app ; stocké côté serveur
// pour la résolution du code à l'inscription.
export function referralCodeForUser(userId: string): string {
  return userId.replace(/-/g, '').slice(0, 12).toUpperCase();
}

// Le filleul réclame le code de son parrain (après son inscription). Renvoie true si le
// lien a été créé (code valide, pas d'auto-parrainage, pas déjà parrainé).
export async function claimReferral(code: string): Promise<boolean> {
  const clean = code.trim();
  if (clean.length < 4) return false;
  const { data, error } = await supabase.rpc('claim_referral', { code: clean });
  return !error && data === true;
}

// Nombre de filleuls : lignes où je suis le PARRAIN. On filtre explicitement sur
// referrer_id (sinon la RLS « referrer OU referee » compterait aussi mon propre parrain).
export async function fetchReferralCount(myUserId: string): Promise<number> {
  const { count, error } = await supabase.from('referrals').select('id', { count: 'exact', head: true }).eq('referrer_id', myUserId);
  if (error || count == null) return 0;
  return count;
}
