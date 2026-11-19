import { useId } from 'react';

/**
 * KingMoversKenya brand mark: a gold crown resting on a moving box, with motion
 * lines. "King" + "Movers" in one symbol. `compact` drops the motion lines and
 * enlarges the shapes for tiny sizes (favicons, ≤ 24px).
 */
export function LogoMark({ size = 40, compact = false, title }) {
  const id = useId().replace(/:/g, '');
  const bg = `kmBg${id}`, gold = `kmGold${id}`;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" role={title ? 'img' : undefined} aria-hidden={title ? undefined : true} className="logo-svg">
      {title && <title>{title}</title>}
      <defs>
        <linearGradient id={bg} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1a4a8a" />
          <stop offset=".55" stopColor="#0f2f57" />
          <stop offset="1" stopColor="#0a2540" />
        </linearGradient>
        <linearGradient id={gold} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffe08a" />
          <stop offset="1" stopColor="#e9a000" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill={`url(#${bg})`} />
      <rect x=".75" y=".75" width="46.5" height="46.5" rx="11.25" fill="none" stroke="#ffffff" strokeOpacity=".12" strokeWidth="1.5" />
      {compact ? (
        <>
          <rect x="11" y="23" width="26" height="17" rx="3" fill="#fff" />
          <rect x="11" y="23" width="26" height="4.5" rx="2.5" fill="#dfe8ff" />
          <rect x="22.5" y="23" width="3" height="8" fill="#9db8ff" />
          <path d="M11.5 20.5 L13.2 8.5 L18.6 14.4 L24 6 L29.4 14.4 L34.8 8.5 L36.5 20.5 Z" fill={`url(#${gold})`} />
        </>
      ) : (
        <>
          <g fill="#fff" opacity=".55">
            <rect x="6" y="25" width="7" height="2" rx="1" />
            <rect x="4" y="29.5" width="9" height="2" rx="1" />
            <rect x="7" y="34" width="6" height="2" rx="1" />
          </g>
          <rect x="16" y="22" width="22" height="16" rx="2.5" fill="#fff" />
          <rect x="16" y="22" width="22" height="4" rx="2" fill="#dfe8ff" />
          <rect x="25.5" y="22" width="3" height="7" fill="#9db8ff" />
          <path d="M16.5 19.5 L18 9.5 L22.6 14.6 L27 7.5 L31.4 14.6 L36 9.5 L37.5 19.5 Z" fill={`url(#${gold})`} />
          <circle cx="18" cy="9.3" r="1.5" fill="#ffe08a" />
          <circle cx="27" cy="7.3" r="1.6" fill="#ffe08a" />
          <circle cx="36" cy="9.3" r="1.5" fill="#ffe08a" />
        </>
      )}
    </svg>
  );
}

// Full lockup: mark + italic serif wordmark with a gold-ruled "KENYA" tagline.
export default function Logo({ size = 40 }) {
  return (
    <>
      <LogoMark size={size} />
      <span className="wordmark">
        <span className="wm-name">KingMovers</span>
        <span className="wm-kenya">Kenya</span>
      </span>
    </>
  );
}
