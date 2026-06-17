// Verificar email: el usuario ingresa el codigo de 6 digitos que recibio.
// Al verificar, Supabase crea la sesion y la guardia redirige a la app.
import { useState } from 'react';
import { Link, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AuthHeader, AuthScaffold, Card, ErrorText, PrimaryButton } from '@/components/auth-ui';
import { OtpInput } from '@/components/otp-input';
import { useAuth } from '@/context/auth';
import { colors, fonts } from '@/lib/theme';

export default function VerifyScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const { verifyEmail, resendCode } = useAuth();
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function onVerify() {
    setSubmitting(true);
    setError(null);
    setInfo(null);
    try {
      await verifyEmail(email ?? '', code);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Codigo invalido.');
    } finally {
      setSubmitting(false);
    }
  }

  async function onResend() {
    setError(null);
    try {
      await resendCode(email ?? '');
      setInfo('Codigo reenviado.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo reenviar el codigo.');
    }
  }

  return (
    <AuthScaffold>
      <AuthHeader
        icon="mail-outline"
        title="Verifica tu email"
        subtitle={`Enviamos un codigo a ${email ?? 'tu correo'}`}
      />

      <Card>
        <OtpInput value={code} onChange={setCode} />
        {error && <ErrorText>{error}</ErrorText>}
        {info && <Text style={styles.info}>{info}</Text>}
        <PrimaryButton
          label="Verificar"
          onPress={onVerify}
          loading={submitting}
          disabled={code.length !== 6}
        />
        <View style={styles.resendRow}>
          <Text style={styles.resendText}>¿No recibiste el codigo? </Text>
          <Pressable onPress={onResend}>
            <Text style={styles.resendLink}>Reenviar</Text>
          </Pressable>
        </View>
      </Card>

      <Link href="/(auth)/login" style={styles.back}>
        ← Volver a iniciar sesion
      </Link>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  info: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 13, textAlign: 'center' },
  resendRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  resendText: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 13 },
  resendLink: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 13 },
  back: { color: colors.primary, fontFamily: fonts.semibold, textAlign: 'center' },
});
