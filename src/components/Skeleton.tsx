import { useEffect, useRef } from 'react';
import { Animated, View, type ViewStyle } from 'react-native';
import { colors, radius, shadows, spacing } from '@/theme';

// Placeholder de chargement « shimmer » (fondu doux qui pulse). Remplace un vide pendant qu’une
// donnée arrive du serveur → ressenti plus rapide et plus soigné. Purement visuel.
export function Skeleton({
  width = '100%',
  height = 14,
  radius: r = radius.sm,
  style,
}: {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: ViewStyle;
}) {
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return <Animated.View style={[{ width, height, borderRadius: r, backgroundColor: colors.surfaceAlt, opacity: pulse }, style]} />;
}

// Bloc de plusieurs lignes de squelette (ex. un avis, une carte) — évite de répéter le motif.
export function SkeletonLines({ lines = 3, gap = 8 }: { lines?: number; gap?: number }) {
  return (
    <View style={{ gap }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} width={i === lines - 1 ? '60%' : '100%'} />
      ))}
    </View>
  );
}

// Squelette au format d’une Card (bandeau + lignes) → mêmes proportions que le contenu réel
// (club, réservation), pour un chargement perçu comme plus fluide (moins de « saut » de layout).
export function SkeletonCard({ banner = true }: { banner?: boolean }) {
  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md, ...shadows.e1 }}>
      {banner ? <Skeleton width="100%" height={96} radius={radius.md} /> : null}
      <SkeletonLines lines={2} />
    </View>
  );
}
