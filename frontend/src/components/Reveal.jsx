import { motion, useInView } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

export function Reveal({ children, delay = 0, y = 30, ...rest }) {
  return (
    <motion.div initial={{ opacity: 0, y }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: .7, delay, ease: [0.2, 0.7, 0.2, 1] }} {...rest}>
      {children}
    </motion.div>
  );
}

export function Counter({ to, prefix = '', suffix = '', decimals = 0 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const fmt = (n) => n.toLocaleString('en-KE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return <span ref={ref}>{prefix}<AnimatedNumber value={inView ? to : 0} format={fmt} duration={1600} />{suffix}</span>;
}

// Tweens a number whenever it changes (used for live totals). A timer guarantees the
// final value is shown even when animation frames are throttled (e.g. background tabs).
export function AnimatedNumber({ value, format = (n) => Math.round(n).toLocaleString('en-KE'), duration = 600 }) {
  const [v, setV] = useState(value);
  const shown = useRef(value);
  useEffect(() => {
    const from = shown.current;
    if (from === value) return;
    const start = performance.now();
    let raf;
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const next = from + (value - from) * (1 - (1 - t) ** 3);
      shown.current = next; setV(next);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    const done = setTimeout(() => { cancelAnimationFrame(raf); shown.current = value; setV(value); }, duration + 50);
    return () => { cancelAnimationFrame(raf); clearTimeout(done); };
  }, [value, duration]);
  return <>{format(v)}</>;
}

export const Page = ({ children, className = '' }) => (
  <motion.main className={`page ${className}`} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0, transition: { duration: .45, ease: [0.2, 0.7, 0.2, 1] } }} exit={{ opacity: 0, transition: { duration: .18 } }}>
    {children}
  </motion.main>
);
