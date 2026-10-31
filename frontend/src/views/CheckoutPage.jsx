'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useCart } from '../context/CartContext';
import { useRouter } from 'next/navigation';
import { usePageTransition } from '../components/PageTransition';
import { ContactForm } from '../components/ContactForm';
import { Footer } from '../components/Footer';
import { ConfirmModal } from '../components/drapza/ConfirmModal';
import { useLockBodyScroll } from '../components/drapza/useLockBodyScroll';
import {
  MapPin,
  Plus,
  Home,
  Briefcase,
  Phone,
  ArrowRight,
  X,
  AlertCircle,
  Building,
  Building2,
  Smartphone,
  MoreHorizontal,
  User,
  Mail,
  Map,
  ChevronDown,
  Check,
  Signpost,
  CircleDot,
  LayoutGrid,
  Loader2,
  ShoppingBag,
  Tag,
  ChevronUp,
  Truck,
  ChevronRight,
  ChevronLeft,
  Lock,
} from 'lucide-react';
import '../styles/checkout.css';
import { couponApi, gstConfigApi, DEFAULT_GST_CONFIG, productsApi } from '../lib/api';
import {
  shippingAddressModalSchema,
  checkoutShippingDetailsSchema,
  couponCodeInputSchema,
  getZodErrorMessage,
  getZodFieldErrors,
} from '../lib/validation';

const RoadIcon = ({ size = 18, color = '#000000', className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    style={{ display: 'inline-block', verticalAlign: 'middle' }}
  >
    <path d="M4 19L8 5" />
    <path d="M20 19L16 5" />
    <path d="M12 7V9" />
    <path d="M12 13V15" />
  </svg>
);

const COMMON_CITIES = [
  'Mumbai',
  'Delhi',
  'Bengaluru',
  'Hyderabad',
  'Ahmedabad',
  'Chennai',
  'Kolkata',
  'Surat',
  'Pune',
  'Jaipur',
  'Lucknow',
  'Kanpur',
  'Nagpur',
  'Indore',
  'Thane',
  'Bhopal',
  'Visakhapatnam',
  'Patna',
  'Vadodara',
  'Ghaziabad',
  'Ludhiana',
  'Agra',
  'Nashik',
  'Faridabad',
  'Meerut',
  'Rajkot',
  'Varanasi',
  'Srinagar',
  'Navi Mumbai',
  'Noida',
  'Gurgaon',
  'Chandigarh',
  'Other'
];

import { useCreateOrderMutation } from '../redux/api/orderApi';
import {
  useGetAddressesQuery,
  useAddAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
  useSetDefaultAddressMutation,
} from '../redux/api/addressApi';
import { AddressesSkeleton } from '../components/drapza/skeletons';

const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Delhi',
  'Jammu & Kashmir',
  'Ladakh',
  'Puducherry',
  'Chandigarh',
  'Other'
];

