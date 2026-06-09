import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Chip } from '@/components/Chip';
import { Screen } from '@/components/Screen';
import { Button, Card, EmptyState, Txt } from '@/components/ui';
import { SAMPLE_SLOTS, getClub } from '@/data/clubs';
import { seedCompetitions } from '@/data/competitions';
import { useApp } from '@/store/AppContext';
import { fcfa } from '@/lib/format';
import { colors, radius, spacing } from '@/theme';

const DAYS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

function nextDays(n: number) {
  const now = new Date();
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    d.setHours(0, 0, 0, 0);
    const label = i === 0 ? "Aujourd'hui" : i === 1 ? 'Demain' : `${DAYS[d.getDay()]} ${d.getDate()}`;
    return { label, value: d.getTime() };
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
  const [friendIds, setFriendIds] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  if (!club) {
    return (
      <Screen back>
        <EmptyState icon="alert-circle-outline" title="Club introuvable" />
      </Screen>
    );
  }

  // Disponibilités gérées par le club (sinon créneaux standards).
  const openSlots = state.clubSlots[club.id] ?? SAMPLE_SLOTS;
  // Créneaux déjà réservés (anti double-réservation).
  const taken = state.reservations.filter((r) => r.clubId === club.id && r.date === date).map((r) => r.time);
  // Compétition au club ce jour-là → terrain indisponible.
  const comps = [...seedCompetitions, ...state.myCompetitions].filter((c) => c.clubId === club.id);
  const compToday = !!date && comps.some((c) => c.date === date);

  const toggleFriend = (id: string) =>
    setFriendIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const confirm = () => {
    if (!date || !slot) return;
    const dayValue = dates.find((d) => d.label === date)?.value ?? Date.now();
    const [h, m] = slot.split(':').map(Number);
    const startsAt = dayValue + h * 3600000 + m * 60000;
    const invited = state.friends.filter((f) => friendIds.includes(f.id)).map((f) => ({ id: f.id, name: f.name, confirmed: false }));
    addReservation({ clubId: club.id, clubName: club.name, date, time: slot, startsAt, players, invited });
    setDone(true);
  };

  if (done) {
    return (
      <Screen back title="Réservation">
        <Card style={{ alignItems: 'center', paddingVertical: spacing.xl, marginTop: spacing.lg }}>
          <Ionicons name="checkmark-circle" size={56} color={colors.green} />
          <Txt variant="h2" style={{ marginTop: spacing.md }}>
            Créneau réservé 🎾
          </Txt>
          <Txt variant="muted" style={{ marginTop: 4, textAlign: 'center' }}>
            Tu recevras un rappel avant le match.
          </Txt>
          <View style={styles.summary}>
            <Row label="Terrain" value={club.name} />
            <Row label="Date" value={date!} />
            <Row label="Heure" value={slot!} />
            <Row label="Joueurs" value={`${players}`} />
            {friendIds.length > 0 ? <Row label="Amis invités" value={`${friendIds.length}`} /> : null}
            <Row label="Tarif indicatif" value={`dès ${fcfa(club.priceFrom)}/h`} />
          </View>
          <View style={{ alignSelf: 'stretch', gap: spacing.sm, marginTop: spacing.lg }}>
            <Button label="Retour à l'accueil" onPress={() => router.push('/')} full />
            <Button label="Réserver un autre créneau" variant="ghost" onPress={() => { setDone(false); setSlot(null); setFriendIds([]); }} full />
          </View>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen back title="Réserver" subtitle={club.name}>
      <Label text="Choisis une date" />
      <View style={styles.wrap}>
        {dates.map((d) => (
          <Chip key={d.label} label={d.label} active={d.label === date} onPress={() => { setDate(d.label); setSlot(null); }} size="lg" />
        ))}
      </View>

      {compToday ? (
        <View style={styles.banner}>
          <Ionicons name="trophy" size={16} color={colors.gold} />
          <Txt variant="small" color={colors.text} style={{ flex: 1 }}>
            Une compétition a lieu ce jour à {club.name} — le terrain n'est pas réservable.
          </Txt>
        </View>
      ) : null}

      <Label text={date ? 'Choisis un créneau' : 'Choisis un créneau (choisis d’abord une date)'} />
      <View style={styles.wrap}>
        {openSlots.map((s) => {
          const isTaken = !!date && taken.includes(s);
          const blocked = !date || isTaken || compToday;
          return (
            <Chip key={s} label={isTaken ? `${s} · pris` : s} active={s === slot} disabled={blocked} onPress={() => setSlot(s)} size="lg" />
          );
        })}
        {openSlots.length === 0 ? (
          <Txt variant="small" color={colors.textFaint} style={{ marginTop: spacing.sm }}>
            Aucun créneau ouvert par le club pour le moment.
          </Txt>
        ) : null}
      </View>

      <Label text="Nombre de joueurs" />
      <View style={styles.wrap}>
        {[2, 3, 4].map((p) => (
          <Chip key={p} label={`${p} joueurs`} active={p === players} onPress={() => setPlayers(p)} size="lg" />
        ))}
      </View>

      {state.friends.length > 0 ? (
        <>
          <Label text="Inviter des amis (optionnel)" />
          <View style={styles.wrap}>
            {state.friends.map((f) => (
              <Chip key={f.id} label={f.name} icon={friendIds.includes(f.id) ? 'checkmark' : 'person-add'} active={friendIds.includes(f.id)} onPress={() => toggleFriend(f.id)} />
            ))}
          </View>
        </>
      ) : null}

      <Card style={styles.priceRow}>
        <Txt variant="muted">Tarif indicatif</Txt>
        <Txt variant="price">dès {fcfa(club.priceFrom)} / heure</Txt>
      </Card>

      <View style={{ marginTop: spacing.lg }}>
        <Button label="Réserver le créneau" icon="checkmark" onPress={confirm} disabled={!date || !slot} full />
        <Txt variant="small" color={colors.textFaint} style={{ marginTop: spacing.sm, textAlign: 'center' }}>
          Réservation sans paiement en ligne. Le tarif se règle directement au club. Annulation jusqu'à 5h avant.
        </Txt>
      </View>
    </Screen>
  );
}

function Label({ text }: { text: string }) {
  return (
    <Txt variant="label" color={colors.textFaint} style={{ marginTop: spacing.lg }}>
      {text}
    </Txt>
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
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.goldSoft,
    borderWidth: 1,
    borderColor: colors.gold,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.lg },
  summary: { alignSelf: 'stretch', marginTop: spacing.lg, gap: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
