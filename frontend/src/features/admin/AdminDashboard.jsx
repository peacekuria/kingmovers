import { useSelector } from 'react-redux';
import { NavLink, Routes, Route } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, X, Ban, RotateCcw } from 'lucide-react';
import { Page } from '../../components/Reveal';
import { Spinner, ErrorCard } from '../../components/Feedback';
import { kes } from '../../utils/geo';
import { useAdminStatsQuery, useAdminUsersQuery, useAdminMoversQuery, useSetUserActiveMutation, useSetMoverStatusMutation, downloadFile } from '../../api/api';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function AdminDashboard() {
  return (
    <Page className="container">
      <span className="eyebrow">Admin</span>
      <h1 style={{ fontSize: 'clamp(2rem,5vw,3.2rem)' }}>Platform control</h1>
      <Routes>
        <Route index element={<Overview />} />
        <Route path="movers" element={<MoversAdmin />} />
        <Route path="users" element={<UsersAdmin />} />
      </Routes>
    </Page>
  );
}

function Overview() {
  const { data: st, isLoading, error, refetch } = useAdminStatsQuery(undefined, { pollingInterval: 60000 });
  const token = useSelector((s) => s.auth.token);
  if (isLoading) return <><AdminTabs /><Spinner /></>;
  if (error) return <><AdminTabs /><ErrorCard error={error} retry={refetch} /></>;
  const series = st.perMonth.map((v, i) => ({ m: MONTHS[i], v }));
  const max = Math.max(...series.map((s) => s.v), 1);
  const peak = series.reduce((a, b) => (b.v > a.v ? b : a), series[0] || { m: '-', v: 0 });
  const exportCsv = () => downloadFile('/admin/reports/bookings.csv', token, `smartmove-bookings-${new Date().toISOString().slice(0, 10)}.csv`).catch(() => alert('Export failed. Please try again.'));
  const totalRatings = Object.values(st.ratings).reduce((a, b) => a + b, 0);

  return (
    <>
      <AdminTabs />
      <div className="grid stats-grid" style={{ marginBottom: 20 }}>
        {[['Users', st.users], ['Approved movers', st.approvedMovers], ['Pending approvals', st.pendingMovers], ['Bookings', st.bookings]].map(([l, v], i) => (
          <motion.div key={l} className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * .06 }}>
            <span className="muted" style={{ fontSize: 13 }}>{l}</span><div className="price-big" style={{ fontSize: 32 }}>{v}</div>
          </motion.div>
        ))}
      </div>
      <div className="layout-side">
        <div className="grid" style={{ gap: 16 }}>
          <div className="card">
            <div className="row between"><h3 style={{ margin: 0 }}>Bookings per month, {st.year}</h3><button className="btn btn-ghost btn-sm" onClick={exportCsv}>Export report (CSV)</button></div>
            <div className="bars" role="img" aria-label={`Monthly bookings: ${series.map((s) => `${s.m} ${s.v}`).join(', ')}`}>
              {series.map((s, i) => (
                <div key={s.m} className="bar-hit">
                  <motion.div className="bar" style={{ width: '100%', height: `${(s.v / max) * 100}%` }} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ delay: i * 0.05, duration: .6, ease: [0.2, 0.7, 0.2, 1] }} />
                  <span className="bar-tip">{s.m}: {s.v} bookings</span>
                </div>
              ))}
            </div>
            <div className="bar-labels">{series.map((s) => <span key={s.m}>{s.m}</span>)}</div>
            <p className="muted" style={{ fontSize: 13, marginTop: 12, marginBottom: 0 }}>Peak: {peak.m} ({peak.v}) · Total booking value {kes(st.revenue)}</p>
          </div>
          <div className="card">
            <h3>Bookings by status</h3>
            <div className="row">{['Pending', 'In-Progress', 'Completed'].map((k) => <span key={k} className="chip">{k}: <b>{st.byStatus[k] || 0}</b></span>)}</div>
          </div>
        </div>
        <div className="grid" style={{ gap: 16 }}>
          <div className="card"><h3>Top routes</h3>{st.topRoutes.length ? st.topRoutes.map((r) => <div key={r.route} className="row between" style={{ padding: '6px 0' }}><span>{r.route}</span><span className="chip">{r.count}</span></div>) : <p className="muted">No bookings yet.</p>}</div>
          <div className="card">
            <h3>Customer feedback</h3>
            {totalRatings ? [5, 4, 3, 2, 1].map((n) => (
              <div key={n} className="row" style={{ flexWrap: 'nowrap', gap: 8, fontSize: 13 }}>
                <span style={{ width: 24 }}>{n}★</span>
                <div className="progress" style={{ flex: 1 }}><div style={{ width: `${(st.ratings[n] / totalRatings) * 100}%` }} /></div>
                <span className="muted" style={{ width: 24, textAlign: 'right' }}>{st.ratings[n]}</span>
              </div>
            )) : <p className="muted" style={{ margin: 0 }}>No reviews yet.</p>}
            {st.recentReviews.map((r) => <div key={r.id} style={{ padding: '8px 0 0', fontSize: 13 }}><span style={{ color: 'var(--amber)' }}>{'★'.repeat(r.stars)}</span> <b>{r.mover}</b> <span className="muted">{r.text || 'No comment'}, {r.clientName}</span></div>)}
          </div>
        </div>
      </div>
    </>
  );
}

