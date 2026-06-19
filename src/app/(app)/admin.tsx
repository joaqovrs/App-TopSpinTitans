// Panel de admin (fuera de los tabs: sin barra inferior, con flecha para volver).
// Solo accesible para el rol admin. Aprobar/rechazar solicitudes y ver jugadores.
import { Ionicons } from '@expo/vector-icons';
import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { ConfirmModal } from '@/components/confirm-modal';
import { SeasonManager } from '@/components/season-manager';
import { AdminSkeleton } from '@/components/skeleton';
import { useAdmin, type AdminPlayer } from '@/hooks/use-admin';
import { useProfile } from '@/hooks/use-profile';
import { approvePlayer, rejectPlayer, revokePlayer } from '@/lib/admin';
import { colors, fonts } from '@/lib/theme';
import type { MembershipStatus } from '@/lib/types';

const GREEN = '#2EB82E';

const STATUS: Record<MembershipStatus, { label: string; color: string; bg: string }> = {
  approved: { label: 'Aprobado', color: GREEN, bg: 'rgba(46,184,46,0.14)' },
  pending: { label: 'Pendiente', color: colors.gold, bg: 'rgba(255,204,51,0.14)' },
  rejected: { label: 'Rechazado', color: colors.primary, bg: 'rgba(229,55,52,0.14)' },
};

export default function AdminScreen() {
  const router = useRouter();
  const { profile, loading: loadingProfile } = useProfile();
  const { players, pending, resultsPending, liveSeason, closedSeasons, loading, error, reload } =
    useAdmin();
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [toRemove, setToRemove] = useState<AdminPlayer | null>(null);

  // "Todos los jugadores" = solo los aprobados (los que estan en la liga).
  // Pendientes viven en solicitudes; rechazados no se listan.
  const roster = players.filter((p) => p.membership_status === 'approved');

  // Doble candado: si no es admin, no entra (el backend igual lo bloquea).
  if (!loadingProfile && profile && profile.role !== 'admin') {
    return <Redirect href="/(app)" />;
  }

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setActionError(null);
    try {
      await action();
      await reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Algo salio mal.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Cabecera con volver */}
      <Pressable style={styles.backRow} onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={22} color={colors.foreground} />
        <Text style={styles.backText}>Perfil</Text>
      </Pressable>

      {loading || loadingProfile ? (
        <AdminSkeleton />
      ) : (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled">
          <View style={styles.titleRow}>
            <View style={styles.titleIcon}>
              <Ionicons name="shield-checkmark" size={22} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.title}>Panel Admin</Text>
              <Text style={styles.subtitle}>Control de liga</Text>
            </View>
          </View>

          {/* Gestion de temporada */}
          <SeasonManager
            liveSeason={liveSeason}
            closedSeasons={closedSeasons}
            onChanged={reload}
          />

          {/* Stats */}
          <View style={styles.stats}>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: colors.gold }]}>{pending.length}</Text>
              <Text style={styles.statLabel}>Ingresos pendientes</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{resultsPending}</Text>
              <Text style={styles.statLabel}>Resultados por validar</Text>
            </View>
          </View>

          {(error || actionError) && <Text style={styles.error}>{actionError ?? error}</Text>}

          {/* Solicitudes de ingreso */}
          <View style={styles.sectionRow}>
            <Ionicons name="people-outline" size={16} color={colors.foreground} />
            <Text style={styles.sectionTitle}>SOLICITUDES DE INGRESO</Text>
          </View>
          {pending.length === 0 ? (
            <Text style={styles.empty}>Sin solicitudes pendientes</Text>
          ) : (
            pending.map((p) => (
              <View key={p.id} style={styles.requestCard}>
                <Avatar name={p.display_name} size={40} uri={p.avatar_url} />
                <Text style={styles.name} numberOfLines={1}>
                  {p.display_name}
                </Text>
                <View style={styles.requestActions}>
                  <Pressable
                    style={styles.approveBtn}
                    disabled={busy}
                    onPress={() => run(() => approvePlayer(p.id))}>
                    <Ionicons name="checkmark" size={18} color="#fff" />
                  </Pressable>
                  <Pressable
                    style={styles.rejectBtn}
                    disabled={busy}
                    onPress={() => run(() => rejectPlayer(p.id))}>
                    <Ionicons name="close" size={18} color={colors.destructive} />
                  </Pressable>
                </View>
              </View>
            ))
          )}

          {/* Todos los jugadores */}
          <View style={styles.sectionRow}>
            <Ionicons name="people-outline" size={16} color={colors.foreground} />
            <Text style={styles.sectionTitle}>TODOS LOS JUGADORES</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{roster.length}</Text>
            </View>
          </View>
          {roster.map((p) => (
            <PlayerRow
              key={p.id}
              player={p}
              busy={busy}
              onRemove={p.role === 'admin' ? undefined : () => setToRemove(p)}
            />
          ))}
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {/* Confirmacion para quitar un jugador (vuelve a pendiente). */}
      <ConfirmModal
        visible={toRemove !== null}
        title="Quitar jugador"
        message={
          toRemove
            ? `${toRemove.display_name} volvera a estado pendiente y saldra del plantel. Podras aprobarlo de nuevo cuando quieras.`
            : ''
        }
        choices={[
          {
            label: 'Quitar',
            variant: 'destructive',
            onPress: () => {
              const id = toRemove?.id;
              setToRemove(null);
              if (id) run(() => revokePlayer(id));
            },
          },
        ]}
        onClose={() => setToRemove(null)}
      />
    </SafeAreaView>
  );
}

