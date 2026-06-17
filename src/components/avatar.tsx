// Avatar circular: muestra la foto del jugador si tiene `uri`; si no, las
// iniciales del nombre sobre un fondo neutro.
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/lib/theme';

function initialsOf(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

type Props = {
  name: string;
  size?: number;
  ringColor?: string;
  /** URL de la foto de perfil. Si no viene, se muestran las iniciales. */
  uri?: string | null;
};

export function Avatar({ name, size = 48, ringColor, uri }: Props) {
  const ringStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    borderWidth: ringColor ? 2 : 0,
    borderColor: ringColor,
  };

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.circle, ringStyle]}
        contentFit="cover"
        transition={150}
      />
    );
  }

  return (
    <View style={[styles.circle, ringStyle]}>
      <Text style={[styles.text, { fontSize: size * 0.36 }]}>{initialsOf(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { color: colors.foreground, fontFamily: fonts.bold },
});
