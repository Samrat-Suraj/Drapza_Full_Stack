"use client";

import React, { useState, useEffect } from "react";
import {
  Truck,
  DollarSign,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Search,
  MapPin,
} from "lucide-react";
import { shippingConfigApi, ShippingConfigData } from "@/lib/api";

export function ShippingConfigAdminTab() {
  const [config, setConfig] = useState<ShippingConfigData>({
    freeShippingThreshold: 1999,
    standardShippingFee: 150,
    expressShippingFee: 350,
    vipShippingFee: 600,
    codEnabled: true,
    codHandlingFee: 0,
    codMaxOrderValue: 15000,
    blockedPincodes: ["110099", "400099"],
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newPincode, setNewPincode] = useState("");
  const [testPincode, setTestPincode] = useState("");
  const [testResult, setTestResult] = useState<any>(null);
  const [testingPin, setTestingPin] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await shippingConfigApi.getConfig();
      if (res.success && res.config) {
        setConfig(res.config);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await shippingConfigApi.updateConfig(config);
      if (res.success) {
        setActionNotice("Shipping & COD architecture rules saved to live database");
        setTimeout(() => setActionNotice(null), 3500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddBlockedPin = () => {
    const pin = newPincode.trim();
    if (!pin || pin.length !== 6 || isNaN(Number(pin))) {
      setActionNotice("Please enter a valid 6-digit postal code.");
      setTimeout(() => setActionNotice(null), 3500);
      return;
    }
    if (config.blockedPincodes.includes(pin)) return;

    setConfig({
      ...config,
      blockedPincodes: [...config.blockedPincodes, pin],
    });
    setNewPincode("");
  };

  const handleRemoveBlockedPin = (pin: string) => {
    setConfig({
      ...config,
      blockedPincodes: config.blockedPincodes.filter((p) => p !== pin),
    });
  };

  const handleTestPincode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPincode.trim()) return;
    setTestingPin(true);
    try {
      const res = await shippingConfigApi.checkPincode(testPincode.trim());
      if (res.success) {
        setTestResult(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTestingPin(false);
    }
  };

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
              LOGISTICS ENGINE // CMS
            </span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold uppercase tracking-tight text-neutral-900 mt-1">
            SHIPPING, COD & PINCODE SERVICEABILITY
          </h2>
          <p className="font-sans text-xs sm:text-sm text-neutral-500 mt-1">
            Configure free shipping thresholds, courier tiers, COD handling fees, and prevent RTO fraud by blacklisting postal zones.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={fetchConfig}
            disabled={loading}
            className="px-4 py-2.5 rounded-none border border-neutral-300 hover:border-black bg-white hover:bg-neutral-50 text-neutral-800 font-mono-technical text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>SYNC</span>
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-none bg-black hover:bg-neutral-800 text-white font-mono-technical text-xs uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{saving ? "SAVING..." : "SAVE SETTINGS"}</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Tier Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Free Shipping Threshold */}
          <div className="bg-white border border-neutral-200 rounded-none p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-600" />
              <h3 className="font-mono-technical text-xs font-bold uppercase tracking-wider text-neutral-900">
                FREE SHIPPING THRESHOLD
              </h3>
            </div>
            <p className="text-neutral-500 text-xs font-sans">
              Orders at or above this amount automatically receive complimentary ground shipping.
            </p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-neutral-400 font-bold">₹</span>
              <input
                type="number"
                min={0}
                value={config.freeShippingThreshold}
                onChange={(e) => setConfig({ ...config, freeShippingThreshold: Number(e.target.value) })}
                className="w-full pl-8 pr-3 py-2.5 rounded-none border border-neutral-300 focus:border-black focus:outline-none font-mono font-bold text-base text-neutral-900"
              />
            </div>
          </div>

          {/* Standard Shipping Fee */}
          <div className="bg-white border border-neutral-200 rounded-none p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-neutral-700" />
              <h3 className="font-mono-technical text-xs font-bold uppercase tracking-wider text-neutral-900">
                STANDARD SHIPPING FEE
              </h3>
            </div>
            <p className="text-neutral-500 text-xs font-sans">
              Ground dispatch fee applied when order value is below the free shipping threshold.
            </p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-neutral-400 font-bold">₹</span>
              <input
                type="number"
                min={0}
                value={config.standardShippingFee}
                onChange={(e) => setConfig({ ...config, standardShippingFee: Number(e.target.value) })}
                className="w-full pl-8 pr-3 py-2.5 rounded-none border border-neutral-300 focus:border-black focus:outline-none font-mono font-bold text-base text-neutral-900"
              />
            </div>
          </div>

          {/* Airway Express Courier Fee */}
          <div className="bg-white border border-neutral-200 rounded-none p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-600" />
              <h3 className="font-mono-technical text-xs font-bold uppercase tracking-wider text-neutral-900">
                AIRWAY EXPRESS FEE
              </h3>
            </div>
            <p className="text-neutral-500 text-xs font-sans">
              1-2 business days high-priority air cargo flight surcharge.
            </p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-neutral-400 font-bold">₹</span>
              <input
                type="number"
                min={0}
                value={config.expressShippingFee}
                onChange={(e) => setConfig({ ...config, expressShippingFee: Number(e.target.value) })}
                className="w-full pl-8 pr-3 py-2.5 rounded-none border border-neutral-300 focus:border-black focus:outline-none font-mono font-bold text-base text-neutral-900"
              />
            </div>
          </div>
        </div>

        {/* COD Rules & Blacklist Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* COD Rules Box */}
          <div className="bg-white border border-neutral-200 rounded-none p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-neutral-900" />
                <h3 className="font-mono-technical text-xs font-bold uppercase tracking-wider text-neutral-900">
                  CASH ON DELIVERY (COD) PROTOCOL
                </h3>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.codEnabled}
                  onChange={(e) => setConfig({ ...config, codEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-none after:h-5 after:w-5 after:transition-all peer-checked:bg-black" />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-mono-technical text-[11px] uppercase tracking-wider text-neutral-600 font-bold block mb-1">
                  COD HANDLING SURCHARGE (INR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-neutral-400 font-bold">₹</span>
                  <input
                    type="number"
                    min={0}
                    value={config.codHandlingFee}
                    onChange={(e) => setConfig({ ...config, codHandlingFee: Number(e.target.value) })}
                    className="w-full pl-8 pr-3 py-2 rounded-none border border-neutral-300 font-mono text-xs focus:border-black focus:outline-none"
                  />
                </div>
                <span className="text-[10px] text-neutral-400 font-sans mt-1 block">
                  Extra fee added to COD orders (0 for free COD).
                </span>
              </div>

              <div>
                <label className="font-mono-technical text-[11px] uppercase tracking-wider text-neutral-600 font-bold block mb-1">
                  MAX COD ORDER VALUE (INR)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-neutral-400 font-bold">₹</span>
                  <input
                    type="number"
                    min={500}
                    value={config.codMaxOrderValue}
                    onChange={(e) => setConfig({ ...config, codMaxOrderValue: Number(e.target.value) })}
                    className="w-full pl-8 pr-3 py-2 rounded-none border border-neutral-300 font-mono text-xs focus:border-black focus:outline-none"
                  />
                </div>
                <span className="text-[10px] text-neutral-400 font-sans mt-1 block">
                  Orders above this value must pay online.
                </span>
              </div>
            </div>
          </div>

          {/* High-RTO Fraud Prevention: Blocked Pincodes */}
          <div className="bg-white border border-neutral-200 rounded-none p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-neutral-200">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <h3 className="font-mono-technical text-xs font-bold uppercase tracking-wider text-neutral-900">
                BLOCKED / RESTRICTED PINCODES ({config.blockedPincodes.length})
              </h3>
            </div>
            <p className="text-neutral-500 text-xs font-sans">
              Postal codes with high Return-to-Origin (RTO) or courier fraud will be restricted from placing COD orders.
            </p>

            <div className="flex items-center gap-2">
              <input
                type="text"
                maxLength={6}
                value={newPincode}
                onChange={(e) => setNewPincode(e.target.value)}
                placeholder="Enter 6-digit postal code..."
                className="flex-1 p-2 border border-neutral-300 rounded-none font-mono text-xs focus:border-black focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddBlockedPin}
                className="px-3 py-2 bg-neutral-900 hover:bg-black text-white font-mono-technical text-xs uppercase tracking-wider rounded-none flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>BLOCK</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-2 bg-neutral-50 rounded-none border border-neutral-200">
              {config.blockedPincodes.length === 0 ? (
                <span className="font-mono text-xs text-neutral-400">No postal sectors currently blacklisted.</span>
              ) : (
                config.blockedPincodes.map((pin) => (
                  <span
                    key={pin}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-neutral-300 rounded-none font-mono text-xs text-neutral-800 shadow-sm"
                  >
                    <span>{pin}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveBlockedPin(pin)}
                      className="text-neutral-400 hover:text-rose-600 transition-colors"
                      title="Unblock postal code"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Live Postal Serviceability Test Engine */}
        <div className="bg-neutral-900 text-white rounded-none p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-400" />
            <h3 className="font-mono-technical text-xs font-bold uppercase tracking-wider text-white">
              LIVE SECTOR SERVICEABILITY VERIFICATION SIMULATOR
            </h3>
          </div>
          <p className="text-neutral-400 text-xs font-sans">
            Test how the checkout engine evaluates any Indian pincode against active threshold rules.
          </p>

          <div className="flex items-center gap-3 max-w-md">
            <input
              type="text"
              maxLength={6}
              value={testPincode}
              onChange={(e) => setTestPincode(e.target.value)}
              placeholder="e.g., 110001"
              className="flex-1 p-2.5 bg-neutral-800 border border-neutral-700 rounded-none font-mono text-xs text-white focus:border-white focus:outline-none"
            />
            <button
              type="button"
              disabled={testingPin || !testPincode.trim()}
              onClick={handleTestPincode}
              className="px-4 py-2.5 bg-white text-black font-mono-technical text-xs uppercase tracking-wider rounded-none hover:bg-neutral-200 transition-colors disabled:opacity-50"
            >
              {testingPin ? "CHECKING..." : "TEST PINCODE"}
            </button>
          </div>

          {testResult && (
            <div className="p-4 bg-neutral-800/80 border border-neutral-700 rounded-none font-mono text-xs space-y-2 animate-fade-in">
              <div className="flex items-center gap-2">
                {testResult.serviceable ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                )}
                <span className={testResult.serviceable ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                  {testResult.serviceable ? "POSTAL SECTOR SERVICEABLE" : "RESTRICTED / BLOCKED SECTOR"}
                </span>
              </div>
              <p className="text-neutral-300 font-sans text-xs">{testResult.message}</p>
              <div className="text-[11px] text-neutral-400">
                COD Available: <strong>{testResult.codAvailable ? "YES" : "NO"}</strong> | Standard Courier: ₹{testResult.standardShippingFee} | Free above: ₹{testResult.freeShippingThreshold}
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}

