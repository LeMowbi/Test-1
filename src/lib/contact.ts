import { Linking } from 'react-native';

// Lance l'appel téléphonique natif (on retire les espaces du numéro).
export function callNumber(phone: string): void {
  Linking.openURL(`tel:${phone.replace(/\s/g, '')}`).catch(() => {});
}
