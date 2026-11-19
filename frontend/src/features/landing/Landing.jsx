import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, ClipboardCheck, Calculator, CalendarCheck, MapPinned, ShieldCheck, MessageCircle, Star } from 'lucide-react';
import { useSelector } from 'react-redux';
import VideoBackdrop, { VideoTile } from '../../components/VideoTile';
import { Reveal, Counter } from '../../components/Reveal';
import { ESTATES, FEATURE_VIDEOS } from '../../data/nairobi';

const STEPS = [
  [ClipboardCheck, 'Pick your home size', 'Start from a Bedsitter, Studio, 1BR or 2BR checklist, then tick off what is actually moving.'],
  [Calculator, 'Get an instant quote', 'Prices update live from the distance across Nairobi, your load volume and the mover you pick.'],
  [CalendarCheck, 'Book & relax', 'Confirm a date and get notified the moment your move is confirmed, scheduled or updated.'],
  [MapPinned, 'Track on move day', 'Follow your truck live from Kilimani to Kasarani and chat with your crew in-app.'],
];

const FEATURES = [
  [ShieldCheck, 'Vetted movers only', 'Every company is reviewed and approved by our admin team before it can take jobs.'],
  [MessageCircle, 'In-app messaging', 'Talk directly to your crew about parking, stairs, or fragile items.'],
  [Star, 'Honest reviews', 'Ratings come only from clients whose moves were completed.'],
];

const HEADLINE = ['Move', 'across', 'Nairobi,'];

