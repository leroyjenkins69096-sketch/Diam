import type {Storefront} from '@shopify/hydrogen';
import sampleProducts from '~/data/shopify-products.json';
import {isShopifyConnected} from '~/lib/shopify-config';

export interface ShopifyVariant {
  id: string;
  title: string;
  price: number;
  available: boolean;
}

export type MediaItem =
  | {type: 'image'; url: string}
  | {type: 'video'; sources: Array<{url: string; mimeType: string}>; previewUrl?: string}
  | {type: 'external_video'; embeddedUrl: string; previewUrl?: string};

export interface ShopifyProduct {
  id: string;
  handle: string;
  title: string;
  description: string;
  descriptionHtml: string;
  productType: string;
  publishedAt: string;
  tags: string[];
  image?: string;
  media: MediaItem[];
  variants: ShopifyVariant[];
  strain?: 'indica' | 'sativa' | 'hybrid';
  grade?: string;
  badges: string[];
  nose: string[];
  effects: string[];
  short?: string;
  palette: [string, string, string];
}

function hslToHex(h: number, s: number, l: number): string {
  const sat = s / 100, lig = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sat * Math.min(lig, 1 - lig);
  const f = (n: number) => lig - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const hex = (x: number) => Math.round(x * 255).toString(16).padStart(2, '0');
  return `#${hex(f(0))}${hex(f(8))}${hex(f(4))}`;
}

