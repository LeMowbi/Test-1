// État global de l'app (prototype) + persistance locale via AsyncStorage.
// Gère : compte local, niveau de jeu, favoris, avis, matchs/compétitions/réservations,
// résultats validés par partie, photos gérées par les clubs, et mode « Espace Club ».

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Competition } from '@/data/competitions';
import type { Match, Visibility } from '@/data/matches';
import type { Review } from '@/data/reviews';

export type Account = {
  firstName: string;
  lastName: string;
  phone: string;
  photoUri?: string;
};

export type Reservation = {
  id: string;
  clubId: string;
  clubName: string;
  date: string;
  time: string;
  players: number;
  payment: string;
  createdAt: number;
  result?: 'win' | 'loss';
  resultAt?: number;
};

type AppState = {
  account: Account | null;
  level: number; // 1.0 → 7.0
  defaultVisibility: Visibility;
  userReviews: Review[];
  myMatches: Match[];
  myCompetitions: Competition[];
  reservations: Reservation[];
  favoriteClubIds: string[];
  clubPhotos: Record<string, string[]>;
  clubOffers: Record<string, { id: string; kind: 'offre' | 'actu'; title: string; detail: string }[]>;
  clubCoaches: Record<string, { id: string; name: string; specialty: string }[]>;
  clubMode: boolean;
  managedClubId: string;
  clubSlots: Record<string, string[]>;
};

export type Stats = { wins: number; losses: number; played: number; winRate: number; streak: number };

const STORAGE_KEY = 'padelco_state_v2';

const initialState: AppState = {
  account: null,
  level: 3.0,
  defaultVisibility: 'public',
  userReviews: [],
  myMatches: [],
  myCompetitions: [],
  reservations: [],
  favoriteClubIds: [],
  clubPhotos: {},
  clubOffers: {},
  clubCoaches: {},
  clubMode: false,
  managedClubId: 'padelta',
  clubSlots: {},
};

type AppContextType = {
  state: AppState;
  hydrated: boolean;
  stats: Stats;
  setAccount: (a: Account) => void;
  updateAccount: (patch: Partial<Account>) => void;
  loadDemo: () => void;
  signOut: () => void;
  setLevel: (n: number) => void;
  setDefaultVisibility: (v: Visibility) => void;
  addReview: (clubId: string, rating: number, text: string) => void;
  addMatch: (m: Omit<Match, 'id' | 'createdByMe'>) => void;
  addCompetition: (c: Omit<Competition, 'id' | 'createdByMe'>) => void;
  addReservation: (r: Omit<Reservation, 'id' | 'createdAt'>) => void;
  setReservationResult: (id: string, result: 'win' | 'loss') => void;
  cancelReservation: (id: string) => void;
  toggleFavorite: (clubId: string) => void;
  addClubPhoto: (clubId: string, uri: string) => void;
  removeClubPhoto: (clubId: string, uri: string) => void;
  addClubOffer: (clubId: string, kind: 'offre' | 'actu', title: string, detail: string) => void;
  removeClubOffer: (clubId: string, id: string) => void;
  addClubCoach: (clubId: string, name: string, specialty: string) => void;
  removeClubCoach: (clubId: string, id: string) => void;
  setClubMode: (on: boolean) => void;
  setManagedClub: (id: string) => void;
  addClubSlot: (clubId: string, slot: string) => void;
  removeClubSlot: (clubId: string, slot: string) => void;
  resetAll: () => void;
};

const AppContext = createContext<AppContextType | null>(null);

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

