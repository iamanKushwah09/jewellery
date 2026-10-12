/**
 * Facebook/Meta Pixel — Production Integration
 * 
 * Centralized pixel utility for the ecommerce store.
 * All events use deduplication (eventID) to prevent double-counting
 * when using both browser pixel and Conversions API.
 * 
 * Usage:
 *   import { fbPixel } from '@/lib/fbPixel';
 *   fbPixel.trackAddToCart({ ... });
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface FBProductItem {
  id: string;
  name: string;
  price: number;
  quantity?: number;
  category?: string;
  brand?: string;
}

export interface ViewContentParams {
  contentName: string;
  contentIds: string[];
  contentType?: string;
  value: number;
  currency?: string;
}

export interface AddToCartParams {
  contentName: string;
  contentIds: string[];
  contentType?: string;
  value: number;
  currency?: string;
  numItems?: number;
}

export interface InitiateCheckoutParams {
  contentIds: string[];
  contents: FBProductItem[];
  value: number;
  currency?: string;
  numItems: number;
}

export interface PurchaseParams {
  contentIds: string[];
  contents: FBProductItem[];
  value: number;
  currency?: string;
  numItems: number;
  orderId?: string;
}

export interface SearchParams {
  searchString: string;
  contentIds?: string[];
  contentCategory?: string;
}

export interface AddToWishlistParams {
  contentName: string;
  contentIds: string[];
  contentType?: string;
  value: number;
  currency?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const FB_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '';
const DEFAULT_CURRENCY = 'INR';
const IS_DEV = process.env.NODE_ENV !== 'production';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Generate a unique event ID for deduplication with Conversions API.
 * Falls back to timestamp + random if crypto.randomUUID is unavailable.
 */
const generateEventId = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
};

/**
 * Debug logger for developer testing in F12 console.
 */
const debugLog = (eventName: string, data: Record<string, any> = {}): void => {
  if (typeof window !== 'undefined' && (IS_DEV || !isPixelConfigured())) {
    console.log(`%c[Meta Pixel Debug] %c${eventName}`, 'color: #1877F2; font-weight: bold;', 'color: #333; font-weight: bold;', data);
  }
};

/**
 * Check if pixel is ready (guards against SSR and missing pixel).
 */
const isPixelReady = (): boolean => {
  return typeof window !== 'undefined' && typeof window.fbq === 'function';
};

/**
 * Check if pixel ID is configured (not placeholder).
 */
const isPixelConfigured = (): boolean => {
  return !!FB_PIXEL_ID && FB_PIXEL_ID !== 'YOUR_PIXEL_ID' && FB_PIXEL_ID.length > 5;
};

// ─── Core ────────────────────────────────────────────────────────────────────

/**
 * Initialize the Meta Pixel.
 * Safe to call multiple times — will only load once.
 */
const initPixel = (): void => {
  if (typeof window === 'undefined') return;
  if (!isPixelConfigured()) {
    console.warn('[Meta Pixel] NEXT_PUBLIC_META_PIXEL_ID is not set in store/.env. Set your Pixel ID to send live events to Meta.');
    return;
  }
  if (window.fbq) return; // Already initialized

  // Meta Pixel base code
  (function (f: any, b: Document, e: string, v: string, n?: any, t?: any, s?: any) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = '2.0';
    n.queue = [];
    t = b.createElement(e);
    t.async = true;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode?.insertBefore(t, s);
  })(
    window,
    document,
    'script',
    'https://connect.facebook.net/en_US/fbevents.js'
  );

  // Initialize with Pixel ID
  window.fbq('init', FB_PIXEL_ID);
};

// ─── Event Tracking ──────────────────────────────────────────────────────────

/**
 * Track PageView — called on every route change.
 */
const pageView = (): void => {
  const eventId = generateEventId();
  debugLog('PageView', { path: typeof window !== 'undefined' ? window.location.pathname : '', eventId });

  if (!isPixelReady()) return;
  window.fbq('track', 'PageView', {}, { eventID: eventId });
};

/**
 * Track ViewContent — product detail page.
 */
