import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import { AppState, AppStateStatus, Platform } from 'react-native';
import appsFlyer, { ConversionData, UnifiedDeepLinkData } from 'react-native-appsflyer';

import { AnalyticsEvent, EcommerceItem, analytics } from './dataLayer';
import { discountFromDeepLinkSub1, OneLinkPayload, productIdFromDeepLinkValue } from './oneLink';

const APPSFLYER_DEV_KEY = process.env.EXPO_PUBLIC_APPSFLYER_DEV_KEY;
const APPSFLYER_IOS_APP_ID = process.env.EXPO_PUBLIC_APPSFLYER_IOS_APP_ID ?? '1234567890';
const ATT_WAIT_SECONDS = 10;

// GA4-style data-layer names are translated into AppsFlyer standard event names
// where AppsFlyer provides one. Unsupported ecommerce steps keep descriptive custom names.
const EVENT_NAMES: Record<string, string> = {
  view_item_list: 'af_list_view',
  select_item: 'select_item',
  view_item: 'af_content_view',
  add_to_cart: 'af_add_to_cart',
  remove_from_cart: 'remove_from_cart',
  view_cart: 'view_cart',
  begin_checkout: 'af_initiated_checkout',
  add_shipping_info: 'add_shipping_info',
  add_payment_info: 'af_add_payment_info',
  purchase: 'af_purchase',
};

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

let initialization: Promise<boolean> | undefined;
let unsubscribeFromDataLayer: (() => void) | undefined;
let removeInstallListener: (() => void) | undefined;
let removeInstallFailureListener: (() => void) | undefined;
let removeAppStateListener: (() => void) | undefined;
let removeDeepLinkListener: (() => void) | undefined;
let onOneLinkResolved: ((payload: OneLinkPayload) => void) | undefined;

// All integration messages use one structured format so native logs can be filtered
// by "[AppsFlyer]" and correlated using the ISO timestamp and action fields.
function logAppsFlyer(level: LogLevel, action: string, status: string, details?: unknown) {
  const message = {
    sdk: 'AppsFlyer',
    timestamp: new Date().toISOString(),
    platform: Platform.OS,
    action,
    status,
    details,
  };

  if (level === 'error') console.error('[AppsFlyer]', message);
  else if (level === 'warn') console.warn('[AppsFlyer]', message);
  else if (level === 'debug') console.debug('[AppsFlyer]', message);
  else console.info('[AppsFlyer]', message);
}

// Credentials are masked before logging to confirm configuration without exposing secrets.
function maskCredential(value: string) {
  if (value.startsWith('YOUR_')) return value;
  if (value.length <= 6) return '***';
  return `${value.slice(0, 3)}***${value.slice(-3)}`;
}

function getItems(event: AnalyticsEvent) {
  return Array.isArray(event.items) ? event.items as EcommerceItem[] : [];
}

function handleOneLinkData(data: Record<string, unknown>, isDeferred: boolean, source: 'unified_deep_link' | 'conversion_data') {
  const productId = productIdFromDeepLinkValue(data.deep_link_value);
  const discount = discountFromDeepLinkSub1(data.deep_link_sub1);

  console.info('[OneLink] parsed productId', productId);
  console.info('[OneLink] parsed coupon', discount?.coupon);

  if (!productId && !discount) {
    logAppsFlyer('debug', 'one_link', 'ignored', { source, isDeferred, reason: 'No supported product or coupon parameter.' });
    return;
  }

  const payload: OneLinkPayload = { productId, ...discount, isDeferred };
  logAppsFlyer('info', 'one_link', 'resolved', { source, ...payload });
  onOneLinkResolved?.(payload);
}

// Converts the shared ecommerce schema to AppsFlyer's recommended af_* parameters.
// The complete item collection is retained in af_content_list for downstream inspection.
function mapEvent(event: AnalyticsEvent) {
  const eventName = EVENT_NAMES[event.event];
  if (!eventName) return null;

  const items = getItems(event);
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const contentIds = items.map((item) => item.item_id);
  const categories = [...new Set(items.map((item) => item.item_category))];
  const parameters: Record<string, unknown> = {
    af_currency: event.currency ?? 'USD',
    af_content_id: contentIds.length === 1 ? contentIds[0] : contentIds,
    af_content_type: categories.length === 1 ? categories[0] : categories,
    af_content_list: items,
    af_quantity: totalQuantity,
    af_price: items.length === 1 ? items[0].price : undefined,
    item_list_id: event.item_list_id,
    item_list_name: event.item_list_name,
    shipping_tier: event.shipping_tier,
    payment_type: event.payment_type,
    event_id: event.event_id,
  };

  // Revenue is sent only on purchase to avoid reporting the same revenue at earlier funnel steps.
  if (event.event === 'purchase') {
    parameters.af_revenue = event.value;
    parameters.af_order_id = event.transaction_id;
    parameters.af_coupon_code = event.coupon;
    parameters.shipping = event.shipping;
    parameters.tax = event.tax;
  } else {
    parameters.total_value = event.value;
  }

  return {
    eventName,
    parameters: Object.fromEntries(
      Object.entries(parameters).filter(([, value]) => value !== undefined && value !== ''),
    ),
  };
}

