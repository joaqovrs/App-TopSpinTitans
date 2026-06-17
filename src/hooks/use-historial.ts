// Carga MIS partidos con actividad (invited/accepted/result_pending/validated)
// con su marcador set por set. La pantalla deriva badge y puntos del status.
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { useAuth } from '@/context/auth';
import { useRealtime } from '@/hooks/use-realtime';
import { supabase } from '@/lib/supabase';
import type { MatchStatus } from '@/lib/types';

export type HistSet = { n: number; mine: number; theirs: number };

export type HistorialItem = {
  matchId: string;
  status: MatchStatus;
  opponentName: string;
  opponentAvatar: string | null;
  iWon: boolean;
  mySets: number;
  theirSets: number;
  sets: HistSet[];
  validatedAt: string | null;
};

export type HistorialStats = {
  wins: number;
  losses: number;
  finished: number;
  points: number;
  effectiveness: number; // 0-100
};

type RawMatch = {
  id: string;
  status: MatchStatus;
  player_a: string;
  player_b: string;
  winner_id: string | null;
  validated_at: string | null;
  match_sets: { set_number: number; score_a: number; score_b: number }[];
};

// Orden: primero lo que requiere atencion / en juego, luego los finalizados.
const STATUS_ORDER: Record<string, number> = {
  result_pending: 0,
  accepted: 1,
  invited: 1,
  validated: 2,
};

export function useHistorial() {
  const { session } = useAuth();
  const uid = session?.user.id ?? '';

  const [items, setItems] = useState<HistorialItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!uid) return;
    setError(null);
    try {
      // Solo la temporada activa: el historial de esta temporada (los partidos
      // de temporadas pasadas quedan guardados, pero no se mezclan aca).
      const { data: season, error: seasonError } = await supabase
        .from('seasons')
        .select('id')
        .eq('status', 'active')
        .maybeSingle();
      if (seasonError) throw seasonError;
      if (!season) {
        setItems([]);
        return;
      }

      const [matchesRes, profilesRes] = await Promise.all([
        supabase
          .from('matches')
          .select(
            'id, status, player_a, player_b, winner_id, validated_at, match_sets(set_number, score_a, score_b)'
          )
          .eq('season_id', season.id)
          .in('status', ['invited', 'accepted', 'result_pending', 'validated'])
          .or(`player_a.eq.${uid},player_b.eq.${uid}`),
        supabase.from('profiles').select('id, display_name, avatar_url'),
      ]);
      if (matchesRes.error) throw matchesRes.error;
      if (profilesRes.error) throw profilesRes.error;

      const nameById = new Map<string, string>(
        (profilesRes.data ?? []).map((p) => [p.id, p.display_name])
      );
      const avatarById = new Map<string, string | null>(
        (profilesRes.data ?? []).map((p) => [p.id, p.avatar_url])
      );

      const built: HistorialItem[] = (matchesRes.data as RawMatch[]).map((m) => {
        const iAmA = m.player_a === uid;
        const opponentId = iAmA ? m.player_b : m.player_a;

        const sets: HistSet[] = [...m.match_sets]
          .sort((a, b) => a.set_number - b.set_number)
          .map((s) => ({
            n: s.set_number,
            mine: iAmA ? s.score_a : s.score_b,
            theirs: iAmA ? s.score_b : s.score_a,
          }));

        const mySets = sets.filter((s) => s.mine > s.theirs).length;
        const theirSets = sets.length - mySets;

        return {
          matchId: m.id,
          status: m.status,
          opponentName: nameById.get(opponentId) ?? 'Jugador',
          opponentAvatar: avatarById.get(opponentId) ?? null,
          iWon: m.winner_id === uid,
          mySets,
          theirSets,
          sets,
          validatedAt: m.validated_at,
        };
      });

      built.sort((a, b) => {
        const byStatus = (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9);
        if (byStatus !== 0) return byStatus;
        return (b.validatedAt ?? '').localeCompare(a.validatedAt ?? '');
      });

      setItems(built);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el historial.');
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

  useRealtime(['matches', 'match_sets'], reload);

  return { items, loading, error, reload };
}

export function computeStats(items: HistorialItem[]): HistorialStats {
  const finalized = items.filter((i) => i.status === 'validated');
  const wins = finalized.filter((i) => i.iWon).length;
  const losses = finalized.length - wins;
  const finished = finalized.length;
  const effectiveness = finished > 0 ? Math.round((wins / finished) * 100) : 0;
  return { wins, losses, finished, points: wins * 3, effectiveness };
}
