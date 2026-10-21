import {useState} from 'react';
import {useNavigate} from 'react-router';
import type {ShopifyProduct} from '~/lib/shopify-products';
import {fmt} from '~/lib/shopify-products';
import {C, GEM_CLIP, STRAIN_META, artBackground, badgeColor, gemBackground, isNewProduct, topVariant} from '~/lib/theme';

export type CardLayout = 'grid' | 'feature' | 'compact' | 'deal';

/** <img> that disappears if the file 404s, so the art underneath shows instead. */
export function SafeImg({src, alt, style}: {src: string; alt: string; style?: React.CSSProperties}) {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      // SSR'd images can fail before hydration, so also check on mount
      ref={(el) => { if (el && el.complete && el.naturalWidth === 0) setFailed(true); }}
      onError={() => setFailed(true)}
      style={style}
    />
  );
}

/** Product photo if there is one, otherwise the design's conic art + gem. */
export function ProductArt({product, gem, style, children}: {product: ShopifyProduct; gem: string; style?: React.CSSProperties; children?: React.ReactNode}) {
  return (
    <div style={{position: 'relative', overflow: 'hidden', background: artBackground(product.palette), ...style}}>
      <div style={{
        position: 'absolute', left: '50%', top: '52%', width: gem, aspectRatio: '1 / 1', transform: 'translate(-50%,-50%)',
        clipPath: GEM_CLIP, background: gemBackground(product.palette),
      }} />
      {product.image && (
        <SafeImg src={product.image} alt="" style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover'}} />
      )}
      {children}
    </div>
  );
}

export function cardLabels(p: ShopifyProduct, max = 3) {
  const labels = [...(isNewProduct(p) ? ['NEW'] : []), ...p.badges];
  return [...new Set(labels)].slice(0, max).map((label) => ({label, bg: badgeColor(label)}));
}

export function metaLine(p: ShopifyProduct) {
  return [p.strain ? STRAIN_META[p.strain].label : null, p.productType].filter(Boolean).join(' · ').toUpperCase();
}
export const strainColor = (p: ShopifyProduct) => (p.strain ? STRAIN_META[p.strain].color : C.dim);

function Badges({product, size, pad}: {product: ShopifyProduct; size: number; pad: string}) {
  return (
    <>
      {cardLabels(product).map((b) => (
        <span key={b.label} style={{fontFamily: 'var(--font-mono)', fontSize: size, letterSpacing: '0.08em', padding: pad, background: b.bg, color: C.black}}>{b.label}</span>
      ))}
    </>
  );
}

