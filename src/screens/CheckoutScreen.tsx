import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { analytics, ecommerceValue, toAnalyticsItem } from '../analytics/dataLayer';
import { useScreenTracking } from '../analytics/useScreenTracking';
import { useCart } from '../cart/CartContext';
import { PriceRow, PrimaryButton } from '../components/Ui';
import { palette } from '../constants/theme';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Checkout'>;

export function CheckoutScreen({ navigation }: Props) {
  const { items, subtotal, clearCart, discount } = useCart();
  const [email, setEmail] = useState('alex@example.com');
  const [address, setAddress] = useState('125 Market Street');
  const [shipping, setShipping] = useState<'standard' | 'express'>('standard');
  const discountAmount = Number((subtotal * (discount?.discountPercent ?? 0) / 100).toFixed(2));
  const discountedSubtotal = Number((subtotal - discountAmount).toFixed(2));
  const analyticsItems = items.map(({ product, quantity }) => ({
    ...toAnalyticsItem(product, quantity),
    coupon: discount?.coupon,
    discount: discount ? Number((product.price * discount.discountPercent / 100).toFixed(2)) : undefined,
    price: discount ? Number((product.price * (1 - discount.discountPercent / 100)).toFixed(2)) : product.price,
  }));
  const shippingCost = shipping === 'express' ? 12 : 0;
  const total = discountedSubtotal + shippingCost;
  useScreenTracking('Checkout', 'checkout', '/checkout');
  useFocusEffect(useCallback(() => {
    analytics.push({ event: 'begin_checkout', currency: 'USD', value: ecommerceValue(analyticsItems), coupon: discount?.coupon, items: analyticsItems });
  }, [analyticsItems, discount?.coupon]));

  const placeOrder = () => {
    const transactionId = `NS-${Date.now().toString().slice(-8)}`;
    analytics.push({ event: 'add_shipping_info', currency: 'USD', value: total, shipping_tier: shipping, items: analyticsItems });
    analytics.push({ event: 'add_payment_info', currency: 'USD', value: total, payment_type: 'mock_card', items: analyticsItems });
    analytics.push({
      event: 'purchase', transaction_id: transactionId, affiliation: 'Northstar Mock Store',
      currency: 'USD', value: total, tax: 0, shipping: shippingCost, coupon: discount?.coupon, items: analyticsItems,
    });
    clearCart();
    navigation.replace('Confirmation', { transactionId });
  };

  if (!items.length) return <View style={styles.empty}><Text style={styles.title}>Your bag is empty.</Text><PrimaryButton label="Return to products" onPress={() => navigation.navigate('Products')} /></View>;

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.sectionTitle}>Contact & delivery</Text>
      <Text style={styles.label}>Email</Text>
      <TextInput style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <Text style={styles.label}>Shipping address</Text>
      <TextInput style={styles.input} value={address} onChangeText={setAddress} />

      <Text style={styles.sectionTitle}>Shipping method</Text>
      <Pressable onPress={() => setShipping('standard')} style={[styles.option, shipping === 'standard' && styles.selected]}>
        <View><Text style={styles.optionTitle}>Standard delivery</Text><Text style={styles.optionCopy}>3–5 business days</Text></View><Text style={styles.optionPrice}>Free</Text>
      </Pressable>
      <Pressable onPress={() => setShipping('express')} style={[styles.option, shipping === 'express' && styles.selected]}>
        <View><Text style={styles.optionTitle}>Express delivery</Text><Text style={styles.optionCopy}>1–2 business days</Text></View><Text style={styles.optionPrice}>$12.00</Text>
      </Pressable>

      <Text style={styles.sectionTitle}>Payment</Text>
      <View style={styles.payment}><Text style={styles.card}>VISA</Text><Text style={styles.paymentCopy}>Mock card ending in 4242</Text></View>

      <View style={styles.summary}>
        <PriceRow label="Subtotal" value={`$${subtotal.toFixed(2)}`} />
        {discount && <PriceRow label={`${discount.coupon} (${discount.discountPercent}% off)`} value={`-$${discountAmount.toFixed(2)}`} />}
        <PriceRow label="Shipping" value={shippingCost ? `$${shippingCost.toFixed(2)}` : 'Free'} />
        <View style={styles.rule} />
        <PriceRow label="Total" value={`$${total.toFixed(2)}`} strong />
      </View>
      <PrimaryButton label={`Place mock order · $${total.toFixed(2)}`} onPress={placeOrder} disabled={!email.trim() || !address.trim()} />
      <Text style={styles.disclaimer}>This is a demo checkout. No payment will be processed.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 40 },
  sectionTitle: { color: palette.ink, fontSize: 21, fontWeight: '900', marginTop: 10, marginBottom: 14 },
  label: { color: palette.muted, fontSize: 12, fontWeight: '800', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8 },
  input: { backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line, borderRadius: 12, padding: 15, fontSize: 16, color: palette.ink, marginBottom: 14 },
  option: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: palette.surface, borderWidth: 2, borderColor: 'transparent', borderRadius: 14, padding: 16, marginBottom: 10 },
  selected: { borderColor: palette.green },
  optionTitle: { color: palette.ink, fontSize: 15, fontWeight: '900' },
  optionCopy: { color: palette.muted, marginTop: 3 },
  optionPrice: { color: palette.green, fontWeight: '900' },
  payment: { flexDirection: 'row', alignItems: 'center', backgroundColor: palette.surface, borderRadius: 14, padding: 16 },
  card: { backgroundColor: '#223C91', color: '#fff', fontSize: 11, fontWeight: '900', padding: 8, borderRadius: 5, overflow: 'hidden' },
  paymentCopy: { color: palette.ink, fontWeight: '700', marginLeft: 12 },
  summary: { backgroundColor: palette.surface, padding: 18, borderRadius: 18, marginVertical: 22 },
  rule: { height: 1, backgroundColor: palette.line, marginVertical: 10 },
  disclaimer: { color: palette.muted, textAlign: 'center', fontSize: 12, marginTop: 12 },
  empty: { flex: 1, justifyContent: 'center', padding: 28, gap: 20 },
  title: { color: palette.ink, fontSize: 28, fontWeight: '900', textAlign: 'center' },
});
