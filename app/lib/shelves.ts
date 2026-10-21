import {CATEGORIES} from '~/data/products';
import {C} from '~/lib/theme';

const CYCLE = [C.cyan, C.frost, C.steel, C.ice];
const FIXED: Record<string, string> = {
  all: C.text,
  'todays-drop': C.cyan,
  specials: C.ice,
  exotic: C.steel,
  indoor: C.cyan,
  deps: C.frost,
  'mixed-light': C.cyan,
  prerolls: C.text,
  carts: C.cyan,
  edibles: C.ice,
};
const LABELS: Record<string, string> = {
  all: 'Everything',
  'todays-drop': "Today's Drop",
  specials: 'Clearance',
};

const titleCase = (s: string) =>
  s.toLowerCase().replace(/(^|[\s·/-])([a-z])/g, (_, a, b) => a + b.toUpperCase());

export interface Shelf {
  id: string;
  label: string;
  typeParam: string | null;
  badge: string | null;
  color: string;
}

export const SHELVES: Shelf[] = CATEGORIES.map((c, i) => ({
  id: c.id,
  label: LABELS[c.id] ?? titleCase(c.label),
  typeParam: c.typeParam,
  badge: c.badge,
  color: FIXED[c.id] ?? CYCLE[i % CYCLE.length],
}));

export const findShelf = (idOrType: string) => {
  const k = decodeURIComponent(idOrType).toLowerCase();
  return SHELVES.find((s) => s.id === k || s.typeParam === k);
};

export interface ShelfWithCount extends Shelf {
  count: number;
}

/**
 * Same visibility rules as before: empty shelves are hidden, unknown Shopify
 * product types are appended, "today's drop" only shows when something is recent.
 */
export function buildShelves(
  counts: {types: Record<string, number>; total: number; dropLabel: string | null} | undefined,
): ShelfWithCount[] {
  const types = counts?.types ?? {};
  const known = new Set(SHELVES.map((s) => s.typeParam).filter(Boolean));
  const extras: Shelf[] = Object.keys(types)
    .filter((t) => !known.has(t) && t !== 'other')
    .map((t, i) => ({id: encodeURIComponent(t), label: titleCase(t), typeParam: t, badge: null, color: CYCLE[(SHELVES.length + i) % CYCLE.length]}));

  return [...SHELVES, ...extras]
    .map((s) => {
      if (s.id === 'all') return {...s, count: counts?.total ?? 0};
      if (s.id === 'todays-drop') return {...s, label: counts?.dropLabel === "THIS WEEK'S DROP" ? "This Week's Drop" : s.label, count: 0};
      return {...s, count: s.typeParam ? types[s.typeParam] ?? 0 : 0};
    })
    .filter((s) => (s.id === 'todays-drop' ? counts?.dropLabel != null : s.id === 'all' || s.count > 0));
}

export const shelfHref = (id: string) => (id === 'all' ? '/menu' : `/menu/${id}`);
