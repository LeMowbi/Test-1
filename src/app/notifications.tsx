import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';
import { Reveal } from '@/components/Reveal';
import { Screen } from '@/components/Screen';
import { Card, IconCircle, SectionHeader, Tag, Txt } from '@/components/ui';
import { colors, radius, spacing } from '@/theme';

// APERÇU §B (version connectée) — écran STATIQUE de démonstration, NON câblé.
// Les notifications réelles (push, état partagé) relèvent du serveur (cf. « La suite »).
type Notif = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  text: string;
  time: string;
  tint: string;
  bg: string;
  unread?: boolean;
};
const TODAY: Notif[] = [
  {
    icon: 'checkmark-circle',
    title: 'Réservation confirmée',
    text: 'Padel Club Riviera · 19h30 · Terrain 2',
    time: 'il y a 10 min',
    tint: colors.green,
    bg: colors.greenSoft,
    unread: true,
  },
  {
    icon: 'flame',
    title: 'Place libérée',
    text: 'Un créneau 18h00 vient de se libérer près de toi',
    time: 'il y a 1 h',
    tint: colors.coral,
    bg: colors.coralSoft,
    unread: true,
  },
];
const WEEK: Notif[] = [
  {
    icon: 'chatbubble-ellipses',
    title: 'Réponse du club',
    text: 'Cocody Padel a confirmé ta demande',
    time: 'hier',
    tint: colors.blue,
    bg: colors.blueSoft,
  },
  {
    icon: 'trophy',
    title: 'Niveau mis à jour',
    text: 'Tournoi officiel gagné : niveau 4.00 (+0.50)',
    time: 'lun.',
    tint: colors.amber,
    bg: colors.amberSoft,
  },
  {
    icon: 'notifications',
    title: 'Rappel de match',
    text: 'Demain 19h30 — pense à prévenir ton équipe',
    time: 'lun.',
    tint: colors.purple,
    bg: colors.purpleSoft,
  },
];

export default function NotificationsScreen() {
  return (
    <Screen back title="Notifications" subtitle="Aperçu — version connectée">
      <Reveal>
        <View style={styles_note}>
          <Ionicons name="information-circle-outline" size={16} color={colors.textFaint} />
          <Txt variant="small" color={colors.textMuted} style={{ flex: 1 }}>
            Aperçu de démonstration. Les notifications en temps réel arriveront avec la version connectée.
          </Txt>
        </View>

        <View style={{ marginTop: spacing.lg }}>
          <SectionHeader title="Aujourd'hui" />
          <Card style={{ gap: spacing.md }}>
            {TODAY.map((n, i) => (
              <Row key={i} n={n} />
            ))}
          </Card>
        </View>

        <View style={{ marginTop: spacing.xl }}>
          <SectionHeader title="Cette semaine" />
          <Card style={{ gap: spacing.md }}>
            {WEEK.map((n, i) => (
              <Row key={i} n={n} />
            ))}
          </Card>
        </View>
      </Reveal>
    </Screen>
  );
}

function Row({ n }: { n: Notif }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md }}>
      <IconCircle icon={n.icon} color={n.tint} bg={n.bg} size={40} />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Txt variant="h3" style={{ fontSize: 15 }}>
            {n.title}
          </Txt>
          {n.unread ? <Tag label="Nouveau" tone="signature" /> : null}
        </View>
        <Txt variant="muted" style={{ marginTop: 2 }}>
          {n.text}
        </Txt>
        <Txt variant="small" color={colors.textFaint} style={{ marginTop: 2 }}>
          {n.time}
        </Txt>
      </View>
    </View>
  );
}

const styles_note = {
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  gap: spacing.sm,
  backgroundColor: colors.surfaceAlt,
  borderRadius: radius.md,
  padding: spacing.md,
  marginTop: spacing.sm,
};
