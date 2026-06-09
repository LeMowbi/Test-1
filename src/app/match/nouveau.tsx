import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Chip } from '@/components/Chip';
import { LevelStepper } from '@/components/LevelStepper';
import { Screen } from '@/components/Screen';
import { Button, Card, Txt, type IconName } from '@/components/ui';
import { SAMPLE_SLOTS, clubsByName } from '@/data/clubs';
import { seedCompetitions } from '@/data/competitions';
import { LOOKING_OPTIONS, levelLabel, type Looking } from '@/data/matches';
import { useApp } from '@/store/AppContext';
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

export default function NouveauMatch() {
  const router = useRouter();
  const { state, addReservation, addMatch } = useApp();

  const dates = useMemo(() => nextDays(5), []);
  const [clubId, setClubId] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [levelValue, setLevelValue] = useState(state.level);
  const [looking, setLooking] = useState<Looking>('partenaire');
  const [places, setPlaces] = useState(1);
  const [friendIds, setFriendIds] = useState<string[]>([]);
  const [visibility, setVisibility] = useState(state.defaultVisibility);

  const club = clubsByName.find((c) => c.id === clubId) ?? null;
  const openSlots = club ? state.clubSlots[club.id] ?? SAMPLE_SLOTS : [];
  const taken = club ? state.reservations.filter((r) => r.clubId === club.id && r.date === date).map((r) => r.time) : [];
  const selectedDayValue = dates.find((d) => d.label === date)?.value;
  const comps = club ? [...seedCompetitions, ...state.myCompetitions].filter((c) => c.clubId === club.id) : [];
  const compToday = !!date && comps.some((c) => c.date === date);

  const ready = !!club && !!date && !!slot && !compToday;

  const toggleFriend = (id: string) => setFriendIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));

  const create = () => {
    if (!club || !date || !slot) return;
    const dayValue = selectedDayValue ?? Date.now();
    const [h, m] = slot.split(':').map(Number);
    const startsAt = dayValue + h * 3600000 + m * 60000;
    if (startsAt <= Date.now()) return;
    const invited = state.friends.filter((f) => friendIds.includes(f.id)).map((f) => ({ id: f.id, name: f.name, confirmed: false }));
    addReservation({ clubId: club.id, clubName: club.name, date, time: slot, startsAt, players: 4, invited });
    addMatch({
      clubId: club.id,
      clubName: club.name,
      date,
      time: slot,
      startsAt,
      levelValue,
      looking,
      total: 4,
      spotsLeft: places,
      visibility,
      host: state.account?.firstName ?? 'Joueur',
    });
    router.replace('/matchs');
  };

  return (
    <Screen back title="Créer un match">
      <Card style={{ marginTop: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        <Ionicons name="tennisball" size={22} color={colors.gold} />
        <Txt variant="small" color={colors.textMuted} style={{ flex: 1 }}>
          Groupe incomplet ou seul ? Réserve un terrain et ouvre des places — on te trouve des joueurs.
        </Txt>
      </Card>

      <Label text="Terrain" />
      <View style={styles.wrap}>
        {clubsByName.map((c) => (
          <Chip key={c.id} label={c.name} active={c.id === clubId} onPress={() => { setClubId(c.id); setSlot(null); }} />
        ))}
      </View>

      <Label text="Date" />
      <View style={styles.wrap}>
        {dates.map((d) => (
          <Chip key={d.label} label={d.label} active={d.label === date} onPress={() => { setDate(d.label); setSlot(null); }} size="lg" />
        ))}
      </View>

      {compToday ? (
        <View style={styles.banner}>
          <Ionicons name="trophy" size={16} color={colors.gold} />
          <Txt variant="small" color={colors.text} style={{ flex: 1 }}>
            Compétition ce jour à {club?.name} — terrain indisponible.
          </Txt>
        </View>
      ) : null}

      <Label text={club ? 'Créneau' : 'Créneau (choisis d’abord un terrain)'} />
      <View style={styles.wrap}>
        {openSlots.map((s) => {
          const isTaken = !!date && taken.includes(s);
          const [hh, mm] = s.split(':').map(Number);
          const slotTs = (selectedDayValue ?? 0) + hh * 3600000 + mm * 60000;
          const isPast = !!date && slotTs <= Date.now();
          const blocked = !date || isTaken || compToday || isPast;
          const label = isTaken ? `${s} · pris` : isPast ? `${s} · passé` : s;
          return <Chip key={s} label={label} active={s === slot} disabled={blocked} onPress={() => setSlot(s)} size="lg" />;
        })}
        {club && openSlots.length === 0 ? (
          <Txt variant="small" color={colors.textFaint} style={{ marginTop: spacing.sm }}>
            Aucun créneau ouvert par ce club.
          </Txt>
        ) : null}
      </View>

      <Label text="Niveau du match" />
      <View style={{ alignItems: 'center', marginTop: spacing.sm }}>
        <LevelStepper value={levelValue} onChange={setLevelValue} />
        <Txt variant="small" color={colors.textMuted} style={{ marginTop: spacing.sm }}>
          {levelLabel(levelValue)}
        </Txt>
      </View>

      <Label text="Tu cherches" />
      <View style={styles.wrap}>
        {LOOKING_OPTIONS.map((o) => (
          <Chip key={o.id} label={o.label} icon={o.icon as IconName} active={o.id === looking} onPress={() => setLooking(o.id)} />
        ))}
      </View>

      <Label text="Places à pourvoir" />
      <View style={styles.wrap}>
        {[1, 2, 3].map((p) => (
          <Chip key={p} label={`${p}`} active={p === places} onPress={() => setPlaces(p)} size="lg" />
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

      <Label text="Qui peut voir ce match ?" />
      <View style={styles.wrap}>
        <Chip label="Public" icon="earth" active={visibility === 'public'} onPress={() => setVisibility('public')} size="lg" />
        <Chip label="Amis uniquement" icon="people" active={visibility === 'amis'} onPress={() => setVisibility('amis')} size="lg" />
      </View>

      <View style={{ marginTop: spacing.xl }}>
        <Button label="Créer le match & réserver le terrain" icon="checkmark" onPress={create} disabled={!ready} full />
        <Txt variant="small" color={colors.textFaint} style={{ marginTop: spacing.sm, textAlign: 'center' }}>
          Créer un match réserve le créneau. Le tarif se règle au club ; annulation jusqu'à 5h avant.
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
});
