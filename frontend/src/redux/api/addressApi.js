import { apiSlice } from './apiSlice';

export const addressApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getAddresses: builder.query({
      query: (params) => {
        if (!params) return '/address';
        const search = new URLSearchParams();
        if (params.email) search.set('email', params.email);
        if (params.phone) search.set('phone', params.phone);
        const qs = search.toString();
        return qs ? `/address?${qs}` : '/address';
      },
      providesTags: ['Address'],
    }),

    addAddress: builder.mutation({
      query: (addressData) => ({
        url: '/address',
        method: 'POST',
        body: addressData,
      }),
      invalidatesTags: ['Address'],
    }),

    updateAddress: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/address/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Address'],
    }),

    deleteAddress: builder.mutation({
      query: (id) => ({
        url: `/address/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Address'],
    }),

    setDefaultAddress: builder.mutation({
      query: (id) => ({
        url: `/address/${id}/default`,
        method: 'PUT',
      }),
      invalidatesTags: ['Address'],
    }),
  }),
});

export const {
  useGetAddressesQuery,
  useAddAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
  useSetDefaultAddressMutation,
} = addressApi;
