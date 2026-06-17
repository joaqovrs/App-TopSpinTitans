// Selector de puntaje: botones - / + grandes (hitbox comodo) y ademas se puede
// ESCRIBIR el numero a mano (teclado). Pensado para los puntajes de los sets.
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { colors, fonts } from '@/lib/theme';

type Props = {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
};

export function Stepper({ value, onChange, min = 0, max = 99 }: Props) {
  // Texto local para poder borrar/escribir comodo sin que "salte" a 0.
  const [text, setText] = useState(String(value));
  useEffect(() => {
    setText(String(value));
  }, [value]);

  function onText(t: string) {
    const digits = t.replace(/[^0-9]/g, '').slice(0, 2);
    setText(digits);
    const n = digits === '' ? min : Math.min(max, Math.max(min, parseInt(digits, 10)));
    onChange(n);
  }

  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));

  return (
    <View style={styles.box}>
      <Pressable style={styles.btn} hitSlop={8} onPress={dec}>
        <Ionicons name="remove" size={20} color={colors.foreground} />
      </Pressable>
      <TextInput
        style={styles.value}
        value={text}
        onChangeText={onText}
        keyboardType="number-pad"
        maxLength={2}
        selectTextOnFocus
        returnKeyType="done"
      />
      <Pressable style={styles.btn} hitSlop={8} onPress={inc}>
        <Ionicons name="add" size={20} color={colors.foreground} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 4,
  },
  btn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  value: {
    flex: 1,
    textAlign: 'center',
    color: colors.foreground,
    fontFamily: fonts.bold,
    fontSize: 18,
    padding: 0,
    marginHorizontal: 2,
  },
});
