import { createSlice } from '@reduxjs/toolkit';

const KEY = 'smartmove-session';
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
const save = (s) => { try { s.token ? localStorage.setItem(KEY, JSON.stringify(s)) : localStorage.removeItem(KEY); } catch { /* storage blocked */ } };

const initial = load();

const authSlice = createSlice({
  name: 'auth',
  initialState: { token: initial.token || null, user: initial.user || null },
  reducers: {
    loggedIn(state, { payload: { token, user } }) { state.token = token; state.user = user; save({ token, user }); },
    userRefreshed(state, { payload }) { state.user = payload; save({ token: state.token, user: payload }); },
    loggedOut(state) { state.token = null; state.user = null; save({}); },
  },
});

export const { loggedIn, userRefreshed, loggedOut } = authSlice.actions;
export const selectUser = (s) => s.auth.user;
export default authSlice.reducer;
