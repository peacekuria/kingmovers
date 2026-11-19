import { configureStore, createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import auth, { loggedOut } from '../features/auth/authSlice';
import inventory, { loadTemplate, toggleItem, setQty, addItem, removeItem, resetInventory } from '../features/inventory/inventorySlice';
import { api } from '../api/api';

// Debounced autosave of the client's checklist to the server.
const listener = createListenerMiddleware();
listener.startListening({
  matcher: isAnyOf(loadTemplate, toggleItem, setQty, addItem, removeItem),
  effect: async (_a, l) => {
    l.cancelActiveListeners();
    await l.delay(700);
    const { inventory: inv, auth: a } = l.getState();
    if (a.user?.role !== 'client') return;
    l.dispatch(api.endpoints.saveInventory.initiate({ template: inv.template, rooms: inv.rooms }, { track: false }));
  },
});
listener.startListening({
  actionCreator: loggedOut,
  effect: (_a, l) => { l.dispatch(api.util.resetApiState()); l.dispatch(resetInventory()); },
});

export const store = configureStore({
  reducer: { auth, inventory, [api.reducerPath]: api.reducer },
  middleware: (gDM) => gDM().prepend(listener.middleware).concat(api.middleware),
});
