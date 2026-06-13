import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { palette } from '../constants/theme';

export function PrimaryButton({ label, onPress, disabled = false }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.primary, disabled && styles.disabled, pressed && styles.pressed]}>
      <Text style={styles.primaryText}>{label}</Text>
    </Pressable>
  );
}

export function PriceRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowText, strong && styles.strong]}>{label}</Text>
      <Text style={[styles.rowText, strong && styles.strong]}>{value}</Text>
    </View>
  );
}

export function Page({ children }: { children: ReactNode }) {
  return <View style={styles.page}>{children}</View>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: palette.background },
  primary: { minHeight: 54, borderRadius: 14, backgroundColor: palette.accent, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  primaryText: { color: '#fff', fontSize: 16, fontWeight: '900' },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7 },
  rowText: { color: palette.muted, fontSize: 15 },
  strong: { color: palette.ink, fontWeight: '900', fontSize: 18 },
});
