// Historial ("Desempeño"): resumen V/D/efectividad + lista de mis partidos con
// su estado (Victoria/Derrota/Por validar/En curso) y el marcador set por set.
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { CountUp } from '@/components/count-up';
import { FadeIn } from '@/components/fade-in';
import { ProgressBar } from '@/components/progress-bar';
import { ShareCard } from '@/components/share-card';
import { HistorialSkeleton } from '@/components/skeleton';
import { computeStats, useHistorial, type HistorialItem } from '@/hooks/use-historial';
import { useProfile } from '@/hooks/use-profile';
import { useShareMatch } from '@/hooks/use-share-match';
import { colors, fonts } from '@/lib/theme';

const GREEN = '#2EB82E';

type Badge = { label: string; color: string; bg: string };

function badgeFor(item: HistorialItem): Badge {
  switch (item.status) {
    case 'validated':
      return item.iWon
        ? { label: 'Victoria', color: GREEN, bg: 'rgba(46,184,46,0.12)' }
        : { label: 'Derrota', color: colors.primary, bg: 'rgba(229,55,52,0.12)' };
    case 'result_pending':
      return { label: 'Por validar', color: colors.gold, bg: 'rgba(255,204,51,0.12)' };
    default: // invited / accepted
      return { label: 'En curso', color: colors.gold, bg: 'rgba(255,204,51,0.12)' };
  }
}

export default function HistorialScreen() {
  const { items, loading, error, reload } = useHistorial();
  const { profile } = useProfile();
  const stats = computeStats(items);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const { cardRef, data: shareData, sharing, share, onCardLayout } = useShareMatch();

  const myName = profile?.display_name ?? 'Yo';
  const myAvatar = profile?.avatar_url ?? null;

  function handleShare(item: HistorialItem) {
    share({
      myName,
      myAvatar,
      opponentName: item.opponentName,
      opponentAvatar: item.opponentAvatar,
      mySets: item.mySets,
      theirSets: item.theirSets,
      iWon: item.iWon,
      sets: item.sets,
    });
  }

  function toggle(matchId: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(matchId)) next.delete(matchId);
      else next.add(matchId);
      return next;
    });
  }

  if (loading) {
    return <HistorialSkeleton />;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <FlatList
        data={items}
        keyExtractor={(i) => i.matchId}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={reload} tintColor={colors.mutedForeground} />
        }
        ListHeaderComponent={
          <View>
            <View style={styles.headerRow}>
              <Ionicons name="stats-chart" size={24} color={colors.primary} />
              <Text style={styles.headerTitle}>Desempeño</Text>
            </View>
            <Text style={styles.subtitle}>Tu historial de partidos esta temporada</Text>

            {error && <Text style={styles.error}>{error}</Text>}

            {/* Resumen */}
            <View style={styles.summary}>
              <View style={styles.summaryTop}>
                <Text style={styles.summaryVd}>
                  <Text style={{ color: GREEN }}>{stats.wins}V</Text>
                  <Text style={styles.dash}> — </Text>
                  <Text style={{ color: colors.primary }}>{stats.losses}D</Text>
                </Text>
                <CountUp value={stats.effectiveness} suffix="%" style={styles.eff} />
              </View>
              <View style={styles.summaryTop}>
                <Text style={styles.summarySub}>{stats.finished} partidos finalizados</Text>
                <Text style={styles.effLabel}>efectividad</Text>
              </View>
              <ProgressBar
                progress={stats.effectiveness / 100}
                color={colors.primary}
                trackColor={colors.secondary}
              />
              <View style={styles.summaryStats}>
                <Text style={styles.statItem}>
                  <Ionicons name="trophy-outline" size={13} color={colors.mutedForeground} />{' '}
                  {stats.wins} victorias
                </Text>
                <Text style={styles.statItem}>✕ {stats.losses} derrotas</Text>
                <Text style={styles.statItem}>— {stats.points} puntos</Text>
              </View>
            </View>

            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>MIS PARTIDOS</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{items.length}</Text>
              </View>
            </View>
          </View>
        }
        renderItem={({ item, index }) => (
          <FadeIn delay={Math.min(index * 45, 400)}>
            <MatchCard
              item={item}
              myName={myName}
              myAvatar={myAvatar}
              expanded={expanded.has(item.matchId)}
              onToggle={() => toggle(item.matchId)}
              onShare={() => handleShare(item)}
              sharing={sharing}
            />
          </FadeIn>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>Todavia no jugaste ningun partido.</Text>
        }
      />

      {/* Tarjeta para compartir: se renderiza fuera de pantalla solo mientras se
          captura, y se desmonta al terminar. */}
      {shareData && (
        <View style={styles.offscreen} pointerEvents="none">
          <ShareCard ref={cardRef} data={shareData} onLayout={onCardLayout} />
        </View>
      )}
    </SafeAreaView>
  );
}

