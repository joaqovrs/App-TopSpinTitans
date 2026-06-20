// Podio de fin de temporada: 1° al centro (elevado, dorado, con corona), 2° a la
// izquierda y 3° a la derecha, mas bajos. Tolera podios incompletos (1 o 2
// jugadores). Es solo presentacional; los datos vienen de season_champions.
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { colors, fonts } from '@/lib/theme';
import type { SeasonChampion } from '@/lib/types';

const MEDAL = {
  1: { ring: colors.gold, height: 132, avatar: 92, label: '1' },
  2: { ring: colors.silver, height: 96, avatar: 68, label: '2' },
  3: { ring: colors.bronze, height: 72, avatar: 68, label: '3' },
} as const;

function fmtDiff(d: number): string {
  return `${d > 0 ? '+' : ''}${d}`;
}

function Step({ champ }: { champ: SeasonChampion }) {
  const m = MEDAL[champ.rank];
  const isFirst = champ.rank === 1;
  return (
    <View style={styles.stepCol}>
      {isFirst && (
        <MaterialCommunityIcons name="crown" size={30} color={colors.gold} style={styles.crown} />
      )}
      <Avatar name={champ.display_name} uri={champ.avatar_url} size={m.avatar} ringColor={m.ring} />
      <Text style={[styles.name, isFirst && styles.nameFirst]} numberOfLines={1}>
        {champ.display_name}
      </Text>
      <Text style={styles.stats}>
        {champ.wins}V · {fmtDiff(champ.points_diff)}
      </Text>

      {/* Pedestal */}
      {isFirst ? (
        <LinearGradient
          colors={['#FFE08A', colors.gold, '#C8901F']}
          style={[styles.pedestal, { height: m.height }]}>
          <Text style={[styles.pedestalNum, styles.pedestalNumFirst]}>{m.label}</Text>
        </LinearGradient>
      ) : (
        <View style={[styles.pedestal, styles.pedestalDark, { height: m.height, borderColor: m.ring }]}>
          <Text style={[styles.pedestalNum, { color: m.ring }]}>{m.label}</Text>
        </View>
      )}
    </View>
  );
}

export function Podium({ champions }: { champions: SeasonChampion[] }) {
  const first = champions.find((c) => c.rank === 1);
  const second = champions.find((c) => c.rank === 2);
  const third = champions.find((c) => c.rank === 3);

  if (!first) {
    return (
      <View style={styles.emptyWrap}>
        <Ionicons name="trophy-outline" size={40} color={colors.mutedForeground} />
        <Text style={styles.emptyText}>Esta temporada no tuvo partidos jugados.</Text>
      </View>
    );
  }

  return (
    <View style={styles.row}>
      <View style={styles.sideSlot}>{second && <Step champ={second} />}</View>
      <View style={styles.centerSlot}>
        <Step champ={first} />
      </View>
      <View style={styles.sideSlot}>{third && <Step champ={third} />}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 8 },
  sideSlot: { flex: 1, alignItems: 'center' },
  centerSlot: { flex: 1.15, alignItems: 'center', zIndex: 2 },

  stepCol: { alignItems: 'center', width: '100%' },
  crown: { marginBottom: 2 },
  name: {
    color: colors.foreground,
    fontFamily: fonts.bold,
    fontSize: 14,
    marginTop: 8,
    maxWidth: '100%',
  },
  nameFirst: { fontFamily: fonts.extrabold, fontSize: 17, color: colors.gold },
  stats: { color: colors.mutedForeground, fontFamily: fonts.medium, fontSize: 12, marginTop: 2 },

  pedestal: {
    width: '92%',
    marginTop: 10,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 12,
  },
  pedestalDark: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  pedestalNum: { fontFamily: fonts.extrabold, fontSize: 30 },
  pedestalNumFirst: { color: '#5A3D00', fontSize: 38 },

  emptyWrap: { alignItems: 'center', gap: 10, paddingVertical: 30 },
  emptyText: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 14, textAlign: 'center' },
});