function PlayerRow({
  player,
  busy,
  onRemove,
}: {
  player: AdminPlayer;
  busy: boolean;
  onRemove?: () => void;
}) {
  const badge = STATUS[player.membership_status];
  return (
    <View style={styles.playerCard}>
      <Avatar name={player.display_name} size={40} uri={player.avatar_url} />
      <View style={styles.playerInfo}>
        <Text style={styles.name} numberOfLines={1}>
          {player.display_name}
        </Text>
        <View style={[styles.badge, { backgroundColor: badge.bg }]}>
          <Ionicons
            name={player.membership_status === 'approved' ? 'checkmark-circle' : 'ellipse-outline'}
            size={12}
            color={badge.color}
          />
          <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
        </View>
      </View>
      {player.role === 'admin' ? (
        <Text style={styles.adminTag}>Admin</Text>
      ) : (
        onRemove && (
          <Pressable style={styles.removeBtn} disabled={busy} onPress={onRemove}>
            <Ionicons name="trash-outline" size={18} color={colors.destructive} />
          </Pressable>
        )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, paddingBottom: 32, gap: 16 },

  backRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  backText: { color: colors.foreground, fontFamily: fonts.medium, fontSize: 16 },

  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  titleIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(229,55,52,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: colors.foreground, fontFamily: fonts.extrabold, fontSize: 22 },
  subtitle: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 13 },

  stats: { flexDirection: 'row', gap: 12 },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    gap: 4,
  },
  statValue: { fontFamily: fonts.extrabold, fontSize: 26 },
  statLabel: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 12, textAlign: 'center' },

  error: { color: colors.destructive, fontFamily: fonts.regular, fontSize: 13 },

  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  sectionTitle: { color: colors.foreground, fontFamily: fonts.bold, fontSize: 13, letterSpacing: 0.5 },
  countBadge: { backgroundColor: colors.secondary, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 2 },
  countText: { color: colors.mutedForeground, fontFamily: fonts.bold, fontSize: 12 },
  empty: { color: colors.mutedForeground, fontFamily: fonts.regular, textAlign: 'center', paddingVertical: 8 },

  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 12,
  },
  requestActions: { flexDirection: 'row', gap: 8 },
  approveBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.destructive,
    alignItems: 'center',
    justifyContent: 'center',
  },

  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    padding: 12,
  },
  playerInfo: { flex: 1, gap: 6 },
  name: { flex: 1, color: colors.foreground, fontFamily: fonts.semibold, fontSize: 15 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { fontFamily: fonts.semibold, fontSize: 12 },
  adminTag: { color: colors.primary, fontFamily: fonts.bold, fontSize: 12 },
  removeBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.destructive,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
