import { useEffect, useRef } from 'react';
import { Animated, View, type ViewStyle } from 'react-native';
import { colors, radius } from '@/theme';

// Placeholder de chargement « shimmer » (fondu doux qui pulse). Remplace un vide pendant qu'une
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
