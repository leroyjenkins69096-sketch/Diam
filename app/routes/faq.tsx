import {useState} from 'react';
import type {MetaFunction} from 'react-router';
import React from 'react';

export const meta: MetaFunction = () => [
  {title: 'Q&A — Diamond Packs'},
  {name: 'description', content: 'Frequently asked questions about ordering, shipping, and payment.'},
];

const tierTableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse' as const,
  fontFamily: 'var(--font-mono)',
  fontSize: 12,
  marginTop: 10,
  marginBottom: 16,
};
const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '6px 10px',
  borderBottom: '1px solid var(--border)',
  color: 'var(--fg)',
  letterSpacing: '0.08em',
  fontSize: 10,
};
const tdStyle: React.CSSProperties = {
  padding: '7px 10px',
  borderBottom: '1px solid var(--border)',
  color: 'var(--fg-muted)',
};
const accentTd: React.CSSProperties = {...tdStyle, color: 'var(--accent)', fontWeight: 700};

const bulkPricingAnswer = (
  <div>
    <p style={{marginTop: 0}}>
      Bulk discounts apply automatically when you hit the threshold — no codes needed.
      Discounts stack across the same category but not across categories.
    </p>

    <div style={{fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', color: 'var(--fg)', marginBottom: 4}}>FLOWER — PS ONLY (INDOOR, DEPS, EXOTIC, MIXED LIGHT, ETC.) · DOES NOT APPLY TO QP OR HP</div>
    <table style={tierTableStyle}>
      <thead>
        <tr>
          <th style={thStyle}>QTY (UNITS)</th>
          <th style={thStyle}>DISCOUNT / UNIT</th>
        </tr>
      </thead>
      <tbody>
        <tr><td style={tdStyle}>1 – 4</td><td style={tdStyle}>No discount</td></tr>
        <tr><td style={tdStyle}>5 – 9</td><td style={accentTd}>$50 off / unit</td></tr>
        <tr><td style={tdStyle}>10 – 19</td><td style={accentTd}>$75 off / unit</td></tr>
        <tr><td style={tdStyle}>20+</td><td style={accentTd}>$100 off / unit</td></tr>
      </tbody>
    </table>

    <div style={{fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', color: 'var(--fg)', marginBottom: 4}}>EDIBLES & CARTS (COMBINED PER CATEGORY)</div>
    <table style={tierTableStyle}>
      <thead>
        <tr>
          <th style={thStyle}>QTY (UNITS)</th>
          <th style={thStyle}>DISCOUNT / UNIT</th>
        </tr>
      </thead>
      <tbody>
        <tr><td style={tdStyle}>1 – 9</td><td style={tdStyle}>No discount</td></tr>
        <tr><td style={tdStyle}>10 – 49</td><td style={accentTd}>$1 off / unit</td></tr>
        <tr><td style={tdStyle}>50 – 99</td><td style={accentTd}>$2 off / unit</td></tr>
        <tr><td style={tdStyle}>100+</td><td style={accentTd}>$3 off / unit</td></tr>
      </tbody>
    </table>

    <div style={{fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.12em', color: 'var(--fg)', marginBottom: 4}}>PRE-ROLLS (COMBINED)</div>
    <table style={tierTableStyle}>
      <thead>
        <tr>
          <th style={thStyle}>QTY (UNITS)</th>
          <th style={thStyle}>DISCOUNT / UNIT</th>
        </tr>
      </thead>
      <tbody>
        <tr><td style={tdStyle}>1 – 9</td><td style={tdStyle}>No discount</td></tr>
        <tr><td style={tdStyle}>10 – 49</td><td style={accentTd}>$1 off / unit</td></tr>
        <tr><td style={tdStyle}>50 – 99</td><td style={accentTd}>$2 off / unit</td></tr>
        <tr><td style={tdStyle}>100 – 499</td><td style={accentTd}>$3 off / unit</td></tr>
        <tr><td style={tdStyle}>500+</td><td style={accentTd}>$4 off / unit</td></tr>
      </tbody>
    </table>

    <p style={{marginBottom: 0}}>
      Discounts are applied at checkout and reflected in your cart total before you send your order to the sales rep.
    </p>
  </div>
);

const FAQS: {q: string; a: React.ReactNode}[] = [
  {
    q: 'How do I order?',
    a: 'Put your pack on the scale, then hit Send to my rep. Your order is copied to your clipboard. Paste it to your rep on Telegram and they confirm the rest.',
  },
  {
    q: 'Do you take payment on the site?',
    a: 'No. No payment is processed on-site. Your rep handles payment by Cash App, Zelle, Crypto, CTM or money order.',
  },
  {q: 'How does bulk pricing work?', a: bulkPricingAnswer},
  {
    q: 'What weights do you carry?',
    a: '2OZ, QP (quarter pound), HP (half pound) and LB. Pick the weight on each product page.',
  },
  {
    q: 'How often does the case change?',
    a: "New drops land daily. The Today's Drop shelf shows what just came in; Clearance is priced to move.",
  },
  {
    q: 'When is my rep online?',
    a: '10AM–10PM PST, seven days a week. Find every contact link on our Linktree.',
  },
];

export default function FAQ() {
  const [open, setOpen] = useState(0);
  return (
    <section style={{padding: 'clamp(24px,4vw,48px) clamp(16px,4vw,56px) 0', display: 'flex', flexDirection: 'column', gap: 22, maxWidth: 900}}>
      <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
        <span style={{fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.14em', color: 'var(--accent)'}}>HOW ORDERING WORKS</span>
        <h1 style={{margin: 0, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(34px,5vw,64px)', lineHeight: 0.95, letterSpacing: '-0.03em', textTransform: 'uppercase'}}>Q&amp;A</h1>
      </div>
      <div style={{display: 'flex', flexDirection: 'column', borderTop: '1px solid rgba(160,220,255,0.14)'}}>
        {FAQS.map((f, i) => {
          const on = open === i;
          return (
            <div key={f.q} style={{borderBottom: '1px solid rgba(160,220,255,0.14)'}}>
              <button onClick={() => setOpen(on ? -1 : i)} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 16, padding: '20px 0', border: 'none', background: 'transparent',
                color: 'var(--fg)', cursor: 'pointer', textAlign: 'left',
              }}>
                <span style={{fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--accent)'}}>{String(i + 1).padStart(2, '0')}</span>
                <span style={{flex: 1, fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 'clamp(15px,1.8vw,19px)', textTransform: 'uppercase', lineHeight: 1.2}}>{f.q}</span>
                <span style={{width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(160,220,255,0.3)', fontWeight: 800, fontSize: 16, flex: 'none'}}>{on ? '−' : '+'}</span>
              </button>
              {on && (
                <div style={{padding: '0 48px 22px 42px', fontSize: 15, lineHeight: 1.6, color: 'var(--fg-muted)', textWrap: 'pretty'}}>{f.a}</div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
