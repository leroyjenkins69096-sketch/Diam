import {useMemo, useState} from 'react';
import {Link, useSearchParams} from 'react-router';
import type {ShopifyProduct} from '~/lib/shopify-products';
import {ProductCard} from '~/components/ProductCard';
import {PriceRange} from '~/components/PriceRange';
import {useActiveShelf, useShelves} from '~/components/SideNav';
import {shelfHref, findShelf} from '~/lib/shelves';
import {C, pad, topPrice} from '~/lib/theme';

const SORTS = [
  ['featured', 'FEATURED'],
  ['low', 'PRICE ↑'],
  ['high', 'PRICE ↓'],
] as const;

const panel: React.CSSProperties = {background: C.card2, border: `1px solid ${C.line}`, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10};
const mono11: React.CSSProperties = {fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.14em', color: C.dim};

/** "The Case": shelf chips + sort + price range + grid. Backs /menu and /menu/:category. */
export function Rack({products, shelfId, dropIds}: {products: ShopifyProduct[]; shelfId: string; dropIds?: string[]}) {
  const [params, setParams] = useSearchParams();
  const [sort, setSort] = useState<(typeof SORTS)[number][0]>('featured');
  const shelves = useShelves();
  const activeShelf = useActiveShelf();
  const shelf = findShelf(shelfId) ?? {id: shelfId, label: decodeURIComponent(shelfId), typeParam: decodeURIComponent(shelfId).toLowerCase()};
  const q = (params.get('q') ?? '').trim();

  // Everything on this shelf (+ search) before the price window is applied.
  const shelfItems = useMemo(() => {
    let r = products;
    if (shelf.id === 'todays-drop') {
      const ids = new Set(dropIds ?? []);
      r = r.filter((p) => ids.has(p.id));
    } else if (shelf.id !== 'all' && shelf.typeParam) {
      r = r.filter((p) => p.productType.toLowerCase() === shelf.typeParam);
    }
    if (q) {
      const needle = q.toLowerCase();
      r = r.filter((p) =>
        [p.title, p.strain ?? '', p.productType, ...p.nose, ...p.effects, ...p.tags].join(' ').toLowerCase().includes(needle),
      );
    }
    return r;
  }, [products, shelf.id, shelf.typeParam, dropIds, q]);

  // Bounds: cheapest item's top price → priciest item's top price.
  const bounds = useMemo(() => {
    const prices = shelfItems.map(topPrice).filter((n) => n > 0);
    return prices.length ? {min: Math.min(...prices), max: Math.max(...prices)} : null;
  }, [shelfItems]);

  // The window belongs to a shelf; switching shelves falls back to the full range.
  const [range, setRange] = useState<{key: string; lo: number; hi: number} | null>(null);
  const rangeKey = `${shelf.id}|${q}`;
  const priceWindow: [number, number] | null = bounds
    ? range && range.key === rangeKey
      ? [Math.max(range.lo, bounds.min), Math.min(range.hi, bounds.max)]
      : [bounds.min, bounds.max]
    : null;

  const list = useMemo(() => {
    let r = [...shelfItems];
    if (bounds && priceWindow) {
      const [lo, hi] = priceWindow;
      if (lo > bounds.min || hi < bounds.max) r = r.filter((p) => topPrice(p) >= lo && topPrice(p) <= hi);
    }
    if (sort === 'low') r.sort((a, b) => topPrice(a) - topPrice(b));
    if (sort === 'high') r.sort((a, b) => topPrice(b) - topPrice(a));
    return r;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shelfItems, bounds, priceWindow?.[0], priceWindow?.[1], sort]);

  const gutter = 'clamp(16px,4vw,56px)';

  return (
    <section style={{padding: `clamp(24px,4vw,48px) ${gutter} 0`, display: 'flex', flexDirection: 'column', gap: 20}}>
      <div style={{display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap'}}>
        <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
          <span style={{fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.14em', color: C.cyan}}>{shelf.id === 'all' ? 'ALL SHELVES' : shelf.label.toUpperCase()}</span>
          <h1 style={{margin: 0, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(34px,5vw,64px)', lineHeight: 0.95, letterSpacing: '-0.03em', textTransform: 'uppercase'}}>The Case</h1>
          {q && (
            <div style={{display: 'flex', gap: 10, alignItems: 'center', color: C.muted, fontSize: 14, flexWrap: 'wrap'}}>
              Results for “{q}”
              <button onClick={() => setParams((p) => { p.delete('q'); return p; }, {replace: true})} style={{background: 'none', border: `1px solid ${C.lineStrong}`, color: C.text, padding: '3px 10px', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em'}}>CLEAR ✕</button>
            </div>
          )}
        </div>
        <span style={{fontFamily: 'var(--font-mono)', fontSize: 14, color: C.muted}}>{pad(list.length)} RESULTS</span>
      </div>

      <div className="dp-noscroll" style={{display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, margin: `0 calc(-1 * ${gutter})`, paddingLeft: gutter, paddingRight: gutter}}>
        {shelves.map((s) => {
          const on = activeShelf === s.id;
          return (
            <Link key={s.id} to={`${shelfHref(s.id)}${q ? `?q=${encodeURIComponent(q)}` : ''}`} className="dp-plain" style={{
              flex: 'none', display: 'flex', alignItems: 'center', gap: 8, height: 38, padding: '0 14px', whiteSpace: 'nowrap',
              border: `1px solid ${on ? C.text : 'rgba(160,220,255,0.22)'}`, background: on ? C.text : 'transparent', color: on ? C.ink : C.text,
              fontWeight: 800, fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>
              <span style={{width: 7, height: 7, borderRadius: '50%', background: on ? C.ink : s.color}} />
              {s.label}
              {s.count > 0 && <span style={{fontFamily: 'var(--font-mono)', fontSize: 11, opacity: 0.7}}>{pad(s.count)}</span>}
            </Link>
          );
        })}
      </div>

      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,300px),1fr))', gap: 14, alignItems: 'stretch'}}>
        <div style={panel}>
          <span style={mono11}>SORT</span>
          <div style={{display: 'flex', border: `1px solid ${C.lineStrong}`}}>
            {SORTS.map(([id, label]) => (
              <button key={id} onClick={() => setSort(id)} style={{
                flex: 1, height: 38, border: 'none', background: sort === id ? C.cyan : 'transparent', color: sort === id ? C.ink : C.text,
                fontWeight: 800, fontSize: 12, letterSpacing: '0.06em', cursor: 'pointer',
              }}>{label}</button>
            ))}
          </div>
        </div>
        {bounds && priceWindow && bounds.max > bounds.min && (
          <PriceRange bounds={bounds} value={priceWindow} onChange={([lo, hi]) => setRange({key: rangeKey, lo, hi})} />
        )}
      </div>

      {list.length === 0 && (
        <div style={{border: `1px dashed ${C.lineStrong}`, padding: '56px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center'}}>
          <span style={{fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28}}>NOTHING ON THE SCALE.</span>
          <span style={{color: C.muted, fontSize: 15}}>No packs match these filters. Try another shelf or widen the price range.</span>
          <Link to="/menu" className="dp-plain" style={{height: 44, padding: '0 20px', display: 'inline-flex', alignItems: 'center', border: `1.5px solid ${C.cyan}`, color: C.cyan, fontWeight: 800, fontSize: 13, letterSpacing: '0.06em'}}>RESET FILTERS</Link>
        </div>
      )}

      <div className="dp-grid">
        {list.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
}
