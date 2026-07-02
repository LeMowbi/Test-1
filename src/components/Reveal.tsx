import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

// Délai de cascade commun à toutes les listes animées (clubs, tournois, réservations…) —
// une seule cadence dans toute l'app plutôt que plusieurs rythmes différents au choix de chaque écran.
export const staggerDelay = (i: number, step = 40, cap = 240) => Math.min(i * step, cap);

// Apparition douce (fondu + léger glissement) au montage.
export function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 420, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 420, delay, useNativeDriver: true }),
    ]).start();
  }, [opacity, translateY, delay]);

  return <Animated.View style={{ opacity, transform: [{ translateY }] }}>{children}</Animated.View>;
}
