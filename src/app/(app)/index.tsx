// Inicio: lo primero que ve el jugador. Cabecera con su posicion y un boton de
// notificaciones (acciones pendientes), partidos en vivo de la liga, sus
// partidos y los demas partidos finalizados. Diseño Base44.
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { useInicio, type PendingAction } from '@/hooks/use-inicio';
import { useLive } from '@/hooks/use-live';
import { useProfile } from '@/hooks/use-profile';
import { colors, fonts } from '@/lib/theme';
import type { LiveMatch } from '@/lib/types';

const GREEN = '#2EB82E';


export default function HomeScreen() {
  const router = useRouter();
  const { profile, loading: loadingProfile } = useProfile();
  const { data, loading: loadingData } = useInicio();
  const { ongoing, finished } = useLive();
  const [notifOpen, setNotifOpen] = useState(false);

  const name = profile?.display_name ?? '';
  const approved = profile?.membership_status === 'approved';
  const notifCount = data.pending.length;

  if (loadingProfile || loadingData) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Cabecera: avatar + posicion + boton de notificaciones */}
        <View style={styles.header}>
          <LinearGradient
            colors={['rgba(229,55,52,0.38)', 'rgba(229,55,52,0.10)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}
          />
          <Pressable style={styles.headerMain} onPress={() => router.push('/(app)/perfil')}>
            <View>
              <Avatar name={name || '?'} size={64} ringColor={colors.primary} uri={profile?.avatar_url} />
              {data.rank !== null && (
                <View style={styles.rankBadge}>
                  <Text style={styles.rankBadgeText}>#{data.rank}</Text>
                </View>
              )}
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.name}>{name}</Text>
              {!approved ? (
                <Text style={styles.pending}>Pendiente de aprobacion</Text>
              ) : data.rank !== null ? (
                <View style={styles.posRow}>
                  <Ionicons name="trophy-outline" size={14} color={colors.gold} />
                  <Text style={styles.position}>
                    Posicion #{data.rank} de {data.total}
                  </Text>
                </View>
              ) : (
                <Text style={styles.pending}>Sin temporada activa</Text>
              )}
            </View>
          </Pressable>

          {/* Boton de notificaciones (acciones pendientes) */}
          <Pressable style={styles.bellBtn} onPress={() => setNotifOpen(true)}>
            <Ionicons name="notifications-outline" size={22} color={colors.foreground} />
            {notifCount > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{notifCount}</Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Partidos EN VIVO de la liga (solo los que se estan jugando ahora) */}
        <View style={styles.liveHeader}>
          <View style={styles.liveDot} />
          <Text style={styles.sectionTitle}>PARTIDOS EN VIVO</Text>
        </View>
        {ongoing.length === 0 ? (
          <Text style={styles.empty}>No hay nadie jugando en este momento.</Text>
        ) : (
          <View style={styles.matchesCard}>
            {ongoing.map((m, i) => (
              <LiveRow key={m.id} m={m} first={i === 0} />
            ))}
          </View>
        )}

        {/* Mis partidos recientes */}
        <Text style={styles.sectionTitle}>MIS PARTIDOS</Text>
        {data.recent.length === 0 ? (
          <Text style={styles.empty}>Todavia no jugaste ningun partido.</Text>
        ) : (
          <View style={styles.matchesCard}>
            {data.recent.map((m, i) => (
              <View
                key={m.matchId}
                style={[styles.matchRow, i > 0 && styles.matchRowBorder]}>
                <Avatar name={m.opponentName} size={36} uri={m.opponentAvatar} />
                <View style={styles.matchInfo}>
                  <Text style={styles.matchName} numberOfLines={1}>
                    {m.opponentName}
                  </Text>
                  <Text style={[styles.matchResult, { color: m.iWon ? GREEN : colors.primary }]}>
                    {m.iWon ? 'Victoria' : 'Derrota'}
                  </Text>
                </View>
                <View style={styles.doneBadge}>
                  <Text style={styles.doneBadgeText}>Finalizado</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Otros partidos de la liga ya finalizados */}
        <Text style={styles.sectionTitle}>OTROS PARTIDOS</Text>
        {finished.length === 0 ? (
          <Text style={styles.empty}>Todavia no hay partidos finalizados.</Text>
        ) : (
          <View style={styles.matchesCard}>
            {finished.map((m, i) => (
              <LiveRow key={m.id} m={m} first={i === 0} />
            ))}
          </View>
        )}
      </ScrollView>

      <NotificationsModal
        visible={notifOpen}
        pending={data.pending}
        onClose={() => setNotifOpen(false)}
        onSelect={() => {
          setNotifOpen(false);
          router.push('/(app)/retos');
        }}
      />
    </SafeAreaView>
  );
}

// Panel de notificaciones: lista las acciones pendientes (responder/cargar/
// validar) con un color e icono propio segun el tipo, y un boton que lleva a la
// pantalla de Retos para resolverlas.
const NOTIF_META: Record<
  PendingAction['action'],
  {
    icon: keyof typeof Ionicons.glyphMap;
    tint: string;
    bg: string;
    tag: string;
    title: (n: string) => string;
    sub: string;
  }
> = {
  responder: {
    icon: 'flash',
    tint: colors.primary,
    bg: 'rgba(229,55,52,0.14)',
    tag: 'Nuevo reto',
    title: (n) => `${n} te retó a un duelo`,
    sub: 'Acepta o rechaza el desafío',
  },
  cargar: {
    icon: 'create',
    tint: colors.gold,
    bg: 'rgba(255,204,51,0.14)',
    tag: 'Pendiente',
    title: (n) => `Carga tu partido vs ${n}`,
    sub: 'Sube el resultado para validarlo',
  },
  validar: {
    icon: 'checkmark-circle',
    tint: colors.gold,
    bg: 'rgba(255,204,51,0.14)',
    tag: 'Por validar',
    title: (n) => `Confirma el marcador vs ${n}`,
    sub: 'Tu rival ya cargó el resultado',
  },
};

function NotificationsModal({
  visible,
  pending,
  onClose,
  onSelect,
}: {
  visible: boolean;
  pending: PendingAction[];
  onClose: () => void;
  onSelect: () => void;
}) {
  const empty = pending.length === 0;
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.notifBackdrop} onPress={onClose}>
        <Pressable style={styles.notifCard} onPress={(e) => e.stopPropagation()}>
          <View style={styles.notifHeader}>
            <View style={styles.notifHeaderLeft}>
              <View style={styles.notifHeaderIcon}>
                <Ionicons name="notifications" size={18} color={colors.primary} />
              </View>
              <Text style={styles.notifTitle}>Notificaciones</Text>
              {!empty && (
                <View style={styles.notifCountPill}>
                  <Text style={styles.notifCountText}>{pending.length}</Text>
                </View>
              )}
            </View>
            <Pressable hitSlop={8} onPress={onClose}>
              <Ionicons name="close" size={22} color={colors.mutedForeground} />
            </Pressable>
          </View>

          {empty ? (
            <View style={styles.notifEmpty}>
              <View style={styles.notifEmptyIcon}>
                <Ionicons name="notifications-off-outline" size={28} color={colors.mutedForeground} />
              </View>
              <Text style={styles.notifEmptyText}>Estás al día</Text>
              <Text style={styles.notifEmptySub}>
                Cuando alguien te rete o tengas que cargar un resultado, lo verás acá.
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.notifList}>
                {pending.map((p) => {
                  const meta = NOTIF_META[p.action];
                  return (
                    <Pressable key={p.matchId} style={styles.notifRow} onPress={onSelect}>
                      <View style={[styles.notifIcon, { backgroundColor: meta.bg }]}>
                        <Ionicons name={meta.icon} size={20} color={meta.tint} />
                      </View>
                      <View style={styles.notifInfo}>
                        <View style={styles.notifTagRow}>
                          <View style={[styles.notifTag, { backgroundColor: meta.bg }]}>
                            <Text style={[styles.notifTagText, { color: meta.tint }]}>{meta.tag}</Text>
                          </View>
                        </View>
                        <Text style={styles.notifRowTitle} numberOfLines={1}>
                          {meta.title(p.opponentName)}
                        </Text>
                        <Text style={styles.notifRowSub} numberOfLines={1}>
                          {meta.sub}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
                    </Pressable>
                  );
                })}
              </View>

              <Pressable style={styles.notifCta} onPress={onSelect}>
                <Text style={styles.notifCtaText}>Resolver en Retos</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </Pressable>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// Una fila de "Partidos en vivo": A vs B. Si esta en marcha muestra una etiqueta
// "EN VIVO"; si finalizo, muestra el tanteador de sets con el ganador resaltado.
function LiveRow({ m, first }: { m: LiveMatch; first: boolean }) {
  const done = m.status === 'validated';

  return (
    <View style={[styles.liveRow, !first && styles.matchRowBorder]}>
      <View style={styles.liveSide}>
        <Avatar name={m.name_a} size={32} uri={m.avatar_a} />
        <Text style={styles.liveName} numberOfLines={1}>
          {m.name_a}
        </Text>
      </View>

      <View style={styles.liveCenter}>
        {done ? (
          <Text style={styles.liveScore}>
            {m.sets_a}-{m.sets_b}
          </Text>
        ) : (
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveBadgeText}>EN VIVO</Text>
          </View>
        )}
        <Text style={styles.liveStatus}>
          {m.status === 'accepted'
            ? 'En juego'
            : m.status === 'result_pending'
            ? 'Definiendo'
            : 'Finalizado'}
        </Text>
      </View>

      <View style={[styles.liveSide, styles.liveSideRight]}>
        <Text style={[styles.liveName, styles.liveNameRight]} numberOfLines={1}>
          {m.name_b}
        </Text>
        <Avatar name={m.name_b} size={32} uri={m.avatar_b} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, paddingBottom: 32, gap: 16 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    overflow: 'hidden',
  },
  headerMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14 },
  bellBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.card,
  },
  bellBadgeText: { color: '#fff', fontFamily: fonts.bold, fontSize: 11 },
  rankBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderWidth: 2,
    borderColor: colors.card,
  },
  rankBadgeText: { color: '#fff', fontFamily: fonts.bold, fontSize: 11 },
  headerInfo: { flex: 1 },
  name: { color: colors.foreground, fontFamily: fonts.extrabold, fontSize: 22 },
  posRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  position: { color: colors.mutedForeground, fontFamily: fonts.medium, fontSize: 13 },
  pending: { color: colors.gold, fontFamily: fonts.medium, fontSize: 13, marginTop: 4 },

  // Modal de notificaciones.
  notifBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-start',
    paddingTop: 90,
    paddingHorizontal: 16,
  },
  notifCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 16,
  },
  notifHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notifHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  notifHeaderIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(229,55,52,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifTitle: { color: colors.foreground, fontFamily: fonts.bold, fontSize: 18 },
  notifCountPill: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifCountText: { color: '#fff', fontFamily: fonts.bold, fontSize: 12 },

  notifEmpty: { alignItems: 'center', gap: 8, paddingTop: 22, paddingBottom: 6 },
  notifEmptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  notifEmptyText: { color: colors.foreground, fontFamily: fonts.bold, fontSize: 16, textAlign: 'center' },
  notifEmptySub: {
    color: colors.mutedForeground,
    fontFamily: fonts.regular,
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 12,
  },

  notifList: { gap: 8, marginTop: 14 },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  notifIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifInfo: { flex: 1, gap: 2 },
  notifTagRow: { flexDirection: 'row' },
  notifTag: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2, marginBottom: 2 },
  notifTagText: { fontFamily: fonts.bold, fontSize: 10, letterSpacing: 0.4, textTransform: 'uppercase' },
  notifRowTitle: { color: colors.foreground, fontFamily: fonts.semibold, fontSize: 15 },
  notifRowSub: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 13 },

  notifCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 14,
  },
  notifCtaText: { color: '#fff', fontFamily: fonts.bold, fontSize: 15 },

  sectionTitle: { color: colors.foreground, fontFamily: fonts.bold, fontSize: 14, letterSpacing: 0.5 },
  empty: { color: colors.mutedForeground, fontFamily: fonts.regular, textAlign: 'center', marginTop: 8 },

  liveHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 8 },
  liveSide: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveSideRight: { justifyContent: 'flex-end' },
  liveName: { flex: 1, color: colors.foreground, fontFamily: fonts.semibold, fontSize: 13 },
  liveNameRight: { textAlign: 'right' },
  liveCenter: { alignItems: 'center', gap: 3, minWidth: 64 },
  liveScore: { color: colors.foreground, fontFamily: fonts.extrabold, fontSize: 18 },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(229,55,52,0.14)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.primary },
  liveBadgeText: { color: colors.primary, fontFamily: fonts.bold, fontSize: 10, letterSpacing: 0.5 },
  liveStatus: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 11 },

  matchesCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  matchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  matchRowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  matchInfo: { flex: 1 },
  matchName: { color: colors.foreground, fontFamily: fonts.semibold, fontSize: 15 },
  matchResult: { fontFamily: fonts.semibold, fontSize: 13, marginTop: 2 },
  doneBadge: {
    borderWidth: 1,
    borderColor: GREEN,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  doneBadgeText: { color: GREEN, fontFamily: fonts.semibold, fontSize: 12 },
});
