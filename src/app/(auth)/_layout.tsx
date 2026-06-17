// Grupo (auth): pantallas sin sesion (login / registro).
// Si el usuario YA tiene sesion, lo manda a la app.
import { Redirect, Stack } from 'expo-router';

import { useAuth } from '@/context/auth';

export default function AuthLayout() {
  const { session, loading } = useAuth();

  if (loading) return null;
  if (session) return <Redirect href="/(app)" />;

  return <Stack screenOptions={{ headerShown: false }} />;
}