function AdminTabs() {
  return (
    <div className="row" style={{ marginBottom: 20 }}>
      {[['/admin', 'Overview'], ['/admin/movers', 'Movers'], ['/admin/users', 'Users']].map(([to, l]) => (
        <NavLink key={to} to={to} end className={({ isActive }) => `btn btn-sm ${isActive ? 'btn-primary' : 'btn-ghost'}`}>{l}</NavLink>
      ))}
    </div>
  );
}

function MoversAdmin() {
  const { data: movers, isLoading, error, refetch } = useAdminMoversQuery();
  const [setStatus] = useSetMoverStatusMutation();
  if (isLoading) return <><AdminTabs /><Spinner /></>;
  if (error) return <><AdminTabs /><ErrorCard error={error} retry={refetch} /></>;
  const order = { pending: 0, approved: 1, rejected: 2 };
  return (
    <>
      <AdminTabs />
      <div className="card table-wrap">
        <table className="table-cards">
          <thead><tr><th>Company</th><th>Rating</th><th>Vehicle</th><th>Coverage</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {[...movers].sort((a, b) => order[a.status] - order[b.status]).map((m) => (
              <motion.tr key={m.id} layout>
                <td className="full"><b>{m.name}</b><div className="muted" style={{ fontSize: 12 }}>{m.ownerEmail || 'No owner account'}</div></td>
                <td data-label="Rating">{m.reviews ? `${m.rating.toFixed(1)} ★` : '-'}</td><td data-label="Vehicle">{m.vehicle}</td><td data-label="Coverage">{m.coverage.radiusKm} km</td>
                <td data-label="Status"><span className={`chip ${{ pending: 'chip-amber', approved: 'chip-green', rejected: 'chip-red' }[m.status]}`}>{m.status}</span></td>
                <td className="full"><div className="row" style={{ gap: 6 }}>
                  {m.status !== 'approved' && <button className="btn btn-ghost btn-sm" onClick={() => setStatus({ id: m.id, status: 'approved' })}><Check size={14} /> Approve</button>}
                  {m.status !== 'rejected' && <button className="btn btn-ghost btn-sm" onClick={() => setStatus({ id: m.id, status: 'rejected' })}><X size={14} /> {m.status === 'approved' ? 'Suspend' : 'Reject'}</button>}
                </div></td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function UsersAdmin() {
  const { data: users, isLoading, error, refetch } = useAdminUsersQuery();
  const me = useSelector((s) => s.auth.user);
  const [setActive] = useSetUserActiveMutation();
  if (isLoading) return <><AdminTabs /><Spinner /></>;
  if (error) return <><AdminTabs /><ErrorCard error={error} retry={refetch} /></>;
  return (
    <>
      <AdminTabs />
      <div className="card table-wrap">
        <table className="table-cards">
          <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td className="full"><b>{u.name}</b></td><td className="full" data-label="Email">{u.email}</td><td data-label="Phone">{u.phone}</td>
                <td data-label="Role"><span className="chip">{u.role}</span></td>
                <td data-label="Status"><span className={`chip ${u.active ? 'chip-green' : 'chip-red'}`}>{u.active ? 'active' : 'suspended'}</span></td>
                <td className="full">{u.id !== me.id && <button className="btn btn-ghost btn-sm" onClick={() => setActive({ id: u.id, active: !u.active })}>{u.active ? <><Ban size={14} /> Suspend</> : <><RotateCcw size={14} /> Restore</>}</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
