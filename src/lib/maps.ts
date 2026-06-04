import { Linking } from 'react-native';
import { mapsUrl, type Club } from '@/data/clubs';

// Ouvre la position du club dans Google Maps (recherche par nom — pas de fausses coordonnées).
export function openMaps(club: Club): void {
  Linking.openURL(mapsUrl(club)).catch(() => {});
}
