import {useState, useEffect, useRef} from 'react';
import {originalVideoUrls} from '~/lib/video-utils';
import {useLoaderData, Link} from 'react-router';
import type {Route} from './+types/product.$id';
import {getProductByHandle, getAllProducts, fmt} from '~/lib/shopify-products';
import type {ShopifyVariant, MediaItem} from '~/lib/shopify-products';
import {useCart, BULK_TYPES, isFlowerBulkType, getFlowerBulkDiscount, isPVariant} from '~/lib/cart-context';
import {BulkPricing, FlowerBulkPricing} from '~/components/BulkPricing';
import {ProductCard, cardLabels, metaLine, strainColor} from '~/components/ProductCard';
import {findShelf} from '~/lib/shelves';
import {C, GEM_CLIP, artBackground, gemBackground} from '~/lib/theme';

export async function loader({params, context}: Route.LoaderArgs) {
  const [product, allProducts] = await Promise.all([
    getProductByHandle(context, params.id!),
    getAllProducts(context),
  ]);
  if (!product) throw new Response('Not found', {status: 404});
  const related = allProducts
    .filter((p) => p.handle !== product.handle && p.productType === product.productType)
    .slice(0, 3);
  return {product, related};
}

export function meta({data}: Route.MetaArgs) {
  return [{title: data?.product ? `${data.product.title} — Diamond Packs` : 'Diamond Packs'}];
}

// ── Media renderers ──────────────────────────────────────────────────────────

function pickMp4(sources: Array<{url: string; mimeType: string}>, prefer: 'small' | 'large' | 'mid' = 'mid') {
  const mp4s = sources.filter((s) => s.mimeType === 'video/mp4');
  if (!mp4s.length) return sources[0];
  if (prefer === 'small') return mp4s[mp4s.length - 1];
  if (prefer === 'large') return mp4s[0];
  return mp4s[Math.floor(mp4s.length / 2)];
}


function PDPVideo({sources, previewUrl, lightbox}: {sources: Array<{url: string; mimeType: string}>; previewUrl?: string; lightbox?: boolean}) {
  const ref = useRef<HTMLVideoElement>(null);
  const candidates = [...originalVideoUrls(previewUrl), pickMp4(sources, 'large')?.url].filter(Boolean) as string[];
  const [srcIdx, setSrcIdx] = useState(0);
  const src = candidates[srcIdx];

  useEffect(() => {
    const v = ref.current;
    if (!v || lightbox) return;
    v.play().catch(() => {});
  }, [src, lightbox]);

  const handleError = () => {
    if (srcIdx < candidates.length - 1) setSrcIdx((i) => i + 1);
  };

  if (lightbox) {
    return (
      <video
        key={src}
        src={src}
        controls
        autoPlay
        onError={handleError}
        style={{maxWidth: '100%', maxHeight: '85vh', display: 'block'}}
      />
    );
  }
  return (
    <video
      ref={ref}
      key={src}
      src={src}
      muted
      loop
      playsInline
      preload="auto"
      onError={handleError}
      style={{width: '100%', height: '100%', objectFit: 'cover', display: 'block'}}
    />
  );
}

function MediaSlide({item, cover = true}: {item: MediaItem; cover?: boolean}) {
  const fill: React.CSSProperties = {
    width: '100%', height: '100%', display: 'block',
    objectFit: cover ? 'cover' : 'contain',
  };
  if (item.type === 'image') {
    return <img src={item.url} style={fill} onError={(e) => { e.currentTarget.style.display = 'none'; }} />;
  }
  if (item.type === 'video') {
    return <PDPVideo sources={item.sources} previewUrl={item.previewUrl} lightbox={!cover} />;
  }
  if (item.type === 'external_video') {
    if (!cover) {
      return (
        <iframe
          src={item.embeddedUrl}
          style={{width: 'min(90vw, 900px)', height: 'min(50vw, 506px)', border: 'none', display: 'block'}}
          allowFullScreen
        />
      );
    }
    return (
      <div style={{position: 'relative', width: '100%', height: '100%'}}>
        {item.previewUrl && <img src={item.previewUrl} style={fill} />}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.18)',
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'rgba(255,255,255,0.92)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            paddingLeft: 4, fontFamily: 'var(--font-display)', fontSize: 18,
          }}>▶</div>
        </div>
      </div>
    );
  }
  return null;
}

