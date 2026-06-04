import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { MatchCard } from '@/components/MatchCard';
import { Screen } from '@/components/Screen';
import { Button, EmptyState, Txt } from '@/components/ui';
import { seedMatches } from '@/data/matches';
import { useApp } from '@/store/AppContext';
import { colors, radius, spacing } from '@/theme';

const TABS = ['Tous', 'Publics', 'Amis'] as const;

export default function MatchsScreen() {
  const router = useRouter();
  const { state } = useApp();
  const [tab, setTab] = useState<(typeof TABS)[number]>('Tous');

  const all = [...state.myMatches, ...seedMatches];
  const list = all.filter((m) => {
    if (tab === 'Publics') return m.visibility === 'public';
    if (tab === 'Amis') return m.visibility === 'amis';
    return true;
  });

  return (
    <Screen title="Jouer" subtitle="Partenaire, adversaire ou coéquipier">
      <View style={{ marginTop: spacing.sm }}>
        <Button label="Créer un match" icon="add" onPress={() => router.push('/match/nouveau')} full />
      </View>

      <View style={styles.segment}>
        {TABS.map((t) => {
          const active = t === tab;
          return (
            <Pressable key={t} onPress={() => setTab(t)} style={[styles.segBtn, active && styles.segActive]}>
              <Txt variant="small" color={active ? colors.text : colors.textMuted} style={{ fontWeight: '600' }}>
                {t}
              </Txt>
            </Pressable>
          );
        })}
      </View>

      {list.length === 0 ? (
        <EmptyState icon="tennisball-outline" title="Aucun match" text="Crée le premier match de cette catégorie." />
      ) : (
        list.map((m) => <MatchCard key={m.id} match={m} />)
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
