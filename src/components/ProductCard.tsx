import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Product } from '../data/products';
import { palette } from '../constants/theme';

export function ProductCard({ product, onPress }: { product: Product; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={[styles.art, { backgroundColor: product.color }]}>
        <Text style={styles.symbol}>{product.symbol}</Text>
      </View>
      <Text style={styles.category}>{product.category}</Text>
      <Text style={styles.name} numberOfLines={1}>{product.name}</Text>
      <Text style={styles.price}>${product.price.toFixed(2)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { width: '48%', marginBottom: 22 },
  pressed: { opacity: 0.72 },
  art: { height: 160, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  symbol: { color: '#FFF9ED', fontSize: 24, fontWeight: '900', letterSpacing: 2 },
  category: { color: palette.muted, fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  name: { color: palette.ink, fontSize: 16, fontWeight: '800', marginTop: 4 },
  price: { color: palette.green, fontSize: 15, fontWeight: '700', marginTop: 5 },
});
