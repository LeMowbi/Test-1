import { Ionicons } from '@expo/vector-icons';
import React, { useMemo, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { ClubCard } from '@/components/ClubCard';
import { Screen } from '@/components/Screen';
import { Txt } from '@/components/ui';
import { clubs, type Club } from '@/data/clubs';
import { colors, radius, spacing } from '@/theme';

const FILTERS: Array<{ key: string; match: (c: Club) => boolean }> = [
  { key: 'Tous', match: () => true },
  { key: 'Couvert', match: (c) => c.type === 'Couvert' },
  { key: 'Extérieur', match: (c) => c.type === 'Extérieur' },
  { key: 'Mixte', match: (c) => c.type === 'Mixte' },
];

export default function TerrainsScreen() {
  const [filter, setFilter] = useState('Tous');

  const list = useMemo(() => {
    const f = FILTERS.find((x) => x.key === filter) ?? FILTERS[0];
    return [...clubs].filter(f.match).sort((a, b) => a.name.localeCompare(b.name));
  }, [filter]);

  return (
    <Screen title="Terrains" subtitle={`${clubs.length} clubs de padel à Abidjan`}>
      {/* Carte */}
      <Pressable
        style={styles.mapBtn}
        onPress={() => Linking.openURL('https://www.google.com/maps/search/?api=1&query=padel+Abidjan')}
      >
        <Ionicons name="map" size={20} color={colors.gold} />
        <View style={{ flex: 1 }}>
          <Txt variant="h3">Voir les terrains sur la carte</Txt>
          <Txt variant="muted">Ouvre Google Maps autour d’Abidjan</Txt>
        </View>
        <Ionicons name="open-outline" size={18} color={colors.textMuted} />
      </Pressable>

      {/* Filtres */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: spacing.sm, paddingVertical: spacing.md }}
      >
        {FILTERS.map((f) => {
          const active = f.key === filter;
          return (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Txt
                variant="small"
                color={active ? '#10120F' : colors.textMuted}
                style={{ fontWeight: '600' }}
              >
                {f.key}
              </Txt>
            </Pressable>
          );
        })}
      </ScrollView>

      <Txt variant="small" color={colors.textFaint} style={{ marginBottom: spacing.md }}>
        Ordre alphabétique — aucun classement entre clubs.
      </Txt>

      {list.map((c) => (
        <ClubCard key={c.id} club={c} />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  mapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginTop: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.gold, borderColor: colors.gold },
});
