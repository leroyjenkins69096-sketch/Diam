import {
  useCart, BULK_TIERS, PREROLL_BULK_TIERS, FLOWER_BULK_TIERS,
  getBulkDiscount, getFlowerBulkDiscount, isFlowerBulkType, isPVariant,
} from '~/lib/cart-context';
import {fmt} from '~/lib/shopify-products';
import {C} from '~/lib/theme';

type Tier = {label: string; min: number; max: number; discount: number};

/** Product-page bulk tiers in the design's mono chip style. The active tier glows cyan. */
function TierChips({tiers, activeDiscount, basePrice, unit}: {tiers: Tier[]; activeDiscount: number; basePrice: number; unit: string}) {
  const paid = tiers.filter((t) => t.discount > 0);
  return (
    <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
      <span style={{fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.06em', color: C.cyan}}>✦ BULK PRICING · PER {unit.toUpperCase()}</span>
      <div style={{display: 'grid', gridTemplateColumns: `repeat(${paid.length}, minmax(0, 1fr))`, gap: 8}}>
        {paid.map((t) => {
          const on = t.discount === activeDiscount;
          return (
            <div key={t.label} style={{
              padding: '10px 6px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 3,
              background: on ? C.cyan : C.card, color: on ? C.ink : C.text, border: `1.5px solid ${on ? C.cyan : 'rgba(160,220,255,0.18)'}`,
              fontFamily: 'var(--font-mono)',
            }}>
              <span style={{fontSize: 11, opacity: 0.8}}>{t.label}</span>
              <span style={{fontSize: 13}}>{fmt(basePrice - t.discount)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function BulkPricing({basePrice, productType, extraQty = 0}: {basePrice: number; productType: string; extraQty?: number}) {
  const {cart} = useCart();
  const totalQty = cart
    .filter((it) => it.productType.toLowerCase() === productType.toLowerCase())
    .reduce((s, it) => s + it.qty, 0) + extraQty;
  const tiers = productType.toLowerCase() === 'prerolls' ? PREROLL_BULK_TIERS : BULK_TIERS;
  return <TierChips tiers={tiers} activeDiscount={getBulkDiscount(Math.max(1, totalQty), productType)} basePrice={basePrice} unit="unit" />;
}

export function FlowerBulkPricing({basePrice, extraQty = 0}: {basePrice: number; extraQty?: number}) {
  const {cart} = useCart();
  const cartPQty = cart
    .filter((it) => isFlowerBulkType(it.productType) && isPVariant(it.variantTitle))
    .reduce((s, it) => s + it.qty, 0);
  return <TierChips tiers={FLOWER_BULK_TIERS} activeDiscount={getFlowerBulkDiscount(Math.max(1, cartPQty + extraQty))} basePrice={basePrice} unit="P" />;
}
