import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Screen } from '@/components/Screen';
import { Button, Txt } from '@/components/ui';
import { clubs } from '@/data/clubs';
import { COMP_FORMATS } from '@/data/competitions';
import { currentUser } from '@/data/user';
import { useApp } from '@/store/AppContext';
import { colors, radius, spacing } from '@/theme';

const DATES = ['Ce week-end', 'Sam. prochain', 'Dim. prochain', 'Dans 2 semaines'];
const LEVELS = ['Tous niveaux', 'Débutant', 'Intermédiaire', 'Avancé'];
const SLOTS = [4, 8, 16, 24];

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Txt variant="small" color={active ? '#10120F' : colors.text} style={{ fontWeight: '600' }}>
        {label}
      </Txt>
    </Pressable>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
}) {
  return (
    <>
      <Txt variant="label" color={colors.textFaint} style={{ marginTop: spacing.lg }}>
        {label}
      </Txt>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
        style={styles.input}
      />
    </>
  );
}

export default function NouvelleCompetition() {
  const router = useRouter();
  const params = useLocalSearchParams<{ as?: string; clubId?: string }>();
  const asClub = params.as === 'club';
  const club = asClub ? clubs.find((c) => c.id === params.clubId) : undefined;
  const { addCompetition } = useApp();

  const [title, setTitle] = useState('');
  const [reward, setReward] = useState('');
  const [fee, setFee] = useState('Gratuit');
  const [date, setDate] = useState<string | null>(null);
  const [format, setFormat] = useState(COMP_FORMATS[2]);
  const [level, setLevel] = useState('Tous niveaux');
  const [slots, setSlots] = useState(8);

  const ready = title.trim().length > 1 && reward.trim().length > 1 && date;

  const create = () => {
    if (!ready) return;
    addCompetition({
      title: title.trim(),
      organizerType: asClub ? 'club' : 'joueur',
      organizer: club?.name ?? currentUser.name,
      clubId: club?.id,
      clubName: club?.name,
      date: date!,
      format,
      level,
      reward: reward.trim(),
      fee: fee.trim() || 'Gratuit',
      slots,
      registered: 0,
    });
    router.replace(asClub ? '/club-admin' : '/competitions');
  };

  return (
    <Screen back title="Créer une compétition" subtitle={asClub ? `Pour ${club?.name ?? 'votre club'}` : 'En tant que joueur'}>
      <Field label="Titre" value={title} onChangeText={setTitle} placeholder="Ex. Défi entre amis — Riviera" />
      <Field label="Récompense" value={reward} onChangeText={setReward} placeholder="Ex. Cagnotte 30 000 FCFA" />
      <Field label="Frais d'inscription" value={fee} onChangeText={setFee} placeholder="Gratuit / 5 000 FCFA…" />

      <Txt variant="label" color={colors.textFaint} style={{ marginTop: spacing.lg }}>
        Date
      </Txt>
      <View style={styles.wrap}>
        {DATES.map((d) => (
          <Chip key={d} label={d} active={d === date} onPress={() => setDate(d)} />
        ))}
      </View>

      <Txt variant="label" color={colors.textFaint} style={{ marginTop: spacing.lg }}>
        Format
      </Txt>
      <View style={styles.wrap}>
        {COMP_FORMATS.map((f) => (
          <Chip key={f} label={f} active={f === format} onPress={() => setFormat(f)} />
        ))}
      </View>

      <Txt variant="label" color={colors.textFaint} style={{ marginTop: spacing.lg }}>
        Niveau
      </Txt>
      <View style={styles.wrap}>
        {LEVELS.map((l) => (
          <Chip key={l} label={l} active={l === level} onPress={() => setLevel(l)} />
        ))}
      </View>

      <Txt variant="label" color={colors.textFaint} style={{ marginTop: spacing.lg }}>
        Nombre de places
      </Txt>
      <View style={styles.wrap}>
        {SLOTS.map((s) => (
          <Chip key={s} label={`${s}`} active={s === slots} onPress={() => setSlots(s)} />
        ))}
      </View>

      <View style={{ marginTop: spacing.xl }}>
        <Button label="Publier la compétition" icon="trophy" onPress={create} disabled={!ready} full />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    color: colors.text,
    padding: spacing.md,
    marginTop: spacing.sm,
    fontSize: 15,
  },
});
