// Datos de la pantalla de Inicio: mi posicion y stats (desde standings), cuantas
// acciones tengo pendientes (desde mis partidos) y mis partidos recientes.
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { useAuth } from '@/context/auth';
import { useRealtime } from '@/hooks/use-realtime';
import { supabase } from '@/lib/supabase';
import { actionFor } from '@/lib/matches';
import type { Match, Standing } from '@/lib/types';

export type RecentMatch = {
  matchId: string;
  opponentName: string;
  opponentAvatar: string | null;
  iWon: boolean;
};

/** Una accion que requiere mi atencion (lo que muestra el panel de notificaciones). */
export type PendingAction = {
  matchId: string;
  opponentName: string;
  opponentAvatar: string | null;
  action: 'responder' | 'cargar' | 'validar';
};

export type InicioData = {
  rank: number | null; // posicion en el ranking (null si no compite aun)
  total: number; // jugadores en el ranking
  points: number;
  wins: number;
  losses: number;
  pending: PendingAction[]; // retos/resultados que requieren mi accion
  recent: RecentMatch[];
};

const EMPTY: InicioData = {
  rank: null,
  total: 0,
  points: 0,
  wins: 0,
  losses: 0,
  pending: [],
  recent: [],
};

export function useInicio() {
  const { session } = useAuth();
  const uid = session?.user.id ?? '';

  const [data, setData] = useState<InicioData>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!uid) return;
    setError(null);
    try {
      const { data: season, error: seasonError } = await supabase
        .from('seasons')
        .select('id')
        .eq('status', 'active')
        .maybeSingle();
      if (seasonError) throw seasonError;
      if (!season) {
        setData(EMPTY);
        return;
      }

      const [matchesRes, standingsRes] = await Promise.all([
        supabase
          .from('matches')
          .select(
            'id, season_id, player_a, player_b, inviter_id, invitee_id, winner_id, status, validated_at'
          )
          .eq('season_id', season.id)
          .or(`player_a.eq.${uid},player_b.eq.${uid}`),
        supabase.from('standings').select('*'),
      ]);
      if (matchesRes.error) throw matchesRes.error;
      if (standingsRes.error) throw standingsRes.error;

      const standings = (standingsRes.data ?? []) as Standing[];
      const myIndex = standings.findIndex((s) => s.id === uid);
      const me = myIndex >= 0 ? standings[myIndex] : null;
      const nameById = new Map(standings.map((s) => [s.id, s.display_name]));
      const avatarById = new Map(standings.map((s) => [s.id, s.avatar_url]));

      const matches = matchesRes.data as (Match & { validated_at: string | null })[];

      const pending: PendingAction[] = matches
        .map((m) => ({ m, a: actionFor(m, uid) }))
        .filter(({ a }) => a === 'responder' || a === 'cargar' || a === 'validar')
        .map(({ m, a }) => {
          const oppId = m.player_a === uid ? m.player_b : m.player_a;
          return {
            matchId: m.id,
            opponentName: nameById.get(oppId) ?? 'Jugador',
            opponentAvatar: avatarById.get(oppId) ?? null,
            action: a as PendingAction['action'],
          };
        });

      const recent: RecentMatch[] = matches
        .filter((m) => m.status === 'validated')
        .sort((a, b) => (b.validated_at ?? '').localeCompare(a.validated_at ?? ''))
        .slice(0, 5)
        .map((m) => {
          const oppId = m.player_a === uid ? m.player_b : m.player_a;
          return {
            matchId: m.id,
            opponentName: nameById.get(oppId) ?? 'Jugador',
            opponentAvatar: avatarById.get(oppId) ?? null,
            iWon: m.winner_id === uid,
          };
        });

      setData({
        rank: me ? myIndex + 1 : null,
        total: standings.length,
        points: me?.points ?? 0,
        wins: me?.wins ?? 0,
        losses: me?.losses ?? 0,
        pending,
        recent,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el inicio.');
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      reload();
    }, [reload])
  );

  useRealtime(['matches'], reload);

  return { data, loading, error, reload };
}
