import {fmt} from '~/lib/shopify-products';
import {C} from '~/lib/theme';

export type PriceBounds = {min: number; max: number};

/**
 * Dual-handle price slider panel. `bounds` is the cheapest / priciest item on
 * the current shelf (each item priced at its highest variant); `value` is the
 * selected window inside it.
 */
export function PriceRange({bounds, value, onChange}: {bounds: PriceBounds; value: [number, number]; onChange: (v: [number, number]) => void}) {
  const {min, max} = bounds;
  const [lo, hi] = value;
  const pct = (n: number) => ((n - min) / (max - min)) * 100;
  const active = lo > min || hi < max;

  return (
    <div style={{background: C.card2, border: `1px solid ${C.line}`, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10}}>
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8}}>
        <span style={{fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.14em', color: C.dim}}>PRICE</span>
        <span style={{display: 'flex', alignItems: 'center', gap: 10}}>
          <span style={{fontFamily: 'var(--font-mono)', fontSize: 13, color: C.cyan}}>{fmt(lo)} – {fmt(hi)}</span>
          {active && (
            <button onClick={() => onChange([min, max])} style={{background: 'none', border: `1px solid ${C.lineStrong}`, color: C.text, padding: '2px 8px', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em'}}>RESET</button>
          )}
        </span>
      </div>
      <div className="dp-range">
        <div className="dp-range-track" />
        <div className="dp-range-fill" style={{left: `${pct(lo)}%`, right: `${100 - pct(hi)}%`}} />
        <input
          type="range" min={min} max={max} step="any" value={lo} aria-label="Minimum price"
          onChange={(e) => onChange([Math.min(Number(e.target.value), hi), hi])}
        />
        <input
          type="range" min={min} max={max} step="any" value={hi} aria-label="Maximum price"
          onChange={(e) => onChange([lo, Math.max(Number(e.target.value), lo)])}
        />
      </div>
    </div>
  );
}
