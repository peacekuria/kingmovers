import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Mail, MapPinned, MessageCircle, Clock, ListChecks } from 'lucide-react';
import { Page } from '../../components/Reveal';
import { Spinner, ErrorCard } from '../../components/Feedback';
import { useBookingsQuery, useMyMoverQuery, useSetStatusMutation, useBookingQuery, errorText } from '../../api/api';
import { kes } from '../../utils/geo';
import Chat from '../bookings/Chat';
import StatusSteps, { statusChip, STATUSES } from '../bookings/StatusSteps';

export function PendingBanner({ mover }) {
  if (!mover || mover.status === 'approved') return null;
  return (
    <div className={`card ${mover.status === 'rejected' ? '' : 'card-glow'}`} style={{ marginBottom: 20 }}>
      <b>{mover.status === 'rejected' ? 'Registration rejected' : 'Awaiting admin approval'}</b>
      <p style={{ margin: 0 }}>{mover.status === 'rejected' ? 'Contact support to appeal.' : 'Clients will see your company once an admin approves it. Complete your profile meanwhile.'}</p>
    </div>
  );
}

export default function MoverDashboard() {
  const { data: mover } = useMyMoverQuery();
  const { data: jobs, isLoading, error, refetch } = useBookingsQuery(undefined, { pollingInterval: 30000, refetchOnFocus: true });
  const [filter, setFilter] = useState('All');
  if (isLoading) return <Page className="container"><Spinner /></Page>;
  if (error) return <Page className="container"><ErrorCard error={error} retry={refetch} /></Page>;
  const shown = jobs.filter((j) => filter === 'All' || j.status === filter);
  const earnings = jobs.filter((j) => j.status === 'Completed').reduce((a, j) => a + j.total, 0);

  return (
    <Page className="container">
      <span className="eyebrow">Mover dashboard</span>
      <h1 style={{ fontSize: 'clamp(2rem,5vw,3.2rem)' }}>{mover?.name || 'Your jobs'}</h1>
      <PendingBanner mover={mover} />
      <div className="grid g4" style={{ marginBottom: 24 }}>
        {[['Total jobs', jobs.length], ['Pending', jobs.filter((j) => j.status === 'Pending').length], ['In progress', jobs.filter((j) => j.status === 'In-Progress').length], ['Earned', kes(earnings)]].map(([l, v], i) => (
          <motion.div key={l} className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <span className="muted" style={{ fontSize: 13 }}>{l}</span><div className="price-big" style={{ fontSize: 30 }}>{v}</div>
          </motion.div>
        ))}
      </div>
      <div className="tabs" style={{ maxWidth: 520, marginBottom: 20 }}>
        {['All', ...STATUSES].map((s) => (
          <button key={s} className={filter === s ? 'on' : ''} onClick={() => setFilter(s)}>{filter === s && <motion.span layoutId="job-tab" className="tab-pill" />}{s}</button>
        ))}
      </div>
      <div className="grid" style={{ gap: 16 }}>
        <AnimatePresence mode="popLayout">{shown.map((j) => <Job key={j.id} j={j} />)}</AnimatePresence>
        {!shown.length && <div className="card empty muted">No {filter === 'All' ? '' : filter.toLowerCase()} jobs yet.</div>}
      </div>
    </Page>
  );
}

function ItemList({ id }) {
  const { data, isLoading } = useBookingQuery(id);
  if (isLoading) return <p className="muted">Loading items…</p>;
  const byRoom = (data?.itemList || []).reduce((a, i) => ((a[i.room] ||= []).push(i), a), {});
  return (
    <div className="grid g3" style={{ gap: 12, marginTop: 14 }}>
      {Object.entries(byRoom).map(([room, items]) => (
        <div key={room}><b style={{ fontSize: 13 }}>{room}</b>{items.map((i, k) => <div key={k} className="muted" style={{ fontSize: 13 }}>{i.qty} × {i.name}</div>)}</div>
      ))}
    </div>
  );
}

function Job({ j }) {
  const [panel, setPanel] = useState(null);
  const [setStatus, { isLoading }] = useSetStatusMutation();
  const [err, setErr] = useState('');
  const change = async (status) => { setErr(''); try { await setStatus({ id: j.id, status }).unwrap(); } catch (x) { setErr(errorText(x)); } };
  const toggle = (p) => setPanel((x) => (x === p ? null : p));
  return (
    <motion.div layout className="card" initial={{ opacity: 0, scale: .97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: .95 }}>
      <div className="row between">
        <div>
          <h3 style={{ margin: 0 }}>{j.pickup.label} → {j.dropoff.label}</h3>
          <div className="muted" style={{ fontSize: 13 }}><Clock size={12} /> {j.date} · {j.km} km · {j.items} items · {j.totals.m3} m³ / {j.totals.kg} kg</div>
        </div>
        <div className="row"><span className={`chip ${statusChip(j.status)}`}>{j.status}</span><b>{kes(j.total)}</b></div>
      </div>
      <div className="row" style={{ margin: '14px 0', gap: 8 }}>
        <span className="chip">👤 {j.clientName}</span>
        <a className="chip" href={`tel:${j.clientPhone}`}><Phone size={12} /> {j.clientPhone}</a>
        <a className="chip" href={`mailto:${j.clientEmail}`}><Mail size={12} /> {j.clientEmail}</a>
      </div>
      <StatusSteps status={j.status} />
      <div className="row" style={{ marginTop: 14 }}>
        <select className="input" style={{ width: 180, padding: '8px 12px' }} value={j.status} disabled={isLoading || j.status === 'Completed'} onChange={(e) => change(e.target.value)} aria-label="Update status">
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <Link to={`/track/${j.id}`} className={`btn btn-sm ${j.status === 'In-Progress' ? 'btn-primary' : 'btn-ghost'}`}><MapPinned size={14} /> {j.status === 'In-Progress' ? 'Share live location' : 'Route'}</Link>
        <button className="btn btn-ghost btn-sm" onClick={() => toggle('items')}><ListChecks size={14} /> Items</button>
        <button className="btn btn-ghost btn-sm" onClick={() => toggle('chat')}><MessageCircle size={14} /> Chat</button>
      </div>
      {err && <p className="error" style={{ marginTop: 10 }}>{err}</p>}
      {panel === 'items' && <ItemList id={j.id} />}
      {panel === 'chat' && <div style={{ marginTop: 14 }}><Chat bookingId={j.id} as="mover" /></div>}
    </motion.div>
  );
}
