import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { CompetitionCard } from '@/components/CompetitionCard';
import { Screen } from '@/components/Screen';
import { SegmentedControl } from '@/components/SegmentedControl';
import { Button, EmptyState } from '@/components/ui';
import { seedCompetitions } from '@/data/competitions';
import { useApp } from '@/store/AppContext';
import { spacing } from '@/theme';

const TABS = ['Toutes', 'Par les clubs', 'Par les joueurs'] as const;

export default function CompetitionsScreen() {
  const router = useRouter();
  const { state } = useApp();
  const [tab, setTab] = useState<(typeof TABS)[number]>('Toutes');

  const list = [...state.myCompetitions, ...seedCompetitions].filter((c) => {
    if (tab === 'Par les clubs') return c.organizerType === 'club';
    if (tab === 'Par les joueurs') return c.organizerType === 'joueur';
    return true;
  });

  return (
    <Screen title="Compétitions" subtitle="Tournois & défis avec récompenses">
      <View style={{ marginTop: spacing.sm }}>
        <Button label="Créer une compétition" icon="add" onPress={() => router.push('/competition/nouvelle')} full />
      </View>

      <SegmentedControl options={TABS} value={tab} onChange={setTab} />

      {list.length === 0 ? (
        <EmptyState icon="trophy-outline" title="Aucune compétition" text="Lance ton propre tournoi ou défi entre amis." />
      ) : (
        list.map((c) => <CompetitionCard key={c.id} comp={c} />)
      )}
    </Screen>
  );
}
