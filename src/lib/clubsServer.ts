// Couche données « clubs serveur ». Les 9 clubs de base restent embarqués dans l'app
// (rapides, hors-ligne) ; cette table ne contient que les clubs AJOUTÉS via l'app.
// L'opérateur approuve une demande → un club est créé ici et apparaît chez tous les
// joueurs, SANS nouvelle version de l'app.

import { serverRowToClub, type CustomClub } from '@/data/clubs';
import { supabase } from './supabase';

type ClubRow = {
  id: string;
  name: string;
  area: string | null;
  city: string | null;
  type: string | null;
  courts: number | null;
  price_from: number | null;
  contact_phone: string | null;
  blurb: string | null;
  amenities: string[] | null;
  status: string | null;
  created_at: string | null;
};

// Clubs serveur visibles (actifs + « Bientôt ») → modèle local, fusionnés avec les clubs
// de base. Les 'coming_soon' arrivent avec leur badge ; les 'hidden' restent exclus.
export async function fetchServerClubs(): Promise<CustomClub[]> {
  const { data, error } = await supabase.from('clubs').select('*').in('status', ['active', 'coming_soon']);
  if (error) return [];
  return (data ?? []).map((row) => serverRowToClub(row as ClubRow));
}

// Opérateur : change le statut d'un club (active | coming_soon | hidden).
export async function setClubStatus(clubId: string, status: 'active' | 'coming_soon' | 'hidden'): Promise<boolean> {
  const { data, error } = await supabase.rpc('set_club_status', { p_id: clubId, p_status: status });
  return !error && data === true;
}

// Opérateur : pré-charge un club « Bientôt » sans demande préalable. Renvoie l'id créé.
export async function createClub(input: {
  name: string;
  area: string;
  type: string;
  courts: number;
  priceFrom: number;
}): Promise<{ ok: boolean; clubId?: string }> {
  const { data, error } = await supabase.rpc('create_club', {
    p_name: input.name,
    p_area: input.area,
    p_type: input.type,
    p_courts: input.courts,
    p_price_from: input.priceFrom,
  });
  if (error || !data) return { ok: false };
  return { ok: true, clubId: data as string };
}

// Approuve une demande de club : crée le club + donne l'accès gérant au demandeur
// (fonction serveur SECURITY DEFINER réservée à l'opérateur). Renvoie l'id du club créé.
export async function approveClubRequest(requestId: string): Promise<{ ok: boolean; clubId?: string }> {
  const { data, error } = await supabase.rpc('approve_club_request', { p_request_id: requestId });
  if (error || !data) return { ok: false };
  return { ok: true, clubId: data as string };
}
