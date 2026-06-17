// Login ("Bienvenido"). Email/contrasena + Google (visual) + enlaces a registro
// y recuperar contrasena.
import { useState } from 'react';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import {
  AuthHeader,
  AuthScaffold,
  Card,
  ErrorText,
  Field,
  GoogleButton,
  OrDivider,
  PrimaryButton,
} from '@/components/auth-ui';
import { useAuth } from '@/context/auth';
import { colors, fonts } from '@/lib/theme';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function onSubmit() {
    if (!email.trim() || !password) {
      setError('Ingresa email y contrasena.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesion.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthScaffold>
      <AuthHeader icon="log-in" title="Bienvenido" subtitle="Inicia sesion en tu cuenta" />

      <Card>
        <GoogleButton onPress={() => setInfo('El acceso con Google estara disponible pronto.')} />
        <OrDivider />
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
        <Field
          label="Contraseña"
          icon="lock-closed-outline"
          placeholder="********"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          editable={!submitting}
          rightSlot={
            <Link href="/(auth)/forgot-password" asChild>
              <Pressable>
                <Text style={styles.link}>¿Olvidaste tu contraseña?</Text>
              </Pressable>
            </Link>
          }
        />
        {error && <ErrorText>{error}</ErrorText>}
        {info && <Text style={styles.info}>{info}</Text>}
        <PrimaryButton label="Entrar" onPress={onSubmit} loading={submitting} />
      </Card>

      <Text style={styles.bottom}>
        ¿No tienes cuenta? <Link href="/(auth)/register" style={styles.link}>Crear una</Link>
      </Text>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  link: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 13 },
  info: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 13, textAlign: 'center' },
  bottom: { color: colors.mutedForeground, fontFamily: fonts.regular, textAlign: 'center' },
});
