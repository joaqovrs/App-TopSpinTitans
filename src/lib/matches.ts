// Acciones sobre partidos: envoltorios de las RPC del backend + helpers para
// derivar, desde el punto de vista del usuario, que accion corresponde.
import { supabase } from '@/lib/supabase';
import type { Match } from '@/lib/types';

export type RetoAction =
  | 'retar' // available: puedo retar
  | 'responder' // invited y soy el invitado: acepto/rechazo
  | 'cargar' // accepted y soy el inviter: cargo resultado
  | 'validar' // result_pending y soy el invitado: valido
  | 'en_curso' // hay algo en juego pero la pelota esta del otro lado
  | 'jugado'; // validated

export function opponentId(match: Match, uid: string): string {
  return match.player_a === uid ? match.player_b : match.player_a;
}

export function actionFor(match: Match, uid: string): RetoAction {
  switch (match.status) {
    case 'available':
    case 'declined':
      return 'retar';
    case 'invited':
      return match.invitee_id === uid ? 'responder' : 'en_curso';
    case 'accepted':
      return match.inviter_id === uid ? 'cargar' : 'en_curso';
    case 'result_pending':
      return match.invitee_id === uid ? 'validar' : 'en_curso';
    case 'validated':
      return 'jugado';
  }
}

export async function sendInvite(matchId: string): Promise<void> {
  const { error } = await supabase.rpc('send_invite', { p_match_id: matchId });
  if (error) throw error;
}

export async function respondInvite(matchId: string, accept: boolean): Promise<void> {
  const { error } = await supabase.rpc('respond_invite', {
    p_match_id: matchId,
    p_accept: accept,
  });
  if (error) throw error;
}

export async function validateResult(matchId: string, accept: boolean): Promise<void> {
  const { error } = await supabase.rpc('validate_result', {
    p_match_id: matchId,
    p_accept: accept,
  });
  if (error) throw error;
}

// Los puntajes llegan "mios / del rival"; aca se reordenan a player_a / player_b.
export async function submitResult(
  match: Match,
  uid: string,
  scoresMine: number[],
  scoresTheirs: number[]
): Promise<void> {
  const iAmA = match.player_a === uid;
  const { error } = await supabase.rpc('submit_result', {
    p_match_id: match.id,
    p_scores_a: iAmA ? scoresMine : scoresTheirs,
    p_scores_b: iAmA ? scoresTheirs : scoresMine,
  });
  if (error) throw error;
}
