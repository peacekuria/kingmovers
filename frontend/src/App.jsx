import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import Toasts from './components/Toasts';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './features/landing/Landing';
import SessionSync from './features/auth/SessionSync';

// Each feature is code-split and isolated behind its own error boundary.
const AuthPage = lazy(() => import('./features/auth/AuthPage'));
const InventoryPage = lazy(() => import('./features/inventory/InventoryPage'));
const MoversPage = lazy(() => import('./features/movers/MoversPage'));
const QuotePage = lazy(() => import('./features/quote/QuotePage'));
const MyMovesPage = lazy(() => import('./features/bookings/MyMovesPage'));
const TrackingPage = lazy(() => import('./features/tracking/TrackingPage'));
const MoverDashboard = lazy(() => import('./features/mover/MoverDashboard'));
const MoverProfile = lazy(() => import('./features/mover/MoverProfile'));
const AdminDashboard = lazy(() => import('./features/admin/AdminDashboard'));

const Loading = () => <div className="page container"><div className="progress" style={{ maxWidth: 200, margin: '40vh auto' }}><div style={{ width: '60%' }} /></div></div>;

const guard = (name, el, roles) => {
  const wrapped = <ErrorBoundary name={name}><Suspense fallback={<Loading />}>{el}</Suspense></ErrorBoundary>;
  return roles ? <ProtectedRoute roles={roles}>{wrapped}</ProtectedRoute> : wrapped;
};

export default function App() {
  const loc = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [loc.pathname]);
  const section = loc.pathname.split('/')[1];
  return (
    <>
      <SessionSync />
      <Navbar />
      <AnimatePresence mode="wait">
        <Routes location={loc} key={section}>
          <Route path="/" element={guard('Home', <Landing />)} />
          <Route path="/auth" element={guard('Sign in', <AuthPage />)} />
          <Route path="/movers" element={guard('Movers', <MoversPage />)} />
          <Route path="/quote" element={guard('Quote', <QuotePage />)} />
          <Route path="/inventory" element={guard('Inventory', <InventoryPage />, ['client'])} />
          <Route path="/moves" element={guard('My moves', <MyMovesPage />, ['client'])} />
          <Route path="/track/:id" element={guard('Tracking', <TrackingPage />, ['client', 'mover', 'admin'])} />
          <Route path="/mover" element={guard('Mover jobs', <MoverDashboard />, ['mover'])} />
          <Route path="/mover/profile" element={guard('Mover profile', <MoverProfile />, ['mover'])} />
          <Route path="/admin/*" element={guard('Admin', <AdminDashboard />, ['admin'])} />
          <Route path="*" element={<main className="page container"><div className="card empty"><h2>404</h2><p>That page moved out.</p></div></main>} />
        </Routes>
      </AnimatePresence>
      <Toasts />
    </>
  );
}
