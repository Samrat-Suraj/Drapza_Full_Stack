import { apiSlice } from './apiSlice';

export const contentApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getTestimonials: builder.query({
      query: () => '/testimonials-config',
      providesTags: ['Testimonial'],
    }),

    getTerms: builder.query({
      query: () => '/terms-config',
      providesTags: ['Terms'],
    }),

    getHeroConfig: builder.query({
      query: () => '/hero-config',
    }),

    getLookbookConfig: builder.query({
      query: () => '/lookbook-config',
    }),
  }),
});

export const {
  useGetTestimonialsQuery,
  useGetTermsQuery,
  useGetHeroConfigQuery,
  useGetLookbookConfigQuery,
} = contentApi;
