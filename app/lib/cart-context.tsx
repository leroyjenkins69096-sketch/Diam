import {createContext, useContext, useState, useCallback, useEffect, type ReactNode} from 'react';
import type {ShopifyProduct, ShopifyVariant} from '~/lib/shopify-products';
import {fmt} from '~/lib/shopify-products';

export const BULK_TYPES = ['edibles', 'carts', 'prerolls'];

export const BULK_TIERS = [
  {label: '1 – 9',   min: 1,   max: 9,        discount: 0},
  {label: '10 – 49', min: 10,  max: 49,       discount: 1},
  {label: '50 – 99', min: 50,  max: 99,       discount: 2},
  {label: '100+',    min: 100, max: Infinity,  discount: 3},
];

export const PREROLL_BULK_TIERS = [
  {label: '1 – 9',    min: 1,   max: 9,        discount: 0},
  {label: '10 – 49',  min: 10,  max: 49,       discount: 1},
  {label: '50 – 99',  min: 50,  max: 99,       discount: 2},
  {label: '100 – 499', min: 100, max: 499,     discount: 3},
  {label: '500+',     min: 500, max: Infinity,  discount: 4},
];

export function getBulkDiscount(totalQty: number, type?: string): number {
  const tiers = type?.toLowerCase() === 'prerolls' ? PREROLL_BULK_TIERS : BULK_TIERS;
  return tiers.find((t) => totalQty >= t.min && totalQty <= t.max)?.discount ?? 0;
}

export const FLOWER_BULK_TYPES = ['indoor', 'deps', 'mixed light', 'exotic', 'smalls/mediums', 'terp'];

export const FLOWER_BULK_TIERS = [
  {label: '1 – 4',   min: 0,  max: 4,        discount: 0},
  {label: '5 – 9',   min: 5,  max: 9,        discount: 50},
  {label: '10 – 19', min: 10, max: 19,       discount: 75},
  {label: '20+',     min: 20, max: Infinity,  discount: 100},
];

export function isFlowerBulkType(type: string): boolean {
  return FLOWER_BULK_TYPES.includes(type.toLowerCase());
}

export function getFlowerBulkDiscount(totalPQty: number): number {
  return FLOWER_BULK_TIERS.find((t) => totalPQty >= t.min && totalPQty <= t.max)?.discount ?? 0;
}

export function isPVariant(title: string): boolean {
  return title.trim().toUpperCase() === 'P';
}

export function computeFlowerBulkDiscount(cart: CartItem[]): number {
  const totalPQty = cart
    .filter((it) => isFlowerBulkType(it.productType) && isPVariant(it.variantTitle))
    .reduce((s, it) => s + it.qty, 0);
  const discountPerUnit = getFlowerBulkDiscount(totalPQty);
  return discountPerUnit * totalPQty;
}

export interface CartItem {
  key: string;
  productId: string;
  variantId: string;
  name: string;
  variantTitle: string;
  productType: string;
  palette: [string, string, string];
  image?: string;
  price: number;
  qty: number;
}

interface CartContextValue {
  cart: CartItem[];
  cartOpen: boolean;
  cartCount: number;
  addToCart: (product: ShopifyProduct, variant: ShopifyVariant, qty?: number) => void;
  updateQty: (key: string, qty: number) => void;
  removeItem: (key: string) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const CART_KEY = 'diamond_cart';
const CART_TTL = 60 * 60 * 1000;

function loadCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const {items, expires} = JSON.parse(raw);
    if (Date.now() > expires) { localStorage.removeItem(CART_KEY); return []; }
    return items;
  } catch { return []; }
}

function saveCart(items: CartItem[]) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify({items, expires: Date.now() + CART_TTL}));
  } catch {}
}

