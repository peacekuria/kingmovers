import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotificationsQuery } from '../api/api';

// Shows a toast (and a browser notification when permitted) for each new
// server-side notification that arrives while the app is open.
export default function Toasts() {
  const user = useSelector((s) => s.auth.user);
  const { data } = useNotificationsQuery(undefined, { skip: !user, pollingInterval: 15000 });
  const [toasts, setToasts] = useState([]);
  const seen = useRef(null);

  useEffect(() => { seen.current = null; }, [user?.id]);

  useEffect(() => {
    if (!data) return;
    const ids = new Set(data.notifications.map((n) => n.id));
    if (seen.current === null) { seen.current = ids; return; } // don't replay history on load
    const fresh = data.notifications.filter((n) => !seen.current.has(n.id) && !n.read);
    seen.current = ids;
    if (!fresh.length) return;
    setToasts((t) => [...t, ...fresh]);
    fresh.forEach((n) => {
      setTimeout(() => setToasts((t) => t.filter((x) => x.id !== n.id)), 5000);
      try {
        if ('Notification' in window && Notification.permission === 'granted' && document.visibilityState !== 'visible')
          new Notification(n.title, { body: n.body, icon: '/favicon.svg', tag: `sm-${n.id}` });
      } catch { /* push is best-effort */ }
    });
  }, [data]);

  return (
    <div className="toasts" aria-live="polite">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div key={t.id} layout className={`toast ${t.tone}`} initial={{ opacity: 0, x: 60, scale: .95 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 60 }}>
            <b>{t.title}</b>
            <div className="muted" style={{ fontSize: 13 }}>{t.body}</div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
