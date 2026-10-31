import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
      // 1. Check Redux state
      const state = getState();
      let token = state?.auth?.token;

      // 2. Check localStorage fallback
      if (!token && typeof window !== 'undefined') {
        try {
          token = localStorage.getItem('drapza_token');
        } catch {}
      }

      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }

      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: [
    'User',
    'Product',
    'Order',
    'Cart',
    'Address',
    'Testimonial',
    'Terms',
    'Ticket'
  ],
  endpoints: () => ({}),
});
