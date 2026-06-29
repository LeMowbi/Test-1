// Parrainage : code dérivé du userId (stable, sans collision pour une bêta), résolution
// et comptage côté serveur (table referrals + fonction claim_referral).

import { supabase } from './supabase';

// Code lisible dérivé du userId Supabase (8 hex en MAJUSCULES). Déterministe → on peut le
// régénérer sans le stocker côté app ; on le stocke côté serveur pour la résolution.
export function referralCodeForUser(userId: string): string {
  return userId.replace(/-/g, '').slice(0, 8).toUpperCase();
}

// Le filleul réclame le code de son parrain (après son inscription). Renvoie true si le
// lien a été créé (code valide, pas d'auto-parrainage, pas déjà parrainé).
export async function claimReferral(code: string): Promise<boolean> {
  const clean = code.trim();
  if (clean.length < 4) return false;
  const { data, error } = await supabase.rpc('claim_referral', { code: clean });
  return !error && data === true;
}

// Nombre de filleuls (lignes où je suis le parrain). RLS « select own » l'autorise.
export async function fetchReferralCount(): Promise<number> {
  const { count, error } = await supabase.from('referrals').select('id', { count: 'exact', head: true });
  if (error || count == null) return 0;
  return count;
}
