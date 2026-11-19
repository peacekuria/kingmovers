import { useId } from 'react';

/**
 * Illustrated KingMoversKenya truck in brand livery (navy box, gold stripe,
 * crown-on-box mark). Cab-over style like the Isuzu/Canter trucks common in Nairobi.
 * size: 'pickup' (1.5T) | 'canter' (3T) | 'truck' (7T)
 */
const SIZES = {
  pickup: { boxW: 190, boxH: 104, rearAxles: 1 },
  canter: { boxW: 250, boxH: 122, rearAxles: 1 },
  truck: { boxW: 310, boxH: 138, rearAxles: 2 },
};

function Wheel({ cx, cy, r = 21, spin }) {
  return (
    <g className={spin ? 'truck-wheel' : undefined} style={{ transformOrigin: `${cx}px ${cy}px` }}>
      <circle cx={cx} cy={cy} r={r} fill="#111827" />
      <circle cx={cx} cy={cy} r={r * 0.58} fill="#cbd5e1" />
      <circle cx={cx} cy={cy} r={r * 0.22} fill="#64748b" />
      {[0, 60, 120].map((a) => (
        <rect key={a} x={cx - 1.4} y={cy - r * 0.55} width="2.8" height={r * 1.1} rx="1.4" fill="#94a3b8" transform={`rotate(${a} ${cx} ${cy})`} />
      ))}
    </g>
  );
}

