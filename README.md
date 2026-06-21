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

## AppsFlyer

The native AppsFlyer SDK is initialized in `src/analytics/appsFlyer.ts` with debug logging enabled. SDK initialization automatically records the install/launch; the app does not send a duplicate custom install event.

Copy `.env.example` to `.env` and replace the placeholder AppsFlyer values:

```bash
EXPO_PUBLIC_APPSFLYER_DEV_KEY=your_appsflyer_dev_key
EXPO_PUBLIC_APPSFLYER_IOS_APP_ID=1234567890
```

On iOS, initialization waits up to 10 seconds for ATT and the app calls Apple's authorization prompt through `requestTrackingPermissionsAsync`. Ecommerce events are forwarded from the shared data layer to AppsFlyer.

All integration actions use structured `[AppsFlyer]` console logs. These include listener registration, native SDK version, initialization options and result, ATT request and status, explicit SDK start, install/conversion callbacks, data-layer mapping decisions, and in-app event request/success/failure states. Credentials are masked in logs. Native AppsFlyer debug logging is also enabled with `isDebug: true`.

AppsFlyer contains native code and is not available in Expo Go. Build a development client after changing native configuration:

```bash
npx expo run:android
npx expo run:ios
```
# ecomm-mock-mobile-app
