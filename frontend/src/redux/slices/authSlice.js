import { createSlice } from '@reduxjs/toolkit';

const getInitialAuth = () => {
  if (typeof window === 'undefined') {
    return { token: null, user: null, isAuthenticated: false };
  }
  try {
    const token = localStorage.getItem('drapza_token');
    const userStr = localStorage.getItem('drapza_user');
    const user = userStr ? JSON.parse(userStr) : null;
    return {
      token: token || null,
      user: user || null,
      isAuthenticated: !!token && !!user,
    };
  } catch {
    return { token: null, user: null, isAuthenticated: false };
  }
};

const initialState = {
  ...getInitialAuth(),
  isLoading: false,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      const { user, token } = action.payload;
      state.user = user;
      state.token = token;
      state.isAuthenticated = true;

      if (typeof window !== 'undefined') {
        try {
          if (token) localStorage.setItem('drapza_token', token);
          if (user) localStorage.setItem('drapza_user', JSON.stringify(user));
        } catch {}
      }
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('drapza_user', JSON.stringify(state.user));
        } catch {}
      }
    },
    logOut: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;

      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('drapza_token');
          localStorage.removeItem('drapza_user');
        } catch {}
      }
    },
  },
});

export const { setCredentials, updateUser, logOut } = authSlice.actions;
export default authSlice.reducer;
