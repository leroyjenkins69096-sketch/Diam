import {Link, useLocation} from 'react-router';
import {useCart} from '~/lib/cart-context';
import {C, pad} from '~/lib/theme';
import {BrandMark} from './BrandMark';
import {SearchBox} from './SearchBox';

export function PhoneNav() {
  const {pathname} = useLocation();
  const {cartCount, cartOpen, openCart} = useCart();

  const tabs: [string, string, string, boolean][] = [
    ['HOME', '⌂', '/', pathname === '/'],
    ['THE CASE', '◇', '/menu', pathname.startsWith('/menu') || pathname.startsWith('/product')],
    ['Q&A', '?', '/faq', pathname === '/faq'],
  ];
  const tab = (on: boolean): React.CSSProperties => ({
    position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5,
    border: 'none', borderTop: `2px solid ${on ? C.cyan : 'transparent'}`, background: 'transparent',
    color: on ? C.cyan : C.muted, cursor: 'pointer', textDecoration: 'none',
  });

  return (
    <div className="dp-phone">
      {/* logo + search stick together */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 40, background: 'rgba(6,7,10,0.9)', backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10,
        borderBottom: `1px solid ${C.line}`,
      }}>
        <BrandMark size={38} />
        <SearchBox height={44} fontSize={14} placeholder="Search name, strain, nose, effect" />
      </header>
      <nav style={{
        position: 'fixed', left: 12, right: 12, bottom: 12, zIndex: 60, height: 62, background: 'rgba(13,16,22,0.94)',
        backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', border: '1px solid rgba(160,220,255,0.18)',
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', boxShadow: '0 12px 28px rgba(0,0,0,0.5)',
      }}>
        {tabs.map(([label, glyph, to, on]) => (
          <Link key={to} to={to} className="dp-plain" style={tab(on && !cartOpen)}>
            <span style={{fontFamily: 'var(--font-mono)', fontSize: 15, lineHeight: 1}}>{glyph}</span>
            <span style={{fontWeight: 800, fontSize: 10.5, letterSpacing: '0.08em'}}>{label}</span>
          </Link>
        ))}
        <button onClick={openCart} style={tab(false)}>
          <span style={{fontFamily: 'var(--font-mono)', fontSize: 15, lineHeight: 1, color: cartCount ? C.cyan : C.muted}}>{pad(cartCount)}</span>
          <span style={{fontWeight: 800, fontSize: 10.5, letterSpacing: '0.08em', color: cartCount ? C.cyan : C.muted}}>SCALE</span>
        </button>
      </nav>
    </div>
  );
}
