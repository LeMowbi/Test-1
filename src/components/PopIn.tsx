import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

// Apparition « pop » (ressort) : l'élément grandit de 0 à sa taille avec un léger rebond.
// Pour les moments de célébration (réservation confirmée, tournoi remporté…). Fondu associé
// pour éviter un flash à l'échelle 0.
export function PopIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 180, delay, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, delay, speed: 12, bounciness: 12, useNativeDriver: true }),
    ]).start();
  }, [scale, opacity, delay]);

  return <Animated.View style={{ opacity, transform: [{ scale }] }}>{children}</Animated.View>;
}
