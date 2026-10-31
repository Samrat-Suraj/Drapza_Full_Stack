'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '../context/CartContext';
import {
  Lock,
  ArrowLeft,
  AlertCircle,
  Check,
  Loader2,
  Clock,
  ChevronRight,
  ChevronLeft,
  Zap,
  ArrowRight,
  Truck,
} from 'lucide-react';
import { ContactForm } from '../components/ContactForm';
import { Footer } from '../components/Footer';
import { OrderConfirmationView } from '../components/OrderConfirmationView';
import {
  paymentConfigApi,
  DEFAULT_PAYMENT_CONFIG,
  couponApi,
  gstConfigApi,
  DEFAULT_GST_CONFIG,
  shippingConfigApi,
  DEFAULT_SHIPPING_CONFIG,
} from '../lib/api';
import { couponCodeInputSchema, getZodErrorMessage } from '../lib/validation';
import '../styles/payment.css';

const DELIVERY_OPTIONS = [
  {
    id: 'FAST',
    title: 'Fast Delivery',
    desc: 'Get your order in 1–3 days.',
    deliveryTime: '1 – 3 days',
    price: 99.0,
    priceDisplay: '₹99',
    type: 'fast',
  },
  {
    id: 'COMPLIMENTARY',
    title: 'Complimentary',
    desc: 'Free standard delivery (Online payment exclusive)',
    deliveryTime: '4 – 7 days',
    price: 0.0,
    priceDisplay: 'FREE',
    type: 'gift',
  },
];

