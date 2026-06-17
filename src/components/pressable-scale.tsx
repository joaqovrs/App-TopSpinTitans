// Pressable que se "hunde" un toque al presionar (escala). Da feedback tactil.
// Drop-in para botones/tarjetas (estilo objeto/array, no funcion).
import { useRef } from 'react';
import {
  Animated,
  Pressable,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

type Props = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  /** Cuanto se achica al presionar (0.96 por defecto). */
  to?: number;
};

export function PressableScale({ style, to = 0.96, children, onPressIn, onPressOut, ...rest }: Props) {
  const scale = useRef(new Animated.Value(1)).current;

  function pressIn(e: GestureResponderEvent) {
    Animated.spring(scale, { toValue: to, useNativeDriver: true, speed: 40, bounciness: 0 }).start();
    onPressIn?.(e);
  }
  function pressOut(e: GestureResponderEvent) {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 8 }).start();
    onPressOut?.(e);
  }

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable style={style} onPressIn={pressIn} onPressOut={pressOut} {...rest}>
        {children as React.ReactNode}
      </Pressable>
    </Animated.View>
  );
}
