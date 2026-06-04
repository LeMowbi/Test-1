import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { RatingStars } from '@/components/RatingStars';
import { Screen } from '@/components/Screen';
import { Card, IconCircle, SectionHeader, Tag, Txt } from '@/components/ui';
import { getClub } from '@/data/clubs';
import { coaches, type Coach } from '@/data/coaches';
import { useApp } from '@/store/AppContext';
import { fcfa, initials } from '@/lib/format';
import { colors, radius, spacing } from '@/theme';

function CoachRow({ coach }: { coach: Coach }) {
  const router = useRouter();
  return (
    <Card onPress={() => router.push(`/coachs/${coach.id}`)} style={{ marginBottom: spacing.md }}>
      <View style={styles.row}>
        <View style={[styles.avatar, { backgroundColor: coach.accent + '22', borderColor: coach.accent + '55' }]}>
          <Txt variant="h2" color={coach.accent}>
            {initials(coach.name)}
          </Txt>
        </View>
        <View style={{ flex: 1 }}>
          <Txt variant="h3">{coach.name}</Txt>
          <Txt variant="muted">
            {coach.level} · {coach.area}
          </Txt>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <RatingStars value={coach.rating} size={13} />
            <Txt variant="small" color={colors.textMuted}>
              {coach.rating.toFixed(1)}
            </Txt>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Txt variant="price" style={{ fontSize: 15 }}>
            {fcfa(coach.pricePerHour)}
          </Txt>
          <Txt variant="small" color={colors.textFaint}>
            /heure
          </Txt>
        </View>
      </View>
      <View style={styles.specs}>
        {coach.specialties.map((s) => (
          <Tag key={s} label={s} tone="neutral" />
        ))}
      </View>
    </Card>
  );
}

export default function CoachsScreen() {
  const { state } = useApp();
  const clubCoaches = Object.entries(state.clubCoaches).flatMap(([clubId, list]) =>
    list.map((c) => ({ ...c, clubName: getClub(clubId)?.name ?? 'Club' }))
  );

  return (
    <Screen back title="Coachs" subtitle="Réserve un entraînement à Abidjan">
      <View style={styles.note}>
        <Ionicons name="information-circle-outline" size={15} color={colors.textFaint} />
        <Txt variant="small" color={colors.textFaint} style={{ flex: 1 }}>
          Profils de démonstration — à remplacer par de vrais coachs partenaires.
        </Txt>
      </View>

      {coaches.map((c) => (
        <CoachRow key={c.id} coach={c} />
      ))}

      {clubCoaches.length > 0 ? (
        <View style={{ marginTop: spacing.xl }}>
          <SectionHeader title="Coachs des clubs" />
          {clubCoaches.map((c) => (
            <Card key={c.id} style={{ marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <IconCircle icon="person" color={colors.gold} bg={colors.goldSoft} size={40} />
              <View style={{ flex: 1 }}>
                <Txt variant="h3" style={{ fontSize: 15 }}>
                  {c.name}
                </Txt>
                <Txt variant="muted">
                  {c.specialty} · {c.clubName}
                </Txt>
              </View>
              <Tag label="Club" tone="neutral" />
            </Card>
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  specs: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
  note: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
});
