import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Button, Card, Divider, EmptyState, Tag, Txt } from '@/components/ui';
import { seedCompetitions } from '@/data/competitions';
import { useApp } from '@/store/AppContext';
import { colors, spacing } from '@/theme';

export default function CompetitionDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { state } = useApp();
  const [registered, setRegistered] = useState(false);

  const key = Array.isArray(id) ? id[0] : id;
  const comp = [...state.myCompetitions, ...seedCompetitions].find((c) => c.id === key);

  if (!comp) {
    return (
      <Screen back>
        <EmptyState icon="alert-circle-outline" title="Compétition introuvable" />
      </Screen>
    );
  }

  const byClub = comp.organizerType === 'club';

  return (
    <Screen back title="Compétition">
      <Tag
        label={byClub ? `Organisé par ${comp.organizer}` : `Créé par ${comp.organizer} (joueur)`}
        tone={byClub ? 'neutral' : 'green'}
        icon={byClub ? 'business' : 'person'}
      />
      <Txt variant="display" style={{ fontSize: 26, marginTop: spacing.md }}>
        {comp.title}
      </Txt>

      <Card style={{ marginTop: spacing.lg }}>
        <View style={styles.reward}>
          <Ionicons name="gift" size={22} color={colors.gold} />
          <View style={{ flex: 1 }}>
            <Txt variant="label" color={colors.textFaint}>
              Récompense
            </Txt>
            <Txt variant="h3" color={colors.gold}>
              {comp.reward}
            </Txt>
          </View>
        </View>
        <Divider style={{ marginVertical: spacing.md }} />
        <Info icon="calendar-outline" label="Date" value={comp.date} />
        <Info icon="git-network-outline" label="Format" value={comp.format} />
        <Info icon="podium-outline" label="Niveau" value={comp.level} />
        <Info icon="cash-outline" label="Inscription" value={comp.fee} />
        <Info icon="people-outline" label="Places" value={`${comp.registered}/${comp.slots} inscrits`} />
      </Card>

      {byClub && comp.clubId ? (
        <Button
          label={`Voir ${comp.clubName}`}
          icon="location-outline"
          variant="secondary"
          onPress={() => router.push(`/club/${comp.clubId}`)}
        />
      ) : null}

      <View style={{ marginTop: spacing.lg }}>
        <Button
          label={registered ? 'Inscription enregistrée ✓' : "S'inscrire à la compétition"}
          icon={registered ? 'checkmark' : 'add'}
          variant={registered ? 'secondary' : 'primary'}
          onPress={() => setRegistered((v) => !v)}
          full
        />
        <Txt variant="small" color={colors.textFaint} style={{ marginTop: spacing.sm, textAlign: 'center' }}>
          Prototype : inscription simulée.
        </Txt>
      </View>
    </Screen>
  );
}

function Info({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.info}>
      <Ionicons name={icon} size={18} color={colors.textMuted} />
      <Txt variant="muted" style={{ width: 90 }}>
        {label}
      </Txt>
      <Txt variant="body" style={{ flex: 1, fontWeight: '600' }}>
        {value}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  reward: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  info: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 6 },
});
