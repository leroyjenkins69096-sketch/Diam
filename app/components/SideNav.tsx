import {Link, useLocation, useRouteLoaderData} from 'react-router';
import type {RootLoader} from '~/root';
import {useCart, orderTotals} from '~/lib/cart-context';
import {fmt} from '~/lib/shopify-products';
import {buildShelves, shelfHref} from '~/lib/shelves';
import {C, badgeColor, pad} from '~/lib/theme';
import {BrandMark} from './BrandMark';
import {SearchBox} from './SearchBox';

export function useActiveShelf() {
  const {pathname} = useLocation();
  if (!pathname.startsWith('/menu')) return null;
  return pathname.replace(/^\/menu\/?/, '') || 'all';
}

export function useShelves() {
  const data = useRouteLoaderData<RootLoader>('root');
  return buildShelves(data?.categoryCounts);
}

const navItem = (on: boolean): React.CSSProperties => ({
  display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 42, padding: '0 14px',
  background: on ? C.cyan : 'transparent', color: on ? C.ink : C.text,
  fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: 13, letterSpacing: '0.04em', textTransform: 'uppercase', textDecoration: 'none',
});

export function SideNav() {
  const {pathname} = useLocation();
  const activeShelf = useActiveShelf();
  const shelves = useShelves();
  const {cart, openCart} = useCart();
  const {units, total} = orderTotals(cart);

  const items: [string, string, boolean][] = [
    ['Home', '/', pathname === '/'],
    ['The Case', '/menu', pathname.startsWith('/menu') || pathname.startsWith('/product')],
    ['Q&A', '/faq', pathname === '/faq'],
  ];

  return (
    <aside className="dp-side" style={{
      position: 'fixed', top: 0, left: 0, bottom: 0, width: 256, background: C.panel, borderRight: `1px solid ${C.line}`,
      flexDirection: 'column', gap: 22, padding: '22px 16px 16px', overflowY: 'auto', zIndex: 40,
    }}>
      <div style={{padding: '0 4px'}}><BrandMark stacked /></div>
      <SearchBox height={42} fontSize={13} placeholder="Name, strain, nose, effect" />
      <nav style={{display: 'flex', flexDirection: 'column', gap: 2}}>
        {items.map(([label, to, on], i) => (
          <Link key={to} to={to} className="dp-plain" style={navItem(on)}>
            {label}<span style={{fontFamily: 'var(--font-mono)', fontSize: 12, opacity: 0.7}}>{pad(i + 1)}</span>
          </Link>
        ))}
      </nav>
      <div style={{display: 'flex', flexDirection: 'column', gap: 1}}>
        <div style={{fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.14em', color: C.dim, padding: '0 12px 8px'}}>SHELVES</div>
        {shelves.map((s) => {
          const on = activeShelf === s.id;
          return (
            <Link key={s.id} to={shelfHref(s.id)} className="dp-shelf dp-plain" style={{
              display: 'flex', alignItems: 'center', gap: 10, height: 36, padding: '0 12px', borderLeft: `2px solid ${on ? C.cyan : 'transparent'}`,
              background: on ? 'rgba(138,220,255,0.10)' : 'transparent', color: C.text, fontWeight: 700, fontSize: 13,
            }}>
              <span style={{width: 8, height: 8, borderRadius: '50%', background: s.color, boxShadow: `0 0 8px ${s.color}`, flex: 'none'}} />
              <span style={{flex: 1}}>{s.label}</span>
              {s.badge && (
                <span style={{fontFamily: 'var(--font-mono)', fontSize: 9.5, letterSpacing: '0.08em', padding: '2px 6px', background: badgeColor(s.badge), color: C.black}}>{s.badge}</span>
              )}
              {s.count > 0 && <span style={{fontFamily: 'var(--font-mono)', fontSize: 12, color: C.dim}}>{pad(s.count)}</span>}
            </Link>
          );
        })}
      </div>
      <button className="dp-bright" onClick={openCart} style={{
        marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '14px 16px',
        border: 'none', background: C.cyan, color: C.ink, cursor: 'pointer', flex: 'none',
      }}>
        <span style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4}}>
          <span style={{fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 12}}>ON THE SCALE</span>
          <span style={{fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.06em'}}>{pad(units)} UNITS</span>
        </span>
        <span style={{fontFamily: 'var(--font-mono)', fontSize: 17}}>{fmt(total)}</span>
      </button>
    </aside>
  );
}
