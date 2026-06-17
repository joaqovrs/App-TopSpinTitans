// Registro ("Crea tu cuenta"). Nombre de usuario + email + contrasena + confirmar.
// Si el proyecto pide verificar el email, navega a la pantalla de codigo.
import { useState } from 'react';
import { Link, useRouter } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

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

export default function RegisterScreen() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function onSubmit() {
    if (!displayName.trim()) {
      setError('Ingresa un nombre de usuario.');
      return;
    }
    if (!email.trim() || !password) {
      setError('Ingresa email y contrasena.');
      return;
    }
    if (password.length < 6) {
      setError('La contrasena debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('Las contrasenas no coinciden.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const { needsVerification } = await signUp(email.trim(), password, displayName.trim());
      if (needsVerification) {
        router.replace({ pathname: '/(auth)/verify', params: { email: email.trim() } });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la cuenta.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthScaffold>
      <AuthHeader icon="person-add" title="Crea tu cuenta" subtitle="Registrate para empezar" />

      <Card>
        <GoogleButton onPress={() => setInfo('El acceso con Google estara disponible pronto.')} />
        <OrDivider />
        <Field
          label="Nombre de usuario"
          icon="person-outline"
          placeholder="Como te veran los demas"
          autoCapitalize="words"
          value={displayName}
          onChangeText={setDisplayName}
          editable={!submitting}
        />
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
        />
        <Field
          label="Confirmar contraseña"
          icon="lock-closed-outline"
          placeholder="********"
          secureTextEntry
          value={confirm}
          onChangeText={setConfirm}
          editable={!submitting}
        />
        {error && <ErrorText>{error}</ErrorText>}
        {info && <Text style={styles.info}>{info}</Text>}
        <PrimaryButton label="Crear cuenta" onPress={onSubmit} loading={submitting} />
      </Card>

      <Text style={styles.bottom}>
        ¿Ya tienes cuenta? <Link href="/(auth)/login" style={styles.link}>Inicia sesion</Link>
      </Text>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  link: { color: colors.primary, fontFamily: fonts.semibold, fontSize: 13 },
  info: { color: colors.mutedForeground, fontFamily: fonts.regular, fontSize: 13, textAlign: 'center' },
  bottom: { color: colors.mutedForeground, fontFamily: fonts.regular, textAlign: 'center' },
});
