// Notificaciones push (lado app). Tres responsabilidades:
//   1. Handler de foreground: con la app ABIERTA suprimimos el banner del
//      sistema (Realtime ya actualiza la UI). Con la app cerrada/background el
//      SO muestra la push normalmente, sin pasar por aca.
//   2. Registrar el Expo push token del dispositivo (al loguear) via la RPC
//      register_push_token. La app nunca escribe directo.
//   3. Dar de baja el token al cerrar sesion (unregister_push_token).
//
// NOTA: las push remotas requieren un development build; en Expo Go (Android)
// no funcionan desde SDK 53. getExpoPushTokenAsync necesita el projectId de EAS.
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

// Foreground: no mostrar banner ni sumar al centro de notificaciones ni sonar.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: false,
    shouldShowList: false,
  }),
});

// projectId de EAS: lo pide getExpoPushTokenAsync para emitir el token.
const projectId =
  Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

// Guardamos el ultimo token para poder darlo de baja al cerrar sesion.
let currentToken: string | null = null;

/**
 * Pide permiso, obtiene el Expo push token del dispositivo y lo registra en el
 * backend. Es idempotente y silencioso: si corre en emulador/web, sin permiso
 * o sin projectId, simplemente no hace nada (no rompe el login).
 */
export async function registerAndSavePushToken(): Promise<void> {
  // Las push solo tienen sentido en un dispositivo fisico.
  if (!Device.isDevice) return;

  // Android necesita un canal para mostrar notificaciones.
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'General',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  // Permisos: pedirlos solo si no estan ya concedidos.
  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (existing !== 'granted') {
    status = (await Notifications.requestPermissionsAsync()).status;
  }
  if (status !== 'granted') return;

  if (!projectId) return;

  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  currentToken = token;

  const { error } = await supabase.rpc('register_push_token', {
    p_token: token,
    p_platform: Platform.OS,
  });
  if (error) throw error;
}

/**
 * Da de baja el token del dispositivo. Llamar ANTES de cerrar sesion, porque la
 * RPC exige usuario autenticado (auth.uid()).
 */
export async function unregisterPushToken(): Promise<void> {
  if (!currentToken) return;
  await supabase.rpc('unregister_push_token', { p_token: currentToken });
  currentToken = null;
}
