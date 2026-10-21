import {Link} from 'react-router';
import {C} from '~/lib/theme';

/** Round logo + wordmark. `stacked` = sidebar (two lines + tagline), otherwise inline (phone header). */
export function BrandMark({size = 50, stacked = false}: {size?: number; stacked?: boolean}) {
  return (
    <Link to="/" className="dp-plain" style={{display: 'flex', alignItems: 'center', gap: stacked ? 12 : 10, cursor: 'pointer', color: C.text}}>
      <img
        src="/logo.webp"
        alt="Diamond Packs"
        style={{
          width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0,
          boxShadow: stacked ? `0 0 0 1.5px ${C.cyan}, 0 0 18px rgba(138,220,255,0.35)` : `0 0 0 1.5px ${C.cyan}`,
        }}
      />
      {stacked ? (
        <div style={{display: 'flex', flexDirection: 'column', gap: 5}}>
          <div style={{fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, lineHeight: 1, letterSpacing: '-0.01em'}}>DIAMOND<br />PACKS</div>
          <div style={{fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', color: C.dim}}>BULK · SEALED · ICED</div>
        </div>
      ) : (
        <div style={{fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 15, letterSpacing: '-0.01em'}}>DIAMOND PACKS</div>
      )}
    </Link>
  );
}
