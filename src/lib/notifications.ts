// Rappels de match — façade NEUTRE pour l'instant.
//
// Les vraies notifications locales (expo-notifications) nécessitent d'activer la
// capacité « Push Notifications » côté Apple (App ID + profil de provisionnement), une
// opération ponctuelle à faire avant de réintégrer le module natif. En attendant, ces
// fonctions ne font rien : l'interrupteur « Rappels » du profil reste une préférence,
// sans planifier de notification. L'API publique est identique à la future version
// native, pour un rebranchement en un seul fichier le moment venu.

export type ReminderInput = { id: string; clubName: string; time: string; startsAt: number; court: string };

export async function ensureNotificationPermission(): Promise<boolean> {
  return false;
}

export async function scheduleMatchReminder(_r: ReminderInput): Promise<void> {
  // no-op (notifications natives non encore activées)
}

export async function cancelMatchReminder(_reservationId: string): Promise<void> {
  // no-op
}

export async function syncMatchReminders(_reservations: ReminderInput[], _enabled: boolean): Promise<void> {
  // no-op
}
