// Conecta las notificaciones push con la app:
//   - Al haber sesion, registra el Expo push token del dispositivo.
//   - Al tocar una notificacion, navega a la pantalla indicada en su `data`.
//     useLastNotificationResponse cubre los dos casos: app abierta y app que se
//     abrio desde cero al tocar la push (cold start).
import * as Notifications from 'expo-notifications';
import { useRouter, type Href } from 'expo-router';
import { useEffect, useRef } from 'react';

import { useAuth } from '@/context/auth';
import { registerAndSavePushToken } from '@/lib/notifications';

// Mapea el `screen` que mandan los triggers del backend a una ruta de la app.
const SCREEN_ROUTES: Record<string, Href> = {
  inicio: '/(app)',
  retos: '/(app)/retos',
  ranking: '/(app)/ranking',
  historial: '/(app)/historial',
  admin: '/(app)/admin',
  podio: '/(app)/podio',
};

export function usePushNotifications() {
  const router = useRouter();
  const { session } = useAuth();
  const userId = session?.user?.id;
  const lastResponse = Notifications.useLastNotificationResponse();
  // Evita re-navegar por la misma respuesta (el hook conserva la ultima).
  const handledId = useRef<string | null>(null);

  // Registrar el token cuando hay sesion (al cambiar el usuario logueado).
  useEffect(() => {
    if (!userId) return;
    registerAndSavePushToken().catch((e) =>
      console.warn('No se pudo registrar el token de push:', e)
    );
  }, [userId]);

  // Deep linking al tocar la notificacion.
  useEffect(() => {
    if (!userId || !lastResponse) return;

    const request = lastResponse.notification.request;
    if (handledId.current === request.identifier) return;
    handledId.current = request.identifier;

    const screen = request.content.data?.screen;
    if (typeof screen === 'string' && SCREEN_ROUTES[screen]) {
      router.navigate(SCREEN_ROUTES[screen]);
    }
  }, [lastResponse, userId, router]);
}
