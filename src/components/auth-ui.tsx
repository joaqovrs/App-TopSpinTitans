// Piezas reutilizables para las pantallas de auth (login, registro, recuperar,
// verificar). Tema oscuro de Base44.
import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PressableScale } from '@/components/pressable-scale';
import { colors, fonts } from '@/lib/theme';

// Contenedor de pantallas de auth: evita que el teclado tape los campos
// (KeyboardAvoidingView) y permite scrollear si no entra todo.
export function AuthScaffold({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaView style={styles.scaffoldSafe}>
      <KeyboardAvoidingView
        style={styles.scaffoldFlex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={styles.scaffoldContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function AuthHeader({
  icon,
  title,
  subtitle,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.header}>
      <View style={styles.iconBox}>
        <Ionicons name={icon} size={28} color="#fff" />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

export function Field({
  label,
  icon,
  rightSlot,
  ...inputProps
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  rightSlot?: React.ReactNode;
} & TextInputProps) {
  return (
    <View style={styles.fieldWrap}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{label}</Text>
        {rightSlot}
      </View>
      <View style={styles.inputBox}>
        <Ionicons name={icon} size={18} color={colors.mutedForeground} />
        <TextInput
          style={styles.input}
          placeholderTextColor={colors.mutedForeground}
          {...inputProps}
        />
      </View>
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  loading,
  disabled,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <PressableScale
      style={[styles.primaryBtn, (disabled || loading) && styles.disabled]}
      onPress={onPress}
      disabled={disabled || loading}>
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>{label}</Text>}
    </PressableScale>
  );
}

export function GoogleButton({ onPress }: { onPress: () => void }) {
  return (
    <PressableScale style={styles.googleBtn} onPress={onPress}>
      <Ionicons name="logo-google" size={18} color="#fff" />
      <Text style={styles.googleText}>Continuar con Google</Text>
    </PressableScale>
  );
}

export function OrDivider() {
  return (
    <View style={styles.orRow}>
      <View style={styles.line} />
      <Text style={styles.orText}>O</Text>
      <View style={styles.line} />
    </View>
  );
}

export function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

export function ErrorText({ children }: { children: React.ReactNode }) {
  return <Text style={styles.error}>{children}</Text>;
}

const styles = StyleSheet.create({
  scaffoldSafe: { flex: 1, backgroundColor: colors.background },
  scaffoldFlex: { flex: 1 },
  scaffoldContent: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 20 },

  header: { alignItems: 'center', gap: 6, marginBottom: 8 },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: { color: colors.foreground, fontFamily: fonts.extrabold, fontSize: 28 },
  subtitle: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 15 },

  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    padding: 20,
    gap: 16,
  },

  fieldWrap: { gap: 8 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { color: colors.foreground, fontFamily: fonts.semibold, fontSize: 14 },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
  },
  input: { flex: 1, color: colors.foreground, fontFamily: fonts.regular, fontSize: 15, paddingVertical: 13 },

  primaryBtn: { backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 15, alignItems: 'center' },
  primaryText: { color: '#fff', fontFamily: fonts.bold, fontSize: 16 },
  disabled: { opacity: 0.5 },

  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 14,
  },
  googleText: { color: colors.foreground, fontFamily: fonts.semibold, fontSize: 15 },

  orRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  line: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  orText: { color: colors.mutedForeground, fontFamily: fonts.medium, fontSize: 12 },

  error: { color: colors.destructive, fontFamily: fonts.regular, fontSize: 13, textAlign: 'center' },
});
