// Ceremonia de fin de temporada: confetti + podio + gradiente dorado para el
// campeon. Se llega aca automaticamente al cerrarse una temporada (la primera
// vez), por deep-link de la notificacion, o se puede volver a ver. Al montar,
// marca la temporada como celebrada para no volver a abrirla sola.
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Podium } from '@/components/podium';
import { PerfilSkeleton } from '@/components/skeleton';
import { useCampeones } from '@/hooks/use-campeones';
import { colors, fonts } from '@/lib/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;

export default function PodioScreen() {
  const { podium, champion, loading } = useCampeones();

  if (loading) return <PerfilSkeleton />;

  if (!podium || !champion) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}>
          <Ionicons name="trophy-outline" size={48} color={colors.mutedForeground} />
          <Text style={styles.emptyText}>Todavía no hay una temporada finalizada.</Text>
          <Pressable style={styles.closeBtn} onPress={() => router.navigate('/(app)')}>
            <Text style={styles.closeText}>Volver al inicio</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <LinearGradient
        colors={['rgba(255,204,51,0.18)', 'rgba(255,204,51,0.04)', 'transparent']}
        style={styles.glow}
      />

      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.trophyBadge}>
            <Ionicons name="trophy" size={30} color={colors.gold} />
          </View>
          <Text style={styles.kicker}>TEMPORADA FINALIZADA</Text>
          <Text style={styles.title}>{podium.seasonName}</Text>
          <Text style={styles.subtitle}>
            ¡{champion.display_name} se consagró campeón! 🏆
          </Text>
        </View>

        <Podium champions={podium.champions} />

        <Pressable style={styles.closeBtn} onPress={() => router.navigate('/(app)')}>
          <Text style={styles.closeText}>Continuar</Text>
        </Pressable>
      </View>

      <ConfettiCannon
        count={180}
        origin={{ x: SCREEN_WIDTH / 2, y: -20 }}
        autoStart
        fadeOut
        explosionSpeed={400}
        fallSpeed={3200}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  glow: { position: 'absolute', top: 0, left: 0, right: 0, height: 320 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 20, gap: 32 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },

  header: { alignItems: 'center', gap: 6 },
  trophyBadge: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: 'rgba(255,204,51,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,204,51,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  kicker: {
    color: colors.gold,
    fontFamily: fonts.bold,
    fontSize: 12,
    letterSpacing: 2,
  },
  title: { color: colors.foreground, fontFamily: fonts.extrabold, fontSize: 26, textAlign: 'center' },
  subtitle: {
    color: colors.mutedForeground,
    fontFamily: fonts.medium,
    fontSize: 15,
    textAlign: 'center',
    marginTop: 2,
  },

  closeBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  closeText: { color: '#fff', fontFamily: fonts.bold, fontSize: 16 },
  emptyText: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 15, textAlign: 'center' },
});
