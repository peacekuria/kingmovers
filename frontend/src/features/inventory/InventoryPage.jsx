import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Plus, Trash2, ArrowRight, Package } from 'lucide-react';
import { TEMPLATES } from '../../data/nairobi';
import { inventoryTotals } from '../../utils/geo';
import { loadTemplate, toggleItem, setQty, addItem, removeItem } from './inventorySlice';
import { Page, AnimatedNumber } from '../../components/Reveal';
import { Spinner } from '../../components/Feedback';

export default function InventoryPage() {
  const inv = useSelector((s) => s.inventory);
  const dispatch = useDispatch();
  const totals = inventoryTotals(inv);
  const rooms = Object.keys(inv.rooms);
  const [draft, setDraft] = useState({ room: rooms[0], name: '', kg: '', m3: '' });
  const all = Object.values(inv.rooms).flat();
  const pct = all.length ? Math.round((all.filter((i) => i.checked).length / all.length) * 100) : 0;

  const add = (e) => {
    e.preventDefault();
    if (!draft.name.trim()) return;
    dispatch(addItem({ ...draft, room: draft.room || rooms[0] }));
    setDraft({ ...draft, name: '', kg: '', m3: '' });
  };

  if (!inv.loaded) return <Page className="container"><Spinner label="Loading your inventory…" /></Page>;

  return (
    <Page className="container has-action-bar">
      <span className="eyebrow">Step 1 · Inventory</span>
      <h1 style={{ fontSize: 'clamp(2rem,5vw,3.2rem)' }}>What's coming with you?</h1>
      <p>Start from a template, then tick, untick or add your own items. Weight and volume feed straight into your quote. Changes save automatically.</p>

      <div className="row" style={{ margin: '24px 0 32px' }}>
        {Object.entries(TEMPLATES).map(([k, t]) => (
          <motion.button key={k} className={`tpl-btn ${inv.template === k ? 'on' : ''}`} whileTap={{ scale: .97 }}
            onClick={() => { if (inv.template !== k && confirm(`Load the ${t.label} template? Your current list will be replaced.`)) dispatch(loadTemplate(k)); }}>
            <div style={{ fontSize: 26 }}>{t.icon}</div>
            <b>{t.label}</b>
            <div className="muted" style={{ fontSize: 12 }}>{Object.values(t.rooms).flat().length} items</div>
          </motion.button>
        ))}
      </div>

      <div className="layout-side">
        <div className="grid" style={{ gap: 24 }}>
          {rooms.map((room) => (
            <motion.div key={room} className="card" layout>
              <div className="row between" style={{ marginBottom: 14 }}>
                <h3 style={{ margin: 0 }}>{room}</h3>
                <span className="chip">{inv.rooms[room].filter((i) => i.checked).length}/{inv.rooms[room].length}</span>
              </div>
              <div className="grid" style={{ gap: 8 }}>
                <AnimatePresence initial={false}>
                  {inv.rooms[room].map((it) => (
                    <motion.div key={it.id} layout initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0, marginTop: -8 }}>
                      <div className={`item-row ${it.checked ? '' : 'off'}`}>
                        <button className={`check ${it.checked ? 'on' : ''}`} onClick={() => dispatch(toggleItem({ room, id: it.id }))} aria-label={`Toggle ${it.name}`}>
                          <AnimatePresence>{it.checked && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} style={{ display: 'grid' }}><Check size={14} strokeWidth={3} /></motion.span>}</AnimatePresence>
                        </button>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 500 }}>{it.name} {it.custom && <span className="chip chip-blue" style={{ fontSize: 10, padding: '1px 6px' }}>custom</span>}</div>
                          <div className="muted" style={{ fontSize: 12 }}>{it.kg} kg · {it.m3} m³</div>
                        </div>
                        <div className="qty">
                          <button onClick={() => dispatch(setQty({ room, id: it.id, qty: it.qty - 1 }))} aria-label="Less">−</button>
                          <span style={{ width: 22, textAlign: 'center' }}>{it.qty}</span>
                          <button onClick={() => dispatch(setQty({ room, id: it.id, qty: it.qty + 1 }))} aria-label="More">+</button>
                        </div>
                        {it.custom && <button className="btn btn-ghost icon-btn" style={{ width: 30, height: 30 }} onClick={() => dispatch(removeItem({ room, id: it.id }))} aria-label="Remove"><Trash2 size={14} /></button>}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          ))}

          <form className="card" onSubmit={add}>
            <h3>Add a custom item</h3>
            <div className="grid g4" style={{ gap: 10 }}>
              <select className="input" value={draft.room} onChange={(e) => setDraft({ ...draft, room: e.target.value })}>{rooms.map((r) => <option key={r}>{r}</option>)}</select>
              <input className="input" placeholder="e.g. Piano, Aquarium" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
              <input className="input" type="number" min="1" placeholder="Weight (kg)" value={draft.kg} onChange={(e) => setDraft({ ...draft, kg: e.target.value })} />
              <input className="input" type="number" min="0.05" step="0.05" placeholder="Volume (m³)" value={draft.m3} onChange={(e) => setDraft({ ...draft, m3: e.target.value })} />
            </div>
            <button className="btn btn-ghost" style={{ marginTop: 12 }}><Plus size={16} /> Add item</button>
          </form>
        </div>

        <div className="card card-glow sticky">
          <div className="row"><Package size={18} color="var(--amber)" /><b>Load summary</b></div>
          <div className="grid g3-fixed" style={{ gap: 12, margin: '18px 0' }}>
            <div><div className="price-big" style={{ fontSize: 30 }}><AnimatedNumber value={totals.count} /></div><span className="muted">items</span></div>
            <div><div className="price-big" style={{ fontSize: 30 }}><AnimatedNumber value={totals.kg} /></div><span className="muted">kg</span></div>
            <div><div className="price-big" style={{ fontSize: 30 }}><AnimatedNumber value={totals.m3} format={(n) => n.toFixed(1)} /></div><span className="muted">m³</span></div>
          </div>
          <div className="progress"><motion.div animate={{ width: `${pct}%` }} /></div>
          <p className="muted" style={{ fontSize: 13, marginTop: 8 }}>{pct}% of listed items are moving · Suggested truck: <b style={{ color: 'var(--ink)' }}>{totals.m3 < 6 ? '1.5T Pickup' : totals.m3 < 14 ? '3T Canter' : '5T+ Truck'}</b></p>
          <Link to="/quote" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }}>Get my quote <ArrowRight size={16} /></Link>
        </div>
      </div>
      <div className="action-bar">
        <div><b>{totals.count} items</b><div className="muted" style={{ fontSize: 12 }}>{totals.kg} kg · {totals.m3} m³</div></div>
        <Link to="/quote" className="btn btn-primary">Get my quote <ArrowRight size={16} /></Link>
      </div>
    </Page>
  );
}