// Hex (not hsl()) so the design's `${color}77` alpha suffix stays valid CSS.
function paletteFromHandle(handle: string): [string, string, string] {
  let h = 0;
  for (let i = 0; i < handle.length; i++) h = (h * 31 + handle.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  return [hslToHex(hue, 30, 18), hslToHex(hue, 40, 35), hslToHex(hue, 50, 60)];
}

function tag(tags: string[], prefix: string): string | undefined {
  const t = tags.find((x) => x.toLowerCase().startsWith(`${prefix}:`));
  return t ? t.slice(prefix.length + 1).trim() : undefined;
}

function tagList(tags: string[], prefix: string): string[] {
  const t = tags.find((x) => x.toLowerCase().startsWith(`${prefix}:`));
  return t ? t.slice(prefix.length + 1).split(',').map((s) => s.trim()).filter(Boolean) : [];
}

// ── Raw GraphQL shape ────────────────────────────────────────────────────────

interface RawVariantNode {
  id: string;
  title: string;
  price: {amount: string};
  availableForSale: boolean;
}

interface RawMediaNode {
  mediaContentType: 'IMAGE' | 'VIDEO' | 'EXTERNAL_VIDEO' | 'MODEL_3D';
  previewImage?: {url: string};
  image?: {url: string; altText?: string};
  sources?: Array<{url: string; mimeType: string}>;
  embeddedUrl?: string;
}

interface RawProduct {
  id: string;
  handle: string;
  title: string;
  description: string;
  descriptionHtml: string;
  productType: string;
  publishedAt: string;
  tags: string[];
  media: {edges: Array<{node: RawMediaNode}>};
  variants: {edges: Array<{node: RawVariantNode}>};
}

// ── Mapping ──────────────────────────────────────────────────────────────────

function mapMediaItems(raw: RawProduct): MediaItem[] {
  return (raw.media?.edges ?? [])
    .map(({node}) => {
      if (node.mediaContentType === 'IMAGE' && node.image) {
        return {type: 'image' as const, url: node.image.url};
      }
      if (node.mediaContentType === 'VIDEO' && node.sources?.length) {
        return {type: 'video' as const, sources: node.sources, previewUrl: node.previewImage?.url};
      }
      if (node.mediaContentType === 'EXTERNAL_VIDEO' && node.embeddedUrl) {
        return {type: 'external_video' as const, embeddedUrl: node.embeddedUrl, previewUrl: node.previewImage?.url};
      }
      return null;
    })
    .filter((m): m is MediaItem => m !== null);
}

function mapProduct(raw: RawProduct): ShopifyProduct {
  const {tags} = raw;
  const strainRaw = tag(tags, 'strain');
  const strain =
    strainRaw === 'indica' || strainRaw === 'sativa' || strainRaw === 'hybrid'
      ? strainRaw
      : undefined;
  const badgeTags = tags
    .filter((t) => t.toLowerCase().startsWith('badge:'))
    .map((t) => t.slice(6).trim().toUpperCase());

  const media = mapMediaItems(raw);
  const firstImage = media.find((m): m is {type: 'image'; url: string} => m.type === 'image');

  return {
    id: raw.id,
    handle: raw.handle,
    title: raw.title,
    description: raw.description,
    descriptionHtml: raw.descriptionHtml,
    productType: raw.productType || 'other',
    publishedAt: raw.publishedAt,
    tags,
    image: firstImage?.url,
    media,
    variants: raw.variants.edges.map((e) => ({
      id: e.node.id,
      title: e.node.title,
      price: parseFloat(e.node.price.amount),
      available: e.node.availableForSale,
    })),
    strain,
    grade: tag(tags, 'grade')?.toUpperCase(),
    badges: badgeTags,
    nose: tagList(tags, 'nose'),
    effects: tagList(tags, 'effects'),
    short: tag(tags, 'short'),
    palette: paletteFromHandle(raw.handle),
  };
}

// ── Queries ──────────────────────────────────────────────────────────────────

const PRODUCT_FRAGMENT = `#graphql
  fragment ProductFields on Product {
    id
    handle
    title
    description
    descriptionHtml
    productType
    publishedAt
    tags
    media(first: 20) {
      edges {
        node {
          mediaContentType
          previewImage { url }
          ... on MediaImage {
            image { url altText }
          }
          ... on Video {
            sources { url mimeType }
          }
          ... on ExternalVideo {
            embeddedUrl
          }
        }
      }
    }
    variants(first: 20) {
      edges {
        node {
          id
          title
          availableForSale
          price { amount currencyCode }
        }
      }
    }
  }
`;

const ALL_PRODUCTS_QUERY = `#graphql
  ${PRODUCT_FRAGMENT}
  query AllProducts($first: Int!) {
    products(first: $first) {
      edges { node { ...ProductFields } }
    }
  }
`;

const SINGLE_PRODUCT_QUERY = `#graphql
  ${PRODUCT_FRAGMENT}
  query SingleProduct($handle: String!) {
    productByHandle(handle: $handle) {
      ...ProductFields
    }
  }
`;

type DataContext = {storefront: Storefront; env: Env};

/**
 * Local mode: serves app/data/shopify-products.json (raw Storefront API shape)
 * when no Shopify store is connected. publishedAt is shifted so the sample
 * catalog always looks freshly dropped (TODAY'S DROP etc. stay populated).
 */
function getLocalProducts(): ShopifyProduct[] {
  const raw = sampleProducts as unknown as RawProduct[];
  const newest = Math.max(...raw.map((p) => Date.parse(p.publishedAt) || 0));
  const shift = Date.now() - 2 * 60 * 60 * 1000 - newest;
  return raw.map((p) =>
    mapProduct({...p, publishedAt: new Date(Date.parse(p.publishedAt) + shift).toISOString()}),
  );
}

export async function getAllProducts({storefront, env}: DataContext): Promise<ShopifyProduct[]> {
  if (!isShopifyConnected(env)) return getLocalProducts();
  const data = await storefront.query(ALL_PRODUCTS_QUERY, {
    variables: {first: 250},
    cache: storefront.CacheNone(),
  });
  return (data.products.edges as {node: RawProduct}[]).map((e) => mapProduct(e.node));
}

export async function getProductByHandle(
  {storefront, env}: DataContext,
  handle: string,
): Promise<ShopifyProduct | null> {
  if (!isShopifyConnected(env)) return getLocalProducts().find((p) => p.handle === handle) ?? null;
  const data = await storefront.query(SINGLE_PRODUCT_QUERY, {
    variables: {handle},
    cache: storefront.CacheShort(),
  });
  return data.productByHandle ? mapProduct(data.productByHandle as RawProduct) : null;
}

export function getProductTypes(products: ShopifyProduct[]): string[] {
  const types = new Set(products.map((p) => p.productType.toLowerCase()).filter(Boolean));
  return ['all', ...Array.from(types)];
}

export function fmt(n: number) {
  return '$' + n.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2});
}
