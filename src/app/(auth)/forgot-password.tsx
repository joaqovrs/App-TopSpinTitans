// Recuperar contrasena. Envia el enlace de restablecimiento al email.
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AuthHeader, AuthScaffold, Card, ErrorText, Field, PrimaryButton } from '@/components/auth-ui';
import { useAuth } from '@/context/auth';
import { colors, fonts } from '@/lib/theme';

export default function ForgotPasswordScreen() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit() {
    if (!email.trim()) {
      setError('Ingresa tu email.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await resetPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar el enlace.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthScaffold>
      <AuthHeader
        icon="mail-outline"
        title="Recuperar contrasena"
        subtitle="Te enviaremos un enlace para restablecerla"
      />

      <Card>
        {sent ? (
          <View style={styles.sentBox}>
            <Ionicons name="checkmark-circle" size={40} color="#2EB82E" />
            <Text style={styles.sentText}>
              Si el email existe, te enviamos un enlace para restablecer la contrasena.
            </Text>
          </View>
        ) : (
          <>
            <Field
              label="Email"
              icon="mail-outline"
              placeholder="tucorreo@ejemplo.com"
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              value={email}
              onChangeText={setEmail}
              editable={!submitting}
            />
            {error && <ErrorText>{error}</ErrorText>}
            <PrimaryButton label="Enviar enlace" onPress={onSubmit} loading={submitting} />
          </>
        )}
      </Card>

      <Link href="/(auth)/login" style={styles.back}>
        ← Volver a iniciar sesion
      </Link>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  sentBox: { alignItems: 'center', gap: 12, paddingVertical: 8 },
  sentText: { color: colors.foreground, fontFamily: fonts.regular, textAlign: 'center' },
  back: { color: colors.primary, fontFamily: fonts.semibold, textAlign: 'center' },
});
