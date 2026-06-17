// Campo de fecha con calendario (react-native-calendars, JS puro: anda en web y
// en Expo Go). Trabaja con fechas ISO (yyyy-mm-dd). Se abre en un modal.
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';

import { formatDmy } from '@/lib/dates';
import { colors, fonts } from '@/lib/theme';

LocaleConfig.locales['es'] = {
  monthNames: [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ],
  monthNamesShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
  dayNames: ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'],
  dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'],
  today: 'Hoy',
};
LocaleConfig.defaultLocale = 'es';

type Props = {
  label: string;
  value: string | null; // ISO yyyy-mm-dd
  onChange: (iso: string | null) => void;
  disabled?: boolean;
};

export function DateField({ label, value, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Pressable style={styles.box} disabled={disabled} onPress={() => setOpen(true)}>
        <Text style={[styles.value, !value && styles.placeholder]}>
          {value ? formatDmy(value) : 'dd-mm-aaaa'}
        </Text>
        <Ionicons name="calendar-outline" size={18} color={colors.mutedForeground} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Calendar
              current={value ?? undefined}
              onDayPress={(d) => {
                onChange(d.dateString);
                setOpen(false);
              }}
              markedDates={value ? { [value]: { selected: true, selectedColor: colors.primary } } : {}}
              theme={{
                calendarBackground: colors.card,
                monthTextColor: colors.foreground,
                textMonthFontFamily: fonts.bold,
                textMonthFontWeight: '700',
                dayTextColor: colors.foreground,
                textDayFontFamily: fonts.regular,
                textDayHeaderFontFamily: fonts.medium,
                textSectionTitleColor: colors.mutedForeground,
                todayTextColor: colors.accent,
                selectedDayBackgroundColor: colors.primary,
                selectedDayTextColor: '#fff',
                arrowColor: colors.primary,
                textDisabledColor: '#444',
              }}
            />
            <View style={styles.actions}>
              <Pressable
                onPress={() => {
                  onChange(null);
                  setOpen(false);
                }}>
                <Text style={styles.clear}>Limpiar</Text>
              </Pressable>
              <Pressable onPress={() => setOpen(false)}>
                <Text style={styles.close}>Cerrar</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, gap: 6 },
  label: { color: colors.mutedForeground, fontFamily: fonts.medium, fontSize: 11 },
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  value: { color: colors.foreground, fontFamily: fonts.regular, fontSize: 15 },
  placeholder: { color: colors.mutedForeground },

  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    overflow: 'hidden',
  },
  actions: { flexDirection: 'row', justifyContent: 'space-between', padding: 12 },
  clear: { color: colors.mutedForeground, fontFamily: fonts.semibold },
  close: { color: colors.primary, fontFamily: fonts.semibold },
});
