// État global de l'app (prototype) + persistance locale via AsyncStorage.
// Gère : stats auto-déclarées, avis ajoutés, matchs/compétitions/réservations
// créés par l'utilisateur, et le mode « Espace Club ».

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Competition } from '@/data/competitions';
import type { Match, Visibility } from '@/data/matches';
import type { Review } from '@/data/reviews';

export type Reservation = {
  id: string;
  clubId: string;
  clubName: string;
  date: string;
  time: string;
  players: number;
  payment: string;
  createdAt: number;
};

type AppState = {
  wins: number;
  losses: number;
  played: number;
  defaultVisibility: Visibility;
  userReviews: Review[];
  myMatches: Match[];
  myCompetitions: Competition[];
  reservations: Reservation[];
  clubMode: boolean;
  managedClubId: string;
  clubSlots: Record<string, string[]>;
};

const STORAGE_KEY = 'padelco_state_v1';

const initialState: AppState = {
  wins: 0,
  losses: 0,
  played: 0,
  defaultVisibility: 'public',
  userReviews: [],
  myMatches: [],
  myCompetitions: [],
  reservations: [],
  clubMode: false,
  managedClubId: 'padelta',
  clubSlots: {},
};

type AppContextType = {
  state: AppState;
  hydrated: boolean;
  recordWin: () => void;
  recordLoss: () => void;
  setDefaultVisibility: (v: Visibility) => void;
  addReview: (clubId: string, rating: number, text: string) => void;
  addMatch: (m: Omit<Match, 'id' | 'createdByMe'>) => void;
  addCompetition: (c: Omit<Competition, 'id' | 'createdByMe'>) => void;
  addReservation: (r: Omit<Reservation, 'id' | 'createdAt'>) => void;
  setClubMode: (on: boolean) => void;
  setManagedClub: (id: string) => void;
  addClubSlot: (clubId: string, slot: string) => void;
  removeClubSlot: (clubId: string, slot: string) => void;
  resetAll: () => void;
};

const AppContext = createContext<AppContextType | null>(null);

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);
  const [hydrated, setHydrated] = useState(false);

  // Chargement initial
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setState({ ...initialState, ...JSON.parse(raw) });
      } catch {
        // ignore — on repart sur l'état par défaut
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  // Sauvegarde à chaque changement (après hydratation)
  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state, hydrated]);

  const api = useMemo<AppContextType>(
    () => ({
      state,
      hydrated,
      recordWin: () =>
        setState((s) => ({ ...s, wins: s.wins + 1, played: s.played + 1 })),
      recordLoss: () =>
        setState((s) => ({ ...s, losses: s.losses + 1, played: s.played + 1 })),
      setDefaultVisibility: (v) => setState((s) => ({ ...s, defaultVisibility: v })),
      addReview: (clubId, rating, text) =>
        setState((s) => ({
          ...s,
          userReviews: [
            {
              id: uid(),
              clubId,
              author: 'Vous',
              rating,
              text: text.trim() || 'Bonne expérience.',
              date: "À l'instant",
            },
            ...s.userReviews,
          ],
        })),
      addMatch: (m) =>
        setState((s) => ({
          ...s,
          myMatches: [{ ...m, id: uid(), createdByMe: true }, ...s.myMatches],
        })),
      addCompetition: (c) =>
        setState((s) => ({
          ...s,
          myCompetitions: [{ ...c, id: uid(), createdByMe: true }, ...s.myCompetitions],
        })),
      addReservation: (r) =>
        setState((s) => ({
          ...s,
          reservations: [{ ...r, id: uid(), createdAt: Date.now() }, ...s.reservations],
        })),
      setClubMode: (on) => setState((s) => ({ ...s, clubMode: on })),
      setManagedClub: (id) => setState((s) => ({ ...s, managedClubId: id })),
      addClubSlot: (clubId, slot) =>
        setState((s) => {
          const existing = s.clubSlots[clubId] ?? [];
          if (existing.includes(slot)) return s;
          return {
            ...s,
            clubSlots: { ...s.clubSlots, [clubId]: [...existing, slot].sort() },
          };
        }),
      removeClubSlot: (clubId, slot) =>
        setState((s) => ({
          ...s,
          clubSlots: {
            ...s.clubSlots,
            [clubId]: (s.clubSlots[clubId] ?? []).filter((x) => x !== slot),
          },
        })),
      resetAll: () => setState(initialState),
    }),
    [state, hydrated]
  );

  return <AppContext.Provider value={api}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp doit être utilisé dans <AppProvider>');
  return ctx;
}
