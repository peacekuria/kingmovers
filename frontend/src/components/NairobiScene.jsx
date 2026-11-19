import { useMemo } from 'react';

// Hand-drawn, animated Nairobi skyline. Used as the hero backdrop and as the
// fallback for any video tile whose footage is missing.
const TOWERS = [
  [40, 120, 26], [72, 180, 34], [112, 140, 28], [146, 230, 30], [182, 160, 40], [230, 270, 22], // KICC-like at index 5
  [262, 200, 36], [306, 300, 30], [344, 170, 44], [396, 240, 32], [436, 150, 28], [470, 320, 34],
  [512, 190, 38], [558, 260, 30], [596, 140, 40], [644, 220, 32], [684, 170, 30], [722, 280, 36],
  [766, 150, 34], [808, 210, 30], [846, 130, 40], [894, 240, 30], [932, 160, 36], [976, 190, 28],
];

function rand(seed) { let s = seed; return () => (s = (s * 9301 + 49297) % 233280) / 233280; }

export default function NairobiScene({ variant = 'dusk', trucks = true, className = '' }) {
  const night = variant === 'night' || variant === 'dusk';
  const windows = useMemo(() => {
    const r = rand(7); const out = [];
    TOWERS.forEach(([x, h, w], i) => {
      if (i === 5) return;
      for (let y = 560 - h + 12; y < 548; y += 14)
        for (let wx = x + 5; wx < x + w - 5; wx += 8) if (r() > 0.55) out.push({ x: wx, y, d: (r() * 4).toFixed(2), lit: r() > 0.85 });
    });
    return out;
  }, []);
  const stars = useMemo(() => { const r = rand(3); return Array.from({ length: 60 }, () => ({ x: r() * 1000, y: r() * 260, s: r() * 1.4 + .3, d: (r() * 3).toFixed(2) })); }, []);
  const tower = variant === 'day' ? '#1d2b45' : variant === 'green' ? '#0f2a20' : '#0b0f1e';
  const win = variant === 'day' ? '#9fc4ef' : '#ffd27a';

  return (
    <div className={`scene sky-${variant} ${className}`} aria-hidden="true">
      {variant !== 'night' && <div className="sun" />}
      {[18, 32, 12].map((top, i) => (
        <div key={i} className="cloud" style={{ top: `${top}%`, width: 120 + i * 60, animationDuration: `${50 + i * 20}s`, animationDelay: `-${i * 15}s` }} />
      ))}
      <svg viewBox="0 0 1000 600" preserveAspectRatio="xMidYMax slice">
        {night && stars.map((s, i) => <circle key={i} className="star" cx={s.x} cy={s.y} r={s.s} fill="#fff" style={{ animationDelay: `${s.d}s` }} />)}
        <g className="bird" fill="none" stroke={night ? '#ffffff66' : '#00000055'} strokeWidth="1.5">
          <path d="M60 140 q6 -6 12 0 q6 -6 12 0" /><path d="M90 128 q5 -5 10 0 q5 -5 10 0" />
        </g>
        {/* Ngong hills silhouette */}
        <path d="M0 470 Q120 400 220 440 T420 420 T620 450 T820 410 T1000 440 V600 H0Z" fill={variant === 'day' ? '#3d5b84' : '#1a1636'} opacity=".6" />
        {TOWERS.map(([x, h, w], i) =>
          i === 5 ? (
            <g key={i} fill={tower}>
              <rect x={x + 2} y={560 - h + 30} width={w - 4} height={h - 30} rx="10" />
              <ellipse cx={x + w / 2} cy={560 - h + 30} rx={w * 0.9} ry="7" />
              <rect x={x + w / 2 - 1.5} y={560 - h} width="3" height="30" />
              <circle cx={x + w / 2} cy={560 - h} r="3" fill="#ff4d4d" className="window-lit" />
            </g>
          ) : (
            <g key={i}>
              <rect x={x} y={560 - h} width={w} height={h} fill={tower} />
              {i % 4 === 1 && <rect x={x + w / 2 - 1} y={560 - h - 18} width="2" height="18" fill={tower} />}
            </g>
          )
        )}
        {windows.map((w, i) => (
          <rect key={i} x={w.x} y={w.y} width="4" height="6" fill={win} opacity={night ? 0.9 : 0.35} className={w.lit ? 'window-lit' : ''} style={{ animationDelay: `${w.d}s` }} />
        ))}
        {/* Acacias */}
        {[[30, 548], [520, 552], [930, 550]].map(([x, y], i) => (
          <g key={i} fill={variant === 'green' ? '#0a1f17' : '#06080f'}>
            <rect x={x + 18} y={y - 26} width="4" height="30" />
            <ellipse cx={x + 20} cy={y - 30} rx="34" ry="8" />
          </g>
        ))}
        {/* Road */}
        <rect x="0" y="560" width="1000" height="40" fill="#05070c" />
        <line x1="0" y1="580" x2="1000" y2="580" stroke="#f5a52455" strokeWidth="2" strokeDasharray="18 16">
          <animate attributeName="stroke-dashoffset" from="0" to="-68" dur="1.2s" repeatCount="indefinite" />
        </line>
        {trucks && (
          <>
            <Truck y={548} dur={14} color="#f5a524" />
            <Truck y={566} dur={20} delay={-8} color="#2fbf71" rev />
            <Truck y={548} dur={17} delay={-11} color="#4f8cff" />
          </>
        )}
      </svg>
    </div>
  );
}

function Truck({ y, dur, delay = 0, color, rev }) {
  // SMIL keeps the motion inside SVG user space, so it scales with the viewBox.
  const [from, to] = rev ? ['1120', '-120'] : ['-120', '1120'];
  return (
    <g>
      <animateTransform attributeName="transform" type="translate" from={`${from} 0`} to={`${to} 0`} dur={`${dur}s`} begin={`${delay}s`} repeatCount="indefinite" />
      <g transform={`translate(0 ${y - 548})${rev ? ' translate(62 0) scale(-1 1)' : ''}`}>
        <rect x="0" y="530" width="44" height="22" rx="3" fill={color} />
        <text x="22" y="545" fontSize="7" textAnchor="middle" fill="#111" fontWeight="800" transform={rev ? 'translate(44 0) scale(-1 1)' : undefined}>SMARTMOVE</text>
        <path d="M44 536 h10 l8 8 v8 h-18z" fill="#e8ecf4" />
        <rect x="47" y="538" width="7" height="5" fill="#7fb2ff" />
        <circle cx="10" cy="553" r="4" fill="#111" /><circle cx="52" cy="553" r="4" fill="#111" />
        <circle cx="62" cy="547" r="1.6" fill="#ffe9a8" />
      </g>
    </g>
  );
}
