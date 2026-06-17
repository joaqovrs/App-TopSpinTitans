// Placeholder para pantallas todavia no construidas.
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fonts } from '@/lib/theme';

type Props = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
};

export function ComingSoon({ title, icon }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.center}>
        <Ionicons name={icon} size={48} color={colors.mutedForeground} />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>Proximamente</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  title: { color: colors.foreground, fontFamily: fonts.bold, fontSize: 20 },
  subtitle: { color: colors.mutedForeground, fontFamily: fonts.regular },
});
