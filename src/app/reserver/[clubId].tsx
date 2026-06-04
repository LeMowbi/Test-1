import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import { Chip } from '@/components/Chip';
import { PaymentMethods } from '@/components/PaymentMethods';
import { Screen } from '@/components/Screen';
import { Button, Card, EmptyState, Txt } from '@/components/ui';
import { SAMPLE_SLOTS, getClub } from '@/data/clubs';
import { paymentLabel } from '@/data/payments';
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
  const [payment, setPayment] = useState<string | null>(null);
  const [split, setSplit] = useState(false);
  const [paying, setPaying] = useState(false);
  const [done, setDone] = useState(false);

  if (!club) {
    return (
      <Screen back>
        <EmptyState icon="alert-circle-outline" title="Club introuvable" />
      </Screen>
    );
  }

  const slots = Array.from(new Set([...SAMPLE_SLOTS, ...(state.clubSlots[club.id] ?? [])])).sort();
  // Créneaux déjà réservés (payés) pour ce club + cette date → indisponibles.
  const taken = state.reservations.filter((r) => r.clubId === club.id && r.date === date).map((r) => r.time);
  const perPlayer = Math.round(club.priceFrom / players);
  const amount = split ? perPlayer : club.priceFrom;

  const pay = () => {
    if (!date || !slot || !payment || paying) return;
    setPaying(true);
    // Paiement simulé : le créneau n'est validé/réservé qu'une fois le paiement "effectué".
    setTimeout(() => {
      addReservation({ clubId: club.id, clubName: club.name, date, time: slot, players, payment: paymentLabel(payment) });
      setPaying(false);
      setDone(true);
    }, 900);
  };

  if (done) {
    return (
      <Screen back title="Réservation">
        <Card style={{ alignItems: 'center', paddingVertical: spacing.xl, marginTop: spacing.lg }}>
          <Ionicons name="checkmark-circle" size={56} color={colors.green} />
          <Txt variant="h2" style={{ marginTop: spacing.md }}>
            Créneau réservé & payé
          </Txt>
          <Txt variant="muted" style={{ marginTop: 4, textAlign: 'center' }}>
            (Démo — paiement simulé, aucun débit réel.)
          </Txt>
          <View style={styles.summary}>
            <Row label="Terrain" value={club.name} />
            <Row label="Date" value={date!} />
            <Row label="Heure" value={slot!} />
            <Row label="Joueurs" value={`${players}`} />
            <Row label="Paiement" value={paymentLabel(payment)} />
            {split ? <Row label="Part / joueur" value={`≈ ${fcfa(perPlayer)}`} /> : <Row label="Montant payé" value={`≈ ${fcfa(amount)}`} />}
          </View>
          <View style={{ alignSelf: 'stretch', gap: spacing.sm, marginTop: spacing.lg }}>
            <Button label="Retour à l'accueil" onPress={() => router.push('/')} full />
            <Button label="Réserver un autre créneau" variant="ghost" onPress={() => { setDone(false); setSlot(null); }} full />
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
          <Chip key={d} label={d} active={d === date} onPress={() => { setDate(d); setSlot(null); }} size="lg" />
        ))}
      </View>

      <Txt variant="label" color={colors.textFaint} style={{ marginTop: spacing.lg }}>
        Choisis un créneau {date ? '' : '(choisis d’abord une date)'}
      </Txt>
      <View style={styles.wrap}>
        {slots.map((s) => {
          const isTaken = !!date && taken.includes(s);
          return (
            <Chip
              key={s}
              label={isTaken ? `${s} · réservé` : s}
              active={s === slot}
              disabled={!date || isTaken}
              onPress={() => setSlot(s)}
              size="lg"
            />
          );
        })}
      </View>

      <Txt variant="label" color={colors.textFaint} style={{ marginTop: spacing.lg }}>
        Nombre de joueurs
      </Txt>
      <View style={styles.wrap}>
        {[2, 3, 4].map((p) => (
          <Chip key={p} label={`${p} joueurs`} active={p === players} onPress={() => setPlayers(p)} size="lg" />
        ))}
      </View>

      <Txt variant="label" color={colors.textFaint} style={{ marginTop: spacing.lg }}>
        Mode de paiement
      </Txt>
      <View style={{ marginTop: spacing.sm }}>
        <PaymentMethods value={payment} onChange={setPayment} />
      </View>

      <Card style={styles.split}>
        <View style={{ flex: 1 }}>
          <Txt variant="h3" style={{ fontSize: 15 }}>
            Diviser entre joueurs
          </Txt>
          <Txt variant="muted">
            {split ? `Chacun paie ≈ ${fcfa(perPlayer)}` : 'Chacun paie sa part (terrain ÷ joueurs)'}
          </Txt>
        </View>
        <Switch value={split} onValueChange={setSplit} trackColor={{ true: colors.gold, false: colors.border }} thumbColor={colors.white} />
      </Card>

      <View style={{ marginTop: spacing.xl }}>
        <Button
          label={paying ? 'Paiement en cours…' : `Payer ≈ ${fcfa(amount)}`}
          icon={paying ? 'hourglass' : 'card'}
          onPress={pay}
          disabled={!date || !slot || !payment || paying}
          full
        />
        <Txt variant="small" color={colors.textFaint} style={{ marginTop: spacing.sm, textAlign: 'center' }}>
          Le créneau n’est réservé qu’une fois le paiement effectué (paiement simulé en démo).
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
  split: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.lg },
  summary: { alignSelf: 'stretch', marginTop: spacing.lg, gap: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
