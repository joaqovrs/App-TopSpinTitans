// Modal "Cargar resultado": el inviter carga el marcador set por set, ve el
// ganador derivado en vivo, confirma y envia (submit_result). Mejor de 5, ITTF.
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Avatar } from '@/components/avatar';
import { Stepper } from '@/components/stepper';
import { submitResult } from '@/lib/matches';
import { summarize, type SetScore } from '@/lib/score';
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
  onClose: () => void;
  onSubmitted: () => void;
};

// id estable por set: la rueda (ScrollPicker) solo lee el indice inicial, asi
// que necesitamos keys estables para que no muestre valores viejos al agregar
// o quitar sets.
let setCounter = 0;
function newSet(): SetScore {
  setCounter += 1;
  return { id: `set-${setCounter}`, mine: 0, theirs: 0 };
}

export function ScoreModal({
  visible,
  match,
  uid,
  myName,
  opponentName,
  myAvatarUrl,
  opponentAvatarUrl,
  onClose,
  onSubmitted,
}: Props) {
  const [sets, setSets] = useState<SetScore[]>([newSet()]);
  const [step, setStep] = useState<'edit' | 'confirm'>('edit');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const result = useMemo(() => summarize(sets), [sets]);

  function reset() {
    setSets([newSet()]);
    setStep('edit');
    setSending(false);
    setSendError(null);
  }

  function close() {
    reset();
    onClose();
  }

  function setScore(index: number, side: 'mine' | 'theirs', value: number) {
    setSets((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [side]: value } : s))
    );
  }

  function addSet() {
    if (sets.length >= 5) return;
    setSets((prev) => [...prev, newSet()]);
  }

  function removeSet(index: number) {
    setSets((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  }

  async function send() {
    setSending(true);
    setSendError(null);
    try {
      const mine = sets.map((s) => s.mine);
      const theirs = sets.map((s) => s.theirs);
      await submitResult(match, uid, mine, theirs);
      reset();
      onSubmitted();
    } catch (err) {
      setSendError(err instanceof Error ? err.message : 'Algo salio mal.');
      setSending(false);
    }
  }

  const winnerName =
    result.winner === 'mine' ? myName : result.winner === 'theirs' ? opponentName : null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Cargar resultado</Text>
            <Pressable hitSlop={8} onPress={close}>
              <Ionicons name="close" size={22} color={colors.mutedForeground} />
            </Pressable>
          </View>

          {step === 'edit' ? (
            <ScrollView contentContainerStyle={styles.body}>
              <View style={styles.gridRow}>
                <View style={styles.side} />
                <View style={styles.center}>
                  <View style={styles.col}>
                    <Avatar name={myName} size={48} uri={myAvatarUrl} />
                    <Text style={styles.playerName}>{myName}</Text>
                  </View>
                  <View style={styles.col}>
                    <Avatar name={opponentName} size={48} uri={opponentAvatarUrl} />
                    <Text style={styles.playerName}>{opponentName}</Text>
                  </View>
                </View>
                <View style={styles.side} />
              </View>

              {sets.map((s, i) => (
                <View key={s.id} style={styles.gridRow}>
                  <View style={styles.side}>
                    <Text style={styles.setLabel}>Set {i + 1}</Text>
                  </View>
                  <View style={styles.center}>
                    <View style={styles.col}>
                      <Stepper value={s.mine} onChange={(v) => setScore(i, 'mine', v)} />
                    </View>
                    <View style={styles.col}>
                      <Stepper value={s.theirs} onChange={(v) => setScore(i, 'theirs', v)} />
                    </View>
                  </View>
                  <View style={[styles.side, styles.sideRight]}>
                    <Pressable hitSlop={6} onPress={() => removeSet(i)}>
                      <Ionicons name="trash-outline" size={20} color={colors.mutedForeground} />
                    </Pressable>
                  </View>
                </View>
              ))}

              {/* Tanteador de sets + ganador en vivo */}
              <View style={styles.tally}>
                <Text style={styles.tallyNum}>{result.winsMine}</Text>
                <Text style={styles.tallyDash}>—</Text>
                <Text style={styles.tallyNum}>{result.winsTheirs}</Text>
              </View>
              <Text style={styles.tallyCaption}>sets ganados</Text>

              {sets.length < 5 && (
                <Pressable style={styles.addSet} onPress={addSet}>
                  <Ionicons name="add" size={18} color={colors.foreground} />
                  <Text style={styles.addSetText}>Agregar set</Text>
                </Pressable>
              )}

              {result.error ? (
                <Text style={styles.error}>{result.error}</Text>
              ) : winnerName ? (
                <View style={styles.winnerBanner}>
                  <Ionicons name="trophy" size={16} color={colors.primary} />
                  <Text style={styles.winnerText}>Ganador: {winnerName}</Text>
                </View>
              ) : null}

              <Pressable
                style={[styles.primaryBtn, !result.complete && styles.btnDisabled]}
                disabled={!result.complete}
                onPress={() => setStep('confirm')}>
                <Text style={styles.primaryBtnText}>Continuar</Text>
              </Pressable>
            </ScrollView>
          ) : (
            <ScrollView contentContainerStyle={styles.body}>
              <View style={styles.trophyCircle}>
                <Ionicons name="trophy" size={36} color={colors.primary} />
              </View>
              <Text style={styles.confirmLabel}>GANADOR</Text>
              <Text style={styles.confirmWinner}>{winnerName}</Text>
              <Text style={styles.confirmSub}>
                {result.winsMine}-{result.winsTheirs} en sets
              </Text>

              <View style={styles.setsSummary}>
                {sets.map((s, i) => (
                  <View key={i} style={styles.summaryRow}>
                    <Text style={styles.summarySet}>Set {i + 1}</Text>
                    <Text style={styles.summaryScore}>
                      {s.mine}-{s.theirs}
                    </Text>
                  </View>
                ))}
              </View>

              <Text style={styles.confirmNote}>El resultado sera enviado para validacion.</Text>

              {sendError && <Text style={styles.error}>{sendError}</Text>}

              <View style={styles.confirmActions}>
                <Pressable
                  style={styles.secondaryBtn}
                  disabled={sending}
                  onPress={() => setStep('edit')}>
                  <Ionicons name="arrow-back" size={18} color={colors.foreground} />
                  <Text style={styles.secondaryBtnText}>Editar</Text>
                </Pressable>
                <Pressable
                  style={[styles.primaryBtn, styles.flex1, sending && styles.btnDisabled]}
                  disabled={sending}
                  onPress={send}>
                  {sending ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <View style={styles.sendRow}>
                      <Ionicons name="send" size={16} color="#fff" />
                      <Text style={styles.primaryBtnText}>Enviar</Text>
                    </View>
                  )}
                </Pressable>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
    maxHeight: '88%',
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: colors.foreground, fontFamily: fonts.bold, fontSize: 18 },
  body: { paddingTop: 18, gap: 14 },

  // Grilla de 3 zonas (lado izq / centro / lado der) compartida por el
  // encabezado de jugadores y cada fila de set, para que todo quede alineado.
  gridRow: { flexDirection: 'row', alignItems: 'center' },
  side: { width: 50, justifyContent: 'center' },
  sideRight: { alignItems: 'flex-end' },
  center: { flex: 1, flexDirection: 'row', gap: 14 },
  col: { flex: 1, alignItems: 'center', gap: 6 },
  playerName: { color: colors.foreground, fontFamily: fonts.semibold, fontSize: 13 },
  setLabel: { color: colors.foreground, fontFamily: fonts.medium },

  tally: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 6 },
  tallyNum: { color: colors.foreground, fontFamily: fonts.extrabold, fontSize: 30 },
  tallyDash: { color: colors.mutedForeground, fontSize: 24 },
  tallyCaption: { color: colors.mutedForeground, textAlign: 'center', fontFamily: fonts.regular, fontSize: 12 },

  addSet: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 14,
  },
  addSetText: { color: colors.foreground, fontFamily: fonts.medium },

  error: { color: colors.destructive, textAlign: 'center', fontFamily: fonts.regular },
  winnerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(229,55,52,0.12)',
    borderRadius: 12,
    paddingVertical: 12,
  },
  winnerText: { color: colors.primary, fontFamily: fonts.bold },

  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontFamily: fonts.bold, fontSize: 16 },
  btnDisabled: { opacity: 0.4 },
  sendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  trophyCircle: {
    alignSelf: 'center',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(229,55,52,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmLabel: { color: colors.mutedForeground, textAlign: 'center', fontFamily: fonts.medium, fontSize: 12 },
  confirmWinner: { color: colors.foreground, textAlign: 'center', fontFamily: fonts.extrabold, fontSize: 22 },
  confirmSub: { color: colors.mutedForeground, textAlign: 'center', fontFamily: fonts.regular },
  setsSummary: { gap: 8, marginTop: 6 },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.secondary,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  summarySet: { color: colors.mutedForeground, fontFamily: fonts.medium },
  summaryScore: { color: colors.foreground, fontFamily: fonts.bold },
  confirmNote: { color: colors.mutedForeground, textAlign: 'center', fontFamily: fonts.regular, fontSize: 12 },
  confirmActions: { flexDirection: 'row', gap: 12, marginTop: 4 },
  flex1: { flex: 1 },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
  secondaryBtnText: { color: colors.foreground, fontFamily: fonts.semibold },
});
