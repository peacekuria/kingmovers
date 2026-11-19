import { motion } from 'framer-motion';

export const STATUSES = ['Pending', 'In-Progress', 'Completed'];
export const statusChip = (s) => ({ Pending: 'chip-amber', 'In-Progress': 'chip-blue', Completed: 'chip-green' }[s]);

export default function StatusSteps({ status }) {
  const idx = STATUSES.indexOf(status);
  return (
    <div>
      <div className="status-steps">{STATUSES.map((s, i) => <motion.span key={s} className={i <= idx ? 'on' : ''} initial={false} animate={{ opacity: i <= idx ? 1 : .6 }} />)}</div>
      <div className="row between muted" style={{ fontSize: 11, marginTop: 4 }}>{STATUSES.map((s) => <span key={s}>{s}</span>)}</div>
    </div>
  );
}
