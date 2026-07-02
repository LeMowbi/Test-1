import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

// Délai de cascade commun à toutes les listes animées (clubs, tournois, réservations…) —
// une seule cadence dans toute l’app plutôt que plusieurs rythmes différents au choix de chaque écran.
export const staggerDelay = (i: number, step = 40, cap = 240) => Math.min(i * step, cap);

// Apparition douce (fondu + léger glissement) au montage.
// `disabled` : rend le contenu directement, sans animation ni Animated.Value — pour les
// lignes dépliées d'une longue liste (« Voir plus »), où une rafale d'entrées serait lourde.
export function Reveal({ children, delay = 0, disabled = false }: { children: React.ReactNode; delay?: number; disabled?: boolean }) {
  const opacity = useRef(new Animated.Value(disabled ? 1 : 0)).current;
  const translateY = useRef(new Animated.Value(disabled ? 0 : 12)).current;

  useEffect(() => {
    if (disabled) return;
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 420, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 420, delay, useNativeDriver: true }),
    ]).start();
  }, [opacity, translateY, delay, disabled]);

  return <Animated.View style={{ opacity, transform: [{ translateY }] }}>{children}</Animated.View>;
}
