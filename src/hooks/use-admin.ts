// Datos del panel de admin: todos los perfiles (el admin los ve por RLS) y el
// conteo de resultados en espera de validacion.
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { useRealtime } from '@/hooks/use-realtime';
import { supabase } from '@/lib/supabase';
import type { MembershipStatus, Role, Season } from '@/lib/types';

export type AdminPlayer = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  membership_status: MembershipStatus;
  role: Role;
};

export function useAdmin() {
  const [players, setPlayers] = useState<AdminPlayer[]>([]);
  const [resultsPending, setResultsPending] = useState(0);
  const [liveSeason, setLiveSeason] = useState<Season | null>(null);
  const [closedSeasons, setClosedSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const [profilesRes, seasonsRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, display_name, avatar_url, membership_status, role')
          .order('display_name'),
        supabase
          .from('seasons')
          .select('id, name, status, start_date, end_date')
          .order('created_at', { ascending: false }),
      ]);
      if (profilesRes.error) throw profilesRes.error;
      if (seasonsRes.error) throw seasonsRes.error;

      const seasons = (seasonsRes.data ?? []) as Season[];
      const active = seasons.find((s) => s.status === 'active') ?? null;

      // "Resultados por validar" solo de la temporada activa.
      let pendingResults = 0;
      if (active) {
        const matchesRes = await supabase
          .from('matches')
          .select('id', { count: 'exact', head: true })
          .eq('season_id', active.id)
          .eq('status', 'result_pending');
        if (matchesRes.error) throw matchesRes.error;
        pendingResults = matchesRes.count ?? 0;
      }

      setPlayers((profilesRes.data ?? []) as AdminPlayer[]);
      setResultsPending(pendingResults);
      setLiveSeason(
        seasons.find((s) => s.status === 'enrolling' || s.status === 'active') ?? null
      );
      setClosedSeasons(seasons.filter((s) => s.status === 'closed'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el panel.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      reload();
    }, [reload])
  );

  useRealtime(['matches', 'profiles', 'seasons'], reload);

  const pending = players.filter((p) => p.membership_status === 'pending');

  return {
    players,
    pending,
    resultsPending,
    liveSeason,
    closedSeasons,
    loading,
    error,
    reload,
  };
}