// Registers install/conversion callbacks before SDK initialization so the first launch
// response cannot be missed. AppsFlyer owns the actual install event; no duplicate custom
// "install" in-app event is sent by this application.
function registerInstallListeners() {
  if (!removeInstallListener) {
    removeInstallListener = appsFlyer.onInstallConversionData((conversion: ConversionData) => {
      const isFirstLaunch = conversion.data?.is_first_launch === 'true';
      logAppsFlyer('info', isFirstLaunch ? 'install' : 'conversion_data', 'received', {
        isFirstLaunch,
        attributionStatus: conversion.data?.af_status,
        mediaSource: conversion.data?.media_source,
        campaign: conversion.data?.campaign,
        callbackStatus: conversion.status,
        callbackType: conversion.type,
        raw: conversion.data,
      });
      if (isFirstLaunch) handleOneLinkData(conversion.data, true, 'conversion_data');
    });
    logAppsFlyer('debug', 'install_listener', 'registered');
  }

  if (!removeInstallFailureListener) {
    removeInstallFailureListener = appsFlyer.onInstallConversionFailure((failure: ConversionData) => {
      logAppsFlyer('error', 'install', 'conversion_data_failed', failure);
    });
    logAppsFlyer('debug', 'install_failure_listener', 'registered');
  }
}

function registerDeepLinkListener() {
  if (removeDeepLinkListener) return;

  removeDeepLinkListener = appsFlyer.onDeepLink((deepLink: UnifiedDeepLinkData) => {
    console.info('[OneLink] AppsFlyer UDL open', deepLink);
    console.info('[OneLink] raw AppsFlyer payload', deepLink);
    console.info('[OneLink] AppsFlyer UDL result', {
      status: deepLink.status,
      deepLinkStatus: deepLink.deepLinkStatus,
      isDeferred: deepLink.isDeferred,
      data: deepLink.data,
    });
    if (deepLink.deepLinkStatus !== 'FOUND') {
      const level: LogLevel = deepLink.deepLinkStatus === 'ERROR' ? 'error' : 'debug';
      logAppsFlyer(level, 'one_link', 'not_resolved', {
        callbackStatus: deepLink.status,
        deepLinkStatus: deepLink.deepLinkStatus,
        isDeferred: deepLink.isDeferred,
        raw: deepLink,
      });
      return;
    }
    // This OneLink route handles an installed-app re-engagement; install attribution
    // remains covered by the conversion-data listener above.
    handleOneLinkData(deepLink.data, false, 'unified_deep_link');
  });
  logAppsFlyer('debug', 'one_link_listener', 'registered');
}

// Reads the native SDK version for diagnostics. This callback does not start tracking
// or transmit an event; it only reports which native AppsFlyer binary is loaded.
function logSdkVersion() {
  logAppsFlyer('debug', 'get_sdk_version', 'requested');
  appsFlyer.getSDKVersion((error, version) => {
    if (error) logAppsFlyer('error', 'get_sdk_version', 'failed', error);
    else logAppsFlyer('info', 'get_sdk_version', 'succeeded', { version });
  });
}

// AppsFlyer observes native app foreground transitions and decides whether a new session
// should be recorded according to its minimum time-between-sessions setting. The SDK does
// not expose a JavaScript callback for the resulting automatic session event, so these app
// lifecycle logs show when that native session evaluation is expected to occur.
function registerSessionLifecycleLogging() {
  if (removeAppStateListener) return;

  const logState = (state: AppStateStatus) => {
    logAppsFlyer('info', 'app_lifecycle', state, {
      appsFlyerBehavior: state === 'active'
        ? 'The native SDK evaluates and automatically records a launch/session when eligible.'
        : 'The native SDK observes the app leaving the foreground.',
    });
  };

  logState(AppState.currentState);
  const subscription = AppState.addEventListener('change', logState);
  removeAppStateListener = () => subscription.remove();
  logAppsFlyer('debug', 'app_lifecycle_listener', 'registered');
}

// Starts the SDK explicitly after initialization and ATT handling. startSdk sends the
// launch request used by AppsFlyer to measure installs and subsequent app sessions.
function startSdk() {
  logAppsFlyer('info', 'start_sdk', 'requested', {
    purpose: 'Send the AppsFlyer launch request and enable install/session measurement.',
  });
  appsFlyer.startSdk();
  logAppsFlyer('info', 'start_sdk', 'invoked');
}

