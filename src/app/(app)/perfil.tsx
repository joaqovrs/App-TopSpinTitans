// Perfil: avatar, nombre, email, badges (estado + rol) y tarjeta de estadisticas
// (puntos, tasa de victoria, partidos jugados y restantes). Diseño Base44.
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { EditProfileModal } from '@/components/edit-profile-modal';
import { useAuth } from '@/context/auth';
import { useInicio } from '@/hooks/use-inicio';
import { useProfile } from '@/hooks/use-profile';
import { colors, fonts } from '@/lib/theme';
import type { MembershipStatus } from '@/lib/types';

const GREEN = '#2EB82E';

const STATUS_BADGE: Record<MembershipStatus, { label: string; color: string; bg: string }> = {
  approved: { label: 'Aprobado', color: GREEN, bg: 'rgba(46,184,46,0.14)' },
  pending: { label: 'Pendiente', color: colors.gold, bg: 'rgba(255,204,51,0.14)' },
  rejected: { label: 'Rechazado', color: colors.primary, bg: 'rgba(229,55,52,0.14)' },
};

export default function PerfilScreen() {
  const { session, signOut } = useAuth();
  const { profile, loading: loadingProfile, reload: reloadProfile } = useProfile();
  const { data, loading: loadingData } = useInicio();
  const [editing, setEditing] = useState(false);

  if (loadingProfile || loadingData) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const finished = data.wins + data.losses;
  const effectiveness = finished > 0 ? Math.round((data.wins / finished) * 100) : 0;
  const remaining = data.total > 0 ? Math.max(0, data.total - 1 - finished) : 0;
  const status = profile ? STATUS_BADGE[profile.membership_status] : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Cabecera */}
        <View style={styles.headerCol}>
          <Avatar
            name={profile?.display_name ?? '?'}
            size={96}
            ringColor={colors.primary}
            uri={profile?.avatar_url}
          />
          <Text style={styles.name}>{profile?.display_name}</Text>
          <Text style={styles.email}>{session?.user.email}</Text>

          <Pressable style={styles.editBtn} onPress={() => setEditing(true)}>
            <Ionicons name="create-outline" size={16} color={colors.foreground} />
            <Text style={styles.editBtnText}>Editar perfil</Text>
          </Pressable>

          <View style={styles.badges}>
            {status && (
              <View style={[styles.badge, { backgroundColor: status.bg }]}>
                <Ionicons name="shield-checkmark" size={13} color={status.color} />
                <Text style={[styles.badgeText, { color: status.color }]}>{status.label}</Text>
              </View>
            )}
            <View style={[styles.badge, styles.roleBadge]}>
              <Text style={styles.roleText}>
                {profile?.role === 'admin' ? 'Administrador' : 'Jugador'}
              </Text>
            </View>
          </View>
        </View>

        {/* Estadisticas */}
        <View style={styles.statsCard}>
          <StatRow
            icon={<MaterialCommunityIcons name="target" size={20} color={colors.primary} />}
            tint="rgba(229,55,52,0.14)"
            label="Puntos totales"
            value={`${data.points} pts`}
          />
          <View style={styles.divider} />
          <StatRow
            icon={<Ionicons name="flame" size={20} color={colors.gold} />}
            tint="rgba(255,204,51,0.14)"
            label="Tasa de victoria"
            value={`${effectiveness}%`}
          />
          <View style={styles.divider} />
          <StatRow
            icon={<Ionicons name="trending-up" size={20} color={GREEN} />}
            tint="rgba(46,184,46,0.14)"
            label="Partidos jugados"
            value={`${finished} (${data.wins}G / ${data.losses}P)`}
          />
          <View style={styles.divider} />
          <StatRow
            icon={<Ionicons name="calendar" size={20} color={colors.accent} />}
            tint="rgba(0,225,255,0.14)"
            label="Partidos restantes"
            value={`${remaining}`}
          />
        </View>

        {profile?.role === 'admin' && (
          <Link href="/(app)/admin" asChild>
            <Pressable style={styles.adminBtn}>
              <View style={styles.adminIcon}>
                <Ionicons name="shield-checkmark" size={22} color={colors.primary} />
              </View>
              <View style={styles.adminTexts}>
                <Text style={styles.adminTitle}>Panel de administrador</Text>
                <Text style={styles.adminSub}>Jugadores, validaciones y liga</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.mutedForeground} />
            </Pressable>
          </Link>
        )}

        <Pressable style={styles.signOut} onPress={() => signOut()}>
          <Ionicons name="log-out-outline" size={20} color={colors.primary} />
          <Text style={styles.signOutText}>Cerrar sesion</Text>
        </Pressable>
      </ScrollView>

      {session && profile && (
        <EditProfileModal
          visible={editing}
          uid={session.user.id}
          currentName={profile.display_name}
          currentAvatarUrl={profile.avatar_url}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            reloadProfile();
          }}
        />
      )}
    </SafeAreaView>
  );
}

function StatRow({
  icon,
  tint,
  label,
  value,
}: {
  icon: React.ReactNode;
  tint: string;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.statRow}>
      <View style={[styles.statIcon, { backgroundColor: tint }]}>{icon}</View>
      <View>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, paddingBottom: 32, gap: 20 },

  headerCol: { alignItems: 'center', gap: 8, paddingTop: 12 },
  name: { color: colors.foreground, fontFamily: fonts.extrabold, fontSize: 24, marginTop: 6 },
  email: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 14 },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginTop: 10,
  },
  editBtnText: { color: colors.foreground, fontFamily: fonts.semibold, fontSize: 13 },
  badges: { flexDirection: 'row', gap: 8, marginTop: 6 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  badgeText: { fontFamily: fonts.semibold, fontSize: 13 },
  roleBadge: { backgroundColor: colors.secondary },
  roleText: { color: colors.secondaryForeground, fontFamily: fonts.semibold, fontSize: 13 },

  statsCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 18,
  },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 6 },
  statIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statLabel: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 13 },
  statValue: { color: colors.foreground, fontFamily: fonts.bold, fontSize: 16, marginTop: 2 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: 10 },

  adminBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: 'rgba(229,55,52,0.4)',
    borderRadius: 16,
    padding: 16,
  },
  adminIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(229,55,52,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminTexts: { flex: 1 },
  adminTitle: { color: colors.foreground, fontFamily: fonts.bold, fontSize: 16 },
  adminSub: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 13, marginTop: 2 },
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
  },
  signOutText: { color: colors.primary, fontFamily: fonts.bold, fontSize: 16 },
});