function Thumb({item, active, onClick}: {item: MediaItem; active: boolean; onClick: () => void}) {
  const fill: React.CSSProperties = {width: '100%', height: '100%', objectFit: 'cover', display: 'block'};
  return (
    <div
      onClick={onClick}
      style={{
        aspectRatio: '1 / 1',
        width: '100%',
        flexShrink: 0,
        cursor: 'pointer',
        overflow: 'hidden',
        position: 'relative',
        border: `2px solid ${active ? C.cyan : 'rgba(160,220,255,0.15)'}`,
        transition: 'border-color 0.12s',
      }}>
      {item.type === 'image' && <img src={item.url} style={fill} onError={(e) => { e.currentTarget.style.display = 'none'; }} />}
      {item.type === 'video' && (
        <>
          {item.previewUrl
            ? <img src={item.previewUrl} style={fill} />
            : <div style={{width: '100%', height: '100%', background: 'var(--card)'}} />}
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width: 22, height: 22, borderRadius: '50%',
              background: 'rgba(255,255,255,0.9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              paddingLeft: 2, fontSize: 9,
            }}>▶</div>
          </div>
        </>
      )}
      {item.type === 'external_video' && (
        <>
          {item.previewUrl && <img src={item.previewUrl} style={fill} />}
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width: 22, height: 22, borderRadius: '50%',
              background: 'rgba(255,255,255,0.9)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              paddingLeft: 2, fontSize: 9,
            }}>▶</div>
          </div>
        </>
      )}
    </div>
  );
}

