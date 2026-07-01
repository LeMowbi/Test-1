import { Redirect, useLocalSearchParams } from 'expo-router';
import { setPendingReferral } from '@/lib/pendingReferral';

// Cible d'un Universal Link padelconnectci.com/invite/CODE : on met le code de parrainage de côté
// puis on renvoie à la racine. Le RootLayout redirige alors vers l'onboarding (si pas de compte),
// où le code est pré-rempli — ou vers l'accueil si l'utilisateur est déjà connecté.
export default function InviteRoute() {
  const { code } = useLocalSearchParams<{ code?: string }>();
  if (code) setPendingReferral(Array.isArray(code) ? code[0] : code);
  return <Redirect href="/" />;
}
