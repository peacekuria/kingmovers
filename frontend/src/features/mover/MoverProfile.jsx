import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Page } from '../../components/Reveal';
import { Spinner, ErrorCard } from '../../components/Feedback';
import MapView from '../../components/MapView';
import { ESTATES } from '../../data/nairobi';
import { useMyMoverQuery, useUpdateMyMoverMutation, errorText } from '../../api/api';
import { PendingBanner } from './MoverDashboard';

const pick = (m) => ({ name: m.name, tagline: m.tagline, vehicle: m.vehicle, crew: m.crew, baseFee: m.baseFee, perKm: m.perKm, perM3: m.perM3, available: m.available, coverage: m.coverage });

export default function MoverProfile() {
  const { data: mover, isLoading, error, refetch } = useMyMoverQuery();
  const [save, { isLoading: saving }] = useUpdateMyMoverMutation();
  const [f, setF] = useState(null);
  const [msg, setMsg] = useState('');
  useEffect(() => { if (mover && !f) setF(pick(mover)); }, [mover, f]);

  if (isLoading || (mover && !f)) return <Page className="container"><Spinner /></Page>;
  if (error) return <Page className="container"><ErrorCard error={error} retry={refetch} /></Page>;

  const set = (k, num) => (e) => setF({ ...f, [k]: num ? +e.target.value : e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setMsg('');
    try { setF(pick(await save(f).unwrap().then((r) => r.mover))); setMsg('Saved ✓'); setTimeout(() => setMsg(''), 2000); }
    catch (x) { setMsg(errorText(x)); }
  };

  return (
    <Page className="container">
      <span className="eyebrow">Company profile</span>
      <h1 style={{ fontSize: 'clamp(2rem,5vw,3.2rem)' }}>{f.name}</h1>
      <PendingBanner mover={mover} />
      <div className="layout-side">
        <form className="card" onSubmit={submit}>
          <div className="grid g2" style={{ gap: 0, columnGap: 14 }}>
            <div className="field"><label>Company name</label><input className="input" required minLength={2} maxLength={120} value={f.name} onChange={set('name')} /></div>
            <div className="field"><label>Tagline</label><input className="input" maxLength={200} value={f.tagline} onChange={set('tagline')} /></div>
            <div className="field"><label>Vehicle</label><input className="input" maxLength={60} value={f.vehicle} onChange={set('vehicle')} /></div>
            <div className="field"><label>Crew size</label><input className="input" type="number" min="1" max="50" value={f.crew} onChange={set('crew', 1)} /></div>
            <div className="field"><label>Base fee (KES)</label><input className="input" type="number" min="0" value={f.baseFee} onChange={set('baseFee', 1)} /></div>
            <div className="field"><label>Per km (KES)</label><input className="input" type="number" min="0" value={f.perKm} onChange={set('perKm', 1)} /></div>
            <div className="field"><label>Per m³ (KES)</label><input className="input" type="number" min="0" value={f.perM3} onChange={set('perM3', 1)} /></div>
            <div className="field"><label>Rating</label><input className="input" disabled value={mover.reviews ? `${mover.rating.toFixed(1)} ★ (${mover.reviews} reviews)` : 'No reviews yet'} /></div>
            <div className="field"><label>Coverage centre</label>
              <select className="input" value={ESTATES.find((e) => e.lat === f.coverage.lat && e.lng === f.coverage.lng)?.id || ''} onChange={(e) => { const es = ESTATES.find((x) => x.id === e.target.value); setF({ ...f, coverage: { ...f.coverage, lat: es.lat, lng: es.lng } }); }}>
                <option value="" disabled>Custom (tap map)</option>{ESTATES.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <div className="field"><label>Coverage radius: {f.coverage.radiusKm} km</label><input type="range" min="3" max="30" value={f.coverage.radiusKm} onChange={(e) => setF({ ...f, coverage: { ...f.coverage, radiusKm: +e.target.value } })} /></div>
          </div>
          <label className="row" style={{ cursor: 'pointer', marginBottom: 16 }}>
            <input type="checkbox" checked={f.available} onChange={(e) => setF({ ...f, available: e.target.checked })} /> Accepting new bookings
          </label>
          <div className="row">
            <motion.button className="btn btn-primary" whileTap={{ scale: .96 }} disabled={saving}>{saving ? 'Saving…' : 'Save profile'}</motion.button>
            {msg && <span className={msg.startsWith('Saved') ? 'muted' : 'error'} style={{ margin: 0 }}>{msg}</span>}
          </div>
        </form>
        <div className="sticky">
          <MapView movers={[{ ...mover, ...f, id: mover.id }]} zoom={11} onMapClick={(p) => setF({ ...f, coverage: { ...f.coverage, ...p } })} />
          <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>Tap the map to move your coverage centre.</p>
        </div>
      </div>
    </Page>
  );
}
