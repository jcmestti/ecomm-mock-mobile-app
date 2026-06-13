import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { analytics, toAnalyticsItem } from '../analytics/dataLayer';
import { useScreenTracking } from '../analytics/useScreenTracking';
import { useCart } from '../cart/CartContext';
import { PrimaryButton } from '../components/Ui';
import { palette } from '../constants/theme';
import { findProduct } from '../data/products';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductDetails'>;

export function ProductDetailsScreen({ route, navigation }: Props) {
  const product = findProduct(route.params.productId);
  const { addItem } = useCart();
  const path = `/products/${route.params.productId}`;
  useScreenTracking('ProductDetails', 'product', path);
  useFocusEffect(useCallback(() => {
    if (product) analytics.push({ event: 'view_item', currency: 'USD', value: product.price, items: [toAnalyticsItem(product, 1, route.params.listName)] });
  }, [product, route.params.listName]));

  if (!product) return <View style={styles.missing}><Text>Product not found.</Text></View>;

  const addToCart = () => {
    addItem(product);
    analytics.push({ event: 'add_to_cart', currency: 'USD', value: product.price, items: [toAnalyticsItem(product, 1, route.params.listName)] });
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={[styles.art, { backgroundColor: product.color }]}><Text style={styles.symbol}>{product.symbol}</Text></View>
      <Text style={styles.category}>{product.category}</Text>
      <Text style={styles.title}>{product.name}</Text>
      <Text style={styles.price}>${product.price.toFixed(2)}</Text>
      <Text style={styles.description}>{product.description}</Text>
      <View style={styles.detailBox}>
        <Text style={styles.detailTitle}>Made for everyday adventure</Text>
        <Text style={styles.detailCopy}>Free standard shipping · 30-day returns · 1-year guarantee</Text>
      </View>
      <PrimaryButton label="Add to bag" onPress={addToCart} />
      <View style={styles.secondary}><PrimaryButton label="View bag" onPress={() => navigation.navigate('Cart')} /></View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 40 },
  art: { height: 320, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  symbol: { color: '#FFF9ED', fontSize: 44, fontWeight: '900', letterSpacing: 4 },
  category: { color: palette.accent, fontSize: 12, fontWeight: '900', letterSpacing: 1.4, textTransform: 'uppercase' },
  title: { color: palette.ink, fontSize: 34, fontWeight: '900', marginTop: 7 },
  price: { color: palette.green, fontSize: 22, fontWeight: '800', marginTop: 8 },
  description: { color: palette.muted, fontSize: 17, lineHeight: 26, marginTop: 18 },
  detailBox: { backgroundColor: palette.surface, borderRadius: 16, padding: 18, marginVertical: 24 },
  detailTitle: { color: palette.ink, fontSize: 15, fontWeight: '900' },
  detailCopy: { color: palette.muted, fontSize: 14, lineHeight: 21, marginTop: 7 },
  secondary: { marginTop: 10, opacity: 0.78 },
  missing: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
