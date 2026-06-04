import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { MatchCard } from '@/components/MatchCard';
import { Screen } from '@/components/Screen';
import { SegmentedControl } from '@/components/SegmentedControl';
import { Button, EmptyState } from '@/components/ui';
import { seedMatches } from '@/data/matches';
import { useApp } from '@/store/AppContext';
import { spacing } from '@/theme';

const TABS = ['Tous', 'Publics', 'Amis'] as const;

export default function MatchsScreen() {
  const router = useRouter();
  const { state } = useApp();
  const [tab, setTab] = useState<(typeof TABS)[number]>('Tous');

  const list = [...state.myMatches, ...seedMatches].filter((m) => {
    if (tab === 'Publics') return m.visibility === 'public';
    if (tab === 'Amis') return m.visibility === 'amis';
    return true;
  });

  return (
    <Screen title="Jouer" subtitle="Partenaire, adversaire ou coéquipier">
      <View style={{ marginTop: spacing.sm }}>
        <Button label="Créer un match" icon="add" onPress={() => router.push('/match/nouveau')} full />
      </View>

      <SegmentedControl options={TABS} value={tab} onChange={setTab} />

      {list.length === 0 ? (
        <EmptyState icon="tennisball-outline" title="Aucun match" text="Crée le premier match de cette catégorie." />
      ) : (
        list.map((m) => <MatchCard key={m.id} match={m} />)
      )}
    </Screen>
  );
}
