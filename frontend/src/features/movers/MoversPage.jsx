import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Truck, Users, MapPin, BadgeCheck } from 'lucide-react';
import MapView from '../../components/MapView';
import { Page } from '../../components/Reveal';
import { ESTATES } from '../../data/nairobi';
import { inCoverage, kes } from '../../utils/geo';
import { useMoversQuery } from '../../api/api';
import { Spinner, ErrorCard } from '../../components/Feedback';

export default function MoversPage() {
  const { data: movers = [], isLoading, error, refetch } = useMoversQuery();
  const [area, setArea] = useState('');
  const [sort, setSort] = useState('rating');
  const point = ESTATES.find((e) => e.id === area);
  const shown = movers.filter((m) => inCoverage(m, point)).sort((a, b) => (sort === 'rating' ? b.rating - a.rating : a.baseFee - b.baseFee));

  return (
    <Page className="container">
      <span className="eyebrow">Movers</span>
      <h1 style={{ fontSize: 'clamp(2rem,5vw,3.2rem)' }}>Trusted crews across Nairobi</h1>
      <p>Filter by your estate to see who covers it. Coloured circles on the map show each mover's coverage zone.</p>
      <div className="row" style={{ margin: '20px 0' }}>
        <select className="input" style={{ maxWidth: 260 }} value={area} onChange={(e) => setArea(e.target.value)}>
          <option value="">All of Nairobi</option>
          {ESTATES.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
        <select className="input" style={{ maxWidth: 200 }} value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="rating">Top rated</option><option value="price">Lowest base fee</option>
        </select>
        <span className="muted">{shown.length} mover{shown.length === 1 ? '' : 's'}</span>
      </div>
      {isLoading ? <Spinner /> : error ? <ErrorCard error={error} retry={refetch} /> : (
      <div className="layout-side">
        <div className="grid g2">
          <AnimatePresence mode="popLayout">
            {shown.map((m, i) => (
              <motion.div key={m.id} layout initial={{ opacity: 0, scale: .95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: .9 }} transition={{ delay: i * 0.04 }}
                className="card" whileHover={{ y: -4 }}>
                <div className="row" style={{ flexWrap: 'nowrap' }}>
                  <div className="avatar" style={{ background: m.color }}>{m.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}</div>
                  <div style={{ minWidth: 0 }}>
                    <h3 style={{ margin: 0 }}>{m.name}</h3>
                    <div className="muted" style={{ fontSize: 13 }}>{m.tagline}</div>
                    <span className="verified"><BadgeCheck size={13} /> Verified by SmartMove</span>
                  </div>
                </div>
                <div className="row" style={{ margin: '14px 0', gap: 8 }}>
                  <span className="chip chip-amber"><Star size={12} fill="currentColor" /> {m.reviews ? `${m.rating.toFixed(1)} (${m.reviews})` : 'New'}</span>
                  <span className="chip"><Truck size={12} /> {m.vehicle}</span>
                  <span className="chip"><Users size={12} /> {m.crew} crew</span>
                  <span className="chip"><MapPin size={12} /> {m.coverage.radiusKm} km</span>
                  {!m.available && <span className="chip chip-red">Fully booked</span>}
                </div>
                <div className="row between">
                  <div><span className="muted" style={{ fontSize: 12 }}>From</span><div style={{ fontWeight: 700 }}>{kes(m.baseFee)} <span className="muted" style={{ fontWeight: 400, fontSize: 12 }}>+ {kes(m.perKm)}/km</span></div></div>
                  <Link to={`/quote?mover=${m.id}${area ? `&from=${area}` : ''}`} className={`btn btn-primary btn-sm ${m.available ? '' : 'disabled'}`} aria-disabled={!m.available} onClick={(e) => !m.available && e.preventDefault()}>Get quote</Link>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {!shown.length && <div className="card empty">No approved movers cover that estate yet.</div>}
        </div>
        <div className="sticky"><MapView movers={shown} pickup={point && { ...point, label: point.name }} tall /></div>
      </div>
      )}
    </Page>
  );
}
