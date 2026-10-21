import {useEffect, useRef, useState} from 'react';
import {useLocation, useNavigate, useSearchParams} from 'react-router';
import {C} from '~/lib/theme';

export function SearchBox({height, fontSize, placeholder}: {height: number; fontSize: number; placeholder: string}) {
  const [params] = useSearchParams();
  const {pathname} = useLocation();
  const navigate = useNavigate();
  const urlQ = params.get('q') ?? '';
  const [value, setValue] = useState(urlQ);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // keep the box in sync when the URL changes (e.g. "Clear")
  useEffect(() => { setValue(urlQ); }, [urlQ]);

  function go(v: string) {
    const base = pathname.startsWith('/menu') ? pathname : '/menu';
    const q = v.trim();
    navigate(q ? `${base}?q=${encodeURIComponent(q)}` : base, {replace: pathname.startsWith('/menu')});
  }

  return (
    <label style={{
      display: 'flex', alignItems: 'center', gap: 8, background: C.card,
      border: '1px solid rgba(160,220,255,0.16)', padding: '0 12px', height,
    }}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.dim} strokeWidth="2.5" strokeLinecap="round">
        <circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" />
      </svg>
      <input
        value={value}
        onChange={(e) => {
          const v = e.target.value;
          setValue(v);
          clearTimeout(timer.current);
          timer.current = setTimeout(() => go(v), 280);
        }}
        onKeyDown={(e) => { if (e.key === 'Enter') { clearTimeout(timer.current); go(value); } }}
        placeholder={placeholder}
        aria-label="Search"
        style={{flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none', color: C.text, fontFamily: 'var(--font-body)', fontWeight: 500, fontSize}}
      />
    </label>
  );
}
