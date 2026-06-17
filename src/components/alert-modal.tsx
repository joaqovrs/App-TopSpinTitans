// Modal de alerta/aviso (un solo boton). Para mostrar errores o advertencias
// de forma visible (no usa Alert nativo, que no anda en web ni respeta el tema).
import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/lib/theme';

type Props = {
  visible: boolean;
  title?: string;
  message: string;
  onClose: () => void;
};

export function AlertModal({ visible, title = 'Atencion', message, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <View style={styles.iconBox}>
            <Ionicons name="alert-circle" size={32} color={colors.primary} />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <Pressable style={styles.btn} onPress={onClose}>
            <Text style={styles.btnText}>Entendido</Text>
          </Pressable>
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
    maxWidth: 360,
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 22,
    alignItems: 'center',
    gap: 10,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(229,55,52,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: colors.foreground, fontFamily: fonts.bold, fontSize: 18 },
  message: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 14, textAlign: 'center' },
  btn: {
    marginTop: 8,
    alignSelf: 'stretch',
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontFamily: fonts.bold, fontSize: 15 },
});
