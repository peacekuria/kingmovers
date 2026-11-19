import { motion } from 'framer-motion';
import { BadgeCheck, Quote, Users, Package } from 'lucide-react';
import BrandTruck from '../../components/BrandTruck';
import { Reveal } from '../../components/Reveal';
import { useFeaturedReviewsQuery } from '../../api/api';

/* ---------- People of Nairobi (lifestyle imagery, not customers) ---------- */
const PEOPLE = [
  { img: '/images/kenya-friends.jpg', label: 'Friends & flatmates', cls: 'a-f', alt: 'Two friends taking a selfie on a sunny Nairobi street' },
  { img: '/images/kenya-professional.jpg', label: 'Young professionals', cls: 'a-p', alt: 'A professional woman in a blazer and glasses' },
  { img: '/images/kenya-smile.jpg', label: 'First apartments', cls: 'a-s', alt: 'A smiling woman on a Nairobi street' },
  { img: '/images/kenya-denim.jpg', label: 'Students & creatives', cls: 'a-d', alt: 'A young woman in a denim jacket' },
  { img: '/images/kenya-proud.jpg', label: 'Proudly Kenyan', cls: 'a-k', alt: 'A smiling man wearing Kenyan-flag sunglasses' },
];

export function PeopleMosaic() {
  return (
    <section className="block">
      <div className="container">
        <Reveal className="section-head center">
          <span className="eyebrow">Made in Nairobi, for Nairobi</span>
          <h2>Moving every kind of <span className="serif-accent grad-text">Nairobian</span></h2>
          <p>Whether it’s a first bedsitter in Roysambu or a family home in Karen, your move gets the same royal treatment.</p>
        </Reveal>
        <div className="people-grid">
          {PEOPLE.map((p, i) => (
            <motion.figure key={p.img} className={`people-tile ${p.cls || ''}`}
              initial={{ opacity: 0, y: 30, scale: .98 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: .7, delay: i * 0.08, ease: [0.2, 0.7, 0.2, 1] }}>
              <img src={p.img} alt={p.alt} loading="lazy" decoding="async" />
              <figcaption>{p.label}</figcaption>
            </motion.figure>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Branded fleet ---------- */
const FLEET = [
  { size: 'pickup', name: '1.5T Pickup', fit: 'Bedsitters & studios', load: 'Up to ~6 m³', crew: '2 crew' },
  { size: 'canter', name: '3T Canter', fit: '1–2 bedroom homes', load: 'Up to ~14 m³', crew: '3–4 crew' },
  { size: 'truck', name: '7T Truck', fit: 'Large homes & offices', load: '14 m³ and above', crew: '5–6 crew' },
];

export function Fleet() {
  return (
    <section className="block fleet-band">
      <div className="container">
        <Reveal className="section-head center">
          <span className="eyebrow">Look for the crown</span>
          <h2>The <span className="serif-accent">KingMovers</span> fleet</h2>
          <p>Navy, gold and impossible to miss. Every move day starts with the crown pulling up at your gate.</p>
        </Reveal>

        <div className="road-stage" aria-hidden="true">
          <motion.div className="road-truck" initial={{ x: '-70%', opacity: 0 }} whileInView={{ x: '0%', opacity: 1 }} viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}>
            <motion.div animate={{ y: [0, -1.5, 0] }} transition={{ duration: .5, repeat: Infinity, ease: 'easeInOut' }}>
              <BrandTruck size="truck" />
            </motion.div>
          </motion.div>
          <div className="road" />
        </div>

        <div className="grid g3" style={{ marginTop: 36 }}>
          {FLEET.map((f, i) => (
            <Reveal key={f.size} delay={i * 0.1}>
              <motion.div className="card fleet-card" whileHover={{ y: -6 }}>
                <div className="fleet-art"><BrandTruck size={f.size} spin={false} /></div>
                <h3 style={{ marginBottom: 2 }}>{f.name}</h3>
                <p style={{ marginBottom: 12 }}>{f.fit}</p>
                <div className="row" style={{ gap: 8 }}>
                  <span className="chip chip-blue"><Package size={12} /> {f.load}</span>
                  <span className="chip"><Users size={12} /> {f.crew}</span>
                </div>
              </motion.div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- Reviews from verified, completed moves ---------- */
const Stars = ({ n }) => <span className="review-stars" aria-label={`${n} out of 5 stars`}>{'★'.repeat(n)}<span className="off">{'★'.repeat(5 - n)}</span></span>;

export function Reviews() {
  const { data, isLoading } = useFeaturedReviewsQuery();
  if (isLoading) return null;
  const reviews = data?.reviews || [];
  return (
    <section className="block band-white">
      <div className="container">
        <div className="reviews-head">
          <Reveal>
            <span className="eyebrow">Reviews</span>
            <h2>Loved by Nairobians who <span className="serif-accent grad-text">moved with us</span></h2>
            <p style={{ maxWidth: 520 }}>Every review comes from a client whose booking was completed on KingMoversKenya. We never edit or invent reviews.</p>
          </Reveal>
          {data?.count > 0 && (
            <Reveal delay={.1}>
              <div className="rating-badge">
                <div className="rating-num">{data.average?.toFixed(1)}</div>
                <div>
                  <Stars n={Math.round(data.average)} />
                  <div className="muted" style={{ fontSize: 13 }}>from {data.count} verified review{data.count === 1 ? '' : 's'}</div>
                </div>
              </div>
            </Reveal>
          )}
        </div>

        {reviews.length ? (
          <div className="grid g3 snap-row" style={{ marginTop: 32 }}>
            {reviews.slice(0, 6).map((r, i) => (
              <motion.article key={r.id} className="review-card" initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: .6, delay: (i % 3) * 0.08 }}>
                <Quote className="review-quote" size={28} />
                <Stars n={r.stars} />
                <p className="review-text">“{r.text}”</p>
                <div className="review-foot">
                  <div className="review-avatar">{r.name[0]}</div>
                  <div style={{ minWidth: 0 }}>
                    <b>{r.name}</b>
                    <div className="muted" style={{ fontSize: 12 }}>{r.route || 'Nairobi'} · moved with {r.mover}</div>
                  </div>
                  <span className="verified" title="Review from a completed booking"><BadgeCheck size={14} /> Verified move</span>
                </div>
              </motion.article>
            ))}
          </div>
        ) : (
          <div className="card empty" style={{ marginTop: 28 }}>
            <h3>Reviews appear here after real moves</h3>
            <p style={{ margin: 0 }}>Only clients with a completed booking can leave a review, so every rating you see here is genuine.</p>
          </div>
        )}
      </div>
    </section>
  );
}