export default function Landing() {
  const hero = useRef(null);
  const { scrollYProgress } = useScroll({ target: hero, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '25%']);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const user = useSelector((s) => s.auth.user);
  const nav = useNavigate();
  const [from, setFrom] = useState('kilimani');
  const [to, setTo] = useState('kasarani');

  return (
    <>
      <section className="hero" ref={hero}>
        <motion.div className="hero-media" style={{ y, scale }}>
          <VideoBackdrop src="/videos/hero.mp4" scene="dusk" />
        </motion.div>
        <div className="hero-shade" />
        <motion.div className="container hero-content" style={{ opacity: fade }}>
          <motion.span className="eyebrow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: .2 }}>
            <span className="live-dot" /> Live across all 17 sub-counties
          </motion.span>
          <h1>
            {HEADLINE.map((w, i) => (
              <motion.span key={w} style={{ display: 'inline-block', marginRight: '0.25em' }} initial={{ opacity: 0, y: 50, rotateX: -60 }} animate={{ opacity: 1, y: 0, rotateX: 0 }} transition={{ delay: 0.3 + i * 0.12, duration: .8, ease: [0.2, 0.7, 0.2, 1] }}>{w}</motion.span>
            ))}
            <br />
            <motion.span className="grad-text" style={{ display: 'inline-block' }} initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .7, duration: .8 }}>without the stress.</motion.span>
          </h1>
          <motion.p className="lead" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .9 }}>
            SmartMove finds trusted movers, inventories your home in minutes, prices your move in shillings and lets you track your truck live, from Westlands to Utawala.
          </motion.p>
          <motion.form className="hero-search" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.05 }}
            onSubmit={(e) => { e.preventDefault(); nav(`/quote?from=${from}&to=${to}`); }}>
            <select className="input" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="Moving from">
              {ESTATES.map((e) => <option key={e.id} value={e.id}>From: {e.name}</option>)}
            </select>
            <select className="input" value={to} onChange={(e) => setTo(e.target.value)} aria-label="Moving to">
              {ESTATES.map((e) => <option key={e.id} value={e.id}>To: {e.name}</option>)}
            </select>
            <button className="btn btn-primary">Get quote <ArrowRight size={16} /></button>
          </motion.form>
        </motion.div>
        <div className="scroll-cue" aria-hidden="true" />
      </section>

      <div className="container stats-strip">
        <Reveal>
          <div className="card card-glow grid g4">
            <div className="stat"><b className="grad-text"><Counter to={12480} suffix="+" /></b><span className="muted">moves completed</span></div>
            <div className="stat"><b><Counter to={4.8} decimals={1} suffix="★" /></b><span className="muted">average mover rating</span></div>
            <div className="stat"><b><Counter to={86} /></b><span className="muted">vetted moving companies</span></div>
            <div className="stat"><b><Counter to={45} suffix=" min" /></b><span className="muted">avg. response time</span></div>
          </div>
        </Reveal>
      </div>

      <section className="block">
        <div className="container">
          <Reveal className="section-head">
            <span className="eyebrow"><span className="live-dot" /> Nairobi, right now</span>
            <h2>Your city, your next chapter.</h2>
            <p>From CBD high-rises to leafy Karen compounds, our crews know every estate, every shortcut and every gate guard's name.</p>
          </Reveal>
          <div className="grid g4">
            {FEATURE_VIDEOS.map((v, i) => <VideoTile key={v.id} video={v} index={i} />)}
          </div>
        </div>
      </section>

      <section className="block" style={{ paddingTop: 20 }}>
        <div className="marquee">
          <div className="marquee-track">
            {[...ESTATES, ...ESTATES].map((e, i) => <span key={i} className="chip" style={{ padding: '10px 16px', fontSize: 14 }}>📍 {e.name}</span>)}
          </div>
        </div>
      </section>

      <section className="block">
        <div className="container">
          <Reveal className="section-head">
            <span className="eyebrow">How it works</span>
            <h2>Four steps from <span className="grad-text">packed</span> to <span className="grad-text">home</span>.</h2>
          </Reveal>
          <div className="grid g4">
            {STEPS.map(([Icon, t, d], i) => (
              <Reveal key={t} delay={i * 0.1}>
                <motion.div className="card" whileHover={{ y: -6, borderColor: 'rgba(245,165,36,.6)' }} style={{ height: '100%' }}>
                  <div className="step-num"><Icon size={20} /></div>
                  <span className="muted" style={{ fontSize: 12 }}>STEP {i + 1}</span>
                  <h3>{t}</h3>
                  <p style={{ margin: 0 }}>{d}</p>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="block">
        <div className="container grid g2" style={{ alignItems: 'center' }}>
          <Reveal>
            <span className="eyebrow">Built for Nairobi</span>
            <h2>Real routes. Real shillings. Real-time.</h2>
            <p>Pin your current and future home on the map. We price by actual distance, show which movers cover your area, and put your truck on the map on move day.</p>
            <div className="grid" style={{ gap: 14, marginTop: 24 }}>
              {FEATURES.map(([Icon, t, d]) => (
                <div key={t} className="row" style={{ alignItems: 'flex-start', flexWrap: 'nowrap' }}>
                  <div className="step-num" style={{ marginBottom: 0, flex: 'none' }}><Icon size={18} /></div>
                  <div><b>{t}</b><p style={{ margin: 0 }}>{d}</p></div>
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal delay={.15}>
            <motion.div className="card card-glow" whileHover={{ rotateY: -4, rotateX: 3 }} style={{ transformPerspective: 900, padding: 0, aspectRatio: '4/3' }}>
              <VideoBackdrop src="/videos/truck.mp4" scene="night" />
              <div className="video-meta">
                <span className="chip chip-green">● In transit · Thika Rd</span>
                <h3 style={{ marginTop: 8 }}>Crew of 4 · ETA 18 min</h3>
              </div>
            </motion.div>
          </Reveal>
        </div>
      </section>

      <section className="block">
        <div className="container">
          <Reveal>
            <div className="cta-band row between">
              <div style={{ maxWidth: 560 }}>
                <h2>Ready when you are.</h2>
                <p style={{ margin: 0 }}>Clients plan moves, movers grow their business, all on one platform.</p>
              </div>
              <div className="row">
                <Link to={user ? '/inventory' : '/auth'} className="btn btn-primary">Plan my move <ArrowRight size={16} /></Link>
                <Link to="/auth?mode=signup&role=mover" className="btn btn-ghost">I'm a mover</Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <footer>
        <div className="container row between">
          <span>© {new Date().getFullYear()} SmartMove · Nairobi County</span>
          <span>Westlands · Kilimani · Karen · Embakasi · Kasarani</span>
        </div>
      </footer>
    </>
  );
}
