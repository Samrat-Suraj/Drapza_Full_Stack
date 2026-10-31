'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import {
  useGetProfileQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
} from '../redux/api/authApi';
import { useGetMyOrdersQuery } from '../redux/api/orderApi';
import {
  useGetAddressesQuery,
  useAddAddressMutation,
  useDeleteAddressMutation,
  useSetDefaultAddressMutation,
} from '../redux/api/addressApi';
import { ContactForm } from '../components/ContactForm';
import { Footer } from '../components/Footer';
import {
  RotateCcw,
  Ban,
  Clock,
  CheckCircle2,
  Calendar,
  Check,
  Copy,
  Truck,
  Headphones,
  Tag,
  Gift,
  Star
} from 'lucide-react';
import { CustomerReturnModal } from '../components/drapza/CustomerReturnModal';
import { CancelOrderModal } from '../components/drapza/CancelOrderModal';
import { OrderCardsSkeleton, AddressesSkeleton, ProfileSkeleton } from '../components/drapza/skeletons';
import { ProductCard } from '../components/drapza/ProductCard';
import {
  updateProfileSchema,
  changePasswordSchema,
  checkoutShippingDetailsSchema,
  getZodErrorMessage,
  getZodFieldErrors,
} from '../lib/validation';

export const ProfilePage = () => {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const { cartItems, totalCount, subtotal, removeFromCart, updateQuantity, addToCart } = useCart();

  // Search Params Support
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get('tab');

  // Handle direct tab deep-linking
  useEffect(() => {
    if (tabParam && ['personal', 'orders', 'addresses', 'wishlist', 'cart', 'preferences'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  // Return & Exchange Modal
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [returnOrder, setReturnOrder] = useState(null);

  // Cancel Order Modal
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelTargetOrder, setCancelTargetOrder] = useState(null);

  // Active Menu Tab
  const [activeTab, setActiveTab] = useState('personal');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Wishlist State (stored in localStorage)
  const [wishlistItems, setWishlistItems] = useState([]);

  useEffect(() => {
    const loadWishlist = () => {
      try {
        const saved = localStorage.getItem('drapza_wishlist');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setWishlistItems(parsed);
            return;
          }
        }
        const initialWishlist = [
          {
            name: 'Unit 01',
            price: '1620',
            color: 'Black',
            tag: 'Deform',
            sizes: ['S', 'M', 'L', 'XL'],
            image_url: '/products/product_1.png',
            slug: 'unit-01',
          },
          {
            name: 'Phase Field',
            price: '1440',
            color: 'Stone',
            tag: 'Sheerform',
            sizes: ['M', 'L', 'XL'],
            image_url: '/products/product_2.png',
            slug: 'phase-field',
          },
        ];
        setWishlistItems(initialWishlist);
        localStorage.setItem('drapza_wishlist', JSON.stringify(initialWishlist));
      } catch { }
    };

    loadWishlist();
    window.addEventListener('storage', loadWishlist);
    window.addEventListener('drapza:wishlist_updated', loadWishlist);
    return () => {
      window.removeEventListener('storage', loadWishlist);
      window.removeEventListener('drapza:wishlist_updated', loadWishlist);
    };
  }, []);

  const removeFromWishlist = (name) => {
    const updated = wishlistItems.filter((item) => item.name !== name && item.slug !== name && item.id !== name && item._id !== name);
    setWishlistItems(updated);
    try {
      localStorage.setItem('drapza_wishlist', JSON.stringify(updated));
      const storedAtelier = localStorage.getItem('drapza_atelier_wishlist_v1');
      if (storedAtelier) {
        const parsed = JSON.parse(storedAtelier);
        if (Array.isArray(parsed)) {
          const updatedAtelier = parsed.filter((it) => it.name !== name && it.slug !== name && it.id !== name);
          localStorage.setItem('drapza_atelier_wishlist_v1', JSON.stringify(updatedAtelier));
        }
      }
      window.dispatchEvent(new CustomEvent('drapza:wishlist_updated', { detail: { action: 'removed', name } }));
    } catch { }
  };

  const handleMoveWishlistToCart = (prod) => {
    const slug =
      prod.slug ||
      prod.name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
    const imgUrl =
      (prod.images && prod.images[0]) ||
      prod.image_url ||
      prod.image ||
      '/products/product_1.png';
    const price = prod.price || 1200;

    addToCart(
      {
        ...prod,
        price,
        image_url: imgUrl,
        slug,
      },
      prod.sizes?.[0] || 'M'
    );
    removeFromWishlist(prod.name);
  };

  const tabLabels = {
    orders: 'My orders',
    wishlist: 'My Wishlist',
    cart: 'My Cart',
    personal: 'Personal Information',
    addresses: 'Addresses',
    preferences: 'Contact Preferences',
  };

  const navItems = [
    {
      id: 'orders',
      label: 'My orders',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '15px', height: '15px', flexShrink: 0 }}>
          <polyline points="20 12 20 22 4 22 4 12"></polyline>
          <rect x="2" y="7" width="20" height="5"></rect>
          <line x1="12" y1="22" x2="12" y2="7"></line>
        </svg>
      ),
    },
    {
      id: 'wishlist',
      label: 'My Wishlist',
      badge: wishlistItems.length > 0 ? wishlistItems.length : null,
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '15px', height: '15px', flexShrink: 0 }}>
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
      ),
    },
    {
      id: 'cart',
      label: 'My Cart',
      badge: totalCount > 0 ? totalCount : null,
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '15px', height: '15px', flexShrink: 0 }}>
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <path d="M16 10a4 4 0 0 1-8 0"></path>
        </svg>
      ),
    },
    {
      id: 'personal',
      label: 'Personal Information',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '15px', height: '15px', flexShrink: 0 }}>
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
      ),
    },
    {
      id: 'addresses',
      label: 'Addresses',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '15px', height: '15px', flexShrink: 0 }}>
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
      ),
    },
    {
      id: 'preferences',
      label: 'Contact Preferences',
      icon: (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '15px', height: '15px', flexShrink: 0 }}>
          <circle cx="12" cy="12" r="3"></circle>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
        </svg>
      ),
    },
  ];

  // RTK Queries
  const { data: profileData, isLoading: isProfileLoading } = useGetProfileQuery(
    undefined,
    { skip: !isAuthenticated }
  );
  const { data: ordersData, isLoading: isOrdersLoading, refetch: refetchOrders } = useGetMyOrdersQuery(
    undefined,
    { skip: !isAuthenticated }
  );
  const { data: addressesData, isLoading: isAddressesLoading } = useGetAddressesQuery(
    undefined,
    { skip: !isAuthenticated }
  );

  // RTK Mutations
  const [updateProfile, { isLoading: isUpdatingProfile }] = useUpdateProfileMutation();
  const [changePassword, { isLoading: isChangingPassword }] = useChangePasswordMutation();
  const [addAddress, { isLoading: isAddingAddress }] = useAddAddressMutation();
  const [deleteAddress] = useDeleteAddressMutation();
  const [setDefaultAddress] = useSetDefaultAddressMutation();

  // Resolved user
  const currentUser = profileData?.user || user || {
    name: 'Denis Holland',
    email: 'denis.holland@company.com',
    phone: '9794603102',
    role: 'admin',
    memberSince: 2026,
  };

  // Form states matching screenshot
  const nameParts = (currentUser.name || 'Denis Holland').trim().split(' ');
  const [firstName, setFirstName] = useState(nameParts[0] || 'Denis');
  const [lastName, setLastName] = useState(nameParts.slice(1).join(' ') || 'Holland');
  const [email, setEmail] = useState(currentUser.email || 'denis.holland@company.com');
  const [phone, setPhone] = useState(currentUser.phone || '9794603102');
  const [countryCode, setCountryCode] = useState('+91');
  const [dob, setDob] = useState('14 / 08 / 1998');
  const [gender, setGender] = useState('male'); // 'male' | 'female'
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Address Modal State
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addrError, setAddrError] = useState('');
  const [addrForm, setAddrForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    city: '',
    state: 'Maharashtra',
    pincode: '',
    isDefault: false,
  });

  // Password rotation state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [pwdMsg, setPwdMsg] = useState({ type: '', text: '' });
  const [personalFieldErrors, setPersonalFieldErrors] = useState({});
  const [passwordFieldErrors, setPasswordFieldErrors] = useState({});
  const [addrFieldErrors, setAddrFieldErrors] = useState({});

  const dateInputRef = useRef(null);

  const getIsoDate = (val) => {
    if (!val) return '';
    const clean = String(val).replace(/\s+/g, '');
    const dmy = clean.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmy) {
      const d = dmy[1].padStart(2, '0');
      const m = dmy[2].padStart(2, '0');
      const y = dmy[3];
      return `${y}-${m}-${d}`;
    }
    const ymd = clean.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
    if (ymd) {
      return `${ymd[1]}-${ymd[2].padStart(2, '0')}-${ymd[3].padStart(2, '0')}`;
    }
    return '';
  };

  const handleOpenDatePicker = () => {
    try {
      if (dateInputRef.current) {
        if (typeof dateInputRef.current.showPicker === 'function') {
          dateInputRef.current.showPicker();
        } else {
          dateInputRef.current.focus();
        }
      }
    } catch {
      dateInputRef.current?.focus();
    }
  };

  // Orders interactive state
  const [orderFilter, setOrderFilter] = useState('ALL');
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [copiedOrderId, setCopiedOrderId] = useState(null);

  const handleCopyOrderRef = (ref) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(ref);
      setCopiedOrderId(ref);
      setTimeout(() => setCopiedOrderId(null), 2000);
    }
  };

  const getOrderTotal = (order) => {
    if (order?.total != null && !isNaN(Number(order.total)) && Number(order.total) > 0) {
      return Number(order.total).toLocaleString('en-IN');
    }
    if (order?.items && order.items.length > 0) {
      const calc = order.items.reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.quantity) || 1)), 0);
      if (calc > 0) return calc.toLocaleString('en-IN');
    }
    return '2,490';
  };

  const formatOrderDate = (dateString) => {
    if (!dateString) return '09 Oct 2026';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return '09 Oct 2026';
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) {
      return '09 Oct 2026';
    }
  };

  useEffect(() => {
    if (currentUser) {
      const parts = (currentUser.name || 'Denis Holland').trim().split(' ');
      setFirstName(parts[0] || 'Denis');
      setLastName(parts.slice(1).join(' ') || 'Holland');
      setEmail(currentUser.email || 'denis.holland@company.com');
      setPhone(currentUser.phone || '9794603102');
      if (currentUser.gender) setGender(currentUser.gender);
      if (currentUser.dob) setDob(currentUser.dob);
    }
  }, [currentUser?.name, currentUser?.email, currentUser?.phone, currentUser?.gender, currentUser?.dob]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaveError('');
    setSaveSuccess(false);

    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    const validation = updateProfileSchema.safeParse({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      name: fullName,
      phone: phone.trim(),
      gender,
      dob,
    });

    if (!validation.success) {
      const errors = getZodFieldErrors(validation.error);
      setPersonalFieldErrors(errors);
      setSaveError(getZodErrorMessage(validation.error));
      return;
    }
    setPersonalFieldErrors({});

    try {
      await updateProfile({
        name: fullName,
        phone: phone.trim(),
        gender,
        dob,
      }).unwrap();
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err) {
      setSaveError(err?.data?.message || 'Failed to update personal information');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwdMsg({ type: '', text: '' });

    const validation = changePasswordSchema.safeParse({
      currentPassword,
      newPassword,
      confirmNewPassword: confirmPassword,
    });

    if (!validation.success) {
      const errors = getZodFieldErrors(validation.error);
      setPasswordFieldErrors(errors);
      setPwdMsg({ type: 'error', text: getZodErrorMessage(validation.error) });
      return;
    }
    setPasswordFieldErrors({});

    try {
      await changePassword({ currentPassword, newPassword }).unwrap();
      setPwdMsg({ type: 'success', text: 'Password credentials rotated successfully' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPwdMsg({ type: '', text: '' }), 3500);
    } catch (err) {
      setPwdMsg({ type: 'error', text: err?.data?.message || 'Failed to change password' });
    }
  };

  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    setAddrError('');

    const validation = checkoutShippingDetailsSchema.safeParse({
      firstName: addrForm.firstName.trim(),
      lastName: addrForm.lastName.trim(),
      phone: addrForm.phone.trim(),
      address: addrForm.address.trim(),
      city: addrForm.city.trim(),
      state: addrForm.state.trim(),
      pincode: addrForm.pincode.trim(),
    });

    if (!validation.success) {
      const errors = getZodFieldErrors(validation.error);
      setAddrFieldErrors(errors);
      setAddrError(getZodErrorMessage(validation.error));
      return;
    }
    setAddrFieldErrors({});

    try {
      await addAddress(addrForm).unwrap();
      setShowAddressModal(false);
      setAddrError('');
      setAddrForm({
        firstName: '',
        lastName: '',
        phone: '',
        address: '',
        city: '',
        state: 'Maharashtra',
        pincode: '',
        isDefault: false,
      });
    } catch (err) {
      setAddrError(err?.data?.message || 'Failed to add address');
    }
  };

  if (isAuthenticated && isProfileLoading && !profileData) {
    return (
      <div className="drapza-profile-page" data-profile-root="true" style={{ minHeight: '100vh', backgroundColor: 'var(--base-100, #edf1e8)', color: 'var(--base-700, #0f0f0f)', padding: '8.5rem 2rem 7rem 2rem', position: 'relative' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
          <ProfileSkeleton />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="drapza-profile-page" style={{ minHeight: '100vh', backgroundColor: 'var(--base-100, #edf1e8)', color: 'var(--base-700, #0f0f0f)', padding: '8.5rem 2rem 7rem 2rem', position: 'relative' }} suppressHydrationWarning>
        <div className="profile-ui" style={{ maxWidth: '1200px', margin: '0 auto', width: '100%' }} suppressHydrationWarning>

          {/* Responsive CSS Styles Scoped to Profile */}
          <style>{`
            .drapza-profile-page {
              box-sizing: border-box;
              padding-bottom: 7.5rem !important;
            }
            @media (max-width: 768px) {
              .drapza-profile-page {
                padding: 5.5rem 0.85rem 8.5rem 0.85rem !important;
              }
            }
            @media (max-width: 480px) {
              .drapza-profile-page {
                padding: 4.8rem 0.65rem 9rem 0.65rem !important;
              }
            }

            /* DRAPZA Design System Core Typography & Architecture */
            .profile-ui,
            .profile-ui * {
              box-sizing: border-box;
            }
            .profile-ui {
              font-family: var(--font-dm-mono), monospace !important;
              color: var(--base-700, #0f0f0f);
              -webkit-font-smoothing: antialiased;
            }
            
            /* Headings: Strictly Koulen Bold Display */
            .profile-ui :is(h1, h2, h3, h4, h5) {
              font-family: var(--font-koulen), sans-serif !important;
              text-transform: uppercase !important;
              font-weight: 400 !important;
              line-height: 0.95 !important;
              letter-spacing: clamp(0rem, -0.25vw, -0.05rem) !important;
              color: var(--base-700, #0f0f0f) !important;
            }

            /* Text, Data, Labels, Inputs, Buttons: Strictly DM Mono */
            .profile-ui :is(p, span, a, label, button, input, select, textarea, small, strong) {
              font-family: var(--font-dm-mono), monospace !important;
            }

            /* Top Header Area matching /checkout & /payment */
            .profile-ui .profile-header-section {
              margin-bottom: 2.25rem !important;
              border-bottom: 1px dashed var(--base-300, #afb3ab) !important;
              padding-bottom: 1.5rem !important;
            }

            /* Main Two-Column Layout Container */
            .profile-ui .profile-container {
              display: grid !important;
              grid-template-columns: 290px 1fr !important;
              gap: 2.25rem !important;
              align-items: start !important;
              width: 100% !important;
              margin-bottom: 5.5rem !important;
            }

            @media (max-width: 920px) {
              .profile-ui .profile-container {
                grid-template-columns: 1fr !important;
                gap: 1.5rem !important;
                margin-bottom: 4rem !important;
              }
            }

          /* Left Sidebar (DRAPZA Card Architecture) */
          .profile-ui .profile-sidebar {
            width: 290px !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 1.25rem !important;
            flex-shrink: 0 !important;
          }

          .profile-ui .profile-user-card {
            background-color: #ffffff !important;
            border: 1px solid var(--base-200, #d7dbd2) !important;
            border-radius: 12px !important;
            padding: 1.65rem 1.35rem !important;
            text-align: center !important;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03) !important;
          }

          .profile-ui .profile-user-avatar {
            width: 90px !important;
            height: 90px !important;
            border-radius: 50% !important;
            margin: 0 auto 0.85rem auto !important;
            overflow: hidden !important;
            box-shadow: 0 6px 18px rgba(15, 15, 15, 0.1) !important;
            border: 3px solid var(--base-200, #d7dbd2) !important;
            background-color: var(--base-200, #d7dbd2) !important;
            transition: transform 0.2s ease;
          }
          .profile-ui .profile-user-avatar:hover {
            transform: scale(1.03);
          }

          .profile-ui .profile-nav-list {
            background-color: #ffffff !important;
            border: 1px solid var(--base-200, #d7dbd2) !important;
            border-radius: 12px !important;
            padding: 0.65rem !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 0.3rem !important;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.03) !important;
          }

          .profile-ui .profile-nav-btn {
            display: flex !important;
            align-items: center !important;
            justify-content: space-between !important;
            width: 100% !important;
            padding: 0.68rem 0.9rem !important;
            border-radius: 8px !important;
            font-family: var(--font-dm-mono), monospace !important;
            font-size: 0.78rem !important;
            font-weight: 600 !important;
            letter-spacing: 0.04em !important;
            text-transform: uppercase !important;
            cursor: pointer !important;
            transition: all 0.15s ease !important;
          }

          .profile-ui .profile-nav-btn:not(.active) {
            border: 1px solid transparent !important;
            background-color: transparent !important;
            color: var(--base-500, #7d807a) !important;
          }

          .profile-ui .profile-nav-btn:not(.active) span {
            color: var(--base-500, #7d807a) !important;
          }

          .profile-ui .profile-nav-btn:not(.active) svg {
            color: var(--base-500, #7d807a) !important;
            stroke: var(--base-500, #7d807a) !important;
          }

          .profile-ui .profile-nav-btn:not(.active):hover {
            background-color: #dfe4da !important;
            color: var(--base-700, #0f0f0f) !important;
          }

          .profile-ui .profile-nav-btn:not(.active):hover span {
            color: var(--base-700, #0f0f0f) !important;
          }

          .profile-ui .profile-nav-btn.active {
            border: 1px solid var(--base-700, #0f0f0f) !important;
            background-color: var(--base-700, #0f0f0f) !important;
            color: #ffffff !important;
            font-weight: 700 !important;
            box-shadow: 0 4px 14px rgba(15, 15, 15, 0.18) !important;
          }

          .profile-ui .profile-nav-btn.active span {
            color: #ffffff !important;
          }

          .profile-ui .profile-nav-btn.active svg {
            color: #ffffff !important;
            stroke: #ffffff !important;
          }

          .profile-ui .profile-nav-btn svg {
            width: 16px !important;
            height: 16px !important;
            min-width: 16px !important;
            max-width: 16px !important;
            flex-shrink: 0 !important;
          }

          .profile-ui .profile-sidebar-footer {
            margin-top: 0.45rem;
            padding-top: 0.45rem;
            border-top: 1px solid var(--base-200, #d7dbd2);
            display: flex;
            flex-direction: column;
            gap: 0.2rem;
          }

          /* Main Right Profile Card */
          .profile-ui .profile-main {
            flex: 1;
            min-width: 0;
            width: 100%;
          }
          .profile-ui .profile-card {
            background-color: #ffffff;
            border-radius: 12px !important;
            padding: 2.25rem 2.5rem;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
            border: 1px solid var(--base-200, #d7dbd2);
            min-height: 620px;
            display: flex;
            flex-direction: column;
          }
          .profile-ui .profile-tab-header {
            display: flex;
            align-items: flex-start;
            justify-content: space-between;
            gap: 1.5rem;
            margin-bottom: 1.75rem;
            padding-bottom: 1.25rem;
            border-bottom: 1px solid var(--base-200, #d7dbd2);
          }
          .profile-ui .profile-grid-names {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
            margin-bottom: 1.2rem;
          }
          .profile-ui .profile-grid-contact {
            display: grid;
            grid-template-columns: 1.15fr 1fr;
            gap: 1rem;
            margin-bottom: 1.4rem;
          }
          .profile-ui .profile-gender-row {
            display: flex;
            gap: 1rem;
            margin-bottom: 1.5rem;
          }
          .profile-ui .profile-gender-tile {
            position: relative;
            flex: 1;
            max-width: 120px;
            height: 82px;
            border-radius: 8px !important;
            border: 1px solid var(--base-200, #d7dbd2) !important;
            background-color: #ffffff !important;
            color: var(--base-700, #0f0f0f) !important;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
            user-select: none;
            touch-action: manipulation;
          }
          .profile-ui .profile-gender-tile:hover:not(.selected) {
            border-color: var(--base-400, #969992) !important;
            background-color: #fafbf9 !important;
            transform: translateY(-1.5px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          }
          .profile-ui .profile-gender-tile:active {
            transform: scale(0.985);
          }
          .profile-ui .profile-gender-tile:focus-visible,
          .profile-ui .profile-nav-btn:focus-visible,
          .profile-ui button:focus-visible,
          .profile-ui input:focus-visible,
          .profile-ui select:focus-visible {
            outline: 2px solid var(--base-700, #0f0f0f) !important;
            outline-offset: 2px !important;
          }
          .profile-ui .profile-gender-tile.selected {
            background-color: #121316 !important;
            border-color: #26272e !important;
            color: #ffffff !important;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.16) !important;
          }
          .profile-ui .profile-gender-symbol {
            font-size: 1.45rem;
            line-height: 1;
            margin-bottom: 0.2rem;
            color: inherit;
          }
          .profile-ui .profile-gender-label {
            font-size: 0.78rem;
            font-weight: 700;
            font-family: var(--font-dm-mono), monospace;
            letter-spacing: 0.04em;
            text-transform: uppercase;
            color: inherit;
          }
          .profile-ui .profile-gender-tile.selected .profile-gender-symbol,
          .profile-ui .profile-gender-tile.selected .profile-gender-label {
            color: #ffffff !important;
          }
          .profile-ui .profile-actions-row {
            display: flex;
            gap: 0.85rem;
            align-items: center;
          }
          .profile-ui .profile-wallet-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1.25rem;
          }
          .profile-ui .profile-order-card {
            border: 1px solid var(--base-200, #d7dbd2);
            border-radius: 12px !important;
            padding: 1.25rem 1.4rem;
            background-color: #ffffff;
            transition: all 0.2s ease;
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }
          .profile-ui .profile-order-card:hover {
            border-color: var(--base-400, #969992);
            box-shadow: 0 8px 24px -8px rgba(15, 15, 15, 0.08);
          }
          .profile-ui .profile-order-card svg {
            width: auto;
            height: auto;
            max-width: 100%;
            flex-shrink: 0;
            display: inline-block;
          }
          .profile-ui .profile-status-pill span {
            color: inherit !important;
          }

          /* DRAPZA Design System Component Radiuses */
          .profile-ui .profile-card,
          .profile-ui .profile-order-card,
          .profile-ui .profile-address-modal,
          .profile-ui .profile-address-card,
          .profile-ui .profile-wallet-card {
            border-radius: 12px !important;
          }
          .profile-ui button,
          .profile-ui input,
          .profile-ui select,
          .profile-ui textarea,
          .profile-ui .profile-gender-tile,
          .profile-ui .profile-nav-btn {
            border-radius: 8px !important;
          }
          .profile-ui .profile-status-pill,
          .profile-ui .profile-badge {
            border-radius: 9999px !important;
          }
          .profile-ui button span {
            color: inherit;
          }

          .profile-ui .profile-user-avatar,
          .profile-ui .profile-user-avatar img {
            border-radius: 50% !important;
          }

          /* Instagram-Style Drawer Item Rules */
          .profile-ui .profile-insta-item {
            display: flex;
            align-items: center;
            gap: 0.85rem;
            width: 100%;
            padding: 0.65rem 0.85rem;
            border: none;
            border-radius: 8px !important;
            background-color: transparent;
            color: #4a4d46 !important;
            font-size: 0.82rem;
            font-weight: 500;
            font-family: var(--font-dm-mono), monospace !important;
            letter-spacing: 0.03em !important;
            cursor: pointer;
            text-align: left;
            transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          }
          .profile-ui .profile-insta-item span {
            color: inherit !important;
            font-family: var(--font-dm-mono), monospace !important;
            font-size: 0.82rem !important;
            font-weight: inherit !important;
            letter-spacing: 0.03em !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
          }
          .profile-ui .profile-insta-item svg {
            width: 18px !important;
            height: 18px !important;
            min-width: 18px !important;
            max-width: 18px !important;
            min-height: 18px !important;
            max-height: 18px !important;
            flex-shrink: 0 !important;
            display: block !important;
          }
          .profile-ui .profile-insta-item:hover:not(.active) {
            background-color: #edf1e8;
            color: #0f0f0f !important;
            transform: translateX(4px);
          }
          .profile-ui .profile-insta-item:hover:not(.active) span {
            color: #0f0f0f !important;
          }
          .profile-ui .profile-insta-item.active {
            background-color: #0f0f0f !important;
            color: #edf1e8 !important;
            font-weight: 600;
            box-shadow: 0 4px 14px -3px rgba(15, 15, 15, 0.25);
          }
          .profile-ui .profile-insta-item.active span {
            color: #edf1e8 !important;
            font-weight: 600 !important;
          }
          .profile-ui .profile-insta-item.active svg {
            stroke: #edf1e8 !important;
          }
          .profile-ui .profile-insta-item:not(.active) svg {
            stroke: #7d807a !important;
          }

          @keyframes instaDrawerSlideIn {
            from {
              transform: translateX(-100%);
              opacity: 0.95;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          @keyframes instaBackdropFadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          /* Address Modal System */
          .profile-ui .profile-address-modal {
            background-color: #ffffff;
            border-radius: 12px !important;
            width: 100%;
            max-width: 520px;
            padding: 2rem 2.25rem;
            border: 1px solid var(--base-200, #d7dbd2);
            box-shadow: 0 30px 60px -15px rgba(15, 15, 15, 0.25), 0 0 1px 1px rgba(15, 15, 15, 0.05);
            animation: modalFadeScale 0.22s cubic-bezier(0.16, 1, 0.3, 1);
          }
          @keyframes modalFadeScale {
            from {
              opacity: 0;
              transform: scale(0.96) translateY(8px);
            }
            to {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }
          .profile-ui .profile-address-grid-2col {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.85rem;
            margin-bottom: 0.95rem;
          }
          .profile-ui .profile-address-grid-3col {
            display: grid;
            grid-template-columns: 1.15fr 1.25fr 0.95fr;
            gap: 0.85rem;
            margin-bottom: 1.15rem;
          }
          .profile-ui .profile-form-group {
            display: flex;
            flex-direction: column;
            gap: 0.35rem;
            margin-bottom: 0.95rem;
          }
          .profile-ui .profile-form-label {
            font-size: 0.72rem;
            font-weight: 600;
            letter-spacing: 0.04em;
            color: #4a4d46;
            text-transform: uppercase;
            display: flex;
            align-items: center;
            justify-content: space-between;
          }
          .profile-ui .profile-form-input {
            width: 100%;
            padding: 0.68rem 0.9rem;
            border: 1px solid #d7dbd2;
            border-radius: 8px !important;
            font-size: 0.85rem;
            color: #0f0f0f;
            background-color: #fbfcfa;
            outline: none;
            transition: all 0.18s ease;
            box-sizing: border-box;
          }
          .profile-ui .profile-form-input:focus {
            border-color: #0f0f0f;
            background-color: #ffffff;
            box-shadow: 0 0 0 3px rgba(15, 15, 15, 0.08);
          }
          .profile-ui .profile-form-input::placeholder {
            color: #9ca3af;
            font-size: 0.82rem;
          }
          .profile-ui .profile-close-btn {
            width: 32px !important;
            height: 32px !important;
            min-width: 32px !important;
            max-width: 32px !important;
            min-height: 32px !important;
            max-height: 32px !important;
            padding: 0 !important;
            margin: 0 !important;
            line-height: 1 !important;
            border-radius: 8px !important;
            border: 1px solid #d7dbd2 !important;
            background-color: #edf1e8 !important;
            color: #0f0f0f !important;
            display: inline-flex !important;
            align-items: center !important;
            justify-content: center !important;
            flex-shrink: 0 !important;
            cursor: pointer !important;
            transition: all 0.15s ease;
          }
          .profile-ui .profile-close-btn:hover {
            background-color: #0f0f0f !important;
            color: #ffffff !important;
            border-color: #0f0f0f !important;
            transform: scale(1.05);
          }
          .profile-ui .profile-close-btn svg {
            width: 14px !important;
            height: 14px !important;
            min-width: 14px !important;
            max-width: 14px !important;
            min-height: 14px !important;
            max-height: 14px !important;
            stroke: currentColor !important;
            display: block !important;
            margin: auto !important;
          }
          .profile-ui .profile-checkbox-row {
            display: flex;
            align-items: center;
            gap: 0.65rem;
            margin-bottom: 1.4rem;
            cursor: pointer;
            user-select: none;
          }

          /* Mobile Horizontal Quick-Scroll Tabs */
          .profile-ui .profile-mobile-tabs-scroll-wrap {
            display: none;
            width: 100%;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            -ms-overflow-style: none;
            padding: 0.15rem 0.1rem 0.65rem 0.1rem;
          }
          .profile-ui .profile-mobile-tabs-scroll-wrap::-webkit-scrollbar {
            display: none;
          }
          .profile-ui .profile-mobile-tabs-container {
            display: inline-flex;
            gap: 0.45rem;
            align-items: center;
            white-space: nowrap;
          }
          .profile-ui .profile-mobile-tab-btn {
            display: inline-flex;
            align-items: center;
            gap: 0.42rem;
            padding: 0.52rem 0.95rem;
            border-radius: 9999px;
            background-color: #ffffff;
            border: 1px solid var(--base-200, #d7dbd2);
            color: var(--base-600, #4a4d46);
            font-family: var(--font-dm-mono), monospace;
            font-size: 0.72rem;
            font-weight: 600;
            letter-spacing: 0.03em;
            text-transform: uppercase;
            white-space: nowrap;
            flex-shrink: 0;
            cursor: pointer;
            transition: all 0.18s ease;
            user-select: none;
            box-shadow: 0 1px 3px rgba(15, 15, 15, 0.04);
          }
          .profile-ui .profile-mobile-tab-btn:active {
            transform: scale(0.96);
          }
          .profile-ui .profile-mobile-tab-btn.active {
            background-color: #0f0f0f !important;
            color: #ffffff !important;
            border-color: #0f0f0f !important;
            font-weight: 700 !important;
            box-shadow: 0 4px 14px rgba(15, 15, 15, 0.18) !important;
          }
          .profile-ui .profile-mobile-tab-btn.active svg,
          .profile-ui .profile-mobile-tab-btn.active span {
            color: #ffffff !important;
            stroke: #ffffff !important;
          }
          .profile-ui .profile-mobile-tab-btn .tab-badge {
            font-size: 0.6rem;
            font-weight: 800;
            padding: 0.08rem 0.42rem;
            border-radius: 9999px;
            background-color: #e2e7dc;
            color: #0f0f0f;
            line-height: 1.2;
          }
          .profile-ui .profile-mobile-tab-btn.active .tab-badge {
            background-color: #f59e0b !important;
            color: #000000 !important;
          }

          /* Responsive Wishlist, Cart & Order grids */
          .profile-ui .profile-wishlist-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
            gap: 1.25rem;
            align-items: stretch;
          }
          .profile-ui .profile-cart-grid {
            display: grid;
            grid-template-columns: minmax(0, 1.8fr) minmax(260px, 1.1fr);
            gap: 1.5rem;
            align-items: start;
          }
          .profile-ui .profile-addresses-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
            gap: 1rem;
          }
          .profile-ui .profile-order-details-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 1rem;
          }

          /* Mobile Breakpoint (<= 768px) - Hides PC Sidebar, Activates Mobile Bar & Drawer */
          @media (max-width: 768px) {
            .profile-ui .profile-container {
              display: flex !important;
              flex-direction: column !important;
              width: 100% !important;
              max-width: 100% !important;
              padding: 0 !important;
              gap: 0.85rem !important;
              margin-bottom: 2rem !important;
            }
            .profile-ui .profile-sidebar {
              display: none !important;
            }
            .profile-ui .profile-mobile-nav-bar {
              display: flex !important;
              padding: 0.75rem 1rem !important;
            }
            .profile-ui .profile-mobile-tabs-scroll-wrap {
              display: block !important;
            }
            .profile-ui .profile-header-section {
              margin-bottom: 1.25rem !important;
              padding-bottom: 1rem !important;
            }
            .profile-ui h1 {
              font-size: 1.65rem !important;
              line-height: 1.05 !important;
              letter-spacing: 0.02em !important;
            }
            .profile-ui h2 {
              font-size: 1.35rem !important;
              line-height: 1.1 !important;
            }
            .profile-ui h3 {
              font-size: 1.12rem !important;
              line-height: 1.15 !important;
            }
            .profile-ui .profile-terminal-title {
              display: none;
            }
            .profile-ui .profile-card {
              padding: 1.15rem 0.85rem !important;
              border-radius: 12px !important;
              min-height: auto !important;
              box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03) !important;
            }
            .profile-ui .profile-grid-names {
              grid-template-columns: 1fr !important;
              gap: 1.1rem !important;
            }
            .profile-ui .profile-grid-contact {
              grid-template-columns: 1fr !important;
              gap: 1.1rem !important;
            }
            .profile-ui .profile-gender-tile {
              max-width: none;
              height: 72px;
            }
            .profile-ui .profile-wallet-grid {
              grid-template-columns: 1fr;
              gap: 1rem;
            }
            .profile-ui .profile-actions-row {
              flex-direction: column;
              width: 100%;
              gap: 0.65rem;
            }
            .profile-ui .profile-actions-row button {
              width: 100%;
              text-align: center;
              justify-content: center;
              padding: 0.75rem 1rem !important;
            }
            .profile-ui .profile-order-card {
              padding: 1rem 0.85rem !important;
              flex-direction: column;
              align-items: flex-start !important;
              gap: 0.85rem !important;
            }
            .profile-ui .profile-order-btn-group {
              width: 100% !important;
              flex-direction: column !important;
              gap: 0.45rem !important;
            }
            .profile-ui .profile-order-btn-group button {
              width: 100% !important;
              justify-content: center !important;
              text-align: center !important;
              padding: 0.6rem 1rem !important;
            }
            .profile-ui .profile-tab-header {
              flex-direction: column;
              align-items: flex-start;
              gap: 0.85rem;
              margin-bottom: 1.15rem !important;
              padding-bottom: 0.95rem !important;
            }
            .profile-ui .profile-tab-header button {
              width: 100%;
              text-align: center;
              justify-content: center;
            }
            .profile-ui .profile-address-grid-2col {
              grid-template-columns: 1fr;
            }
            .profile-ui .profile-address-grid-3col {
              grid-template-columns: 1fr;
            }
            .profile-ui .profile-address-modal {
              max-width: 100% !important;
              max-height: 90vh !important;
              overflow-y: auto !important;
              -webkit-overflow-scrolling: touch;
              padding: 1.35rem 1rem !important;
              margin: 0.65rem !important;
            }
            .profile-ui .profile-wishlist-grid {
              grid-template-columns: repeat(2, 1fr) !important;
              gap: 0.75rem !important;
            }
            .profile-ui .profile-cart-grid {
              grid-template-columns: 1fr !important;
              gap: 1.25rem !important;
            }
            .profile-ui .profile-order-details-grid {
              grid-template-columns: 1fr !important;
              gap: 0.75rem !important;
            }
            .profile-ui .profile-security-card {
              padding: 1.25rem 1rem !important;
              max-width: 100% !important;
            }
          }

          @media (max-width: 480px) {
            .profile-ui h1 {
              font-size: 1.45rem !important;
            }
            .profile-ui .profile-order-card {
              padding: 0.85rem 0.65rem !important;
            }
            .profile-ui .profile-card {
              padding: 1rem 0.65rem !important;
            }
          }

          @media (max-width: 380px) {
            .profile-ui .profile-wishlist-grid {
              grid-template-columns: 1fr !important;
            }
          }

          /* Desktop (> 768px) - Hides mobile trigger, keeps pure authentic PC sidebar */
          @media (min-width: 769px) {
            .profile-ui .profile-mobile-nav-bar {
              display: none !important;
            }
            .profile-ui .profile-mobile-tabs-scroll-wrap {
              display: none !important;
            }
            .profile-ui .profile-sidebar {
              display: block !important;
            }
          }
        `}</style>

          {/* DRAPZA Official Page Header */}
          <div className="profile-header-section">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <button
                onClick={() => router.push('/')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--base-500, #7d807a)',
                  cursor: 'pointer',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-dm-mono), monospace',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: 0,
                  transition: 'color 0.15s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#0f0f0f')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#7d807a')}
              >
                <span>←</span>
                <span>BACK TO ATELIER</span>
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button
                  onClick={() => {
                    logout();
                    router.push('/');
                  }}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--base-200, #d7dbd2)',
                    color: 'var(--base-700, #0f0f0f)',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-dm-mono), monospace',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    padding: '0.45rem 1rem',
                    borderRadius: '8px',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#0f0f0f';
                    e.currentTarget.style.color = '#ffffff';
                    e.currentTarget.style.borderColor = '#0f0f0f';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#0f0f0f';
                    e.currentTarget.style.borderColor = '#d7dbd2';
                  }}
                >
                  SIGN OUT
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <h1 style={{ fontFamily: 'var(--font-koulen), sans-serif', fontSize: '2.4rem', textTransform: 'uppercase', letterSpacing: '0.03em', lineHeight: 0.95, margin: 0, color: 'var(--base-700, #0f0f0f)' }}>
                MEMBER CLIENT TERMINAL
              </h1>
              <p style={{ fontFamily: 'var(--font-dm-mono), monospace', fontSize: '0.78rem', color: 'var(--base-500, #7d807a)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
                PERSONAL IDENTITY, ORDER ARCHIVE & ATELIER ACCOUNT
              </p>
            </div>
          </div>

          {/* Main Content Layout Container */}
          <div className="profile-container">

            {/* PC Left Sidebar */}
            <aside className="profile-sidebar">
              {/* User Profile Card */}
              <div className="profile-user-card">
                <div className="profile-user-avatar">
                  <img
                    src="/avatar-sculpture.jpg"
                    alt="Profile Avatar"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      e.currentTarget.src = '/profile-avatar.jpg';
                    }}
                  />
                </div>

                <div className="profile-user-info">
                  <h3 style={{ margin: '0 0 0.35rem 0', fontSize: '1.75rem', fontFamily: 'var(--font-koulen), sans-serif', color: 'var(--base-700, #0f0f0f)', letterSpacing: '0.04em', textTransform: 'uppercase', lineHeight: 1.1 }}>
                    {currentUser.name || 'Denis Holland'}
                  </h3>
                  <div style={{ fontSize: '0.74rem', color: 'var(--base-500, #7d807a)', fontFamily: 'var(--font-dm-mono), monospace', marginBottom: '0', wordBreak: 'break-all' }}>
                    {currentUser.email || 'client@drapza.com'}
                  </div>
                </div>
              </div>

              {/* Navigation Links List Card */}
              <nav className="profile-nav-list" role="tablist" aria-label="Client account sections">
                {navItems.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      role="tab"
                      aria-selected={isActive}
                      tabIndex={0}
                      onClick={() => setActiveTab(item.id)}
                      className={`profile-nav-btn ${isActive ? 'active' : ''}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        padding: '0.7rem 0.95rem',
                        borderRadius: '8px',
                        border: isActive ? '1px solid var(--base-700, #0f0f0f)' : '1px solid transparent',
                        backgroundColor: isActive ? 'var(--base-700, #0f0f0f)' : 'transparent',
                        color: isActive ? '#ffffff' : 'var(--base-500, #7d807a)',
                        fontFamily: 'var(--font-dm-mono), monospace',
                        fontSize: '0.78rem',
                        fontWeight: isActive ? 700 : 600,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <span style={{ color: isActive ? '#ffffff' : 'var(--base-500, #7d807a)', display: 'flex', alignItems: 'center' }}>
                          {item.icon}
                        </span>
                        <span style={{ color: isActive ? '#ffffff' : 'inherit' }}>{item.label}</span>
                      </div>
                      {item.badge != null && (
                        <span style={{
                          fontSize: '9px',
                          fontFamily: 'var(--font-dm-mono), monospace',
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          backgroundColor: isActive ? '#f59e0b' : 'var(--base-200, #d7dbd2)',
                          color: isActive ? '#000000' : 'var(--base-700, #0f0f0f)',
                          fontWeight: 800,
                          letterSpacing: '0.04em',
                          lineHeight: 1.2,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          whiteSpace: 'nowrap',
                        }}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}

                <div className="profile-sidebar-footer">
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      router.push('/');
                    }}
                    className="profile-nav-btn"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      width: '100%',
                      padding: '0.7rem 0.95rem',
                      borderRadius: '8px',
                      border: '1px solid transparent',
                      backgroundColor: 'transparent',
                      color: 'var(--base-500, #7d807a)',
                      fontFamily: 'var(--font-dm-mono), monospace',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#dfe4da';
                      e.currentTarget.style.color = '#0f0f0f';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#7d807a';
                    }}
                  >
                    <span style={{ color: 'inherit', display: 'flex', alignItems: 'center' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px', flexShrink: 0 }}>
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                      </svg>
                    </span>
                    <span>Sign Out</span>
                  </button>
                </div>
              </nav>
            </aside>

            {/* Mobile Profile Status Bar (Visible on mobile only) */}
            <div className="profile-mobile-nav-bar" style={{
              display: 'none',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '0.85rem 1.15rem',
              border: '1px solid #d7dbd2',
              boxShadow: '0 4px 15px -4px rgba(15,15,15,0.06)',
              width: '100%',
            }}>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', flex: 1, minWidth: 0, marginRight: '0.5rem' }}
                onClick={() => setMobileDrawerOpen(true)}
              >
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #0f0f0f', flexShrink: 0 }}>
                  <img src="/avatar-sculpture.jpg" alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.src = '/profile-avatar.jpg'; }} />
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f0f0f', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{currentUser.name || 'Denis Holland'}</div>
                  <div style={{ fontSize: '0.72rem', color: '#7d807a', fontWeight: 600 }}>
                    Active: <span style={{ color: '#0f0f0f', fontWeight: 700 }}>{tabLabels[activeTab]}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMobileDrawerOpen(true)}
                aria-label="Open navigation menu"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  backgroundColor: '#0f0f0f',
                  color: '#edf1e8',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '0.55rem 0.95rem',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  fontFamily: 'var(--font-dm-mono), monospace',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '14px', height: '14px', flexShrink: 0 }}>
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
                <span>MENU</span>
              </button>
            </div>

            {/* Mobile Horizontal Quick-Scroll Tabs */}
            <div className="profile-mobile-tabs-scroll-wrap">
              <div className="profile-mobile-tabs-container">
                {navItems.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveTab(item.id)}
                      className={`profile-mobile-tab-btn ${isActive ? 'active' : ''}`}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                      {item.badge != null && (
                        <span className="tab-badge">{item.badge}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            <main className="profile-main">
              <div className="profile-card">

                {/* TAB: Personal Information (Matches screenshot with DRAPZA palette) */}
                {activeTab === 'personal' && (
                  <div>
                    {/* Modern Header (Matching Reference Image) */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.75rem', paddingBottom: '1.25rem', borderBottom: '1px solid #edf1e8' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                        <div style={{ width: '42px', height: '42px', backgroundColor: '#f0f3eb', border: '1px solid #d7dbd2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0f0f0f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                          </svg>
                        </div>
                        <div>
                          <h1 style={{ margin: 0, fontSize: '2.1rem', color: '#0f0f0f', fontFamily: 'var(--font-koulen), sans-serif', textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1.1 }}>
                            PERSONAL INFORMATION
                          </h1>
                          <p style={{ margin: '0.2rem 0 0 0', color: '#7d807a', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: 'var(--font-dm-mono), monospace' }}>
                            UPDATE YOUR CONTACT DETAILS, BILLING CREDENTIALS AND PROFILE PARAMETERS.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Success Notification */}
                    {saveSuccess && (
                      <div style={{
                        backgroundColor: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        color: '#166534',
                        padding: '0.75rem 1.15rem',
                        borderRadius: '8px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        fontFamily: 'var(--font-dm-mono), monospace',
                        marginBottom: '1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                      }}>
                        <span>✓</span> Personal information updated successfully in database.
                      </div>
                    )}

                    {/* Error Notification */}
                    {saveError && (
                      <div style={{
                        backgroundColor: '#fef2f2',
                        border: '1px solid #fecaca',
                        color: '#991b1b',
                        padding: '0.75rem 1.15rem',
                        borderRadius: '8px',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        fontFamily: 'var(--font-dm-mono), monospace',
                        marginBottom: '1.25rem',
                      }}>
                        {saveError}
                      </div>
                    )}

                    <form onSubmit={handleSaveProfile} noValidate>
                      {/* Row 1: First name & Last name */}
                      <div className="profile-grid-names">
                        {/* First Name */}
                        <div style={{ position: 'relative' }}>
                          <label style={{
                            position: 'absolute',
                            top: '-8px',
                            left: '12px',
                            backgroundColor: '#ffffff',
                            padding: '0 5px',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            color: '#0f0f0f',
                            zIndex: 2,
                            fontFamily: 'var(--font-dm-mono), monospace',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                          }}>
                            First name
                          </label>
                          <input
                            type="text"
                            value={firstName}
                            onChange={(e) => {
                              setFirstName(e.target.value);
                              if (personalFieldErrors.firstName || personalFieldErrors.name) {
                                setPersonalFieldErrors((prev) => ({ ...prev, firstName: '', name: '' }));
                              }
                            }}
                            style={{
                              width: '100%',
                              padding: '0.68rem 0.95rem',
                              border: (personalFieldErrors.firstName || personalFieldErrors.name) ? '1px solid #ef4444' : '1px solid #d7dbd2',
                              borderRadius: '8px',
                              fontSize: '0.85rem',
                              color: '#0f0f0f',
                              outline: 'none',
                              backgroundColor: '#ffffff',
                              fontFamily: 'var(--font-dm-mono), monospace',
                            }}
                          />
                          {(personalFieldErrors.firstName || personalFieldErrors.name) && (
                            <span style={{ color: '#ef4444', fontSize: '0.68rem', fontFamily: 'var(--font-dm-mono), monospace', marginTop: '0.2rem', fontWeight: 500, display: 'block' }}>
                              {personalFieldErrors.firstName || personalFieldErrors.name}
                            </span>
                          )}
                        </div>

                        {/* Last Name */}
                        <div style={{ position: 'relative' }}>
                          <label style={{
                            position: 'absolute',
                            top: '-8px',
                            left: '12px',
                            backgroundColor: '#ffffff',
                            padding: '0 5px',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            color: '#0f0f0f',
                            zIndex: 2,
                            fontFamily: 'var(--font-dm-mono), monospace',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em',
                          }}>
                            Last name
                          </label>
                          <input
                            type="text"
                            placeholder="Last name"
                            value={lastName}
                            onChange={(e) => {
                              setLastName(e.target.value);
                              if (personalFieldErrors.lastName) {
                                setPersonalFieldErrors((prev) => ({ ...prev, lastName: '' }));
                              }
                            }}
                            style={{
                              width: '100%',
                              padding: '0.68rem 0.95rem',
                              border: personalFieldErrors.lastName ? '1px solid #ef4444' : '1px solid #d7dbd2',
                              borderRadius: '8px',
                              fontSize: '0.85rem',
                              color: '#0f0f0f',
                              outline: 'none',
                              backgroundColor: '#ffffff',
                              fontFamily: 'var(--font-dm-mono), monospace',
                            }}
                          />
                          {personalFieldErrors.lastName && (
                            <span style={{ color: '#ef4444', fontSize: '0.68rem', fontFamily: 'var(--font-dm-mono), monospace', marginTop: '0.2rem', fontWeight: 500, display: 'block' }}>
                              {personalFieldErrors.lastName}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Row 2: Email */}
                      <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
                        <label style={{
                          position: 'absolute',
                          top: '-8px',
                          left: '12px',
                          backgroundColor: '#ffffff',
                          padding: '0 5px',
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          color: '#7d807a',
                          zIndex: 2,
                          fontFamily: 'var(--font-dm-mono), monospace',
                          textTransform: 'uppercase',
                          letterSpacing: '0.04em',
                        }}>
                          Email
                        </label>
                        <input
                          type="email"
                          readOnly
                          disabled
                          value={email}
                          style={{
                            width: '100%',
                            padding: '0.68rem 0.95rem',
                            border: '1px solid #d7dbd2',
                            borderRadius: '8px',
                            fontSize: '0.85rem',
                            color: '#7d807a',
                            backgroundColor: '#f7f9f5',
                            cursor: 'not-allowed',
                            fontFamily: 'var(--font-dm-mono), monospace',
                          }}
                        />
                      </div>

                      {/* Row 3: Phone with flag & Date of Birth */}
                      <div className="profile-grid-contact">
                        {/* Phone with flag */}
                        <div>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            border: personalFieldErrors.phone ? '1px solid #ef4444' : '1px solid #d7dbd2',
                            borderRadius: '8px',
                            backgroundColor: '#ffffff',
                          }}>
                            {/* Flag and Code Dropdown */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0 0.75rem', borderRight: '1px solid #d7dbd2', backgroundColor: '#f4f6f2', height: '100%' }}>
                              <select
                                value={countryCode}
                                onChange={(e) => setCountryCode(e.target.value)}
                                style={{
                                  border: 'none',
                                  outline: 'none',
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  color: '#0f0f0f',
                                  backgroundColor: 'transparent',
                                  cursor: 'pointer',
                                  fontFamily: 'var(--font-dm-mono), monospace',
                                }}
                              >
                                <option value="+33" style={{ backgroundColor: '#ffffff', color: '#0f0f0f' }}>(+33)</option>
                                <option value="+31" style={{ backgroundColor: '#ffffff', color: '#0f0f0f' }}>(+31)</option>
                                <option value="+91" style={{ backgroundColor: '#ffffff', color: '#0f0f0f' }}>(+91)</option>
                                <option value="+1" style={{ backgroundColor: '#ffffff', color: '#0f0f0f' }}>(+1)</option>
                                <option value="+44" style={{ backgroundColor: '#ffffff', color: '#0f0f0f' }}>(+44)</option>
                              </select>
                            </div>

                            {/* Phone Number Input */}
                            <input
                              type="tel"
                              value={phone}
                              onChange={(e) => {
                                setPhone(e.target.value);
                                if (personalFieldErrors.phone) setPersonalFieldErrors((prev) => ({ ...prev, phone: '' }));
                              }}
                              placeholder="9794603102"
                              style={{
                                flex: 1,
                                border: 'none',
                                outline: 'none',
                                padding: '0.68rem 0.85rem',
                                fontSize: '0.85rem',
                                color: '#0f0f0f',
                                fontFamily: 'var(--font-dm-mono), monospace',
                              }}
                            />
                          </div>
                          {personalFieldErrors.phone && (
                            <span style={{ color: '#ef4444', fontSize: '0.68rem', fontFamily: 'var(--font-dm-mono), monospace', marginTop: '0.2rem', fontWeight: 500, display: 'block' }}>
                              {personalFieldErrors.phone}
                            </span>
                          )}
                        </div>

                        {/* Date of Birth Picker */}
                        <div style={{ position: 'relative' }}>
                          <div
                            onClick={handleOpenDatePicker}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              border: personalFieldErrors.dob ? '1px solid #ef4444' : '1px solid #d7dbd2',
                              borderRadius: '8px',
                              padding: '0.68rem 0.95rem',
                              backgroundColor: '#ffffff',
                              color: '#0f0f0f',
                              cursor: 'pointer',
                              position: 'relative',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenDatePicker();
                                }}
                                title="Open calendar"
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  padding: 0,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  color: '#0f0f0f',
                                }}
                              >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '15px', height: '15px', flexShrink: 0 }}>
                                  <rect x="3" y="4" width="18" height="18" rx="0" ry="0"></rect>
                                  <line x1="16" y1="2" x2="16" y2="6"></line>
                                  <line x1="8" y1="2" x2="8" y2="6"></line>
                                  <line x1="3" y1="10" x2="21" y2="10"></line>
                                </svg>
                              </button>
                              <input
                                type="text"
                                value={dob}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                  setDob(e.target.value);
                                  if (personalFieldErrors.dob) setPersonalFieldErrors((prev) => ({ ...prev, dob: '' }));
                                }}
                                placeholder="DD / MM / YYYY"
                                style={{
                                  border: 'none',
                                  outline: 'none',
                                  color: '#0f0f0f',
                                  fontSize: '0.82rem',
                                  fontWeight: 700,
                                  backgroundColor: 'transparent',
                                  width: '130px',
                                  fontFamily: 'var(--font-dm-mono), monospace',
                                }}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDatePicker();
                              }}
                              title="Open calendar"
                              style={{
                                background: 'none',
                                border: 'none',
                                padding: 0,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                color: '#0f0f0f',
                              }}
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" style={{ width: '13px', height: '13px', flexShrink: 0 }}>
                                <polyline points="6 9 12 15 18 9"></polyline>
                              </svg>
                            </button>
                          </div>

                          {/* Native Date Picker Anchor */}
                          <input
                            ref={dateInputRef}
                            type="date"
                            value={getIsoDate(dob)}
                            max={new Date().toISOString().split('T')[0]}
                            min="1920-01-01"
                            onChange={(e) => {
                              if (e.target.value) {
                                const parts = e.target.value.split('-');
                                if (parts.length === 3) {
                                  const formatted = `${parts[2]} / ${parts[1]} / ${parts[0]}`;
                                  setDob(formatted);
                                  if (personalFieldErrors.dob) {
                                    setPersonalFieldErrors((prev) => ({ ...prev, dob: '' }));
                                  }
                                }
                              }
                            }}
                            tabIndex={-1}
                            aria-hidden="true"
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              opacity: 0,
                              zIndex: -1,
                            }}
                          />

                          {personalFieldErrors.dob && (
                            <span style={{ color: '#ef4444', fontSize: '0.68rem', fontFamily: 'var(--font-dm-mono), monospace', marginTop: '0.2rem', fontWeight: 500, display: 'block' }}>
                              {personalFieldErrors.dob}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Row 4: Gender Selector Cards */}
                      <div>
                        <div
                          role="radiogroup"
                          aria-label="Select Gender"
                          className="profile-gender-row"
                        >
                          {/* Male Card */}
                          <button
                            type="button"
                            role="radio"
                            aria-checked={gender === 'male'}
                            tabIndex={0}
                            onClick={() => {
                              setGender('male');
                              if (personalFieldErrors.gender) setPersonalFieldErrors((prev) => ({ ...prev, gender: '' }));
                            }}
                            onKeyDown={(e) => {
                              if (e.key === ' ' || e.key === 'Enter') {
                                e.preventDefault();
                                setGender('male');
                                if (personalFieldErrors.gender) setPersonalFieldErrors((prev) => ({ ...prev, gender: '' }));
                              }
                            }}
                            className={`profile-gender-tile ${gender === 'male' ? 'selected' : ''}`}
                          >
                            {/* Checkmark badge when active */}
                            {gender === 'male' && (
                              <span style={{
                                position: 'absolute',
                                top: '6px',
                                right: '8px',
                                fontSize: '0.8rem',
                                fontWeight: 'bold',
                                color: '#ffffff',
                              }}>
                                ✓
                              </span>
                            )}
                            <span className="profile-gender-symbol">♂</span>
                            <span className="profile-gender-label">MALE</span>
                          </button>

                          {/* Female Card */}
                          <button
                            type="button"
                            role="radio"
                            aria-checked={gender === 'female'}
                            tabIndex={0}
                            onClick={() => {
                              setGender('female');
                              if (personalFieldErrors.gender) setPersonalFieldErrors((prev) => ({ ...prev, gender: '' }));
                            }}
                            onKeyDown={(e) => {
                              if (e.key === ' ' || e.key === 'Enter') {
                                e.preventDefault();
                                setGender('female');
                                if (personalFieldErrors.gender) setPersonalFieldErrors((prev) => ({ ...prev, gender: '' }));
                              }
                            }}
                            className={`profile-gender-tile ${gender === 'female' ? 'selected' : ''}`}
                          >
                            {gender === 'female' && (
                              <span style={{
                                position: 'absolute',
                                top: '6px',
                                right: '8px',
                                fontSize: '0.8rem',
                                fontWeight: 'bold',
                                color: '#ffffff',
                              }}>
                                ✓
                              </span>
                            )}
                            <span className="profile-gender-symbol">♀</span>
                            <span className="profile-gender-label">FEMALE</span>
                          </button>
                        </div>
                        {personalFieldErrors.gender && (
                          <span style={{ color: '#ef4444', fontSize: '0.68rem', fontFamily: 'var(--font-dm-mono), monospace', marginTop: '0.35rem', fontWeight: 500, display: 'block' }}>
                            {personalFieldErrors.gender}
                          </span>
                        )}
                      </div>

                      {/* Policy and Informational Text */}
                      <p style={{
                        color: '#7d807a',
                        fontSize: '0.78rem',
                        lineHeight: '1.7',
                        margin: '0 0 1.6rem 0',
                        fontFamily: 'var(--font-dm-mono), monospace',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em'
                      }}>
                        YOUR ACCOUNT PROFILE SECURELY STORES YOUR PERSONAL IDENTIFICATION, ORDER ARCHIVE, AND DELIVERY PREFERENCES FOR SWIFT ATELIER CHECKOUT AND BESPOKE TRACKING.{' '}
                        <span
                          style={{ color: '#0f0f0f', textDecoration: 'underline', cursor: 'pointer', fontWeight: 700 }}
                          onClick={() => router.push('/terms')}
                        >
                          TERMS & CONDITIONS
                        </span>
                      </p>

                      {/* Action Buttons: Save & Cancel */}
                      <div className="profile-actions-row" style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
                        <button
                          type="submit"
                          disabled={isUpdatingProfile}
                          style={{
                            backgroundColor: '#0f0f0f',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '0.72rem 2.25rem',
                            fontSize: '0.84rem',
                            fontWeight: 700,
                            fontFamily: 'var(--font-dm-mono), monospace',
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase',
                            cursor: isUpdatingProfile ? 'not-allowed' : 'pointer',
                            boxShadow: '0 4px 14px rgba(15, 15, 15, 0.2)',
                            transition: 'background-color 0.15s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#262626')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0f0f0f')}
                        >
                          {isUpdatingProfile ? 'SAVING...' : 'SAVE'}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const parts = (currentUser.name || 'Denis Holland').trim().split(' ');
                            setFirstName(parts[0] || 'Denis');
                            setLastName(parts.slice(1).join(' ') || 'Holland');
                            setPhone(currentUser.phone || '9794603102');
                            setGender(currentUser.gender || 'male');
                            setDob(currentUser.dob || '14 / 08 / 1998');
                            setPersonalFieldErrors({});
                            setSaveError('');
                          }}
                          style={{
                            backgroundColor: '#ffffff',
                            color: '#0f0f0f',
                            border: '1px solid #d7dbd2',
                            borderRadius: '8px',
                            padding: '0.72rem 1.85rem',
                            fontSize: '0.84rem',
                            fontWeight: 700,
                            fontFamily: 'var(--font-dm-mono), monospace',
                            letterSpacing: '0.05em',
                            textTransform: 'uppercase',
                            cursor: 'pointer',
                            transition: 'background-color 0.15s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#edf1e8')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                        >
                          CANCEL
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* TAB: My Orders */}
                {activeTab === 'orders' && (() => {
                  const allOrders = ordersData?.orders || [];
                  const filteredOrders = allOrders.filter((order) => {
                    const st = (order.status || 'CONFIRMED').toUpperCase();
                    if (orderFilter === 'ALL') return true;
                    if (orderFilter === 'CONFIRMED') return st === 'CONFIRMED' || st === 'PENDING';
                    if (orderFilter === 'IN_TRANSIT') return ['TAILORING', 'QUALITY_CHECK', 'DISPATCHED', 'OUT_FOR_DELIVERY'].includes(st);
                    if (orderFilter === 'DELIVERED') return st === 'DELIVERED';
                    if (orderFilter === 'CANCELLED') return st === 'CANCELLED';
                    return true;
                  });

                  const countConfirmed = allOrders.filter(o => ['CONFIRMED', 'PENDING'].includes((o.status || 'CONFIRMED').toUpperCase())).length;
                  const countTransit = allOrders.filter(o => ['TAILORING', 'QUALITY_CHECK', 'DISPATCHED', 'OUT_FOR_DELIVERY'].includes((o.status || '').toUpperCase())).length;
                  const countDelivered = allOrders.filter(o => (o.status || '').toUpperCase() === 'DELIVERED').length;
                  const countCancelled = allOrders.filter(o => (o.status || '').toUpperCase() === 'CANCELLED').length;

                  return (
                    <div>
                      {/* Modern Top Header */}
                      <div className="profile-tab-header">
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                            <h1 style={{ margin: 0, fontSize: '2.1rem', color: '#0f0f0f', fontFamily: 'var(--font-koulen), sans-serif', textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1.1 }}>
                              MY ORDERS
                            </h1>
                            <span style={{
                              backgroundColor: '#0f0f0f',
                              color: '#ffffff',
                              fontSize: '0.68rem',
                              fontFamily: 'var(--font-dm-mono), monospace',
                              fontWeight: 700,
                              padding: '0.2rem 0.55rem',
                              letterSpacing: '0.06em'
                            }}>
                              {allOrders.length} {allOrders.length === 1 ? 'ORDER' : 'ORDERS'}
                            </span>
                          </div>
                          <p style={{ margin: 0, color: '#7d807a', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: 'var(--font-dm-mono), monospace' }}>
                            TRACK REAL-TIME SHIPMENT DISPATCHES, ATELIER MILESTONES AND ORDER ARCHIVE.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => router.push('/track')}
                          style={{
                            backgroundColor: '#0f0f0f',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '0.65rem 1.35rem',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            fontFamily: 'var(--font-dm-mono), monospace',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            whiteSpace: 'nowrap',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 4px 14px rgba(15,15,15,0.2)'
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#262626')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0f0f0f')}
                        >
                          <span style={{ color: '#ffffff !important', fontWeight: 700 }}>Track Any Shipment</span>
                          <span style={{ color: '#ffffff !important', fontSize: '0.85rem' }}>→</span>
                        </button>
                      </div>

                      {/* Status Filter Tabs */}
                      <div style={{
                        display: 'flex',
                        gap: '0.5rem',
                        overflowX: 'auto',
                        paddingBottom: '0.75rem',
                        marginBottom: '1.25rem',
                        borderBottom: '1px solid #edf1e8'
                      }}>
                        {[
                          { id: 'ALL', label: 'All Orders', count: allOrders.length },
                          { id: 'CONFIRMED', label: 'Confirmed', count: countConfirmed },
                          { id: 'IN_TRANSIT', label: 'In Transit', count: countTransit },
                          { id: 'DELIVERED', label: 'Delivered', count: countDelivered },
                          ...(countCancelled > 0 ? [{ id: 'CANCELLED', label: 'Cancelled', count: countCancelled }] : []),
                        ].map((tab) => {
                          const isSelected = orderFilter === tab.id;
                          return (
                            <button
                              key={tab.id}
                              type="button"
                              onClick={() => setOrderFilter(tab.id)}
                              style={{
                                background: isSelected ? '#0f0f0f' : '#f4f6f2',
                                color: isSelected ? '#ffffff' : '#555852',
                                border: isSelected ? '1px solid #0f0f0f' : '1px solid #e2e7dc',
                                borderRadius: '8px',
                                padding: '0.35rem 0.85rem',
                                fontSize: '0.72rem',
                                fontFamily: 'var(--font-dm-mono), monospace',
                                letterSpacing: '0.04em',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                transition: 'all 0.15s ease',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              <span style={{
                                color: isSelected ? '#ffffff !important' : '#555852',
                                fontWeight: isSelected ? 700 : 500,
                                transition: 'color 0.15s ease'
                              }}>
                                {tab.label}
                              </span>
                              <span style={{
                                fontSize: '0.65rem',
                                opacity: 0.9,
                                padding: '0.05rem 0.35rem',
                                borderRadius: '8px',
                                background: isSelected ? 'rgba(255,255,255,0.22)' : '#e2e7dc',
                                color: isSelected ? '#ffffff !important' : '#0f0f0f',
                                fontWeight: 700
                              }}>
                                {tab.count}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {isOrdersLoading ? (
                        <OrderCardsSkeleton count={3} />
                      ) : filteredOrders.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                          {filteredOrders.map((order) => {
                            const orderId = order.orderId || `DPZ-${order._id?.slice(-6).toUpperCase()}`;
                            const trackingRef = order.trackingRef || orderId;
                            const st = (order.status || 'CONFIRMED').toUpperCase();
                            const isExpanded = expandedOrderId === (order._id || order.orderId);
                            const isCopied = copiedOrderId === orderId;

                            // Milestone & Lifecycle Eligibility calculation
                            const isPlaced = true;
                            const isCrafting = ['TAILORING', 'QUALITY_CHECK', 'DISPATCHED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(st);
                            const isDispatched = ['DISPATCHED', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(st);
                            const isDelivered = st === 'DELIVERED';
                            const isCancelled = st === 'CANCELLED';
                            const isInTransit = ['DISPATCHED', 'SHIPPED', 'OUT_FOR_DELIVERY'].includes(st);
                            const isAtelier = ['PENDING', 'CONFIRMED', 'PROCESSING', 'TAILORING', 'QUALITY_CHECK'].includes(st);

                            // 1. CANCEL: Only allowed during Atelier / Pre-Courier Dispatch
                            const isCancellable = isAtelier && !isCancelled;

                            // 2. RETURN / EXCHANGE: Only allowed once DELIVERED and within 14 days
                            const orderDate = new Date(order.updatedAt || order.createdAt || Date.now());
                            const daysSinceDelivery = Math.floor((Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
                            const isReturnWindowActive = isDelivered && daysSinceDelivery <= 14;
                            const isReturnExpired = isDelivered && daysSinceDelivery > 14;
                            const returnDaysRemaining = Math.max(0, 14 - daysSinceDelivery);

                            return (
                              <div
                                key={order._id || order.orderId}
                                className="profile-order-card"
                              >
                                {/* 1. Header: Reference, Date & Status */}
                                <div style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  flexWrap: 'wrap',
                                  gap: '0.75rem',
                                  paddingBottom: '0.85rem',
                                  borderBottom: '1px solid #edf1e8'
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                                    <span
                                      onClick={() => handleCopyOrderRef(orderId)}
                                      title="Click to copy Order ID"
                                      style={{
                                        fontWeight: 700,
                                        fontSize: '0.88rem',
                                        color: '#0f0f0f',
                                        fontFamily: 'var(--font-dm-mono), monospace',
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.45rem',
                                        padding: '0.22rem 0.55rem',
                                        borderRadius: '8px',
                                        background: '#f4f6f2',
                                        border: '1px solid #e2e7dc',
                                        whiteSpace: 'nowrap',
                                        userSelect: 'none',
                                        transition: 'background-color 0.15s ease'
                                      }}
                                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#e8ece4')}
                                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#f4f6f2')}
                                    >
                                      <span style={{ color: '#0f0f0f', letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>{orderId}</span>
                                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#7d807a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '13px', height: '13px', minWidth: '13px', minHeight: '13px', flexShrink: 0 }}>
                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                      </svg>
                                    </span>
                                    {isCopied && (
                                      <span style={{ fontSize: '0.66rem', color: '#166534', fontWeight: 600, fontFamily: 'var(--font-dm-mono), monospace', whiteSpace: 'nowrap' }}>
                                        COPIED!
                                      </span>
                                    )}

                                    <span style={{ fontSize: '0.76rem', color: '#7d807a', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap' }}>
                                      <span>•</span>
                                      <span>{formatOrderDate(order.createdAt)}</span>
                                    </span>
                                  </div>

                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'nowrap' }}>
                                    <span
                                      className="profile-status-pill"
                                      style={{
                                        backgroundColor: st === 'CANCELLED' ? '#fef2f2' : st === 'DELIVERED' ? '#f0fdf4' : '#0f0f0f',
                                        color: st === 'CANCELLED' ? '#b91c1c' : st === 'DELIVERED' ? '#166534' : '#ffffff',
                                        border: st === 'CANCELLED' ? '1px solid #fecaca' : st === 'DELIVERED' ? '1px solid #bbf7d0' : '1px solid #0f0f0f',
                                        padding: '0.24rem 0.7rem',
                                        borderRadius: '8px',
                                        fontSize: '0.68rem',
                                        fontWeight: 700,
                                        fontFamily: 'var(--font-dm-mono), monospace',
                                        letterSpacing: '0.06em',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.45rem',
                                        whiteSpace: 'nowrap',
                                        boxShadow: st === 'DELIVERED' || st === 'CANCELLED' ? 'none' : '0 2px 6px rgba(15,15,15,0.12)'
                                      }}
                                    >
                                      <span style={{
                                        width: '6px',
                                        height: '6px',
                                        minWidth: '6px',
                                        minHeight: '6px',
                                        borderRadius: '8px',
                                        backgroundColor: st === 'CANCELLED' ? '#ef4444' : st === 'DELIVERED' ? '#22c55e' : '#4ade80',
                                        flexShrink: 0
                                      }} />
                                      <span style={{
                                        color: st === 'CANCELLED' ? '#b91c1c !important' : st === 'DELIVERED' ? '#166534 !important' : '#ffffff !important',
                                        fontFamily: 'var(--font-dm-mono), monospace !important',
                                        fontSize: '0.68rem !important',
                                        fontWeight: '700 !important',
                                        letterSpacing: '0.06em !important',
                                        lineHeight: 1
                                      }}>
                                        {st}
                                      </span>
                                    </span>

                                    <span style={{
                                      backgroundColor: '#f4f6f2',
                                      border: '1px solid #e2e7dc',
                                      color: '#4a4d46',
                                      padding: '0.24rem 0.6rem',
                                      borderRadius: '8px',
                                      fontSize: '0.66rem',
                                      fontWeight: 700,
                                      fontFamily: 'var(--font-dm-mono), monospace',
                                      whiteSpace: 'nowrap',
                                      letterSpacing: '0.04em'
                                    }}>
                                      <span style={{ color: '#4a4d46 !important' }}>
                                        {order.paymentMethod || 'COD'}
                                      </span>
                                    </span>
                                  </div>
                                </div>

                                {/* 2. Middle Row: Product & Amount */}
                                <div style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  flexWrap: 'wrap',
                                  gap: '1rem',
                                  padding: '0.35rem 0'
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                                    {order.items && order.items.length > 0 && order.items[0]?.image ? (
                                      <div style={{
                                        width: '54px',
                                        height: '54px',
                                        borderRadius: '8px',
                                        overflow: 'hidden',
                                        backgroundColor: '#edf1e8',
                                        border: '1px solid #d7dbd2',
                                        flexShrink: 0
                                      }}>
                                        <img
                                          src={order.items[0].image}
                                          alt={order.items[0].name || 'Product'}
                                          style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '0.25rem', display: 'block' }}
                                          onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                          }}
                                        />
                                      </div>
                                    ) : (
                                      <div style={{
                                        width: '52px',
                                        height: '52px',
                                        borderRadius: '8px',
                                        backgroundColor: '#f4f6f2',
                                        border: '1px solid #e2e7dc',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0
                                      }}>
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0f0f0f" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: '22px', height: '22px', minWidth: '22px', minHeight: '22px', flexShrink: 0 }}>
                                          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                                          <line x1="3" y1="6" x2="21" y2="6"></line>
                                          <path d="M16 10a4 4 0 0 1-8 0"></path>
                                        </svg>
                                      </div>
                                    )}

                                    <div>
                                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f0f0f', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                                        {order.items && order.items.length > 0
                                          ? order.items[0]?.name || 'DRAPZA ATELIER PIECE'
                                          : 'DRAPZA ARCHIVE GARMENT'}
                                      </div>
                                      <div style={{ fontSize: '0.74rem', color: '#7d807a', marginTop: '0.15rem' }}>
                                        {order.items && order.items.length > 0
                                          ? `Size: ${order.items[0]?.selectedSize || 'M'} • Qty: ${order.items[0]?.quantity || 1}${order.items.length > 1 ? ` (+${order.items.length - 1} more)` : ''}`
                                          : 'Bespoke Couture Dispatch • Standard Atelier Fit'}
                                      </div>
                                    </div>
                                  </div>

                                  <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.68rem', color: '#7d807a', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'var(--font-dm-mono), monospace' }}>
                                      Total Amount
                                    </div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f0f0f', fontFamily: 'var(--font-dm-mono), monospace', marginTop: '0.1rem', letterSpacing: '-0.02em' }}>
                                      ₹{getOrderTotal(order)}
                                    </div>
                                  </div>
                                </div>

                                {/* 3. Milestone Progress Bar OR Cancellation Notice */}
                                {st === 'CANCELLED' ? (
                                  <div style={{
                                    backgroundColor: '#fef2f2',
                                    border: '1px solid #fee2e2',
                                    borderRadius: '10px',
                                    padding: '0.75rem 1.15rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    flexWrap: 'wrap',
                                    gap: '0.65rem'
                                  }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                      <Ban style={{ width: '16px', height: '16px', color: '#b91c1c', flexShrink: 0 }} />
                                      <div>
                                        <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#991b1b', fontFamily: 'var(--font-dm-mono), monospace', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                          ORDER REVOKED &amp; CANCELLED
                                        </div>
                                        <div style={{ fontSize: '0.72rem', color: '#b91c1c', marginTop: '0.1rem', fontFamily: 'var(--font-host-grotesk), sans-serif' }}>
                                          {order.cancellationReason || 'Fabric allocation released back into atelier archive.'}
                                        </div>
                                      </div>
                                    </div>
                                    <span style={{
                                      fontSize: '0.68rem',
                                      fontWeight: 700,
                                      fontFamily: 'var(--font-dm-mono), monospace',
                                      color: '#b91c1c',
                                      backgroundColor: '#fee2e2',
                                      padding: '0.2rem 0.6rem',
                                      borderRadius: '6px',
                                      textTransform: 'uppercase'
                                    }}>
                                      REVOKED
                                    </span>
                                  </div>
                                ) : (
                                  <div style={{
                                    backgroundColor: '#fafbf9',
                                    border: '1px solid #eef1ec',
                                    borderRadius: '10px',
                                    padding: '0.85rem 1.15rem'
                                  }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
                                      <div style={{ position: 'absolute', top: '7px', left: '14px', right: '14px', height: '2px', backgroundColor: '#e2e7dc', zIndex: 1 }} />
                                      <div style={{
                                        position: 'absolute',
                                        top: '7px',
                                        left: '14px',
                                        width: isDelivered ? 'calc(100% - 28px)' : isDispatched ? '66.6%' : isCrafting ? '33.3%' : '0%',
                                        height: '2px',
                                        backgroundColor: '#0f0f0f',
                                        zIndex: 2,
                                        transition: 'width 0.4s ease'
                                      }} />

                                      {[
                                        { step: 'Placed', active: isPlaced },
                                        { step: 'Atelier', active: isCrafting },
                                        { step: 'Dispatched', active: isDispatched },
                                        { step: 'Delivered', active: isDelivered },
                                      ].map((m, idx) => (
                                        <div key={idx} style={{ position: 'relative', zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                          <div style={{
                                            width: '12px',
                                            height: '12px',
                                            minWidth: '12px',
                                            minHeight: '12px',
                                            borderRadius: '8px',
                                            backgroundColor: m.active ? '#0f0f0f' : '#ffffff',
                                            border: m.active ? '2px solid #0f0f0f' : '2px solid #d7dbd2',
                                            transition: 'all 0.2s',
                                            flexShrink: 0
                                          }} />
                                          <span style={{
                                            fontSize: '0.64rem',
                                            color: m.active ? '#0f0f0f !important' : '#9ca3af !important',
                                            fontWeight: m.active ? 700 : 500,
                                            marginTop: '0.35rem',
                                            fontFamily: 'var(--font-dm-mono), monospace !important',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.04em'
                                          }}>
                                            {m.step}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* 3.1 Active Reverse Logistics Tracking Card (Uses Same Order Tracking ID) */}
                                {order.returnRequest && (
                                  <div style={{
                                    backgroundColor: '#faf5ff',
                                    border: '1px solid #e9d5ff',
                                    borderRadius: '10px',
                                    padding: '0.85rem 1.15rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    flexWrap: 'wrap',
                                    gap: '0.65rem'
                                  }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                                      <RotateCcw style={{ width: '16px', height: '16px', color: '#7e22ce', flexShrink: 0 }} />
                                      <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                                          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#6b21a8', fontFamily: 'var(--font-dm-mono), monospace', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                            {order.returnRequest.requestType === 'exchange' ? 'SIZE EXCHANGE IN PROGRESS' : 'RETURN & REFUND IN PROGRESS'}
                                          </span>
                                          <span style={{ fontSize: '0.66rem', fontFamily: 'var(--font-dm-mono), monospace', color: '#581c87', fontWeight: 700, backgroundColor: '#f3e8ff', padding: '0.1rem 0.45rem', borderRadius: '4px' }}>
                                            TRACKING ID: {orderId}
                                          </span>
                                        </div>
                                        <div style={{ fontSize: '0.72rem', color: '#7e22ce', marginTop: '0.15rem', fontFamily: 'var(--font-host-grotesk), sans-serif' }}>
                                          {order.returnRequest.status === 'pending_review' && 'Reverse request registered in Vault • Quality curators reviewing.'}
                                          {order.returnRequest.status === 'approved' && 'Reverse request approved • Doorstep courier pickup scheduled.'}
                                          {order.returnRequest.status === 'pickup_scheduled' && `Doorstep pickup active ${order.returnRequest.courierAwb ? `(Reverse AWB: ${order.returnRequest.courierAwb})` : ''}.`}
                                          {order.returnRequest.status === 'received' && 'Arrived at Atelier • QA inspection in progress.'}
                                          {order.returnRequest.status === 'refunded' && (order.returnRequest.requestType === 'exchange' ? 'Replacement Size Dispatched.' : `Refund of ₹${order.returnRequest.refundAmount} Settled.`)}
                                          {order.returnRequest.status === 'rejected' && `Declined: ${order.returnRequest.rejectionReason || 'Item did not meet return policy.'}`}
                                        </div>
                                      </div>
                                    </div>
                                    <span style={{
                                      fontSize: '0.68rem',
                                      fontWeight: 700,
                                      fontFamily: 'var(--font-dm-mono), monospace',
                                      color: '#6b21a8',
                                      backgroundColor: '#f3e8ff',
                                      padding: '0.2rem 0.6rem',
                                      borderRadius: '6px',
                                      textTransform: 'uppercase'
                                    }}>
                                      {order.returnRequest.status.replace('_', ' ')}
                                    </span>
                                  </div>
                                )}

                                {/* 4. Action Row */}
                                <div style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  flexWrap: 'wrap',
                                  gap: '0.75rem',
                                  paddingTop: '0.35rem'
                                }}>
                                  {st === 'CANCELLED' ? (
                                    <div style={{ fontSize: '0.74rem', color: '#b91c1c', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                      <Ban style={{ width: '14px', height: '14px', color: '#b91c1c', flexShrink: 0 }} />
                                      <span style={{ color: '#b91c1c !important', fontSize: '0.74rem', fontFamily: 'var(--font-dm-mono), monospace', whiteSpace: 'nowrap' }}>
                                        Consignment Cancelled &amp; Voided
                                      </span>
                                    </div>
                                  ) : (
                                    <div style={{ fontSize: '0.74rem', color: '#7d807a', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7d807a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '15px', height: '15px', minWidth: '15px', minHeight: '15px', flexShrink: 0 }}>
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <polyline points="12 6 12 12 16 14"></polyline>
                                      </svg>
                                      <span style={{ color: '#7d807a !important', fontSize: '0.74rem', fontFamily: 'var(--font-dm-mono), monospace', whiteSpace: 'nowrap' }}>
                                        Estimated Dispatch: 24 - 48 Hours
                                      </span>
                                    </div>
                                  )}

                                  <div className="profile-order-btn-group" style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
                                    <button
                                      type="button"
                                      onClick={() => setExpandedOrderId(isExpanded ? null : (order._id || order.orderId))}
                                      style={{
                                        backgroundColor: '#ffffff',
                                        border: '1px solid #d7dbd2',
                                        color: '#0f0f0f',
                                        borderRadius: '6px',
                                        padding: '0.42rem 0.85rem',
                                        fontSize: '0.74rem',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.35rem'
                                      }}
                                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#edf1e8')}
                                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                                    >
                                      <span>{isExpanded ? 'Hide Details' : 'View Details'}</span>
                                      <span style={{ fontSize: '0.7rem' }}>{isExpanded ? '▲' : '▼'}</span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => router.push(`/track?ref=${orderId}`)}
                                      style={{
                                        backgroundColor: '#0f0f0f',
                                        border: 'none',
                                        color: '#ffffff',
                                        borderRadius: '6px',
                                        padding: '0.42rem 0.95rem',
                                        fontSize: '0.74rem',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.4rem',
                                        transition: 'background-color 0.15s ease',
                                        boxShadow: '0 2px 8px rgba(15,15,15,0.12)'
                                      }}
                                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#262626')}
                                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0f0f0f')}
                                    >
                                      <span style={{ color: '#ffffff', fontWeight: 500, fontFamily: 'var(--font-dm-mono), monospace', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Track Shipment</span>
                                      <span style={{ color: '#ffffff', fontSize: '0.85rem' }}>→</span>
                                    </button>

                                    {/* 1. Pre-Dispatch Atelier: Cancel Order */}
                                    {isCancellable && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setCancelTargetOrder(order);
                                          setIsCancelModalOpen(true);
                                        }}
                                        title="Revoke shipment & get 100% refund before courier dispatch"
                                        style={{
                                          backgroundColor: '#ffffff',
                                          border: '1px solid #fecaca',
                                          color: '#b91c1c',
                                          borderRadius: '6px',
                                          padding: '0.42rem 0.95rem',
                                          fontSize: '0.74rem',
                                          fontWeight: 500,
                                          cursor: 'pointer',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '0.4rem',
                                          fontFamily: 'var(--font-dm-mono), monospace',
                                          textTransform: 'uppercase',
                                          letterSpacing: '0.04em',
                                          fontSynthesis: 'none',
                                          WebkitFontSmoothing: 'antialiased',
                                          transition: 'all 0.15s ease',
                                          boxShadow: '0 2px 8px rgba(239, 68, 68, 0.08)'
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.backgroundColor = '#b91c1c';
                                          e.currentTarget.style.color = '#ffffff';
                                          e.currentTarget.style.borderColor = '#b91c1c';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.backgroundColor = '#ffffff';
                                          e.currentTarget.style.color = '#b91c1c';
                                          e.currentTarget.style.borderColor = '#fecaca';
                                        }}
                                      >
                                        <Ban style={{ width: '13px', height: '13px' }} />
                                        <span>Cancel Order</span>
                                      </button>
                                    )}

                                    {/* 2. In Transit Notice: Handed to Courier (Cannot cancel, return opens on delivery) */}
                                    {isInTransit && (
                                      <span
                                        title="Consignment in transit with 3PL courier. Doorstep return/exchange unlocks upon delivery."
                                        style={{
                                          fontSize: '0.7rem',
                                          color: '#555852',
                                          backgroundColor: '#f4f6f2',
                                          border: '1px solid #e2e7dc',
                                          borderRadius: '6px',
                                          padding: '0.4rem 0.75rem',
                                          fontFamily: 'var(--font-dm-mono), monospace',
                                          textTransform: 'uppercase',
                                          letterSpacing: '0.04em',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '0.4rem',
                                          whiteSpace: 'nowrap'
                                        }}
                                      >
                                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#0f0f0f' }} />
                                        <span>In Transit • Return unlocks upon delivery</span>
                                      </span>
                                    )}

                                    {/* 3. Delivered: Return & Exchange Window Active (Within 14 Days) OR Return In Progress */}
                                    {order.returnRequest ? (
                                      <button
                                        type="button"
                                        onClick={() => router.push(`/track?ref=${orderId}`)}
                                        title="Track live reverse logistics progress with unified tracking ID"
                                        style={{
                                          backgroundColor: '#faf5ff',
                                          border: '1px solid #c084fc',
                                          color: '#6b21a8',
                                          borderRadius: '6px',
                                          padding: '0.42rem 0.95rem',
                                          fontSize: '0.74rem',
                                          fontWeight: 500,
                                          fontFamily: 'var(--font-dm-mono), monospace',
                                          cursor: 'pointer',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '0.45rem',
                                          textTransform: 'uppercase',
                                          letterSpacing: '0.04em',
                                          fontSynthesis: 'none',
                                          WebkitFontSmoothing: 'antialiased',
                                          transition: 'all 0.15s ease',
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.backgroundColor = '#6b21a8';
                                          e.currentTarget.style.color = '#ffffff';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.backgroundColor = '#faf5ff';
                                          e.currentTarget.style.color = '#6b21a8';
                                        }}
                                      >
                                        <RotateCcw style={{ width: '13px', height: '13px' }} />
                                        <span>Track Return ({order.returnRequest.status.replace('_', ' ')})</span>
                                      </button>
                                    ) : isReturnWindowActive ? (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setReturnOrder(order);
                                          setIsReturnModalOpen(true);
                                        }}
                                        title={`Request doorstep size exchange or escrow refund (${returnDaysRemaining} days remaining)`}
                                        style={{
                                          backgroundColor: '#0f0f0f',
                                          border: '1px solid #0f0f0f',
                                          color: '#edf1e8',
                                          borderRadius: '6px',
                                          padding: '0.42rem 0.95rem',
                                          fontSize: '0.74rem',
                                          fontWeight: 500,
                                          cursor: 'pointer',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: '0.45rem',
                                          fontFamily: 'var(--font-dm-mono), monospace',
                                          textTransform: 'uppercase',
                                          letterSpacing: '0.04em',
                                          fontSynthesis: 'none',
                                          WebkitFontSmoothing: 'antialiased',
                                          transition: 'all 0.15s ease',
                                          boxShadow: '0 2px 8px rgba(15,15,15,0.15)'
                                        }}
                                        onMouseEnter={(e) => {
                                          e.currentTarget.style.backgroundColor = '#262626';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.currentTarget.style.backgroundColor = '#0f0f0f';
                                        }}
                                      >
                                        <RotateCcw style={{ width: '13px', height: '13px' }} />
                                        <span>Return / Exchange ({returnDaysRemaining}d)</span>
                                      </button>
                                    ) : null}

                                    {/* 4. Delivered: Window Expired (> 14 Days) */}
                                    {isReturnExpired && (
                                      <span
                                        style={{
                                          fontSize: '0.68rem',
                                          color: '#7d807a',
                                          backgroundColor: '#f4f6f2',
                                          border: '1px solid #e2e7dc',
                                          borderRadius: '6px',
                                          padding: '0.4rem 0.7rem',
                                          fontFamily: 'var(--font-dm-mono), monospace',
                                          textTransform: 'uppercase',
                                          letterSpacing: '0.04em'
                                        }}
                                      >
                                        Return Policy Expired
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* 5. Expanded Drawer Details */}
                                {isExpanded && (
                                  <div
                                    className="profile-order-details-grid"
                                    style={{
                                      marginTop: '0.65rem',
                                      padding: '1rem',
                                      backgroundColor: '#f7f9f5',
                                      borderRadius: '8px',
                                      border: '1px solid #e2e7dc',
                                      fontSize: '0.76rem',
                                      display: 'grid',
                                      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                                      gap: '1rem'
                                    }}
                                  >
                                    <div>
                                      <div style={{ fontWeight: 700, color: '#0f0f0f', marginBottom: '0.25rem', fontFamily: 'var(--font-dm-mono), monospace' }}>
                                        DELIVERY DESTINATION
                                      </div>
                                      <div style={{ color: '#555852', lineHeight: '1.45' }}>
                                        {order.address?.line1 || 'Atelier Standard Address'}
                                        {order.address?.city ? `, ${order.address.city}` : ''}
                                        {order.address?.state ? `, ${order.address.state}` : ''}
                                        {order.address?.pincode ? ` - ${order.address.pincode}` : ''}
                                      </div>
                                    </div>

                                    <div>
                                      <div style={{ fontWeight: 700, color: '#0f0f0f', marginBottom: '0.25rem', fontFamily: 'var(--font-dm-mono), monospace' }}>
                                        TRACKING IDENTIFIER
                                      </div>
                                      <div style={{ color: '#555852', fontFamily: 'var(--font-dm-mono), monospace' }}>
                                        {trackingRef}
                                      </div>
                                      <div style={{ marginTop: '0.35rem', color: '#7d807a', fontSize: '0.72rem' }}>
                                        Dispatched via DRAPZA Logistics Priority Express
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div style={{
                          textAlign: 'center',
                          padding: '3.5rem 1.5rem',
                          border: '1.5px dashed #d7dbd2',
                          borderRadius: '12px',
                          backgroundColor: '#fafbf9'
                        }}>
                          <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '50%',
                            backgroundColor: '#edf1e8',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1rem auto'
                          }}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#7d807a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '22px', height: '22px', minWidth: '22px', minHeight: '22px', flexShrink: 0 }}>
                              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                            </svg>
                          </div>
                          <h4 style={{ margin: '0 0 0.4rem 0', color: '#0f0f0f', fontSize: '1rem', fontWeight: 700 }}>
                            No Orders In This View
                          </h4>
                          <p style={{ color: '#7d807a', fontSize: '0.78rem', marginBottom: '1.25rem', maxWidth: '360px', margin: '0 auto 1.25rem auto' }}>
                            {orderFilter !== 'ALL'
                              ? `You have no ${orderFilter.toLowerCase()} orders at present.`
                              : 'Your wardrobe journey begins with the new seasonal DRAPZA collection.'}
                          </p>
                          {orderFilter !== 'ALL' ? (
                            <button
                              type="button"
                              onClick={() => setOrderFilter('ALL')}
                              style={{
                                backgroundColor: '#0f0f0f',
                                color: '#ffffff !important',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '0.62rem 1.4rem',
                                fontSize: '0.78rem',
                                fontWeight: 700,
                                fontFamily: 'var(--font-dm-mono), monospace',
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                                cursor: 'pointer'
                              }}
                            >
                              <span style={{ color: '#ffffff !important' }}>View All Orders</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => router.push('/wardrobe')}
                              style={{
                                backgroundColor: '#0f0f0f',
                                color: '#ffffff !important',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '0.65rem 1.5rem',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                fontFamily: 'var(--font-dm-mono), monospace',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                cursor: 'pointer',
                                transition: 'background-color 0.15s ease',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#262626')}
                              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0f0f0f')}
                            >
                              <span style={{ color: '#ffffff !important' }}>Shop Collection</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* TAB: Addresses */}
                {activeTab === 'addresses' && (
                  <div>
                    <div className="profile-tab-header">
                      <div>
                        <h1 style={{ margin: 0, fontSize: '2.1rem', color: '#0f0f0f', fontFamily: 'var(--font-koulen), sans-serif', textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1.1 }}>
                          DELIVERY ADDRESSES
                        </h1>
                        <p style={{ margin: '0.25rem 0 0 0', color: '#7d807a', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: 'var(--font-dm-mono), monospace' }}>
                          MANAGE ADDRESSES FOR EXPEDITED CHECKOUT AND SHIPMENT DISPATCH.
                        </p>
                      </div>
                      <button
                        onClick={() => setShowAddressModal(true)}
                        style={{
                          backgroundColor: '#0f0f0f',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '0.68rem 1.4rem',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          fontFamily: 'var(--font-dm-mono), monospace',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          cursor: 'pointer',
                          transition: 'background-color 0.15s ease',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#262626')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0f0f0f')}
                      >
                        + ADD NEW ADDRESS
                      </button>
                    </div>

                    {isAddressesLoading ? (
                      <AddressesSkeleton count={3} />
                    ) : addressesData && addressesData.addresses && addressesData.addresses.length > 0 ? (
                      <div className="profile-addresses-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
                        {addressesData.addresses.map((addr) => (
                          <div
                            key={addr._id}
                            style={{
                              border: addr.isDefault ? '2px solid #0f0f0f' : '1px solid #d7dbd2',
                              borderRadius: '8px',
                              padding: '1.25rem',
                              backgroundColor: '#ffffff',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                              <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0f0f0f', fontFamily: 'var(--font-dm-mono), monospace', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                                {addr.firstName} {addr.lastName}
                              </span>
                              {addr.isDefault && (
                                <span style={{ backgroundColor: '#0f0f0f', color: '#edf1e8', fontSize: '0.62rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '8px', fontFamily: 'var(--font-dm-mono), monospace', letterSpacing: '0.06em' }}>
                                  DEFAULT
                                </span>
                              )}
                            </div>
                            <p style={{ color: '#7d807a', fontSize: '0.78rem', lineHeight: '1.45', margin: '0 0 0.4rem 0', fontFamily: 'var(--font-host-grotesk), sans-serif' }}>
                              {addr.address}<br />
                              {addr.city}, {addr.state} - {addr.pincode}
                            </p>
                            <div style={{ display: 'flex', gap: '0.85rem', marginTop: '0.85rem', paddingTop: '0.65rem', borderTop: '1px solid #edf1e8' }}>
                              {!addr.isDefault && (
                                <button
                                  onClick={() => setDefaultAddress(addr._id)}
                                  style={{ border: 'none', background: 'transparent', color: '#0f0f0f', fontSize: '0.74rem', fontWeight: 700, fontFamily: 'var(--font-dm-mono), monospace', textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer', textDecoration: 'underline' }}
                                >
                                  Set Default
                                </button>
                              )}
                              <button
                                onClick={() => deleteAddress(addr._id)}
                                style={{ border: 'none', background: 'transparent', color: '#ef4444', fontSize: '0.74rem', fontWeight: 700, fontFamily: 'var(--font-dm-mono), monospace', textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer' }}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '2.5rem 1.5rem', border: '1.5px dashed #d7dbd2', borderRadius: '12px', backgroundColor: '#f7f9f5' }}>
                        <p style={{ color: '#7d807a', fontSize: '0.82rem', marginBottom: '1rem', fontFamily: 'var(--font-dm-mono), monospace' }}>NO SAVED ADDRESSES YET.</p>
                        <button
                          onClick={() => setShowAddressModal(true)}
                          style={{
                            backgroundColor: '#0f0f0f',
                            color: '#edf1e8',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '0.65rem 1.4rem',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            fontFamily: 'var(--font-dm-mono), monospace',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            cursor: 'pointer',
                            transition: 'background-color 0.15s ease',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#262626')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0f0f0f')}
                        >
                          Add Address
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB: Wishlist */}
                {activeTab === 'wishlist' && (
                  <div>
                    <div className="profile-tab-header">
                      <div>
                        <h1 style={{ margin: 0, fontSize: '2.1rem', color: '#0f0f0f', fontFamily: 'var(--font-koulen), sans-serif', textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1.1 }}>
                          SAVED GARMENTS ({wishlistItems.length})
                        </h1>
                        <p style={{ margin: '0.25rem 0 0 0', color: '#7d807a', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: 'var(--font-dm-mono), monospace' }}>
                          CURATED ARCHIVE OF PIECES MARKED FOR ACQUISITION.
                        </p>
                      </div>
                    </div>

                    {wishlistItems.length > 0 ? (
                      <div
                        className="profile-wishlist-grid"
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
                          gap: '1.25rem',
                          alignItems: 'stretch',
                        }}
                      >
                        {wishlistItems.map((prod, idx) => {
                          const slug =
                            prod.slug ||
                            prod.name
                              .toLowerCase()
                              .replace(/\s+/g, '-')
                              .replace(/[^a-z0-9-]/g, '');
                          const imgUrl =
                            (prod.images && prod.images[0]) ||
                            prod.image_url ||
                            prod.image ||
                            `/products/product_${prod.local_index || idx + 1}.png`;
                          const price = prod.price || 1200;

                          return (
                            <ProductCard
                              key={prod._id || prod.name || idx}
                              id={prod._id || prod.id}
                              name={prod.name}
                              price={price}
                              imageUrl={imgUrl}
                              slug={slug}
                              className="h-full"
                              product={prod}
                              isWishlisted={true}
                              onToggleWishlist={() => removeFromWishlist(prod.name)}
                              discountTagActive={prod.discountTagActive}
                              discountPercentage={prod.discountPercentage}
                              discountPrice={prod.discountPrice}
                              offerTag={prod.offerTag}
                              originalPrice={prod.numericPrice || prod.price}
                              onNavigate={(path) => router.push(path)}
                              onAddToCart={() => handleMoveWishlistToCart(prod)}
                              buttonLabel="ADD TO CART"
                            />
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem', border: '1.5px dashed #d7dbd2', borderRadius: '12px', backgroundColor: '#f7f9f5' }}>
                        <div style={{ display: 'inline-flex', padding: '0.85rem', borderRadius: '8px', backgroundColor: '#edf1e8', marginBottom: '1rem', border: '1px solid #d7dbd2' }}>
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7d807a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: '28px', height: '28px', minWidth: '28px', minHeight: '28px', flexShrink: 0 }}>
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                          </svg>
                        </div>
                        <h3 style={{ margin: '0 0 0.35rem 0', fontSize: '1.25rem', color: '#0f0f0f', fontFamily: 'var(--font-koulen), sans-serif', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                          YOUR WISHLIST IS EMPTY
                        </h3>
                        <p style={{ color: '#7d807a', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 1.25rem 0', fontFamily: 'var(--font-host-grotesk), sans-serif' }}>
                          Discover atelier silhouettes and mark your favorite pieces.
                        </p>
                        <button
                          type="button"
                          onClick={() => router.push('/')}
                          style={{
                            backgroundColor: '#0f0f0f',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '0.65rem 1.4rem',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            fontFamily: 'var(--font-dm-mono), monospace',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            cursor: 'pointer',
                          }}
                        >
                          Explore Catalogue
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB: Cart */}
                {activeTab === 'cart' && (
                  <div>
                    <div className="profile-tab-header">
                      <div>
                        <h1 style={{ margin: 0, fontSize: '2.1rem', color: '#0f0f0f', fontFamily: 'var(--font-koulen), sans-serif', textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1.1 }}>
                          SHOPPING BAG ({totalCount} {totalCount === 1 ? 'ITEM' : 'ITEMS'})
                        </h1>
                        <p style={{ margin: '0.25rem 0 0 0', color: '#7d807a', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: 'var(--font-dm-mono), monospace' }}>
                          ITEMS CURRENTLY RESERVED IN YOUR SESSION CHECKOUT.
                        </p>
                      </div>
                      {cartItems.length > 0 && (
                        <button
                          type="button"
                          onClick={() => router.push('/checkout')}
                          style={{
                            backgroundColor: '#0f0f0f',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '0.68rem 1.4rem',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            fontFamily: 'var(--font-dm-mono), monospace',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            cursor: 'pointer',
                          }}
                        >
                          PROCEED TO CHECKOUT →
                        </button>
                      )}
                    </div>

                    {cartItems.length > 0 ? (
                      <div className="profile-cart-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(260px, 1.1fr)', gap: '1.5rem', alignItems: 'start' }}>
                        {/* Left: Cart Items List */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                          {cartItems.map((item, idx) => (
                            <div
                              key={item.id || item._id || `${item.name}-${idx}`}
                              className="profile-cart-item"
                              style={{
                                display: 'flex',
                                gap: '1.15rem',
                                padding: '1rem',
                                border: '1px solid #d7dbd2',
                                borderRadius: '8px',
                                backgroundColor: '#ffffff',
                                alignItems: 'center',
                              }}
                            >
                              <div
                                style={{
                                  width: '84px',
                                  height: '96px',
                                  backgroundColor: '#f0f3eb',
                                  border: '1px solid #d7dbd2',
                                  borderRadius: '8px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  padding: '0.45rem',
                                  flexShrink: 0,
                                  overflow: 'hidden',
                                }}
                              >
                                <img
                                  src={item.image_url || item.image || (item.name?.toLowerCase().includes('phase') ? '/products/product_2.png' : '/products/product_1.png')}
                                  alt={item.name}
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'contain',
                                    display: 'block',
                                  }}
                                />
                              </div>
                              <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.3rem' }}>
                                <h3 style={{ margin: 0, fontSize: '1.08rem', color: '#0f0f0f', fontFamily: 'var(--font-koulen), sans-serif', letterSpacing: '0.03em', textTransform: 'uppercase', lineHeight: 1.15 }}>
                                  {item.name}
                                </h3>
                                <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.74rem', color: '#7d807a', fontFamily: 'var(--font-dm-mono), monospace' }}>
                                  <span>SIZE: <strong style={{ color: '#0f0f0f' }}>{item.selectedSize || item.size || 'M'}</strong></span>
                                  {item.color && <span>COLOR: <strong style={{ color: '#0f0f0f' }}>{item.color}</strong></span>}
                                </div>
                                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0f0f0f', fontFamily: 'var(--font-dm-mono), monospace', marginTop: '0.15rem' }}>
                                  ₹{item.price}
                                </div>
                              </div>

                              {/* Quantity Controls */}
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.65rem' }}>
                                <div style={{ display: 'inline-flex', alignItems: 'center', border: '1px solid #d7dbd2', borderRadius: '8px', backgroundColor: '#f7f9f5' }}>
                                  <button
                                    type="button"
                                    onClick={() => updateQuantity(item.name, -1)}
                                    style={{
                                      width: '26px',
                                      height: '26px',
                                      border: 'none',
                                      background: 'transparent',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '0.9rem',
                                      fontWeight: 700,
                                      color: '#0f0f0f',
                                    }}
                                  >
                                    -
                                  </button>
                                  <span style={{ minWidth: '22px', textAlign: 'center', fontSize: '0.76rem', fontWeight: 700, fontFamily: 'var(--font-dm-mono), monospace' }}>
                                    {item.quantity || 1}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => updateQuantity(item.name, 1)}
                                    style={{
                                      width: '26px',
                                      height: '26px',
                                      border: 'none',
                                      background: 'transparent',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '0.9rem',
                                      fontWeight: 700,
                                      color: '#0f0f0f',
                                    }}
                                  >
                                    +
                                  </button>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => removeFromCart(item.name)}
                                  style={{
                                    border: 'none',
                                    background: 'transparent',
                                    color: '#ef4444',
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    fontFamily: 'var(--font-dm-mono), monospace',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.04em',
                                    cursor: 'pointer',
                                    padding: 0,
                                  }}
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Right: Order Summary */}
                        <div
                          style={{
                            border: '1px solid #d7dbd2',
                            borderRadius: '8px',
                            padding: '1.35rem',
                            backgroundColor: '#ffffff',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem',
                          }}
                        >
                          <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f0f0f', fontFamily: 'var(--font-koulen), sans-serif', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                            BAG SUMMARY
                          </h3>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', borderBottom: '1px solid #edf1e8', paddingBottom: '0.85rem', fontSize: '0.78rem', fontFamily: 'var(--font-dm-mono), monospace' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#7d807a' }}>
                              <span>Total Items</span>
                              <span style={{ color: '#0f0f0f', fontWeight: 600 }}>{totalCount}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#7d807a' }}>
                              <span>Subtotal</span>
                              <span style={{ color: '#0f0f0f', fontWeight: 600 }}>₹{subtotal}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#7d807a' }}>
                              <span>Atelier Dispatch</span>
                              <span style={{ color: '#166534', fontWeight: 600 }}>FREE</span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.95rem', fontFamily: 'var(--font-dm-mono), monospace' }}>
                            <span style={{ fontWeight: 700, color: '#0f0f0f' }}>ESTIMATED TOTAL</span>
                            <span style={{ fontWeight: 800, fontSize: '1.15rem', color: '#0f0f0f' }}>₹{subtotal}</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => router.push('/checkout')}
                            style={{
                              width: '100%',
                              backgroundColor: '#0f0f0f',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '0.85rem 1rem',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              fontFamily: 'var(--font-dm-mono), monospace',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                              cursor: 'pointer',
                              transition: 'background-color 0.15s ease',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#262626')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0f0f0f')}
                          >
                            Checkout Now
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem', border: '1.5px dashed #d7dbd2', borderRadius: '12px', backgroundColor: '#f7f9f5' }}>
                        <div style={{ display: 'inline-flex', padding: '0.85rem', borderRadius: '8px', backgroundColor: '#edf1e8', marginBottom: '1rem', border: '1px solid #d7dbd2' }}>
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#7d807a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: '28px', height: '28px', minWidth: '28px', minHeight: '28px', flexShrink: 0 }}>
                            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                            <line x1="3" y1="6" x2="21" y2="6"></line>
                            <path d="M16 10a4 4 0 0 1-8 0"></path>
                          </svg>
                        </div>
                        <h3 style={{ margin: '0 0 0.35rem 0', fontSize: '1.25rem', color: '#0f0f0f', fontFamily: 'var(--font-koulen), sans-serif', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                          YOUR CART IS CURRENTLY EMPTY
                        </h3>
                        <p style={{ color: '#7d807a', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 1.25rem 0', fontFamily: 'var(--font-host-grotesk), sans-serif' }}>
                          Browse our latest collection to add items to your cart.
                        </p>
                        <button
                          type="button"
                          onClick={() => router.push('/')}
                          style={{
                            backgroundColor: '#0f0f0f',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '0.65rem 1.4rem',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            fontFamily: 'var(--font-dm-mono), monospace',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            cursor: 'pointer',
                          }}
                        >
                          Browse Atelier
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* TAB: Contact Preferences & Security */}
                {activeTab === 'preferences' && (
                  <div>
                    <div className="profile-tab-header">
                      <div>
                        <h1 style={{ margin: 0, fontSize: '2.1rem', color: '#0f0f0f', fontFamily: 'var(--font-koulen), sans-serif', textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1.1 }}>
                          SECURITY & PASSWORD
                        </h1>
                        <p style={{ margin: '0.25rem 0 0 0', color: '#7d807a', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: 'var(--font-dm-mono), monospace' }}>
                          CHANGE YOUR PASSWORD CREDENTIALS AND MANAGE SESSION SECURITY.
                        </p>
                      </div>
                    </div>

                    {pwdMsg.text && (
                      <div style={{
                        backgroundColor: pwdMsg.type === 'success' ? '#f0fdf4' : '#fef2f2',
                        border: `1px solid ${pwdMsg.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
                        color: pwdMsg.type === 'success' ? '#166534' : '#991b1b',
                        padding: '0.75rem 1.15rem',
                        borderRadius: '8px',
                        fontSize: '0.8rem',
                        marginBottom: '1.25rem',
                        maxWidth: '520px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontFamily: 'var(--font-dm-mono), monospace'
                      }}>
                        <span>{pwdMsg.type === 'success' ? '✓' : '⚠'}</span>
                        <span>{pwdMsg.text}</span>
                      </div>
                    )}

                    <div
                      className="profile-security-card"
                      style={{
                        backgroundColor: '#ffffff',
                        border: '1px solid #d7dbd2',
                        borderRadius: '8px',
                        padding: '1.85rem 2rem',
                        maxWidth: '520px',
                        boxShadow: '0 4px 16px -4px rgba(15, 15, 15, 0.04)'
                      }}
                    >
                      <form onSubmit={handlePasswordSubmit} noValidate>
                        {/* Current Password Field */}
                        <div style={{ marginBottom: '1.25rem' }}>
                          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem', fontWeight: 700, color: '#0f0f0f', marginBottom: '0.45rem', fontFamily: 'var(--font-dm-mono), monospace', letterSpacing: '0.04em' }}>
                            <span>CURRENT PASSWORD</span>
                          </label>
                          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <input
                              type={showCurrentPwd ? 'text' : 'password'}
                              placeholder="••••••••••••"
                              value={currentPassword}
                              onChange={(e) => {
                                setCurrentPassword(e.target.value);
                                if (passwordFieldErrors.currentPassword) setPasswordFieldErrors((prev) => ({ ...prev, currentPassword: '' }));
                              }}
                              style={{
                                width: '100%',
                                padding: '0.72rem 2.75rem 0.72rem 0.85rem',
                                border: passwordFieldErrors.currentPassword ? '1.5px solid #ef4444' : '1.5px solid #d7dbd2',
                                borderRadius: '8px',
                                fontSize: '0.86rem',
                                color: '#0f0f0f',
                                backgroundColor: '#ffffff',
                                outline: 'none',
                                fontFamily: 'var(--font-dm-mono), monospace',
                                transition: 'border-color 0.15s'
                              }}
                              onFocus={(e) => (e.currentTarget.style.borderColor = passwordFieldErrors.currentPassword ? '#ef4444' : '#0f0f0f')}
                              onBlur={(e) => (e.currentTarget.style.borderColor = passwordFieldErrors.currentPassword ? '#ef4444' : '#d7dbd2')}
                            />
                            <button
                              type="button"
                              onClick={() => setShowCurrentPwd(!showCurrentPwd)}
                              title={showCurrentPwd ? 'Hide password' : 'Show password'}
                              style={{
                                position: 'absolute',
                                right: '10px',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#7d807a',
                                display: 'flex',
                                alignItems: 'center',
                                padding: '4px'
                              }}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px', flexShrink: 0, display: 'block' }}>
                                {showCurrentPwd ? (
                                  <>
                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                    <line x1="1" y1="1" x2="23" y2="23"></line>
                                  </>
                                ) : (
                                  <>
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                  </>
                                )}
                              </svg>
                            </button>
                          </div>
                          {passwordFieldErrors.currentPassword && (
                            <span style={{ color: '#ef4444', fontSize: '0.68rem', fontFamily: 'var(--font-dm-mono), monospace', marginTop: '0.2rem', fontWeight: 500, display: 'block' }}>
                              {passwordFieldErrors.currentPassword}
                            </span>
                          )}
                        </div>

                        {/* New Password Field */}
                        <div style={{ marginBottom: '1.25rem' }}>
                          <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.74rem', fontWeight: 700, color: '#0f0f0f', marginBottom: '0.45rem', fontFamily: 'var(--font-dm-mono), monospace', letterSpacing: '0.04em' }}>
                            <span>NEW PASSWORD</span>
                            <span style={{ fontSize: '0.64rem', color: '#7d807a', fontWeight: 500 }}>MIN 6 CHARACTERS</span>
                          </label>
                          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <input
                              type={showNewPwd ? 'text' : 'password'}
                              placeholder="••••••••••••"
                              value={newPassword}
                              onChange={(e) => {
                                setNewPassword(e.target.value);
                                if (passwordFieldErrors.newPassword) setPasswordFieldErrors((prev) => ({ ...prev, newPassword: '' }));
                              }}
                              style={{
                                width: '100%',
                                padding: '0.72rem 2.75rem 0.72rem 0.85rem',
                                border: passwordFieldErrors.newPassword ? '1.5px solid #ef4444' : '1.5px solid #d7dbd2',
                                borderRadius: '8px',
                                fontSize: '0.86rem',
                                color: '#0f0f0f',
                                backgroundColor: '#ffffff',
                                outline: 'none',
                                fontFamily: 'var(--font-dm-mono), monospace',
                                transition: 'border-color 0.15s'
                              }}
                              onFocus={(e) => (e.currentTarget.style.borderColor = passwordFieldErrors.newPassword ? '#ef4444' : '#0f0f0f')}
                              onBlur={(e) => (e.currentTarget.style.borderColor = passwordFieldErrors.newPassword ? '#ef4444' : '#d7dbd2')}
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPwd(!showNewPwd)}
                              title={showNewPwd ? 'Hide password' : 'Show password'}
                              style={{
                                position: 'absolute',
                                right: '10px',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#7d807a',
                                display: 'flex',
                                alignItems: 'center',
                                padding: '4px'
                              }}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px', flexShrink: 0, display: 'block' }}>
                                {showNewPwd ? (
                                  <>
                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                    <line x1="1" y1="1" x2="23" y2="23"></line>
                                  </>
                                ) : (
                                  <>
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                  </>
                                )}
                              </svg>
                            </button>
                          </div>
                          {passwordFieldErrors.newPassword && (
                            <span style={{ color: '#ef4444', fontSize: '0.68rem', fontFamily: 'var(--font-dm-mono), monospace', marginTop: '0.2rem', fontWeight: 500, display: 'block' }}>
                              {passwordFieldErrors.newPassword}
                            </span>
                          )}
                        </div>

                        {/* Confirm New Password Field */}
                        <div style={{ marginBottom: '1.5rem' }}>
                          <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#0f0f0f', marginBottom: '0.45rem', fontFamily: 'var(--font-dm-mono), monospace', letterSpacing: '0.04em' }}>
                            <span>CONFIRM NEW PASSWORD</span>
                          </label>
                          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <input
                              type={showConfirmPwd ? 'text' : 'password'}
                              placeholder="••••••••••••"
                              value={confirmPassword}
                              onChange={(e) => {
                                setConfirmPassword(e.target.value);
                                if (passwordFieldErrors.confirmNewPassword) setPasswordFieldErrors((prev) => ({ ...prev, confirmNewPassword: '' }));
                              }}
                              style={{
                                width: '100%',
                                padding: '0.72rem 2.75rem 0.72rem 0.85rem',
                                border: passwordFieldErrors.confirmNewPassword ? '1.5px solid #ef4444' : '1.5px solid #d7dbd2',
                                borderRadius: '8px',
                                fontSize: '0.86rem',
                                color: '#0f0f0f',
                                backgroundColor: '#ffffff',
                                outline: 'none',
                                fontFamily: 'var(--font-dm-mono), monospace',
                                transition: 'border-color 0.15s'
                              }}
                              onFocus={(e) => (e.currentTarget.style.borderColor = passwordFieldErrors.confirmNewPassword ? '#ef4444' : '#0f0f0f')}
                              onBlur={(e) => (e.currentTarget.style.borderColor = passwordFieldErrors.confirmNewPassword ? '#ef4444' : '#d7dbd2')}
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPwd(!showConfirmPwd)}
                              title={showConfirmPwd ? 'Hide password' : 'Show password'}
                              style={{
                                position: 'absolute',
                                right: '10px',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#7d807a',
                                display: 'flex',
                                alignItems: 'center',
                                padding: '4px'
                              }}
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px', flexShrink: 0, display: 'block' }}>
                                {showConfirmPwd ? (
                                  <>
                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                    <line x1="1" y1="1" x2="23" y2="23"></line>
                                  </>
                                ) : (
                                  <>
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                  </>
                                )}
                              </svg>
                            </button>
                          </div>
                          {passwordFieldErrors.confirmNewPassword && (
                            <span style={{ color: '#ef4444', fontSize: '0.68rem', fontFamily: 'var(--font-dm-mono), monospace', marginTop: '0.2rem', fontWeight: 500, display: 'block' }}>
                              {passwordFieldErrors.confirmNewPassword}
                            </span>
                          )}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                          <button
                            type="submit"
                            disabled={isChangingPassword}
                            style={{
                              backgroundColor: '#0f0f0f',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '0.75rem 1.85rem',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              fontFamily: 'var(--font-dm-mono), monospace',
                              letterSpacing: '0.05em',
                              textTransform: 'uppercase',
                              cursor: isChangingPassword ? 'not-allowed' : 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              boxShadow: '0 4px 14px rgba(15, 15, 15, 0.2)',
                              transition: 'all 0.15s ease',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#262626')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0f0f0f')}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '14px', height: '14px', flexShrink: 0, display: 'block' }}>
                              <rect x="3" y="11" width="18" height="11" rx="0" ry="0"></rect>
                              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                            <span>{isChangingPassword ? 'Updating...' : 'Update Password'}</span>
                          </button>

                          <span style={{ fontSize: '0.72rem', color: '#7d807a', fontFamily: 'var(--font-dm-mono), monospace', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            AES-256 Protected
                          </span>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            </main>
          </div>

          {/* =========================================================
          INSTAGRAM-STYLE SLIDE-IN MOBILE SIDEBAR DRAWER
          ========================================================= */}
          {mobileDrawerOpen && (
            <div style={{
              position: 'fixed',
              inset: 0,
              zIndex: 999999,
              display: 'flex',
            }}>
              {/* Dark Backdrop Blur Overlay with Smooth Fade */}
              <div
                onClick={() => setMobileDrawerOpen(false)}
                style={{
                  position: 'fixed',
                  inset: 0,
                  backgroundColor: 'rgba(15, 15, 15, 0.65)',
                  backdropFilter: 'blur(6px)',
                  WebkitBackdropFilter: 'blur(6px)',
                  animation: 'instaBackdropFadeIn 0.25s ease forwards',
                }}
              />

              {/* Instagram Sidebar Drawer Sliding from Left */}
              <aside style={{
                position: 'relative',
                width: '295px',
                maxWidth: '85vw',
                height: '100vh',
                backgroundColor: '#ffffff',
                boxShadow: '14px 0 45px rgba(0, 0, 0, 0.35)',
                display: 'flex',
                flexDirection: 'column',
                zIndex: 1,
                overflowY: 'auto',
                padding: '1.4rem 1.15rem',
                animation: 'instaDrawerSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                willChange: 'transform',
                borderTopRightRadius: '16px',
                borderBottomRightRadius: '16px',
                borderRight: '1px solid var(--base-200, #d7dbd2)',
              }}>
                {/* Drawer Header with Close Button */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.15rem', paddingBottom: '0.85rem', borderBottom: '1px solid #edf1e8' }}>
                  <div style={{ fontFamily: 'var(--font-dm-mono), monospace', fontSize: '1.05rem', fontWeight: 500, letterSpacing: '0.12em', color: '#0f0f0f', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <span>DRAPZA ATELIER</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileDrawerOpen(false)}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      backgroundColor: '#f0f3ec',
                      border: '1px solid #d7dbd2',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1rem',
                      cursor: 'pointer',
                      color: '#0f0f0f',
                      transition: 'background-color 0.15s ease',
                      lineHeight: 1,
                    }}
                  >
                    ✕
                  </button>
                </div>

                {/* User Profile Card in Drawer */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1.25rem', padding: '0.75rem 0.85rem', backgroundColor: '#f7f9f5', borderRadius: '8px', border: '1px solid #d7dbd2' }}>
                  <div style={{ width: '46px', height: '46px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #0f0f0f', flexShrink: 0 }}>
                    <img src="/avatar-sculpture.jpg" alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.src = '/profile-avatar.jpg'; }} />
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f0f0f', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                      {currentUser.name || 'Denis Holland'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#7d807a', fontFamily: 'var(--font-dm-mono), monospace', marginTop: '0.15rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                      {currentUser.email || 'client@drapza.com'}
                    </div>
                  </div>
                </div>

                {/* Drawer Navigation items */}
                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1 }}>
                  {navItems.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setActiveTab(item.id);
                          setMobileDrawerOpen(false);
                        }}
                        className={`profile-insta-item ${isActive ? 'active' : ''}`}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{item.icon}</span>
                          <span>{item.label}</span>
                        </div>
                        {item.badge != null && (
                          <span style={{
                            fontSize: '10px',
                            fontFamily: 'var(--font-dm-mono), monospace',
                            padding: '1px 6px',
                            borderRadius: '9999px',
                            background: isActive ? '#0f0f0f' : '#e6e4dc',
                            color: isActive ? '#ffffff' : '#0f0f0f',
                            fontWeight: 700,
                            lineHeight: 1.3
                          }}>
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>

                {/* Drawer Footer Actions with fixed sized SVGs */}
                <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #edf1e8', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileDrawerOpen(false);
                      logout();
                      router.push('/');
                    }}
                    className="profile-insta-item"
                  >
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '18px', height: '18px', minWidth: '18px', maxWidth: '18px', flexShrink: 0 }}>
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                        <polyline points="16 17 21 12 16 7"></polyline>
                        <line x1="21" y1="12" x2="9" y2="12"></line>
                      </svg>
                    </span>
                    <span>Sign Out</span>
                  </button>
                </div>
              </aside>
            </div>
          )}

          {/* Address Modal */}
          {showAddressModal && (
            <div
              style={{
                position: 'fixed',
                inset: 0,
                backgroundColor: 'rgba(15, 15, 15, 0.65)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                padding: '1.25rem',
              }}
              onClick={(e) => {
                if (e.target === e.currentTarget) setShowAddressModal(false);
              }}
            >
              <div className="profile-address-modal" style={{ borderRadius: '12px', border: '1px solid #0f0f0f' }}>
                {/* Modal Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.35rem' }}>
                  <div>
                    <div style={{ fontSize: '0.66rem', color: '#7d807a', fontWeight: 700, letterSpacing: '0.08em', fontFamily: 'var(--font-dm-mono), monospace', marginBottom: '0.2rem', textTransform: 'uppercase' }}>
                      [DISPATCH DESTINATION]
                    </div>
                    <h2 style={{ margin: 0, fontSize: '1.8rem', color: '#0f0f0f', fontFamily: 'var(--font-koulen), sans-serif', textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1.1 }}>
                      Add Delivery Address
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddressModal(false)}
                    className="profile-close-btn"
                    aria-label="Close"
                    style={{
                      width: '32px',
                      height: '32px',
                      minWidth: '32px',
                      maxWidth: '32px',
                      minHeight: '32px',
                      maxHeight: '32px',
                      padding: 0,
                      border: '1px solid #d7dbd2',
                      backgroundColor: '#edf1e8',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      flexShrink: 0,
                      color: '#0f0f0f',
                    }}
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ width: '13px', height: '13px', display: 'block', pointerEvents: 'none' }}>
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                </div>

                {addrError && (
                  <div style={{
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#991b1b',
                    padding: '0.65rem 0.95rem',
                    borderRadius: '6px',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-dm-mono), monospace',
                    marginBottom: '1rem',
                  }}>
                    {addrError}
                  </div>
                )}

                <form onSubmit={handleAddressSubmit} noValidate>
                  {/* Row 1: First Name & Last Name */}
                  <div className="profile-address-grid-2col">
                    <div>
                      <label className="profile-form-label">
                        <span>First Name</span>
                        <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Denis"
                        value={addrForm.firstName}
                        onChange={(e) => {
                          setAddrForm({ ...addrForm, firstName: e.target.value });
                          if (addrFieldErrors.firstName) setAddrFieldErrors((prev) => ({ ...prev, firstName: '' }));
                        }}
                        className="profile-form-input"
                        style={addrFieldErrors.firstName ? { borderColor: '#ef4444' } : undefined}
                      />
                      {addrFieldErrors.firstName && (
                        <span style={{ color: '#ef4444', fontSize: '0.68rem', fontFamily: 'var(--font-dm-mono), monospace', marginTop: '0.2rem', fontWeight: 500, display: 'block' }}>
                          {addrFieldErrors.firstName}
                        </span>
                      )}
                    </div>
                    <div>
                      <label className="profile-form-label">
                        <span>Last Name</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Holland"
                        value={addrForm.lastName}
                        onChange={(e) => {
                          setAddrForm({ ...addrForm, lastName: e.target.value });
                          if (addrFieldErrors.lastName) setAddrFieldErrors((prev) => ({ ...prev, lastName: '' }));
                        }}
                        className="profile-form-input"
                        style={addrFieldErrors.lastName ? { borderColor: '#ef4444' } : undefined}
                      />
                      {addrFieldErrors.lastName && (
                        <span style={{ color: '#ef4444', fontSize: '0.68rem', fontFamily: 'var(--font-dm-mono), monospace', marginTop: '0.2rem', fontWeight: 500, display: 'block' }}>
                          {addrFieldErrors.lastName}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Phone Number */}
                  <div className="profile-form-group">
                    <label className="profile-form-label">
                      <span>Phone Number</span>
                      <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <span style={{
                        position: 'absolute',
                        left: '0.85rem',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        color: '#555852',
                        pointerEvents: 'none',
                        fontFamily: 'var(--font-dm-mono), monospace'
                      }}>
                        +91
                      </span>
                      <input
                        type="tel"
                        placeholder="9876543210"
                        value={addrForm.phone}
                        onChange={(e) => {
                          setAddrForm({ ...addrForm, phone: e.target.value.replace(/\D/g, '').slice(0, 10) });
                          if (addrFieldErrors.phone) setAddrFieldErrors((prev) => ({ ...prev, phone: '' }));
                        }}
                        className="profile-form-input"
                        style={{ paddingLeft: '2.8rem', ...(addrFieldErrors.phone ? { borderColor: '#ef4444' } : {}) }}
                      />
                    </div>
                    {addrFieldErrors.phone && (
                      <span style={{ color: '#ef4444', fontSize: '0.68rem', fontFamily: 'var(--font-dm-mono), monospace', marginTop: '0.2rem', fontWeight: 500, display: 'block' }}>
                        {addrFieldErrors.phone}
                      </span>
                    )}
                  </div>

                  {/* Row 3: Street Address */}
                  <div className="profile-form-group">
                    <label className="profile-form-label">
                      <span>Street Address, Flat / House / Landmark</span>
                      <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Flat 402, Royale Atelier Tower, 5th Avenue"
                      value={addrForm.address}
                      onChange={(e) => {
                        setAddrForm({ ...addrForm, address: e.target.value });
                        if (addrFieldErrors.address) setAddrFieldErrors((prev) => ({ ...prev, address: '' }));
                      }}
                      className="profile-form-input"
                      style={addrFieldErrors.address ? { borderColor: '#ef4444' } : undefined}
                    />
                    {addrFieldErrors.address && (
                      <span style={{ color: '#ef4444', fontSize: '0.68rem', fontFamily: 'var(--font-dm-mono), monospace', marginTop: '0.2rem', fontWeight: 500, display: 'block' }}>
                        {addrFieldErrors.address}
                      </span>
                    )}
                  </div>

                  {/* Row 4: City, State, Pincode */}
                  <div className="profile-address-grid-3col">
                    <div>
                      <label className="profile-form-label">
                        <span>City</span>
                        <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Mumbai"
                        value={addrForm.city}
                        onChange={(e) => {
                          setAddrForm({ ...addrForm, city: e.target.value });
                          if (addrFieldErrors.city) setAddrFieldErrors((prev) => ({ ...prev, city: '' }));
                        }}
                        className="profile-form-input"
                        style={addrFieldErrors.city ? { borderColor: '#ef4444' } : undefined}
                      />
                      {addrFieldErrors.city && (
                        <span style={{ color: '#ef4444', fontSize: '0.68rem', fontFamily: 'var(--font-dm-mono), monospace', marginTop: '0.2rem', fontWeight: 500, display: 'block' }}>
                          {addrFieldErrors.city}
                        </span>
                      )}
                    </div>
                    <div>
                      <label className="profile-form-label">
                        <span>State</span>
                        <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Maharashtra"
                        value={addrForm.state}
                        onChange={(e) => {
                          setAddrForm({ ...addrForm, state: e.target.value });
                          if (addrFieldErrors.state) setAddrFieldErrors((prev) => ({ ...prev, state: '' }));
                        }}
                        className="profile-form-input"
                        style={addrFieldErrors.state ? { borderColor: '#ef4444' } : undefined}
                      />
                      {addrFieldErrors.state && (
                        <span style={{ color: '#ef4444', fontSize: '0.68rem', fontFamily: 'var(--font-dm-mono), monospace', marginTop: '0.2rem', fontWeight: 500, display: 'block' }}>
                          {addrFieldErrors.state}
                        </span>
                      )}
                    </div>
                    <div>
                      <label className="profile-form-label">
                        <span>Pincode</span>
                        <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        placeholder="400001"
                        value={addrForm.pincode}
                        onChange={(e) => {
                          setAddrForm({ ...addrForm, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) });
                          if (addrFieldErrors.pincode) setAddrFieldErrors((prev) => ({ ...prev, pincode: '' }));
                        }}
                        className="profile-form-input"
                        style={addrFieldErrors.pincode ? { borderColor: '#ef4444' } : undefined}
                      />
                      {addrFieldErrors.pincode && (
                        <span style={{ color: '#ef4444', fontSize: '0.68rem', fontFamily: 'var(--font-dm-mono), monospace', marginTop: '0.2rem', fontWeight: 500, display: 'block' }}>
                          {addrFieldErrors.pincode}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Row 5: Set as Default Checkbox */}
                  <label className="profile-checkbox-row">
                    <input
                      type="checkbox"
                      checked={addrForm.isDefault}
                      onChange={(e) => setAddrForm({ ...addrForm, isDefault: e.target.checked })}
                      style={{ width: '16px', height: '16px', accentColor: '#0f0f0f', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '0.8rem', color: '#3f423d', fontWeight: 500 }}>
                      Make this my default dispatch address
                    </span>
                  </label>

                  {/* Form Action Buttons */}
                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', alignItems: 'center', paddingTop: '0.95rem', borderTop: '1px solid #edf1e8' }}>
                    <button
                      type="button"
                      onClick={() => setShowAddressModal(false)}
                      style={{
                        padding: '0.65rem 1.4rem',
                        border: '1px solid #d7dbd2',
                        backgroundColor: '#edf1e8',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontFamily: 'var(--font-dm-mono), monospace',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        fontSize: '0.78rem',
                        color: '#555852',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#d7dbd2')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#edf1e8')}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isAddingAddress}
                      style={{
                        padding: '0.68rem 1.85rem',
                        backgroundColor: '#0f0f0f',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: isAddingAddress ? 'not-allowed' : 'pointer',
                        fontWeight: 700,
                        fontFamily: 'var(--font-dm-mono), monospace',
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        fontSize: '0.8rem',
                        boxShadow: '0 4px 14px -2px rgba(15, 15, 15, 0.25)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => !isAddingAddress && (e.currentTarget.style.backgroundColor = '#262626')}
                      onMouseLeave={(e) => !isAddingAddress && (e.currentTarget.style.backgroundColor = '#0f0f0f')}
                    >
                      <span style={{ color: '#ffffff', fontWeight: 700 }}>
                        {isAddingAddress ? 'Saving...' : 'Save Address'}
                      </span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* End of Profile UI Section */}
        </div>
      </div>

      {/* Global Drapza Parallax Contact Form & Footer System */}
      <ContactForm />
      <Footer navigate={(path) => router.push(path)} />

      {/* Customer Return & Exchange Modal */}
      <CustomerReturnModal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        order={returnOrder}
      />

      {/* Customer Cancel Order Modal */}
      <CancelOrderModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onSuccess={() => {
          if (refetchOrders) refetchOrders();
        }}
        order={cancelTargetOrder}
      />
    </>
  );
};

export default ProfilePage;
