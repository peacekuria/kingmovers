import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { loggedOut } from '../features/auth/authSlice';

export const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '') + '/api';

const raw = fetchBaseQuery({
  baseUrl: API_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token;
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return headers;
  },
});

// Expired/invalid sessions log the user out everywhere.
const baseQuery = async (args, api, extra) => {
  const res = await raw(args, api, extra);
  if (res.error?.status === 401 && api.getState().auth.token && api.endpoint !== 'login') api.dispatch(loggedOut());
  return res;
};

export const errorText = (e) => e?.data?.error || (e?.status === 'FETCH_ERROR' ? 'Cannot reach the server. Check your connection.' : 'Something went wrong.');

export const api = createApi({
  reducerPath: 'api',
  baseQuery,
  tagTypes: ['Me', 'Movers', 'MyMover', 'Inventory', 'Bookings', 'Booking', 'Messages', 'Notifications', 'Admin'],
  endpoints: (b) => ({
    // auth
    login: b.mutation({ query: (body) => ({ url: '/auth/login', method: 'POST', body }) }),
    register: b.mutation({ query: (body) => ({ url: '/auth/register', method: 'POST', body }) }),
    me: b.query({ query: () => '/auth/me', providesTags: ['Me'] }),

    // movers
    movers: b.query({ query: (p) => ({ url: '/movers', params: p || undefined }), transformResponse: (r) => r.movers, providesTags: ['Movers'] }),
    getPublicStats: b.query({ query: () => '/movers/stats' }),
    myMover: b.query({ query: () => '/movers/me', transformResponse: (r) => r.mover, providesTags: ['MyMover'] }),
    updateMyMover: b.mutation({ query: (body) => ({ url: '/movers/me', method: 'PATCH', body }), invalidatesTags: ['MyMover', 'Movers'] }),

    // inventory + quotes
    inventory: b.query({ query: () => '/inventory', providesTags: ['Inventory'] }),
    saveInventory: b.mutation({ query: (body) => ({ url: '/inventory', method: 'PUT', body }) }),
    quotes: b.query({ query: (body) => ({ url: '/quotes', method: 'POST', body }) }),

    // bookings
    bookings: b.query({ query: () => '/bookings', transformResponse: (r) => r.bookings, providesTags: ['Bookings'] }),
    booking: b.query({ query: (id) => `/bookings/${id}`, transformResponse: (r) => r.booking, providesTags: (_r, _e, id) => [{ type: 'Booking', id }] }),
    createBooking: b.mutation({ query: (body) => ({ url: '/bookings', method: 'POST', body }), invalidatesTags: ['Bookings', 'Notifications', 'Admin'] }),
    reschedule: b.mutation({ query: ({ id, date }) => ({ url: `/bookings/${id}/reschedule`, method: 'PATCH', body: { date } }), invalidatesTags: (_r, _e, { id }) => ['Bookings', 'Notifications', { type: 'Booking', id }] }),
    setStatus: b.mutation({ query: ({ id, status }) => ({ url: `/bookings/${id}/status`, method: 'PATCH', body: { status } }), invalidatesTags: (_r, _e, { id }) => ['Bookings', { type: 'Booking', id }] }),
    review: b.mutation({ query: ({ id, ...body }) => ({ url: `/bookings/${id}/review`, method: 'POST', body }), invalidatesTags: (_r, _e, { id }) => ['Bookings', 'Movers', { type: 'Booking', id }] }),
    messages: b.query({ query: (id) => `/bookings/${id}/messages`, transformResponse: (r) => r.messages, providesTags: (_r, _e, id) => [{ type: 'Messages', id }] }),
    sendMessage: b.mutation({ query: ({ id, text }) => ({ url: `/bookings/${id}/messages`, method: 'POST', body: { text } }), invalidatesTags: (_r, _e, { id }) => [{ type: 'Messages', id }] }),
    location: b.query({ query: (id) => `/bookings/${id}/location` }),
    pushLocation: b.mutation({ query: ({ id, ...body }) => ({ url: `/bookings/${id}/location`, method: 'POST', body }) }),

    // notifications
    notifications: b.query({ query: () => '/notifications', providesTags: ['Notifications'] }),
    markRead: b.mutation({ query: () => ({ url: '/notifications/read', method: 'POST', body: {} }), invalidatesTags: ['Notifications'] }),

    // admin
    adminStats: b.query({ query: () => '/admin/stats', providesTags: ['Admin'] }),
    adminUsers: b.query({ query: () => '/admin/users', transformResponse: (r) => r.users, providesTags: ['Admin'] }),
    adminMovers: b.query({ query: () => '/admin/movers', transformResponse: (r) => r.movers, providesTags: ['Admin'] }),
    setUserActive: b.mutation({ query: ({ id, active }) => ({ url: `/admin/users/${id}`, method: 'PATCH', body: { active } }), invalidatesTags: ['Admin'] }),
    setMoverStatus: b.mutation({ query: ({ id, status }) => ({ url: `/admin/movers/${id}`, method: 'PATCH', body: { status } }), invalidatesTags: ['Admin', 'Movers'] }),
  }),
});

export const {
  useLoginMutation, useRegisterMutation, useMeQuery, useMoversQuery, useGetPublicStatsQuery, useMyMoverQuery, useUpdateMyMoverMutation,
  useInventoryQuery, useSaveInventoryMutation, useQuotesQuery, useBookingsQuery, useBookingQuery, useCreateBookingMutation,
  useRescheduleMutation, useSetStatusMutation, useReviewMutation, useMessagesQuery, useSendMessageMutation, useLocationQuery,
  usePushLocationMutation, useNotificationsQuery, useMarkReadMutation, useAdminStatsQuery, useAdminUsersQuery,
  useAdminMoversQuery, useSetUserActiveMutation, useSetMoverStatusMutation,
} = api;

// Downloads an authenticated file (used for the admin CSV report).
export async function downloadFile(path, token, filename) {
  const res = await fetch(`${API_URL}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error('Download failed');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(await res.blob());
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