export function CartProvider({children}: {children: ReactNode}) {
  const [cart, setCart] = useState<CartItem[]>(loadCart);
  const [cartOpen, setCartOpen] = useState(false);

  useEffect(() => { saveCart(cart); }, [cart]);

  const addToCart = useCallback((product: ShopifyProduct, variant: ShopifyVariant, qty = 1) => {
    const key = `${product.id}-${variant.id}`;
    setCart((c) => {
      const existing = c.find((it) => it.key === key);
      if (existing) {
        return c.map((it) => it.key === key ? {...it, qty: it.qty + qty} : it);
      }
      return [...c, {
        key,
        productId: product.id,
        variantId: variant.id,
        name: product.title,
        variantTitle: variant.title,
        productType: product.productType,
        palette: product.palette,
        image: product.image,
        price: variant.price,
        qty,
      }];
    });
    setCartOpen(true);
  }, []);

  const updateQty = (key: string, qty: number) => {
    if (qty <= 0) return setCart((c) => c.filter((it) => it.key !== key));
    setCart((c) => c.map((it) => it.key === key ? {...it, qty} : it));
  };

  const removeItem = (key: string) => setCart((c) => c.filter((it) => it.key !== key));
  const clearCart = () => setCart([]);

  const cartCount = cart.reduce((s, it) => s + it.qty, 0);

  return (
    <CartContext.Provider value={{
      cart, cartOpen, cartCount,
      addToCart, updateQty, removeItem, clearCart,
      openCart: () => setCartOpen(true),
      closeCart: () => setCartOpen(false),
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}

const pad2 = (n: number) => String(n).padStart(2, '0');

/** One display line per cart item, shared by the clipboard text and the confirm modal. */
export function orderLines(cart: CartItem[]) {
  return cart.map((it) => ({
    left: `${pad2(it.qty)} × ${it.name.toUpperCase()} · ${it.variantTitle === 'Default Title' ? 'STANDARD' : it.variantTitle}`,
    right: fmt(it.price * it.qty),
  }));
}

export function orderTotals(cart: CartItem[]) {
  const units = cart.reduce((s, it) => s + it.qty, 0);
  const subtotal = cart.reduce((s, it) => s + it.price * it.qty, 0);
  const savings = computeBulkDiscount(cart);
  return {units, subtotal, savings, total: subtotal - savings};
}

export function buildOrderText(cart: CartItem[]): string {
  const {units, subtotal, savings, total} = orderTotals(cart);
  return [
    'DIAMOND PACKS — ORDER',
    ...orderLines(cart).map((l) => `${l.left} · ${l.right}`),
    `UNITS: ${pad2(units)}`,
    `SUBTOTAL: ${fmt(subtotal)}`,
    `BULK SAVINGS: −${fmt(savings)}`,
    `TOTAL: ${fmt(total)}`,
    '',
    'Payment method:',
    'Shipping carrier:',
  ].join('\n');
}

export function copyOrderToClipboard(cart: CartItem[]) {
  if (!cart.length) return;
  navigator.clipboard?.writeText(buildOrderText(cart));
}

export interface BulkProgress {
  message: string;
  pct: number;
  label: string;
  unlocked: boolean;
}

/**
 * Next bulk tier the bag is closest to. Mirrors computeBulkDiscount's groups
 * (flower P-variants combined, plus each of BULK_TYPES on its own).
 * Returns null when nothing in the bag is eligible for bulk pricing.
 */
export function getBulkProgress(cart: CartItem[]): BulkProgress | null {
  type Group = {qty: number; tiers: {min: number; discount: number}[]; unit: string};
  const groups: Group[] = [];

  const flowerItems = cart.filter((it) => isFlowerBulkType(it.productType));
  if (flowerItems.length) {
    const qty = flowerItems.filter((it) => isPVariant(it.variantTitle)).reduce((s, it) => s + it.qty, 0);
    groups.push({qty, tiers: FLOWER_BULK_TIERS, unit: 'P'});
  }
  for (const type of BULK_TYPES) {
    const qty = cart.filter((it) => it.productType.toLowerCase() === type).reduce((s, it) => s + it.qty, 0);
    if (qty > 0) groups.push({qty, tiers: type === 'prerolls' ? PREROLL_BULK_TIERS : BULK_TIERS, unit: type === 'prerolls' ? 'pre-roll' : type.replace(/s$/, '')});
  }
  if (!groups.length) return null;

  const upcoming = groups
    .map((g) => ({g, next: g.tiers.find((t) => t.min > g.qty && t.discount > 0)}))
    .filter((x): x is {g: Group; next: {min: number; discount: number}} => !!x.next)
    .sort((a, b) => (a.next.min - a.g.qty) - (b.next.min - b.g.qty));

  if (upcoming.length) {
    const {g, next} = upcoming[0];
    const rem = next.min - g.qty;
    return {
      message: `Add ${rem} more ${g.unit}${rem > 1 ? 's' : ''} to unlock ${fmt(next.discount).replace('.00', '')} off every ${g.unit}`,
      pct: Math.min(100, (g.qty / next.min) * 100),
      label: `${pad2(g.qty)} / ${pad2(next.min)} UNITS`,
      unlocked: false,
    };
  }
  return {message: 'Top bulk tier unlocked', pct: 100, label: 'MAX TIER', unlocked: true};
}

export function computeBulkDiscount(cart: CartItem[]): number {
  let discount = 0;
  for (const type of BULK_TYPES) {
    const items = cart.filter((it) => it.productType.toLowerCase() === type);
    const totalQty = items.reduce((s, it) => s + it.qty, 0);
    const discountPerUnit = getBulkDiscount(totalQty, type);
    discount += discountPerUnit * totalQty;
  }
  discount += computeFlowerBulkDiscount(cart);
  return discount;
}
