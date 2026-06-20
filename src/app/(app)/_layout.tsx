// Grupo (app): todo lo que requiere sesion. Navegacion por pestañas inferiores
// (Inicio / Retos / Ranking / Historial / Perfil), segun el diseno de Base44.
// Si no hay sesion, rebota al login.
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';

import { useAuth } from '@/context/auth';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { colors, fonts } from '@/lib/theme';

export default function AppLayout() {
  const { session, loading } = useAuth();

  // Registra el token de push y maneja el deep linking al tocar una notificacion.
  usePushNotifications();

  if (loading) return null;
  if (!session) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 11 },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="retos"
        options={{
          title: 'Retos',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="sword-cross" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="ranking"
        options={{
          title: 'Ranking',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="trophy-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="historial"
        options={{
          title: 'Historial',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" color={color} size={size} />
          ),
        }}
      />
      {/* Panel de admin: no aparece en la barra (href:null) y oculta la barra
          cuando esta activo (tabBarStyle display none). Se entra desde Perfil. */}
      <Tabs.Screen
        name="admin"
        options={{ href: null, tabBarStyle: { display: 'none' } }}
      />
      {/* Ceremonia de fin de temporada: fuera de la barra, sin tab bar. Se entra
          automaticamente al cerrar una temporada o por la notificacion. */}
      <Tabs.Screen
        name="podio"
        options={{ href: null, tabBarStyle: { display: 'none' } }}
      />
    </Tabs>
  );
}