export function initializeAppsFlyer() {
  // AppsFlyer is a native mobile SDK. Web analytics remain in the shared data layer only.
  if (Platform.OS === 'web') {
    logAppsFlyer('info', 'initialize_sdk', 'skipped', { reason: 'AppsFlyer is not supported on web.' });
    return Promise.resolve(false);
  }

  // A cached promise prevents duplicate initialization and duplicate launch requests.
  if (initialization) {
    logAppsFlyer('debug', 'initialize_sdk', 'reused_existing_request');
    return initialization;
  }

  if (!APPSFLYER_DEV_KEY) {
    logAppsFlyer('warn', 'initialize_sdk', 'skipped', {
      reason: 'EXPO_PUBLIC_APPSFLYER_DEV_KEY is not configured.',
    });
    return Promise.resolve(false);
  }

  initialization = (async () => {
    try {
      registerInstallListeners();
      registerDeepLinkListener();
      registerSessionLifecycleLogging();
      logSdkVersion();

      const options = {
        devKey: APPSFLYER_DEV_KEY,
        appId: Platform.OS === 'ios' ? APPSFLYER_IOS_APP_ID : undefined,
        // Native SDK debug mode prints AppsFlyer's internal requests and responses.
        isDebug: true,
        // Required for install attribution and first-launch conversion callbacks above.
        onInstallConversionDataListener: true,
        // Receive direct and deferred OneLink payloads before starting the SDK.
        onDeepLinkListener: true,
        // iOS launch transmission waits while the user responds to Apple's ATT prompt.
        timeToWaitForATTUserAuthorization: ATT_WAIT_SECONDS,
        // Manual start separates initialization from the launch/install request in logs.
        manualStart: true,
      };

      logAppsFlyer('info', 'initialize_sdk', 'requested', {
        options: {
          ...options,
          devKey: maskCredential(options.devKey),
          appId: options.appId ? maskCredential(options.appId) : undefined,
        },
      });

      // initSdk loads configuration and native listeners. With manualStart enabled it does
      // not yet send the launch request, which is performed by startSdk below.
      const sdkInitialization = appsFlyer.initSdk(options);

      if (Platform.OS === 'ios') {
        logAppsFlyer('info', 'att_authorization', 'requested', {
          timeoutSeconds: ATT_WAIT_SECONDS,
          nativeMethod: 'ATTrackingManager.requestTrackingAuthorization',
        });

        // Expo calls Apple's ATTrackingManager.requestTrackingAuthorization method.
        // AppsFlyer waits for this result before collecting the IDFA and sending launch data.
        const permission = await requestTrackingPermissionsAsync();
        logAppsFlyer('info', 'att_authorization', 'completed', {
          status: permission.status,
          granted: permission.granted,
          canAskAgain: permission.canAskAgain,
          expires: permission.expires,
        });
      } else {
        logAppsFlyer('debug', 'att_authorization', 'skipped', { reason: 'ATT is iOS-only.' });
      }

      const result = await sdkInitialization;
      logAppsFlyer('info', 'initialize_sdk', 'succeeded', { result, debugMode: true });
      startSdk();
      return true;
    } catch (error) {
      logAppsFlyer('error', 'initialize_sdk', 'failed', error);
      return false;
    }
  })();

  return initialization;
}

export function startAppsFlyerIntegration(onDeepLink?: (payload: OneLinkPayload) => void) {
  onOneLinkResolved = onDeepLink;
  logAppsFlyer('info', 'integration', 'starting');

  if (!unsubscribeFromDataLayer) {
    // The subscriber is the only bridge between application analytics and AppsFlyer.
    // Screens stay SDK-agnostic and continue publishing the shared ecommerce schema.
    unsubscribeFromDataLayer = analytics.subscribe(async (event) => {
      logAppsFlyer('debug', 'data_layer_event', 'received', {
        sourceEvent: event.event,
        eventId: event.event_id,
      });

      const mapped = mapEvent(event);
      if (!mapped) {
        logAppsFlyer('debug', 'in_app_event', 'skipped', {
          sourceEvent: event.event,
          reason: 'No AppsFlyer ecommerce mapping is configured.',
        });
        return;
      }

      if (!(await initializeAppsFlyer())) {
        logAppsFlyer('warn', 'in_app_event', 'not_sent', {
          sourceEvent: event.event,
          appsFlyerEvent: mapped.eventName,
          reason: 'AppsFlyer SDK is unavailable or failed to initialize.',
        });
        return;
      }

      try {
        // logEvent transmits the mapped ecommerce event and its AppsFlyer parameters.
        logAppsFlyer('info', 'log_event', 'requested', {
          sourceEvent: event.event,
          appsFlyerEvent: mapped.eventName,
          parameters: mapped.parameters,
        });
        const result = await appsFlyer.logEvent(mapped.eventName, mapped.parameters);
        logAppsFlyer('info', 'log_event', 'succeeded', {
          sourceEvent: event.event,
          appsFlyerEvent: mapped.eventName,
          result,
        });
      } catch (error) {
        logAppsFlyer('error', 'log_event', 'failed', {
          sourceEvent: event.event,
          appsFlyerEvent: mapped.eventName,
          error,
        });
      }
    });
    logAppsFlyer('debug', 'data_layer_subscription', 'registered');
  } else {
    logAppsFlyer('debug', 'data_layer_subscription', 'already_registered');
  }

  void initializeAppsFlyer();
}
