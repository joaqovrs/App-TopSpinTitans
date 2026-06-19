// Skeletons de carga. Un primitivo `Skeleton` (bloque que late) y una variante
// por pantalla que imita el layout real para que la espera se sienta mas corta.
// Todos los bloques laten sincronizados (un solo Animated.Value compartido).
import { useEffect, useState } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  View,
  type DimensionValue,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/lib/theme';

// Barrido de luz compartido: un valor 0->1 en bucle que cada bloque traduce a un
// desplazamiento horizontal segun su ancho. Una franja clara cruza el bloque de
// izquierda a derecha, indicando que la app sigue trabajando (no se colgo).
const sweep = new Animated.Value(0);
let started = false;
function startSweep() {
  if (started) return;
  started = true;
  Animated.loop(
    Animated.timing(sweep, {
      toValue: 1,
      duration: 1200,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    })
  ).start();
}

export function Skeleton({
  width = '100%',
  height = 16,
  radius = 8,
  style,
}: {
  width?: DimensionValue;
  height?: DimensionValue;
  radius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  useEffect(startSweep, []);
  const [w, setW] = useState(0);

  function onLayout(e: LayoutChangeEvent) {
    const next = e.nativeEvent.layout.width;
    if (next && next !== w) setW(next);
  }

  // La franja entra por la izquierda (-w) y sale por la derecha (+w).
  const translateX = sweep.interpolate({ inputRange: [0, 1], outputRange: [-w, w] });

  return (
    <View
      onLayout={onLayout}
      style={[
        { width, height, borderRadius: radius, backgroundColor: colors.secondary, overflow: 'hidden' },
        style,
      ]}>
      {w > 0 && (
        <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX }] }]}>
          <LinearGradient
            colors={['transparent', 'rgba(255,255,255,0.09)', 'transparent']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}
    </View>
  );
}

// Avatar circular.
function Circle({ size }: { size: number }) {
  return <Skeleton width={size} height={size} radius={size / 2} />;
}

