import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { analytics, ecommerceValue, toAnalyticsItem } from '../analytics/dataLayer';
import { useScreenTracking } from '../analytics/useScreenTracking';
import { useCart } from '../cart/CartContext';
import { PriceRow, PrimaryButton } from '../components/Ui';
import { palette } from '../constants/theme';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Cart'>;

export function CartScreen({ navigation }: Props) {
  const { items, subtotal, setQuantity, removeItem } = useCart();
  const analyticsItems = items.map(({ product, quantity }) => toAnalyticsItem(product, quantity));
  useScreenTracking('Cart', 'cart', '/cart');
  useFocusEffect(useCallback(() => {
    analytics.push({ event: 'view_cart', currency: 'USD', value: ecommerceValue(analyticsItems), items: analyticsItems });
  }, [items]));

  const remove = (productId: string) => {
    const item = items.find(({ product }) => product.id === productId);
    if (!item) return;
    analytics.push({ event: 'remove_from_cart', currency: 'USD', value: item.product.price * item.quantity, items: [toAnalyticsItem(item.product, item.quantity)] });
    removeItem(productId);
  };

  if (!items.length) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>Your bag is ready for an adventure.</Text>
        <Text style={styles.emptyCopy}>It is empty right now. Explore all nine products to find something useful.</Text>
        <View style={styles.emptyButton}><PrimaryButton label="Browse products" onPress={() => navigation.navigate('Products')} /></View>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {items.map(({ product, quantity }) => (
        <View key={product.id} style={styles.item}>
          <View style={[styles.thumb, { backgroundColor: product.color }]}><Text style={styles.symbol}>{product.symbol}</Text></View>
          <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{product.name}</Text>
            <Text style={styles.itemPrice}>${product.price.toFixed(2)}</Text>
            <View style={styles.controls}>
              <Pressable style={styles.qtyButton} onPress={() => setQuantity(product.id, quantity - 1)}><Text style={styles.qtyText}>−</Text></Pressable>
              <Text style={styles.quantity}>{quantity}</Text>
              <Pressable style={styles.qtyButton} onPress={() => setQuantity(product.id, quantity + 1)}><Text style={styles.qtyText}>+</Text></Pressable>
              <Pressable onPress={() => remove(product.id)}><Text style={styles.remove}>Remove</Text></Pressable>
            </View>
          </View>
        </View>
      ))}
      <View style={styles.summary}>
        <PriceRow label="Subtotal" value={`$${subtotal.toFixed(2)}`} />
        <PriceRow label="Shipping" value="Free" />
        <View style={styles.rule} />
        <PriceRow label="Estimated total" value={`$${subtotal.toFixed(2)}`} strong />
      </View>
      <PrimaryButton label="Continue to checkout" onPress={() => navigation.navigate('Checkout')} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 40 },
  item: { flexDirection: 'row', backgroundColor: palette.surface, borderRadius: 18, padding: 12, marginBottom: 12 },
  thumb: { width: 92, height: 92, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  symbol: { color: '#FFF9ED', fontWeight: '900', letterSpacing: 1 },
  itemInfo: { flex: 1, paddingLeft: 14 },
  itemName: { color: palette.ink, fontSize: 17, fontWeight: '900' },
  itemPrice: { color: palette.green, fontSize: 15, fontWeight: '700', marginTop: 4 },
  controls: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 9 },
  qtyButton: { width: 28, height: 28, borderRadius: 8, backgroundColor: palette.background, alignItems: 'center', justifyContent: 'center' },
  qtyText: { color: palette.ink, fontSize: 17, fontWeight: '800' },
  quantity: { minWidth: 16, textAlign: 'center', fontWeight: '800' },
  remove: { color: palette.accent, fontSize: 13, fontWeight: '700', marginLeft: 8 },
  summary: { backgroundColor: palette.surface, padding: 18, borderRadius: 18, marginVertical: 20 },
  rule: { height: 1, backgroundColor: palette.line, marginVertical: 10 },
  empty: { flex: 1, padding: 30, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { color: palette.ink, fontSize: 28, lineHeight: 34, fontWeight: '900', textAlign: 'center' },
  emptyCopy: { color: palette.muted, fontSize: 16, lineHeight: 23, textAlign: 'center', marginTop: 12, maxWidth: 400 },
  emptyButton: { marginTop: 24, width: '100%', maxWidth: 280 },
});
