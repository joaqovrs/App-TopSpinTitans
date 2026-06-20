// Tipos compartidos del dominio. Reflejan lo que devuelve el backend.

/** Una fila de la vista `standings` (ranking calculado). */
export type Standing = {
  id: string;
  display_name: string;
  wins: number;
  losses: number;
  points: number;
  /** Victorias consecutivas recientes (>=3 = "en llamas"). */
  streak: number;
  /** Foto de perfil (null = mostrar iniciales). */
  avatar_url: string | null;
  /** Diferencia de puntos (a favor - en contra, todos los sets). Desempata a igualdad de points. Puede ser negativa. */
  points_diff: number;
};

export type MembershipStatus = 'pending' | 'approved' | 'rejected';
export type Role = 'player' | 'admin';

export type SeasonStatus = 'enrolling' | 'active' | 'closed';

export type Season = {
  id: string;
  name: string;
  status: SeasonStatus;
  start_date: string | null; // ISO yyyy-mm-dd
  end_date: string | null;
};

/** Fila de `season_champions`: podio congelado de una temporada cerrada. */
export type SeasonChampion = {
  season_id: string;
  rank: 1 | 2 | 3;
  player_id: string;
  display_name: string;
  avatar_url: string | null;
  wins: number;
  points: number;
  points_diff: number;
};

export type MatchStatus =
  | 'available'
  | 'invited'
  | 'accepted'
  | 'result_pending'
  | 'validated'
  | 'declined';

/** Fila de la tabla matches (columnas que usa la app). */
export type Match = {
  id: string;
  season_id: string;
  player_a: string;
  player_b: string;
  inviter_id: string | null;
  invitee_id: string | null;
  winner_id: string | null;
  status: MatchStatus;
};

/** Fila de la vista `live_matches`: partidos en marcha o recien finalizados. */
export type LiveMatch = {
  id: string;
  status: 'accepted' | 'result_pending' | 'validated';
  player_a: string;
  player_b: string;
  winner_id: string | null;
  created_at: string;
  validated_at: string | null;
  name_a: string;
  avatar_a: string | null;
  name_b: string;
  avatar_b: string | null;
  sets_a: number;
  sets_b: number;
};

/** Un set del marcador (score_a/score_b = puntos de player_a/player_b). */
export type MatchSet = {
  set_number: number;
  score_a: number;
  score_b: number;
};

/** Perfil propio (lo que la app necesita mostrar). */
export type Profile = {
  display_name: string;
  avatar_url: string | null;
  membership_status: MembershipStatus;
  role: Role;
};
