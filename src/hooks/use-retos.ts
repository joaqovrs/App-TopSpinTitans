// Carga los partidos del usuario en la temporada activa y los combina con los
// datos del rival (nombre, puntos, record) que ya provee la vista standings.
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { useAuth } from '@/context/auth';
import { useRealtime } from '@/hooks/use-realtime';
import { supabase } from '@/lib/supabase';
import { actionFor, opponentId, type RetoAction } from '@/lib/matches';
import type { Match, Standing } from '@/lib/types';

export type RetoItem = {
  match: Match;
  opponent: Standing | null;
  rank: number; // posicion del rival en el ranking (1-based)
  action: RetoAction;
};

export function useRetos() {
  const { session } = useAuth();
  const uid = session?.user.id ?? '';

  const [items, setItems] = useState<RetoItem[]>([]);
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
        setItems([]);
        return;
      }

      const [matchesRes, standingsRes] = await Promise.all([
        supabase
          .from('matches')
          .select(
            'id, season_id, player_a, player_b, inviter_id, invitee_id, winner_id, status'
          )
          .eq('season_id', season.id)
          .or(`player_a.eq.${uid},player_b.eq.${uid}`),
        supabase.from('standings').select('*'),
      ]);
      if (matchesRes.error) throw matchesRes.error;
      if (standingsRes.error) throw standingsRes.error;

      const standings = (standingsRes.data ?? []) as Standing[];
      const rankById = new Map<string, number>();
      standings.forEach((s, i) => rankById.set(s.id, i + 1));
      const byId = new Map(standings.map((s) => [s.id, s]));

      const built: RetoItem[] = (matchesRes.data as Match[]).map((match) => {
        const oppId = opponentId(match, uid);
        return {
          match,
          opponent: byId.get(oppId) ?? null,
          rank: rankById.get(oppId) ?? 999,
          action: actionFor(match, uid),
        };
      });

      built.sort((a, b) => a.rank - b.rank);
      setItems(built);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar los retos.');
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

  // Tiempo real: si cambia algun partido, recargar.
  useRealtime(['matches'], reload);

  return { items, loading, error, reload, uid };
}
