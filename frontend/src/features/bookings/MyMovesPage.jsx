import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPinned, CalendarClock, MessageCircle } from 'lucide-react';
import { Page } from '../../components/Reveal';
import { Spinner, ErrorCard } from '../../components/Feedback';
import { kes } from '../../utils/geo';
import { useBookingsQuery, useRescheduleMutation, useReviewMutation, errorText } from '../../api/api';
import Chat from './Chat';
import StatusSteps, { statusChip } from './StatusSteps';

export default function MyMovesPage() {
  const { data: moves, isLoading, error, refetch } = useBookingsQuery(undefined, { pollingInterval: 30000, refetchOnFocus: true });
  return (
    <Page className="container">
      <span className="eyebrow">Step 3 · My moves</span>
      <h1 style={{ fontSize: 'clamp(2rem,5vw,3.2rem)' }}>Your moves</h1>
      {isLoading ? <Spinner /> : error ? <ErrorCard error={error} retry={refetch} /> : moves.length === 0 ? (
        <div className="card empty"><h3>No moves booked yet</h3><p>Build your inventory, then get a quote.</p><Link className="btn btn-primary" to="/inventory">Start planning</Link></div>
      ) : (
        <div className="grid" style={{ gap: 20 }}>{moves.map((b, i) => <MoveCard key={b.id} b={b} i={i} />)}</div>
      )}
    </Page>
  );
}

function MoveCard({ b, i }) {
  const mover = b.mover;
  const [date, setDate] = useState(b.date);
  const [chat, setChat] = useState(false);
  const [stars, setStars] = useState(0);
  const [text, setText] = useState('');
  const [err, setErr] = useState('');
  const [reschedule, rs] = useRescheduleMutation();
  const [review, rv] = useReviewMutation();
  const min = new Date(Date.now() + 864e5).toISOString().slice(0, 10);
  const act = async (p) => { setErr(''); try { await p.unwrap(); } catch (x) { setErr(errorText(x)); } };

  return (
    <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
      <div className="row between">
        <div className="row" style={{ flexWrap: 'nowrap' }}>
          <div className="avatar" style={{ background: mover?.color }}>{mover?.name[0]}</div>
          <div><h3 style={{ margin: 0 }}>{b.pickup.label} → {b.dropoff.label}</h3><div className="muted" style={{ fontSize: 13 }}>{mover?.name} · {b.date} · {b.km} km · {b.items} items</div></div>
        </div>
        <div className="row"><span className={`chip ${statusChip(b.status)}`}>{b.status === 'In-Progress' && <span className="live-dot" />}{b.status}</span><b>{kes(b.total)}</b></div>
      </div>
      <div style={{ margin: '18px 0' }}><StatusSteps status={b.status} /></div>
      <div className="row">
        <Link to={`/track/${b.id}`} className="btn btn-primary btn-sm"><MapPinned size={14} /> {b.status === 'In-Progress' ? 'Track live' : 'View on map'}</Link>
        <button className="btn btn-ghost btn-sm" onClick={() => setChat((c) => !c)}><MessageCircle size={14} /> Messages</button>
        {b.status === 'Pending' && (
          <div className="row" style={{ gap: 6 }}>
            <input type="date" className="input" style={{ width: 170, padding: '7px 10px' }} min={min} value={date} onChange={(e) => setDate(e.target.value)} />
            <button className="btn btn-ghost btn-sm" disabled={date === b.date || !date || rs.isLoading} onClick={() => act(reschedule({ id: b.id, date }))}><CalendarClock size={14} /> Reschedule</button>
          </div>
        )}
      </div>
      {err && <p className="error" style={{ marginTop: 10 }}>{err}</p>}
      {chat && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ marginTop: 16, overflow: 'hidden' }}><Chat bookingId={b.id} as="client" /></motion.div>}
      {b.status === 'Completed' && !b.review && (
        <div className="card" style={{ marginTop: 16, background: 'var(--bg-2)' }}>
          <b>How was {mover?.name}?</b>
          <div className="stars" style={{ margin: '6px 0' }}>{[1, 2, 3, 4, 5].map((n) => <button key={n} className={n <= stars ? 'on' : ''} onClick={() => setStars(n)} aria-label={`${n} stars`}>★</button>)}</div>
          <textarea className="input" rows="2" maxLength={1000} placeholder="Tell other Nairobians about your move" value={text} onChange={(e) => setText(e.target.value)} />
          <button className="btn btn-primary btn-sm" style={{ marginTop: 10 }} disabled={!stars || rv.isLoading} onClick={() => act(review({ id: b.id, stars, text }))}>Submit review</button>
        </div>
      )}
      {b.review && <p className="muted" style={{ marginTop: 14, marginBottom: 0 }}>Your review: <span style={{ color: 'var(--amber)' }}>{'★'.repeat(b.review.stars)}</span> {b.review.text}</p>}
    </motion.div>
  );
}
