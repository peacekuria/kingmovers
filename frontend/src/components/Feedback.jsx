import { errorText } from '../api/api';

export const Spinner = ({ label = 'Loading…' }) => (
  <div className="empty muted"><div className="progress" style={{ maxWidth: 160, margin: '0 auto 10px' }}><div className="indeterminate" /></div>{label}</div>
);

export const ErrorCard = ({ error, retry }) => (
  <div className="card empty">
    <h3>Couldn't load this</h3>
    <p>{errorText(error)}</p>
    {retry && <button className="btn btn-primary btn-sm" onClick={retry}>Try again</button>}
  </div>
);
