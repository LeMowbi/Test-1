import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { Chip } from '@/components/Chip';
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
  const [myLevel, setMyLevel] = useState(false);

  const list = [...state.myMatches, ...seedMatches].filter((m) => {
    if (tab === 'Publics' && m.visibility !== 'public') return false;
    if (tab === 'Amis' && m.visibility !== 'amis') return false;
    if (myLevel && Math.abs(m.levelValue - state.level) > 1) return false;
    return true;
  });

  return (
    <Screen title="Jouer" subtitle="Partenaire, adversaire ou coéquipier">
      <View style={{ marginTop: spacing.sm }}>
        <Button label="Créer un match" icon="add" onPress={() => router.push('/match/nouveau')} full />
      </View>

      <SegmentedControl options={TABS} value={tab} onChange={setTab} />

      <View style={{ flexDirection: 'row', marginBottom: spacing.lg }}>
        <Chip
          label={`À mon niveau (${state.level.toFixed(1)})`}
          icon="podium-outline"
          active={myLevel}
          onPress={() => setMyLevel((v) => !v)}
          size="lg"
        />
      </View>

      {list.length === 0 ? (
        <EmptyState icon="tennisball-outline" title="Aucun match" text="Aucun match ne correspond à ces filtres." />
      ) : (
        list.map((m) => <MatchCard key={m.id} match={m} />)
      )}
    </Screen>
  );
}
