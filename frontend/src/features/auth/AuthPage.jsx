import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { loggedIn, selectUser } from './authSlice';
import { useLoginMutation, useRegisterMutation, errorText } from '../../api/api';
import { home } from '../../components/ProtectedRoute';

const DEMO = [['client', 'client@smartmove.ke'], ['mover', 'mover@smartmove.ke'], ['admin', 'admin@smartmove.ke']];

export default function AuthPage() {
  const [params] = useSearchParams();
  const [mode, setMode] = useState(params.get('mode') === 'signup' ? 'signup' : 'login');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: params.get('role') || 'client', company: '' });
  const [localErr, setLocalErr] = useState('');
  const [doLogin, l] = useLoginMutation();
  const [doRegister, r] = useRegisterMutation();
  const busy = l.isLoading || r.isLoading;
  const user = useSelector(selectUser);
  const dispatch = useDispatch();
  const nav = useNavigate();
  const loc = useLocation();

  useEffect(() => { if (user) nav(loc.state?.from || home(user.role), { replace: true }); }, [user, nav, loc.state]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const run = async (fn) => {
    try { dispatch(loggedIn(await fn.unwrap())); } catch (err) { setLocalErr(errorText(err)); }
  };
  const submit = (e) => {
    e.preventDefault(); setLocalErr('');
    if (mode === 'signup') {
      if (form.password.length < 8) return setLocalErr('Password must be at least 8 characters.');
      if (!/^(\+?254|0)[17]\d{8}$/.test(form.phone.replace(/[\s-]/g, ''))) return setLocalErr('Enter a Kenyan phone number, e.g. 0712 345 678.');
      run(doRegister(form));
    } else run(doLogin({ email: form.email, password: form.password }));
  };

  return (
    <div className="auth-shell">
      <div className="auth-art">
        <motion.img src="/images/nairobi-upperhill.jpg" alt="Nairobi skyline at golden hour" initial={{ scale: 1.12 }} animate={{ scale: 1 }} transition={{ duration: 12, ease: 'easeOut' }} />
        <div style={{ position: 'absolute', bottom: 60, left: 48, right: 48 }}>
          <motion.h2 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .2 }}>Karibu nyumbani.</motion.h2>
          <p>Your next home in Nairobi is one organized move away.</p>
        </div>
      </div>
      <div className="auth-form">
        <motion.div className="card card-glow" style={{ width: 'min(440px, 100%)' }} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
          <div className="tabs" style={{ marginBottom: 22 }}>
            {['login', 'signup'].map((m) => (
              <button key={m} className={mode === m ? 'on' : ''} onClick={() => { setMode(m); setLocalErr(''); }} type="button">
                {mode === m && <motion.span layoutId="auth-tab" className="tab-pill" />}{m === 'login' ? 'Log in' : 'Sign up'}
              </button>
            ))}
          </div>
          <form onSubmit={submit}>
            <AnimatePresence initial={false}>
              {mode === 'signup' && (
                <motion.div key="extra" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                  <div className="field"><label>I am a</label>
                    <div className="role-pick">
                      {['client', 'mover'].map((r) => <button type="button" key={r} className={form.role === r ? 'on' : ''} onClick={() => setForm({ ...form, role: r })}>{r === 'client' ? 'I’m moving home' : 'I run a moving company'}</button>)}
                    </div>
                  </div>
                  <div className="field"><label>Full name</label><input className="input" required={mode === 'signup'} value={form.name} onChange={set('name')} /></div>
                  {form.role === 'mover' && <div className="field"><label>Company name</label><input className="input" required value={form.company} onChange={set('company')} /></div>}
                  <div className="field"><label>Phone</label><input className="input" required={mode === 'signup'} placeholder="0712 345 678" value={form.phone} onChange={set('phone')} /></div>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="field"><label>Email</label><input className="input" type="email" required value={form.email} onChange={set('email')} autoComplete="email" /></div>
            <div className="field"><label>Password</label><input className="input" type="password" required value={form.password} onChange={set('password')} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} /></div>
            {localErr && <motion.p key={localErr} className="error" initial={{ x: -8 }} animate={{ x: [8, -6, 4, 0] }} role="alert">{localErr}</motion.p>}
            <button className="btn btn-primary" style={{ width: '100%' }} disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}</button>
            {mode === 'signup' && form.role === 'mover' && <p className="muted" style={{ fontSize: 13, marginTop: 12 }}>Mover accounts go live after an admin approves them.</p>}
          </form>
          {mode === 'login' && import.meta.env.VITE_SHOW_DEMO_ACCOUNTS !== 'false' && (
            <div style={{ marginTop: 20 }}>
              <p className="muted" style={{ fontSize: 12, marginBottom: 8 }}>DEMO ACCOUNTS (seeded data)</p>
              <div className="row">
                {DEMO.map(([r, email]) => <button key={r} className="btn btn-ghost btn-sm" type="button" disabled={busy} onClick={() => run(doLogin({ email, password: 'password' }))}>{r}</button>)}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
