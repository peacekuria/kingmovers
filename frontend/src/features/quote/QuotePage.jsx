import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Crosshair, Star, CalendarDays, CheckCircle2 } from 'lucide-react';
import MapView from '../../components/MapView';
import { Page, AnimatedNumber } from '../../components/Reveal';
import { ESTATES } from '../../data/nairobi';
import { inventoryTotals, kes } from '../../utils/geo';
import { useQuotesQuery, useCreateBookingMutation, errorText } from '../../api/api';
import { selectUser } from '../auth/authSlice';

const estate = (id) => { const e = ESTATES.find((x) => x.id === id); return e && { lat: e.lat, lng: e.lng, label: e.name }; };
const tomorrow = () => new Date(Date.now() + 864e5).toISOString().slice(0, 10);

function useDebounced(value, ms = 350) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}

export default function QuotePage() {
  const [params] = useSearchParams();
  const [pickup, setPickup] = useState(() => estate(params.get('from') || 'kilimani'));
  const [dropoff, setDropoff] = useState(() => estate(params.get('to') || 'kasarani'));
  const [pinning, setPinning] = useState('A');
  const [moverId, setMoverId] = useState(Number(params.get('mover')) || null);
  const [date, setDate] = useState(tomorrow());
  const [geoMsg, setGeoMsg] = useState('');
  const [bookErr, setBookErr] = useState('');
  const inv = useSelector((s) => s.inventory);
  const user = useSelector(selectUser);
  const nav = useNavigate();
  const [createBooking, { isLoading: booking }] = useCreateBookingMutation();

  const totals = inventoryTotals(inv);
  const reqKey = useDebounced(JSON.stringify({ pickup, dropoff, totals: { kg: totals.kg, m3: totals.m3 } }));
  const req = useMemo(() => JSON.parse(reqKey), [reqKey]);
  const { data, isFetching, error } = useQuotesQuery(req, { skip: !req.pickup || !req.dropoff });
  const options = data?.quotes || [];
  const km = data?.km ?? 0;
  const chosen = options.find((o) => o.mover.id === moverId && o.covers) || options.find((o) => o.covers);

  const pin = (p) => {
    const labelled = { ...p, label: `Pinned (${p.lat.toFixed(3)}, ${p.lng.toFixed(3)})` };
    if (pinning === 'A') { setPickup(labelled); setPinning('B'); } else setDropoff(labelled);
  };
  const locate = () => {
    if (!navigator.geolocation) return setGeoMsg('Location is not available in this browser.');
    setGeoMsg('Locating…');
    navigator.geolocation.getCurrentPosition(
      (pos) => { setPickup({ lat: +pos.coords.latitude.toFixed(5), lng: +pos.coords.longitude.toFixed(5), label: 'My current location' }); setGeoMsg(''); },
      () => setGeoMsg('Could not get your location. Pin it on the map instead.'),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };
  const book = async () => {
    if (!user) return nav('/auth', { state: { from: '/quote' } });
    if (user.role !== 'client') return setBookErr('Only client accounts can book moves.');
    setBookErr('');
    try {
      await createBooking({ moverId: chosen.mover.id, date, pickup, dropoff }).unwrap();
      nav('/moves');
    } catch (e) { setBookErr(errorText(e)); }
  };

  const estateSelect = (val, set) => (
    <select className="input" value={ESTATES.find((e) => e.name === val?.label)?.id || ''} onChange={(e) => set(estate(e.target.value))}>
      <option value="" disabled>{val?.label || 'Choose estate'}</option>
      {ESTATES.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
    </select>
  );

  return (
    <Page className="container">
      <span className="eyebrow">Step 2 · Quote & book</span>
      <h1 style={{ fontSize: 'clamp(2rem,5vw,3.2rem)' }}>Price your move</h1>
      <div className="layout-side" style={{ marginTop: 24 }}>
        <div className="grid" style={{ gap: 20 }}>
          <div className="card">
            <div className="grid g2" style={{ gap: 12 }}>
              <div className="field" style={{ margin: 0 }}><label>🟢 Pickup (A)</label>{estateSelect(pickup, setPickup)}</div>
              <div className="field" style={{ margin: 0 }}><label>🟠 Drop-off (B)</label>{estateSelect(dropoff, setDropoff)}</div>
            </div>
            <div className="row" style={{ margin: '14px 0' }}>
              <span className="muted" style={{ fontSize: 13 }}>Tap the map to pin:</span>
              {['A', 'B'].map((p) => <button key={p} className={`btn btn-sm ${pinning === p ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setPinning(p)}>{p === 'A' ? 'Pickup' : 'Drop-off'}</button>)}
              <button className="btn btn-ghost btn-sm" onClick={locate}><Crosshair size={14} /> Use my location</button>
              {geoMsg && <span className="muted" style={{ fontSize: 13 }}>{geoMsg}</span>}
            </div>
            <MapView pickup={pickup} dropoff={dropoff} route={pickup && dropoff ? [pickup, dropoff] : null} onMapClick={pin} movers={chosen ? [chosen.mover] : []} />
          </div>

          <div className="card">
            <div className="row between" style={{ marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>Choose a mover</h3>
              {user?.role === 'client' && <Link to="/inventory" className="muted" style={{ fontSize: 13 }}>Edit inventory ({totals.count} items) →</Link>}
            </div>
            {error && <p className="error">{errorText(error)}</p>}
            <div className="grid" style={{ gap: 10, opacity: isFetching ? .6 : 1, transition: 'opacity .2s' }}>
              {options.map(({ mover: m, covers, quote: q }) => (
                <motion.button key={m.id} layout className={`card mover-card ${chosen?.mover.id === m.id ? 'on' : ''}`} style={{ padding: 14, textAlign: 'left', opacity: covers ? 1 : .5, cursor: covers ? 'pointer' : 'not-allowed' }}
                  disabled={!covers} onClick={() => setMoverId(m.id)} whileHover={covers ? { x: 4 } : {}}>
                  <div className="row between" style={{ flexWrap: 'nowrap' }}>
                    <div className="row" style={{ flexWrap: 'nowrap' }}>
                      <div className="avatar" style={{ background: m.color, width: 40, height: 40 }}>{m.name[0]}</div>
                      <div><b>{m.name}</b><div className="muted" style={{ fontSize: 12 }}><Star size={11} fill="currentColor" color="var(--amber)" /> {m.reviews ? m.rating.toFixed(1) : 'New'} · {m.vehicle}{!covers && (m.available ? ' · outside coverage' : ' · fully booked')}</div></div>
                    </div>
                    <b style={{ whiteSpace: 'nowrap' }}>{kes(q.total)}</b>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        <div className="card card-glow sticky">
          <span className="muted" style={{ fontSize: 13 }}>Estimated total</span>
          <div className="price-big grad-text">KES <AnimatedNumber value={chosen?.quote.total || 0} /></div>
          <p className="muted" style={{ fontSize: 13 }}>{pickup?.label} → {dropoff?.label} · {km} km by road{data?.distanceSource === 'estimate' ? ' (est.)' : ''}</p>
          <AnimatePresence mode="wait">
            {chosen ? (
              <motion.div key={chosen.mover.id} className="breakdown" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div><span>Base fee ({chosen.mover.name})</span><span>{kes(chosen.quote.base)}</span></div>
                <div><span>Distance · {km} km × {chosen.mover.perKm}</span><span>{kes(chosen.quote.distance)}</span></div>
                <div><span>Volume · {totals.m3} m³</span><span>{kes(chosen.quote.volume)}</span></div>
                <div><span>Heavy load · {totals.kg} kg</span><span>{kes(chosen.quote.weight)}</span></div>
              </motion.div>
            ) : !isFetching && <p className="error">No available mover covers this pickup point yet.</p>}
          </AnimatePresence>
          <div className="field" style={{ marginTop: 18 }}><label><CalendarDays size={13} /> Moving date</label><input className="input" type="date" min={tomorrow()} value={date} onChange={(e) => setDate(e.target.value)} /></div>
          {bookErr && <p className="error" role="alert">{bookErr}</p>}
          <motion.button className="btn btn-primary" style={{ width: '100%' }} disabled={!chosen || !date || booking || (user && !totals.count)} onClick={book} whileHover={{ scale: 1.02 }}>
            <CheckCircle2 size={16} /> {booking ? 'Booking…' : user ? 'Confirm booking' : 'Sign in to book'}
          </motion.button>
          {user && !totals.count && <p className="error" style={{ marginTop: 8 }}>Your inventory is empty.</p>}
          <p className="muted" style={{ fontSize: 12, marginTop: 10, marginBottom: 0 }}>Final price is confirmed by our server at booking time.</p>
        </div>
      </div>
    </Page>
  );
}