// Contenedor de un partido: fila "versus" (mi foto · mi nombre · sets · nombre
// rival · foto rival) con el estado (Victoria/Derrota/En curso/Por validar)
// centrado debajo del marcador. Al tocarlo se despliega el detalle set por set
// (ganados en verde, perdidos rojo).
function MatchCard({
  item,
  myName,
  myAvatar,
  expanded,
  onToggle,
  onShare,
  sharing,
}: {
  item: HistorialItem;
  myName: string;
  myAvatar: string | null;
  expanded: boolean;
  onToggle: () => void;
  onShare: () => void;
  sharing: boolean;
}) {
  const badge = badgeFor(item);
  const hasSets = item.sets.length > 0;
  const canShare = item.status === 'validated' && hasSets;

  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: expanded ? 1 : 0,
      duration: 380,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: false,
    }).start();
  }, [expanded, anim]);

  const maxHeight = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 500] });
  const marginTop = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 12] });
  const paddingTop = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 12] });
  const borderTopWidth = anim.interpolate({ inputRange: [0, 0.1, 1], outputRange: [0, StyleSheet.hairlineWidth, StyleSheet.hairlineWidth] });
  const opacity = anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0.5, 1] });

  return (
    <View style={styles.card}>
      <Pressable onPress={hasSets ? onToggle : undefined}>
        {/* Fila versus: yo (izq) · sets + estado · rival (der) */}
        <View style={styles.versus}>
          <View style={styles.vsSide}>
            <Avatar name={myName} size={40} uri={myAvatar} />
            <Text style={styles.vsName} numberOfLines={1}>{myName}</Text>
          </View>

          <View style={styles.vsCenter}>
            <Text style={styles.vsScore}>
              {item.mySets}-{item.theirSets}
            </Text>
            <View style={[styles.badge, { backgroundColor: badge.bg }]}>
              <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
            </View>
          </View>

          <View style={[styles.vsSide, styles.vsSideRight]}>
            <Text style={[styles.vsName, styles.vsNameRight]} numberOfLines={1}>
              {item.opponentName}
            </Text>
            <Avatar name={item.opponentName} size={40} uri={item.opponentAvatar} />
          </View>
        </View>
      </Pressable>

      {/* Detalle set por set (desplegable con animación) */}
      {hasSets && (
        <Animated.View style={[styles.setDetails, { maxHeight, marginTop, paddingTop, borderTopWidth, opacity, overflow: 'hidden' }]}>
          {item.sets.map((s) => {
            const lost = s.mine < s.theirs;
            return (
              <View key={s.n} style={styles.setDetailRow}>
                <Text style={styles.setDetailLabel}>Set {s.n}</Text>
                <Text style={[styles.setDetailScore, { color: lost ? colors.primary : colors.win }]}>
                  {s.mine} - {s.theirs}
                </Text>
              </View>
            );
          })}

          {canShare && (
            <Pressable
              style={[styles.shareBtn, sharing && styles.shareBtnDisabled]}
              onPress={onShare}
              disabled={sharing}
            >
              {sharing ? (
                <ActivityIndicator size="small" color={colors.foreground} />
              ) : (
                <Ionicons name="share-social" size={18} color={colors.foreground} />
              )}
              <Text style={styles.shareBtnText}>
                {sharing ? 'Generando...' : 'Compartir resultado'}
              </Text>
            </Pressable>
          )}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { padding: 16, paddingBottom: 32 },

  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { color: colors.foreground, fontFamily: fonts.extrabold, fontSize: 26 },
  subtitle: { color: colors.mutedForeground, fontFamily: fonts.regular, marginTop: 4 },
  error: { color: colors.destructive, fontFamily: fonts.regular, marginTop: 8 },

  summary: {
    marginTop: 16,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 18,
    gap: 10,
  },
  summaryTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryVd: { fontFamily: fonts.extrabold, fontSize: 22 },
  dash: { color: colors.mutedForeground },
  eff: { color: colors.primary, fontFamily: fonts.extrabold, fontSize: 28 },
  summarySub: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 13 },
  effLabel: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 12 },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: colors.secondary, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: colors.primary },
  summaryStats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  statItem: { color: colors.mutedForeground, fontFamily: fonts.medium, fontSize: 12 },

  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 22, marginBottom: 12 },
  sectionTitle: { color: colors.foreground, fontFamily: fonts.bold, fontSize: 14, letterSpacing: 0.5 },
  countBadge: { backgroundColor: colors.secondary, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 2 },
  countText: { color: colors.mutedForeground, fontFamily: fonts.bold, fontSize: 12 },

  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  // Estado (Victoria/Derrota/En curso/Por validar), centrado bajo el marcador.
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontFamily: fonts.semibold, fontSize: 12 },

  // Fila versus.
  versus: { flexDirection: 'row', alignItems: 'center' },
  vsSide: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  vsSideRight: { justifyContent: 'flex-end' },
  vsName: { flex: 1, color: colors.foreground, fontFamily: fonts.semibold, fontSize: 14 },
  vsNameRight: { textAlign: 'right' },
  vsCenter: { alignItems: 'center', gap: 6, paddingHorizontal: 10 },
  vsScore: { color: colors.foreground, fontFamily: fonts.extrabold, fontSize: 20 },

  // Detalle de sets desplegable.
  setDetails: {
    borderTopColor: colors.border,
    gap: 8,
    overflow: 'hidden',
  },
  setDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  setDetailLabel: { color: colors.mutedForeground, fontFamily: fonts.medium, fontSize: 13 },
  setDetailScore: { fontFamily: fonts.bold, fontSize: 15 },

  empty: { textAlign: 'center', color: colors.mutedForeground, marginTop: 40, fontFamily: fonts.regular },

  // Boton para compartir el resultado en una historia.
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
    backgroundColor: colors.secondary,
    borderRadius: 10,
    paddingVertical: 12,
  },
  shareBtnDisabled: { opacity: 0.6 },
  shareBtnText: { color: colors.foreground, fontFamily: fonts.semibold, fontSize: 14 },

  // Contenedor fuera de pantalla donde se monta la ShareCard para capturarla.
  offscreen: { position: 'absolute', left: -10000, top: 0 },
});
