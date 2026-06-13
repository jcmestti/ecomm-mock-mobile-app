# Northstar React Native mock store

Cross-platform Expo ecommerce demo with nine products, six customer-facing screens, cart state, and a GA4-style analytics data layer.

## Run

```bash
npm run start
npm run android
npm run web
npm run typecheck
npm run build:web
```

On Windows PowerShell systems with script execution disabled, use `npm.cmd` instead of `npm`.

## Analytics data layer

Events are published from `src/analytics/dataLayer.ts`. Every payload is:

- logged to the development console;
- appended to `globalThis.dataLayer` for inspection;
- retained in memory through `analytics.getHistory()`;
- sent to adapters registered with `analytics.subscribe(listener)`.

The app currently emits `screen_view`, `view_item_list`, `select_item`, `view_item`, `add_to_cart`, `remove_from_cart`, `view_cart`, `begin_checkout`, `add_shipping_info`, `add_payment_info`, and `purchase`.

Firebase and AppsFlyer integrations can subscribe without coupling SDK code to UI components:

```ts
const unsubscribe = analytics.subscribe(async (event) => {
  // Map and forward event to the SDK here.
});
```
# ecomm-mock-mobile-app
