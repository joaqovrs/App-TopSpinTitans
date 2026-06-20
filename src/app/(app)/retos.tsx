// Retos: lista de oponentes de la temporada con el estado de mi partido contra
// cada uno y la accion que corresponde (retar / responder / cargar / validar).
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AlertModal } from '@/components/alert-modal';
import { Avatar } from '@/components/avatar';
import { ConfirmModal, type Choice } from '@/components/confirm-modal';
import { FadeIn } from '@/components/fade-in';
import { PressableScale } from '@/components/pressable-scale';
import { ScoreModal } from '@/components/score-modal';
import { RetosSkeleton } from '@/components/skeleton';
import { ValidateModal } from '@/components/validate-modal';
import { useProfile } from '@/hooks/use-profile';
import { useRetos, type RetoItem } from '@/hooks/use-retos';
import { respondInvite, sendInvite, validateResult } from '@/lib/matches';
import { colors, fonts } from '@/lib/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;

// Candado en memoria (nivel modulo) de victorias ya festejadas en ESTA sesion de
// la app. Sobrevive a que la pantalla de Retos se remonte al cambiar de tab, asi
// que el confeti no se repite dentro de la sesion aunque la lectura del disco
// falle o llegue tarde. El disco (localStorage) se usa ademas para recordar entre
// reinicios. Se guardan ids de partido (UUID unico), por eso no hay colision
// entre usuarios distintos.
const sessionCelebratedWins = new Set<string>();