const trackViewContent = (params: ViewContentParams): void => {
  const eventId = generateEventId();
  const payload = {
    content_name: params.contentName,
    content_ids: params.contentIds,
    content_type: params.contentType || 'product',
    value: params.value,
    currency: params.currency || DEFAULT_CURRENCY,
  };

  debugLog('ViewContent', { ...payload, eventId });

  if (!isPixelReady()) return;
  window.fbq('track', 'ViewContent', payload, { eventID: eventId });
};

/**
 * Track AddToCart — item added to cart.
 */
const trackAddToCart = (params: AddToCartParams): void => {
  const eventId = generateEventId();
  const payload = {
    content_name: params.contentName,
    content_ids: params.contentIds,
    content_type: params.contentType || 'product',
    value: params.value,
    currency: params.currency || DEFAULT_CURRENCY,
    num_items: params.numItems || 1,
  };

  debugLog('AddToCart', { ...payload, eventId });

  if (!isPixelReady()) return;
  window.fbq('track', 'AddToCart', payload, { eventID: eventId });
};

/**
 * Track InitiateCheckout — user begins checkout.
 */
const trackInitiateCheckout = (params: InitiateCheckoutParams): void => {
  const eventId = generateEventId();
  const payload = {
    content_ids: params.contentIds,
    contents: params.contents.map(item => ({
      id: item.id,
      quantity: item.quantity || 1,
      item_price: item.price,
    })),
    value: params.value,
    currency: params.currency || DEFAULT_CURRENCY,
    num_items: params.numItems,
  };

  debugLog('InitiateCheckout', { ...payload, eventId });

  if (!isPixelReady()) return;
  window.fbq('track', 'InitiateCheckout', payload, { eventID: eventId });
};

/**
 * Track Purchase — order completed successfully.
 */
const trackPurchase = (params: PurchaseParams): void => {
  const eventId = generateEventId();
  const payload = {
    content_ids: params.contentIds,
    contents: params.contents.map(item => ({
      id: item.id,
      quantity: item.quantity || 1,
      item_price: item.price,
    })),
    value: params.value,
    currency: params.currency || DEFAULT_CURRENCY,
    num_items: params.numItems,
    ...(params.orderId && { order_id: params.orderId }),
  };

  debugLog('Purchase 🎉', { ...payload, eventId });

  if (!isPixelReady()) return;
  window.fbq('track', 'Purchase', payload, { eventID: eventId });
};

/**
 * Track Search — user searches for products.
 */
const trackSearch = (params: SearchParams): void => {
  const eventId = generateEventId();
  const payload = {
    search_string: params.searchString,
    ...(params.contentIds && { content_ids: params.contentIds }),
    ...(params.contentCategory && { content_category: params.contentCategory }),
  };

  debugLog('Search', { ...payload, eventId });

  if (!isPixelReady()) return;
  window.fbq('track', 'Search', payload, { eventID: eventId });
};

/**
 * Track AddToWishlist — user adds item to wishlist.
 */
const trackAddToWishlist = (params: AddToWishlistParams): void => {
  const eventId = generateEventId();
  const payload = {
    content_name: params.contentName,
    content_ids: params.contentIds,
    content_type: params.contentType || 'product',
    value: params.value,
    currency: params.currency || DEFAULT_CURRENCY,
  };

  debugLog('AddToWishlist', { ...payload, eventId });

  if (!isPixelReady()) return;
  window.fbq('track', 'AddToWishlist', payload, { eventID: eventId });
};

/**
 * Track custom events (for any future needs).
 */
const trackCustom = (eventName: string, data?: Record<string, any>): void => {
  const eventId = generateEventId();
  debugLog(`CustomEvent: ${eventName}`, { ...(data || {}), eventId });

  if (!isPixelReady()) return;
  window.fbq('trackCustom', eventName, data || {}, { eventID: eventId });
};

// ─── Exports ─────────────────────────────────────────────────────────────────

export const fbPixel = {
  initPixel,
  pageView,
  trackViewContent,
  trackAddToCart,
  trackInitiateCheckout,
  trackPurchase,
  trackSearch,
  trackAddToWishlist,
  trackCustom,
  FB_PIXEL_ID,
};

export default fbPixel;

// ─── Global Type Augmentation ────────────────────────────────────────────────

declare global {
  interface Window {
    fbq: (...args: any[]) => void;
    _fbq: any;
  }
}
