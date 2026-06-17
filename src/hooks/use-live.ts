// Partidos en vivo de la liga (de los DEMAS): los que estan en marcha y los que
// recien finalizaron. Lee la vista publica live_matches.
//
// Refresco: como la RLS no deja que un jugador "escuche" los partidos ajenos en
// curso por realtime, se combina un sondeo cada 15s (mientras la pantalla esta
// enfocada) con el refresco al enfocar. Las transiciones a validado igual llegan
// por realtime (esa fila ya es publica).
import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { useAuth } from '@/context/auth';
import { useRealtime } from '@/hooks/use-realtime';
import { supabase } from '@/lib/supabase';
import type { LiveMatch } from '@/lib/types';

const POLL_MS = 15000;
const MAX_FINISHED = 6; // cuantos resultados recientes mostrar

export function useLive() {
  const { session } = useAuth();
  const uid = session?.user.id ?? '';

  const [ongoing, setOngoing] = useState<LiveMatch[]>([]);
  const [finished, setFinished] = useState<LiveMatch[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const { data, error } = await supabase.from('live_matches').select('*');
    if (error) {
      setLoading(false);
      return;
    }
    // Partidos ajenos solamente (los mios viven en "MIS PARTIDOS").
    const rows = (data as LiveMatch[]).filter(
      (m) => m.player_a !== uid && m.player_b !== uid
    );

    const live = rows
      .filter((m) => m.status === 'accepted' || m.status === 'result_pending')
      .sort((a, b) => b.created_at.localeCompare(a.created_at));

    const done = rows
      .filter((m) => m.status === 'validated')
      .sort((a, b) => (b.validated_at ?? '').localeCompare(a.validated_at ?? ''))
      .slice(0, MAX_FINISHED);

    setOngoing(live);
    setFinished(done);
    setLoading(false);
  }, [uid]);

  // Sondeo mientras la pantalla esta enfocada.
  const reloadRef = useRef(reload);
  reloadRef.current = reload;
  useFocusEffect(
    useCallback(() => {
      reloadRef.current();
      const id = setInterval(() => reloadRef.current(), POLL_MS);
      return () => clearInterval(id);
    }, [])
  );

  useEffect(() => {
    if (!uid) return;
    reload();
  }, [uid, reload]);

  useRealtime(['matches'], reload);

  return { ongoing, finished, loading };
}
