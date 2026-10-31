import { apiSlice } from './apiSlice';

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Login
    login: builder.mutation({
      query: (credentials) => ({
        url: '/user/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['User'],
    }),

    // Register
    register: builder.mutation({
      query: (userData) => ({
        url: '/user/register',
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: ['User'],
    }),

    // Verify OTP
    verifyOtp: builder.mutation({
      query: (otpData) => ({
        url: '/user/verify-otp',
        method: 'POST',
        body: otpData,
      }),
      invalidatesTags: ['User'],
    }),

    // Resend OTP
    resendOtp: builder.mutation({
      query: (emailData) => ({
        url: '/user/resend-otp',
        method: 'POST',
        body: emailData,
      }),
    }),

    // Get User Profile
    getProfile: builder.query({
      query: () => '/user/profile',
      providesTags: ['User'],
    }),

    // Update Profile
    updateProfile: builder.mutation({
      query: (profileData) => ({
        url: '/user/profile',
        method: 'PUT',
        body: profileData,
      }),
      invalidatesTags: ['User'],
    }),

    // Change Password
    changePassword: builder.mutation({
      query: (passwords) => ({
        url: '/user/change-password',
        method: 'PUT',
        body: passwords,
      }),
    }),

    // Forgot Password
    forgotPassword: builder.mutation({
      query: (emailData) => ({
        url: '/user/forgot-password',
        method: 'POST',
        body: emailData,
      }),
    }),

    // Google OAuth Login
    googleLogin: builder.mutation({
      query: (googleData) => ({
        url: '/user/google',
        method: 'POST',
        body: googleData,
      }),
      invalidatesTags: ['User'],
    }),

    // Logout
    logoutUser: builder.mutation({
      query: () => ({
        url: '/user/logout',
        method: 'POST',
      }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useVerifyOtpMutation,
  useResendOtpMutation,
  useGoogleLoginMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useForgotPasswordMutation,
  useLogoutUserMutation,
} = authApi;

