// Dialogo de confirmacion propio (no usa Alert, que en web no soporta botones).
// Muestra un titulo, un mensaje y una lista de opciones, mas Cancelar.
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/lib/theme';

export type Choice = {
  label: string;
  variant: 'primary' | 'destructive';
  onPress: () => void;
};

type Props = {
  visible: boolean;
  title: string;
  message: string;
  choices: Choice[];
  onClose: () => void;
};

export function ConfirmModal({ visible, title, message, choices, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.actions}>
            {choices.map((c) => (
              <Pressable
                key={c.label}
                style={[
                  styles.btn,
                  c.variant === 'primary' ? styles.primary : styles.destructive,
                ]}
                onPress={() => {
                  onClose();
                  c.onPress();
                }}>
                <Text style={styles.btnText}>{c.label}</Text>
              </Pressable>
            ))}
            <Pressable style={[styles.btn, styles.cancel]} onPress={onClose}>
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
  message: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 14 },
  actions: { marginTop: 12, gap: 10 },
  btn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  primary: { backgroundColor: colors.primary },
  destructive: { backgroundColor: 'rgba(239,67,67,0.15)', borderWidth: 1, borderColor: colors.destructive },
  cancel: { backgroundColor: 'transparent' },
  btnText: { color: '#fff', fontFamily: fonts.bold, fontSize: 15 },
  cancelText: { color: colors.mutedForeground, fontFamily: fonts.semibold, fontSize: 15 },
});
