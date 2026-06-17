// Captura la tarjeta de resultado (ShareCard) como PNG y abre el menu de
// compartir del sistema (desde ahi el usuario elige Instagram -> Historia).
// El flujo: precargar avatares -> montar la tarjeta fuera de pantalla -> esperar
// al layout -> capturar -> compartir -> desmontar.
import { useCallback, useRef, useState } from 'react';
import { Image } from 'expo-image';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import type { View } from 'react-native';

import type { ShareCardData } from '@/components/share-card';

export function useShareMatch() {
  const cardRef = useRef<View>(null);
  const resolveLayout = useRef<(() => void) | null>(null);
  const [data, setData] = useState<ShareCardData | null>(null);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // La ShareCard llama a esto cuando termina su layout; esperamos un poco para
  // que la transicion de fade de los avatares (expo-image, 150ms) ya haya
  // terminado antes de capturar.
  const onCardLayout = useCallback(() => {
    setTimeout(() => resolveLayout.current?.(), 250);
  }, []);

  const share = useCallback(
    async (d: ShareCardData) => {
      if (sharing) return;
      setSharing(true);
      setError(null);
      try {
        if (!(await Sharing.isAvailableAsync())) {
          setError('Compartir no esta disponible en este dispositivo.');
          return;
        }

        // Precargar las fotos para que aparezcan en la captura (si no, salen
        // las iniciales mientras la imagen remota todavia no cargo).
        await Promise.all(
          [d.myAvatar, d.opponentAvatar]
            .filter((u): u is string => !!u)
            .map((u) => Image.prefetch(u))
        );

        // Montar la tarjeta y esperar a que haga layout.
        await new Promise<void>((resolve) => {
          resolveLayout.current = resolve;
          setData(d);
        });

        const uri = await captureRef(cardRef, {
          format: 'png',
          quality: 1,
          result: 'tmpfile',
          width: 1080,
          height: 1920,
        });

        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Compartir resultado',
          UTI: 'public.png',
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo compartir el resultado.');
      } finally {
        resolveLayout.current = null;
        setData(null);
        setSharing(false);
      }
    },
    [sharing]
  );

  return { cardRef, data, sharing, error, share, onCardLayout };
}
