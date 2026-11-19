import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Plays an optional video over a photo; silently keeps the photo if the file is missing.
function OptionalVideo({ src, poster }) {
  const [ok, setOk] = useState(true);
  if (!src || !ok) return null;
  return <video src={src} poster={poster} autoPlay muted loop playsInline preload="none" onError={() => setOk(false)} />;
}

export function HeroSlideshow({ slides, interval = 7000 }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % slides.length), interval);
    return () => clearInterval(t);
  }, [slides.length, interval]);
  // Preload the next slide so the crossfade never flashes.
  useEffect(() => { const img = new Image(); img.src = slides[(i + 1) % slides.length].img; }, [i, slides]);
  const s = slides[i];
  return (
    <>
      <AnimatePresence initial={false}>
        <motion.div key={s.img} className="slide" style={{ backgroundImage: `url(${s.img})` }}
          initial={{ opacity: 0, scale: 1.12 }} animate={{ opacity: 1, scale: 1.02 }} exit={{ opacity: 0 }}
          transition={{ opacity: { duration: 1.4 }, scale: { duration: interval / 1000 + 1.4, ease: 'linear' } }}>
          <OptionalVideo src={s.video} poster={s.img} />
        </motion.div>
      </AnimatePresence>
      <div className="slide-caption"><span className="live-dot" /> {s.caption}</div>
      <div className="slide-dots">{slides.map((x, k) => <button key={x.img} className={k === i ? 'on' : ''} onClick={() => setI(k)} aria-label={`Show ${x.caption}`} />)}</div>
    </>
  );
}

export function PhotoTile({ photo, index }) {
  return (
    <motion.article className="photo-tile" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: .7, delay: index * 0.1, ease: [0.2, 0.7, 0.2, 1] }} whileHover={{ y: -6 }}>
      <img src={photo.img} alt={`${photo.area}, Nairobi`} loading="lazy" decoding="async" />
      <OptionalVideo src={photo.video} poster={photo.img} />
      <span className="photo-badge"><span className="live-dot" /> {photo.area.toUpperCase()}</span>
      <div className="photo-meta"><h3>{photo.title}</h3></div>
    </motion.article>
  );
}
