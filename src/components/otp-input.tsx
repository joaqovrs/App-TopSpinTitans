// Input de codigo de 6 digitos: 6 casillas visuales sobre un TextInput oculto.
import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, fonts } from '@/lib/theme';

const LENGTH = 6;

export function OtpInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);

  const digits = value.split('');

  return (
    <Pressable style={styles.row} onPress={() => inputRef.current?.focus()}>
      {Array.from({ length: LENGTH }).map((_, i) => {
        const active = focused && i === value.length;
        return (
          <View key={i} style={[styles.box, active && styles.boxActive]}>
            <Text style={styles.digit}>{digits[i] ?? ''}</Text>
          </View>
        );
      })}

      <TextInput
        ref={inputRef}
        style={styles.hidden}
        value={value}
        onChangeText={(t) => onChange(t.replace(/[^0-9]/g, '').slice(0, LENGTH))}
        keyboardType="number-pad"
        maxLength={LENGTH}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  box: {
    flex: 1,
    aspectRatio: 0.85,
    maxWidth: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxActive: { borderColor: colors.primary },
  digit: { color: colors.foreground, fontFamily: fonts.bold, fontSize: 22 },
  hidden: { position: 'absolute', opacity: 0, width: 1, height: 1 },
});
