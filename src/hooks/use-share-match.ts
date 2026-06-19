// Captura la tarjeta de resultado (ShareCard) y la comparte a Instagram Stories
// como STICKER (igual que Spotify): la tarjeta queda redondeada, flotante y el
// usuario la puede mover / agrandar / achicar con los dedos, sobre un fondo
// degradado que combina con el resultado (verde si gane, rojo si perdi).
//
// Por que sticker y no imagen plana: al compartir como sticker las esquinas
// redondeadas transparentes flotan sobre el fondo -> ya no se ven los triangulos
// negros. Ademas se gana el gesto de redimensionar.
//
// Flujo: precargar avatares -> montar la tarjeta fuera de pantalla -> esperar al
// layout -> capturar en base64 -> compartir a Stories -> desmontar.
// Si Instagram no esta instalado o falta el FB App ID, cae al menu de compartir
// del sistema (expo-sharing) con la imagen, como respaldo.
//
// IMPORTANTE (tamaño del sticker): captureRef captura por defecto a la densidad
// del dispositivo (pixelRatio 2-3x). La card mide 1080 en DP, asi que en un
// telefono 3x saldria un PNG de ~3240x5000 px y varios MB -> Instagram NO acepta
// stickers tan grandes y se CIERRA al instante. Por eso forzamos el tamaño de
// salida a las dimensiones de diseño (1 px por DP) con width/height.
import { useCallback, useRef, useState } from 'react';
import { Image } from 'expo-image';
import * as Sharing from 'expo-sharing';
import { captureRef } from 'react-native-view-shot';
import { Platform, type LayoutChangeEvent, type View } from 'react-native';

// OJO: react-native-share es un modulo NATIVO sin soporte web. Si se importa al
// tope del archivo, en web ejecuta TurboModuleRegistry.getEnforcing('RNShare')
// y rompe TODO el bundle ("Cannot read properties of undefined (reading
// 'getEnforcing')"), porque expo-router evalua los archivos de rutas al arrancar.
// Por eso se carga de forma diferida (require) solo en nativo, dentro de share().

import type { ShareCardData } from '@/components/share-card';

const FB_APP_ID = process.env.EXPO_PUBLIC_FB_APP_ID;

// Fondo degradado para el sticker. Se elige un tono oscuro derivado del
// resultado para que "combine" con la tarjeta (#242424): verde apagado en
// victoria, rojo apagado en derrota, fundiendo hacia el negro del tema.
function backgroundColors(iWon: boolean) {
  return iWon
    ? { top: '#13361A', bottom: '#0A0A0A' } // victoria: verde profundo -> negro
    : { top: '#3D1413', bottom: '#0A0A0A' }; // derrota: rojo profundo -> negro
}

export function useShareMatch() {
  const cardRef = useRef<View>(null);
  const resolveLayout = useRef<(() => void) | null>(null);
  // Medidas reales de la card (en DP) para fijar el tamaño de salida del PNG.
  const cardSize = useRef<{ width: number; height: number } | null>(null);
  const [data, setData] = useState<ShareCardData | null>(null);
  const [sharing, setSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // La ShareCard llama a esto cuando termina su layout; guardamos su tamaño y
  // esperamos un poco para que la transicion de fade de los avatares
  // (expo-image, 150ms) ya haya terminado antes de capturar.
  const onCardLayout = useCallback((e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    cardSize.current = { width, height };
    setTimeout(() => resolveLayout.current?.(), 250);
  }, []);

  const share = useCallback(
    async (d: ShareCardData) => {
      if (sharing) return;
      setSharing(true);
      setError(null);
      try {
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

        // Tamaño de salida fijo (1 px por DP). Sin esto, el PNG se multiplica
        // por la densidad de pantalla y se vuelve gigante (ver nota arriba).
        const out = cardSize.current
          ? { width: Math.round(cardSize.current.width), height: Math.round(cardSize.current.height) }
          : {};

        // Capturamos en base64: la API de Stories recibe el sticker como data URI
        // (no como archivo).
        const base64 = await captureRef(cardRef, {
          format: 'png',
          quality: 1,
          result: 'base64',
          ...out,
        });
        const stickerImage = `data:image/png;base64,${base64}`;

        // Camino principal: sticker en Instagram Stories (tipo Spotify). Solo en
        // nativo; en web react-native-share no existe y caemos al respaldo.
        const { top, bottom } = backgroundColors(d.iWon);
        if (Platform.OS !== 'web' && FB_APP_ID) {
          // require diferido: ver nota del import arriba (no cargar en web).
          const { default: Share, Social } = require('react-native-share');
          try {
            await Share.shareSingle({
              social: Social.InstagramStories,
              appId: FB_APP_ID,
              stickerImage,
              backgroundTopColor: top,
              backgroundBottomColor: bottom,
              // CLAVE: escribir el sticker en el cache INTERNO. El FileProvider
              // de react-native-share solo declara <cache-path "/"> (interno) y
              // <external-path "Download/"> (publico); NO declara el external
              // cache. Por defecto el base64 se guarda en getExternalCacheDir()
              // -> getUriForFile falla -> Instagram recibe una URI ilegible y se
              // cierra al instante sin abrir. Con esto cae en getCacheDir(), que
              // si esta cubierto, y la URI content:// es legible por Instagram.
              useInternalStorage: true,
            });
            return;
          } catch {
            // Instagram no instalado / cancelado / sin permiso: probamos el
            // respaldo de abajo en vez de fallar.
          }
        }

        // Respaldo: menu de compartir del sistema con la imagen como archivo.
        if (!(await Sharing.isAvailableAsync())) {
          setError('Compartir no esta disponible en este dispositivo.');
          return;
        }
        const uri = await captureRef(cardRef, {
          format: 'png',
          quality: 1,
          result: 'tmpfile',
          ...out,
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
        cardSize.current = null;
        setData(null);
        setSharing(false);
      }
    },
    [sharing]
  );

  return { cardRef, data, sharing, error, share, onCardLayout };
}
