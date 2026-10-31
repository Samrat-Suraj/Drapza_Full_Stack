"use client";

import React, { useState, useEffect } from "react";
import {
  ShoppingBag,
  RefreshCw,
  TrendingDown,
  DollarSign,
  Clock,
  Copy,
  Mail,
  Check,
  ShieldCheck,
  Package,
} from "lucide-react";
import { abandonedCartApi, AbandonedCartData } from "@/lib/api";

export function AbandonedCartAdminTab() {
  const [data, setData] = useState<AbandonedCartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copiedCartId, setCopiedCartId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const fetchAbandonedCarts = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    else setRefreshing(true);
    try {
      const res: any = await abandonedCartApi.getAbandonedCarts();
      if (res && (res.success || res.summary)) {
        setData(res.data || res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAbandonedCarts();
  }, []);

  const handleCopyRecoveryLink = (cartId: string, email: string) => {
    const recoveryCode = "RECOVER15";
    const origin = typeof window !== "undefined" ? window.location.origin : "https://www.drapza.com";
    const textToCopy = `Hi! Your Drapza atelier selection is reserved. Use code ${recoveryCode} for 15% off before vault access closes: ${origin}/cart`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedCartId(cartId);
    setActionNotice(`Recovery pitch & code [${recoveryCode}] copied to clipboard for ${email}`);
    setTimeout(() => {
      setCopiedCartId(null);
      setActionNotice(null);
    }, 4000);
  };

  const summary = data?.summary || {
    totalAbandonedCarts: 0,
    totalLostGmv: 0,
    totalAbandonedItems: 0,
    recoveryPotential: 0,
  };

  const carts = data?.carts || [];

  return (
    <div className="space-y-6">
      {/* Toast Notice */}
      {actionNotice && (
        <div className="fixed top-20 right-8 z-50 bg-black text-white px-5 py-3 rounded-none border border-neutral-800 shadow-2xl flex items-center gap-3 animate-fade-in font-mono-technical text-xs uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white border border-neutral-200 rounded-none p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-none bg-black animate-pulse" />
            <span className="font-mono-technical text-xs uppercase tracking-[0.25em] text-neutral-500 font-semibold">
              ATELIER REVENUE RECOVERY // RADAR 09
            </span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-tight text-neutral-900 mt-1">
            ABANDONED BAG & CHECKOUT RADAR
          </h2>
          <p className="font-sans text-xs sm:text-sm text-neutral-500 mt-1">
            Track uncompleted shopping bags and shared cart drop-offs. Re-engage clients with recovery offers.
          </p>
        </div>

        <button
          onClick={() => fetchAbandonedCarts(false)}
          disabled={refreshing}
          className="px-4 py-2.5 rounded-none border border-neutral-300 hover:border-black bg-white hover:bg-neutral-50 text-neutral-800 font-mono-technical text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-sm self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
          <span>SYNC RADAR</span>
        </button>
      </div>

      {/* KPI Financial Breakdown */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-neutral-200 rounded-none p-4 shadow-sm border-l-4 border-l-rose-500">
          <span className="font-mono-technical text-[10px] uppercase tracking-wider text-rose-600 block flex items-center gap-1">
            <TrendingDown className="w-3 h-3" /> POTENTIAL LOST GMV
          </span>
          <span className="font-display text-2xl sm:text-3xl font-bold text-neutral-900 mt-1 block">
            ₹{summary.totalLostGmv.toLocaleString("en-IN")}
          </span>
          <span className="font-mono-technical text-[10px] text-neutral-400 mt-1 block">
            Unconverted Cart Revenue
          </span>
        </div>

        <div className="bg-white border border-neutral-200 rounded-none p-4 shadow-sm border-l-4 border-l-amber-500">
          <span className="font-mono-technical text-[10px] uppercase tracking-wider text-amber-600 block flex items-center gap-1">
            <ShoppingBag className="w-3 h-3" /> ABANDONED BAGS
          </span>
          <span className="font-display text-2xl sm:text-3xl font-bold text-neutral-900 mt-1 block">
            {summary.totalAbandonedCarts}
          </span>
          <span className="font-mono-technical text-[10px] text-neutral-400 mt-1 block">
            Untouched for &gt; 30 mins
          </span>
        </div>

        <div className="bg-white border border-neutral-200 rounded-none p-4 shadow-sm border-l-4 border-l-blue-500">
          <span className="font-mono-technical text-[10px] uppercase tracking-wider text-blue-600 block flex items-center gap-1">
            <Package className="w-3 h-3" /> ABANDONED GARMENTS
          </span>
          <span className="font-display text-2xl sm:text-3xl font-bold text-neutral-900 mt-1 block">
            {summary.totalAbandonedItems}
          </span>
          <span className="font-mono-technical text-[10px] text-neutral-400 mt-1 block">
            Total units sitting in bags
          </span>
        </div>

        <div className="bg-white border border-neutral-200 rounded-none p-4 shadow-sm border-l-4 border-l-emerald-500">
          <span className="font-mono-technical text-[10px] uppercase tracking-wider text-emerald-600 block flex items-center gap-1">
            RECOVERY ESTIMATE
          </span>
          <span className="font-display text-2xl sm:text-3xl font-bold text-emerald-900 mt-1 block">
            ₹{summary.recoveryPotential.toLocaleString("en-IN")}
          </span>
          <span className="font-mono-technical text-[10px] text-neutral-400 mt-1 block">
            Expected 20% coupon conversion
          </span>
        </div>
      </div>

      {/* Abandoned Bags Ledger */}
      <div className="bg-white border border-neutral-200 rounded-none shadow-sm overflow-hidden">
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-neutral-800" />
            <h3 className="font-mono-technical text-xs uppercase tracking-wider font-bold text-neutral-900">
              ABANDONED BAGS REGISTER ({carts.length} ACTIVE DROPS)
            </h3>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-neutral-400" />
            <p className="font-mono-technical text-xs text-neutral-400 mt-2 uppercase tracking-wider">
              SWEEPING ARCHIVAL BAG RADAR...
            </p>
          </div>
        ) : carts.length === 0 ? (
          <div className="p-12 text-center">
            <p className="font-mono-technical text-xs text-neutral-400 uppercase tracking-widest">
              ZERO ABANDONED SHOPPING BAGS DETECTED
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 font-mono-technical text-[11px] uppercase tracking-wider text-neutral-500">
                  <th className="py-3 px-4">CLIENT IDENTITY</th>
                  <th className="py-3 px-4">ITEMS IN BAG</th>
                  <th className="py-3 px-4">UNITS</th>
                  <th className="py-3 px-4">POTENTIAL VALUE</th>
                  <th className="py-3 px-4">LAST INTERACTION</th>
                  <th className="py-3 px-4 text-right">RECOVERY ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 font-sans text-xs">
                {carts.map((c) => (
                  <tr key={c.cartId} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium text-neutral-900">{c.userName}</div>
                      <div className="text-neutral-500 text-[11px] font-mono">{c.userEmail}</div>
                      {c.userPhone !== "N/A" && (
                        <div className="text-neutral-400 text-[10px] font-mono">{c.userPhone}</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap items-center gap-1.5 max-w-xs">
                        {c.items.slice(0, 3).map((it, idx) => {
                          const itemName = it.title || (it as any).productName || "Atelier Silhouette";
                          return (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-none bg-neutral-100 border border-neutral-200 font-mono text-[10px] text-neutral-800 truncate"
                              title={`${itemName} (Size: ${it.size})`}
                            >
                              <span>{itemName}</span>
                              <span className="text-neutral-400">({it.size})</span>
                            </span>
                          );
                        })}
                        {c.items.length > 3 && (
                          <span className="font-mono text-[10px] text-neutral-400">
                            +{c.items.length - 3} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-neutral-700">
                      {c.itemCount}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-neutral-900">
                      ₹{c.totalAmount.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4 text-neutral-500 font-mono text-[11px] whitespace-nowrap">
                      {new Date(c.lastActiveAt).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleCopyRecoveryLink(c.cartId, c.userEmail)}
                        className="px-3 py-1.5 bg-black hover:bg-neutral-800 text-white rounded-none font-mono-technical text-[10px] uppercase tracking-wider transition-colors inline-flex items-center gap-1.5"
                      >
                        {copiedCartId === c.cartId ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>COPIED!</span>
                          </>
                        ) : (
                          <>
                            <Mail className="w-3 h-3" />
                            <span>SEND 15% OFFER</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

