import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { analytics, toAnalyticsItem } from '../analytics/dataLayer';
import { useScreenTracking } from '../analytics/useScreenTracking';
import { ProductCard } from '../components/ProductCard';
import { PrimaryButton } from '../components/Ui';
import { palette } from '../constants/theme';
import { products } from '../data/products';
import { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;
const featured = products.slice(0, 4);
const listName = 'Home featured products';

export function HomeScreen({ navigation }: Props) {
  useScreenTracking('Home', 'home', '/');

  const openProduct = (productId: string, index: number) => {
    const product = products.find((item) => item.id === productId)!;
    const item = toAnalyticsItem(product, 1, listName, index);
    analytics.push({ event: 'select_item', item_list_id: 'home_featured_products', item_list_name: listName, items: [item] });
    navigation.navigate('ProductDetails', { productId, listName });
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>ESSENTIALS FOR THE OPEN ROAD</Text>
        <Text style={styles.heroTitle}>Pack less. Go further.</Text>
        <Text style={styles.heroCopy}>Thoughtful everyday gear made for weekends out and days in.</Text>
        <View style={styles.heroButton}><PrimaryButton label="Shop all 9 products" onPress={() => navigation.navigate('Products')} /></View>
      </View>
      <View style={styles.headingRow}>
        <Text style={styles.heading}>Featured gear</Text>
        <Text style={styles.count}>4 picks</Text>
      </View>
      <View style={styles.grid}>
        {featured.map((product, index) => <ProductCard key={product.id} product={product} onPress={() => openProduct(product.id, index)} />)}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 18, paddingBottom: 40 },
  hero: { backgroundColor: palette.green, borderRadius: 24, padding: 26, marginBottom: 30 },
  eyebrow: { color: '#BAD3C8', fontWeight: '800', fontSize: 11, letterSpacing: 1.4 },
  heroTitle: { color: '#FFFDF8', fontSize: 38, lineHeight: 42, fontWeight: '900', marginTop: 14, maxWidth: 300 },
  heroCopy: { color: '#D8E4DE', fontSize: 16, lineHeight: 23, marginTop: 12, maxWidth: 340 },
  heroButton: { marginTop: 22, maxWidth: 240 },
  headingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 },
  heading: { color: palette.ink, fontSize: 25, fontWeight: '900' },
  count: { color: palette.muted, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
});
