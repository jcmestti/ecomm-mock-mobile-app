import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { analytics, toAnalyticsItem } from '../analytics/dataLayer';
import { useScreenTracking } from '../analytics/useScreenTracking';
import { ProductCard } from '../components/ProductCard';
import { palette } from '../constants/theme';
import { products } from '../data/products';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Products'>;
const listName = 'All products';

export function ProductListScreen({ navigation }: Props) {
  useScreenTracking('ProductList', 'listing', '/products');
  useFocusEffect(useCallback(() => {
    analytics.push({
      event: 'view_item_list', item_list_id: 'all_products', item_list_name: listName,
      items: products.map((product, index) => toAnalyticsItem(product, 1, listName, index)),
    });
  }, []));

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.kicker}>THE COMPLETE COLLECTION</Text>
      <Text style={styles.title}>Built to be used.</Text>
      <Text style={styles.copy}>Nine practical pieces, designed with durable materials and uncomplicated details.</Text>
      <View style={styles.grid}>
        {products.map((product, index) => (
          <ProductCard key={product.id} product={product} onPress={() => {
            analytics.push({ event: 'select_item', item_list_id: 'all_products', item_list_name: listName, items: [toAnalyticsItem(product, 1, listName, index)] });
            navigation.navigate('ProductDetails', { productId: product.id, listName });
          }} />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 40 },
  kicker: { color: palette.accent, fontSize: 11, fontWeight: '900', letterSpacing: 1.4 },
  title: { color: palette.ink, fontSize: 34, fontWeight: '900', marginTop: 8 },
  copy: { color: palette.muted, fontSize: 16, lineHeight: 23, marginTop: 8, marginBottom: 28, maxWidth: 500 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
});