function Meta({product, size}: {product: ShopifyProduct; size: number}) {
  return (
    <div style={{display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-mono)', fontSize: size, letterSpacing: '0.08em', color: C.muted}}>
      <span style={{width: 8, height: 8, borderRadius: '50%', background: strainColor(product), flex: 'none'}} />
      {metaLine(product)}
    </div>
  );
}

const display = (size: string | number): React.CSSProperties => ({
  fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: size, textTransform: 'uppercase', lineHeight: 1.1,
});
const base: React.CSSProperties = {background: C.card, border: `1px solid ${C.line}`, cursor: 'pointer'};

export function ProductCard({product, layout = 'grid'}: {product: ShopifyProduct; layout?: CardLayout}) {
  const navigate = useNavigate();
  const open = () => navigate(`/product/${product.handle}`);
  const top = topVariant(product);
  const price = top ? fmt(top.price) : '—';
  const soldOut = !product.variants.some((v) => v.available);

  if (layout === 'feature') {
    return (
      <div className="dp-lift" onClick={open} style={{...base, display: 'flex', flexDirection: 'column'}}>
        <ProductArt product={product} gem="30%" style={{aspectRatio: '16 / 10'}}>
          <span style={{position: 'absolute', right: 16, top: 12, fontSize: 22, color: '#fff', textShadow: '0 0 12px #fff'}}>✦</span>
          <div style={{position: 'absolute', left: 14, top: 14, display: 'flex', gap: 6, flexWrap: 'wrap'}}><Badges product={product} size={11} pad="4px 8px" /></div>
        </ProductArt>
        <div style={{padding: 20, display: 'flex', flexDirection: 'column', gap: 10}}>
          <Meta product={product} size={11} />
          <div style={display('clamp(22px,2.6vw,30px)')}>{product.title}</div>
          {product.short && <div style={{fontSize: 15, lineHeight: 1.5, color: C.muted}}>{product.short}</div>}
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12, marginTop: 6, paddingTop: 14, borderTop: '1px dashed rgba(160,220,255,0.18)'}}>
            <div style={{display: 'flex', flexDirection: 'column', gap: 2}}>
              <span style={{fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', color: C.dim}}>{soldOut ? 'SOLD OUT' : 'UP TO'}</span>
              <span style={{fontFamily: 'var(--font-mono)', fontSize: 26, color: C.cyan}}>{price}</span>
            </div>
            <span style={{height: 44, padding: '0 18px', display: 'flex', alignItems: 'center', background: C.cyan, color: C.ink, fontWeight: 800, fontSize: 13, letterSpacing: '0.06em'}}>VIEW PACK →</span>
          </div>
        </div>
      </div>
    );
  }

  if (layout === 'compact') {
    return (
      <div className="dp-lift" onClick={open} style={{...base, flex: 1, display: 'flex'}}>
        <ProductArt product={product} gem="42%" style={{width: '38%', minHeight: 150, flex: 'none'}} />
        <div style={{flex: 1, minWidth: 0, padding: 16, display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'space-between'}}>
          <div style={{display: 'flex', gap: 6, flexWrap: 'wrap'}}><Badges product={product} size={10} pad="3px 7px" /></div>
          <div style={display(17)}>{product.title}</div>
          <Meta product={product} size={11} />
          <div style={{fontFamily: 'var(--font-mono)', fontSize: 20, color: C.cyan}}>{price}</div>
        </div>
      </div>
    );
  }

  if (layout === 'deal') {
    return (
      <div className="dp-lift dp-lift-ice" onClick={open} style={{...base, display: 'flex', flexDirection: 'column'}}>
        <ProductArt product={product} gem="34%" style={{aspectRatio: '4 / 3'}}>
          <div style={{position: 'absolute', left: 12, top: 12, display: 'flex', gap: 6}}><Badges product={product} size={10} pad="3px 7px" /></div>
        </ProductArt>
        <div style={{padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: 8}}>
          <div style={display(15)}>{product.title}</div>
          <Meta product={product} size={11} />
          <div style={{fontFamily: 'var(--font-mono)', fontSize: 20, color: C.ice}}>{price}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dp-lift" onClick={open} style={{...base, display: 'flex', flexDirection: 'column', minWidth: 0}}>
      <ProductArt product={product} gem="34%" style={{aspectRatio: '4 / 3'}}>
        <div style={{position: 'absolute', left: 10, top: 10, display: 'flex', gap: 5, flexWrap: 'wrap'}}><Badges product={product} size={10} pad="3px 6px" /></div>
      </ProductArt>
      <div style={{padding: 14, display: 'flex', flexDirection: 'column', gap: 8, flex: 1}}>
        <Meta product={product} size={10.5} />
        <div style={display(15)}>{product.title}</div>
        {product.short && <div style={{fontSize: 13, lineHeight: 1.45, color: C.muted}}>{product.short}</div>}
        <div style={{marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 8, paddingTop: 10, borderTop: '1px dashed rgba(160,220,255,0.18)'}}>
          <span style={{fontFamily: 'var(--font-mono)', fontSize: 19, color: soldOut ? C.dim : C.cyan}}>{soldOut ? 'SOLD OUT' : price}</span>
          <span style={{fontWeight: 800, fontSize: 16, color: C.cyan}}>→</span>
        </div>
      </div>
    </div>
  );
}
