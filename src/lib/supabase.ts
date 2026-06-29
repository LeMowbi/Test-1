import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Connexion au backend Supabase (cerveau central : comptes, réservations, clubs…).
// L'URL et la clé « publishable » sont PUBLIQUES par conception (faites pour vivre dans
// l'app) — la vraie sécurité vient des règles Row Level Security côté serveur.
const SUPABASE_URL = 'https://bqeoqcqvqrqcrvkccxij.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_n2_mCCNviA-fbtpSZiz2ew_mnEqGeG_';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: AsyncStorage, // session persistée sur l'appareil (reste connecté)
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // app native, pas de redirection navigateur
  },
});

// ─── Normalisation du numéro (Côte d'Ivoire) ─────────────────────────────────
// Un même numéro peut être saisi de plusieurs façons : « 0707070707 »,
// « +225 07 07 07 07 07 », « 00225 0707070707 »… Sans canonicalisation, chaque
// variante crée un compte DIFFÉRENT (ou pire, deux numéros se confondent). On
// ramène tout à une forme unique « 225 + numéro local 10 chiffres » avant de
// construire l'e-mail interne, pour que connexion et inscription tombent juste.
// Numéros mobiles ivoiriens : 10 chiffres locaux (le 0 de tête fait partie du
// numéro), indicatif pays 225. On NE retire JAMAIS le 0 local (il porte le préfixe
// opérateur 07/05/01…). On ne touche pas aux numéros étrangers (autre indicatif).
export function normalizePhone(phone: string): string {
  let d = phone.replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2); // préfixe international « 00 » → retiré
  if (d.startsWith('225') && d.length === 13) return d; // déjà 225 + 10 chiffres
  if (d.length === 10) return `225${d}`; // numéro local → on préfixe l'indicatif
  return d; // tout le reste (étranger, format inhabituel) : laissé tel quel
}

// ─── Connexion « téléphone + mot de passe » SANS SMS ─────────────────────────
// Supabase n'autorise le canal « téléphone » qu'avec un fournisseur SMS payant.
// Astuce : on mappe le numéro vers un e-mail interne non routable et on s'appuie sur
// l'auth e-mail/mot de passe (confirmation d'e-mail désactivée côté Supabase).
// L'utilisateur ne voit JAMAIS cet e-mail : il saisit seulement son numéro.
export function phoneToAuthEmail(phone: string): string {
  return `p${normalizePhone(phone)}@phone.padelconnect.app`;
}
