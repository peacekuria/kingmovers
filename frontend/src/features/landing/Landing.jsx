import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useSelector } from 'react-redux';
import { ArrowRight, ClipboardCheck, Calculator, CalendarCheck, MapPinned, ShieldCheck, MessageCircle, Star, BadgeCheck, Receipt, Radio, Truck, CheckCircle2 } from 'lucide-react';
import { HeroSlideshow, PhotoTile } from '../../components/Media';
import { Reveal, Counter } from '../../components/Reveal';
import Logo from '../../components/Logo';
import { PeopleMosaic, Fleet, Reviews } from './Sections';
import { ESTATES, HERO_SLIDES, CITY_PHOTOS } from '../../data/nairobi';
import { useGetPublicStatsQuery } from '../../api/api';

const STEPS = [
  [ClipboardCheck, 'List what you own', 'Start from a Bedsitter, Studio, 1BR or 2BR checklist and tick off what is actually moving.'],
  [Calculator, 'Compare honest prices', 'Quotes in shillings from real road distance, your load and each mover’s published rates.'],
  [CalendarCheck, 'Book in two taps', 'Pick a vetted mover and a date. You are notified the moment it is confirmed or changes.'],
  [MapPinned, 'Track move day live', 'Follow your truck on the map from pickup to your new door and chat with the crew.'],
];

const WHY = [
  [ShieldCheck, 'Every mover is vetted', 'Companies are reviewed and approved by our team before they can accept a single job.'],
  [Receipt, 'No surprise charges', 'The price you confirm is calculated by our system from published rates, not haggled at the gate.'],
  [Radio, 'Real GPS, not guesses', 'On move day your crew shares live location, so you always know where your things are.'],
  [MessageCircle, 'Talk to your crew directly', 'Share gate codes, parking and stair details in the app, all kept with your booking.'],
];

const HEADLINE = ['Moving', 'in', 'Nairobi,'];