function Lightbox({
  media,
  startIndex,
  onClose,
}: {
  media: MediaItem[];
  startIndex: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(startIndex);
  const current = media[idx];

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') setIdx((i) => Math.max(0, i - 1));
      if (e.key === 'ArrowRight') setIdx((i) => Math.min(media.length - 1, i + 1));
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [media.length, onClose]);

  const lbBtn: React.CSSProperties = {
    width: 48, height: 48,
    background: 'rgba(255,255,255,0.08)', color: '#fff',
    border: '1px solid rgba(255,255,255,0.2)',
    fontFamily: 'var(--font-display)', fontSize: 22,
    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.94)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 999,
      }}>
      <button
        onClick={onClose}
        style={{...lbBtn, position: 'absolute', top: 20, right: 20, fontSize: 16}}>
        ✕
      </button>

      {media.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); setIdx((i) => Math.max(0, i - 1)); }}
          style={{
            ...lbBtn, position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)',
            opacity: idx === 0 ? 0.3 : 1,
          }}>
          ‹
        </button>
      )}

      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 'min(90vw, 1100px)', maxHeight: '90vh',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
        {current && <MediaSlide item={current} cover={false} />}
      </div>

      {media.length > 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); setIdx((i) => Math.min(media.length - 1, i + 1)); }}
          style={{
            ...lbBtn, position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)',
            opacity: idx === media.length - 1 ? 0.3 : 1,
          }}>
          ›
        </button>
      )}

      {media.length > 1 && (
        <div style={{position: 'absolute', bottom: 24, display: 'flex', gap: 7}}>
          {media.map((_, i) => (
            <span
              key={i}
              onClick={(e) => { e.stopPropagation(); setIdx(i); }}
              style={{
                width: 8, height: 8, borderRadius: '50%',
                background: i === idx ? '#fff' : 'rgba(255,255,255,0.3)',
                cursor: 'pointer', display: 'block',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

const mono = (size: number, color: string = C.text): React.CSSProperties => ({fontFamily: 'var(--font-mono)', fontSize: size, color});
const label: React.CSSProperties = {...mono(11, C.dim), letterSpacing: '0.14em'};
const cell: React.CSSProperties = {background: C.card2, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 6};
const arrowBtn: React.CSSProperties = {position: 'absolute', top: '50%', marginTop: -22, width: 44, height: 44, border: 'none', background: 'rgba(6,7,10,0.7)', color: C.text, fontWeight: 800, fontSize: 22, cursor: 'pointer', zIndex: 3};
const qtyBtn: React.CSSProperties = {width: 48, height: '100%', border: 'none', background: 'transparent', color: C.text, fontWeight: 800, fontSize: 20, cursor: 'pointer'};

export default function ProductPage() {
  const {product, related} = useLoaderData<typeof loader>();
  const {addToCart, cart} = useCart();
  const [selected, setSelected] = useState<ShopifyVariant>(product.variants[0]);
  const [qty, setQty] = useState(1);
  const [qtyInput, setQtyInput] = useState('1');
  const [activeMedia, setActiveMedia] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  function commitQty(raw: string) {
    const v = parseInt(raw, 10);
    const clamped = isNaN(v) || v < 1 ? 1 : v > 9999 ? 9999 : v;
    setQty(clamped);
    setQtyInput(String(clamped));
  }
  function stepQty(delta: number) {
    const next = Math.min(9999, Math.max(1, qty + delta));
    setQty(next);
    setQtyInput(String(next));
  }

  const media = product.media;
  const currentMedia = media[activeMedia] ?? null;
  const hasMultiple = media.length > 1;
  const hasVariants = !(product.variants.length === 1 && product.variants[0].title === 'Default Title');
  const isFlowerBulk = isFlowerBulkType(product.productType);
  const isBulk = BULK_TYPES.includes(product.productType.toLowerCase()) || isFlowerBulk;

  // live discounted price for P-variants (same logic as before)
  const cartPQty = isFlowerBulk
    ? cart.filter((it) => isFlowerBulkType(it.productType) && isPVariant(it.variantTitle)).reduce((s, it) => s + it.qty, 0)
    : 0;
  const flowerDiscount = isFlowerBulk ? getFlowerBulkDiscount(cartPQty + (isPVariant(selected.title) ? qty : 0)) : 0;

  const shelf = findShelf(product.productType);
  const backHref = shelf ? (shelf.id === 'all' ? '/menu' : `/menu/${shelf.id}`) : '/menu';
  const badges = cardLabels(product, 3);
  const gutter = 'clamp(16px,4vw,56px)';

  return (
    <section style={{padding: `clamp(20px,3vw,40px) ${gutter} 0`, display: 'flex', flexDirection: 'column', gap: 20}}>
      <Link to={backHref} style={{...mono(12), color: C.cyan, letterSpacing: '0.12em', alignSelf: 'flex-start'}}>← BACK TO THE CASE</Link>

      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,360px),1fr))', gap: 'clamp(20px,3vw,40px)', alignItems: 'start'}}>
        {/* Media */}
        <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
          <div
            onClick={() => media.length > 0 && setLightboxOpen(true)}
            style={{position: 'relative', aspectRatio: '1 / 1', background: artBackground(product.palette, activeMedia), overflow: 'hidden', border: `1px solid ${C.line}`, cursor: media.length > 0 ? 'zoom-in' : 'default'}}>
            {currentMedia ? (
              <MediaSlide item={currentMedia} />
            ) : (
              <div style={{position: 'absolute', left: '50%', top: '52%', width: '32%', aspectRatio: '1 / 1', transform: 'translate(-50%,-50%)', clipPath: GEM_CLIP, background: gemBackground(product.palette)}} />
            )}
            <span style={{position: 'absolute', right: 20, top: 16, fontSize: 26, color: '#fff', textShadow: '0 0 14px #fff', zIndex: 2, pointerEvents: 'none'}}>✦</span>
            {hasMultiple && (
              <>
                <button onClick={(e) => { e.stopPropagation(); setActiveMedia((i) => (i - 1 + media.length) % media.length); }} style={{...arrowBtn, left: 12}} aria-label="Previous">‹</button>
                <button onClick={(e) => { e.stopPropagation(); setActiveMedia((i) => (i + 1) % media.length); }} style={{...arrowBtn, right: 12}} aria-label="Next">›</button>
                <span style={{position: 'absolute', right: 12, bottom: 12, padding: '4px 8px', background: 'rgba(6,7,10,0.75)', ...mono(12), letterSpacing: '0.1em', zIndex: 3}}>
                  {String(activeMedia + 1).padStart(2, '0')} / {String(media.length).padStart(2, '0')}
                </span>
              </>
            )}
          </div>
          {hasMultiple && (
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8}}>
              {media.map((m, i) => <Thumb key={i} item={m} active={i === activeMedia} onClick={() => setActiveMedia(i)} />)}
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{display: 'flex', flexDirection: 'column', gap: 18}}>
          {badges.length > 0 && (
            <div style={{display: 'flex', gap: 6, flexWrap: 'wrap'}}>
              {badges.map((b) => <span key={b.label} style={{...mono(11, C.black), letterSpacing: '0.08em', padding: '4px 8px', background: b.bg}}>{b.label}</span>)}
            </div>
          )}
          <h1 style={{margin: 0, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(32px,4.4vw,56px)', lineHeight: 0.95, letterSpacing: '-0.03em', textTransform: 'uppercase'}}>{product.title}</h1>
          <div style={{display: 'flex', alignItems: 'center', gap: 8, ...mono(12, C.muted), letterSpacing: '0.12em'}}>
            <span style={{width: 9, height: 9, borderRadius: '50%', background: strainColor(product)}} />
            {[metaLine(product), product.grade].filter(Boolean).join(' · ')}
          </div>

          {product.descriptionHtml && (
            <div className="dp-prose" style={{fontSize: 16, lineHeight: 1.6, color: C.muted, textWrap: 'pretty'}} dangerouslySetInnerHTML={{__html: product.descriptionHtml}} />
          )}

          {(product.nose.length > 0 || product.effects.length > 0) && (
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 1, background: C.line, border: `1px solid ${C.line}`}}>
              {product.nose.length > 0 && <div style={cell}><span style={{...mono(10, C.dim), letterSpacing: '0.14em'}}>NOSE</span><span style={{fontWeight: 700, fontSize: 14}}>{product.nose.join(' · ')}</span></div>}
              {product.effects.length > 0 && <div style={cell}><span style={{...mono(10, C.dim), letterSpacing: '0.14em'}}>EFFECTS</span><span style={{fontWeight: 700, fontSize: 14}}>{product.effects.join(' · ')}</span></div>}
            </div>
          )}

          {hasVariants && (
            <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
              <span style={label}>WEIGHT</span>
              <div style={{display: 'grid', gridTemplateColumns: `repeat(${Math.min(product.variants.length, 4)}, minmax(0, 1fr))`, gap: 8}}>
                {product.variants.map((v) => {
                  const on = selected.id === v.id;
                  return (
                    <button key={v.id} disabled={!v.available} onClick={() => { setSelected(v); setQty(1); setQtyInput('1'); }} style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '12px 4px', cursor: v.available ? 'pointer' : 'not-allowed',
                      opacity: v.available ? 1 : 0.4, border: `1.5px solid ${on ? C.cyan : 'rgba(160,220,255,0.18)'}`, background: on ? C.cyan : C.card, color: on ? C.ink : C.text,
                    }}>
                      <span style={{fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15}}>{v.title}</span>
                      <span style={{...mono(12, on ? C.ink : C.text)}}>
                        {isFlowerBulk && isPVariant(v.title) && flowerDiscount > 0 ? fmt(v.price - flowerDiscount) : fmt(v.price)}
                      </span>
                      {!v.available && <span style={mono(9, C.dim)}>SOLD OUT</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{display: 'flex', gap: 10, flexWrap: 'wrap'}}>
            <div style={{display: 'flex', alignItems: 'center', border: '1.5px solid rgba(160,220,255,0.25)', height: 54}}>
              <button onClick={() => stepQty(-1)} style={qtyBtn} aria-label="Decrease">−</button>
              <input
                type="number" min={1} max={9999} value={qtyInput}
                onChange={(e) => setQtyInput(e.target.value)} onBlur={(e) => commitQty(e.target.value)}
                style={{width: 48, textAlign: 'center', background: 'transparent', border: 'none', outline: 'none', ...mono(18), MozAppearance: 'textfield'}}
              />
              <button onClick={() => stepQty(1)} style={qtyBtn} aria-label="Increase">+</button>
            </div>
            <button className="dp-bright" onClick={() => addToCart(product, selected, qty)} disabled={!selected.available} style={{
              flex: 1, minWidth: 200, height: 54, border: 'none', background: selected.available ? C.cyan : '#2A3340', color: C.ink, fontWeight: 800, fontSize: 14,
              letterSpacing: '0.06em', cursor: selected.available ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            }}>
              {selected.available ? 'PUT ON THE SCALE' : 'SOLD OUT'}
              {selected.available && <span style={{fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 400}}>· {fmt(selected.price * qty)}</span>}
            </button>
          </div>

          {isBulk && !isFlowerBulk && <BulkPricing basePrice={product.variants[0].price} productType={product.productType} extraQty={qty} />}
          {isFlowerBulk && isPVariant(selected.title) && <FlowerBulkPricing basePrice={selected.price} extraQty={qty} />}

          <div style={{...mono(11, C.dim), letterSpacing: '0.08em', paddingTop: 14, borderTop: `1px solid ${C.line}`}}>NO PAYMENT PROCESSED ON-SITE · ORDERS HANDLED BY YOUR REP</div>
        </div>
      </div>

      {related.length > 0 && (
        <div style={{display: 'flex', flexDirection: 'column', gap: 22, marginTop: 'clamp(24px,4vw,48px)'}}>
          <h2 style={{margin: 0, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(22px,3vw,34px)', letterSpacing: '-0.02em', textTransform: 'uppercase'}}>You might also like</h2>
          <div className="dp-grid">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}

      {lightboxOpen && <Lightbox media={media} startIndex={activeMedia} onClose={() => setLightboxOpen(false)} />}
    </section>
  );
}