export default function BrandTruck({ size = 'canter', spin = true, className = '', title }) {
  const { boxW, boxH, rearAxles } = SIZES[size] || SIZES.canter;
  const uid = useId().replace(/:/g, '');
  const ids = { box: `tb${uid}`, gold: `tg${uid}`, glass: `tw${uid}`, cab: `tc${uid}`, mbg: `tm${uid}` };
  const ground = 196;
  const boxX = 14, boxY = ground - 40 - boxH;
  const cabX = boxX + boxW + 6, cabW = 112;
  const W = cabX + cabW + 14;
  const wheelY = ground - 21;
  const frontWheel = cabX + 62;
  const rear = rearAxles === 2 ? [boxX + boxW - 92, boxX + boxW - 44] : [boxX + boxW - 62];
  const s = boxH / 122; // scale for livery text

  return (
    <svg viewBox={`0 0 ${W} 210`} className={`brand-truck ${className}`} role="img" aria-label={title || `KingMoversKenya ${size} moving truck`}>
      <defs>
        <linearGradient id={ids.box} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#173f72" /><stop offset="1" stopColor="#0a2540" />
        </linearGradient>
        <linearGradient id={ids.gold} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ffe08a" /><stop offset="1" stopColor="#e9a000" />
        </linearGradient>
        <linearGradient id={ids.glass} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#bfdbfe" /><stop offset="1" stopColor="#3b82f6" />
        </linearGradient>
        <linearGradient id={ids.cab} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#dfe6ef" />
        </linearGradient>
        <linearGradient id={ids.mbg} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1a4a8a" /><stop offset="1" stopColor="#0a2540" />
        </linearGradient>
      </defs>

      <ellipse cx={W / 2} cy={ground + 4} rx={W / 2 - 10} ry="6" fill="#0a2540" opacity=".12" />

      {/* chassis */}
      <rect x={boxX + 6} y={ground - 44} width={cabX + cabW - boxX - 14} height="10" rx="3" fill="#1f2937" />

      {/* cargo box with livery */}
      <rect x={boxX} y={boxY} width={boxW} height={boxH} rx="7" fill={`url(#${ids.box})`} />
      <rect x={boxX} y={boxY} width={boxW} height="7" rx="3.5" fill="#ffffff" opacity=".08" />
      <rect x={boxX} y={boxY + boxH - 20} width={boxW} height="7" fill={`url(#${ids.gold})`} />
      <rect x={boxX} y={boxY + boxH - 11} width={boxW} height="2" fill="#ffe08a" opacity=".45" />
      {/* rear door seam */}
      <rect x={boxX + 6} y={boxY + 10} width="2" height={boxH - 34} fill="#ffffff" opacity=".1" />

      <g transform={`translate(${boxX + 16 * s} ${boxY + 18 * s}) scale(${s})`}>
        {/* crown-on-box mark */}
        <rect width="54" height="54" rx="13" fill={`url(#${ids.mbg})`} stroke="#ffffff" strokeOpacity=".25" strokeWidth="1.5" />
        <g transform="scale(1.125)">
          <rect x="16" y="22" width="22" height="16" rx="2.5" fill="#fff" />
          <rect x="16" y="22" width="22" height="4" rx="2" fill="#dfe8ff" />
          <rect x="25.5" y="22" width="3" height="7" fill="#9db8ff" />
          <path d="M16.5 19.5 L18 9.5 L22.6 14.6 L27 7.5 L31.4 14.6 L36 9.5 L37.5 19.5 Z" fill={`url(#${ids.gold})`} />
          <g fill="#fff" opacity=".55"><rect x="6" y="25" width="7" height="2" rx="1" /><rect x="4" y="29.5" width="9" height="2" rx="1" /><rect x="7" y="34" width="6" height="2" rx="1" /></g>
        </g>
        <text x="66" y="31" fontFamily="'Playfair Display', Georgia, serif" fontStyle="italic" fontWeight="800" fontSize={size === 'pickup' ? 22 : size === 'canter' ? 27 : 30} fill="#ffffff">KingMovers</text>
        <rect x="67" y="42" width="16" height="1.6" fill={`url(#${ids.gold})`} />
        <text x="89" y="46.5" fontFamily="Inter, sans-serif" fontWeight="700" fontSize="9.5" letterSpacing="4" fill="#9cc0ff">KENYA</text>
        {size !== 'pickup' && (
          <text x="0" y="80" fontFamily="Inter, sans-serif" fontWeight="600" fontSize="11" fill="#ffffff" opacity=".78">
            {size === 'truck' ? 'Vetted crews · Upfront KES pricing · Live GPS' : 'Vetted crews · Live GPS'}
          </text>
        )}
      </g>

      {/* cab-over */}
      <path d={`M${cabX} ${boxY + 26} h${cabW - 34} q14 0 20 12 l14 34 v${ground - 44 - (boxY + 72)} h-${cabW} Z`} fill={`url(#${ids.cab})`} stroke="#cbd5e1" />
      <path d={`M${cabX + cabW - 46} ${boxY + 36} h22 q8 0 12 8 l12 30 h-46 Z`} fill={`url(#${ids.glass})`} />
      <rect x={cabX + 12} y={boxY + 36} width={cabW - 66} height="32" rx="4" fill={`url(#${ids.glass})`} opacity=".9" />
      <rect x={cabX + 8} y={boxY + 78} width={cabW - 22} height="2" fill="#cbd5e1" />
      <rect x={cabX + 52} y={boxY + 84} width="14" height="3" rx="1.5" fill="#94a3b8" />
      {/* gold crown badge on door */}
      <path transform={`translate(${cabX + 18} ${boxY + 88}) scale(.7)`} d="M0 12 L1.5 2 L6.6 7.1 L11 0 L15.4 7.1 L20.5 2 L22 12 Z" fill={`url(#${ids.gold})`} />
      {/* mirror, lights, bumper */}
      <rect x={cabX + cabW - 4} y={boxY + 40} width="5" height="20" rx="2" fill="#334155" />
      <rect x={cabX + cabW - 6} y={ground - 66} width="10" height="9" rx="2" fill="#fde68a" />
      <rect x={cabX + cabW - 18} y={ground - 50} width="26" height="10" rx="3" fill="#334155" />
      <rect x={cabX + 4} y={ground - 50} width={cabW - 26} height="6" rx="3" fill={`url(#${ids.gold})`} opacity=".9" />

      {/* wheel arches + wheels */}
      {[...rear, frontWheel].map((x) => <circle key={`a${x}`} cx={x} cy={wheelY} r="26" fill="#1f2937" />)}
      {[...rear, frontWheel].map((x) => <Wheel key={x} cx={x} cy={wheelY} spin={spin} />)}
    </svg>
  );
}
