// Numero que "cuenta" desde 0 (o desde el valor anterior) hasta el valor dado.
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, type StyleProp, type TextStyle, Text } from 'react-native';

export function CountUp({
  value,
  duration = 700,
  suffix = '',
  style,
}: {
  value: number;
  duration?: number;
  suffix?: string;
  style?: StyleProp<TextStyle>;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const id = anim.addListener(({ value: v }) => setDisplay(Math.round(v)));
    Animated.timing(anim, {
      toValue: value,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
    return () => anim.removeListener(id);
  }, [value, duration, anim]);

  return <Text style={style}>{display}{suffix}</Text>;
}
