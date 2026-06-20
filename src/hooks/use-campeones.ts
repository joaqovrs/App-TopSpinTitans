// Campeones: trae el podio (top 3) de la ULTIMA temporada cerrada con campeones.
// Alimenta tres cosas:
//   - la auto-apertura de la ceremonia la PRIMERA vez que entras tras el cierre
//     (controlada por un flag "ya lo vi" en localStorage de expo-sqlite),
//   - la alerta persistente en la campana de Inicio (visible mientras no haya
//     empezado otra temporada; NO depende del "ya lo vi"),
//   - el badge de campeon en el perfil.
import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';

import { useAuth } from '@/context/auth';
import { supabase } from '@/lib/supabase';
import type { SeasonChampion } from '@/lib/types';

const SEEN_KEY = 'celebrated_season';

function getSeen(): string | null {
  try {
    return (globalThis as any).localStorage?.getItem(SEEN_KEY) ?? null;
  } catch {
    return null;
  }
}

function setSeen(seasonId: string) {
  try {
    (globalThis as any).localStorage?.setItem(SEEN_KEY, seasonId);
  } catch {
    // sin persistencia: peor caso, la ceremonia se vuelve a auto-abrir. No es grave.
  }
}

export type Podium = {
  seasonId: string;
  seasonName: string;
  champions: SeasonChampion[]; // ordenados por rank (1, 2, 3)
};

export function useCampeones() {
  const { session } = useAuth();
  const uid = session?.user.id ?? '';

  const [podium, setPodium] = useState<Podium | null>(null);
  const [betweenSeasons, setBetweenSeasons] = useState(false);
  const [loading, setLoading] = useState(true);
  // Fuerza re-evaluar shouldCelebrate tras marcar una temporada como vista.
  const [seenTick, setSeenTick] = useState(0);

  const reload = useCallback(async () => {
    try {
      // ¿Hay una temporada viva (enrolling o active)? Si no, estamos "entre
      // temporadas": es cuando se muestra la premiacion (auto-apertura + campana).
      const viva = await supabase
        .from('seasons')
        .select('id')
        .in('status', ['enrolling', 'active'])
        .limit(1)
        .maybeSingle();
      setBetweenSeasons(!viva.error && !viva.data);

      // 1. La temporada cerrada mas reciente que tenga campeones.
      const latest = await supabase
        .from('season_champions')
        .select('season_id, seasons(name)')
        .order('captured_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (latest.error) throw latest.error;
      if (!latest.data) {
        setPodium(null);
        return;
      }

      const seasonId = latest.data.season_id as string;
      // La relacion anidada puede venir como objeto o arreglo segun el embed.
      const seasonRel = latest.data.seasons as { name: string } | { name: string }[] | null;
      const seasonName = Array.isArray(seasonRel) ? seasonRel[0]?.name : seasonRel?.name;

      // 2. El podio completo de esa temporada.
      const champs = await supabase
        .from('season_champions')
        .select('season_id, rank, player_id, display_name, avatar_url, wins, points, points_diff')
        .eq('season_id', seasonId)
        .order('rank', { ascending: true });
      if (champs.error) throw champs.error;

      setPodium({
        seasonId,
        seasonName: seasonName ?? 'la temporada',
        champions: (champs.data ?? []) as SeasonChampion[],
      });
    } catch {
      setPodium(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  const champion = podium?.champions.find((c) => c.rank === 1) ?? null;
  // Premiacion vigente: hay campeon y todavia no arranco otra temporada.
  const active = betweenSeasons && !!champion ? podium : null;

  // Marca la temporada como celebrada: corta la auto-apertura (no la campana).
  const markCelebrated = useCallback(() => {
    if (podium) {
      setSeen(podium.seasonId);
      setSeenTick((t) => t + 1);
    }
  }, [podium]);

  // seenTick fuerza la re-lectura del flag tras markCelebrated.
  void seenTick;
  // Auto-apertura: solo la PRIMERA vez por temporada (y mientras siga vigente).
  const shouldCelebrate = !!active && getSeen() !== active.seasonId;

  return {
    podium,
    champion,
    loading,
    /** Abrir la ceremonia automaticamente (una vez por temporada). */
    shouldCelebrate,
    markCelebrated,
    /** Alerta de premiacion para la campana de Inicio: persiste hasta que arranca
     *  la proxima temporada. Independiente del "ya lo vi". */
    seasonEndedAlert: active,
    /** ¿El usuario actual es el campeon vigente? (para el badge del perfil) */
    isReigningChampion: !!champion && champion.player_id === uid,
    reigningTitle: champion ? `Campeón — ${podium?.seasonName}` : null,
    reload,
  };
}