function computeStats(reservations: Reservation[]): Stats {
  const decided = reservations.filter((r) => r.result);
  const wins = decided.filter((r) => r.result === 'win').length;
  const played = decided.length;
  const losses = played - wins;
  const winRate = played > 0 ? Math.round((wins / played) * 100) : 0;
  let streak = 0;
  for (const r of [...decided].sort((a, b) => (b.resultAt ?? 0) - (a.resultAt ?? 0))) {
    if (r.result === 'win') streak++;
    else break;
  }
  return { wins, losses, played, winRate, streak };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(initialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setState({ ...initialState, ...JSON.parse(raw) });
      } catch {
        // état par défaut
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state, hydrated]);

  const stats = useMemo(() => computeStats(state.reservations), [state.reservations]);

  const api = useMemo<AppContextType>(
    () => ({
      state,
      hydrated,
      stats,
      setAccount: (a) => setState((s) => ({ ...s, account: a })),
      updateAccount: (patch) =>
        setState((s) => ({ ...s, account: s.account ? { ...s.account, ...patch } : s.account })),
      signOut: () => setState((s) => ({ ...s, account: null })),
      loadDemo: () =>
        setState(() => ({
          ...initialState,
          account: { firstName: 'Invité', lastName: 'Démo', phone: '+225 07 00 00 00 00' },
          level: 3.5,
          favoriteClubIds: ['padelta'],
          reservations: [
            { id: uid(), clubId: 'padelta', clubName: 'Padelta', date: "Aujourd'hui", time: '19:00', players: 4, payment: 'Orange Money', createdAt: Date.now() },
            { id: uid(), clubId: 'padel-zone-4', clubName: 'Padel Zone 4', date: 'Sem. dernière', time: '18:00', players: 4, payment: 'Wave', createdAt: Date.now() - 86400000, result: 'win', resultAt: Date.now() - 86400000 },
          ],
        })),
      setLevel: (n) => setState((s) => ({ ...s, level: Math.min(7, Math.max(1, n)) })),
      setDefaultVisibility: (v) => setState((s) => ({ ...s, defaultVisibility: v })),
      addReview: (clubId, rating, text) =>
        setState((s) => ({
          ...s,
          userReviews: [
            { id: uid(), clubId, author: 'Vous', rating, text: text.trim() || 'Bonne expérience.', date: "À l'instant" },
            ...s.userReviews,
          ],
        })),
      addMatch: (m) =>
        setState((s) => ({ ...s, myMatches: [{ ...m, id: uid(), createdByMe: true }, ...s.myMatches] })),
      addCompetition: (c) =>
        setState((s) => ({ ...s, myCompetitions: [{ ...c, id: uid(), createdByMe: true }, ...s.myCompetitions] })),
      addReservation: (r) =>
        setState((s) => ({ ...s, reservations: [{ ...r, id: uid(), createdAt: Date.now() }, ...s.reservations] })),
      setReservationResult: (id, result) =>
        setState((s) => ({
          ...s,
          reservations: s.reservations.map((r) =>
            r.id === id && !r.result ? { ...r, result, resultAt: Date.now() } : r
          ),
        })),
      cancelReservation: (id) =>
        setState((s) => ({ ...s, reservations: s.reservations.filter((r) => r.id !== id) })),
      toggleFavorite: (clubId) =>
        setState((s) => ({
          ...s,
          favoriteClubIds: s.favoriteClubIds.includes(clubId)
            ? s.favoriteClubIds.filter((x) => x !== clubId)
            : [...s.favoriteClubIds, clubId],
        })),
      addClubPhoto: (clubId, uri) =>
        setState((s) => {
          const existing = s.clubPhotos[clubId] ?? [];
          if (!uri || existing.includes(uri)) return s;
          return { ...s, clubPhotos: { ...s.clubPhotos, [clubId]: [...existing, uri] } };
        }),
      removeClubPhoto: (clubId, uri) =>
        setState((s) => ({
          ...s,
          clubPhotos: { ...s.clubPhotos, [clubId]: (s.clubPhotos[clubId] ?? []).filter((x) => x !== uri) },
        })),
      addClubOffer: (clubId, kind, title, detail) =>
        setState((s) => {
          const t = title.trim();
          if (!t) return s;
          const existing = s.clubOffers[clubId] ?? [];
          return {
            ...s,
            clubOffers: { ...s.clubOffers, [clubId]: [{ id: uid(), kind, title: t, detail: detail.trim() }, ...existing] },
          };
        }),
      removeClubOffer: (clubId, id) =>
        setState((s) => ({
          ...s,
          clubOffers: { ...s.clubOffers, [clubId]: (s.clubOffers[clubId] ?? []).filter((o) => o.id !== id) },
        })),
      addClubCoach: (clubId, name, specialty) =>
        setState((s) => {
          const n = name.trim();
          if (!n) return s;
          const existing = s.clubCoaches[clubId] ?? [];
          return {
            ...s,
            clubCoaches: { ...s.clubCoaches, [clubId]: [{ id: uid(), name: n, specialty: specialty.trim() || 'Coach' }, ...existing] },
          };
        }),
      removeClubCoach: (clubId, id) =>
        setState((s) => ({
          ...s,
          clubCoaches: { ...s.clubCoaches, [clubId]: (s.clubCoaches[clubId] ?? []).filter((c) => c.id !== id) },
        })),
      setClubMode: (on) => setState((s) => ({ ...s, clubMode: on })),
      setManagedClub: (id) => setState((s) => ({ ...s, managedClubId: id })),
      addClubSlot: (clubId, slot) =>
        setState((s) => {
          const existing = s.clubSlots[clubId] ?? [];
          if (existing.includes(slot)) return s;
          return { ...s, clubSlots: { ...s.clubSlots, [clubId]: [...existing, slot].sort() } };
        }),
      removeClubSlot: (clubId, slot) =>
        setState((s) => ({
          ...s,
          clubSlots: { ...s.clubSlots, [clubId]: (s.clubSlots[clubId] ?? []).filter((x) => x !== slot) },
        })),
      resetAll: () => setState(initialState),
    }),
    [state, hydrated, stats]
  );

  return <AppContext.Provider value={api}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp doit être utilisé dans <AppProvider>');
  return ctx;
}
