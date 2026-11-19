import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import NairobiScene from './NairobiScene';

// Plays real footage from /public/videos when present; otherwise falls back to
// the animated skyline so the layout never shows a broken player.
export default function VideoBackdrop({ src, scene = 'dusk', poster }) {
  const [failed, setFailed] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const v = ref.current; if (!v) return;
    const p = v.play?.(); if (p?.catch) p.catch(() => {});
  }, [src]);
  if (!src || failed) return <NairobiScene variant={scene} />;
  return (
    <>
      <NairobiScene variant={scene} trucks={false} />
      <video ref={ref} src={src} poster={poster} autoPlay muted loop playsInline preload="metadata" onError={() => setFailed(true)} />
    </>
  );
}

export function VideoTile({ video, index }) {
  const ref = useRef(null);
  return (
    <motion.article
      ref={ref}
      className="video-tile"
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: .7, delay: index * 0.1, ease: [0.2, 0.7, 0.2, 1] }}
      whileHover={{ y: -6 }}
    >
      <VideoBackdrop src={video.src} scene={video.scene} />
      <span className="video-badge"><span className="live-dot" /> NAIROBI</span>
      <div className="video-meta">
        <span className="chip chip-amber">{video.area}</span>
        <h3 style={{ marginTop: 10 }}>{video.title}</h3>
      </div>
    </motion.article>
  );
}
