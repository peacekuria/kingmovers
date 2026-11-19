import { useEffect, useState } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Menu, X, Truck, LogOut } from 'lucide-react';
import { loggedOut, selectUser } from '../features/auth/authSlice';
import { useNotificationsQuery, useMarkReadMutation } from '../api/api';

const LINKS = {
  guest: [['/', 'Home'], ['/movers', 'Movers'], ['/quote', 'Get a quote']],
  client: [['/inventory', 'Inventory'], ['/movers', 'Movers'], ['/quote', 'Quote & book'], ['/moves', 'My moves']],
  mover: [['/mover', 'Jobs'], ['/mover/profile', 'Profile']],
  admin: [['/admin', 'Overview'], ['/admin/movers', 'Movers'], ['/admin/users', 'Users']],
};

export default function Navbar() {
  const user = useSelector(selectUser);
  const { data } = useNotificationsQuery(undefined, { skip: !user, pollingInterval: 15000, refetchOnFocus: true });
  const [markRead] = useMarkReadMutation();
  const notes = data?.notifications || [];
  const unread = data?.unread || 0;
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [bell, setBell] = useState(false);
  const dispatch = useDispatch();
  const nav = useNavigate();
  const loc = useLocation();

  useEffect(() => { const f = () => setScrolled(window.scrollY > 20); f(); window.addEventListener('scroll', f, { passive: true }); return () => window.removeEventListener('scroll', f); }, []);
  useEffect(() => { setOpen(false); setBell(false); }, [loc.pathname]);

  const links = LINKS[user?.role || 'guest'];
  const toggleBell = () => {
    setBell((b) => !b);
    if (!bell && unread) markRead();
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
  };

  return (
    <>
      <header className={`nav ${scrolled || open ? 'scrolled' : ''}`}>
        <div className="container nav-inner">
          <Link to="/" className="logo"><span className="logo-mark"><Truck size={18} /></span>SmartMove</Link>
          <nav className="nav-links">
            {links.map(([to, label]) => (
              <NavLink key={to} to={to} end>
                {({ isActive }) => (<>{isActive && <motion.span layoutId="nav-pill" className="nav-pill" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}{label}</>)}
              </NavLink>
            ))}
          </nav>
          <div className="nav-right">
            {user ? (
              <>
                <div style={{ position: 'relative' }}>
                  <button className="btn btn-ghost icon-btn" onClick={toggleBell} aria-label="Notifications">
                    <motion.span key={unread} animate={unread ? { rotate: [0, -18, 14, -8, 0] } : {}} transition={{ duration: .6 }} style={{ display: 'grid' }}><Bell size={18} /></motion.span>
                    {unread > 0 && <span className="bell-badge">{unread}</span>}
                  </button>
                  <AnimatePresence>
                    {bell && (
                      <motion.div className="dropdown" initial={{ opacity: 0, y: -8, scale: .97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8 }}>
                        {notes.length === 0 ? <p className="muted" style={{ padding: 12, margin: 0 }}>No notifications yet.</p> :
                          notes.map((n) => (
                            <div key={n.id} className={`notif ${n.read ? '' : 'unread'}`} onClick={() => n.link && nav(n.link)} style={{ cursor: n.link ? 'pointer' : 'default' }}>
                              <b style={{ fontSize: 14 }}>{n.title}</b>
                              <div className="muted" style={{ fontSize: 13 }}>{n.body}</div>
                              <div className="muted" style={{ fontSize: 11 }}>{new Date(n.at).toLocaleString('en-KE')}</div>
                            </div>
                          ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <button className="btn btn-ghost btn-sm" onClick={() => { dispatch(loggedOut()); nav('/'); }}><LogOut size={15} /><span className="hide-sm">Log out</span></button>
              </>
            ) : (
              <Link to="/auth" className="btn btn-primary btn-sm">Sign in</Link>
            )}
            <button className="btn btn-ghost icon-btn burger" onClick={() => setOpen((o) => !o)} aria-label="Menu">{open ? <X size={18} /> : <Menu size={18} />}</button>
          </div>
        </div>
      </header>
      <AnimatePresence>
        {open && (
          <motion.nav className="mobile-menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {links.map(([to, label], i) => (
              <motion.div key={to} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                <NavLink to={to} end>{label}</NavLink>
              </motion.div>
            ))}
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  );
}
