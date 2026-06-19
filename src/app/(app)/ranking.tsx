// Pantalla de Ranking — diseño Base44.
// Encabezado (trofeo + progreso), podio de los 3 primeros y lista del resto.
// Lee la vista `standings` (ranking calculado en el backend).
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  Animated,
  Easing,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { FadeIn } from '@/components/fade-in';
import { ProgressBar } from '@/components/progress-bar';
import { RankingSkeleton } from '@/components/skeleton';
import { useRealtime } from '@/hooks/use-realtime';
import { supabase } from '@/lib/supabase';
import { colors, fonts } from '@/lib/theme';
import type { Standing } from '@/lib/types';

type Place = 1 | 2 | 3;

// Config del podio por posicion: color, tinte de fondo, icono, tamaño de avatar,
// tamaño del puntaje y alto de la tarjeta (para el escalonado tipo podio).
// El escalonado se logra con paddingVertical (mas alto el 1ro), no con altura
// fija, asi cada tarjeta se ajusta a su contenido (sin espacio vacio arriba).
const PODIUM: Record<
  Place,
  { color: string; bg: string; icon: 'trophy' | 'medal'; avatar: number; pointsSize: number; padV: number }
> = {
  1: { color: colors.gold,   bg: 'rgba(255,204,51,0.12)',  icon: 'trophy', avatar: 64, pointsSize: 32, padV: 22 },
  2: { color: colors.silver, bg: 'rgba(217,217,217,0.10)', icon: 'medal',  avatar: 52, pointsSize: 22, padV: 16 },
  3: { color: colors.bronze, bg: 'rgba(224,146,47,0.12)',  icon: 'medal',  avatar: 52, pointsSize: 22, padV: 12 },
};

const FIRE = '#FF6B00';
const STREAK_FOR_FIRE = 3;

function onFire(s: Standing): boolean {
  return s.streak >= STREAK_FOR_FIRE;
}

function record(s: Standing): string {
  return `${s.wins}G / ${s.losses}P`;
}

// Capa naranja que titila como llama (detras del contenedor en racha).
function FireGlow({ radius, inset }: { radius: number; inset: number }) {
  const flick = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(flick, { toValue: 1, duration: 520, easing: Easing.out(Easing.quad), useNativeDriver: false }),
        Animated.timing(flick, { toValue: 0.4, duration: 420, useNativeDriver: false }),
        Animated.timing(flick, { toValue: 0.8, duration: 380, useNativeDriver: false }),
        Animated.timing(flick, { toValue: 0.5, duration: 600, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [flick]);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: inset,
        left: inset,
        right: inset,
        bottom: inset,
        borderRadius: radius,
        backgroundColor: FIRE,
        opacity: flick.interpolate({ inputRange: [0, 1], outputRange: [0.12, 0.42] }),
      }}
    />
  );
}

function PodiumCard({ s, place }: { s: Standing; place: Place }) {
  const cfg = PODIUM[place];

  // Glow titilante (pulso) en los 3 del podio: un halo del color de la medalla
  // detras de la tarjeta. El 1ro late mas fuerte; 2do y 3ro mas tenue. Funciona
  // en web, iOS y Android. Ritmo distinto por puesto para que no laten sincronizados.
  const glow = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const duration = place === 1 ? 1000 : 1300;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(glow, { toValue: 0, duration, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [place, glow]);

  const maxOpacity = place === 1 ? 0.28 : 0.12;
  const minOpacity = place === 1 ? 0.08 : 0.03;
  const fire = onFire(s);

  return (
    <View style={styles.podiumColumn}>
      {fire ? (
        <FireGlow radius={18} inset={-3} />
      ) : (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.halo,
            {
              backgroundColor: cfg.color,
              opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [minOpacity, maxOpacity] }),
              transform: [
                { scale: glow.interpolate({ inputRange: [0, 1], outputRange: [0.99, place === 1 ? 1.02 : 1.01] }) },
              ],
            },
          ]}
        />
      )}
      <View
        style={[
          styles.podiumCard,
          { backgroundColor: cfg.bg, borderColor: fire ? FIRE : cfg.color, paddingVertical: cfg.padV },
        ]}>
        <View style={styles.avatarWrap}>
          <Avatar name={s.display_name} size={cfg.avatar} ringColor={cfg.color} uri={s.avatar_url} />
          <View style={[styles.medalBadge, { backgroundColor: cfg.color }]}>
            <Ionicons name={cfg.icon} size={12} color={colors.background} />
          </View>
        </View>
        <Text style={styles.podiumName} numberOfLines={2}>
          {s.display_name}{fire ? ' 🔥' : ''}
        </Text>
        <Text style={[styles.podiumPoints, { color: cfg.color, fontSize: cfg.pointsSize }]}>
          {s.points}
        </Text>
        <Text style={styles.record}>{record(s)}</Text>
      </View>
    </View>
  );
}

