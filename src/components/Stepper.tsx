import { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import { Txt } from './ui';
import { colors, radius, spacing } from '@/theme';

// Un segment : fond « à venir » (surfaceAlt) recouvert d'un calque signature dont l'opacité
// s'anime de 0 → 1 quand l'étape est franchie → le remplissage se fait en douceur (pas un saut).
function Segment({ filled }: { filled: boolean }) {
  const fill = useRef(new Animated.Value(filled ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(fill, { toValue: filled ? 1 : 0, duration: 250, useNativeDriver: true }).start();
  }, [filled, fill]);
  return (
    <View style={styles.seg}>
      <Animated.View style={[styles.segFill, { opacity: fill }]} />
    </View>
  );
}

// Barre de progression à N segments : « Étape X/N · {libellé} ». Les segments franchis se
// remplissent en signature avec une transition douce. Purement visuel.
export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  const safe = Math.max(0, Math.min(current, steps.length - 1));
  return (
    <View style={{ marginTop: spacing.sm }}>
      <View style={styles.track}>
        {steps.map((s, i) => (
          <Segment key={s} filled={i <= safe} />
        ))}
      </View>
      <Txt variant="small" color={colors.textMuted} style={{ marginTop: spacing.xs }}>
        Étape {safe + 1}/{steps.length} · {steps[safe]}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', gap: 4 },
  seg: { flex: 1, height: 5, borderRadius: radius.pill, backgroundColor: colors.surfaceAlt, overflow: 'hidden' },
  segFill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.signature },
});
