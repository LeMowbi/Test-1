import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { PhotoPlaceholder } from './PhotoPlaceholder';
import { RatingStars } from './RatingStars';
import { Card, Tag, Txt } from './ui';
import type { Club } from '@/data/clubs';
import { fcfa, initials } from '@/lib/format';
import { colors, spacing } from '@/theme';

export function ClubCard({ club, compact }: { club: Club; compact?: boolean }) {
  const router = useRouter();
  const go = () => router.push(`/club/${club.id}`);

  if (compact) {
    return (
      <Card onPress={go} style={styles.compact}>
        <PhotoPlaceholder accent={club.accent} initials={initials(club.name)} height={96} showBadge={false} />
        <Txt variant="h3" numberOfLines={1} style={{ marginTop: spacing.sm }}>
          {club.name}
        </Txt>
        <View style={styles.areaRow}>
          <Ionicons name="location-outline" size={13} color={colors.textMuted} />
          <Txt variant="muted" numberOfLines={1} style={{ flex: 1 }}>
            {club.area}
          </Txt>
        </View>
        <View style={styles.ratingRow}>
          <RatingStars value={club.rating} size={13} />
          <Txt variant="small" color={colors.textMuted}>
            {club.rating.toFixed(1)}
          </Txt>
        </View>
      </Card>
    );
  }

  return (
    <Card onPress={go} style={{ padding: spacing.sm, marginBottom: spacing.md }}>
      <PhotoPlaceholder accent={club.accent} initials={initials(club.name)} height={140} />
      <View style={{ padding: spacing.sm, paddingTop: spacing.md }}>
        <View style={styles.titleRow}>
          <Txt variant="h3" numberOfLines={1} style={{ flex: 1 }}>
            {club.name}
          </Txt>
          <Tag label={club.type} tone="neutral" />
        </View>

        <View style={styles.areaRow}>
          <Ionicons name="location-outline" size={14} color={colors.textMuted} />
          <Txt variant="muted">
            {club.area} · {club.courts} terrains
          </Txt>
        </View>

        <View style={styles.footer}>
          <View style={styles.ratingRow}>
            <RatingStars value={club.rating} size={14} />
            <Txt variant="small" color={colors.textMuted}>
              {club.rating.toFixed(1)} ({club.reviewsCount})
            </Txt>
          </View>
          <Txt variant="small" color={colors.textMuted}>
            dès {fcfa(club.priceFrom)}/h
          </Txt>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  compact: { width: 220, padding: spacing.sm },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  areaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
});
