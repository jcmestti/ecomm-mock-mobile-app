import { Platform } from 'react-native';
import { Product } from '../data/products';

export type EcommerceItem = {
  item_id: string;
  item_name: string;
  affiliation: string;
  coupon?: string;
  currency: 'USD';
  discount?: number;
  index?: number;
  item_brand: string;
  item_category: string;
  item_list_id?: string;
  item_list_name?: string;
  price: number;
  quantity: number;
};

export type AnalyticsEvent = {
  event: string;
  event_id: string;
  event_timestamp: string;
  platform: string;
  [key: string]: unknown;
};

type Listener = (event: AnalyticsEvent) => void | Promise<void>;
type AnalyticsEventInput = { event: string; [key: string]: unknown };

class AnalyticsDataLayer {
  private listeners = new Set<Listener>();
  private history: AnalyticsEvent[] = [];

  push(event: AnalyticsEventInput) {
    const enriched: AnalyticsEvent = {
      ...event,
      event_id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      event_timestamp: new Date().toISOString(),
      platform: Platform.OS,
    };
    this.history.push(enriched);
    (globalThis as typeof globalThis & { dataLayer?: AnalyticsEvent[] }).dataLayer ??= [];
    (globalThis as typeof globalThis & { dataLayer: AnalyticsEvent[] }).dataLayer.push(enriched);
    console.info('[dataLayer]', JSON.stringify(enriched, null, 2));
    this.listeners.forEach((listener) => void listener(enriched));
    return enriched;
  }

  subscribe(listener: Listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getHistory() {
    return [...this.history];
  }
}

export const analytics = new AnalyticsDataLayer();

export const toAnalyticsItem = (
  product: Product,
  quantity = 1,
  listName?: string,
  index?: number,
): EcommerceItem => ({
  item_id: product.id,
  item_name: product.name,
  affiliation: 'Northstar Mock Store',
  currency: 'USD',
  item_brand: product.brand,
  item_category: product.category,
  item_list_id: listName ? listName.toLowerCase().replace(/\s+/g, '_') : undefined,
  item_list_name: listName,
  index,
  price: product.price,
  quantity,
});

export const ecommerceValue = (items: EcommerceItem[]) =>
  Number(items.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2));
