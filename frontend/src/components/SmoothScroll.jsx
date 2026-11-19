import { useEffect } from 'react';
import Lenis from 'lenis';

let lenis = null;

// Inertial wheel/trackpad scrolling on desktop. Touch devices keep native
// momentum scrolling, and users who prefer reduced motion get plain scrolling.
export default function SmoothScroll() {
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(pointer: fine)').matches;
    if (reduced || !finePointer) return;
    lenis = new Lenis({ duration: 1.05, easing: (t) => 1 - Math.pow(1 - t, 3), smoothWheel: true, anchors: true });
    let id;
    const raf = (time) => { lenis?.raf(time); id = requestAnimationFrame(raf); };
    id = requestAnimationFrame(raf);
    return () => { cancelAnimationFrame(id); lenis?.destroy(); lenis = null; };
  }, []);
  return null;
}

export function scrollToTop() {
  if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
  else window.scrollTo(0, 0);
}

export function setScrollLocked(locked) {
  document.documentElement.style.overflow = locked ? 'hidden' : '';
  if (lenis) locked ? lenis.stop() : lenis.start();
}