// Dynamically load external payment scripts
const loadScript = (src) => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if (document.querySelector(`script[src="${src}"]`)) return resolve(true);

    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const PaymentPage = () => {
  const router = useRouter();
  const { cartItems, clearCart, subtotal: cartSubtotal } = useCart();

  const [checkoutSession, setCheckoutSession] = useState(null);
  const [deliveryOption, setDeliveryOption] = useState('FAST');
  const [paymentConfig, setPaymentConfig] = useState(DEFAULT_PAYMENT_CONFIG);
  const [gstConfig, setGstConfig] = useState(DEFAULT_GST_CONFIG);
  const [shippingConfig, setShippingConfig] = useState(DEFAULT_SHIPPING_CONFIG);
  const [paymentMethod, setPaymentMethod] = useState('COD'); // 'COD' | 'RAZORPAY' | 'CASHFREE'
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  // Coupon State
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [couponMessage, setCouponMessage] = useState(null);

  // Load live configurations from Admin CMS
  useEffect(() => {
    let isMounted = true;
    paymentConfigApi
      .getPaymentConfig()
      .then((res) => {
        if (isMounted && res && res.success && res.data) {
          setPaymentConfig(res.data);
        }
      })
      .catch((err) => {
        console.warn('Failed to load payment config, using defaults:', err);
      });

    gstConfigApi
      .getGstConfig()
      .then((res) => {
        if (isMounted && res && res.success && res.data) {
          setGstConfig(res.data);
        }
      })
      .catch((err) => {
        console.warn('Failed to load GST config, using defaults:', err);
      });

    shippingConfigApi
      .getConfig()
      .then((res) => {
        if (isMounted && res && res.success && res.config) {
          setShippingConfig(res.config);
        }
      })
      .catch((err) => {
        console.warn('Failed to load shipping config, using defaults:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Update paymentMethod based on live CMS defaults and enabled states
  useEffect(() => {
    if (!paymentConfig) return;
    const isCf = paymentConfig.cashfree?.isEnabled ?? true;
    const isRzp = paymentConfig.razorpay?.isEnabled ?? true;
    const isCod = paymentConfig.cod?.isEnabled ?? true;

    const def = paymentConfig.defaultMethod;
    if (def === 'CASHFREE' && isCf) {
      setPaymentMethod('CASHFREE');
    } else if (def === 'RAZORPAY' && isRzp) {
      setPaymentMethod('RAZORPAY');
    } else if (def === 'COD' && isCod) {
      setPaymentMethod('COD');
    } else if (isCf) {
      setPaymentMethod('CASHFREE');
    } else if (isRzp) {
      setPaymentMethod('RAZORPAY');
    } else if (isCod) {
      setPaymentMethod('COD');
    }
  }, [paymentConfig]);

  // Helper: authenticated headers
  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('drapza_token') : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  // Load checkout session from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (confirmedOrder) return;

    const token = localStorage.getItem('drapza_token');
    if (!token) {
      router.push('/login?redirect=/checkout');
      return;
    }

    try {
      const stored = localStorage.getItem('drapza_checkout_session');
      if (stored) {
        const parsed = JSON.parse(stored);
        setCheckoutSession(parsed);
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
      } else {
        // Check if an order was recently placed/confirmed
        const storedOrder = localStorage.getItem('drapza_latest_confirmed_order');
        if (storedOrder) {
          try {
            const parsedOrder = JSON.parse(storedOrder);
            if (parsedOrder && (parsedOrder.orderId || parsedOrder._id)) {
              setConfirmedOrder(parsedOrder);
              return;
            }
          } catch (e) { }
        }

        if (!cartItems || cartItems.length === 0) {
          router.push('/checkout');
        }
      }
    } catch (err) {
      console.error('Failed reading checkout session:', err);
    }
  }, [cartItems, router, confirmedOrder]);

  // Pricing calculations
  const itemsTotal = useMemo(() => {
    if (checkoutSession?.subtotal) return Number(checkoutSession.subtotal);
    if (cartSubtotal) return Number(cartSubtotal);
    return 0;
  }, [checkoutSession, cartSubtotal]);

  const orderItems = useMemo(() => {
    if (checkoutSession?.items && Array.isArray(checkoutSession.items) && checkoutSession.items.length > 0) {
      return checkoutSession.items;
    }
    return cartItems || [];
  }, [checkoutSession, cartItems]);

  // Online Gateway detection (Razorpay & Cashfree are online prepaid gateways)
  const isOnlinePayment = paymentMethod === 'RAZORPAY' || paymentMethod === 'CASHFREE';

  // Dynamic Shipping & Logistics from Admin CMS
  const freeShippingThreshold = Number(shippingConfig?.freeShippingThreshold ?? 1999);
  const expressShippingFee = Number(shippingConfig?.expressShippingFee ?? 99);
  const standardShippingFee = Number(shippingConfig?.standardShippingFee ?? 150);

  // Complimentary delivery is strictly for online gateway payments (FREE ₹0)
  // When Cash on Delivery (COD) is chosen, hide the COMPLIMENTARY delivery option entirely
  const deliveryOptions = useMemo(() => {
    const allOptions = [
      {
        id: 'FAST',
        title: 'FAST DELIVERY',
        desc: 'GET YOUR ORDER IN 1-3 DAYS.',
        deliveryTime: '1 - 3 DAYS',
        price: expressShippingFee,
        priceDisplay: expressShippingFee === 0 ? 'FREE' : `₹${expressShippingFee}`,
        type: 'fast',
        isAvailable: true,
      },
      {
        id: 'COMPLIMENTARY',
        title: 'COMPLIMENTARY',
        desc: 'FREE STANDARD DELIVERY (ONLINE PAYMENT EXCLUSIVE)',
        deliveryTime: '4 - 7 DAYS',
        price: 0,
        priceDisplay: 'FREE',
        type: 'gift',
        isAvailable: true,
        badge: 'ONLINE EXCLUSIVE',
      },
    ];

    // If Cash on Delivery, completely remove the free complimentary option
    if (!isOnlinePayment) {
      return allOptions.filter((opt) => opt.id !== 'COMPLIMENTARY');
    }
    return allOptions;
  }, [expressShippingFee, isOnlinePayment]);

  // If COD is selected, COMPLIMENTARY delivery cannot be used (enforce FAST delivery)
  const selectedDelivery = useMemo(() => {
    if (!isOnlinePayment && deliveryOption === 'COMPLIMENTARY') {
      return deliveryOptions.find((opt) => opt.id === 'FAST') || deliveryOptions[0];
    }
    return deliveryOptions.find((opt) => opt.id === deliveryOption) || deliveryOptions[0];
  }, [deliveryOptions, deliveryOption, isOnlinePayment]);

  // Enforce rule: If payment method is COD, automatically fallback deliveryOption from COMPLIMENTARY to FAST
  useEffect(() => {
    if (!isOnlinePayment && deliveryOption === 'COMPLIMENTARY') {
      setDeliveryOption('FAST');
    }
  }, [isOnlinePayment, deliveryOption]);

  const shippingFee = selectedDelivery ? Number(selectedDelivery.price || 0) : 0.0;

  const couponDiscount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.minOrderValue && itemsTotal < appliedCoupon.minOrderValue) {
      return 0;
    }
    if (appliedCoupon.discountType === 'percentage') {
      let disc = (itemsTotal * Number(appliedCoupon.discountAmount || 0)) / 100;
      if (appliedCoupon.maxDiscountAmount) {
        disc = Math.min(disc, Number(appliedCoupon.maxDiscountAmount));
      }
      return Math.round(disc);
    }
    return Math.min(itemsTotal, Number(appliedCoupon.calculatedDiscount || appliedCoupon.discountAmount || 0));
  }, [appliedCoupon, itemsTotal]);

  const finalSubtotal = Math.max(0, itemsTotal - couponDiscount);

  // Customer delivery details & PIN code verification from Admin CMS
  const customerPincode = useMemo(() => {
    const raw = checkoutSession?.address?.pincode || checkoutSession?.formData?.pincode || '';
    return String(raw).trim();
  }, [checkoutSession]);

  const isPincodeBlocked = useMemo(() => {
    if (!customerPincode || !shippingConfig?.blockedPincodes) return false;
    return (shippingConfig.blockedPincodes || []).map((p) => String(p).trim()).includes(customerPincode);
  }, [customerPincode, shippingConfig?.blockedPincodes]);

  const codMaxLimit = Number(shippingConfig?.codMaxOrderValue || 0);
  const isCodMaxExceeded = codMaxLimit > 0 && itemsTotal > codMaxLimit;
  const isCodEnabledStore = Boolean(shippingConfig?.codEnabled ?? true) && (paymentConfig?.cod?.isEnabled ?? true);
  const isCodEnabled = isCodEnabledStore;

  const isCodAvailable = isCodEnabledStore && !isPincodeBlocked && !isCodMaxExceeded;

  const codRestrictionReason = useMemo(() => {
    if (!isCodEnabledStore) return 'Cash on Delivery is currently disabled by store';
    if (isPincodeBlocked) return `COD unavailable for PIN ${customerPincode}`;
    if (isCodMaxExceeded) return `COD available only for orders up to ₹${codMaxLimit.toLocaleString('en-IN')}`;
    return '';
  }, [isCodEnabledStore, isPincodeBlocked, isCodMaxExceeded, customerPincode, codMaxLimit]);

  const isRazorpayEnabled = paymentConfig?.razorpay?.isEnabled ?? true;
  const isCashfreeEnabled = paymentConfig?.cashfree?.isEnabled ?? true;

  // Auto fallback if COD is currently selected but not available
  useEffect(() => {
    if (paymentMethod === 'COD' && !isCodAvailable) {
      if (isCashfreeEnabled) {
        setPaymentMethod('CASHFREE');
      } else if (isRazorpayEnabled) {
        setPaymentMethod('RAZORPAY');
      }
    }
  }, [paymentMethod, isCodAvailable, isCashfreeEnabled, isRazorpayEnabled]);

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
      return (base * gstRate) / (100 + gstRate);
    }
  }, [isGstActive, gstRate, isExclusiveGst, finalSubtotal]);

  const codHandlingFeeSetting = Number(shippingConfig?.codHandlingFee ?? paymentConfig?.cod?.extraFee ?? 0);
  const codFeeAmount = isCodAvailable ? codHandlingFeeSetting : 0;
  const codHandlingFee = paymentMethod === 'COD' && isCodAvailable ? codFeeAmount : 0.0;
  const totalPayable = Math.round((finalSubtotal + (isExclusiveGst ? gstAmount : 0) + codHandlingFee + shippingFee) * 100) / 100;

  const handleApplyCoupon = async (codeToApply = couponInput) => {
    const cleanCode = (codeToApply || '').trim().toUpperCase();
    const couponValidation = couponCodeInputSchema.safeParse({ code: cleanCode });
    if (!couponValidation.success) {
      setCouponMessage({ type: 'error', text: getZodErrorMessage(couponValidation.error) });
      return;
    }
    if (itemsTotal <= 0) {
      setCouponMessage({ type: 'error', text: 'Your bag is empty.' });
      return;
    }

    setIsValidatingCoupon(true);
    setCouponMessage(null);

    try {
      const res = await couponApi.validateCoupon(cleanCode, itemsTotal);
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

        // Sync with localStorage
        try {
          const stored = localStorage.getItem('drapza_checkout_session');
          if (stored) {
            const parsed = JSON.parse(stored);
            parsed.coupon = couponObj;
            parsed.couponCode = cleanCode;
            parsed.couponDiscount = discountVal;
            parsed.total = Math.max(0, itemsTotal - discountVal);
            localStorage.setItem('drapza_checkout_session', JSON.stringify(parsed));
          }
        } catch (e) { }
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

    try {
      const stored = localStorage.getItem('drapza_checkout_session');
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.coupon = null;
        parsed.couponCode = '';
        parsed.couponDiscount = 0;
        parsed.total = itemsTotal;
        localStorage.setItem('drapza_checkout_session', JSON.stringify(parsed));
      }
    } catch (e) { }
  };

  const buttonLabel = useMemo(() => {
    if (isProcessing) return 'PROCESSING...';
    const formatted = totalPayable.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `CONFIRM ORDER ₹${formatted}`;
  }, [totalPayable, isProcessing]);

  const cleanNumber = (val, fallback = 0) => {
    if (typeof val === 'number') return Number.isFinite(val) ? Math.max(0, val) : fallback;
    if (!val) return fallback;
    const n = parseFloat(String(val).replace(/[^\d.]/g, ''));
    return Number.isFinite(n) ? Math.max(0, n) : fallback;
  };

  const getCleanItems = (customItems = null) => {
    const list = customItems || checkoutSession?.items || cartItems || [];
    return list.map((i) => {
      const p = cleanNumber(i.price, 0);
      const op = cleanNumber(i.originalPrice, p);
      const safeOrig = Number.isFinite(op) && op >= p ? op : (Number.isFinite(p) ? p : 0);
      const refId = i.productId || i.product || i._id || (i.id && String(i.id).length === 24 ? i.id : undefined);
      return {
        ...i,
        productId: refId,
        product: refId,
        name: i.name || 'Atelier Garment',
        price: Number.isFinite(p) ? p : 0,
        originalPrice: Number.isFinite(safeOrig) ? safeOrig : (Number.isFinite(p) ? p : 0),
        quantity: Math.max(1, parseInt(i.quantity, 10) || 1),
        selectedSize: i.selectedSize || i.size || 'M',
      };
    });
  };

  // 1. Handle Cash on Delivery (COD)
  const handleCodSubmit = async () => {
    setIsProcessing(true);
    setErrorMessage('');

    try {
      const payload = {
        customer: checkoutSession?.customer || {
          firstName: 'Client',
          lastName: '',
          email: 'guest@drapza.com',
          phone: '9876543210',
        },
        address: checkoutSession?.address || {
          line1: 'Studio Address',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400053',
        },
        items: getCleanItems(),
        subtotal: itemsTotal,
        couponCode: appliedCoupon?.code || checkoutSession?.couponCode || '',
        couponDiscount: couponDiscount,
        discountAmount: couponDiscount,
        tax: gstAmount,
        gstAmount: gstAmount,
        shippingFee: shippingFee,
        deliveryOption: selectedDelivery,
        total: totalPayable,
        addressId: checkoutSession?.address?.addressId,
      };

      const res = await fetch('/api/payment/cod', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to place COD order.');
      }

      finalizeSuccessOrder(data.order);
    } catch (err) {
      console.error('COD Order Error:', err);
      setErrorMessage(err.message || 'Failed to confirm order. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Handle Razorpay Payment
  const handleRazorpaySubmit = async () => {
    setIsProcessing(true);
    setErrorMessage('');

    try {
      const scriptLoaded = await loadScript('https://checkout.razorpay.com/v1/checkout.js');
      if (!scriptLoaded) {
        throw new Error('Razorpay gateway failed to load. Please check your connection.');
      }

      const orderRes = await fetch('/api/payment/razorpay/create-order', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          amount: totalPayable,
          items: getCleanItems(),
          couponCode: appliedCoupon?.code || checkoutSession?.couponCode || '',
          deliveryOption: selectedDelivery,
          address: checkoutSession?.address,
          customer: checkoutSession?.customer,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.success) {
        throw new Error(orderData.message || 'Failed to initialize Razorpay transaction.');
      }

      const customer = checkoutSession?.customer || {};

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name: 'DRAPZA',
        description: 'Secure Order Payment',
        order_id: orderData.razorpayOrderId,
        prefill: {
          name: `${customer.firstName || 'Client'} ${customer.lastName || ''}`.trim(),
          email: customer.email || 'guest@drapza.com',
          contact: customer.phone || '9876543210',
        },
        theme: {
          color: '#0b0c0e',
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
          },
        },
        handler: async function (response) {
          try {
            const verifyRes = await fetch('/api/payment/razorpay/verify', {
              method: 'POST',
              headers: getAuthHeaders(),
              credentials: 'include',
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderDetails: {
                  customer: checkoutSession?.customer || {
                    firstName: 'Client',
                    lastName: '',
                    email: 'guest@drapza.com',
                    phone: '9876543210',
                  },
                  address: checkoutSession?.address || {
                    line1: 'Studio Address',
                    city: 'Mumbai',
                    state: 'Maharashtra',
                    pincode: '400053',
                  },
                  items: getCleanItems(),
                  subtotal: itemsTotal,
                  couponCode: appliedCoupon?.code || checkoutSession?.couponCode || '',
                  couponDiscount: couponDiscount,
                  discountAmount: couponDiscount,
                  tax: gstAmount,
                  gstAmount: gstAmount,
                  shippingFee: shippingFee,
                  deliveryOption: selectedDelivery,
                  total: totalPayable,
                  addressId: checkoutSession?.address?.addressId,
                },
              }),
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok || !verifyData.success) {
              throw new Error(verifyData.message || 'Payment verification failed.');
            }

            finalizeSuccessOrder(verifyData.order);
          } catch (verifyErr) {
            console.error('Razorpay verification error:', verifyErr);
            setErrorMessage(verifyErr.message || 'Payment verification error.');
            setIsProcessing(false);
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp) {
        setErrorMessage(resp.error?.description || 'Payment failed or declined.');
        setIsProcessing(false);
      });

      rzp.open();
    } catch (err) {
      console.error('Razorpay flow error:', err);
      setErrorMessage(err.message || 'Could not initiate Razorpay transaction.');
      setIsProcessing(false);
    }
  };

  // 3. Handle Cashfree Payment
  const handleCashfreeSubmit = async () => {
    setIsProcessing(true);
    setErrorMessage('');

    try {
      const scriptLoaded = await loadScript('https://sdk.cashfree.com/js/v3/cashfree.js');
      if (!scriptLoaded) {
        throw new Error('Cashfree gateway failed to load. Please check your connection.');
      }

      const orderRes = await fetch('/api/payment/cashfree/create-order', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({
          amount: totalPayable,
          items: getCleanItems(),
          couponCode: appliedCoupon?.code || checkoutSession?.couponCode || '',
          deliveryOption: selectedDelivery,
          address: checkoutSession?.address,
          customer: checkoutSession?.customer || {
            firstName: 'Client',
            lastName: '',
            email: 'guest@drapza.com',
            phone: '9876543210',
          },
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.success) {
        throw new Error(orderData.message || 'Failed to initialize Cashfree transaction.');
      }

      const isTestEnv = (orderData.cfEnv || 'TEST').toUpperCase() === 'TEST';
      const cashfree = window.Cashfree({
        mode: isTestEnv ? 'sandbox' : 'production',
      });

      cashfree
        .checkout({
          paymentSessionId: orderData.paymentSessionId,
          redirectTarget: '_modal',
        })
        .then(async (result) => {
          if (result.error) {
            setErrorMessage(result.error?.message || 'Payment cancelled.');
            setIsProcessing(false);
            return;
          }

          if (result.paymentDetails) {
            const verifyRes = await fetch('/api/payment/cashfree/verify', {
              method: 'POST',
              headers: getAuthHeaders(),
              credentials: 'include',
              body: JSON.stringify({
                cf_order_id: orderData.orderId,
                orderDetails: {
                  customer: checkoutSession?.customer || {
                    firstName: 'Client',
                    lastName: '',
                    email: 'guest@drapza.com',
                    phone: '9876543210',
                  },
                  address: checkoutSession?.address || {
                    line1: 'Studio Address',
                    city: 'Mumbai',
                    state: 'Maharashtra',
                    pincode: '400053',
                  },
                  items: getCleanItems(),
                  subtotal: itemsTotal,
                  couponCode: appliedCoupon?.code || checkoutSession?.couponCode || '',
                  couponDiscount: couponDiscount,
                  discountAmount: couponDiscount,
                  tax: gstAmount,
                  gstAmount: gstAmount,
                  shippingFee: shippingFee,
                  deliveryOption: selectedDelivery,
                  total: totalPayable,
                  addressId: checkoutSession?.address?.addressId,
                },
              }),
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok || !verifyData.success) {
              throw new Error(verifyData.message || 'Cashfree payment verification failed.');
            }

            finalizeSuccessOrder(verifyData.order);
          }
        })
        .catch((cfErr) => {
          console.error('Cashfree execution error:', cfErr);
          setErrorMessage(cfErr.message || 'Cashfree checkout error.');
          setIsProcessing(false);
        });
    } catch (err) {
      console.error('Cashfree flow error:', err);
      setErrorMessage(err.message || 'Could not initiate Cashfree transaction.');
      setIsProcessing(false);
    }
  };

  const handlePaymentAction = () => {
    if (paymentMethod === 'COD') {
      handleCodSubmit();
    } else if (paymentMethod === 'RAZORPAY') {
      handleRazorpaySubmit();
    } else if (paymentMethod === 'CASHFREE') {
      handleCashfreeSubmit();
    }
  };

  const finalizeSuccessOrder = (order) => {
    if (!order) return;
    const augmentedOrder = {
      ...order,
      shippingFee: order?.shippingFee ?? shippingFee,
      deliveryOption: order?.deliveryOption ?? selectedDelivery,
      total: order?.total ?? totalPayable,
    };
    setConfirmedOrder(augmentedOrder);

    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('drapza_checkout_session');
        localStorage.setItem('drapza_latest_confirmed_order', JSON.stringify(augmentedOrder));
        const stored = JSON.parse(localStorage.getItem('drapza_orders') || '[]');
        localStorage.setItem('drapza_orders', JSON.stringify([augmentedOrder, ...stored]));
        if (window.history && window.history.replaceState) {
          window.history.replaceState(
            {},
            '',
            `/order-confirmation?orderId=${encodeURIComponent(augmentedOrder.orderId || augmentedOrder.trackingRef || '')}`
          );
        }
      } catch (e) { }
    }

    clearCart();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Confirmation Screen
  if (confirmedOrder) {
    return <OrderConfirmationView order={confirmedOrder} />;
  }


  return (
    <>
      <div className="drapza-payment-page" data-payment-root="true">
        <div className="drapza-payment-main-content">
          <div className="drapza-payment-panel">
            {/* Header matching /checkout clean brutalist style */}
            <div style={{ paddingBottom: '16px', borderBottom: '1px dashed rgba(0, 0, 0, 0.15)', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => router.push('/checkout')}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    padding: 0,
                    margin: 0,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#000000',
                  }}
                  aria-label="Back to checkout"
                >
                  <ChevronLeft size={28} strokeWidth={2.4} style={{ width: '28px', height: '28px', flexShrink: 0 }} />
                </button>
                <h1 style={{
                  margin: 0,
                  fontSize: '2.1rem',
                  fontWeight: 400,
                  textTransform: 'uppercase',
                  letterSpacing: '0.03em',
                  color: '#000000',
                  fontFamily: 'var(--font-koulen), sans-serif',
                  lineHeight: 1,
                }}>
                  PAYMENT & DELIVERY
                </h1>
              </div>
              <p style={{ margin: '6px 0 0 36px', fontSize: '11.5px', color: '#71717a', letterSpacing: '0.04em', fontFamily: 'var(--font-dm-mono, "DM Mono", monospace)', textTransform: 'uppercase' }}>
                Select delivery option and your preferred payment method
              </p>
            </div>

            {/* Announcement Banner from Admin CMS */}
            {paymentConfig?.showNotice && paymentConfig?.announcementNotice && (
              <div
                style={{
                  backgroundColor: '#121316',
                  color: '#edf1e8',
                  padding: '0.85rem 1.25rem',
                  borderRadius: '10px',
                  marginBottom: '1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  fontSize: '0.78rem',
                  fontFamily: 'var(--font-dm-mono), monospace',
                  letterSpacing: '0.03em',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#ffffff',
                    boxShadow: '0 0 8px rgba(255, 255, 255, 0.4)',
                    flexShrink: 0,
                  }}
                />
                <span>{paymentConfig.announcementNotice}</span>
              </div>
            )}

            {/* Two-Column Grid */}
            <div className="drapza-payment-grid">
              {/* Left Column: Payment Options */}
              <div className="drapza-methods-col">
                {/* DELIVERY OPTION SELECTOR */}
                <div className="drapza-delivery-section">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <Truck size={15} strokeWidth={1.75} color="#000000" style={{ width: '15px', height: '15px', flexShrink: 0 }} />
                    <span style={{
                      fontFamily: 'var(--font-dm-mono), monospace',
                      fontSize: '12px',
                      fontWeight: 500,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      color: '#000000'
                    }}>
                      SELECT DELIVERY OPTION
                    </span>
                  </div>

                  <div className="drapza-delivery-cards-list" role="radiogroup" aria-label="Choose Delivery Option">
                    {deliveryOptions.map((opt) => {
                      const isSelected = deliveryOption === opt.id;

                      return (
                        <div
                          key={opt.id}
                          role="radio"
                          aria-checked={isSelected}
                          tabIndex={0}
                          aria-label={`${opt.title}, ${opt.deliveryTime}, ${opt.priceDisplay}`}
                          className={`drapza-deliv-card ${isSelected ? 'selected' : ''}`}
                          style={{
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                          onClick={() => setDeliveryOption(opt.id)}
                          onKeyDown={(e) => {
                            if (e.key === ' ' || e.key === 'Enter') {
                              e.preventDefault();
                              setDeliveryOption(opt.id);
                            }
                          }}
                        >
                          {/* Left Section */}
                          <div className="drapza-deliv-left">
                            {/* Radio Circle */}
                            <div className={`drapza-deliv-radio ${isSelected ? 'checked' : ''}`}>
                              {isSelected && <div className="drapza-deliv-radio-inner" />}
                            </div>

                            {/* Service Icon */}
                            <div className="drapza-deliv-icon">
                              {opt.type === 'fast' && (
                                <svg
                                  width="30"
                                  height="22"
                                  viewBox="0 0 32 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  style={{ width: '30px', height: '22px', flexShrink: 0 }}
                                >
                                  <path d="M2 7h5" />
                                  <path d="M1 11h7" />
                                  <path d="M3 15h4" />
                                  <rect x="9" y="4" width="13" height="13" rx="1" />
                                  <path d="M22 9h4.5l3.5 4.5v3.5a1 1 0 0 1-1 1h-2" />
                                  <path d="M22 9v5h6" />
                                  <circle cx="14" cy="18" r="2.2" />
                                  <circle cx="26" cy="18" r="2.2" />
                                </svg>
                              )}
                              {opt.type === 'gift' && (
                                <svg
                                  width="25"
                                  height="25"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.9"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  style={{ width: '25px', height: '25px', flexShrink: 0 }}
                                >
                                  <rect x="3" y="8" width="18" height="13" rx="2" />
                                  <path d="M12 8v13" />
                                  <path d="M3 12h18" />
                                  <path d="M12 8a3 3 0 0 0-3-3c-1.5 0-2.5 1-2.5 2 0 1.5 2 2 5.5 2z" />
                                  <path d="M12 8a3 3 0 0 1 3-3c1.5 0 2.5 1 2.5 2 0 1.5-2 2-5.5 2z" />
                                </svg>
                              )}
                            </div>

                            {/* Title & Description */}
                            <div className="drapza-deliv-info">
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <span className="drapza-deliv-name">{opt.title}</span>
                                {opt.id === 'COMPLIMENTARY' && (
                                  <span
                                    style={{
                                      fontSize: '9px',
                                      fontWeight: 500,
                                      letterSpacing: '0.06em',
                                      textTransform: 'uppercase',
                                      padding: '2px 7px',
                                      borderRadius: '3px',
                                      fontFamily: 'var(--font-dm-mono, monospace)',
                                      backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.16)' : '#121316',
                                      color: '#ffffff',
                                      border: isSelected ? '1px solid rgba(255, 255, 255, 0.28)' : '1px solid #121316',
                                    }}
                                  >
                                    ONLINE EXCLUSIVE
                                  </span>
                                )}
                              </div>
                              <p className="drapza-deliv-desc">{opt.desc}</p>
                            </div>
                          </div>

                          {/* Right Info Section */}
                          <div className="drapza-deliv-right">
                            <div className="drapza-deliv-pricing">
                              <div className="drapza-deliv-price-val">{opt.priceDisplay}</div>
                              <div className="drapza-deliv-time-val">
                                <Clock size={11} strokeWidth={2} style={{ width: '11px', height: '11px', flexShrink: 0 }} />
                                <span>{opt.deliveryTime}</span>
                              </div>
                            </div>

                            {/* Arrow */}
                            <div className="drapza-deliv-arrow">
                              <ChevronRight size={16} strokeWidth={2.2} style={{ width: '16px', height: '16px', flexShrink: 0 }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Flash Message Banner: Free Delivery on Online Payment when COD is chosen */}
                  {!isOnlinePayment && (
                    <div className="drapza-free-delivery-flash" role="alert">
                      <div className="drapza-flash-left">
                        <div className="drapza-flash-icon-box" aria-hidden="true">
                          <Zap size={16} fill="#ffffff" color="#ffffff" />
                        </div>
                        <div className="drapza-flash-content">
                          <div className="drapza-flash-title-row">
                            <span
                              className="drapza-flash-title"
                              style={{ color: '#ffffff', fontWeight: 500 }}
                            >
                              FREE DELIVERY IF YOU PAY ONLINE
                            </span>
                            <span className="drapza-flash-badge">
                              SAVE ₹{expressShippingFee}
                            </span>
                          </div>
                          <p
                            className="drapza-flash-desc"
                            style={{ color: '#d4d4d8' }}
                          >
                            Cash on Delivery has standard shipping. Switch to Online Payment (UPI, Card, Netbanking) for 100% Free Delivery!
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="drapza-flash-btn"
                        onClick={() => {
                          const targetGateway = isRazorpayEnabled ? 'RAZORPAY' : isCashfreeEnabled ? 'CASHFREE' : 'RAZORPAY';
                          setPaymentMethod(targetGateway);
                          setDeliveryOption('COMPLIMENTARY');
                        }}
                      >
                        <span>PAY ONLINE</span>
                        <ArrowRight size={13} strokeWidth={2.5} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: '5px' }} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Section Header: Payment Method */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '22px', marginBottom: '12px' }}>
                  <Lock size={15} strokeWidth={1.75} color="#000000" style={{ width: '15px', height: '15px', flexShrink: 0 }} />
                  <span style={{
                    fontFamily: 'var(--font-dm-mono), monospace',
                    fontSize: '12px',
                    fontWeight: 500,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: '#000000'
                  }}>
                    SELECT PAYMENT METHOD
                  </span>
                </div>

                <div className="drapza-pm-list" role="radiogroup" aria-label="Select Payment Method">
                  {/* OPTION 1: CASH ON DELIVERY */}
                  {isCodEnabledStore && (
                    <div
                      role="radio"
                      aria-checked={paymentMethod === 'COD'}
                      aria-disabled={!isCodAvailable}
                      tabIndex={isCodAvailable ? 0 : -1}
                      aria-label={`Cash on Delivery${codFeeAmount > 0 ? `, handling fee ₹${codFeeAmount}` : ''}${!isCodAvailable ? ` (${codRestrictionReason})` : ''}`}
                      className={`drapza-method-card ${paymentMethod === 'COD' && isCodAvailable ? 'selected' : ''}`}
                      style={!isCodAvailable ? { opacity: 0.65, cursor: 'not-allowed', filter: 'grayscale(0.4)' } : {}}
                      onClick={() => {
                        if (isCodAvailable) {
                          setPaymentMethod('COD');
                          if (deliveryOption === 'COMPLIMENTARY') {
                            setDeliveryOption('FAST');
                          }
                        }
                      }}
                      onKeyDown={(e) => {
                        if ((e.key === ' ' || e.key === 'Enter') && isCodAvailable) {
                          e.preventDefault();
                          setPaymentMethod('COD');
                          if (deliveryOption === 'COMPLIMENTARY') {
                            setDeliveryOption('FAST');
                          }
                        }
                      }}
                    >
                      <div className="drapza-method-top">
                        <div className="drapza-method-left">
                          <div className="drapza-method-radio">
                            {paymentMethod === 'COD' && isCodAvailable && <div className="drapza-method-radio-dot" />}
                          </div>

                          <div className="drapza-method-icon">
                            {/* Clean Banknote / Cash SVG */}
                            <svg
                              width="24"
                              height="16"
                              viewBox="0 0 24 16"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.6"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              style={{ width: '24px', height: '16px', minWidth: '24px', maxWidth: '24px', flexShrink: 0 }}
                            >
                              <rect x="1.5" y="1.5" width="21" height="13" rx="2" />
                              <circle cx="12" cy="8" r="3" />
                              <path d="M4.5 4.5h.01M19.5 11.5h.01" />
                            </svg>
                          </div>

                          <div className="drapza-method-details">
                            <div className="drapza-method-name">
                              {paymentConfig?.cod?.title || 'Cash on Delivery'}
                            </div>
                            <div className="drapza-method-sub">
                              {isCodAvailable
                                ? (paymentConfig?.cod?.subtitle || 'Pay when your order arrives.')
                                : codRestrictionReason}
                            </div>
                          </div>
                        </div>

                        <div
                          className="drapza-available-badge"
                          style={
                            !isCodAvailable
                              ? { backgroundColor: '#3f1f1f', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.4)' }
                              : {}
                          }
                        >
                          {isCodAvailable ? 'AVAILABLE' : 'UNAVAILABLE'}
                        </div>
                      </div>

                      <div
                        className="drapza-method-notice"
                        style={{
                          color: !isCodAvailable ? '#f87171' : paymentMethod === 'COD' ? '#e4e4e7' : '#7d807a',
                          borderTopColor: paymentMethod === 'COD' ? 'rgba(255, 255, 255, 0.25)' : 'var(--base-200, #d7dbd2)'
                        }}
                      >
                        {/* Fixed tiny 13px Info SVG strictly guarded */}
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{
                            width: '13px',
                            height: '13px',
                            minWidth: '13px',
                            minHeight: '13px',
                            maxWidth: '13px',
                            maxHeight: '13px',
                            flexShrink: 0,
                            display: 'inline-block',
                            color: !isCodAvailable ? '#f87171' : paymentMethod === 'COD' ? '#e4e4e7' : '#7d807a',
                            stroke: !isCodAvailable ? '#f87171' : paymentMethod === 'COD' ? '#e4e4e7' : '#7d807a'
                          }}
                        >
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="16" x2="12" y2="12" />
                          <line x1="12" y1="8" x2="12.01" y2="8" />
                        </svg>
                        <span style={{ color: !isCodAvailable ? '#f87171' : paymentMethod === 'COD' ? '#e4e4e7' : '#7d807a' }}>
                          {!isCodAvailable
                            ? codRestrictionReason
                            : codFeeAmount > 0
                              ? `COD handling fee applies (₹${codFeeAmount.toFixed(2)})`
                              : (paymentConfig?.cod?.note || 'Zero convenience fee upon delivery')}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* OPTION 2: RAZORPAY */}
                  {isRazorpayEnabled && (
                    <div
                      role="radio"
                      aria-checked={paymentMethod === 'RAZORPAY'}
                      tabIndex={0}
                      aria-label="Pay Online with Razorpay, UPI, cards, and net banking"
                      className={`drapza-method-card ${paymentMethod === 'RAZORPAY' ? 'selected' : ''}`}
                      onClick={() => setPaymentMethod('RAZORPAY')}
                      onKeyDown={(e) => {
                        if (e.key === ' ' || e.key === 'Enter') {
                          e.preventDefault();
                          setPaymentMethod('RAZORPAY');
                        }
                      }}
                    >
                      <div className="drapza-method-top">
                        <div className="drapza-method-left">
                          <div className="drapza-method-radio">
                            {paymentMethod === 'RAZORPAY' && <div className="drapza-method-radio-dot" />}
                          </div>

                          <div className="drapza-method-icon">
                            {/* Razorpay polygon mark */}
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" style={{ width: '22px', height: '22px', minWidth: '22px', maxWidth: '22px', flexShrink: 0 }}>
                              <path d="M4.5 21L12.5 3H17.5L9.5 21H4.5Z" />
                              <path d="M12 21L17.5 8.5H22.5L17 21H12Z" opacity="0.85" />
                            </svg>
                          </div>

                          <div className="drapza-method-details">
                            <div className="drapza-method-name">
                              {paymentConfig?.razorpay?.title || 'Pay Online with Razorpay'}
                              {paymentConfig?.razorpay?.badgeText && (
                                <span className="drapza-method-tag">
                                  {paymentConfig.razorpay.badgeText}
                                </span>
                              )}
                            </div>
                            <div className="drapza-method-sub">
                              {paymentConfig?.razorpay?.subtitle || 'Secure online payment using UPI, cards, and net banking.'}
                            </div>
                          </div>
                        </div>

                        <div className="drapza-brand-right">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" style={{ width: '15px', height: '15px', flexShrink: 0 }}>
                              <path d="M4.5 21L12.5 3H17.5L9.5 21H4.5Z" />
                              <path d="M12 21L17.5 8.5H22.5L17 21H12Z" opacity="0.85" />
                            </svg>
                            <span className="drapza-brand-title" style={{ fontWeight: 600, fontStyle: 'italic', fontSize: '1rem', letterSpacing: '-0.02em' }}>
                              Razorpay
                            </span>
                          </div>

                          <div className="drapza-brand-badges">
                            <span className="drapza-badge-text" style={{ fontWeight: 500, fontSize: '0.72rem', fontStyle: 'italic' }}>UPI</span>
                            <span className="drapza-badge-text" style={{ fontWeight: 500, fontSize: '0.72rem', letterSpacing: '0.04em' }}>VISA</span>
                            <svg width="20" height="13" viewBox="0 0 24 15" fill="none" style={{ width: '20px', height: '13px', flexShrink: 0 }}>
                              <circle cx="8" cy="7.5" r="6" fill="#eb001b" />
                              <circle cx="16" cy="7.5" r="6" fill="#f79e1b" fillOpacity="0.85" />
                            </svg>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '13px', height: '13px', flexShrink: 0 }}>
                              <path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M8 10v11M12 10v11M16 10v11M20 10v11" />
                            </svg>
                            <span className="drapza-badge-more" style={{ fontSize: '0.68rem' }}>+ more</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* OPTION 3: CASHFREE PAYMENTS */}
                  {isCashfreeEnabled && (
                    <div
                      role="radio"
                      aria-checked={paymentMethod === 'CASHFREE'}
                      tabIndex={0}
                      aria-label="Pay Online with Cashfree Payments"
                      className={`drapza-method-card ${paymentMethod === 'CASHFREE' ? 'selected' : ''}`}
                      onClick={() => setPaymentMethod('CASHFREE')}
                      onKeyDown={(e) => {
                        if (e.key === ' ' || e.key === 'Enter') {
                          e.preventDefault();
                          setPaymentMethod('CASHFREE');
                        }
                      }}
                    >
                      <div className="drapza-method-top">
                        <div className="drapza-method-left">
                          <div className="drapza-method-radio">
                            {paymentMethod === 'CASHFREE' && <div className="drapza-method-radio-dot" />}
                          </div>

                          <div className="drapza-method-icon">
                            {/* Cashfree geometric double-F mark */}
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" style={{ width: '22px', height: '22px', minWidth: '22px', maxWidth: '22px', flexShrink: 0 }}>
                              <path d="M4 4H10V8.5H6.5V11H9.5V14H6.5V20H4V4Z" />
                              <path d="M12 4H19.5V7H14.5V11H18.5V14H14.5V20H12V4Z" />
                            </svg>
                          </div>

                          <div className="drapza-method-details">
                            <div className="drapza-method-name">
                              {paymentConfig?.cashfree?.title || 'CASHFREE SECURE CHECKOUT (UPI, CARDS, NETBANKING)'}
                              {paymentConfig?.cashfree?.badgeText && (
                                <span className="drapza-method-tag">
                                  {paymentConfig.cashfree.badgeText}
                                </span>
                              )}
                            </div>
                            {paymentConfig?.cashfree?.subtitle && (
                              <div className="drapza-method-sub">
                                {paymentConfig.cashfree.subtitle}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="drapza-brand-right">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ width: '18px', height: '18px', flexShrink: 0 }}>
                              <path d="M4 4H10V8.5H6.5V11H9.5V14H6.5V20H4V4Z" />
                              <path d="M12 4H19.5V7H14.5V11H18.5V14H14.5V20H12V4Z" />
                            </svg>
                            <span className="drapza-brand-title" style={{ fontSize: '0.88rem', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                              CASHFREE
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* All Gateways Disabled Fallback */}
                {!isCodEnabled && !isRazorpayEnabled && !isCashfreeEnabled && (
                  <div style={{ padding: '24px', border: '1px dashed #e11d48', borderRadius: '8px', color: '#e11d48', textAlign: 'center', background: '#fff1f2' }}>
                    <div style={{ fontWeight: 700, marginBottom: '6px' }}>No Payment Gateways Available</div>
                    <div style={{ fontSize: '0.82rem', color: '#4b5563' }}>Payment gateways are currently under maintenance. Please contact support or try again later.</div>
                  </div>
                )}

                {/* Back to Checkout */}
                <div>
                  <button
                    type="button"
                    className="drapza-back-checkout-link"
                    onClick={() => router.push('/checkout')}
                  >
                    <ArrowLeft size={16} strokeWidth={2} style={{ width: '16px', height: '16px', flexShrink: 0 }} />
                    <span>Back to Checkout</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Order Summary */}
              <div className="drapza-summary-col">
                {/* Header with Koulen and clean subtle dashed divider matching CheckoutPage */}
                <div style={{ paddingBottom: '16px', borderBottom: '1px dashed rgba(255, 255, 255, 0.18)', marginBottom: '16px' }}>
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

                {orderItems.length === 0 ? (
                  <p style={{ color: '#71717a', fontSize: '12px', fontFamily: 'var(--font-dm-mono, "DM Mono", monospace)' }}>
                    Your bag is empty.
                  </p>
                ) : (
                  <>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {orderItems.map((item, idx) => {
                        const qty = Number(item.quantity) || 1;
                        const itemPrice = parseFloat(item.price) || 0;
                        const origPrice = parseFloat(item.originalPrice) || itemPrice;
                        const itemTotal = (itemPrice * qty).toFixed(2);
                        const origTotal = (origPrice * qty).toFixed(2);
                        const hasSavings = origPrice > itemPrice;
                        const itemKey = item.cartItemId || idx;

                        return (
                          <div
                            key={itemKey}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              padding: '10px 0',
                              borderBottom: '1px dashed rgba(255, 255, 255, 0.1)',
                              gap: '12px',
                            }}
                          >
                            {/* Left: Product Name & Meta */}
                            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                              <span
                                style={{
                                  fontSize: '12px',
                                  fontWeight: 600,
                                  color: '#ffffff',
                                  fontFamily: 'var(--font-dm-mono, monospace)',
                                  letterSpacing: '0.04em',
                                  textTransform: 'uppercase',
                                  lineHeight: 1.35,
                                  wordBreak: 'break-word',
                                }}
                              >
                                {item.name}
                              </span>
                              <span
                                style={{
                                  fontSize: '10.5px',
                                  color: '#71717a',
                                  fontFamily: 'var(--font-dm-mono, monospace)',
                                  letterSpacing: '0.03em',
                                  textTransform: 'uppercase',
                                  marginTop: '4px',
                                }}
                              >
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
                            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'flex-start', flexShrink: 0, minWidth: '70px' }}>
                              <span style={{ fontSize: '14.5px', fontWeight: 500, color: '#ffffff', fontFamily: 'var(--font-dm-mono, monospace)', letterSpacing: '0.02em' }}>
                                ₹{Number(itemTotal).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                              {hasSavings && (
                                <span style={{ fontSize: '11px', textDecoration: 'line-through', color: '#71717a', fontFamily: 'var(--font-dm-mono, monospace)', marginTop: '2px' }}>
                                  ₹{Number(origTotal).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* DIRECT APPLY COUPON SECTION (Always visible, dark brutalist styling) */}
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed rgba(255, 255, 255, 0.1)' }}>
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
                          backgroundColor: '#161619',
                          border: '1px solid rgba(255, 255, 255, 0.18)',
                          borderRadius: '8px',
                          padding: '10px 14px',
                          color: '#ffffff',
                          boxSizing: 'border-box',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              background: '#ffffff',
                              color: '#000000',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontFamily: 'var(--font-dm-mono, monospace)',
                              fontWeight: 700,
                              letterSpacing: '0.06em'
                            }}>
                              {appliedCoupon.code}
                            </span>
                            <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#ffffff', fontFamily: 'var(--font-dm-mono, monospace)' }}>
                              SAVED ₹{Number(couponDiscount).toFixed(2)}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={handleRemoveCoupon}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#f87171',
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              padding: '2px 6px',
                              fontFamily: 'var(--font-dm-mono, monospace)',
                              letterSpacing: '0.04em',
                              textTransform: 'uppercase'
                            }}
                          >
                            REMOVE
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Breakdown Totals */}
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px dashed rgba(255, 255, 255, 0.1)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {/* Subtotal Row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <span style={{ color: '#a1a1aa', fontSize: '12px', fontWeight: 500, letterSpacing: '0.04em', fontFamily: 'var(--font-dm-mono, monospace)', textTransform: 'uppercase' }}>
                          SUBTOTAL
                        </span>
                        <span style={{ color: '#ffffff', fontSize: '13.5px', fontWeight: 500, fontFamily: 'var(--font-dm-mono, monospace)' }}>
                          ₹{Number(itemsTotal || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>

                      {/* Discount Row */}
                      {couponDiscount > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                          <span style={{ color: '#ffffff', fontSize: '12px', fontWeight: 500, letterSpacing: '0.04em', fontFamily: 'var(--font-dm-mono, monospace)', textTransform: 'uppercase' }}>
                            DISCOUNT
                          </span>
                          <span style={{ color: '#ffffff', fontSize: '13.5px', fontWeight: 500, fontFamily: 'var(--font-dm-mono, monospace)', whiteSpace: 'nowrap' }}>
                            - ₹{Number(couponDiscount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}

                      {/* Shipping Row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <span style={{ color: '#a1a1aa', fontSize: '12px', fontWeight: 500, letterSpacing: '0.04em', fontFamily: 'var(--font-dm-mono, monospace)', textTransform: 'uppercase' }}>
                          SHIPPING
                        </span>
                        <span style={{ color: '#ffffff', fontSize: '13.5px', fontWeight: 500, fontFamily: 'var(--font-dm-mono, monospace)' }}>
                          {shippingFee === 0 ? 'FREE' : `₹${shippingFee.toFixed(2)}`}
                        </span>
                      </div>

                      {/* Taxes / GST */}
                      {isGstActive && gstRate > 0 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', width: '100%' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                            <span style={{ color: '#a1a1aa', fontSize: '11.5px', fontWeight: 500, letterSpacing: '0.04em', fontFamily: 'var(--font-dm-mono, monospace)', textTransform: 'uppercase' }}>
                              {isExclusiveGst ? `GST (${gstRate}%)` : `GST INCLUDED (${gstRate}%)`}
                            </span>
                            <span style={{ color: '#ffffff', fontSize: '13px', fontWeight: 500, fontFamily: 'var(--font-dm-mono, monospace)', whiteSpace: 'nowrap' }}>
                              {isExclusiveGst
                                ? `+ ₹${gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                : `₹${gstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                            </span>
                          </div>
                          <div style={{ fontSize: '10px', color: '#71717a', fontFamily: 'var(--font-dm-mono, monospace)', textAlign: 'right' }}>
                            (CGST {(gstRate / 2).toFixed(1)}%: ₹{(gstAmount / 2).toFixed(2)} + SGST {(gstRate / 2).toFixed(1)}%: ₹{(gstAmount / 2).toFixed(2)})
                          </div>
                        </div>
                      )}

                      {paymentMethod === 'COD' && codFeeAmount > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                          <span style={{ color: '#fbbf24', fontSize: '12px', fontWeight: 500, letterSpacing: '0.04em', fontFamily: 'var(--font-dm-mono, monospace)', textTransform: 'uppercase' }}>
                            COD HANDLING FEE
                          </span>
                          <span style={{ color: '#fbbf24', fontSize: '13px', fontWeight: 500, fontFamily: 'var(--font-dm-mono, monospace)' }}>
                            ₹{codFeeAmount.toFixed(2)}
                          </span>
                        </div>
                      )}

                      <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.15)', margin: '6px 0 4px' }} />

                      {/* Total Row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', width: '100%' }}>
                        <span style={{ fontSize: '1.05rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#ffffff', fontFamily: 'var(--font-dm-mono, monospace)' }}>
                          TOTAL
                        </span>
                        <span style={{ fontSize: '1.45rem', fontWeight: 600, color: '#ffffff', fontFamily: 'var(--font-dm-mono, monospace)', letterSpacing: '0.02em' }}>
                          ₹{totalPayable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>

                      <div className="drapza-security-badge" style={{ marginTop: '2px', color: '#71717a' }}>
                        <Lock size={12} strokeWidth={2} style={{ width: '12px', height: '12px', flexShrink: 0, color: '#71717a' }} />
                        <span style={{ color: '#71717a', fontSize: '10.5px', letterSpacing: '0.06em' }}>256-BIT ENCRYPTION • SECURE GATEWAY</span>
                      </div>
                    </div>
                  </>
                )}

                {/* Error Message Alert */}
                {errorMessage && (
                  <div
                    className="drapza-payment-error"
                    role="alert"
                    aria-live="assertive"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      backgroundColor: 'rgba(239, 68, 68, 0.14)',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      borderRadius: '8px',
                      padding: '0.7rem 0.95rem',
                      marginTop: '0.5rem',
                    }}
                  >
                    <AlertCircle
                      size={16}
                      style={{ width: '16px', height: '16px', flexShrink: 0, color: '#ef4444' }}
                    />
                    <span
                      className="drapza-error-text"
                      style={{
                        color: '#fecaca',
                        fontFamily: 'var(--font-dm-mono), monospace',
                        fontSize: '0.76rem',
                        fontWeight: 600,
                        letterSpacing: '0.03em',
                        lineHeight: 1.4,
                      }}
                    >
                      {errorMessage}
                    </span>
                  </div>
                )}

                {/* Action CTA Button */}
                <button
                  type="button"
                  className="drapza-pay-btn"
                  aria-busy={isProcessing}
                  disabled={isProcessing || totalPayable <= 0}
                  onClick={handlePaymentAction}
                >
                  {isProcessing && <Loader2 size={16} className="animate-spin" style={{ width: '16px', height: '16px', flexShrink: 0 }} />}
                  <span className="drapza-btn-text">{buttonLabel}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Sticky Action Bar */}
        <div className="drapza-mobile-sticky-action-bar">
          <div className="drapza-mobile-bar-info">
            <span className="drapza-mobile-bar-lbl">TOTAL PAYABLE</span>
            <span className="drapza-mobile-bar-val">₹{totalPayable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <button
            type="button"
            className="drapza-mobile-bar-btn"
            disabled={isProcessing || totalPayable <= 0}
            onClick={handlePaymentAction}
          >
            {isProcessing ? <Loader2 size={14} className="animate-spin" /> : null}
            <span>{isProcessing ? 'PROCESSING...' : 'CONFIRM ORDER'}</span>
          </button>
        </div>
      </div>

      {/* Global Drapza Parallax Contact Form & Footer */}
      <ContactForm />
      <Footer navigate={(path) => router.push(path)} />
    </>
  );
};

export default PaymentPage;
