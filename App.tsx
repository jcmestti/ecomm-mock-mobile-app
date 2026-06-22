import { createNavigationContainerRef, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef } from 'react';
import { Linking, Pressable, StyleSheet, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { CartProvider, useCart } from './src/cart/CartContext';
import { startAppsFlyerIntegration } from './src/analytics/appsFlyer';
import { OneLinkPayload, payloadFromUriSchemeUrl } from './src/analytics/oneLink';
import { palette } from './src/constants/theme';
import { CartScreen } from './src/screens/CartScreen';
import { CheckoutScreen } from './src/screens/CheckoutScreen';
import { ConfirmationScreen } from './src/screens/ConfirmationScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { ProductDetailsScreen } from './src/screens/ProductDetailsScreen';
import { ProductListScreen } from './src/screens/ProductListScreen';
import { RootStackParamList } from './src/types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();
const navigationRef = createNavigationContainerRef<RootStackParamList>();

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

function AppNavigator({ onReady }: { onReady: () => void }) {
  return (
    <NavigationContainer ref={navigationRef} onReady={onReady}>
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
        <AppLifecycle />
      </CartProvider>
    </SafeAreaProvider>
  );
}

function AppLifecycle() {
  const { applyDiscount } = useCart();
  const pendingProductId = useRef<string | undefined>(undefined);

  const openProduct = useCallback((productId: string) => {
    if (!navigationRef.isReady()) {
      pendingProductId.current = productId;
      return;
    }
    console.info('[OneLink] navigating to ProductDetails', productId);
    navigationRef.navigate('ProductDetails', { productId, listName: 'AppsFlyer OneLink' });
  }, []);

  const handleOneLink = useCallback((payload: OneLinkPayload) => {
    if (payload.coupon && payload.discountPercent) {
      applyDiscount({ coupon: payload.coupon, discountPercent: payload.discountPercent });
    }
    if (payload.productId) openProduct(payload.productId);
  }, [applyDiscount, openProduct]);

  useEffect(() => {
    // Starts the AppsFlyer lifecycle logger, OneLink listener, install/session measurement,
    // ATT flow, and ecommerce data-layer bridge once for the lifetime of the application.
    startAppsFlyerIntegration(handleOneLink);
  }, [handleOneLink]);

  useEffect(() => {
    const handleUrl = (url: string) => {
      const source = /^https:\/\/myecomm\.onelink\.me(?:\/|$)/i.test(url)
        ? 'App Link'
        : 'URI Scheme';
      const query = url.split('?')[1]?.split('#')[0] ?? '';
      const parameters = new URLSearchParams(query);
      const isAppsFlyerRetargetingUri = source === 'URI Scheme'
        && parameters.get('is_retargeting') === 'true'
        && parameters.get('media_source') === 'appsflyer_sdk_test_int'
        && Boolean(parameters.get('clickid'))
        && parameters.get('af_deeplink') === 'true';

      console.info(`[OneLink] ${source} open`, url);
      console.info('[OneLink] raw URL', url);
      if (isAppsFlyerRetargetingUri) {
        console.info('[OneLink] retargeting URI open (awaiting AppsFlyer UDL attribution)', {
          is_retargeting: parameters.get('is_retargeting'),
          media_source: parameters.get('media_source'),
          clickid: parameters.get('clickid'),
          af_deeplink: parameters.get('af_deeplink'),
        });
      }
      const payload = payloadFromUriSchemeUrl(url);
      console.info('[OneLink] parsed productId', payload.productId);
      console.info('[OneLink] parsed coupon', payload.coupon);
      handleOneLink(payload);
    };

    void Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    });
    const subscription = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => subscription.remove();
  }, [handleOneLink]);

  const handleNavigationReady = useCallback(() => {
    if (!pendingProductId.current) return;
    const productId = pendingProductId.current;
    pendingProductId.current = undefined;
    openProduct(productId);
  }, [openProduct]);

  return (
    <>
      <StatusBar style="dark" />
      <AppNavigator onReady={handleNavigationReady} />
    </>
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
