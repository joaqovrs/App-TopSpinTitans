// Tarjeta para compartir un resultado en una historia de Instagram. Se renderiza
// fuera de pantalla y se captura como PNG con react-native-view-shot (ver
// use-share-match). Usa Views normales (no SVG) para que las fuentes Inter y los
// avatares funcionen igual que en el resto de la app.
//
// Diseno: una "card" gris con bordes muy redondeados. Se captura SOLO la card
// (no un lienzo 9:16) y se comparte como STICKER de Instagram Stories: queda
// flotante sobre un fondo degradado (ver use-share-match), el usuario la puede
// mover / redimensionar con los dedos y las esquinas redondeadas transparentes
// ya no muestran triangulos negros. El unico color es la palabra del resultado
// (VICTORIA verde / DERROTA rojo).
import { forwardRef } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';

import { Avatar } from '@/components/avatar';
import { colors, fonts } from '@/lib/theme';

const W = 1080;
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
  // El color vive solo en la palabra del resultado: verde si gane, rojo si perdi.
  const accent = data.iWon ? GREEN : colors.primary;

  return (
    <View ref={ref} collapsable={false} onLayout={onLayout} style={styles.card}>
      {/* Encabezado: marca + resultado */}
      <View style={styles.header}>
        <Text style={styles.brand}>LIGA TOP SPIN TITANS</Text>
        <Text style={[styles.result, { color: accent }]}>
          {data.iWon ? 'VICTORIA' : 'DERROTA'}
        </Text>
      </View>

      {/* Jugadores + marcador */}
      <View style={styles.versus}>
        <View style={styles.side}>
          <Avatar name={data.myName} uri={data.myAvatar} size={190} ringColor="#FFFFFF" />
          <Text style={styles.name} numberOfLines={2}>{data.myName}</Text>
        </View>

        <View style={styles.scoreBox}>
          <Text style={styles.score}>
            {data.mySets}-{data.theirSets}
          </Text>
        </View>

        <View style={styles.side}>
          <Avatar name={data.opponentName} uri={data.opponentAvatar} size={190} ringColor="#FFFFFF" />
          <Text style={styles.name} numberOfLines={2}>{data.opponentName}</Text>
        </View>
      </View>

      {/* Detalle set por set (ganados en blanco, perdidos atenuados) */}
      <View style={styles.sets}>
        {data.sets.map((s) => {
          const won = s.mine > s.theirs;
          return (
            <View key={s.n} style={styles.setRow}>
              <Text style={styles.setLabel}>SET {s.n}</Text>
              <Text style={[styles.setScore, { color: won ? '#FFFFFF' : 'rgba(255,255,255,0.4)' }]}>
                {s.mine} - {s.theirs}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Pie */}
      <Text style={styles.footer}>🏓 Top Spin Titans</Text>
    </View>
  );
});

ShareCard.displayName = 'ShareCard';

const styles = StyleSheet.create({
  // Se captura SOLO esta card: imagen del tamaño justo de la tarjeta, sin marco.
  card: {
    width: W,
    backgroundColor: '#242424',
    borderRadius: 80,
    paddingHorizontal: 72,
    paddingVertical: 80,
    gap: 64,
  },

  header: { alignItems: 'center', gap: 18 },
  brand: {
    color: 'rgba(255,255,255,0.55)',
    fontFamily: fonts.semibold,
    fontSize: 34,
    letterSpacing: 3,
    textAlign: 'center',
  },
  result: { fontFamily: fonts.extrabold, fontSize: 120, letterSpacing: 3 },

  versus: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  side: { flex: 1, alignItems: 'center', gap: 24 },
  name: { color: '#FFFFFF', fontFamily: fonts.bold, fontSize: 42, textAlign: 'center' },
  scoreBox: { paddingHorizontal: 16 },
  score: { color: '#FFFFFF', fontFamily: fonts.extrabold, fontSize: 130 },

  sets: { gap: 18 },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 28,
    paddingVertical: 30,
    paddingHorizontal: 48,
  },
  setLabel: { color: 'rgba(255,255,255,0.7)', fontFamily: fonts.semibold, fontSize: 42, letterSpacing: 2 },
  setScore: { fontFamily: fonts.extrabold, fontSize: 56 },

  footer: { color: 'rgba(255,255,255,0.6)', fontFamily: fonts.medium, fontSize: 34, textAlign: 'center' },
});
