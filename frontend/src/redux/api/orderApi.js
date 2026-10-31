import { apiSlice } from './apiSlice';

export const orderApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    createOrder: builder.mutation({
      query: (orderData) => ({
        url: '/order/create',
        method: 'POST',
        body: orderData,
      }),
      invalidatesTags: ['Order', 'Cart'],
    }),

    getMyOrders: builder.query({
      query: () => '/order/my-orders',
      providesTags: ['Order'],
    }),

    getOrderById: builder.query({
      query: (id) => `/order/${id}`,
      providesTags: (result, error, id) => [{ type: 'Order', id }],
    }),

    trackOrder: builder.query({
      query: (trackingRef) => `/order/track/${trackingRef}`,
      providesTags: (result, error, trackingRef) => [{ type: 'Order', id: trackingRef }],
    }),

    cancelOrder: builder.mutation({
      query: ({ id, reason, email, phone }) => ({
        url: `/order/${id}/cancel`,
        method: 'POST',
        body: { reason, email, phone },
      }),
      invalidatesTags: ['Order'],
    }),
  }),
});

export const {
  useCreateOrderMutation,
  useGetMyOrdersQuery,
  useGetOrderByIdQuery,
  useTrackOrderQuery,
  useLazyTrackOrderQuery,
  useCancelOrderMutation,
} = orderApi;
