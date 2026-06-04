import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Chip } from '@/components/Chip';
import { Screen } from '@/components/Screen';
import { Button, Card, EmptyState, Txt } from '@/components/ui';
import { SAMPLE_SLOTS, getClub } from '@/data/clubs';
import { useApp } from '@/store/AppContext';
import { fcfa } from '@/lib/format';
import { colors, spacing } from '@/theme';

const DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

function nextDays(n: number) {
  const now = new Date();
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    return i === 0 ? "Aujourd'hui" : i === 1 ? 'Demain' : `${DAYS[d.getDay()]} ${d.getDate()}`;
  });
}

export default function ReserverScreen() {
  const { clubId } = useLocalSearchParams();
  const router = useRouter();
  const club = getClub(clubId);
  const { state, addReservation } = useApp();

  const dates = useMemo(() => nextDays(5), []);
  const [date, setDate] = useState<string | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [players, setPlayers] = useState(4);
  const [done, setDone] = useState(false);

  if (!club) {
    return (
      <Screen back>
        <EmptyState icon="alert-circle-outline" title="Club introuvable" />
      </Screen>
    );
  }

  const slots = Array.from(new Set([...SAMPLE_SLOTS, ...(state.clubSlots[club.id] ?? [])])).sort();

  const confirm = () => {
    if (!date || !slot) return;
    addReservation({ clubId: club.id, clubName: club.name, date, time: slot, players });
    setDone(true);
  };

  if (done) {
    return (
      <Screen back title="Réservation">
        <Card style={{ alignItems: 'center', paddingVertical: spacing.xl, marginTop: spacing.lg }}>
          <Ionicons name="checkmark-circle" size={56} color={colors.green} />
          <Txt variant="h2" style={{ marginTop: spacing.md }}>
            Réservation confirmée
          </Txt>
          <Txt variant="muted" style={{ marginTop: 4, textAlign: 'center' }}>
            (Démo — aucun paiement réel n’a été effectué.)
          </Txt>
          <View style={styles.summary}>
            <Row label="Terrain" value={club.name} />
            <Row label="Date" value={date!} />
            <Row label="Heure" value={slot!} />
            <Row label="Joueurs" value={`${players}`} />
            <Row label="Tarif indicatif" value={`dès ${fcfa(club.priceFrom)}/h`} />
          </View>
          <View style={{ alignSelf: 'stretch', gap: spacing.sm, marginTop: spacing.lg }}>
            <Button label="Retour à l'accueil" onPress={() => router.push('/')} full />
            <Button label="Réserver un autre créneau" variant="ghost" onPress={() => setDone(false)} full />
          </View>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen back title="Réserver" subtitle={club.name}>
      <Txt variant="label" color={colors.textFaint} style={{ marginTop: spacing.md }}>
        Choisis une date
      </Txt>
      <View style={styles.wrap}>
        {dates.map((d) => (
          <Chip key={d} label={d} active={d === date} onPress={() => setDate(d)} size="lg" />
        ))}
      </View>

      <Txt variant="label" color={colors.textFaint} style={{ marginTop: spacing.lg }}>
        Choisis un créneau
      </Txt>
      <View style={styles.wrap}>
        {slots.map((s) => (
          <Chip key={s} label={s} active={s === slot} onPress={() => setSlot(s)} size="lg" />
        ))}
      </View>

      <Txt variant="label" color={colors.textFaint} style={{ marginTop: spacing.lg }}>
        Nombre de joueurs
      </Txt>
      <View style={styles.wrap}>
        {[2, 3, 4].map((p) => (
          <Chip key={p} label={`${p} joueurs`} active={p === players} onPress={() => setPlayers(p)} size="lg" />
        ))}
      </View>

      <View style={{ marginTop: spacing.xl }}>
        <Button label="Confirmer la réservation" icon="checkmark" onPress={confirm} disabled={!date || !slot} full />
        <Txt variant="small" color={colors.textFaint} style={{ marginTop: spacing.sm, textAlign: 'center' }}>
          Prototype : la réservation est simulée et enregistrée sur ton téléphone.
        </Txt>
      </View>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Txt variant="muted">{label}</Txt>
      <Txt variant="h3" style={{ fontSize: 15 }}>
        {value}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  summary: { alignSelf: 'stretch', marginTop: spacing.lg, gap: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
