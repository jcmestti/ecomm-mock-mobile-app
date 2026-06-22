import { products } from '../data/products';

export type OneLinkPayload = {
  productId?: string;
  coupon?: string;
  discountPercent?: number;
  isDeferred: boolean;
};

// OneLink values can arrive URL-encoded or embedded in a larger campaign value.
export function productIdFromDeepLinkValue(value: unknown) {
  if (typeof value !== 'string') return undefined;

  let decodedValue = value;
  try {
    decodedValue = decodeURIComponent(value);
  } catch {
    // Keep the original value when it is not valid URL encoding.
  }

  const normalizedValue = decodedValue.toUpperCase();
  return products.find((product) => normalizedValue.includes(product.id.toUpperCase()))?.id;
}

// Accepts the requested 1/10/20...90 OFF campaign values without relying on casing.
export function discountFromDeepLinkSub1(value: unknown) {
  if (typeof value !== 'string') return undefined;

  const match = value.trim().match(/(?:^|\b)(1|[1-9]0)off(?:\b|$)/i);
  if (!match) return undefined;

  const discountPercent = Number(match[1]);
  return {
    coupon: `${discountPercent}OFF`,
    discountPercent,
  };
}

export function payloadFromUriSchemeUrl(url: string): OneLinkPayload {
  const query = url.split('?')[1]?.split('#')[0] ?? '';
  const parameters = new URLSearchParams(query);
  const productPathMatch = url.match(/^northstar:\/\/product\/([^/?#]+)/i);
  const productValue = parameters.get('deep_link_value') ?? productPathMatch?.[1];
  const discount = discountFromDeepLinkSub1(parameters.get('deep_link_sub1'));

  return {
    productId: productIdFromDeepLinkValue(productValue),
    ...discount,
    isDeferred: false,
  };
}
