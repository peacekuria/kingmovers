import { createSlice, nanoid } from '@reduxjs/toolkit';
import { TEMPLATES } from '../../data/nairobi';

const build = (key) => ({
  template: key,
  rooms: Object.fromEntries(
    Object.entries(TEMPLATES[key].rooms).map(([room, items]) => [
      room, items.map((i) => ({ ...i, id: nanoid(), checked: true, qty: 1 })),
    ])
  ),
});

const inventorySlice = createSlice({
  name: 'inventory',
  initialState: { ...build('1BR'), loaded: false },
  reducers: {
    // Server copy wins once loaded; a brand-new client starts from the 1BR template.
    hydrate: (_s, { payload }) => (payload ? { template: payload.template, rooms: payload.rooms, loaded: true } : { ...build('1BR'), loaded: true }),
    resetInventory: () => ({ ...build('1BR'), loaded: false }),
    loadTemplate: (_s, { payload }) => ({ ...build(payload), loaded: true }),
    toggleItem(state, { payload: { room, id } }) {
      const it = state.rooms[room]?.find((i) => i.id === id);
      if (it) it.checked = !it.checked;
    },
    setQty(state, { payload: { room, id, qty } }) {
      const it = state.rooms[room]?.find((i) => i.id === id);
      if (it) it.qty = Math.max(1, Math.min(20, qty));
    },
    addItem: {
      reducer(state, { payload: { room, item } }) {
        (state.rooms[room] ||= []).push(item);
      },
      prepare: ({ room, name, kg, m3 }) => ({
        payload: { room, item: { id: nanoid(), name, kg: +kg || 10, m3: +m3 || 0.2, checked: true, qty: 1, custom: true } },
      }),
    },
    removeItem(state, { payload: { room, id } }) {
      state.rooms[room] = state.rooms[room].filter((i) => i.id !== id);
    },
  },
});

export const { hydrate, resetInventory, loadTemplate, toggleItem, setQty, addItem, removeItem } = inventorySlice.actions;
export default inventorySlice.reducer;
