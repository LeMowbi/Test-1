// Code de parrainage capté depuis un lien d’invitation (padelconnectci.com/invite/CODE) AVANT que
// l’écran d’inscription ne soit monté. On le met de côté ici (mémoire + AsyncStorage pour survivre
// à un cold start) ; l’onboarding le lit puis l’efface pour pré-remplir le champ « code parrain ».

import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'padelco_pending_referral';
let inMemory: string | null = null;

// Nettoie un code brut (URL-decodé, alphanumérique majuscule) — évite d’injecter n’importe quoi.
function clean(code: string): string {
  return decodeURIComponent(code)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 24);
}

export function setPendingReferral(code: string): void {
  const c = clean(code);
  if (!c) return;
  inMemory = c;
  void AsyncStorage.setItem(KEY, c);
}

// Renvoie le code en attente (mémoire d’abord, puis stockage), sans l’effacer.
export async function getPendingReferral(): Promise<string | null> {
  if (inMemory) return inMemory;
  try {
    return await AsyncStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function clearPendingReferral(): void {
  inMemory = null;
  void AsyncStorage.removeItem(KEY);
}
