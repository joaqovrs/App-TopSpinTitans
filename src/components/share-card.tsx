// Tarjeta para compartir un resultado en una historia de Instagram (formato 9:16,
// 1080x1920). Se renderiza fuera de pantalla y se captura como PNG con
// react-native-view-shot (ver use-share-match). Usa Views normales (no SVG) para
// que las fuentes Inter y los avatares funcionen igual que en el resto de la app.
import { forwardRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';

import { Avatar } from '@/components/avatar';
import { colors, fonts } from '@/lib/theme';

const W = 1080;
const H = 1920;
const GREEN = '#2EB82E';

export interface ShareCardData {
  myName: string;
  myAvatar: string | null;
  opponentName: string;
  opponentAvatar: string | null;
  mySets: number;
  theirSets: number;
  iWon: boolean;
  sets: Array<{ n: number; mine: number; theirs: number }>;
}

type Props = { data: ShareCardData; onLayout?: (e: LayoutChangeEvent) => void };

export const ShareCard = forwardRef<View, Props>(({ data, onLayout }, ref) => {
  const gradient: [string, string, string] = data.iWon
    ? ['#0D0D0D', '#145214', GREEN]
    : ['#0D0D0D', '#5C1513', colors.primary];

  return (
    <View ref={ref} collapsable={false} onLayout={onLayout} style={styles.root}>
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Encabezado: marca de la liga */}
      <View style={styles.header}>
        <Text style={styles.brand}>🏓 LIGA DE TENIS DE MESA</Text>
        <Text style={styles.result}>{data.iWon ? 'VICTORIA' : 'DERROTA'}</Text>
      </View>

      {/* Jugadores + marcador */}
      <View style={styles.versus}>
        <View style={styles.side}>
          <Avatar name={data.myName} uri={data.myAvatar} size={220} ringColor="#FFFFFF" />
          <Text style={styles.name} numberOfLines={2}>{data.myName}</Text>
        </View>

        <View style={styles.scoreBox}>
          <Text style={styles.score}>
            {data.mySets}-{data.theirSets}
          </Text>
        </View>

        <View style={styles.side}>
          <Avatar name={data.opponentName} uri={data.opponentAvatar} size={220} ringColor="#FFFFFF" />
          <Text style={styles.name} numberOfLines={2}>{data.opponentName}</Text>
        </View>
      </View>

      {/* Detalle set por set */}
      <View style={styles.sets}>
        {data.sets.map((s) => {
          const won = s.mine > s.theirs;
          return (
            <View key={s.n} style={styles.setRow}>
              <Text style={styles.setLabel}>SET {s.n}</Text>
              <Text style={[styles.setScore, { color: won ? GREEN : '#FF6B6B' }]}>
                {s.mine} - {s.theirs}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Pie */}
      <Text style={styles.footer}>Liga de Tenis de Mesa · Temporada</Text>
    </View>
  );
});

ShareCard.displayName = 'ShareCard';

const styles = StyleSheet.create({
  root: { width: W, height: H, paddingHorizontal: 80, paddingVertical: 120, justifyContent: 'space-between' },

  header: { alignItems: 'center', gap: 24 },
  brand: { color: 'rgba(255,255,255,0.85)', fontFamily: fonts.semibold, fontSize: 40, letterSpacing: 2 },
  result: { color: '#FFFFFF', fontFamily: fonts.extrabold, fontSize: 130, letterSpacing: 4 },

  versus: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  side: { flex: 1, alignItems: 'center', gap: 28 },
  name: { color: '#FFFFFF', fontFamily: fonts.bold, fontSize: 48, textAlign: 'center' },
  scoreBox: { paddingHorizontal: 20 },
  score: { color: '#FFFFFF', fontFamily: fonts.extrabold, fontSize: 150 },

  sets: { gap: 24 },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: 28,
    paddingVertical: 36,
    paddingHorizontal: 56,
  },
  setLabel: { color: 'rgba(255,255,255,0.8)', fontFamily: fonts.semibold, fontSize: 48, letterSpacing: 2 },
  setScore: { fontFamily: fonts.extrabold, fontSize: 64 },

  footer: { color: 'rgba(255,255,255,0.7)', fontFamily: fonts.medium, fontSize: 36, textAlign: 'center' },
});