// ---------- Ranking ----------
export function RankingSkeleton() {
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.content}>
        <Skeleton width={200} height={26} />
        <Skeleton width={160} height={13} style={{ marginTop: 8 }} />
        <Skeleton height={8} radius={4} style={{ marginTop: 14 }} />

        {/* Podio */}
        <View style={s.podium}>
          {[52, 64, 52].map((avatar, i) => (
            <View key={i} style={[s.card, s.podiumCard, { paddingVertical: i === 1 ? 22 : 14 }]}>
              <Circle size={avatar} />
              <Skeleton width={60} height={12} style={{ marginTop: 10 }} />
              <Skeleton width={36} height={i === 1 ? 26 : 18} style={{ marginTop: 8 }} />
              <Skeleton width={48} height={10} style={{ marginTop: 8 }} />
            </View>
          ))}
        </View>

        {/* Lista del resto */}
        <View style={[s.card, { marginTop: 16, paddingHorizontal: 16 }]}>
          {[0, 1, 2, 3, 4].map((i) => (
            <View key={i} style={[s.listRow, i > 0 && s.divider]}>
              <Skeleton width={24} height={14} />
              <Circle size={40} />
              <Skeleton width={130} height={14} />
              <View style={{ flex: 1 }} />
              <Skeleton width={32} height={16} />
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

// ---------- Inicio ----------
export function HomeSkeleton() {
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={[s.content, { gap: 16 }]}>
        {/* Cabecera */}
        <View style={[s.card, s.headerCard]}>
          <Circle size={64} />
          <View style={{ flex: 1, gap: 8 }}>
            <Skeleton width={140} height={20} />
            <Skeleton width={100} height={13} />
          </View>
          <Skeleton width={44} height={44} radius={12} />
        </View>

        {/* Secciones de partidos */}
        {[0, 1, 2].map((sec) => (
          <View key={sec} style={{ gap: 12 }}>
            <Skeleton width={150} height={14} />
            <View style={[s.card, { paddingHorizontal: 16 }]}>
              {[0, 1].map((i) => (
                <View key={i} style={[s.matchRow, i > 0 && s.divider]}>
                  <Circle size={36} />
                  <View style={{ flex: 1, gap: 6 }}>
                    <Skeleton width={120} height={14} />
                    <Skeleton width={70} height={12} />
                  </View>
                  <Skeleton width={72} height={24} radius={8} />
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}

// ---------- Retos ----------
export function RetosSkeleton() {
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.content}>
        <Skeleton width={120} height={26} />
        <Skeleton width={220} height={13} style={{ marginTop: 8 }} />
        <Skeleton height={48} radius={12} style={{ marginTop: 18 }} />

        <View style={{ marginTop: 16, gap: 10 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <View key={i} style={[s.card, s.retoRow]}>
              <Skeleton width={22} height={14} />
              <Circle size={44} />
              <View style={{ flex: 1, gap: 6 }}>
                <Skeleton width={130} height={14} />
                <Skeleton width={90} height={12} />
              </View>
              <Skeleton width={80} height={36} radius={10} />
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

// ---------- Historial ----------
export function HistorialSkeleton() {
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.content}>
        <Skeleton width={180} height={26} />
        <Skeleton width={240} height={13} style={{ marginTop: 8 }} />

        {/* Resumen */}
        <View style={[s.card, { marginTop: 16, padding: 18, gap: 12 }]}>
          <View style={s.between}>
            <Skeleton width={90} height={22} />
            <Skeleton width={70} height={28} />
          </View>
          <Skeleton height={6} radius={3} />
          <View style={s.between}>
            <Skeleton width={80} height={12} />
            <Skeleton width={80} height={12} />
          </View>
        </View>

        {/* Tarjetas de partidos */}
        <View style={{ marginTop: 22, gap: 10 }}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={[s.card, s.matchCard]}>
              <Circle size={40} />
              <View style={{ flex: 1, alignItems: 'center', gap: 8 }}>
                <Skeleton width={50} height={20} />
                <Skeleton width={70} height={18} radius={8} />
              </View>
              <Circle size={40} />
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

// ---------- Perfil ----------
export function PerfilSkeleton() {
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={[s.content, { alignItems: 'center' }]}>
        <Circle size={96} />
        <Skeleton width={160} height={22} style={{ marginTop: 14 }} />
        <Skeleton width={200} height={14} style={{ marginTop: 10 }} />
        <Skeleton width={130} height={36} radius={10} style={{ marginTop: 16 }} />
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
          <Skeleton width={100} height={28} radius={8} />
          <Skeleton width={100} height={28} radius={8} />
        </View>

        {/* Tarjeta de estadisticas */}
        <View style={[s.card, { width: '100%', marginTop: 24, padding: 18, gap: 18 }]}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={s.between}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <Skeleton width={20} height={20} radius={6} />
                <Skeleton width={120} height={14} />
              </View>
              <Skeleton width={40} height={18} />
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

// ---------- Admin (solo el contenido; la cabecera "volver" se mantiene fija) ----------
export function AdminSkeleton() {
  return (
    <View style={[s.content, { gap: 16 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Skeleton width={44} height={44} radius={12} />
        <View style={{ gap: 8 }}>
          <Skeleton width={140} height={20} />
          <Skeleton width={90} height={13} />
        </View>
      </View>

      <Skeleton height={120} radius={16} />

      {[0, 1].map((sec) => (
        <View key={sec} style={{ gap: 10 }}>
          <Skeleton width={160} height={14} />
          {[0, 1, 2].map((i) => (
            <View key={i} style={[s.card, s.retoRow]}>
              <Circle size={44} />
              <View style={{ flex: 1, gap: 6 }}>
                <Skeleton width={130} height={14} />
                <Skeleton width={90} height={12} />
              </View>
              <Skeleton width={80} height={32} radius={10} />
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16 },
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
  },
  headerCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  podium: { flexDirection: 'row', gap: 10, marginTop: 20, alignItems: 'flex-end' },
  podiumCard: { flex: 1, alignItems: 'center', paddingHorizontal: 8, borderRadius: 16 },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  matchRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14 },
  retoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  matchCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