export default function Landing() {
  const hero = useRef(null);
  const { scrollYProgress } = useScroll({ target: hero, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '18%']);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const user = useSelector((s) => s.auth.user);
  const { data: stats } = useGetPublicStatsQuery();
  const nav = useNavigate();
  const [from, setFrom] = useState('kilimani');
  const [to, setTo] = useState('kasarani');

  return (
    <>
      <section className="hero" ref={hero}>
        <motion.div className="hero-media" style={{ y }}>
          <HeroSlideshow slides={HERO_SLIDES} />
        </motion.div>
        <div className="hero-shade" />
        <motion.div className="container hero-content" style={{ opacity: fade }}>
          <motion.span className="eyebrow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .2 }}>
            <BadgeCheck size={15} /> Nairobi’s trusted moving platform
          </motion.span>
          <h1>
            {HEADLINE.map((w, i) => (
              <motion.span key={w} style={{ display: 'inline-block', marginRight: '0.25em' }} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1, duration: .8, ease: [0.2, 0.7, 0.2, 1] }}>{w}</motion.span>
            ))}
            <br />
            <motion.span className="grad-text serif-accent" style={{ display: 'inline-block', paddingRight: '.08em' }} initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .65, duration: .8 }}>made simple.</motion.span>
          </h1>
          <motion.p className="lead" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .85 }}>
            Find vetted movers, get a clear price in shillings, and follow your truck live, from Westlands to Utawala.
          </motion.p>
          <motion.form className="hero-search" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}
            onSubmit={(e) => { e.preventDefault(); nav(`/quote?from=${from}&to=${to}`); }}>
            <select className="input" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="Moving from">
              {ESTATES.map((e) => <option key={e.id} value={e.id}>From: {e.name}</option>)}
            </select>
            <select className="input" value={to} onChange={(e) => setTo(e.target.value)} aria-label="Moving to">
              {ESTATES.map((e) => <option key={e.id} value={e.id}>To: {e.name}</option>)}
            </select>
            <button className="btn btn-primary">Get my price <ArrowRight size={16} /></button>
          </motion.form>
          <motion.div className="hero-trust" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>
            <span><CheckCircle2 size={16} color="#7ee0b5" /> Vetted movers</span>
            <span><CheckCircle2 size={16} color="#7ee0b5" /> Upfront KES pricing</span>
            <span><CheckCircle2 size={16} color="#7ee0b5" /> Live GPS tracking</span>
          </motion.div>
        </motion.div>
      </section>

      <div className="container stats-strip">
        <Reveal>
          <div className="card card-glow grid stats-grid stats-band">
            <div className="stat"><b>{stats ? <Counter to={stats.movers} /> : '·'}</b><span className="muted">approved moving companies</span></div>
            <div className="stat"><b>{stats?.avgRating ? <><Counter to={stats.avgRating} decimals={1} /><span style={{ color: 'var(--amber)' }}> ★</span></> : 'New'}</b><span className="muted">average mover rating</span></div>
            <div className="stat"><b>{stats ? <Counter to={stats.reviews} /> : '·'}</b><span className="muted">verified client reviews</span></div>
            <div className="stat"><b><Counter to={ESTATES.length} /></b><span className="muted">Nairobi estates priced instantly</span></div>
          </div>
        </Reveal>
      </div>

      <section className="block">
        <div className="container">
          <Reveal className="section-head center">
            <span className="eyebrow">How it works</span>
            <h2>From packed boxes to your new front door</h2>
            <p>Four simple steps. No phone tag, no haggling, no guessing where your sofa is.</p>
          </Reveal>
          <div className="grid g4">
            {STEPS.map(([Icon, t, d], i) => (
              <Reveal key={t} delay={i * 0.08}>
                <motion.div className="card" whileHover={{ y: -6, boxShadow: '0 20px 40px -18px rgba(10,37,64,.3)' }} style={{ height: '100%' }}>
                  <div className="step-num"><Icon size={20} /></div>
                  <span className="muted" style={{ fontSize: 12, fontWeight: 700 }}>STEP {i + 1}</span>
                  <h3>{t}</h3>
                  <p style={{ margin: 0 }}>{d}</p>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <PeopleMosaic />

      <section className="block band-white">
        <div className="container grid g2" style={{ alignItems: 'center', gap: 48 }}>
          <Reveal>
            <div style={{ position: 'relative' }}>
              <div className="photo-frame"><img src="/images/kenya-couple.jpg" alt="A smiling couple in a green garden in Nairobi" loading="lazy" /></div>
              <motion.div className="float-card float-a" animate={{ y: [0, -8, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
                <CheckCircle2 color="var(--green)" /> <div><b>Move confirmed</b><div className="muted" style={{ fontSize: 12 }}>Kilimani → Kasarani · Sat 8:00</div></div>
              </motion.div>
              <motion.div className="float-card float-b" animate={{ y: [0, 8, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}>
                <Truck color="var(--brand)" /> <div><b>Crew on the way</b><div className="muted" style={{ fontSize: 12 }}>Live on your map</div></div>
              </motion.div>
            </div>
          </Reveal>
          <Reveal delay={.1}>
            <span className="eyebrow">Built for peace of mind</span>
            <h2>Moving is stressful. Your mover shouldn’t be.</h2>
            <p>KingMoversKenya puts everything in one place: what you’re moving, who’s moving it, what it costs and where it is right now.</p>
            <div className="grid" style={{ gap: 16, marginTop: 24 }}>
              {WHY.map(([Icon, t, d]) => (
                <div key={t} className="row" style={{ alignItems: 'flex-start', flexWrap: 'nowrap', gap: 14 }}>
                  <div className="step-num" style={{ marginBottom: 0, flex: 'none', width: 40, height: 40 }}><Icon size={18} /></div>
                  <div><b>{t}</b><p style={{ margin: 0, fontSize: 14 }}>{d}</p></div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <Fleet />

      <section className="block">
        <div className="container">
          <Reveal className="section-head">
            <span className="eyebrow"><span className="live-dot" /> Every corner of Nairobi</span>
            <h2>Your city. Your next chapter.</h2>
            <p>From CBD apartments to leafy compounds in Lavington, our movers know the routes, the gates and the traffic.</p>
          </Reveal>
          <div className="grid g4 snap-row" data-lenis-prevent-touch>
            {CITY_PHOTOS.map((p, i) => <PhotoTile key={p.id} photo={p} index={i} />)}
          </div>
        </div>
      </section>

      <section style={{ paddingBottom: 90 }}>
        <div className="marquee">
          <div className="marquee-track">
            {[...ESTATES, ...ESTATES].map((e, i) => <span key={i} className="chip" style={{ padding: '10px 16px', fontSize: 14, background: '#fff' }}><MapPinned size={14} color="var(--brand)" /> {e.name}</span>)}
          </div>
        </div>
      </section>

      <Reviews />

      <section className="block band-navy">
        <div className="container grid g2" style={{ alignItems: 'center', gap: 48 }}>
          <Reveal>
            <span className="eyebrow" style={{ color: '#9cc0ff' }}>For moving companies</span>
            <h2>Grow your moving business with KingMoversKenya</h2>
            <p>Get booked by clients who already know their inventory and price. Manage jobs, update status and chat with clients from one dashboard.</p>
            <div className="row" style={{ marginTop: 20 }}>
              <Link to="/auth?mode=signup&role=mover" className="btn btn-light">Register your company <ArrowRight size={16} /></Link>
              <span style={{ color: 'rgba(255,255,255,.7)', fontSize: 14 }}><Star size={14} fill="var(--amber)" color="var(--amber)" /> Free to join · Reviewed by our team</span>
            </div>
          </Reveal>
          <Reveal delay={.1}>
            <div className="photo-frame"><img src="/images/kenya-handshake.jpg" alt="Two people shaking hands on a deal in a Nairobi office" loading="lazy" /></div>
          </Reveal>
        </div>
      </section>

      <section className="block">
        <div className="container">
          <Reveal>
            <div className="cta-band row between">
              <div style={{ maxWidth: 560 }}>
                <h2>Ready when you are.</h2>
                <p style={{ margin: 0 }}>Plan your inventory now and lock in a mover for the weekend.</p>
              </div>
              <div className="row">
                <Link to={user ? '/inventory' : '/auth?mode=signup'} className="btn btn-light">Plan my move <ArrowRight size={16} /></Link>
                <Link to="/movers" className="btn btn-outline-light">Browse movers</Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <footer>
        <div className="container grid g3" style={{ gap: 28 }}>
          <div>
            <div className="logo" style={{ marginBottom: 10 }}><Logo /></div>
            <p style={{ color: 'rgba(255,255,255,.6)', fontSize: 14 }}>Plan, price, book and track your move anywhere in Nairobi County.</p>
          </div>
          <div className="grid" style={{ gap: 6 }}>
            <b style={{ color: '#fff' }}>Explore</b>
            <Link to="/movers">Movers</Link><Link to="/quote">Get a price</Link><Link to="/auth?mode=signup&role=mover">Become a mover</Link>
          </div>
          <div className="grid" style={{ gap: 6 }}>
            <b style={{ color: '#fff' }}>Areas</b>
            <span>Westlands · Kilimani · Karen</span><span>Embakasi · Kasarani · South B</span>
          </div>
        </div>
        <div className="container row between" style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,.12)', fontSize: 13 }}>
          <span>© {new Date().getFullYear()} KingMoversKenya · Nairobi, Kenya</span>
          <span>Photography via Unsplash</span>
        </div>
      </footer>
    </>
  );
}
