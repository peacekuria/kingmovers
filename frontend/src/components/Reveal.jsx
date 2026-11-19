import { motion, useInView, useMotionValue, animate } from 'framer-motion';
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
  const mv = useMotionValue(0);
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const c = animate(mv, to, { duration: 1.8, ease: 'easeOut', onUpdate: setVal });
    return () => c.stop();
  }, [inView, to, mv]);
  return <span ref={ref}>{prefix}{val.toLocaleString('en-KE', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}</span>;
}

// Smoothly tweens a number whenever it changes (used for live quote totals).
export function AnimatedNumber({ value, format = (n) => Math.round(n).toLocaleString('en-KE') }) {
  const mv = useMotionValue(value);
  const [v, setV] = useState(value);
  useEffect(() => { const c = animate(mv, value, { duration: .6, ease: 'easeOut', onUpdate: setV }); return () => c.stop(); }, [value, mv]);
  return <>{format(v)}</>;
}

export const Page = ({ children, className = '' }) => (
  <motion.main className={`page ${className}`} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: .4 }}>
    {children}
  </motion.main>
);
