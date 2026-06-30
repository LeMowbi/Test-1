// Ajout d'une réservation au calendrier de l'appareil (avec accord de l'utilisateur).
// No-op silencieux sur le web. Renvoie un statut pour que l'UI affiche un retour clair.

import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';
import { HOUR_MS, MINUTE_MS } from './days';

const isNative = Platform.OS === 'ios' || Platform.OS === 'android';
const SESSION_MS = HOUR_MS + 30 * MINUTE_MS; // 1h30

export type CalendarResult = 'added' | 'denied' | 'unavailable';

// Calendrier modifiable par défaut (iOS : getDefaultCalendarAsync ; Android : 1er inscriptible).
async function writableCalendarId(): Promise<string | null> {
  if (Platform.OS === 'ios') {
    const def = await Calendar.getDefaultCalendarAsync();
    if (def?.id) return def.id;
  }
  const cals = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  return cals.find((c) => c.allowsModifications)?.id ?? null;
}

export async function addReservationToCalendar(input: {
  clubName: string;
  startsAt: number;
  court: string;
  area?: string;
}): Promise<CalendarResult> {
  if (!isNative) return 'unavailable';
  try {
    const { granted } = await Calendar.requestCalendarPermissionsAsync();
    if (!granted) return 'denied';
    const calId = await writableCalendarId();
    if (!calId) return 'unavailable';
    await Calendar.createEventAsync(calId, {
      title: `Padel · ${input.clubName}`,
      startDate: new Date(input.startsAt),
      endDate: new Date(input.startsAt + SESSION_MS),
      location: input.area ? `${input.clubName} — ${input.area}` : input.clubName,
      notes: `Terrain : ${input.court}. Réservé via PadelConnect.`,
      alarms: [{ relativeOffset: -120 }], // rappel 2h avant
    });
    return 'added';
  } catch {
    return 'unavailable';
  }
}