export default function RetosScreen() {
  const { items, loading, error, reload, uid } = useRetos();
  const { profile } = useProfile();
  const { matchId } = useLocalSearchParams<{ matchId?: string }>();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [cargarItem, setCargarItem] = useState<RetoItem | null>(null);
  const [validarItem, setValidarItem] = useState<RetoItem | null>(null);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{
    title: string;
    message: string;
    choices: Choice[];
  } | null>(null);

  // "ready" se enciende despues del primer render: las tarjetas pendientes que ya
  // estaban al entrar NO se animan; solo las que aparecen despues (reto nuevo).
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);

  // Si llegamos desde una notificacion (router con matchId), abrimos directo la
  // card de la accion que corresponde (responder/cargar/validar) una vez cargada
  // la lista. Limpiamos el parametro para que no se vuelva a disparar al volver.
  useEffect(() => {
    if (loading || !matchId) return;
    const item = items.find((i) => i.match.id === matchId);
    if (item) triggerAction(item);
    router.setParams({ matchId: '' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, matchId, items]);

  // Confeti SOLO la primera vez que una victoria mia pasa a validada. Doble
  // candado para que no se repita al re-entrar / cambiar de tab:
  //  1) sessionCelebratedWins (en memoria, nivel modulo): sobrevive remontajes
  //     dentro de la sesion -> no se repite aunque el disco falle o tarde.
  //  2) localStorage (disco): recuerda entre reinicios de la app. Guardamos la
  //     UNION de lo ya conocido + lo nuevo, para no perder historial.
  // Una victoria se considera "nueva" solo si NO esta en ninguno de los dos.
  const [celebrate, setCelebrate] = useState(false);
  useEffect(() => {
    if (!uid) return;
    const wonIds = items
      .filter((i) => i.match.status === 'validated' && i.match.winner_id === uid)
      .map((i) => i.match.id);
    if (wonIds.length === 0) return;

    const key = `retos:celebrated-wins:${uid}`;
    let stored: string[] = [];
    try {
      const raw = localStorage.getItem(key);
      if (raw) stored = JSON.parse(raw);
    } catch {
      stored = [];
    }
    // Lo ya festejado = lo del disco + lo de esta sesion.
    const known = new Set<string>([...stored, ...sessionCelebratedWins]);

    const newWins = wonIds.filter((id) => !known.has(id));
    if (newWins.length === 0) return; // todas ya festejadas -> no hay confeti

    // Registrar en ambos candados ANTES de festejar.
    newWins.forEach((id) => sessionCelebratedWins.add(id));
    try {
      localStorage.setItem(key, JSON.stringify([...known, ...newWins]));
    } catch {
      // Si el disco falla, el candado en memoria igual evita repetir en la sesion.
    }
    setCelebrate(true);
  }, [items, uid]);

  const myName = profile?.display_name ?? 'Tú';

  function nameOf(item: RetoItem) {
    return item.opponent?.display_name ?? 'Jugador';
  }

  async function run(action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
      await reload();
    } catch (err) {
      setAlertMsg(err instanceof Error ? err.message : 'Algo salio mal.');
    } finally {
      setBusy(false);
    }
  }

  function onRetar(item: RetoItem) {
    run(() => sendInvite(item.match.id));
  }

  function onResponder(item: RetoItem) {
    setDialog({
      title: `Reto de ${nameOf(item)}`,
      message: 'Te reta a un partido. ¿Aceptas el reto?',
      choices: [
        { label: 'Aceptar', variant: 'primary', onPress: () => run(() => respondInvite(item.match.id, true)) },
        { label: 'Rechazar', variant: 'destructive', onPress: () => run(() => respondInvite(item.match.id, false)) },
      ],
    });
  }

  function triggerAction(item: RetoItem) {
    switch (item.action) {
      case 'retar':
        return onRetar(item);
      case 'responder':
        return onResponder(item);
      case 'cargar':
        return setCargarItem(item);
      case 'validar':
        return setValidarItem(item);
    }
  }

  // Grupos de "requiere tu accion", cada uno con su titulo contextual.
  const pendingGroups = [
    { key: 'responder', title: '¿ACEPTAS EL RETO?', items: items.filter((i) => i.action === 'responder') },
    { key: 'cargar', title: 'CARGAR RESULTADO', items: items.filter((i) => i.action === 'cargar') },
    { key: 'validar', title: 'VALIDAR RESULTADO', items: items.filter((i) => i.action === 'validar') },
  ].filter((g) => g.items.length > 0);

  const filtered = items.filter((i) =>
    nameOf(i).toLowerCase().includes(query.trim().toLowerCase())
  );

  if (loading) {
    return <RetosSkeleton />;
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {cargarItem && (
        <ScoreModal
          visible
          match={cargarItem.match}
          uid={uid}
          myName={myName}
          opponentName={nameOf(cargarItem)}
          myAvatarUrl={profile?.avatar_url}
          opponentAvatarUrl={cargarItem.opponent?.avatar_url}
          onClose={() => setCargarItem(null)}
          onSubmitted={() => {
            setCargarItem(null);
            reload();
          }}
        />
      )}

      {validarItem && (
        <ValidateModal
          visible
          match={validarItem.match}
          uid={uid}
          myName={myName}
          opponentName={nameOf(validarItem)}
          myAvatarUrl={profile?.avatar_url}
          opponentAvatarUrl={validarItem.opponent?.avatar_url}
          busy={busy}
          onClose={() => setValidarItem(null)}
          onDecision={(accept) => {
            const id = validarItem.match.id;
            setValidarItem(null);
            run(() => validateResult(id, accept));
          }}
        />
      )}

      <ConfirmModal
        visible={dialog !== null}
        title={dialog?.title ?? ''}
        message={dialog?.message ?? ''}
        choices={dialog?.choices ?? []}
        onClose={() => setDialog(null)}
      />

      <AlertModal
        visible={alertMsg !== null}
        title="La avaricia rompe el saco"
        message={alertMsg ?? ''}
        onClose={() => setAlertMsg(null)}
      />

      <FlatList
        data={filtered}
        keyExtractor={(i) => i.match.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={reload} tintColor={colors.mutedForeground} />
        }
        ListHeaderComponent={
          <View>
            <View style={styles.headerRow}>
              <MaterialCommunityIcons name="sword-cross" size={24} color={colors.primary} />
              <Text style={styles.headerTitle}>Retos</Text>
            </View>
            <Text style={styles.subtitle}>Reta a otros jugadores de la temporada</Text>

            {error && <Text style={styles.error}>{error}</Text>}

            {pendingGroups.map((group) => {
              const gold = group.key === 'validar' || group.key === 'cargar';
              return (
                <View key={group.key} style={styles.pendingGroup}>
                  <Text style={[styles.pendingTitle, gold && styles.pendingTitleGold]}>
                    {group.title}
                  </Text>
                  {group.items.map((item) => (
                    <PendingItemCard
                      key={item.match.id}
                      name={nameOf(item)}
                      label={ACTION_LABEL[item.action]}
                      gold={gold}
                      busy={busy}
                      animate={ready}
                      onPress={() => triggerAction(item)}
                    />
                  ))}
                </View>
              );
            })}

            <View style={styles.search}>
              <Ionicons name="search" size={18} color={colors.mutedForeground} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar jugador..."
                placeholderTextColor={colors.mutedForeground}
                value={query}
                onChangeText={setQuery}
              />
            </View>
          </View>
        }
        renderItem={({ item, index }) => (
          <FadeIn delay={Math.min(index * 40, 400)}>
            <View style={styles.row}>
              <Text style={styles.rank}>#{item.rank}</Text>
              <Avatar name={nameOf(item)} size={44} uri={item.opponent?.avatar_url} />
              <View style={styles.info}>
                <Text style={styles.name} numberOfLines={1}>
                  {nameOf(item)}
                </Text>
                <Text style={styles.record}>
                  {item.opponent?.points ?? 0} pts · {item.opponent?.wins ?? 0}V /{' '}
                  {item.opponent?.losses ?? 0}D
                </Text>
              </View>
              <RowAction item={item} busy={busy} onPress={() => triggerAction(item)} />
            </View>
          </FadeIn>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No hay jugadores para mostrar.</Text>
        }
      />

      {celebrate && (
        <ConfettiCannon
          count={140}
          origin={{ x: SCREEN_WIDTH / 2, y: -20 }}
          autoStart
          fadeOut
          explosionSpeed={350}
          fallSpeed={2800}
          onAnimationEnd={() => setCelebrate(false)}
        />
      )}
    </SafeAreaView>
  );
}

const ACTION_LABEL: Record<string, string> = {
  retar: 'Retar',
  responder: 'Responder',
  cargar: 'Cargar',
  validar: 'Validar',
};

// Tarjeta de "requiere tu accion". Si animate=true (recien aparecio), entra
// deslizandose desde el costado con un rebote y se estabiliza.
function PendingItemCard({
  name,
  label,
  gold,
  busy,
  animate,
  onPress,
}: {
  name: string;
  label: string;
  gold: boolean;
  busy: boolean;
  animate: boolean;
  onPress: () => void;
}) {
  const tx = useRef(new Animated.Value(animate ? 64 : 0)).current;
  useEffect(() => {
    if (!animate) return;
    Animated.spring(tx, {
      toValue: 0,
      friction: 5,
      tension: 70,
      useNativeDriver: true,
    }).start();
    // Solo al montar: la tarjeta se anima una vez al aparecer.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View style={{ transform: [{ translateX: tx }] }}>
      <Pressable
        style={[styles.pendingItem, gold && styles.pendingItemGold]}
        disabled={busy}
        onPress={onPress}>
        <Text style={styles.pendingName}>vs {name}</Text>
        <Text style={[styles.pendingAction, gold && styles.pendingActionGold]}>{label} →</Text>
      </Pressable>
    </Animated.View>
  );
}

function RowAction({
  item,
  busy,
  onPress,
}: {
  item: RetoItem;
  busy: boolean;
  onPress: () => void;
}) {
  if (item.action === 'jugado') {
    return (
      <View style={[styles.badge, styles.badgeDone]}>
        <Ionicons name="checkmark" size={14} color="#2EB82E" />
        <Text style={styles.badgeDoneText}>Jugado</Text>
      </View>
    );
  }
  if (item.action === 'en_curso') {
    return (
      <View style={[styles.badge, styles.badgeProgress]}>
        <Ionicons name="time-outline" size={14} color={colors.gold} />
        <Text style={styles.badgeProgressText}>En curso</Text>
      </View>
    );
  }
  if (item.action === 'validar' || item.action === 'cargar') {
    return (
      <PressableScale
        style={[styles.actionBtn, styles.actionValidar]}
        disabled={busy}
        onPress={onPress}>
        <Text style={styles.actionValidarText}>{ACTION_LABEL[item.action]}</Text>
      </PressableScale>
    );
  }

  const isRetar = item.action === 'retar';
  return (
    <PressableScale
      style={[styles.actionBtn, isRetar ? styles.actionRetar : styles.actionOther]}
      disabled={busy}
      onPress={onPress}>
      {isRetar && <MaterialCommunityIcons name="sword-cross" size={14} color="#fff" />}
      <Text style={styles.actionText}>{ACTION_LABEL[item.action]}</Text>
    </PressableScale>
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

  pendingGroup: { marginTop: 16, gap: 10 },
  pendingTitle: { color: colors.primary, fontFamily: fonts.bold, fontSize: 12, letterSpacing: 0.5 },
  pendingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(229,55,52,0.10)',
    borderColor: 'rgba(229,55,52,0.4)',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  pendingName: { color: colors.foreground, fontFamily: fonts.semibold, fontSize: 15 },
  pendingAction: { color: colors.primary, fontFamily: fonts.bold },
  // Variante amarilla (validar resultado).
  pendingTitleGold: { color: colors.gold },
  pendingItemGold: { backgroundColor: 'rgba(255,204,51,0.10)', borderColor: 'rgba(255,204,51,0.4)' },
  pendingActionGold: { color: colors.gold },

  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    marginTop: 16,
    marginBottom: 8,
  },
  searchInput: { flex: 1, color: colors.foreground, fontFamily: fonts.regular, paddingVertical: 12 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  rank: { color: colors.mutedForeground, fontFamily: fonts.semibold, width: 30 },
  info: { flex: 1 },
  name: { color: colors.foreground, fontFamily: fonts.semibold, fontSize: 15 },
  record: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 12, marginTop: 2 },

  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16 },
  actionRetar: { backgroundColor: colors.primary },
  actionOther: { backgroundColor: colors.secondary, borderWidth: 1, borderColor: colors.border },
  actionText: { color: '#fff', fontFamily: fonts.bold, fontSize: 13 },
  // Boton "Validar" en amarillo (mismo tono que el badge "En curso").
  actionValidar: { backgroundColor: 'rgba(255,204,51,0.14)' },
  actionValidarText: { color: colors.gold, fontFamily: fonts.bold, fontSize: 13 },

  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12 },
  badgeDone: { backgroundColor: 'rgba(46,184,46,0.12)' },
  badgeDoneText: { color: '#2EB82E', fontFamily: fonts.semibold, fontSize: 13 },
  badgeProgress: { backgroundColor: 'rgba(255,204,51,0.12)' },
  badgeProgressText: { color: colors.gold, fontFamily: fonts.semibold, fontSize: 13 },

  empty: { textAlign: 'center', color: colors.mutedForeground, marginTop: 40, fontFamily: fonts.regular },
});
