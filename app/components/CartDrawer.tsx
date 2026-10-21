import {useEffect, useState} from 'react';
import {Link} from 'react-router';
import {FLOWER_BULK_TIERS, useCart, buildOrderText, getBulkProgress, orderLines, orderTotals} from '~/lib/cart-context';
import {fmt} from '~/lib/shopify-products';
import {C, artBackground, pad} from '~/lib/theme';
import {orderContact} from '~/data/brand';
import {SafeImg} from './ProductCard';

const mono = (size: number, color: string = C.text): React.CSSProperties => ({fontFamily: 'var(--font-mono)', fontSize: size, color});
const stepBtn: React.CSSProperties = {width: 30, height: 30, border: 'none', background: 'transparent', color: C.text, fontWeight: 800, fontSize: 15, cursor: 'pointer'};

type Confirm = {lines: {left: string; right: string}[]; savings: number; total: number; copied: boolean};

export function CartDrawer() {
  const {cart, cartOpen, closeCart, updateQty, removeItem, clearCart} = useCart();
  const [confirm, setConfirm] = useState<Confirm | null>(null);

  const {units, subtotal, savings, total} = orderTotals(cart);
  const progress = getBulkProgress(cart);
  const empty = cart.length === 0;

  // before anything eligible is in the bag, advertise the first flower tier
  const firstTier = FLOWER_BULK_TIERS.find((t) => t.discount > 0)!;
  const barMsg = progress ? progress.message : `Add ${pad(firstTier.min)} units to unlock ${fmt(firstTier.discount).replace('.00', '')} off every unit`;
  const barPct = progress ? progress.pct : 0;
  const barUnlocked = progress?.unlocked ?? false;
  const showBar = empty || progress !== null;

  useEffect(() => {
    if (!confirm) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setConfirm(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [confirm]);

  async function sendToRep() {
    if (empty) return;
    let copied = false;
    try { await navigator.clipboard.writeText(buildOrderText(cart)); copied = true; } catch {
      try {
        const t = document.createElement('textarea');
        t.value = buildOrderText(cart); t.style.position = 'fixed'; t.style.opacity = '0';
        document.body.appendChild(t); t.select(); copied = document.execCommand('copy'); t.remove();
      } catch { copied = false; }
    }
    setConfirm({lines: orderLines(cart), savings, total, copied});
    closeCart();
  }

  return (
    <>
      <div onClick={closeCart} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, transition: 'opacity .2s',
        opacity: cartOpen ? 1 : 0, pointerEvents: cartOpen ? 'auto' : 'none',
      }} />
      <aside style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(440px, 100vw)', background: C.panel, borderLeft: '1px solid rgba(160,220,255,0.18)',
        transform: cartOpen ? 'translateX(0)' : 'translateX(100%)', transition: 'transform .25s cubic-bezier(.4,0,.2,1)', zIndex: 101,
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{padding: '18px 20px', borderBottom: `1px solid ${C.line}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10}}>
          <div style={{display: 'flex', alignItems: 'baseline', gap: 10}}>
            <h2 style={{margin: 0, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18}}>ON THE SCALE</h2>
            <span style={mono(13, C.cyan)}>{pad(units)}</span>
          </div>
          <div style={{display: 'flex', gap: 8}}>
            {!empty && (
              <button onClick={clearCart} style={{height: 34, padding: '0 10px', border: `1px solid ${C.ice}`, background: 'transparent', color: C.ice, fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.08em', cursor: 'pointer'}}>CLEAR</button>
            )}
            <button onClick={closeCart} aria-label="Close" style={{width: 34, height: 34, border: `1px solid ${C.lineStrong}`, background: 'transparent', color: C.text, fontWeight: 800, fontSize: 14, cursor: 'pointer'}}>✕</button>
          </div>
        </div>

        {showBar && (
          <div style={{padding: '14px 20px', borderBottom: `1px solid ${C.line}`, display: 'flex', flexDirection: 'column', gap: 9, background: C.panel2}}>
            <span style={{...mono(12, barUnlocked ? C.cyan : C.text), letterSpacing: '0.04em', textTransform: 'uppercase'}}>{barUnlocked ? '✦ ' : ''}{barMsg}</span>
            <div style={{height: 6, background: 'rgba(160,220,255,0.14)', position: 'relative'}}>
              <div style={{position: 'absolute', left: 0, top: 0, bottom: 0, width: `${barPct}%`, background: C.cyan, boxShadow: '0 0 10px rgba(138,220,255,0.6)', transition: 'width .25s cubic-bezier(.4,0,.2,1)'}} />
            </div>
          </div>
        )}

        <div style={{flex: 1, overflowY: 'auto'}}>
          {empty && (
            <div style={{padding: '64px 22px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center'}}>
              <span style={mono(44, C.cyan)}>0.000 G</span>
              <span style={{color: C.muted, fontSize: 14}}>The scale is empty. Pick something from The Case.</span>
              <Link to="/menu" onClick={closeCart} className="dp-plain" style={{marginTop: 10, height: 44, padding: '0 20px', display: 'inline-flex', alignItems: 'center', border: `1.5px solid ${C.cyan}`, color: C.cyan, fontWeight: 800, fontSize: 13, letterSpacing: '0.06em'}}>OPEN THE CASE →</Link>
            </div>
          )}
          {cart.map((it) => (
            <div key={it.key} style={{padding: '14px 20px', borderBottom: '1px solid rgba(160,220,255,0.10)', display: 'flex', gap: 12}}>
              <div style={{position: 'relative', width: 64, height: 64, flex: 'none', background: artBackground(it.palette), border: `1px solid ${C.line}`, overflow: 'hidden'}}>
                {it.image && <SafeImg src={it.image} alt="" style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover'}} />}
              </div>
              <div style={{flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 5}}>
                <div style={{display: 'flex', justifyContent: 'space-between', gap: 8}}>
                  <span style={{fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, textTransform: 'uppercase', lineHeight: 1.15}}>{it.name}</span>
                  <span style={{...mono(15), whiteSpace: 'nowrap'}}>{fmt(it.price * it.qty)}</span>
                </div>
                <span style={{...mono(12, C.muted), letterSpacing: '0.06em'}}>{it.variantTitle === 'Default Title' ? 'STANDARD' : it.variantTitle} · {fmt(it.price)}/EA</span>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2}}>
                  <div style={{display: 'flex', alignItems: 'center', border: '1px solid rgba(160,220,255,0.22)'}}>
                    <button onClick={() => updateQty(it.key, it.qty - 1)} style={stepBtn} aria-label="Decrease">−</button>
                    <span style={{padding: '0 10px', ...mono(13)}}>{pad(it.qty)}</span>
                    <button onClick={() => updateQty(it.key, it.qty + 1)} style={stepBtn} aria-label="Increase">+</button>
                  </div>
                  <button onClick={() => removeItem(it.key)} style={{border: 'none', background: 'none', color: C.dim, fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.06em', textDecoration: 'underline', cursor: 'pointer'}}>REMOVE</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{borderTop: `1px solid ${C.line}`, padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: 8}}>
          <div style={{display: 'flex', justifyContent: 'space-between', ...mono(13, C.muted)}}><span>SUBTOTAL</span><span>{fmt(subtotal)}</span></div>
          <div style={{display: 'flex', justifyContent: 'space-between', ...mono(13, C.cyan)}}><span>BULK SAVINGS</span><span>−{fmt(savings)}</span></div>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: 10, borderTop: '1px dashed rgba(160,220,255,0.2)'}}>
            <span style={{fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 14}}>TOTAL</span>
            <span style={mono(22, C.cyan)}>{fmt(total)}</span>
          </div>
          <button className="dp-bright" onClick={sendToRep} disabled={empty} style={{
            marginTop: 8, height: 54, border: 'none', background: empty ? '#2A3340' : C.cyan, color: C.ink, fontWeight: 800, fontSize: 14,
            letterSpacing: '0.06em', cursor: empty ? 'not-allowed' : 'pointer',
          }}>SEND TO MY REP →</button>
          <span style={{...mono(10.5, C.dim), letterSpacing: '0.08em', textAlign: 'center'}}>NO PAYMENT PROCESSED ON-SITE</span>
        </div>
      </aside>

      {confirm && (
        <div onClick={() => setConfirm(null)} style={{position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16}}>
          <div onClick={(e) => e.stopPropagation()} style={{
            width: 'min(460px, 100%)', maxHeight: 'calc(100vh - 32px)', overflowY: 'auto', background: C.panel, border: `1px solid ${C.cyan}`,
            boxShadow: '0 0 0 6px rgba(138,220,255,0.08), 0 24px 60px rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column',
          }}>
            <div style={{height: 10, background: `radial-gradient(circle, ${C.cyan} 1.3px, transparent 1.8px) 0 0 / 10px 10px`}} />
            <div style={{padding: 24, display: 'flex', flexDirection: 'column', gap: 16}}>
              <span style={{...mono(12, C.cyan), letterSpacing: '0.14em'}}>{confirm.copied ? '✦ COPIED TO CLIPBOARD' : 'COPY BLOCKED BY BROWSER · SCREENSHOT THIS INSTEAD'}</span>
              <h2 style={{margin: 0, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 28, lineHeight: 1}}>ORDER COPIED.</h2>
              <p style={{margin: 0, fontSize: 15, lineHeight: 1.5, color: C.muted}}>Paste it into Telegram and send it to your rep. They confirm the order and handle payment off-site.</p>
              <div style={{background: C.panel2, border: '1px dashed rgba(160,220,255,0.25)', padding: 14, display: 'flex', flexDirection: 'column', gap: 6, ...mono(12.5)}}>
                {confirm.lines.map((l, i) => (
                  <div key={i} style={{display: 'flex', justifyContent: 'space-between', gap: 10}}><span>{l.left}</span><span style={{whiteSpace: 'nowrap'}}>{l.right}</span></div>
                ))}
                <div style={{display: 'flex', justifyContent: 'space-between', gap: 10, color: C.cyan, paddingTop: 6, borderTop: '1px dashed rgba(160,220,255,0.2)'}}><span>BULK SAVINGS</span><span>−{fmt(confirm.savings)}</span></div>
                <div style={{display: 'flex', justifyContent: 'space-between', gap: 10, color: C.cyan, fontSize: 15}}><span>TOTAL</span><span>{fmt(confirm.total)}</span></div>
              </div>
              <a href={orderContact.url} target="_blank" rel="noopener noreferrer" className="dp-plain" style={{height: 54, display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.cyan, color: C.ink, fontWeight: 800, fontSize: 14, letterSpacing: '0.06em'}}>OPEN {orderContact.label.toUpperCase()} →</a>
              <button onClick={() => setConfirm(null)} style={{height: 46, border: '1.5px solid rgba(236,247,255,0.3)', background: 'transparent', color: C.text, fontWeight: 800, fontSize: 13, letterSpacing: '0.06em', cursor: 'pointer'}}>BACK TO THE CASE</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
