// Modal "Validar resultado": el invitado VE el marcador set por set que cargo
// el rival y recien ahi confirma o rechaza. Lee los sets del partido (su propio
// partido, visible por RLS) y los muestra desde su perspectiva.
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Avatar } from '@/components/avatar';
import { supabase } from '@/lib/supabase';
import { colors, fonts } from '@/lib/theme';
import type { Match } from '@/lib/types';

type Props = {
  visible: boolean;
  match: Match;
  uid: string;
  myName: string;
  opponentName: string;
  myAvatarUrl?: string | null;
  opponentAvatarUrl?: string | null;
  busy: boolean;
  onClose: () => void;
  onDecision: (accept: boolean) => void;
};

type Row = { n: number; mine: number; theirs: number };

export function ValidateModal({
  visible,
  match,
  uid,
  myName,
  opponentName,
  myAvatarUrl,
  opponentAvatarUrl,
  busy,
  onClose,
  onDecision,
}: Props) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    let alive = true;
    setRows(null);
    setError(null);
    (async () => {
      const { data, error: qErr } = await supabase
        .from('match_sets')
        .select('set_number, score_a, score_b')
        .eq('match_id', match.id)
        .order('set_number');
      if (!alive) return;
      if (qErr) {
        setError('No se pudo cargar el marcador.');
        return;
      }
      const iAmA = match.player_a === uid;
      setRows(
        (data ?? []).map((s) => ({
          n: s.set_number,
          mine: iAmA ? s.score_a : s.score_b,
          theirs: iAmA ? s.score_b : s.score_a,
        }))
      );
    })();
    return () => {
      alive = false;
    };
  }, [visible, match.id, match.player_a, uid]);

  const myWins = rows?.filter((r) => r.mine > r.theirs).length ?? 0;
  const theirWins = rows?.filter((r) => r.theirs > r.mine).length ?? 0;
  const iWon = match.winner_id === uid;
  const winnerName = iWon ? myName : opponentName;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={busy ? undefined : onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>Validar resultado</Text>
          <Text style={styles.subtitle}>Revisa el marcador antes de confirmar.</Text>

          {/* Jugadores */}
          <View style={styles.players}>
            <View style={styles.player}>
              <Avatar name={myName} size={44} uri={myAvatarUrl} />
              <Text style={styles.playerName} numberOfLines={1}>{myName}</Text>
            </View>
            <View style={styles.tally}>
              <Text style={styles.tallyNum}>{myWins}</Text>
              <Text style={styles.tallyDash}>-</Text>
              <Text style={styles.tallyNum}>{theirWins}</Text>
            </View>
            <View style={styles.player}>
              <Avatar name={opponentName} size={44} uri={opponentAvatarUrl} />
              <Text style={styles.playerName} numberOfLines={1}>{opponentName}</Text>
            </View>
          </View>

          {/* Marcador set por set */}
          {rows === null && !error ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: 16 }} />
          ) : error ? (
            <Text style={styles.error}>{error}</Text>
          ) : (
            <View style={styles.sets}>
              {rows!.map((r) => {
                const won = r.mine > r.theirs;
                return (
                  <View key={r.n} style={styles.setRow}>
                    <Text style={styles.setLabel}>Set {r.n}</Text>
                    <Text style={[styles.setScore, { color: won ? colors.win : colors.primary }]}>
                      {r.mine} - {r.theirs}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Ganador derivado */}
          <View style={styles.winnerBanner}>
            <Ionicons name="trophy" size={16} color={colors.gold} />
            <Text style={styles.winnerText}>Gana: {winnerName}</Text>
          </View>

          {/* Acciones */}
          <View style={styles.actions}>
            <Pressable
              style={[styles.btn, styles.confirm, busy && styles.btnDisabled]}
              disabled={busy}
              onPress={() => onDecision(true)}>
              {busy ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.confirmText}>Confirmar</Text>
              )}
            </Pressable>
            <Pressable
              style={[styles.btn, styles.reject, busy && styles.btnDisabled]}
              disabled={busy}
              onPress={() => onDecision(false)}>
              <Text style={styles.rejectText}>Rechazar</Text>
            </Pressable>
            <Pressable style={[styles.btn, styles.cancel]} disabled={busy} onPress={onClose}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    gap: 8,
  },
  title: { color: colors.foreground, fontFamily: fonts.bold, fontSize: 18 },
  subtitle: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 13 },

  players: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginTop: 12 },
  player: { flex: 1, alignItems: 'center', gap: 6 },
  playerName: { color: colors.foreground, fontFamily: fonts.semibold, fontSize: 13, textAlign: 'center' },
  tally: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 8 },
  tallyNum: { color: colors.foreground, fontFamily: fonts.extrabold, fontSize: 26 },
  tallyDash: { color: colors.mutedForeground, fontSize: 20 },

  sets: { marginTop: 14, gap: 8 },
  setRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  setLabel: { color: colors.mutedForeground, fontFamily: fonts.medium, fontSize: 14 },
  setScore: { fontFamily: fonts.bold, fontSize: 16 },

  error: { color: colors.destructive, fontFamily: fonts.regular, textAlign: 'center', marginVertical: 12 },

  winnerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,204,51,0.12)',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 14,
  },
  winnerText: { color: colors.gold, fontFamily: fonts.bold, fontSize: 14 },

  actions: { marginTop: 14, gap: 10 },
  btn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  confirm: { backgroundColor: colors.primary },
  confirmText: { color: '#fff', fontFamily: fonts.bold, fontSize: 15 },
  reject: { backgroundColor: 'rgba(239,67,67,0.15)', borderWidth: 1, borderColor: colors.destructive },
  rejectText: { color: colors.destructive, fontFamily: fonts.bold, fontSize: 15 },
  cancel: { backgroundColor: 'transparent' },
  cancelText: { color: colors.mutedForeground, fontFamily: fonts.semibold, fontSize: 15 },
  btnDisabled: { opacity: 0.5 },
});
