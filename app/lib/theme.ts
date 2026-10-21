import type {ShopifyProduct} from '~/lib/shopify-products';

export const C = {
  bg: '#06070A',
  panel: '#0D1016',
  panel2: '#0A0D12',
  card: '#141922',
  card2: '#0F131A',
  line: 'rgba(160,220,255,0.12)',
  lineStrong: 'rgba(160,220,255,0.25)',
  text: '#ECF7FF',
  muted: '#B5C2D4',
  dim: '#8D9BB0',
  cyan: '#8ADCFF',
  ink: '#03121B',
  ice: '#E6EEF5',
  frost: '#C9D8E6',
  steel: '#5E8FB0',
  black: '#06070A',
} as const;

export const STRAIN_META = {
  indica: {label: 'Indica', color: C.steel},
  sativa: {label: 'Sativa', color: C.text},
  hybrid: {label: 'Hybrid', color: C.cyan},
} as const;

const BADGE_BG: Record<string, string> = {NEW: C.cyan, DEAL: C.ice, SALE: C.ice, LIMITED: C.frost, EXOTIC: C.steel};
export const badgeColor = (label: string) => BADGE_BG[label] ?? C.text;

export const pad = (n: number) => String(n).padStart(2, '0');

/** The design's conic "art" + glow, used when a product has no photo. */
export const artBackground = (pal: [string, string, string], i = 0) => {
  const [a, b, c] = pal;
  return `radial-gradient(circle at 50% 52%, ${c}77 0, transparent 44%), conic-gradient(from ${i * 22}deg at 50% 52%, ${a} 0 12.5%, ${b} 0 25%, ${a} 0 37.5%, ${c}66 0 50%, ${a} 0 62.5%, ${b} 0 75%, ${a} 0 87.5%, ${c}66 0)`;
};
export const gemBackground = (pal: [string, string, string]) =>
  `linear-gradient(155deg, #ffffff 0%, ${pal[2]} 40%, ${pal[1]} 100%)`;
export const GEM_CLIP = 'polygon(50% 0,100% 38%,50% 100%,0 38%)';

const NEW_WINDOW_MS = 30 * 60 * 60 * 1000;
export const isNewProduct = (p: Pick<ShopifyProduct, 'publishedAt'>) =>
  new Date(p.publishedAt).getTime() >= Date.now() - NEW_WINDOW_MS;

/** Cards show a single price: the highest one among purchasable variants. */
export function topVariant(p: ShopifyProduct) {
  const pool = p.variants.some((v) => v.available) ? p.variants.filter((v) => v.available) : p.variants;
  return pool.reduce((a, b) => (b.price > a.price ? b : a), pool[0]);
}
export const topPrice = (p: ShopifyProduct) => topVariant(p)?.price ?? 0;
