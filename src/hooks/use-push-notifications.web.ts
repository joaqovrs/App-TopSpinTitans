// En web no hay notificaciones push nativas (expo-notifications usa APIs nativas
// como getLastNotificationResponse que no existen en el navegador). Metro resuelve
// este archivo en web automaticamente, dejando el hook como un no-op.
export function usePushNotifications() {}
