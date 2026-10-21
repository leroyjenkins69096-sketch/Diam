import {useRef} from 'react';
import {useLoaderData, Link} from 'react-router';
import type {Route} from './+types/_index';
import {getAllProducts} from '~/lib/shopify-products';
import {ProductCard} from '~/components/ProductCard';
import {useShelves} from '~/components/SideNav';
import {FLOWER_BULK_TIERS} from '~/lib/cart-context';
import {C, badgeColor, pad} from '~/lib/theme';

const DESC = 'Top-shelf flower by the 2OZ, QP, HP and LB. Put your pack on the scale, send it to your rep, and it\'s handled.';

export function meta() {
  return [
    {title: 'Diamond Packs'},
    {name: 'description', content: DESC},
    {property: 'og:title', content: 'Diamond Packs'},
    {property: 'og:description', content: DESC},
    {property: 'og:image', content: '/logo.webp'},
    {property: 'og:type', content: 'website'},
    {name: 'twitter:card', content: 'summary_large_image'},
    {name: 'twitter:title', content: 'Diamond Packs'},
    {name: 'twitter:image', content: '/logo.webp'},
  ];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function loader({context}: Route.LoaderArgs) {
  const allProducts = await getAllProducts(context);
  const products = allProducts.filter((p) => p.variants.some((v) => v.available));

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const todayDrops = shuffle(products.filter((p) => p.publishedAt >= oneDayAgo));
  const weekDrops = shuffle(products.filter((p) => p.publishedAt >= sevenDaysAgo && p.publishedAt < oneDayAgo));
  const specialDeals = shuffle(products.filter((p) => p.productType.toLowerCase() === 'special deals')).slice(0, 4);

  return {products, todayDrops: todayDrops.slice(0, 3), newCount: todayDrops.length, weekDrops: weekDrops.slice(0, 3), specialDeals};
}

const MARQUEE = '✦ NEW DROPS DAILY     ✦ $50 OFF EVERY UNIT AT 5+     ✦ 2OZ · QP · HP · LB     ✦ ORDERS HANDLED BY YOUR REP     ✦ NO PAYMENT ON-SITE     ';

const STEPS = [
  {n: '01', title: 'Build your pack', body: 'Pick weights and quantities from The Case. Bulk savings apply automatically.'},
  {n: '02', title: 'Send to your rep', body: 'Hit Send to my rep. Your order is copied to your clipboard, ready to paste.'},
  {n: '03', title: 'Rep handles the rest', body: 'Paste it in Telegram. Your rep confirms, takes payment off-site and sets up the drop.'},
];

const SPARKLES: [number, number, number, number][] = [[6, 14, 26, 0], [88, 40, 18, 0.8], [22, 82, 16, 1.6], [70, 88, 22, 0.4], [48, 2, 14, 1.2], [96, 74, 12, 2]];

const gutter = 'clamp(16px,4vw,56px)';
const eyebrow = (color: string = C.cyan): React.CSSProperties => ({fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.14em', color});
const h2: React.CSSProperties = {margin: 0, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(26px,3.4vw,42px)', lineHeight: 1, letterSpacing: '-0.02em', textTransform: 'uppercase'};
const section: React.CSSProperties = {padding: `clamp(48px,6vw,80px) ${gutter} 0`, display: 'flex', flexDirection: 'column', gap: 22};
const linkCaps: React.CSSProperties = {fontWeight: 800, fontSize: 13, letterSpacing: '0.06em'};

export default function Index() {
  const {todayDrops, newCount, weekDrops, specialDeals} = useLoaderData<typeof loader>();
  const shelves = useShelves().filter((s) => s.id !== 'all');
  const howRef = useRef<HTMLElement>(null);
  const drops = todayDrops.length > 0 ? todayDrops : weekDrops;
  const dropTitle = todayDrops.length > 0 ? "TODAY'S DROP" : "THIS WEEK'S DROP";
  const [featured, ...rest] = drops;
  const compact = rest.slice(0, 2);
  const bulk = FLOWER_BULK_TIERS.find((t) => t.discount > 0)!;

  return (
    <>
      {/* Hero */}
      <section style={{
        position: 'relative', overflow: 'hidden', padding: `clamp(28px,5vw,64px) ${gutter} clamp(36px,5vw,64px)`, display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,340px),1fr))', gap: 'clamp(28px,4vw,48px)', alignItems: 'center',
      }}>
        <div style={{display: 'flex', flexDirection: 'column', gap: 22, position: 'relative', zIndex: 1}}>
          <div style={eyebrow()}>✦ BULK FLOWER · WEIGHED TO THE GRAM · EST. 2022</div>
          <h1 style={{margin: 0, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(40px,6.2vw,86px)', lineHeight: 0.96, letterSpacing: '-0.03em', textTransform: 'uppercase'}}>
            Weighed.<br />Packed.<br /><span style={{color: C.cyan, textShadow: '0 0 28px rgba(138,220,255,0.45)'}}>Iced out.</span>
          </h1>
          <p style={{margin: 0, maxWidth: 440, fontSize: 17, lineHeight: 1.55, color: C.muted, textWrap: 'pretty'}}>{DESC}</p>
          <div style={{display: 'flex', flexWrap: 'wrap', gap: 12}}>
            <Link to="/menu" className="dp-bright dp-plain" style={{height: 52, padding: '0 26px', display: 'inline-flex', alignItems: 'center', background: C.cyan, color: C.ink, ...linkCaps, fontSize: 14}}>OPEN THE CASE →</Link>
            <button className="dp-outline" onClick={() => {
              const el = howRef.current;
              if (el) window.scrollTo({top: el.getBoundingClientRect().top + window.scrollY - 20, behavior: 'smooth'});
            }} style={{height: 52, padding: '0 26px', border: '1.5px solid rgba(236,247,255,0.3)', background: 'transparent', color: C.text, ...linkCaps, fontSize: 14, cursor: 'pointer'}}>HOW IT WORKS</button>
          </div>
        </div>

        <div style={{position: 'relative', width: '100%', maxWidth: 480, aspectRatio: '1 / 1', justifySelf: 'center'}}>
          <div style={{
            position: 'absolute', inset: '-14%', borderRadius: '50%', background: 'repeating-conic-gradient(rgba(138,220,255,0.13) 0 6deg, transparent 6deg 18deg)',
            WebkitMask: 'radial-gradient(circle, #000 30%, transparent 70%)', mask: 'radial-gradient(circle, #000 30%, transparent 70%)',
          }} />
          <img src="/logo.webp" alt="Diamond Packs logo" style={{
            position: 'absolute', inset: '9%', width: '82%', height: '82%', objectFit: 'cover', borderRadius: '50%', transform: 'rotate(-6deg)',
            boxShadow: `0 0 0 3px ${C.cyan}, 0 0 0 9px ${C.bg}, 0 0 0 10.5px rgba(138,220,255,0.35), 0 0 60px rgba(138,220,255,0.35)`,
          }} />
          <div style={{
            position: 'absolute', right: '2%', top: '4%', width: '26%', aspectRatio: '1 / 1', background: C.ice, color: C.bg, transform: 'rotate(10deg)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 4, boxShadow: '0 10px 24px rgba(0,0,0,0.5)',
          }}>
            <span style={{fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(16px,2.3vw,26px)', lineHeight: 1}}>${bulk.discount}</span>
            <span style={{fontFamily: 'var(--font-mono)', fontSize: 'clamp(8px,0.9vw,10px)', letterSpacing: '0.08em', lineHeight: 1.3}}>OFF EVERY<br />UNIT AT {bulk.min}+</span>
          </div>
          <div style={{
            position: 'absolute', left: 0, bottom: '6%', padding: '10px 14px', background: '#08131A', border: '1.5px solid #2B5A72', transform: 'rotate(-3deg)',
            boxShadow: '0 10px 24px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', gap: 2,
          }}>
            <span style={{fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', color: '#6F9BB3'}}>TODAY'S DROP</span>
            <span style={{fontFamily: 'var(--font-mono)', fontSize: 'clamp(18px,2.2vw,26px)', color: C.cyan}}>{pad(newCount)} NEW · LIVE</span>
          </div>
          {SPARKLES.map(([x, y, sz, d], i) => (
            <span key={i} style={{
              position: 'absolute', left: `${x}%`, top: `${y}%`, fontSize: sz, color: '#fff', textShadow: '0 0 12px #8ADCFF, 0 0 4px #fff',
              animation: `dp-twinkle 2.6s ease-in-out ${d}s infinite`, pointerEvents: 'none',
            }}>✦</span>
          ))}
        </div>
      </section>

      {/* Marquee */}
      <div style={{background: C.cyan, color: C.ink, overflow: 'hidden', padding: '12px 0', fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, letterSpacing: '0.02em'}}>
        <div style={{display: 'flex', width: 'max-content', whiteSpace: 'pre', animation: 'dp-marquee 30s linear infinite'}}>
          {[1, 2].map((k) => <span key={k}>{MARQUEE + MARQUEE}</span>)}
        </div>
      </div>

      {/* 01 Shelves */}
      <section style={section}>
        <div style={{display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap'}}>
          <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
            <span style={eyebrow()}>01 / SHELVES</span>
            <h2 style={h2}>Pick a shelf</h2>
          </div>
          <Link to="/menu" style={linkCaps}>SEE EVERYTHING →</Link>
        </div>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,160px),1fr))', gap: 1, background: C.line, border: `1px solid ${C.line}`}}>
          {shelves.map((t) => (
            <Link key={t.id} to={`/menu/${t.id}`} className="dp-tile dp-plain" style={{
              position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 28, minHeight: 132, padding: 16,
              background: C.card2, color: C.text,
            }}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%'}}>
                <span style={{width: 12, height: 12, borderRadius: '50%', background: t.color, boxShadow: `0 0 14px ${t.color}`}} />
                {t.badge && <span style={{fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em', padding: '3px 7px', background: badgeColor(t.badge), color: C.bg, transform: 'rotate(4deg)'}}>{t.badge}</span>}
              </div>
              <div style={{display: 'flex', flexDirection: 'column', gap: 5}}>
                <span style={{fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, textTransform: 'uppercase', lineHeight: 1.1}}>{t.label}</span>
                <span style={{fontFamily: 'var(--font-mono)', fontSize: 12, color: C.dim}}>{t.count > 0 ? `${pad(t.count)} PACKS →` : 'SEE PACKS →'}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 02 Today's drop */}
      {featured && (
        <section style={section}>
          <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
            <span style={eyebrow()}>02 / {dropTitle}</span>
            <h2 style={h2}>Fresh off the scale</h2>
          </div>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,340px),1fr))', gap: 14}}>
            <ProductCard product={featured} layout="feature" />
            {compact.length > 0 && (
              <div style={{display: 'flex', flexDirection: 'column', gap: 14}}>
                {compact.map((p) => <ProductCard key={p.id} product={p} layout="compact" />)}
              </div>
            )}
          </div>
        </section>
      )}

      {/* 03 Clearance */}
      {specialDeals.length > 0 && (
        <section style={{padding: `clamp(48px,6vw,80px) ${gutter} 0`}}>
          <div style={{background: C.panel, border: '1px solid rgba(230,238,245,0.35)', display: 'flex', flexDirection: 'column'}}>
            <div style={{height: 14, background: `radial-gradient(circle, ${C.ice} 1.4px, transparent 1.9px) 0 0 / 12px 12px`, borderBottom: '1px solid rgba(230,238,245,0.35)'}} />
            <div style={{padding: 'clamp(20px,3vw,36px)', display: 'flex', flexDirection: 'column', gap: 22}}>
              <div style={{display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap'}}>
                <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
                  <span style={eyebrow(C.ice)}>03 / CLEARANCE</span>
                  <h2 style={h2}>Priced to move</h2>
                  <p style={{margin: 0, fontSize: 15, color: C.muted}}>Same ice. Clearing the case for the next drop.</p>
                </div>
                <Link to="/menu/specials" style={{...linkCaps, color: C.ice}}>ALL CLEARANCE →</Link>
              </div>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,230px),1fr))', gap: 14}}>
                {specialDeals.map((p) => <ProductCard key={p.id} product={p} layout="deal" />)}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 04 How it works */}
      <section ref={howRef} style={section}>
        <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
          <span style={eyebrow(C.steel)}>04 / HOW IT WORKS</span>
          <h2 style={h2}>Three steps. No checkout.</h2>
        </div>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(min(100%,240px),1fr))', gap: 1, background: C.line, border: `1px solid ${C.line}`}}>
          {STEPS.map((s) => (
            <div key={s.n} style={{background: C.card2, padding: 24, display: 'flex', flexDirection: 'column', gap: 12}}>
              <span style={{fontFamily: 'var(--font-mono)', fontSize: 44, lineHeight: 1, color: C.cyan}}>{s.n}</span>
              <span style={{fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, textTransform: 'uppercase'}}>{s.title}</span>
              <span style={{fontSize: 15, lineHeight: 1.55, color: C.muted, textWrap: 'pretty'}}>{s.body}</span>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
