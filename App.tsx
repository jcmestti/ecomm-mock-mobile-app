import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { CartProvider, useCart } from './src/cart/CartContext';
import { palette } from './src/constants/theme';
import { CartScreen } from './src/screens/CartScreen';
import { CheckoutScreen } from './src/screens/CheckoutScreen';
import { ConfirmationScreen } from './src/screens/ConfirmationScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { ProductDetailsScreen } from './src/screens/ProductDetailsScreen';
import { ProductListScreen } from './src/screens/ProductListScreen';
import { RootStackParamList } from './src/types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();

function CartButton({ navigation }: { navigation: any }) {
  const { totalQuantity } = useCart();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Cart with ${totalQuantity} items`}
      onPress={() => navigation.navigate('Cart')}
      style={styles.cartButton}
    >
      <Text style={styles.cartIcon}>Bag</Text>
      {totalQuantity > 0 && <Text style={styles.badge}>{totalQuantity}</Text>}
    </Pressable>
  );
}

function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={({ navigation }) => ({
          headerStyle: { backgroundColor: palette.surface },
          headerShadowVisible: false,
          headerTintColor: palette.ink,
          headerTitleStyle: { fontWeight: '800' },
          contentStyle: { backgroundColor: palette.background },
          headerRight: () => <CartButton navigation={navigation} />,
        })}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Northstar' }} />
        <Stack.Screen name="Products" component={ProductListScreen} options={{ title: 'All products' }} />
        <Stack.Screen name="ProductDetails" component={ProductDetailsScreen} options={{ title: 'Product details' }} />
        <Stack.Screen name="Cart" component={CartScreen} options={{ title: 'Your bag', headerRight: () => null }} />
        <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: 'Checkout', headerRight: () => null }} />
        <Stack.Screen
          name="Confirmation"
          component={ConfirmationScreen}
          options={{ title: 'Order confirmed', headerBackVisible: false, headerRight: () => null }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <CartProvider>
        <StatusBar style="dark" />
        <AppNavigator />
      </CartProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  cartButton: { paddingHorizontal: 8, paddingVertical: 6, position: 'relative' },
  cartIcon: { color: palette.ink, fontSize: 15, fontWeight: '800' },
  badge: {
    position: 'absolute', right: -3, top: -3, minWidth: 18, height: 18,
    borderRadius: 9, overflow: 'hidden', backgroundColor: palette.accent,
    color: '#fff', fontSize: 11, fontWeight: '800', textAlign: 'center', lineHeight: 18,
  },
});
