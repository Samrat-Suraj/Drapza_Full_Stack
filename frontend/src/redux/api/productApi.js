import { apiSlice } from './apiSlice';

export const productApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getProducts: builder.query({
      query: (params) => ({
        url: '/product',
        params,
      }),
      providesTags: ['Product'],
    }),

    getProductByIdOrSlug: builder.query({
      query: (identifier) => `/product/${identifier}`,
      providesTags: (result, error, identifier) => [{ type: 'Product', id: identifier }],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetProductByIdOrSlugQuery,
} = productApi;
