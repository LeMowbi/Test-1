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

// Tous les clubs serveur actifs → modèle local (fusionnés ensuite avec les clubs de base).
export async function fetchServerClubs(): Promise<CustomClub[]> {
  const { data, error } = await supabase.from('clubs').select('*').eq('status', 'active');
  if (error) return [];
  return (data ?? []).map((row) => serverRowToClub(row as ClubRow));
}

// Approuve une demande de club : crée le club + donne l'accès gérant au demandeur
// (fonction serveur SECURITY DEFINER réservée à l'opérateur). Renvoie l'id du club créé.
export async function approveClubRequest(requestId: string): Promise<{ ok: boolean; clubId?: string }> {
  const { data, error } = await supabase.rpc('approve_club_request', { p_request_id: requestId });
  if (error || !data) return { ok: false };
  return { ok: true, clubId: data as string };
}
