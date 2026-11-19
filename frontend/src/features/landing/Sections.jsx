import { motion } from 'framer-motion';
import { BadgeCheck, Quote, Users, Package } from 'lucide-react';
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

/* ---------- Fleet (real vehicle photos by class) ---------- */
const FLEET = [
  { img: '/images/fleet-pickup.jpg', name: '1.5T Pickup', fit: 'Bedsitters & studios', load: 'Up to ~6 m³', crew: '2 crew', alt: 'A pickup truck loaded with bags and boxes', pos: '50% 50%' },
  { img: '/images/fleet-canter.jpg', name: '3T Canter', fit: '1–2 bedroom homes', load: 'Up to ~14 m³', crew: '3–4 crew', alt: 'A blue Isuzu cab-over truck parked on a street at night', pos: '70% 60%' },
  { img: '/images/fleet-truck.jpg', name: '7T Truck', fit: 'Large homes & offices', load: '14 m³ and above', crew: '5–6 crew', alt: 'Lorries driving on a highway in Kenya', pos: '45% 70%' },
];

export function Fleet() {
  return (
    <section className="block fleet-band">
      <div className="container">
        <Reveal className="section-head center">
          <span className="eyebrow">The right truck for every move</span>
          <h2>Pick the <span className="serif-accent">perfect</span> ride for your load</h2>
          <p>We match your inventory to the right vehicle, so you never pay for a 7-tonne truck to move a bedsitter.</p>
        </Reveal>
        <div className="grid g3">
          {FLEET.map((f, i) => (
            <Reveal key={f.name} delay={i * 0.1}>
              <motion.article className="fleet-card" whileHover={{ y: -6 }}>
                <div className="fleet-photo">
                  <img src={f.img} alt={f.alt} loading="lazy" decoding="async" style={{ objectPosition: f.pos }} />
                  <span className="fleet-tag">{f.name}</span>
                </div>
                <div className="fleet-body">
                  <h3 style={{ marginBottom: 2 }}>{f.fit}</h3>
                  <div className="row" style={{ gap: 8, marginTop: 10 }}>
                    <span className="chip chip-blue"><Package size={12} /> {f.load}</span>
                    <span className="chip"><Users size={12} /> {f.crew}</span>
                  </div>
                </div>
              </motion.article>
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
