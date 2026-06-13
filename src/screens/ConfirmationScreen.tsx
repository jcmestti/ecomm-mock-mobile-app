import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { StyleSheet, Text, View } from 'react-native';
import { useScreenTracking } from '../analytics/useScreenTracking';
import { PrimaryButton } from '../components/Ui';
import { palette } from '../constants/theme';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Confirmation'>;

export function ConfirmationScreen({ route, navigation }: Props) {
  useScreenTracking('PurchaseConfirmation', 'confirmation', `/order/${route.params.transactionId}/confirmation`);
  return (
    <View style={styles.container}>
      <View style={styles.check}><Text style={styles.checkText}>✓</Text></View>
      <Text style={styles.kicker}>ORDER CONFIRMED</Text>
      <Text style={styles.title}>Thanks for your order.</Text>
      <Text style={styles.copy}>Your mock purchase is complete. A confirmation would normally be sent to your email.</Text>
      <View style={styles.orderBox}>
        <Text style={styles.orderLabel}>Order number</Text>
        <Text style={styles.orderId}>{route.params.transactionId}</Text>
      </View>
      <View style={styles.button}><PrimaryButton label="Continue shopping" onPress={() => navigation.popToTop()} /></View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: palette.background },
  check: { width: 76, height: 76, borderRadius: 38, backgroundColor: palette.success, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  checkText: { color: '#fff', fontSize: 38, fontWeight: '900' },
  kicker: { color: palette.success, fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
  title: { color: palette.ink, fontSize: 32, lineHeight: 38, fontWeight: '900', textAlign: 'center', marginTop: 10 },
  copy: { color: palette.muted, fontSize: 16, lineHeight: 24, textAlign: 'center', maxWidth: 420, marginTop: 12 },
  orderBox: { width: '100%', maxWidth: 390, backgroundColor: palette.surface, borderRadius: 16, alignItems: 'center', padding: 20, marginTop: 26 },
  orderLabel: { color: palette.muted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  orderId: { color: palette.ink, fontSize: 20, fontWeight: '900', marginTop: 6 },
  button: { width: '100%', maxWidth: 390, marginTop: 20 },
});
