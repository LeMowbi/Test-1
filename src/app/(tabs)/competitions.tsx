import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { CompetitionCard } from '@/components/CompetitionCard';
import { Screen } from '@/components/Screen';
import { Button, EmptyState, Txt } from '@/components/ui';
import { seedCompetitions } from '@/data/competitions';
import { useApp } from '@/store/AppContext';
import { colors, radius, spacing } from '@/theme';

const TABS = ['Toutes', 'Par les clubs', 'Par les joueurs'] as const;

export default function CompetitionsScreen() {
  const router = useRouter();
  const { state } = useApp();
  const [tab, setTab] = useState<(typeof TABS)[number]>('Toutes');

  const all = [...state.myCompetitions, ...seedCompetitions];
  const list = all.filter((c) => {
    if (tab === 'Par les clubs') return c.organizerType === 'club';
    if (tab === 'Par les joueurs') return c.organizerType === 'joueur';
    return true;
  });

  return (
    <Screen title="Compétitions" subtitle="Tournois & défis avec récompenses">
      <View style={{ marginTop: spacing.sm }}>
        <Button label="Créer une compétition" icon="add" onPress={() => router.push('/competition/nouvelle')} full />
      </View>

      <View style={styles.segment}>
        {TABS.map((t) => {
          const active = t === tab;
          return (
            <Pressable key={t} onPress={() => setTab(t)} style={[styles.segBtn, active && styles.segActive]}>
              <Txt variant="small" color={active ? colors.text : colors.textMuted} style={{ fontWeight: '600' }} numberOfLines={1}>
                {t}
              </Txt>
            </Pressable>
          );
        })}
      </View>

      {list.length === 0 ? (
        <EmptyState icon="trophy-outline" title="Aucune compétition" text="Lance ton propre tournoi ou défi entre amis." />
      ) : (
        list.map((c) => <CompetitionCard key={c.id} comp={c} />)
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 4,
    gap: 4,
    marginVertical: spacing.lg,
  },
  segBtn: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: radius.sm },
  segActive: { backgroundColor: colors.surfaceAlt },
});
