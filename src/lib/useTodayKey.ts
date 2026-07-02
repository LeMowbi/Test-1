import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { dayKey } from './days';

// Clé du jour d’Abidjan (AAAA-MM-JJ), RÉACTIVE : recalculée à chaque retour au premier plan.
// À mettre en dépendance des listes de jours (`nextDays`) : un écran laissé monté pendant la
// nuit voyait sinon sa pastille « Aujourd’hui » rester collée à la VEILLE au réveil (créneaux
// tous filtrés comme passés → journée à tort « terminée », 7ᵉ jour réel absent).
export function useTodayKey(): string {
  const [key, setKey] = useState(() => dayKey(new Date()));
  useEffect(() => {
    const sub = AppState.addEventListener('change', (st) => {
      if (st !== 'active') return;
      // setState dans un callback d'événement (pas dans le corps de l'effet) — règle React
      // Compiler respectée ; même valeur → pas de re-rendu.
      setKey((cur) => {
        const next = dayKey(new Date());
        return next === cur ? cur : next;
      });
    });
    return () => sub.remove();
  }, []);
  return key;
}
