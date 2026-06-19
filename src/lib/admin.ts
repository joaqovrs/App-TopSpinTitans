// Acciones de administracion: envoltorios de las RPC del backend (que ya
// verifican is_admin() por dentro). La UI solo llama; nada de UPDATE directo.
import { supabase } from '@/lib/supabase';

export async function approvePlayer(playerId: string): Promise<void> {
  const { error } = await supabase.rpc('approve_player', { p_player_id: playerId });
  if (error) throw error;
}

export async function rejectPlayer(playerId: string): Promise<void> {
  const { error } = await supabase.rpc('reject_player', { p_player_id: playerId });
  if (error) throw error;
}

// Deshace una aprobacion: el jugador vuelve a 'pending'. El backend lo bloquea
// si la temporada ya esta en curso (active).
export async function revokePlayer(playerId: string): Promise<void> {
  const { error } = await supabase.rpc('revoke_player', { p_player_id: playerId });
  if (error) throw error;
}

// --- Gestion de temporada ---

export async function createSeason(
  name: string,
  startDate: string | null,
  endDate: string | null
): Promise<void> {
  const { error } = await supabase.rpc('create_season', {
    p_name: name,
    p_start_date: startDate,
    p_end_date: endDate,
  });
  if (error) throw error;
}

export async function setSeasonDates(
  seasonId: string,
  startDate: string | null,
  endDate: string | null
): Promise<void> {
  const { error } = await supabase.rpc('set_season_dates', {
    p_season_id: seasonId,
    p_start_date: startDate,
    p_end_date: endDate,
  });
  if (error) throw error;
}

export async function startSeason(seasonId: string): Promise<void> {
  const { error } = await supabase.rpc('start_season', { p_season_id: seasonId });
  if (error) throw error;
}

export async function closeSeason(seasonId: string): Promise<void> {
  const { error } = await supabase.rpc('close_season', { p_season_id: seasonId });
  if (error) throw error;
}
