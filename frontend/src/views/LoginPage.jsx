'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import gsap from 'gsap';
import { useAuth } from '../context/AuthContext';
import { usePageTransition } from '../components/PageTransition';
import {
  loginCredentialsSchema,
  registerCredentialsSchema,
  otpVerificationSchema,
  forgotPasswordSchema,
  resetPasswordCredentialsSchema,
  getZodErrorMessage,
  getZodFieldErrors,
} from '../lib/validation';

const SHOP_CATEGORIES = [
  { name: 'NEW ARRIVALS', path: '/wardrobe' },
  { name: 'SAREE', path: '/wardrobe?category=Saree' },
  { name: 'KURTI', path: '/wardrobe?category=Kurti' },
  { name: 'JEANS', path: '/wardrobe?category=Jeans' },
  { name: 'SHARARA / LEHENGA', path: '/wardrobe?category=Sharara%2FLehenga' },
];

export const LoginPage = ({ initialMode = 'login', navigate: propNavigate }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { navigate: transitionNavigate } = usePageTransition() || {};
  const navigate = propNavigate || transitionNavigate || ((path) => router.push(path));
  const { login, register, verifyOtp, resendOtp, resetPassword, loginWithGoogle, loginWithProvider, isAuthenticated, user, logout } = useAuth();

  const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

  // Mode: 'login' | 'register' | 'otp' | 'forgot' | 'forgot-otp'
  const isJoinRoute = pathname?.includes('join') || pathname?.includes('signup') || initialMode === 'register';
  const isForgotMode = initialMode === 'forgot' || initialMode === 'forgot-otp' || pathname?.includes('forgot-password');
  const [mode, setMode] = useState(
    initialMode === 'forgot-otp'
      ? 'forgot-otp'
      : isForgotMode
      ? 'forgot'
      : isJoinRoute
      ? 'register'
      : 'login'
  );

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Forgot password & reset fields
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showConfirmResetPassword, setShowConfirmResetPassword] = useState(false);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const otpInputRefs = useRef([]);

  const [activeShopCategory, setActiveShopCategory] = useState('NEW ARRIVALS');
  const [hoveredShopCategory, setHoveredShopCategory] = useState(null);

  // Status states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [redirectNotice, setRedirectNotice] = useState('');
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  const getRedirectTarget = (loggedInUser) => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const redirect = urlParams.get('redirect');
      if (redirect && redirect.startsWith('/') && !redirect.startsWith('//')) {
        return redirect;
      }
    }
    if (loggedInUser && loggedInUser.role === 'admin') {
      return '/admin';
    }
    return '/wardrobe';
  };

  // Handle Google OAuth Redirect Callback from URL query params
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const urlParams = new URLSearchParams(window.location.search);
    const authCode = urlParams.get('code');
    const tokenParam = urlParams.get('token');
    const errorParam = urlParams.get('error');
    const googleSuccess = urlParams.get('googleSuccess');
    const redirectParam = urlParams.get('redirect');

    if (redirectParam === '/checkout' || redirectParam?.startsWith('/checkout')) {
      setRedirectNotice('AUTHENTICATION REQUIRED // Please log in or create an account to proceed to checkout. Your cart items are preserved.');
    } else if (redirectParam === '/admin' || redirectParam?.startsWith('/admin')) {
      setRedirectNotice('ADMIN PRIVILEGES REQUIRED // Sign in with your administrator account to access the control terminal.');
    }

    if (errorParam) {
      setErrorMessage(decodeURIComponent(errorParam));
    } else if (googleSuccess && tokenParam) {
      setSuccessMessage('Google authentication verified. Entering atelier...');
      const target = getRedirectTarget();
      setTimeout(() => navigate(target), 600);
    } else if (authCode) {
      setIsLoading(true);
      setSuccessMessage('Verifying credentials with Google Atelier security...');
      loginWithGoogle({ code: authCode, redirectUri: window.location.origin + '/login' })
        .then((res) => {
          setIsLoading(false);
          if (res.success) {
            setSuccessMessage('Welcome! Identity verified with Google.');
            const target = getRedirectTarget(res.user);
            setTimeout(() => navigate(target), 600);
          } else {
            setErrorMessage(res.error || 'Google authentication failed.');
          }
        })
        .catch((err) => {
          setIsLoading(false);
          setErrorMessage(err.message || 'Google authentication failed.');
        });
    }
  }, []);

  // Initialize Google Identity Services Script
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!document.getElementById('google-gsi-client')) {
      const script = document.createElement('script');
      script.id = 'google-gsi-client';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.google?.accounts?.id) {
          try {
            window.google.accounts.id.initialize({
              client_id: GOOGLE_CLIENT_ID,
              callback: async (response) => {
                if (response.credential) {
                  setIsLoading(true);
                  setSuccessMessage('Verifying Google token...');
                  const res = await loginWithGoogle({ credential: response.credential });
                  setIsLoading(false);
                  if (res.success) {
                    setSuccessMessage('Welcome! Identity verified with Google.');
                    setTimeout(() => navigate('/wardrobe'), 600);
                  } else {
                    setErrorMessage(res.error || 'Google token verification failed.');
                  }
                }
              },
            });
          } catch (e) {
            console.warn('GSI init note:', e);
          }
        }
      };
      document.head.appendChild(script);
    }
  }, []);

  // Sync mode with pathname and query parameters
  useEffect(() => {
    if (pathname?.includes('join') || pathname?.includes('signup')) {
      setMode('register');
    } else if (pathname?.includes('forgot-password')) {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('step') === 'otp') {
          setMode('forgot-otp');
        } else {
          setMode('forgot');
        }
        if (urlParams.get('email')) {
          setEmail(urlParams.get('email'));
        }
      } else {
        setMode('forgot');
      }
    } else if (pathname?.includes('login')) {
      setMode('login');
    }
  }, [pathname]);

  // Resend OTP countdown for both signup OTP and forgot-password OTP
  useEffect(() => {
    let interval = null;
    if ((mode === 'otp' || mode === 'forgot-otp') && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [mode, resendTimer]);

  const handleClose = () => {
    if (typeof window !== 'undefined' && window.history.length > 2) {
      router.back();
    } else {
      navigate('/');
    }
  };

  // OTP Digits Handling for Forgot Password
  const handleDigitChange = (index, value) => {
    const cleaned = value.replace(/\D/g, '');
    if (!cleaned) {
      const next = [...otpDigits];
      next[index] = '';
      setOtpDigits(next);
      setOtpCode(next.join(''));
      return;
    }

    if (cleaned.length > 1) {
      const chars = cleaned.slice(0, 6).split('');
      const next = [...otpDigits];
      for (let i = 0; i < 6; i++) {
        next[i] = chars[i] || '';
      }
      setOtpDigits(next);
      setOtpCode(next.join(''));
      const nextFocus = Math.min(chars.length, 5);
      otpInputRefs.current[nextFocus]?.focus();
      return;
    }

    const next = [...otpDigits];
    next[index] = cleaned[0];
    setOtpDigits(next);
    setOtpCode(next.join(''));
    if (fieldErrors.otp) setFieldErrors((prev) => ({ ...prev, otp: '' }));

    if (index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleDigitKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        otpInputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleDigitPaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '');
    if (!pasteData) return;
    const chars = pasteData.slice(0, 6).split('');
    const next = ['', '', '', '', '', ''];
    for (let i = 0; i < 6; i++) {
      next[i] = chars[i] || '';
    }
    setOtpDigits(next);
    setOtpCode(next.join(''));
    if (fieldErrors.otp) setFieldErrors((prev) => ({ ...prev, otp: '' }));
    const targetIndex = Math.min(chars.length, 5);
    otpInputRefs.current[targetIndex]?.focus();
  };

  // Submit Forgot Password Email Request -> moves to 'forgot-otp'
  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    const validation = forgotPasswordSchema.safeParse({ email: email.trim() });
    if (!validation.success) {
      setFieldErrors(getZodFieldErrors(validation.error));
      setErrorMessage(getZodErrorMessage(validation.error));
      return;
    }
    setFieldErrors({});
    setIsLoading(true);
    try {
      const res = await fetch('/api/user/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });
      const d = await res.json().catch(() => ({}));
      setSuccessMessage(d.message || `Reset code dispatched to ${email}`);
    } catch {
      setSuccessMessage(`Reset code dispatched to ${email}`);
    } finally {
      setIsLoading(false);
      setMode('forgot-otp');
      setResendTimer(60);
      setCanResend(false);
      setOtpDigits(['', '', '', '', '', '']);
      setOtpCode('');
      setResetNewPassword('');
      setResetConfirmPassword('');
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    }
  };

  // Submit Reset Password with OTP
  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const fullOtp = otpDigits.join('');
    const validation = resetPasswordCredentialsSchema.safeParse({
      otp: fullOtp,
      password: resetNewPassword,
      confirmPassword: resetConfirmPassword,
    });

    if (!validation.success) {
      setFieldErrors(getZodFieldErrors(validation.error));
      setErrorMessage(getZodErrorMessage(validation.error));
      return;
    }
    setFieldErrors({});

    setIsLoading(true);
    const res = await resetPassword(email.trim(), fullOtp, resetNewPassword);
    setIsLoading(false);

    if (res.success) {
      setSuccessMessage('Password reset successfully! Redirecting to sign in...');
      setTimeout(() => {
        setPassword('');
        setResetNewPassword('');
        setResetConfirmPassword('');
        setOtpDigits(['', '', '', '', '', '']);
        setMode('login');
        setSuccessMessage('Password updated. Please log in with your new password.');
      }, 1200);
    } else {
      setErrorMessage(res.error || 'Failed to reset password. Please check your verification key.');
    }
  };

  // Submit Login with Zod Validation
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const validation = loginCredentialsSchema.safeParse({ email: email.trim(), password });
    if (!validation.success) {
      setFieldErrors(getZodFieldErrors(validation.error));
      setErrorMessage(getZodErrorMessage(validation.error));
      return;
    }
    setFieldErrors({});

    setIsLoading(true);
    const res = await login(email.trim(), password);

    if (res.success) {
      if (res.requireOtp) {
        setIsLoading(false);
        setMode('otp');
        setResendTimer(60);
        setCanResend(false);
        setSuccessMessage(res.message || 'Verification key dispatched to your email.');
      } else {
        const target = getRedirectTarget(res.user);
        if (router?.prefetch) {
          try { router.prefetch(target); } catch (e) { }
        }
        setSuccessMessage('Identity verified. Entering archive...');
        // Let button loading and success status complete on the screen first
        setTimeout(() => {
          navigate(target);
        }, 750);
      }
    } else {
      setIsLoading(false);
      setErrorMessage(res.error || 'Invalid email or password');
    }
  };

  // Submit Register / Join with Zod Validation
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const validation = registerCredentialsSchema.safeParse({
      name: name.trim(),
      email: email.trim(),
      password,
      confirmPassword,
    });
    if (!validation.success) {
      setFieldErrors(getZodFieldErrors(validation.error));
      setErrorMessage(getZodErrorMessage(validation.error));
      return;
    }
    setFieldErrors({});

    setIsLoading(true);
    const res = await register(name.trim(), email.trim(), password);

    if (res.success) {
      if (res.requireOtp) {
        setIsLoading(false);
        setMode('otp');
        setResendTimer(60);
        setCanResend(false);
        setSuccessMessage('Security key dispatched to your email.');
      } else {
        const target = getRedirectTarget(res.user);
        if (router?.prefetch) {
          try { router.prefetch(target); } catch (e) { }
        }
        setSuccessMessage('Welcome to Drapza. Loading archive...');
        // Let button loading and success status complete on screen before transition
        setTimeout(() => {
          navigate(target);
        }, 750);
      }
    } else {
      setIsLoading(false);
      setErrorMessage(res.error || 'Failed to create account.');
    }
  };

  // Submit OTP with Zod Validation
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const validation = otpVerificationSchema.safeParse({ otp: otpCode.trim() });
    if (!validation.success) {
      setFieldErrors(getZodFieldErrors(validation.error));
      setErrorMessage(getZodErrorMessage(validation.error));
      return;
    }
    setFieldErrors({});

    setIsLoading(true);
    const res = await verifyOtp(email, otpCode.trim());

    if (res.success) {
      const target = getRedirectTarget(res.user);
      if (router?.prefetch) {
        try { router.prefetch(target); } catch (e) { }
      }
      setSuccessMessage('Verified. Loading archive...');
      // Let button loading complete on screen before transition
      setTimeout(() => {
        navigate(target);
      }, 750);
    } else {
      setIsLoading(false);
      setErrorMessage(res.error || 'Invalid key.');
    }
  };

  const handleSocialAuth = async (provider) => {
    if (provider.toLowerCase() === 'google') {
      setIsLoading(true);
      setErrorMessage('');
      setSuccessMessage('Initiating Google Authentication...');

      // 1. Try Google Identity Services One Tap / Prompt if script initialized
      if (window.google?.accounts?.id) {
        try {
          window.google.accounts.id.prompt((notification) => {
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
              // Direct OAuth redirect URL
              const redirectUri = window.location.origin + '/login';
              const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(
                redirectUri
              )}&response_type=code&scope=openid%20email%20profile&access_type=offline&prompt=consent`;
              window.location.href = authUrl;
            }
          });
          setIsLoading(false);
          return;
        } catch (e) {
          console.warn('GSI prompt exception, redirecting:', e);
        }
      }

      // 2. Direct OAuth redirect to Google
      const redirectUri = window.location.origin + '/login';
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&response_type=code&scope=openid%20email%20profile&access_type=offline&prompt=consent`;
      window.location.href = authUrl;
      return;
    }

    setIsLoading(true);
    const res = await loginWithProvider(provider);
    setIsLoading(false);
    if (res.success) {
      navigate('/wardrobe');
    }
  };

  return (
    <div className="drapza-screen">
      {/* Editorial Streetwear Background (Monochrome techwear styling) */}
      <div className="drapza-bg-image" />
      <div className="drapza-bg-gradient" />

      {/* LEFT SECTION: Brand & Shop navigation matching the reference image */}
      <div className="drapza-left-section">
        {/* Brand Logo in the style of clubhouse reference */}
        <div className="drapza-brand" onClick={() => navigate('/')}>
          drapza
        </div>

        {/* Collection / Shop Categories matching screenshot */}
        <div className="drapza-shop-block">
          <h2 className="drapza-shop-title">SHOP</h2>
          <ul className="drapza-shop-list">
            {SHOP_CATEGORIES.map((cat) => {
              const isSelected = activeShopCategory === cat.name;
              const isHovered = hoveredShopCategory === cat.name;
              const isActive = hoveredShopCategory ? isHovered : isSelected;

              return (
                <li key={cat.name}>
                  <a
                    href={cat.path}
                    onClick={(e) => {
                      e.preventDefault();
                      setActiveShopCategory(cat.name);
                      navigate(cat.path);
                    }}
                    onMouseEnter={() => setHoveredShopCategory(cat.name)}
                    onMouseLeave={() => setHoveredShopCategory(null)}
                    className={isActive ? 'active-category' : ''}
                  >
                    {isActive && <span className="dash">—</span>}
                    {cat.name}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Empty placeholder to balance flex space */}
        <div />
      </div>

      {/* RIGHT SECTION: The Auth Panel matching reference image */}
      <div className="drapza-right-drawer">
        {/* Top-Right Close Button (X in rounded square from screenshot) */}
        <button
          type="button"
          className="drawer-close-btn"
          onClick={handleClose}
          aria-label="Close"
        >
          <svg
            className="auth-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className="drawer-inner">
          {/* Tag: EXISTING MEMBER or NEW MEMBER */}
          <div className="drawer-tag">
            {mode === 'login' && 'EXISTING MEMBER'}
            {mode === 'register' && 'NEW MEMBER'}
            {mode === 'otp' && 'AUTHENTICATION'}
            {mode === 'forgot' && 'SECURITY RESET'}
            {mode === 'forgot-otp' && 'SECURITY VERIFICATION'}
          </div>

          {/* Heading: Welcome Back! */}
          <h1 className="drawer-title">
            {mode === 'login' && 'Welcome Back!'}
            {mode === 'register' && 'Create Account'}
            {mode === 'otp' && 'Verify Key'}
            {mode === 'forgot' && 'Reset Password'}
            {mode === 'forgot-otp' && 'Enter Reset Key'}
          </h1>

          {/* Error, Notice & Success Messages */}
          {redirectNotice && !errorMessage && !successMessage && (
            <div
              className="alert-box"
              style={{
                backgroundColor: 'rgba(237, 241, 232, 0.08)',
                borderColor: 'rgba(237, 241, 232, 0.25)',
                color: '#edf1e8',
                fontSize: '0.75rem',
                letterSpacing: '0.04em',
                lineHeight: '1.4',
                marginBottom: '1rem',
              }}
            >
              {redirectNotice}
            </div>
          )}
          {errorMessage && <div className="alert-box error">{errorMessage}</div>}
          {successMessage && <div className="alert-box success">{successMessage}</div>}

          {/* 1. LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="auth-form" noValidate>
              {/* Email row with Mail Icon & dashed underline */}
              <div className="auth-input-line" style={fieldErrors.email ? { borderColor: '#ef4444' } : undefined}>
                <svg
                  className="auth-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                </svg>
                <input
                  type="email"
                  className="auth-input"
                  placeholder="Jamesthomas@mail.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }));
                  }}
                  autoComplete="email"
                />
              </div>
              {fieldErrors.email && (
                <span className="field-error-text" style={{
                  color: '#ef4444',
                  fontSize: '0.68rem',
                  fontFamily: 'var(--font-dm-mono), monospace',
                  marginTop: '-8px',
                  marginBottom: '10px',
                  fontWeight: 500,
                  display: 'block'
                }}>
                  {fieldErrors.email}
                </span>
              )}

              {/* Password row with Lock Icon & dashed underline */}
              <div className="auth-input-line" style={fieldErrors.password ? { borderColor: '#ef4444' } : undefined}>
                <svg
                  className="auth-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input"
                  placeholder="Enter Password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: '' }));
                  }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="eye-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password"
                >
                  {showPassword ? (
                    <svg className="auth-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg className="auth-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
              {fieldErrors.password && (
                <span className="field-error-text" style={{
                  color: '#ef4444',
                  fontSize: '0.68rem',
                  fontFamily: 'var(--font-dm-mono), monospace',
                  marginTop: '-8px',
                  marginBottom: '10px',
                  fontWeight: 500,
                  display: 'block'
                }}>
                  {fieldErrors.password}
                </span>
              )}

              {/* Forgot password link */}
              <div style={{ textAlign: 'right', marginTop: '-8px', marginBottom: '8px' }}>
                <button
                  type="button"
                  className="forgot-link"
                  onClick={() => setMode('forgot')}
                >
                  Forgot Password?
                </button>
              </div>

              {/* Pill Continue Button with Arrow */}
              <button type="submit" className="pill-continue-btn" disabled={isLoading}>
                <span>{isLoading ? 'Verifying...' : 'Continue'}</span>
                <svg
                  className="btn-arrow"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
            </form>
          )}

          {/* 2. JOIN / REGISTER FORM */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="auth-form" noValidate>
              {/* Name */}
              <div className="auth-input-line" style={fieldErrors.name ? { borderColor: '#ef4444' } : undefined}>
                <svg
                  className="auth-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <input
                  type="text"
                  className="auth-input"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: '' }));
                  }}
                />
              </div>
              {fieldErrors.name && (
                <span className="field-error-text" style={{
                  color: '#ef4444',
                  fontSize: '0.68rem',
                  fontFamily: 'var(--font-dm-mono), monospace',
                  marginTop: '-8px',
                  marginBottom: '10px',
                  fontWeight: 500,
                  display: 'block'
                }}>
                  {fieldErrors.name}
                </span>
              )}

              {/* Email */}
              <div className="auth-input-line" style={fieldErrors.email ? { borderColor: '#ef4444' } : undefined}>
                <svg
                  className="auth-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                >
                  <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                </svg>
                <input
                  type="email"
                  className="auth-input"
                  placeholder="Jamesthomas@mail.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }));
                  }}
                />
              </div>
              {fieldErrors.email && (
                <span className="field-error-text" style={{
                  color: '#ef4444',
                  fontSize: '0.68rem',
                  fontFamily: 'var(--font-dm-mono), monospace',
                  marginTop: '-8px',
                  marginBottom: '10px',
                  fontWeight: 500,
                  display: 'block'
                }}>
                  {fieldErrors.email}
                </span>
              )}

              {/* Password */}
              <div className="auth-input-line" style={fieldErrors.password ? { borderColor: '#ef4444' } : undefined}>
                <svg
                  className="auth-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input"
                  placeholder="Create Password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: '' }));
                  }}
                />
              </div>
              {fieldErrors.password && (
                <span className="field-error-text" style={{
                  color: '#ef4444',
                  fontSize: '0.68rem',
                  fontFamily: 'var(--font-dm-mono), monospace',
                  marginTop: '-8px',
                  marginBottom: '10px',
                  fontWeight: 500,
                  display: 'block'
                }}>
                  {fieldErrors.password}
                </span>
              )}

              {/* Confirm Password */}
              <div className="auth-input-line" style={fieldErrors.confirmPassword ? { borderColor: '#ef4444' } : undefined}>
                <svg
                  className="auth-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                >
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (fieldErrors.confirmPassword) setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
                  }}
                />
              </div>
              {fieldErrors.confirmPassword && (
                <span className="field-error-text" style={{
                  color: '#ef4444',
                  fontSize: '0.68rem',
                  fontFamily: 'var(--font-dm-mono), monospace',
                  marginTop: '-8px',
                  marginBottom: '10px',
                  fontWeight: 500,
                  display: 'block'
                }}>
                  {fieldErrors.confirmPassword}
                </span>
              )}

              {/* Pill Continue Button */}
              <button type="submit" className="pill-continue-btn" disabled={isLoading}>
                <span>{isLoading ? 'Creating...' : 'Continue'}</span>
                <svg
                  className="btn-arrow"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
            </form>
          )}

          {/* 3. OTP VERIFICATION FORM */}
          {mode === 'otp' && (
            <form onSubmit={handleOtpSubmit} className="auth-form" noValidate>
              <p className="otp-subtitle">
                Enter the 6-digit key sent to <strong>{email}</strong>
              </p>

              <div className="auth-input-line" style={fieldErrors.otp ? { borderColor: '#ef4444' } : undefined}>
                <svg className="auth-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <input
                  type="text"
                  maxLength={6}
                  className="auth-input otp-input"
                  placeholder="••••••"
                  value={otpCode}
                  onChange={(e) => {
                    setOtpCode(e.target.value.replace(/\D/g, ''));
                    if (fieldErrors.otp) setFieldErrors((prev) => ({ ...prev, otp: '' }));
                  }}
                  autoFocus
                />
              </div>
              {fieldErrors.otp && (
                <span className="field-error-text" style={{
                  color: '#ef4444',
                  fontSize: '0.68rem',
                  fontFamily: 'var(--font-dm-mono), monospace',
                  marginTop: '-8px',
                  marginBottom: '10px',
                  fontWeight: 500,
                  display: 'block'
                }}>
                  {fieldErrors.otp}
                </span>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <button
                  type="button"
                  className="forgot-link"
                  disabled={!canResend || isLoading}
                  onClick={async () => {
                    if (!canResend) return;
                    setIsLoading(true);
                    await resendOtp(email);
                    setIsLoading(false);
                    setResendTimer(60);
                    setCanResend(false);
                    setSuccessMessage('New key sent.');
                  }}
                >
                  {canResend ? 'Resend Key' : `Resend in ${resendTimer}s`}
                </button>
                <button
                  type="button"
                  className="forgot-link"
                  onClick={() => setMode('login')}
                >
                  Change Email
                </button>
              </div>

              <button type="submit" className="pill-continue-btn" disabled={isLoading}>
                <span>{isLoading ? 'Verifying...' : 'Verify & Continue'}</span>
                <svg
                  className="btn-arrow"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                >
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
            </form>
          )}

          {/* 4. FORGOT PASSWORD */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotPasswordSubmit} className="auth-form" noValidate>
              <p className="otp-subtitle">
                Enter your registered email address to receive your 6-digit password recovery pass key.
              </p>

              <div className="auth-input-line" style={fieldErrors.email ? { borderColor: '#ef4444' } : undefined}>
                <svg className="auth-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
                </svg>
                <input
                  type="email"
                  className="auth-input"
                  placeholder="Jamesthomas@mail.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }));
                  }}
                  autoFocus
                />
              </div>
              {fieldErrors.email && (
                <span className="field-error-text" style={{
                  color: '#ef4444',
                  fontSize: '0.68rem',
                  fontFamily: 'var(--font-dm-mono), monospace',
                  marginTop: '-8px',
                  marginBottom: '10px',
                  fontWeight: 500,
                  display: 'block'
                }}>
                  {fieldErrors.email}
                </span>
              )}

              <button type="submit" className="pill-continue-btn" disabled={isLoading}>
                <span>{isLoading ? 'Dispatching...' : 'Send Recovery Key'}</span>
                <svg className="btn-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>

              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <button
                  type="button"
                  className="forgot-link"
                  onClick={() => {
                    setErrorMessage('');
                    setSuccessMessage('');
                    setMode('login');
                  }}
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          )}

          {/* 5. FORGOT PASSWORD OTP VERIFICATION & NEW PASSWORD PAGE */}
          {mode === 'forgot-otp' && (
            <form onSubmit={handleResetPasswordSubmit} className="auth-form" noValidate>
              <div className="otp-info-header">
                <p className="otp-subtitle" style={{ margin: 0 }}>
                  Enter the 6-digit key sent to <strong>{email || 'your email'}</strong>
                </p>
                <button
                  type="button"
                  className="change-email-inline-btn"
                  onClick={() => {
                    setErrorMessage('');
                    setSuccessMessage('');
                    setMode('forgot');
                  }}
                >
                  Change Email
                </button>
              </div>

              {/* 6-Cell Interactive OTP Input Boxes with Auto-Jump & Paste */}
              <div className="otp-digit-grid" onPaste={handleDigitPaste}>
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpInputRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={1}
                    className={`otp-digit-box ${digit ? 'filled' : ''} ${fieldErrors.otp ? 'error' : ''}`}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                    aria-label={`Digit ${idx + 1}`}
                  />
                ))}
              </div>
              {fieldErrors.otp && (
                <span className="field-error-text" style={{
                  color: '#ef4444',
                  fontSize: '0.68rem',
                  fontFamily: 'var(--font-dm-mono), monospace',
                  marginTop: '-8px',
                  marginBottom: '12px',
                  fontWeight: 500,
                  display: 'block'
                }}>
                  {fieldErrors.otp}
                </span>
              )}

              {/* New Password Input */}
              <div className="auth-input-line" style={fieldErrors.password ? { borderColor: '#ef4444' } : undefined}>
                <svg className="auth-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                <input
                  type={showResetPassword ? 'text' : 'password'}
                  className="auth-input"
                  placeholder="New Password (min 6 characters)"
                  value={resetNewPassword}
                  onChange={(e) => {
                    setResetNewPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: '' }));
                  }}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="eye-toggle"
                  onClick={() => setShowResetPassword(!showResetPassword)}
                  aria-label="Toggle new password"
                >
                  {showResetPassword ? (
                    <svg className="auth-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg className="auth-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
              {fieldErrors.password && (
                <span className="field-error-text" style={{
                  color: '#ef4444',
                  fontSize: '0.68rem',
                  fontFamily: 'var(--font-dm-mono), monospace',
                  marginTop: '-8px',
                  marginBottom: '10px',
                  fontWeight: 500,
                  display: 'block'
                }}>
                  {fieldErrors.password}
                </span>
              )}

              {/* Confirm New Password Input */}
              <div className="auth-input-line" style={fieldErrors.confirmPassword ? { borderColor: '#ef4444' } : undefined}>
                <svg className="auth-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <input
                  type={showConfirmResetPassword ? 'text' : 'password'}
                  className="auth-input"
                  placeholder="Confirm New Password"
                  value={resetConfirmPassword}
                  onChange={(e) => {
                    setResetConfirmPassword(e.target.value);
                    if (fieldErrors.confirmPassword) setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
                  }}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="eye-toggle"
                  onClick={() => setShowConfirmResetPassword(!showConfirmResetPassword)}
                  aria-label="Toggle confirm password"
                >
                  {showConfirmResetPassword ? (
                    <svg className="auth-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg className="auth-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
              {fieldErrors.confirmPassword && (
                <span className="field-error-text" style={{
                  color: '#ef4444',
                  fontSize: '0.68rem',
                  fontFamily: 'var(--font-dm-mono), monospace',
                  marginTop: '-8px',
                  marginBottom: '10px',
                  fontWeight: 500,
                  display: 'block'
                }}>
                  {fieldErrors.confirmPassword}
                </span>
              )}

              {/* Resend Code row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', marginTop: '-4px' }}>
                <button
                  type="button"
                  className="forgot-link"
                  disabled={!canResend || isLoading}
                  onClick={async () => {
                    if (!canResend) return;
                    setIsLoading(true);
                    await resendOtp(email);
                    setIsLoading(false);
                    setResendTimer(60);
                    setCanResend(false);
                    setSuccessMessage('A fresh verification key was sent to your email.');
                  }}
                  style={{ opacity: canResend ? 1 : 0.6, cursor: canResend ? 'pointer' : 'not-allowed' }}
                >
                  {canResend ? 'Resend Key' : `Resend in ${resendTimer}s`}
                </button>
                <button
                  type="button"
                  className="forgot-link"
                  onClick={() => {
                    setErrorMessage('');
                    setSuccessMessage('');
                    setMode('login');
                  }}
                >
                  Cancel
                </button>
              </div>

              {/* Action Button */}
              <button type="submit" className="pill-continue-btn" disabled={isLoading}>
                <span>{isLoading ? 'Updating Password...' : 'Reset Password'}</span>
                <svg className="btn-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>

              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <button
                  type="button"
                  className="forgot-link"
                  onClick={() => {
                    setErrorMessage('');
                    setSuccessMessage('');
                    setMode('login');
                  }}
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          )}

          {/* Divider: OR (Exact match to screenshot) */}
          {mode !== 'otp' && mode !== 'forgot-otp' && (
            <>
              <div className="auth-or-divider">
                <div className="or-line" />
                <span className="or-text">OR</span>
                <div className="or-line" />
              </div>

              {/* Prominent Google Sign-In Button */}
              <button
                type="button"
                onClick={() => handleSocialAuth('Google')}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  backgroundColor: '#ffffff',
                  color: '#09090b',
                  border: 'none',
                  borderRadius: '999px',
                  padding: '0.85rem 1.4rem',
                  fontFamily: 'var(--font-dm-mono), monospace',
                  fontSize: '0.85rem',
                  fontWeight: '700',
                  letterSpacing: '0.04em',
                  cursor: 'pointer',
                  marginBottom: '1.25rem',
                  boxShadow: '0 4px 14px rgba(255, 255, 255, 0.15)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#f4f4f5';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#ffffff';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" style={{ width: '18px', height: '18px', flexShrink: 0, display: 'block' }}>
                  <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z" />
                  <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z" />
                  <path fill="#FBBC05" d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15.1c0 2.8.7 5.4 1.9 7.8l3.7-2.9z" />
                  <path fill="#34A853" d="M12 23.5c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 16.9C3.7 20.6 7.5 23.5 12 23.5z" />
                </svg>
                <span>Continue with Google</span>
              </button>

              {/* Bottom Switch Link */}
              <div className="bottom-switch-block">
                {mode === 'login' ? (
                  <span>
                    Don't have an account?{' '}
                    <button
                      type="button"
                      className="switch-btn"
                      onClick={() => {
                        setMode('register');
                        setErrorMessage('');
                        setSuccessMessage('');
                      }}
                    >
                      Sign Up
                    </button>
                  </span>
                ) : (
                  <span>
                    Already have an account?{' '}
                    <button
                      type="button"
                      className="switch-btn"
                      onClick={() => {
                        setMode('login');
                        setErrorMessage('');
                        setSuccessMessage('');
                      }}
                    >
                      Sign In
                    </button>
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Scoped CSS — Guarantees exact rendering & prevents SVG size blowups */}
      <style jsx>{`
        .drapza-screen {
          position: fixed;
          inset: 0;
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          background-color: #0b0b0d;
          color: #ffffff;
          display: flex;
          font-family: var(--font-host-grotesk), sans-serif;
          z-index: 9999;
        }

        .drapza-bg-image {
          position: absolute;
          inset: 0;
          background-image: url('/login/login-hero.jpg');
          background-size: cover;
          background-position: center 20%;
          filter: grayscale(100%) contrast(1.15) brightness(0.9);
          z-index: 1;
        }

        .drapza-bg-gradient {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to right,
            rgba(0, 0, 0, 0.4) 0%,
            rgba(0, 0, 0, 0.2) 50%,
            rgba(10, 10, 12, 0.85) 75%,
            rgba(5, 5, 6, 0.96) 100%
          );
          z-index: 2;
          pointer-events: none;
        }

        .drapza-left-section {
          position: relative;
          z-index: 10;
          flex: 1 1 auto;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 3rem 4rem;
          box-sizing: border-box;
        }

        .drapza-brand {
          font-family: var(--font-host-grotesk), sans-serif;
          font-size: 2.2rem;
          font-weight: 300;
          letter-spacing: -0.03em;
          color: #ffffff;
          cursor: pointer;
          user-select: none;
          text-transform: lowercase;
        }

        .drapza-shop-block {
          max-width: 300px;
        }

        .drapza-shop-title {
          font-family: var(--font-host-grotesk), sans-serif;
          font-size: 2.2rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          margin: 0 0 1.35rem 0;
          color: #ffffff;
          text-transform: uppercase;
        }

        .drapza-shop-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.95rem;
        }

        .drapza-shop-list a {
          color: #a1a1aa;
          text-decoration: none;
          font-size: 0.95rem;
          font-weight: 500;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          display: inline-flex;
          align-items: center;
          cursor: pointer;
        }

        .drapza-shop-list a:hover {
          color: #ffffff;
          transform: translateX(4px);
        }

        .drapza-shop-list .active-category {
          color: #ffffff;
          font-weight: 600;
        }

        .drapza-shop-list .dash {
          color: #ffffff;
          margin-right: 0.5rem;
          font-weight: 700;
        }

        /* Right Drawer / Card */
        .drapza-right-drawer {
          position: relative;
          z-index: 20;
          flex: 0 0 420px;
          width: 420px;
          max-width: 100vw;
          height: 100vh;
          background: rgba(18, 18, 20, 0.88);
          backdrop-filter: blur(28px);
          -webkit-backdrop-filter: blur(28px);
          border-left: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 3rem 2.75rem;
          box-sizing: border-box;
          box-shadow: -15px 0 50px rgba(0, 0, 0, 0.6);
        }

        .drawer-close-btn {
          position: absolute;
          top: 2rem;
          right: 2rem;
          width: 38px;
          height: 38px;
          border-radius: 10px;
          border: 1px solid rgba(255, 255, 255, 0.22);
          background: rgba(255, 255, 255, 0.03);
          color: #d4d4d8;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .drawer-close-btn:hover {
          border-color: #ffffff;
          background: rgba(255, 255, 255, 0.12);
          color: #ffffff;
          transform: scale(1.05);
        }

        .drawer-inner {
          width: 100%;
        }

        .drawer-tag {
          font-family: var(--font-dm-mono), monospace;
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.2em;
          color: #d4d4d8;
          text-transform: uppercase;
          margin-bottom: 0.5rem;
        }

        .drawer-title {
          font-family: var(--font-host-grotesk), sans-serif;
          font-size: 1.85rem;
          font-weight: 500;
          letter-spacing: -0.02em;
          color: #ffffff;
          margin: 0 0 2rem 0;
        }

        /* Dashed input row matching screenshot */
        .auth-input-line {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding-bottom: 0.65rem;
          margin-bottom: 1.5rem;
          border-bottom: 1px dashed rgba(255, 255, 255, 0.35);
          transition: border-color 0.25s;
        }

        .auth-input-line:focus-within {
          border-bottom: 1px solid #ffffff;
        }

        .auth-icon {
          width: 18px !important;
          height: 18px !important;
          min-width: 18px !important;
          max-width: 18px !important;
          flex-shrink: 0 !important;
          display: block !important;
          color: #a1a1aa;
        }

        .auth-input {
          width: 100%;
          background: transparent !important;
          border: none !important;
          outline: none !important;
          color: #ffffff !important;
          font-size: 0.95rem;
          font-family: var(--font-host-grotesk), sans-serif;
          letter-spacing: 0.01em;
          padding: 0;
        }

        .auth-input::placeholder {
          color: #71717a;
        }

        .eye-toggle {
          background: transparent;
          border: none;
          color: #71717a;
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
        }

        .eye-toggle:hover {
          color: #ffffff;
        }

        .forgot-link {
          background: transparent;
          border: none;
          color: #a1a1aa;
          cursor: pointer;
          font-size: 0.8rem;
          text-decoration: underline;
          text-underline-offset: 3px;
          padding: 0;
        }

        .forgot-link:hover {
          color: #ffffff;
        }

        /* Pill Continue Button matching screenshot */
        .pill-continue-btn {
          width: 100%;
          background-color: #ffffff;
          color: #0a0a0c;
          border: none;
          border-radius: 999px;
          padding: 0.9rem 1.6rem;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 1.25rem;
          transition: all 0.2s ease;
          box-shadow: 0 4px 18px rgba(255, 255, 255, 0.12);
        }

        .pill-continue-btn:hover {
          background-color: #f4f4f5;
          transform: translateY(-1px);
          box-shadow: 0 6px 22px rgba(255, 255, 255, 0.2);
        }

        .btn-arrow {
          width: 18px !important;
          height: 18px !important;
          min-width: 18px !important;
          max-width: 18px !important;
          color: #0a0a0c;
        }

        /* OR Divider */
        .auth-or-divider {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin: 1.75rem 0 1.25rem 0;
        }

        .or-line {
          flex: 1;
          height: 1px;
          background-color: rgba(255, 255, 255, 0.15);
        }

        .or-text {
          font-family: var(--font-dm-mono), monospace;
          font-size: 0.75rem;
          letter-spacing: 0.18em;
          color: #71717a;
        }

        /* 3 Circular Social Buttons */
        .social-buttons-row {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1.25rem;
        }

        .social-circle-btn {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.25);
          background: rgba(255, 255, 255, 0.04);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          padding: 0;
        }

        .social-circle-btn:hover {
          background: #ffffff;
          color: #0a0a0c;
          border-color: #ffffff;
          transform: translateY(-2px) scale(1.05);
        }

        .social-g-text {
          font-weight: 700;
          font-size: 1.15rem;
          line-height: 1;
        }

        .social-icon {
          width: 18px !important;
          height: 18px !important;
          min-width: 18px !important;
          max-width: 18px !important;
        }

        .bottom-switch-block {
          margin-top: 1.75rem;
          text-align: center;
          font-size: 0.85rem;
          color: #71717a;
        }

        .switch-btn {
          background: transparent;
          border: none;
          color: #ffffff;
          font-weight: 600;
          cursor: pointer;
          text-decoration: underline;
          text-underline-offset: 3px;
          padding: 0;
        }

        .alert-box {
          padding: 0.7rem 0.9rem;
          border-radius: 8px;
          font-size: 0.85rem;
          margin-bottom: 1.25rem;
        }

        .alert-box.error {
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.35);
          color: #fca5a5;
        }

        .alert-box.success {
          background: rgba(34, 197, 94, 0.12);
          border: 1px solid rgba(34, 197, 94, 0.35);
          color: #86efac;
        }

        .otp-subtitle {
          color: #a1a1aa;
          font-size: 0.88rem;
          margin: 0 0 1rem 0;
          line-height: 1.4;
        }

        .otp-info-header {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 1.1rem;
        }

        .change-email-inline-btn {
          background: transparent;
          border: none;
          color: #a1a1aa;
          cursor: pointer;
          font-family: var(--font-dm-mono), monospace;
          font-size: 0.75rem;
          text-decoration: underline;
          text-underline-offset: 3px;
          padding: 0;
          transition: color 0.2s ease;
        }

        .change-email-inline-btn:hover {
          color: #ffffff;
        }

        .otp-digit-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 0.45rem;
          margin-bottom: 1.35rem;
        }

        .otp-digit-box {
          width: 100%;
          height: 48px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.22);
          background: rgba(255, 255, 255, 0.04);
          color: #ffffff;
          font-family: var(--font-dm-mono), monospace;
          font-size: 1.35rem;
          font-weight: 700;
          text-align: center;
          outline: none;
          transition: all 0.2s ease;
          box-sizing: border-box;
          padding: 0;
        }

        .otp-digit-box:focus {
          border-color: #ffffff;
          background: rgba(255, 255, 255, 0.12);
          box-shadow: 0 0 14px rgba(255, 255, 255, 0.25);
          transform: translateY(-2px);
        }

        .otp-digit-box.filled {
          border-color: rgba(255, 255, 255, 0.55);
          background: rgba(255, 255, 255, 0.08);
        }

        .otp-digit-box.error {
          border-color: #ef4444;
          background: rgba(239, 68, 68, 0.08);
        }

        .otp-input {
          font-family: var(--font-dm-mono), monospace !important;
          font-size: 1.25rem !important;
          letter-spacing: 0.3em !important;
        }

        @media (max-width: 860px) {
          .drapza-left-section {
            display: none;
          }
          .drapza-right-drawer {
            flex: 1 1 100%;
            width: 100vw;
            min-height: 100vh;
            min-height: 100dvh;
            height: 100%;
            padding: 3rem 1.75rem 2.5rem;
            border-left: none;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            overflow-y: auto;
            -webkit-overflow-scrolling: touch;
          }
          .drawer-inner {
            width: 100%;
            max-width: 390px;
            margin: auto 0;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }
          .drawer-close-btn {
            top: 1.25rem;
            right: 1.25rem;
          }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
