'use client';

import React, { useEffect, useState } from 'react';
import OrderConfirmationView from '../../components/OrderConfirmationView';

export default function OrderConfirmationPage() {
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const queryOrderId = searchParams.get('orderId') || searchParams.get('ref') || searchParams.get('id');

      if (queryOrderId) {
        // Attempt to fetch from backend
        fetch(`/api/order/${encodeURIComponent(queryOrderId)}`)
          .then((res) => res.json())
          .then((data) => {
            if (data?.success && data?.order) {
              setOrder(data.order);
            }
          })
          .catch(() => {
            // Ignore fetch error, fallback will handle it
          });
      } else {
        const stored = localStorage.getItem('drapza_latest_confirmed_order');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed && (parsed.orderId || parsed._id)) {
              setOrder(parsed);
            }
          } catch (e) {}
        }
      }
    } catch (e) {
      console.error('Error loading order on confirmation page:', e);
    }
  }, []);

  return <OrderConfirmationView order={order} />;
}