export const CheckoutPage = ({ navigate: propNavigate }) => {
  const router = useRouter();
  const { navigate: transitionNavigate } = usePageTransition() || {};
  const navigate = propNavigate || transitionNavigate || ((path) => router.push(path));
  const { cartItems, clearCart, subtotal, savingsTotal } = useCart();
  const [createOrderMutation] = useCreateOrderMutation();
  const [createdOrderDetails, setCreatedOrderDetails] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderErrorMessage, setOrderErrorMessage] = useState('');

  // Coupon Code State
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [couponMessage, setCouponMessage] = useState(null);
  const [gstConfig, setGstConfig] = useState(DEFAULT_GST_CONFIG);
  const [isCouponOpen, setIsCouponOpen] = useState(false);

  // Fetch live GST configuration from Admin CMS
  useEffect(() => {
    let isMounted = true;
    gstConfigApi
      .getGstConfig()
      .then((res) => {
        if (isMounted && res && res.success && res.data) {
          setGstConfig(res.data);
        }
      })
      .catch((err) => {
        console.warn('Failed to load GST config in checkout:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Restore coupon from session if available
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('drapza_checkout_session');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.coupon) {
          setAppliedCoupon(parsed.coupon);
          setCouponInput(parsed.coupon.code || '');
        } else if (parsed.couponCode && parsed.couponDiscount) {
          setAppliedCoupon({
            code: parsed.couponCode,
            calculatedDiscount: Number(parsed.couponDiscount),
          });
          setCouponInput(parsed.couponCode);
        }
      }
    } catch (e) { }
  }, []);

  // Validate stock on checkout mount
  useEffect(() => {
    if (!cartItems || cartItems.length === 0) return;
    const verifyBagStock = async () => {
      try {
        const stockCheckItems = cartItems.map((i) => ({
          productId: i.product || i._id || (i.id && i.id.length === 24 ? i.id : undefined),
          name: i.name,
          slug: i.slug,
          quantity: i.quantity || 1,
        }));
        const stockRes = await productsApi.validateStock(stockCheckItems);
        if (stockRes && stockRes.success && !stockRes.isValid) {
          const outOfStockItem = stockRes.items?.find((item) => !item.isValid);
          setOrderErrorMessage(
            outOfStockItem
              ? `${outOfStockItem.name}: ${outOfStockItem.error || 'Currently out of stock.'}`
              : 'Some items in your bag have insufficient stock.'
          );
        }
      } catch (err) {
        console.warn('Initial stock check warning:', err);
      }
    };
    verifyBagStock();
  }, [cartItems]);

  const handleApplyCoupon = async (codeToApply = couponInput) => {
    const cleanCode = (codeToApply || '').trim().toUpperCase();
    const couponValidation = couponCodeInputSchema.safeParse({ code: cleanCode });
    if (!couponValidation.success) {
      setCouponMessage({ type: 'error', text: getZodErrorMessage(couponValidation.error) });
      return;
    }
    if (!cartItems || cartItems.length === 0) {
      setCouponMessage({ type: 'error', text: 'Your bag is empty.' });
      return;
    }

    setIsValidatingCoupon(true);
    setCouponMessage(null);

    try {
      const res = await couponApi.validateCoupon(cleanCode, subtotal);
      if (res && res.success && res.coupon) {
        const discountVal = Number(res.discountAmount || 0);
        const couponObj = {
          ...res.coupon,
          calculatedDiscount: discountVal,
          finalTotal: res.finalTotal,
        };
        setAppliedCoupon(couponObj);
        setCouponInput(cleanCode);
        setCouponMessage({
          type: 'success',
          text: `Coupon "${cleanCode}" applied! Saved ₹${discountVal.toFixed(2)}.`,
        });
      } else {
        setCouponMessage({
          type: 'error',
          text: res?.message || 'Invalid or expired coupon code.',
        });
      }
    } catch (err) {
      setCouponMessage({
        type: 'error',
        text: err.message || 'Failed to apply coupon.',
      });
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponMessage(null);
  };

  const couponDiscount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.minOrderValue && subtotal < appliedCoupon.minOrderValue) {
      return 0;
    }
    if (appliedCoupon.discountType === 'percentage') {
      let disc = (subtotal * Number(appliedCoupon.discountAmount || 0)) / 100;
      if (appliedCoupon.maxDiscountAmount) {
        disc = Math.min(disc, Number(appliedCoupon.maxDiscountAmount));
      }
      return Math.round(disc);
    }
    return Math.min(subtotal, Number(appliedCoupon.calculatedDiscount || appliedCoupon.discountAmount || 0));
  }, [appliedCoupon, subtotal]);

  const finalSubtotal = Math.max(0, subtotal - couponDiscount);

  // Dynamic GST calculation from Admin CMS
  const isGstActive = Boolean(gstConfig?.isEnabled);
  const gstRate = isGstActive ? Number(gstConfig?.gstPercentage ?? 18) : 0;
  const isExclusiveGst = isGstActive && gstConfig?.calculationMode === 'exclusive';

  const gstAmount = useMemo(() => {
    if (!isGstActive || gstRate <= 0) return 0;
    const base = Number(finalSubtotal || 0);
    if (isExclusiveGst) {
      return (base * gstRate) / 100;
    } else {
      // Inclusive tax formula: (base * rate) / (100 + rate)
      return (base * gstRate) / (100 + gstRate);
    }
  }, [isGstActive, gstRate, isExclusiveGst, finalSubtotal]);

  const checkoutTotal = useMemo(() => {
    const base = Number(finalSubtotal || 0);
    return isExclusiveGst ? base + gstAmount : base;
  }, [finalSubtotal, isExclusiveGst, gstAmount]);

  // Authentication state
  const authState = useSelector((state) => state.auth);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const token =
      authState?.token ||
      (typeof window !== 'undefined' ? localStorage.getItem('drapza_token') : null);
    const userStr =
      authState?.user ||
      (typeof window !== 'undefined' ? localStorage.getItem('drapza_user') : null);
    const parsedUser = typeof userStr === 'string' ? JSON.parse(userStr || 'null') : userStr;

    setIsAuthenticated(!!token);
    setCurrentUser(parsedUser);

    if (parsedUser) {
      setFormData((prev) => {
        const uFirst = parsedUser.firstName || parsedUser.name?.split(' ')[0] || '';
        const uLast = parsedUser.lastName || parsedUser.name?.split(' ').slice(1).join(' ') || '';
        return {
          ...prev,
          firstName: prev.firstName && prev.firstName !== 'Ravi' ? prev.firstName : (uFirst || ''),
          lastName: prev.lastName && prev.lastName !== 'Sharma' ? prev.lastName : (uLast || ''),
          email: prev.email || parsedUser.email || '',
          phone: prev.phone || parsedUser.phone || '',
        };
      });
    }
  }, [authState]);

  // Existing form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: ''
  });
  const [shippingFieldErrors, setShippingFieldErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    if (shippingFieldErrors[name]) {
      setShippingFieldErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const addressQueryParams = useMemo(() => {
    const params = {};
    const effectiveEmail = currentUser?.email || formData.email;
    const effectivePhone = currentUser?.phone || formData.phone;
    if (effectiveEmail) params.email = effectiveEmail.trim();
    if (effectivePhone) params.phone = effectivePhone.trim();
    return Object.keys(params).length > 0 ? params : undefined;
  }, [currentUser?.email, currentUser?.phone, formData.email, formData.phone]);

  // Addresses RTK Query
  const {
    data: addressData,
    isLoading: isAddressesLoading,
    refetch: refetchAddresses,
  } = useGetAddressesQuery(addressQueryParams);

  const [addAddress, { isLoading: isAddingAddress }] = useAddAddressMutation();
  const [updateAddress, { isLoading: isUpdatingAddress }] = useUpdateAddressMutation();
  const [deleteAddress] = useDeleteAddressMutation();
  const [setDefaultAddress] = useSetDefaultAddressMutation();

  const savedAddresses = useMemo(() => {
    return addressData?.addresses || [];
  }, [addressData]);

  // Selected Address State
  const [selectedAddressId, setSelectedAddressId] = useState('');

  // Address Modal State (for Add / Edit)
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);

  // Address Modal Form State
  const [addressModalForm, setAddressModalForm] = useState({
    fullName: '',
    phone: '',
    addressType: 'Home',
    houseFlat: '',
    streetArea: '',
    landmark: '',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '',
    isDefault: false,
  });
  const [addressFormErrors, setAddressFormErrors] = useState({});

  // Delete Confirmation State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState(null);

  // Lock body scroll & stop Lenis smooth-scroll when modals are open so mouse wheel scroll works flawlessly inside
  useLockBodyScroll(Boolean(isAddressModalOpen || isDeleteModalOpen));

  // Sync selected address data into existing form fields
  const applyAddressToForm = (addr) => {
    if (!addr) return;
    setShippingFieldErrors({});
    setSelectedAddressId(addr._id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('drapza_selected_address_id', addr._id);
    }

    const nameParts = (addr.fullName || `${addr.firstName || ''} ${addr.lastName || ''}`).trim().split(' ');
    const fName = addr.firstName || nameParts[0] || '';
    const lName = addr.lastName || nameParts.slice(1).join(' ') || '';

    const constructedAddress = addr.houseFlat
      ? `${addr.houseFlat}, ${addr.streetArea || addr.address}${addr.landmark ? ', Near ' + addr.landmark : ''}`
      : (addr.streetArea || addr.address);

    setFormData((prev) => ({
      ...prev,
      firstName: fName || prev.firstName,
      lastName: lName || prev.lastName,
      phone: addr.phone ? addr.phone.replace(/\s+/g, '') : prev.phone,
      address: constructedAddress || prev.address,
      city: addr.city || prev.city,
      state: addr.state || prev.state,
      pincode: addr.pincode || prev.pincode,
    }));
  };

  // Initialize selected address from storage or default
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const savedSession = localStorage.getItem('drapza_checkout_session');
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        if (parsed?.formData) {
          setFormData((prev) => ({ ...prev, ...parsed.formData }));
        }
      }
    } catch (e) { }

    const storedId = localStorage.getItem('drapza_selected_address_id');
    if (savedAddresses.length > 0) {
      const match = storedId && savedAddresses.find((a) => a._id === storedId);
      if (match) {
        applyAddressToForm(match);
      } else {
        const defaultAddr = savedAddresses.find((a) => a.isDefault) || savedAddresses[0];
        applyAddressToForm(defaultAddr);
      }
    }
  }, [savedAddresses]);

  const selectedAddress = useMemo(() => {
    return savedAddresses.find((a) => a._id === selectedAddressId) || null;
  }, [savedAddresses, selectedAddressId]);

  // Open Add Address Form
  const handleOpenAddForm = () => {
    setEditingAddressId(null);
    const existingName = currentUser?.name || `${formData.firstName || ''} ${formData.lastName || ''}`.trim();
    const existingPhone = currentUser?.phone || formData.phone || '';
    setAddressModalForm({
      fullName: existingName,
      phone: existingPhone,
      addressType: 'Home',
      houseFlat: '',
      streetArea: '',
      landmark: '',
      city: formData.city || 'Mumbai',
      state: formData.state || 'Maharashtra',
      pincode: formData.pincode || '',
      isDefault: savedAddresses.length === 0,
    });
    setAddressFormErrors({});
    setIsAddressModalOpen(true);
  };

  // Open Edit Address Form
  const handleOpenEditForm = (addr, e) => {
    if (e) e.stopPropagation();
    setEditingAddressId(addr._id);
    const fullName =
      addr.fullName || `${addr.firstName || ''} ${addr.lastName || ''}`.trim() || 'Ravi Sharma';

    setAddressModalForm({
      fullName,
      phone: addr.phone ? addr.phone.replace(/\s+/g, '') : '',
      addressType: addr.addressType || 'Home',
      houseFlat: addr.houseFlat || '',
      streetArea: addr.streetArea || (addr.houseFlat ? '' : addr.address) || '',
      landmark: addr.landmark || '',
      city: addr.city || 'Mumbai',
      state: addr.state || 'Maharashtra',
      pincode: addr.pincode || '',
      isDefault: !!addr.isDefault,
    });
    setAddressFormErrors({});
    setIsAddressModalOpen(true);
  };

  // Form Validation using Zod
  const validateAddressModalForm = () => {
    const validation = shippingAddressModalSchema.safeParse(addressModalForm);
    if (!validation.success) {
      const errors = getZodFieldErrors(validation.error);
      setAddressFormErrors(errors);
      return false;
    }
    setAddressFormErrors({});
    return true;
  };

  // Save Address directly to Backend Database (MongoDB)
  const handleSaveAddress = async (e) => {
    e.preventDefault();
    if (!validateAddressModalForm()) return;

    try {
      const payload = {
        fullName: addressModalForm.fullName.trim(),
        phone: addressModalForm.phone.trim(),
        addressType: addressModalForm.addressType,
        houseFlat: addressModalForm.houseFlat.trim(),
        streetArea: addressModalForm.streetArea.trim(),
        landmark: addressModalForm.landmark.trim(),
        city: addressModalForm.city.trim(),
        state: addressModalForm.state.trim(),
        pincode: addressModalForm.pincode.trim(),
        isDefault: addressModalForm.isDefault,
      };

      let savedRecord = null;
      if (editingAddressId && !editingAddressId.startsWith('default-')) {
        const res = await updateAddress({ id: editingAddressId, ...payload }).unwrap();
        savedRecord = res?.address;
      } else {
        const res = await addAddress(payload).unwrap();
        savedRecord = res?.address;
      }

      if (savedRecord) {
        applyAddressToForm(savedRecord);
      }

      if (typeof refetchAddresses === 'function') {
        await refetchAddresses();
      }

      setIsAddressModalOpen(false);
    } catch (err) {
      console.error('Failed to save address to backend MongoDB:', err);
      const errMsg =
        err?.data?.message ||
        err?.error ||
        err?.message ||
        'Failed to save address to server. Please check your connection and details.';
      setAddressFormErrors((prev) => ({
        ...prev,
        submit: errMsg,
      }));
    }
  };

  // Delete Prompt
  const handlePromptDelete = (addr, e) => {
    if (e) e.stopPropagation();
    setAddressToDelete(addr);
    setIsDeleteModalOpen(true);
  };

  // Confirm Delete directly in Backend Database (MongoDB)
  const handleConfirmDelete = async () => {
    if (!addressToDelete) return;
    try {
      if (addressToDelete._id && !addressToDelete._id.startsWith('default-')) {
        await deleteAddress(addressToDelete._id).unwrap();
        if (typeof refetchAddresses === 'function') {
          await refetchAddresses();
        }
      }
      setIsDeleteModalOpen(false);

      if (selectedAddressId === addressToDelete._id) {
        const remaining = savedAddresses.filter((a) => a._id !== addressToDelete._id);
        if (remaining.length > 0) {
          const nextDefault = remaining.find((a) => a.isDefault) || remaining[0];
          applyAddressToForm(nextDefault);
        } else {
          setSelectedAddressId('');
          if (typeof window !== 'undefined') {
            localStorage.removeItem('drapza_selected_address_id');
          }
        }
      }
      setAddressToDelete(null);
    } catch (err) {
      console.error('Failed to delete address from backend:', err);
      setIsDeleteModalOpen(false);
      setAddressToDelete(null);
    }
  };

  // Existing handleSubmit Enhanced with Zod Validation & Address Linkage
  const handleSubmit = async (e) => {
    e.preventDefault();
    setOrderErrorMessage('');

    if (!cartItems || cartItems.length === 0) {
      setOrderErrorMessage('Your shopping bag is empty.');
      return;
    }

    // Live stock availability verification
    try {
      const stockCheckItems = cartItems.map((i) => ({
        productId: i.product || i._id || (i.id && i.id.length === 24 ? i.id : undefined),
        name: i.name,
        slug: i.slug,
        quantity: i.quantity || 1,
      }));
      const stockRes = await productsApi.validateStock(stockCheckItems);
      if (stockRes && stockRes.success && !stockRes.isValid) {
        const outOfStockItem = stockRes.items?.find((item) => !item.isValid);
        setOrderErrorMessage(
          outOfStockItem
            ? `${outOfStockItem.name}: ${outOfStockItem.error || 'Currently out of stock.'}`
            : 'Some items in your bag have insufficient stock.'
        );
        return;
      }
    } catch (stockErr) {
      console.warn('Live stock verification note:', stockErr);
    }

    if (!isAuthenticated) {
      navigate('/login?redirect=/checkout');
      return;
    }

    const shippingValidation = checkoutShippingDetailsSchema.safeParse(formData);
    if (!shippingValidation.success) {
      const fieldErrors = getZodFieldErrors(shippingValidation.error);
      setShippingFieldErrors(fieldErrors);
      setOrderErrorMessage(getZodErrorMessage(shippingValidation.error));
      return;
    }
    setShippingFieldErrors({});

    const cleanPhone = shippingValidation.data.phone;

    setIsSubmitting(true);
    try {
      // Auto-save filled shipping details directly to database (MongoDB)
      let resolvedAddressId = selectedAddressId && !selectedAddressId.startsWith('default-') ? selectedAddressId : undefined;
      try {
        const fAddr = formData.address.trim().toLowerCase().replace(/\s+/g, ' ');
        const fPin = formData.pincode.trim();
        const existingMatch = savedAddresses.find((a) => {
          const aAddr = (a.address || '').trim().toLowerCase().replace(/\s+/g, ' ');
          const aPin = (a.pincode || '').trim();
          return aAddr === fAddr && aPin === fPin;
        });

        if (existingMatch) {
          resolvedAddressId = existingMatch._id;
          setSelectedAddressId(existingMatch._id);
          if (typeof window !== 'undefined') {
            localStorage.setItem('drapza_selected_address_id', existingMatch._id);
          }
        } else {
          const addressPayload = {
            fullName: `${formData.firstName} ${formData.lastName}`.trim(),
            firstName: formData.firstName.trim(),
            lastName: formData.lastName.trim(),
            email: formData.email.trim(),
            phone: cleanPhone,
            address: formData.address.trim(),
            city: formData.city.trim(),
            state: formData.state.trim(),
            pincode: formData.pincode.trim(),
            addressType: 'Home',
            isDefault: savedAddresses.length === 0,
          };

          const res = await addAddress(addressPayload).unwrap();
          if (res?.address?._id) {
            resolvedAddressId = res.address._id;
            setSelectedAddressId(res.address._id);
            if (typeof window !== 'undefined') {
              localStorage.setItem('drapza_selected_address_id', res.address._id);
            }
            if (typeof refetchAddresses === 'function') {
              refetchAddresses();
            }
          }
        }
      } catch (saveErr) {
        console.warn('Auto-save address to database notice:', saveErr);
      }

      const checkoutSession = {
        customer: {
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          email: formData.email.trim() || (currentUser ? currentUser.email : 'guest@drapza.com'),
          phone: cleanPhone,
        },
        address: {
          line1: formData.address.trim(),
          city: formData.city.trim(),
          state: formData.state.trim(),
          pincode: formData.pincode.trim(),
          country: 'India',
          addressId: resolvedAddressId,
          addressType: selectedAddress?.addressType || 'Home',
        },
        items: cartItems.map((i) => {
          const rawPrice = typeof i.price === 'number' ? i.price : parseFloat(String(i.price || 0).replace(/[^\d.]/g, '')) || 0;
          const safePrice = Number.isFinite(rawPrice) && rawPrice >= 0 ? rawPrice : 0;
          const rawOrig = typeof i.originalPrice === 'number' ? i.originalPrice : parseFloat(String(i.originalPrice || 0).replace(/[^\d.]/g, '')) || safePrice;
          const safeOrig = Number.isFinite(rawOrig) && rawOrig >= safePrice ? rawOrig : safePrice;
          const refId = i.product || i._id || i.productId || (i.id && String(i.id).length === 24 ? i.id : undefined);
          return {
            name: i.name,
            productId: refId,
            product: refId,
            slug: i.slug,
            price: safePrice,
            originalPrice: safeOrig,
            quantity: Math.max(1, parseInt(i.quantity, 10) || 1),
            selectedSize: i.selectedSize || 'M',
            color: i.color || '',
            image: i.image || i.image_url || '',
            bogoTier: i.bogoTier || null,
            bundleTag: i.bundleTag || null,
            bundleUnits: i.bundleUnits || 1,
            bundleFreeUnits: i.bundleFreeUnits || 0,
            garmentSizes: i.garmentSizes || null,
          };
        }),
        subtotal: subtotal,
        couponCode: appliedCoupon?.code || '',
        couponDiscount: couponDiscount,
        coupon: appliedCoupon,
        tax: gstAmount,
        total: checkoutTotal,
        selectedAddressId: selectedAddressId,
        formData: formData,
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem('drapza_checkout_session', JSON.stringify(checkoutSession));
      }

      // Pre-warm payment route in the background
      if (router?.prefetch) {
        try {
          router.prefetch('/checkout/payment');
        } catch (e) { }
      }

      // Wait until the button loading is complete on the screen
      await new Promise((resolve) => setTimeout(resolve, 650));

      // ONLY AFTER button loading completes, trigger page switch transition
      navigate('/checkout/payment');
    } catch (err) {
      setOrderErrorMessage('Could not proceed to payment: ' + (err.message || 'Please check details'));
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="checkout-page">
        {isSuccess ? (
          <div className="checkout-success">
            <div className="checkout-success-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z" />
              </svg>
            </div>
            <h3>Order Placed!</h3>
            {createdOrderDetails && (
              <div style={{ margin: '1rem 0', padding: '0.8rem 1.2rem', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <span style={{ fontSize: '0.75rem', letterSpacing: '0.15em', color: '#a1a1aa', textTransform: 'uppercase' }}>Atelier Telemetry Ref:</span>
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '1.25rem', fontWeight: 600, color: '#ffffff', letterSpacing: '0.1em', marginTop: '0.25rem' }}>
                  {createdOrderDetails.orderId || createdOrderDetails.trackingRef}
                </div>
              </div>
            )}
            <p>
              Thank you for your order. We've received your details and will be in touch shortly via WhatsApp or email to confirm your shipment.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1.5rem', flexWrap: 'wrap' }}>
              <a
                href="/track"
                className="checkout-success-btn"
                style={{ backgroundColor: '#ffffff', color: '#000000' }}
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/track');
                }}
              >
                Track Shipment
              </a>
              <a
                href="/"
                className="checkout-success-btn"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/');
                }}
              >
                Back to Home
              </a>
            </div>
          </div>
        ) : (
          <div className="checkout-inner">
            <div className="checkout-form-section">
              <div style={{ paddingBottom: '16px', borderBottom: '1px dashed rgba(0, 0, 0, 0.15)', marginBottom: '22px' }}>
                <h5 style={{
                  margin: 0,
                  fontSize: '2.1rem',
                  fontWeight: 400,
                  textTransform: 'uppercase',
                  letterSpacing: '0.03em',
                  color: '#000000',
                  fontFamily: 'var(--font-koulen), sans-serif',
                  lineHeight: 1,
                  borderBottom: 'none',
                  paddingBottom: 0
                }}>
                  SHIPPING INFORMATION
                </h5>
                <p style={{ margin: '6px 0 0', fontSize: '11.5px', color: '#71717a', letterSpacing: '0.04em', fontFamily: 'var(--font-dm-mono, "DM Mono", monospace)', textTransform: 'uppercase' }}>
                  Enter delivery address or select from your saved profiles
                </p>
              </div>

              {orderErrorMessage && (
                <div className="checkout-error-banner" style={{ marginBottom: '1.25rem' }}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{orderErrorMessage}</span>
                </div>
              )}

              {!isAuthenticated && (
                <div
                  style={{
                    backgroundColor: '#18181b',
                    color: '#f4f4f5',
                    padding: '1rem 1.25rem',
                    marginBottom: '1.5rem',
                    border: '1px solid #27272a',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Lock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', fontFamily: 'var(--font-dm-mono, monospace)' }}>
                        ATELIER AUTHENTICATION REQUIRED
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#a1a1aa', marginTop: '2px' }}>
                        Please sign in or register to complete your order. Your bag contents will remain saved.
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/login?redirect=/checkout')}
                    style={{
                      backgroundColor: '#edf1e8',
                      color: '#000000',
                      border: 'none',
                      padding: '0.5rem 1rem',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-dm-mono, monospace)',
                    }}
                  >
                    SIGN IN / REGISTER →
                  </button>
                </div>
              )}

              <form id="checkout-form" className="checkout-form" onSubmit={handleSubmit} noValidate>
                {/* Row 1: First Name & Last Name (Side by Side in 2 Columns) */}
                <div className="form-row form-row-split">
                  <div className="form-group">
                    <label>FIRST NAME</label>
                    <input
                      name="firstName"
                      type="text"
                      placeholder="Aarav"
                      value={formData.firstName}
                      onChange={handleChange}
                      style={shippingFieldErrors.firstName ? { borderColor: '#ef4444' } : undefined}
                    />
                    {shippingFieldErrors.firstName && (
                      <span className="field-error-text" style={{
                        color: '#ef4444',
                        fontSize: '0.68rem',
                        fontFamily: 'var(--font-dm-mono), monospace',
                        marginTop: '0.2rem',
                        fontWeight: 500,
                        display: 'block'
                      }}>
                        {shippingFieldErrors.firstName}
                      </span>
                    )}
                  </div>
                  <div className="form-group">
                    <label>LAST NAME</label>
                    <input
                      name="lastName"
                      type="text"
                      placeholder="Sharma"
                      value={formData.lastName}
                      onChange={handleChange}
                      style={shippingFieldErrors.lastName ? { borderColor: '#ef4444' } : undefined}
                    />
                    {shippingFieldErrors.lastName && (
                      <span className="field-error-text" style={{
                        color: '#ef4444',
                        fontSize: '0.68rem',
                        fontFamily: 'var(--font-dm-mono), monospace',
                        marginTop: '0.2rem',
                        fontWeight: 500,
                        display: 'block'
                      }}>
                        {shippingFieldErrors.lastName}
                      </span>
                    )}
                  </div>
                </div>

                {/* Row 2: Email & Phone (Side by Side on PC, Stacked on Mobile) */}
                <div className="form-row form-row-email-phone">
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      name="email"
                      type="email"
                      placeholder="you@email.com"
                      value={formData.email}
                      onChange={handleChange}
                      style={shippingFieldErrors.email ? { borderColor: '#ef4444' } : undefined}
                    />
                    {shippingFieldErrors.email && (
                      <span className="field-error-text" style={{
                        color: '#ef4444',
                        fontSize: '0.68rem',
                        fontFamily: 'var(--font-dm-mono), monospace',
                        marginTop: '0.2rem',
                        fontWeight: 500,
                        display: 'block'
                      }}>
                        {shippingFieldErrors.email}
                      </span>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      name="phone"
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={handleChange}
                      style={shippingFieldErrors.phone ? { borderColor: '#ef4444' } : undefined}
                    />
                    {shippingFieldErrors.phone && (
                      <span className="field-error-text" style={{
                        color: '#ef4444',
                        fontSize: '0.68rem',
                        fontFamily: 'var(--font-dm-mono), monospace',
                        marginTop: '0.2rem',
                        fontWeight: 500,
                        display: 'block'
                      }}>
                        {shippingFieldErrors.phone}
                      </span>
                    )}
                  </div>
                </div>

                {/* Row 3: Address (Full Width) */}
                <div className="form-group">
                  <label>Address</label>
                  <input
                    name="address"
                    type="text"
                    placeholder="Street, Building, Flat No."
                    value={formData.address}
                    onChange={handleChange}
                    style={shippingFieldErrors.address ? { borderColor: '#ef4444' } : undefined}
                  />
                  {shippingFieldErrors.address && (
                    <span className="field-error-text" style={{
                      color: '#ef4444',
                      fontSize: '0.68rem',
                      fontFamily: 'var(--font-dm-mono), monospace',
                      marginTop: '0.2rem',
                      fontWeight: 500,
                      display: 'block'
                    }}>
                      {shippingFieldErrors.address}
                    </span>
                  )}
                </div>

                {/* Row 4: City & Pincode (Side by Side in 2 Columns) */}
                <div className="form-row form-row-split">
                  <div className="form-group">
                    <label>City</label>
                    <input
                      name="city"
                      type="text"
                      placeholder="Mumbai"
                      value={formData.city}
                      onChange={handleChange}
                      style={shippingFieldErrors.city ? { borderColor: '#ef4444' } : undefined}
                    />
                    {shippingFieldErrors.city && (
                      <span className="field-error-text" style={{
                        color: '#ef4444',
                        fontSize: '0.68rem',
                        fontFamily: 'var(--font-dm-mono), monospace',
                        marginTop: '0.2rem',
                        fontWeight: 500,
                        display: 'block'
                      }}>
                        {shippingFieldErrors.city}
                      </span>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Pincode</label>
                    <input
                      name="pincode"
                      type="text"
                      placeholder="400001"
                      value={formData.pincode}
                      onChange={handleChange}
                      style={shippingFieldErrors.pincode ? { borderColor: '#ef4444' } : undefined}
                    />
                    {shippingFieldErrors.pincode && (
                      <span className="field-error-text" style={{
                        color: '#ef4444',
                        fontSize: '0.68rem',
                        fontFamily: 'var(--font-dm-mono), monospace',
                        marginTop: '0.2rem',
                        fontWeight: 500,
                        display: 'block'
                      }}>
                        {shippingFieldErrors.pincode}
                      </span>
                    )}
                  </div>
                </div>

                {/* Row 5: State */}
                <div className="form-group">
                  <label>State</label>
                  <div className="checkout-select-wrapper">
                    <select
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      style={shippingFieldErrors.state ? { borderColor: '#ef4444' } : undefined}
                    >
                      <option value="">Select State</option>
                      {INDIAN_STATES.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="checkout-select-arrow" />
                  </div>
                  {shippingFieldErrors.state && (
                    <span className="field-error-text" style={{
                      color: '#ef4444',
                      fontSize: '0.68rem',
                      fontFamily: 'var(--font-dm-mono), monospace',
                      marginTop: '0.2rem',
                      fontWeight: 500,
                      display: 'block'
                    }}>
                      {shippingFieldErrors.state}
                    </span>
                  )}
                </div>

                {/* === PC MODE: SELECT DELIVERY ADDRESS SECTION (DISPLAY ONLY IF USER HAS SAVED LOCATIONS) === */}
                {savedAddresses && savedAddresses.length > 0 && (
                  <div className="drapza-delivery-box checkout-desktop-only">
                    <div className="drapza-delivery-header">
                      <div className="drapza-delivery-header-left">
                        <div className="drapza-delivery-badge">
                          <MapPin size={16} strokeWidth={2.2} />
                        </div>
                        <span className="drapza-delivery-header-title">SELECT DELIVERY ADDRESS</span>
                      </div>
                    </div>

                    <div className="drapza-delivery-divider" />

                    {/* Address Cards List */}
                    {isAddressesLoading ? (
                      <AddressesSkeleton count={2} isCheckoutVariant={true} />
                    ) : (
                      <div className="drapza-cards-container">
                        {savedAddresses.map((addr) => {
                          const isSelected = addr._id === selectedAddressId;
                          const fullName =
                            addr.fullName || `${addr.firstName || ''} ${addr.lastName || ''}`.trim() || 'Client';
                          const isHome = (addr.addressType || 'Home').toLowerCase() === 'home';

                          return (
                            <div
                              key={addr._id}
                              className={`drapza-card ${isSelected ? 'selected' : 'unselected'}`}
                              onClick={() => applyAddressToForm(addr)}
                            >
                              <div>
                                <div className="drapza-card-top">
                                  <div className="drapza-card-type">
                                    {isHome ? <Home /> : <Briefcase />}
                                    <span>{addr.addressType || (isHome ? 'Home' : 'Office')}</span>
                                  </div>
                                  <div className="drapza-radio">
                                    {isSelected && <div className="drapza-radio-dot" />}
                                  </div>
                                </div>

                                <div className="drapza-card-name">{fullName}</div>

                                <div className="drapza-card-address">
                                  {addr.houseFlat ? `${addr.houseFlat}, ` : ''}
                                  {addr.streetArea || addr.address}
                                  {addr.landmark ? `, Near ${addr.landmark}` : ''}
                                  <br />
                                  {addr.city} - {addr.pincode}
                                </div>
                              </div>

                              <div className="drapza-card-bottom">
                                <div className="drapza-card-phone">
                                  {isHome ? (
                                    <MapPin size={13} style={{ width: '13px', height: '13px', flexShrink: 0 }} />
                                  ) : (
                                    <Phone size={13} style={{ width: '13px', height: '13px', flexShrink: 0 }} />
                                  )}
                                  <span>+91 {addr.phone}</span>
                                </div>

                                <div className="drapza-card-actions">
                                  <button
                                    type="button"
                                    className="drapza-card-action-btn"
                                    onClick={(e) => handleOpenEditForm(addr, e)}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    className="drapza-card-action-btn delete"
                                    onClick={(e) => handlePromptDelete(addr, e)}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* === MOBILE MODE: SELECT DELIVERY ADDRESS CARD (DISPLAY ONLY IF USER HAS SAVED LOCATIONS) === */}
                {savedAddresses && savedAddresses.length > 0 && (
                  <div className="drapza-delivery-box checkout-mobile-only">
                    <div className="drapza-delivery-header">
                      <div className="drapza-delivery-header-left">
                        <div className="drapza-delivery-badge">
                          <MapPin size={15} strokeWidth={2.2} />
                        </div>
                        <span className="drapza-delivery-header-title">SELECT DELIVERY ADDRESS</span>
                      </div>
                    </div>

                    <div className="drapza-delivery-divider" />

                    {isAddressesLoading ? (
                      <AddressesSkeleton count={1} isCheckoutVariant={true} />
                    ) : (
                      <div className="checkout-saved-list">
                        {savedAddresses.map((addr) => {
                          const isSelected = addr._id === selectedAddressId;
                          const isHome = (addr.addressType || 'Home').toLowerCase() === 'home';

                          return (
                            <div
                              key={addr._id}
                              className={`checkout-address-card-main ${isSelected ? 'selected' : ''}`}
                              onClick={() => applyAddressToForm(addr)}
                            >
                              <div className={`checkout-radio-circle ${isSelected ? 'selected' : 'unselected'}`}>
                                {isSelected && <div className="checkout-radio-dot" />}
                              </div>

                              <div className="checkout-address-home-icon">
                                {isHome ? <Home size={18} strokeWidth={1.8} /> : <Briefcase size={18} strokeWidth={1.8} />}
                              </div>

                              <div className="checkout-address-body">
                                <div className="checkout-address-type-row">
                                  <span className="checkout-address-type-label">
                                    {addr.addressType || (isHome ? 'HOME' : 'OFFICE')}
                                  </span>
                                  {isSelected && <span className="checkout-saved-badge">SAVED</span>}
                                </div>

                                <div className="checkout-address-lines">
                                  <div>
                                    {addr.houseFlat ? `${addr.houseFlat}, ` : ''}
                                    {addr.streetArea || addr.address}
                                    {addr.landmark ? `, Near ${addr.landmark}` : ''}
                                  </div>
                                  <div>
                                    {addr.city}, {addr.state} - {addr.pincode}
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Desktop inside-form submit button (Hidden on Mobile via CSS) */}
                <div className="checkout-desktop-submit">
                  <button
                    type="submit"
                    className="checkout-submit-btn-row"
                    disabled={isSubmitting || cartItems.length === 0}
                    style={{ color: '#ffffff' }}
                  >
                    <span style={{ margin: '0 auto', paddingLeft: '1.5rem', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                      {isSubmitting ? 'PREPARING PAYMENT...' : `PLACE ORDER — ₹${finalSubtotal.toFixed(2)}`}
                    </span>
                    {!isSubmitting && <ArrowRight color="#ffffff" />}
                  </button>
                </div>
              </form>
            </div>

            <div className="checkout-summary-wrap">
              <div className="checkout-summary">
                {/* Header with Koulen and clean subtle dashed divider matching reference */}
                <div style={{ paddingBottom: '14px', borderBottom: '1px dashed rgba(255, 255, 255, 0.18)', marginBottom: '16px' }}>
                  <h5 style={{
                    margin: 0,
                    fontSize: '1.95rem',
                    fontWeight: 400,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: '#ffffff',
                    fontFamily: 'var(--font-koulen), sans-serif',
                    lineHeight: 1,
                    borderBottom: 'none',
                    paddingBottom: 0
                  }}>
                    ORDER SUMMARY
                  </h5>
                </div>

                {cartItems.length === 0 ? (
                  <p className="checkout-empty" style={{ fontFamily: 'var(--font-dm-mono, "DM Mono", monospace)' }}>Your bag is empty.</p>
                ) : (
                  <>
                    <div className="checkout-summary-items" style={{ marginTop: '4px' }}>
                      {cartItems.map((item, idx) => {
                        const qty = Number(item.quantity) || 1;
                        const itemPrice = parseFloat(item.price) || 0;
                        const origPrice = parseFloat(item.originalPrice) || itemPrice;
                        const itemTotal = (itemPrice * qty).toFixed(2);
                        const origTotal = (origPrice * qty).toFixed(2);
                        const hasSavings = origPrice > itemPrice;
                        const itemKey = item.cartItemId || idx;
                        const itemImage = item.image || item.image_url || (item.images && item.images[0]) || '/products/product_1.png';

                        return (
                          <div
                            className="checkout-summary-item"
                            key={itemKey}
                          >
                            {/* Product Thumbnail (Exact Match to Screenshot - Face side focused) */}
                            <img
                              src={itemImage}
                              alt={item.name}
                              className="checkout-item-thumb"
                              style={{
                                objectFit: 'cover',
                                objectPosition: 'top center',
                              }}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = '/products/product_1.png';
                              }}
                            />

                            {/* Center: Item Title & QTY */}
                            <div className="checkout-item-details">
                              <span className="checkout-item-title">
                                {item.name}
                              </span>
                              <span className="checkout-item-qty-tag">
                                QTY: {qty}
                              </span>

                              {/* Bundle / Tier Tag if applicable */}
                              {item.bundleTag && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                                  <span
                                    style={{
                                      fontSize: '9.5px',
                                      fontFamily: 'var(--font-dm-mono, monospace)',
                                      fontWeight: 500,
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.05em',
                                      color: '#a1a1aa',
                                    }}
                                  >
                                    [{item.bogoTier?.name || item.bundleTag}
                                    {item.bundleUnits > 1 ? ` • ${item.bundleUnits} pcs` : ''}]
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Right: Pricing */}
                            <div className="checkout-item-price-val">
                              ₹{Number(itemTotal).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              {hasSavings && (
                                <div style={{ fontSize: '11px', textDecoration: 'line-through', color: '#71717a', marginTop: '2px' }}>
                                  ₹{Number(origTotal).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* DIRECT APPLY COUPON SECTION */}
                    <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px dashed rgba(255, 255, 255, 0.15)' }}>
                      {!appliedCoupon ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
                            <input
                              type="text"
                              placeholder="ENTER COUPON CODE"
                              value={couponInput}
                              onChange={(e) => {
                                setCouponInput(e.target.value.toUpperCase());
                                if (couponMessage) setCouponMessage(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleApplyCoupon();
                                }
                              }}
                              disabled={isValidatingCoupon}
                              style={{
                                flex: 1,
                                backgroundColor: '#161619',
                                color: '#ffffff',
                                border: couponMessage?.type === 'error' ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.18)',
                                borderRadius: '8px',
                                padding: '10px 14px',
                                fontSize: '11.5px',
                                fontFamily: 'var(--font-dm-mono, monospace)',
                                letterSpacing: '0.05em',
                                outline: 'none',
                                textTransform: 'uppercase',
                                boxSizing: 'border-box',
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => handleApplyCoupon()}
                              disabled={isValidatingCoupon || !couponInput.trim()}
                              style={{
                                backgroundColor: '#ffffff',
                                color: '#000000',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '0 20px',
                                fontSize: '11.5px',
                                fontWeight: 600,
                                fontFamily: 'var(--font-dm-mono, monospace)',
                                letterSpacing: '0.06em',
                                textTransform: 'uppercase',
                                cursor: isValidatingCoupon || !couponInput.trim() ? 'not-allowed' : 'pointer',
                                opacity: isValidatingCoupon || !couponInput.trim() ? 0.6 : 1,
                                flexShrink: 0,
                                transition: 'opacity 0.2s',
                              }}
                            >
                              {isValidatingCoupon ? <Loader2 size={13} className="animate-spin" /> : 'APPLY'}
                            </button>
                          </div>

                          {couponMessage && (
                            <div style={{
                              fontSize: '0.68rem',
                              fontFamily: 'var(--font-dm-mono), monospace',
                              fontWeight: 500,
                              color: couponMessage.type === 'error' ? '#ef4444' : '#ffffff',
                              marginTop: '0.2rem',
                              display: 'block',
                            }}>
                              {couponMessage.text}
                            </div>
                          )}

                          {/* Quick Tap Suggested Coupons */}
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                            <button
                              type="button"
                              onClick={() => {
                                setCouponInput('WELCOME10');
                                handleApplyCoupon('WELCOME10');
                              }}
                              className="hover:bg-white/15 transition-colors"
                              style={{
                                background: '#1c1c20',
                                border: '1px solid rgba(255, 255, 255, 0.25)',
                                borderRadius: '6px',
                                padding: '5px 11px',
                                color: '#ffffff',
                                fontSize: '11px',
                                fontFamily: 'var(--font-dm-mono, monospace)',
                                letterSpacing: '0.04em',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                              }}
                            >
                              <span style={{ fontWeight: 700, color: '#ffffff' }}>WELCOME10</span>
                              <span style={{ color: 'rgba(255, 255, 255, 0.35)' }}>•</span>
                              <span style={{ color: '#e4e4e7', fontWeight: 500 }}>10% OFF</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setCouponInput('SAVE200');
                                handleApplyCoupon('SAVE200');
                              }}
                              className="hover:bg-white/15 transition-colors"
                              style={{
                                background: '#1c1c20',
                                border: '1px solid rgba(255, 255, 255, 0.25)',
                                borderRadius: '6px',
                                padding: '5px 11px',
                                color: '#ffffff',
                                fontSize: '11px',
                                fontFamily: 'var(--font-dm-mono, monospace)',
                                letterSpacing: '0.04em',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                              }}
                            >
                              <span style={{ fontWeight: 700, color: '#ffffff' }}>SAVE200</span>
                              <span style={{ color: 'rgba(255, 255, 255, 0.35)' }}>•</span>
                              <span style={{ color: '#e4e4e7', fontWeight: 500 }}>₹200 OFF</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          backgroundColor: 'rgba(255, 255, 255, 0.06)',
                          border: '1px solid rgba(255, 255, 255, 0.15)',
                          borderRadius: '8px',
                          padding: '10px 14px',
                          fontFamily: 'var(--font-dm-mono, monospace)',
                          boxSizing: 'border-box',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              backgroundColor: '#ffffff',
                              color: '#000000',
                              padding: '2px 7px',
                              borderRadius: '4px',
                              fontSize: '10.5px',
                              fontWeight: 700,
                              letterSpacing: '0.06em',
                            }}>
                              {appliedCoupon.code}
                            </span>
                            <span style={{ fontSize: '11.5px', color: '#d4d4d8', fontWeight: 500 }}>
                              SAVED ₹{couponDiscount.toFixed(2)}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={handleRemoveCoupon}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#a1a1aa',
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              padding: '2px 4px',
                              textTransform: 'uppercase',
                              transition: 'color 0.2s',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = '#a1a1aa')}
                          >
                            REMOVE
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Dashed line before breakdown */}
                    <div className="checkout-summary-dashed-line" />

                    {/* Breakdown Rows: Discount & GST */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {couponDiscount > 0 && (
                        <div className="checkout-breakdown-row">
                          <span className="checkout-breakdown-label">
                            DISCOUNT ({appliedCoupon?.code || 'WELCOME10'})
                          </span>
                          <span className="checkout-breakdown-val">
                            - ₹{Number(couponDiscount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}

                      {isGstActive && gstRate > 0 && (
                        <div className="checkout-breakdown-row">
                          <span className="checkout-breakdown-label">
                            {isExclusiveGst ? `GST (${gstRate}%)` : `GST (${gstRate}%)`}
                          </span>
                          <span className="checkout-breakdown-val">
                            {isExclusiveGst ? `+ ₹${gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : `₹${gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Dashed line before Total */}
                    <div className="checkout-summary-dashed-line" />

                    {/* TOTAL ROW */}
                    <div className="checkout-total-row">
                      <span className="checkout-total-label">
                        TOTAL
                      </span>
                      <span className="checkout-total-val">
                        ₹{Number(checkoutTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Dedicated Mobile Action Button (Exact Reference Match) */}
              <div className="checkout-mobile-cta-section">
                <button
                  type="submit"
                  form="checkout-form"
                  onClick={handleSubmit}
                  className="checkout-continue-btn"
                  disabled={isSubmitting || cartItems.length === 0}
                >
                  <span>
                    {isSubmitting ? (
                      <>
                        <Loader2 size={16} className="animate-spin" style={{ display: 'inline', marginRight: '8px' }} />
                        PREPARING PAYMENT...
                      </>
                    ) : (
                      'CONTINUE TO PAYMENT'
                    )}
                  </span>
                  {!isSubmitting && <ArrowRight size={18} strokeWidth={2.2} />}
                </button>

                <div className="checkout-security-subtext">
                  <Lock size={12} strokeWidth={2} />
                  <span>SECURE CHECKOUT • 256-BIT ENCRYPTION</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ADD / EDIT ADDRESS MODAL - EXACT PIXEL-PERFECT MATCH TO USER SCREENSHOT */}
      {isAddressModalOpen && (
        <div
          className="drapza-modal-overlay"
          data-lenis-prevent="true"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddressModalOpen(false);
          }}
        >
          <div
            className="drapza-modal-card"
            data-lenis-prevent="true"
            onWheel={(e) => {
              e.stopPropagation();
            }}
          >
            {/* Header: Back arrow + Center Title & Subtitle + Close button */}
            <div className="drapza-modal-header">
              <button
                type="button"
                className="drapza-modal-back-btn"
                onClick={() => setIsAddressModalOpen(false)}
                aria-label="Back"
              >
                <ChevronLeft size={24} strokeWidth={2} />
              </button>
              <div className="drapza-modal-header-center">
                <h3 className="drapza-modal-title">
                  {editingAddressId ? 'Edit Delivery Address' : 'Add Delivery Address'}
                </h3>
                <p className="drapza-modal-subtitle">Save your address for faster checkout</p>
              </div>
              <button
                type="button"
                className="drapza-modal-close-btn"
                onClick={() => setIsAddressModalOpen(false)}
                aria-label="Close"
              >
                <X size={22} strokeWidth={2} />
              </button>
            </div>

            <form onSubmit={handleSaveAddress} className="drapza-modal-form" noValidate>
              {/* Field 1: Full Name */}
              <div className="drapza-modal-field">
                <label className="drapza-modal-label">
                  Full Name <span className="drapza-modal-asterisk">*</span>
                </label>
                <div className="drapza-input-wrap">
                  <User size={18} strokeWidth={1.8} className="drapza-input-icon" />
                  <input
                    type="text"
                    className="drapza-modal-input-with-icon"
                    placeholder="CO LI SA"
                    value={addressModalForm.fullName}
                    onChange={(e) => {
                      setAddressModalForm({ ...addressModalForm, fullName: e.target.value });
                      if (addressFormErrors.fullName) setAddressFormErrors({ ...addressFormErrors, fullName: '' });
                    }}
                  />
                </div>
                {addressFormErrors.fullName && (
                  <div className="drapza-modal-field-error">{addressFormErrors.fullName}</div>
                )}
              </div>

              {/* Field 2: Phone Number (10 Digits) */}
              <div className="drapza-modal-field">
                <label className="drapza-modal-label">
                  Phone Number (10 Digits) <span className="drapza-modal-asterisk">*</span>
                </label>
                <div className="drapza-input-wrap">
                  <Phone size={18} strokeWidth={1.8} className="drapza-input-icon" />
                  <input
                    type="tel"
                    className="drapza-modal-input-with-icon"
                    placeholder="9794603102"
                    maxLength={10}
                    value={addressModalForm.phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setAddressModalForm({ ...addressModalForm, phone: val });
                      if (addressFormErrors.phone) setAddressFormErrors({ ...addressFormErrors, phone: '' });
                    }}
                  />
                </div>
                {addressFormErrors.phone && (
                  <div className="drapza-modal-field-error">{addressFormErrors.phone}</div>
                )}
              </div>

              {/* Field 3: Address Type */}
              <div className="drapza-modal-field">
                <label className="drapza-modal-label">Address Type</label>
                <div className="drapza-type-cards">
                  {[
                    { key: 'Office', label: 'OFFICE', icon: Home },
                    { key: 'Other', label: 'OTHER', icon: LayoutGrid },
                    { key: 'Home', label: 'HOME', icon: Briefcase },
                  ].map(({ key, label, icon: IconComp }) => {
                    const isSelected = (addressModalForm.addressType || 'Home').toLowerCase() === key.toLowerCase();
                    return (
                      <button
                        key={key}
                        type="button"
                        className={`drapza-type-pill ${isSelected ? 'active' : ''}`}
                        onClick={() => setAddressModalForm({ ...addressModalForm, addressType: key })}
                      >
                        <IconComp size={18} strokeWidth={2} />
                        <span>{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Field 4: Flat / House / Building No. */}
              <div className="drapza-modal-field">
                <label className="drapza-modal-label">
                  Flat / House / Building No. <span className="drapza-modal-asterisk">*</span>
                </label>
                <div className="drapza-input-wrap">
                  <Home size={18} strokeWidth={1.8} className="drapza-input-icon" />
                  <input
                    type="text"
                    className="drapza-modal-input-with-icon"
                    placeholder="123, Green Park"
                    value={addressModalForm.houseFlat}
                    onChange={(e) => {
                      setAddressModalForm({ ...addressModalForm, houseFlat: e.target.value });
                      if (addressFormErrors.houseFlat) setAddressFormErrors({ ...addressFormErrors, houseFlat: '' });
                    }}
                  />
                </div>
                {addressFormErrors.houseFlat && (
                  <div className="drapza-modal-field-error">{addressFormErrors.houseFlat}</div>
                )}
              </div>

              {/* Field 5: Street / Area / Road */}
              <div className="drapza-modal-field">
                <label className="drapza-modal-label">
                  Street / Area / Road <span className="drapza-modal-asterisk">*</span>
                </label>
                <div className="drapza-input-wrap">
                  <MapPin size={18} strokeWidth={1.8} className="drapza-input-icon" />
                  <input
                    type="text"
                    className="drapza-modal-input-with-icon"
                    placeholder="Near Metro Station, Andheri West"
                    value={addressModalForm.streetArea}
                    onChange={(e) => {
                      setAddressModalForm({ ...addressModalForm, streetArea: e.target.value });
                      if (addressFormErrors.streetArea) setAddressFormErrors({ ...addressFormErrors, streetArea: '' });
                    }}
                  />
                </div>
                {addressFormErrors.streetArea && (
                  <div className="drapza-modal-field-error">{addressFormErrors.streetArea}</div>
                )}
              </div>

              {/* Field 6: Landmark (Optional) */}
              <div className="drapza-modal-field">
                <label className="drapza-modal-label">Landmark (Optional)</label>
                <div className="drapza-input-wrap">
                  <Building2 size={18} strokeWidth={1.8} className="drapza-input-icon" />
                  <input
                    type="text"
                    className="drapza-modal-input-with-icon"
                    placeholder="Near Metro Station"
                    value={addressModalForm.landmark}
                    onChange={(e) => setAddressModalForm({ ...addressModalForm, landmark: e.target.value })}
                  />
                </div>
              </div>

              {/* Field 7: City, State, Pincode (Three columns) */}
              <div className="drapza-modal-row-3">
                <div className="drapza-modal-field">
                  <label className="drapza-modal-label">
                    City <span className="drapza-modal-asterisk">*</span>
                  </label>
                  <div className="drapza-input-wrap">
                    <Map size={17} strokeWidth={1.8} className="drapza-input-icon" />
                    <input
                      type="text"
                      className="drapza-modal-input-with-icon"
                      placeholder="Mumbai"
                      value={addressModalForm.city}
                      onChange={(e) => {
                        setAddressModalForm({ ...addressModalForm, city: e.target.value });
                        if (addressFormErrors.city) setAddressFormErrors({ ...addressFormErrors, city: '' });
                      }}
                    />
                  </div>
                  {addressFormErrors.city && (
                    <div className="drapza-modal-field-error">{addressFormErrors.city}</div>
                  )}
                </div>

                <div className="drapza-modal-field">
                  <label className="drapza-modal-label">
                    State <span className="drapza-modal-asterisk">*</span>
                  </label>
                  <div className="drapza-modal-select-wrap">
                    <Signpost size={17} strokeWidth={1.8} className="drapza-input-icon" />
                    <select
                      className="drapza-modal-select-with-icon"
                      value={addressModalForm.state}
                      onChange={(e) => {
                        setAddressModalForm({ ...addressModalForm, state: e.target.value });
                        if (addressFormErrors.state) setAddressFormErrors({ ...addressFormErrors, state: '' });
                      }}
                    >
                      {INDIAN_STATES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                    <span className="drapza-modal-select-chevron">
                      <ChevronDown size={16} strokeWidth={2} />
                    </span>
                  </div>
                  {addressFormErrors.state && (
                    <div className="drapza-modal-field-error">{addressFormErrors.state}</div>
                  )}
                </div>

                <div className="drapza-modal-field">
                  <label className="drapza-modal-label">
                    Pincode <span className="drapza-modal-asterisk">*</span>
                  </label>
                  <div className="drapza-input-wrap">
                    <Building size={17} strokeWidth={1.8} className="drapza-input-icon" />
                    <input
                      type="text"
                      className="drapza-modal-input-with-icon"
                      maxLength={6}
                      placeholder="400053"
                      value={addressModalForm.pincode}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setAddressModalForm({ ...addressModalForm, pincode: val });
                        if (addressFormErrors.pincode) setAddressFormErrors({ ...addressFormErrors, pincode: '' });
                      }}
                    />
                  </div>
                  {addressFormErrors.pincode && (
                    <div className="drapza-modal-field-error">{addressFormErrors.pincode}</div>
                  )}
                </div>
              </div>

              {/* Default Address Checkbox */}
              <div
                className="drapza-modal-default-row"
                onClick={() => setAddressModalForm((prev) => ({ ...prev, isDefault: !prev.isDefault }))}
              >
                <div className={`drapza-custom-checkbox ${addressModalForm.isDefault ? 'checked' : ''}`}>
                  {addressModalForm.isDefault && (
                    <Check size={13} strokeWidth={3} color="#ffffff" />
                  )}
                </div>
                <div className="drapza-custom-checkbox-text">
                  <div className="drapza-custom-checkbox-label">Set as default delivery address</div>
                  <div className="drapza-custom-checkbox-sub">Use this address for future orders</div>
                </div>
              </div>

              {addressFormErrors.submit && (
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    borderRadius: '0.5rem',
                    color: '#dc2626',
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginBottom: '1rem',
                  }}
                >
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{addressFormErrors.submit}</span>
                </div>
              )}

              {/* Bottom Action Button (Full-width Save Address Pill Button) */}
              <div className="drapza-modal-actions-single">
                <button
                  type="submit"
                  className="drapza-modal-btn-save-full"
                  disabled={isAddingAddress || isUpdatingAddress}
                >
                  {isAddingAddress || isUpdatingAddress ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Saving Address...</span>
                    </>
                  ) : (
                    <span>Save Address</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        title="DELETE DELIVERY ADDRESS"
        subtitle="[ ADDRESS REPOSITORY ]"
        message="Are you sure you want to permanently delete this delivery address? This action cannot be undone."
        confirmLabel="DELETE ADDRESS"
        cancelLabel="KEEP ADDRESS"
        isDestructive={true}
        variant="danger"
        theme="drapza"
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setAddressToDelete(null);
        }}
      />

      <ContactForm />
      <Footer navigate={navigate} />
    </>
  );
};

export default CheckoutPage;
