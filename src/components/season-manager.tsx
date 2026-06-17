// Gestion de temporada (panel admin): crear, editar fechas, iniciar y cerrar.
// Llama a las RPC del backend (que verifican is_admin()).
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { DateField } from '@/components/date-field';
import {
  closeSeason,
  createSeason,
  setSeasonDates,
  startSeason,
} from '@/lib/admin';
import { formatDmy } from '@/lib/dates';
import { colors, fonts } from '@/lib/theme';
import type { Season } from '@/lib/types';

const GREEN = '#2EB82E';

type Props = {
  liveSeason: Season | null;
  closedSeasons: Season[];
  onChanged: () => void;
};

export function SeasonManager({ liveSeason, closedSeasons, onChanged }: Props) {
  const [creating, setCreating] = useState(false);
  const [editingDates, setEditingDates] = useState(false);
  const [name, setName] = useState('');
  const [startIso, setStartIso] = useState<string | null>(null);
  const [endIso, setEndIso] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<void>, after?: () => void) {
    setBusy(true);
    setError(null);
    try {
      await action();
      after?.();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo salio mal.');
    } finally {
      setBusy(false);
    }
  }

  function onCreate() {
    if (!name.trim()) {
      setError('La temporada necesita un nombre.');
      return;
    }
    run(() => createSeason(name.trim(), startIso, endIso), () => {
      setName('');
      setStartIso(null);
      setEndIso(null);
      setCreating(false);
    });
  }

  function onSaveDates() {
    if (liveSeason) {
      run(() => setSeasonDates(liveSeason.id, startIso, endIso), () => setEditingDates(false));
    }
  }

  function openEditDates() {
    if (!liveSeason) return;
    setStartIso(liveSeason.start_date);
    setEndIso(liveSeason.end_date);
    setEditingDates(true);
    setError(null);
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.sectionRow}>
        <Ionicons name="calendar-outline" size={16} color={colors.foreground} />
        <Text style={styles.sectionTitle}>GESTION DE TEMPORADA</Text>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      {!liveSeason ? (
        creating ? (
          // --- Formulario de nueva temporada ---
          <View style={styles.card}>
            <Text style={styles.cardTitle}>NUEVA TEMPORADA</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre (ej: Temporada 2026)"
              placeholderTextColor={colors.mutedForeground}
              value={name}
              onChangeText={setName}
              editable={!busy}
            />
            <View style={styles.dateRow}>
              <DateField label="INICIO" value={startIso} onChange={setStartIso} disabled={busy} />
              <DateField label="FIN" value={endIso} onChange={setEndIso} disabled={busy} />
            </View>
            <View style={styles.formActions}>
              <Pressable
                style={[styles.btn, styles.btnGhost]}
                disabled={busy}
                onPress={() => {
                  setCreating(false);
                  setError(null);
                }}>
                <Text style={styles.btnGhostText}>Cancelar</Text>
              </Pressable>
              <Pressable style={[styles.btn, styles.btnPrimary]} disabled={busy} onPress={onCreate}>
                <Text style={styles.btnPrimaryText}>Crear</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          // --- Sin temporada ---
          <View style={styles.card}>
            <Text style={styles.emptyText}>No hay temporada activa</Text>
            <Pressable
              style={[styles.btn, styles.btnPrimary, styles.btnFull]}
              onPress={() => setCreating(true)}>
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.btnPrimaryText}>Crear temporada</Text>
            </Pressable>
          </View>
        )
      ) : (
        // --- Temporada viva (enrolling o active) ---
        <View style={styles.card}>
          <View style={styles.liveHeader}>
            <Text style={styles.liveName}>{liveSeason.name}</Text>
            {liveSeason.status === 'enrolling' ? (
              <View style={[styles.badge, { backgroundColor: 'rgba(255,204,51,0.14)' }]}>
                <Text style={[styles.badgeText, { color: colors.gold }]}>Inscripciones abiertas</Text>
              </View>
            ) : (
              <View style={[styles.badge, { backgroundColor: 'rgba(46,184,46,0.14)' }]}>
                <Text style={[styles.badgeText, { color: GREEN }]}>En curso</Text>
              </View>
            )}
          </View>

          <View style={styles.dateLine}>
            <Ionicons name="calendar-outline" size={14} color={colors.mutedForeground} />
            <Text style={styles.dateText}>
              {formatDmy(liveSeason.start_date)} → {formatDmy(liveSeason.end_date)}
            </Text>
            {!editingDates && (
              <Pressable onPress={openEditDates}>
                <Text style={styles.editLink}>Editar fechas</Text>
              </Pressable>
            )}
          </View>

          {editingDates && (
            <View style={styles.editBlock}>
              <View style={styles.dateRow}>
                <DateField label="INICIO" value={startIso} onChange={setStartIso} disabled={busy} />
                <DateField label="FIN" value={endIso} onChange={setEndIso} disabled={busy} />
              </View>
              <View style={styles.formActions}>
                <Pressable
                  style={[styles.btn, styles.btnGhost]}
                  disabled={busy}
                  onPress={() => {
                    setEditingDates(false);
                    setError(null);
                  }}>
                  <Text style={styles.btnGhostText}>Cancelar</Text>
                </Pressable>
                <Pressable style={[styles.btn, styles.btnPrimary]} disabled={busy} onPress={onSaveDates}>
                  <Text style={styles.btnPrimaryText}>Guardar</Text>
                </Pressable>
              </View>
            </View>
          )}

          {!editingDates &&
            (liveSeason.status === 'enrolling' ? (
              <Pressable
                style={[styles.btn, styles.btnStart, styles.btnFull]}
                disabled={busy}
                onPress={() => run(() => startSeason(liveSeason.id))}>
                <Ionicons name="play" size={18} color="#fff" />
                <Text style={styles.btnPrimaryText}>Iniciar temporada</Text>
              </Pressable>
            ) : (
              <Pressable
                style={[styles.btn, styles.btnClose, styles.btnFull]}
                disabled={busy}
                onPress={() => run(() => closeSeason(liveSeason.id))}>
                <Ionicons name="checkmark-circle-outline" size={18} color={colors.foreground} />
                <Text style={styles.btnCloseText}>Cerrar temporada</Text>
              </Pressable>
            ))}
        </View>
      )}

      {/* Temporadas cerradas */}
      {closedSeasons.length > 0 && (
        <>
          <Text style={styles.closedTitle}>TEMPORADAS CERRADAS</Text>
          {closedSeasons.map((s) => (
            <View key={s.id} style={styles.closedRow}>
              <Text style={styles.closedName} numberOfLines={1}>
                {s.name}
              </Text>
              <View style={styles.closedBadge}>
                <Text style={styles.closedBadgeText}>Cerrada</Text>
              </View>
            </View>
          ))}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { color: colors.foreground, fontFamily: fonts.bold, fontSize: 13, letterSpacing: 0.5 },
  error: { color: colors.destructive, fontFamily: fonts.regular, fontSize: 13 },

  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  cardTitle: { color: colors.foreground, fontFamily: fonts.bold, fontSize: 13, letterSpacing: 0.5 },
  emptyText: { color: colors.mutedForeground, fontFamily: fonts.regular, textAlign: 'center' },

  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.foreground,
    fontFamily: fonts.regular,
    fontSize: 15,
  },
  dateRow: { flexDirection: 'row', gap: 12 },
  editBlock: { gap: 12 },

  formActions: { flexDirection: 'row', gap: 12 },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 10, paddingVertical: 14, paddingHorizontal: 18 },
  btnFull: { alignSelf: 'stretch' },
  btnPrimary: { backgroundColor: colors.primary, flex: 1 },
  btnPrimaryText: { color: '#fff', fontFamily: fonts.bold, fontSize: 15 },
  btnGhost: { borderWidth: 1, borderColor: colors.border, flex: 1 },
  btnGhostText: { color: colors.foreground, fontFamily: fonts.semibold, fontSize: 15 },
  btnStart: { backgroundColor: GREEN },
  btnClose: { borderWidth: 1, borderColor: colors.border },
  btnCloseText: { color: colors.foreground, fontFamily: fonts.semibold, fontSize: 15 },

  liveHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  liveName: { color: colors.foreground, fontFamily: fonts.bold, fontSize: 18, flex: 1 },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  badgeText: { fontFamily: fonts.semibold, fontSize: 12 },
  dateLine: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  dateText: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 13 },
  editLink: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 13, marginLeft: 4 },

  closedTitle: { color: colors.mutedForeground, fontFamily: fonts.bold, fontSize: 12, letterSpacing: 0.5, marginTop: 8 },
  closedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  closedName: { color: colors.foreground, fontFamily: fonts.semibold, fontSize: 15, flex: 1 },
  closedBadge: { backgroundColor: colors.secondary, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 3 },
  closedBadgeText: { color: colors.mutedForeground, fontFamily: fonts.medium, fontSize: 12 },
});
