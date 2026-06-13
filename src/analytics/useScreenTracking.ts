import { useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { analytics } from './dataLayer';

type ScreenType = 'home' | 'listing' | 'product' | 'cart' | 'checkout' | 'confirmation';

export function useScreenTracking(screenName: string, screenType: ScreenType, path: string) {
  useFocusEffect(
    useCallback(() => {
      analytics.push({
        event: 'screen_view',
        screen_name: screenName,
        firebase_screen: screenName,
        screen_class: `${screenName}Screen`,
        screen_url: `northstar://shop${path}`,
        screen_path: path,
        screen_type: screenType,
        is_home_screen: screenType === 'home',
        is_listing_screen: screenType === 'listing',
        is_product_screen: screenType === 'product',
        is_cart_screen: screenType === 'cart',
        is_checkout_screen: screenType === 'checkout',
        is_confirmation_screen: screenType === 'confirmation',
      });
    }, [path, screenName, screenType]),
  );
}
