import { useSelector } from 'react-redux';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { selectUser } from '../features/auth/authSlice';

export default function ProtectedRoute({ roles, children }) {
  const user = useSelector(selectUser);
  const loc = useLocation();
  if (!user) return <Navigate to="/auth" replace state={{ from: loc.pathname }} />;
  if (roles && !roles.includes(user.role))
    return (
      <main className="page container"><div className="card empty">
        <h2>No access</h2>
        <p>This area is for {roles.join(' / ')} accounts. You're signed in as a {user.role}.</p>
        <Link className="btn btn-primary" to={home(user.role)}>Go to my dashboard</Link>
      </div></main>
    );
  return children;
}

export const home = (role) => ({ client: '/inventory', mover: '/mover', admin: '/admin' }[role] || '/');