export default function RankingScreen() {
  const [rows, setRows] = useState<Standing[]>([]);
  const [completed, setCompleted] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      // standings ya viene acotada a la temporada activa (vista del backend).
      // Los partidos completados se cuentan solo de esa temporada.
      const { data: season, error: seasonError } = await supabase
        .from('seasons')
        .select('id')
        .eq('status', 'active')
        .maybeSingle();
      if (seasonError) throw seasonError;

      const standingsRes = await supabase.from('standings').select('*');
      if (standingsRes.error) throw standingsRes.error;
      setRows((standingsRes.data ?? []) as Standing[]);

      if (!season) {
        setCompleted(0);
        return;
      }
      const validatedRes = await supabase
        .from('matches')
        .select('id', { count: 'exact', head: true })
        .eq('season_id', season.id)
        .eq('status', 'validated');
      if (validatedRes.error) throw validatedRes.error;
      setCompleted(validatedRes.count ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cargar el ranking.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useRealtime(['matches'], load);

  function onRefresh() {
    setRefreshing(true);
    load();
  }

  // Total de partidos del round-robin = N*(N-1)/2 con N = jugadores aprobados.
  const n = rows.length;
  const totalMatches = (n * (n - 1)) / 2;
  const progress = totalMatches > 0 ? completed / totalMatches : 0;

  const [first, second, third] = rows;
  const rest = rows.slice(3);

  if (loading) {
    return <RankingSkeleton />;
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
          <Pressable style={styles.retry} onPress={load}>
            <Text style={styles.retryText}>Reintentar</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.mutedForeground}
          />
        }>
        {/* Encabezado */}
        <View style={styles.headerRow}>
          <Ionicons name="trophy" size={26} color={colors.gold} />
          <Text style={styles.headerTitle}>Top Spin Titans</Text>
        </View>
        <Text style={styles.subtitle}>
          {completed} de {totalMatches} partidos completados
        </Text>
        <View style={styles.progressWrap}>
          <ProgressBar progress={progress} color={colors.primary} trackColor={colors.secondary} />
        </View>

        {/* Podio escalonado: 2do izquierda, 1ro centro (elevado), 3ro derecha */}
        {first && (
          <View style={styles.podium}>
            {second ? (
              <FadeIn style={styles.podiumSlot} delay={120}>
                <PodiumCard s={second} place={2} />
              </FadeIn>
            ) : (
              <View style={styles.podiumSpacer} />
            )}
            <FadeIn style={styles.podiumSlot} delay={0}>
              <PodiumCard s={first} place={1} />
            </FadeIn>
            {third ? (
              <FadeIn style={styles.podiumSlot} delay={240}>
                <PodiumCard s={third} place={3} />
              </FadeIn>
            ) : (
              <View style={styles.podiumSpacer} />
            )}
          </View>
        )}

        {/* Lista del #4 en adelante: un solo contenedor con divisores */}
        {rest.length > 0 && (
          <View style={styles.listCard}>
            {rest.map((item, index) => {
              const fire = onFire(item);
              return (
                <FadeIn key={item.id} delay={Math.min(index * 40, 400)}>
                  <View style={[styles.listRow, index > 0 && styles.listRowDivider]}>
                    {fire && <FireGlow radius={8} inset={0} />}
                    <Text style={styles.rank}>#{index + 4}</Text>
                    <Avatar name={item.display_name} size={40} uri={item.avatar_url} />
                    <Text style={styles.name} numberOfLines={1}>
                      {item.display_name}{fire ? ' 🔥' : ''}
                    </Text>
                    <View style={styles.rightCol}>
                      <Text style={styles.points}>{item.points}</Text>
                      <Text style={styles.record}>{record(item)}</Text>
                    </View>
                  </View>
                </FadeIn>
              );
            })}
          </View>
        )}

        {rows.length === 0 && (
          <Text style={styles.empty}>Todavia no hay jugadores en el ranking.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  listContent: { padding: 16, paddingBottom: 32 },

  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { color: colors.foreground, fontFamily: fonts.extrabold, fontSize: 26 },
  subtitle: { color: colors.mutedForeground, fontFamily: fonts.regular, marginTop: 4 },
  progressWrap: { marginTop: 12 },

  podium: { flexDirection: 'row', gap: 10, marginTop: 20, alignItems: 'flex-end' },
  podiumSlot: { flex: 1 },
  podiumColumn: { position: 'relative' },
  halo: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: 18,
  },
  podiumCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 6,
  },
  podiumSpacer: { flex: 1 },
  avatarWrap: { position: 'relative' },
  medalBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  podiumName: {
    color: colors.foreground,
    fontFamily: fonts.semibold,
    fontSize: 13,
    textAlign: 'center',
  },
  podiumPoints: { fontFamily: fonts.extrabold },

  listCard: {
    marginTop: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    position: 'relative',
  },
  listRowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  rank: { color: colors.mutedForeground, fontFamily: fonts.semibold, width: 32 },
  name: { flex: 1, color: colors.foreground, fontFamily: fonts.semibold, fontSize: 15 },
  rightCol: { alignItems: 'flex-end' },
  points: { color: colors.primary, fontFamily: fonts.bold, fontSize: 17 },
  record: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 12 },

  error: { color: colors.destructive, textAlign: 'center', paddingHorizontal: 24, fontFamily: fonts.regular },
  retry: {
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 22,
  },
  retryText: { color: colors.primary, fontFamily: fonts.semibold },
  empty: { textAlign: 'center', color: colors.mutedForeground, marginTop: 40, fontFamily: fonts.regular },
});
