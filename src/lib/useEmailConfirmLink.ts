// Confirmation d'e-mail par DEEP LINK. Quand l'utilisateur clique le lien reçu par mail,
// l'app s'ouvre sur une URL « padelco://auth-callback?code=… ». Ce hook échange ce `code`
// contre une vraie session (flux PKCE), puis prévient l'app (onConfirmed) pour qu'elle
// recharge le profil et entre dans l'écran d'accueil.

import * as Linking from 'expo-linking';
import { useEffect } from 'react';
import { supabase } from './supabase';

type Result = 'confirmed' | 'error';

// Extrait le `code` de confirmation d'une URL d'ouverture (ou null si ce n'en est pas une).
function codeFromUrl(url: string | null): string | null {
  if (!url) return null;
  const code = Linking.parse(url).queryParams?.code;
  return typeof code === 'string' ? code : null;
}

export function useEmailConfirmLink(onResult: (r: Result) => void) {
  useEffect(() => {
    let active = true;

    const handle = async (url: string | null) => {
      const code = codeFromUrl(url);
      if (!code) return;
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!active) return;
      onResult(error ? 'error' : 'confirmed');
    };

    // 1) App ouverte « à froid » directement par le lien.
    void Linking.getInitialURL().then(handle);
    // 2) App déjà ouverte en arrière-plan → on reçoit l'URL en événement.
    const sub = Linking.addEventListener('url', ({ url }) => void handle(url));

    return () => {
      active = false;
      sub.remove();
    };
  }, [onResult]);
}
