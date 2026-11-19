import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Phone, Navigation, Radio } from 'lucide-react';
import MapView from '../../components/MapView';
import { Page } from '../../components/Reveal';
import { Spinner, ErrorCard } from '../../components/Feedback';
import { selectUser } from '../auth/authSlice';
import { useBookingQuery, useLocationQuery } from '../../api/api';
import { roadKm } from '../../utils/geo';
import Chat from '../bookings/Chat';
import StatusSteps from '../bookings/StatusSteps';
import useShareLocation from './useShareLocation';

function curve(a, b, n = 60) {
  const mx = (a.lat + b.lat) / 2 + (b.lng - a.lng) * 0.18;
  const my = (a.lng + b.lng) / 2 - (b.lat - a.lat) * 0.18;
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n, u = 1 - t;
    return { lat: u * u * a.lat + 2 * u * t * mx + t * t * b.lat, lng: u * u * a.lng + 2 * u * t * my + t * t * b.lng };
  });
}

const AVG_KMH = 23; // typical Nairobi daytime traffic

export default function TrackingPage() {
  const { id } = useParams();
  const user = useSelector(selectUser);
  const { data: b, isLoading, error, refetch } = useBookingQuery(id, { pollingInterval: 30000 });
  const live = b?.status === 'In-Progress';
  const { data: loc } = useLocationQuery(id, { skip: !b || b.status === 'Pending', pollingInterval: live ? 5000 : 0 });
  const [share, setShare] = useState(false);
  const isMover = user.role === 'mover';
  const gps = useShareLocation(id, isMover && live && share);
  const route = useMemo(() => (b ? curve(b.pickup, b.dropoff) : []), [b]);

  if (isLoading) return <Page className="container"><Spinner /></Page>;
  if (error) return <Page className="container"><ErrorCard error={error} retry={refetch} /></Page>;

  const truck = (isMover && gps.last) || loc?.location || (b.status === 'Completed' ? b.dropoff : null);
  const remaining = truck ? (b.status === 'Completed' ? 0 : roadKm(truck, b.dropoff)) : b.km;
  const progress = b.status === 'Completed' ? 1 : truck ? Math.max(0, Math.min(1, 1 - remaining / b.km)) : 0;
  const eta = Math.round((remaining / AVG_KMH) * 60);
  const lastSeen = loc?.location?.at ? Math.round((Date.now() - new Date(loc.location.at)) / 1000) : null;

  return (
    <Page className="container">
      <span className="eyebrow">{live ? <><span className="live-dot" /> Live tracking</> : 'Move route'}</span>
      <h1 style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)' }}>{b.pickup.label} → {b.dropoff.label}</h1>
      <div className="layout-side">
        <MapView tall pickup={b.pickup} dropoff={b.dropoff} route={route} truck={truck}>
          <div className="map-legend">
            <span className="chip">
              {live ? (truck ? `GPS · updated ${lastSeen ?? 0}s ago` : "Waiting for the mover's GPS…") : b.status}
            </span>
          </div>
        </MapView>
        <div className="grid sticky" style={{ gap: 16 }}>
          <div className="card card-glow">
            <div className="grid g3-fixed" style={{ gap: 10 }}>
              <div><span className="muted" style={{ fontSize: 12 }}>ETA</span><div className="price-big" style={{ fontSize: 28 }}>{live && truck ? `${eta}m` : b.status === 'Completed' ? '✓' : '--'}</div></div>
              <div><span className="muted" style={{ fontSize: 12 }}>Remaining</span><div className="price-big" style={{ fontSize: 28 }}>{remaining}<small style={{ fontSize: 14 }}> km</small></div></div>
              <div><span className="muted" style={{ fontSize: 12 }}>Progress</span><div className="price-big" style={{ fontSize: 28 }}>{Math.round(progress * 100)}%</div></div>
            </div>
            <div className="progress" style={{ margin: '14px 0' }}><motion.div animate={{ width: `${progress * 100}%` }} transition={{ duration: .8 }} /></div>
            <StatusSteps status={b.status} />
            {b.status === 'Pending' && <p className="muted" style={{ fontSize: 13, marginTop: 12, marginBottom: 0 }}>Live tracking starts when the mover marks the job In-Progress on {b.date}.</p>}
            {isMover && live && (
              <div style={{ marginTop: 14 }}>
                <button className={`btn ${share ? 'btn-ghost' : 'btn-primary'}`} style={{ width: '100%' }} onClick={() => setShare((s) => !s)}>
                  <Radio size={16} /> {share ? 'Stop sharing location' : 'Share my live location'}
                </button>
                <p className="muted" style={{ fontSize: 12, margin: '8px 0 0' }}>{gps.error || (gps.sharing ? 'Sharing GPS with your client. Keep this page open.' : 'Your client sees your truck on their map while sharing is on.')}</p>
              </div>
            )}
          </div>
          <div className="card">
            <div className="row between">
              <div className="row" style={{ flexWrap: 'nowrap' }}><div className="avatar" style={{ background: b.mover?.color }}>{b.mover?.name[0]}</div><div><b>{b.mover?.name}</b><div className="muted" style={{ fontSize: 12 }}>{b.mover?.vehicle} · {b.mover?.crew} crew</div></div></div>
              <div className="row" style={{ gap: 6 }}>
                {isMover && <a className="btn btn-ghost icon-btn" href={`tel:${b.clientPhone}`} aria-label="Call client"><Phone size={16} /></a>}
                <a className="btn btn-ghost icon-btn" target="_blank" rel="noreferrer" href={`https://www.google.com/maps/dir/?api=1&origin=${b.pickup.lat},${b.pickup.lng}&destination=${b.dropoff.lat},${b.dropoff.lng}`} aria-label="Directions in Google Maps"><Navigation size={16} /></a>
              </div>
            </div>
            <div style={{ marginTop: 14 }}><Chat bookingId={b.id} as={user.role} readOnly={user.role === 'admin'} /></div>
          </div>
          {user.role === 'client' && <Link to="/moves" className="muted" style={{ fontSize: 13 }}>← Back to my moves</Link>}
        </div>
      </div>
    </Page>
  );
}
