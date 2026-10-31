'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Share2,
  Copy,
  Check,
  ArrowRight,
  Loader2,
  ExternalLink,
  ShoppingBag,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { sharedBagApi } from '@/lib/api';

export const ShareMyBagModal = ({ isOpen, onClose, items = [] }) => {
  const { user } = useAuth() || {};
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState('prompt'); // 'prompt' | 'loading' | 'ready'
  const [guestName, setGuestName] = useState('');
  const [nameError, setNameError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shareData, setShareData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [moreOptionsCopied, setMoreOptionsCopied] = useState(false);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Check login state and reset on modal open
  useEffect(() => {
    if (!isOpen) {
      setStep('prompt');
      setGuestName('');
      setNameError('');
      setApiError('');
      setShareData(null);
      setCopied(false);
      setMoreOptionsCopied(false);
      setIsSubmitting(false);
      return;
    }

    // Determine if user is logged in
    let loggedInUser = user;
    if (!loggedInUser && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('drapza_user');
        if (stored) loggedInUser = JSON.parse(stored);
      } catch { }
    }

    if (loggedInUser && (loggedInUser.name || loggedInUser.email)) {
      // Case A: User is logged in -> generate share link automatically without asking for name
      generateShareLink();
    } else {
      // Case B: Guest user -> ask "What is your name?"
      setStep('prompt');
    }
  }, [isOpen, user]);

  const generateShareLink = async (nameToUse = '') => {
    if (!items || items.length === 0) return;

    setStep('loading');
    setIsSubmitting(true);
    setApiError('');

    try {
      const payload = {
        items,
        ...(nameToUse ? { sharerName: nameToUse.trim() } : {}),
      };

      const res = await sharedBagApi.createSharedBag(payload);

      if (res && res.success && res.shareId) {
        setShareData(res);
        setStep('ready');
      } else {
        setApiError(res?.message || 'Could not generate share link. Please try again.');
        setStep(nameToUse ? 'prompt' : 'error');
      }
    } catch (err) {
      console.error('[SHARE_BAG] API error:', err);
      setApiError('Unable to connect to the atelier servers. Please try again.');
      setStep('prompt');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuestSubmit = (e) => {
    e.preventDefault();
    const clean = guestName.trim();
    if (!clean) {
      setNameError('Please enter your name to share your bag.');
      return;
    }
    if (clean.length < 2) {
      setNameError('Name must be at least 2 characters.');
      return;
    }
    if (clean.length > 50) {
      setNameError('Name is too long (maximum 50 characters).');
      return;
    }

    setNameError('');
    generateShareLink(clean);
  };

  const getFullShareUrl = () => {
    if (!shareData?.shareId) return '';
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://drapza.com';
    return `${origin}/shared-bag/${shareData.shareId}`;
  };

  const getWhatsAppShareUrl = () => {
    const url = getFullShareUrl();
    if (!url) return '';
    const sharer = shareData?.sharerName || 'I';
    const totalCount = shareData?.totalCount || items.reduce((acc, i) => acc + (i.quantity || 1), 0);
    const totalAmount = shareData?.totalAmount || items.reduce((acc, i) => acc + (parseFloat(i.price) || 0) * (i.quantity || 1), 0);

    const message = encodeURIComponent(
      `Check out ${sharer}'s curated Drapza Atelier Bag (${totalCount} garments • ₹${totalAmount.toLocaleString('en-IN')}):\n\n${url}`
    );
    return `https://api.whatsapp.com/send?text=${message}`;
  };

  const handleCopyLink = async () => {
    const url = getFullShareUrl();
    if (!url) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.warn('Clipboard write failed:', err);
    }
  };

  const handleWhatsAppShare = (e) => {
    const targetUrl = getWhatsAppShareUrl();
    if (!targetUrl) {
      if (e) e.preventDefault();
      handleCopyLink();
      return;
    }
    // Anchor will handle navigation natively, but if invoked manually via button:
    if (typeof window !== 'undefined') {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleNativeShare = async () => {
    const url = getFullShareUrl();
    if (!url) return;
    const sharer = shareData?.sharerName || 'My';

    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `${sharer}'s Drapza Bag`,
          text: `Check out this curated bag of atelier garments on Drapza:`,
          url,
        });
        return;
      } catch (err) {
        if (err && err.name === 'AbortError') return;
      }
    }

    // Direct clipboard copy fallback with reactive button feedback
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setMoreOptionsCopied(true);
      setTimeout(() => setMoreOptionsCopied(false), 2500);
    } catch {
      handleCopyLink();
    }
  };

  if (!isOpen || !mounted) return null;

  const totalItemsCount = items.reduce((acc, i) => acc + (Number(i.quantity) || 1), 0);

  const modalJSX = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Share My Bag"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        pointerEvents: 'auto',
      }}
    >
      {/* Backdrop */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          zIndex: 1,
          cursor: 'pointer',
          pointerEvents: 'auto',
        }}
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      />

      {/* Modal Dialog Card */}
      <div
        data-lenis-prevent="true"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: '460px',
          backgroundColor: '#0f0f0f',
          color: '#ffffff',
          borderRadius: '0.75rem',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 25px 65px rgba(0, 0, 0, 0.85)',
          padding: '2rem',
          fontFamily: 'var(--font-dm-mono), monospace',
          boxSizing: 'border-box',
          animation: 'fadeInScale 0.2s ease forwards',
          pointerEvents: 'auto',
        }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            background: 'none',
            border: 'none',
            color: 'var(--base-400, #969992)',
            cursor: 'pointer',
            padding: '0.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px',
            pointerEvents: 'auto',
            transition: 'color 0.2s ease, background-color 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#ffffff';
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'var(--base-400, #969992)';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <X size={18} strokeWidth={2} />
        </button>

        {/* ================= STEP 1: LOADING ================= */}
        {step === 'loading' && (
          <div style={{ padding: '2.5rem 1rem', textAlign: 'center' }}>
            <Loader2
              size={32}
              style={{
                color: '#ffffff',
                margin: '0 auto 1.25rem auto',
                animation: 'spin 1s linear infinite',
              }}
            />
            <span
              style={{
                display: 'block',
                fontFamily: 'var(--font-dm-mono), monospace',
                fontSize: '0.68rem',
                color: 'var(--base-400, #969992)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: '0.35rem',
              }}
            >
              [ ATELIER PROTOCOL ]
            </span>
            <h3
              style={{
                margin: 0,
                fontFamily: 'var(--font-koulen), sans-serif',
                fontSize: '1.5rem',
                letterSpacing: '0.04em',
                color: '#ffffff',
                textTransform: 'uppercase',
                lineHeight: 1.1,
              }}
            >
              GENERATING SHAREABLE BAG
            </h3>
            <p
              style={{
                marginTop: '0.65rem',
                fontSize: '0.74rem',
                color: 'var(--base-400, #969992)',
                fontFamily: 'var(--font-dm-mono), monospace',
                letterSpacing: '0.02em',
              }}
            >
              Preserving {totalItemsCount} item{totalItemsCount !== 1 ? 's' : ''} in the Atelier database...
            </p>
          </div>
        )}

        {/* ================= STEP 2: GUEST NAME PROMPT ================= */}
        {step === 'prompt' && (
          <div>
            {/* Header */}
            <div>
              <span
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-dm-mono), monospace',
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  color: 'var(--base-400, #969992)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  marginBottom: '0.25rem',
                }}
              >
                [ GUEST CURATION PROTOCOL ]
              </span>
              <h2
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-koulen), sans-serif',
                  fontSize: '1.85rem',
                  fontWeight: 400,
                  letterSpacing: '0.04em',
                  color: '#ffffff',
                  textTransform: 'uppercase',
                  lineHeight: 1,
                }}
              >
                WHAT IS YOUR NAME?
              </h2>
            </div>

            <p
              style={{
                marginTop: '0.75rem',
                fontSize: '0.78rem',
                color: 'var(--base-400, #969992)',
                fontFamily: 'var(--font-dm-mono), monospace',
                letterSpacing: '0.02em',
                lineHeight: 1.5,
              }}
            >
              Enter your name to personalize your shared bag. Recipients will view your curated selection under your name.
            </p>

            {apiError && (
              <div
                style={{
                  marginTop: '0.85rem',
                  padding: '0.75rem',
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  borderRadius: '6px',
                  color: '#f87171',
                  fontSize: '0.72rem',
                }}
              >
                {apiError}
              </div>
            )}

            <form onSubmit={handleGuestSubmit} style={{ marginTop: '1.25rem' }}>
              <div>
                <label
                  htmlFor="sharer-name-input"
                  style={{
                    display: 'block',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: 'var(--base-300, #afb3ab)',
                    marginBottom: '0.5rem',
                  }}
                >
                  Your Full Name
                </label>
                <input
                  id="sharer-name-input"
                  type="text"
                  autoFocus
                  value={guestName}
                  onChange={(e) => {
                    setGuestName(e.target.value);
                    if (nameError) setNameError('');
                  }}
                  placeholder="e.g. Rahul Sharma"
                  maxLength={50}
                  style={{
                    width: '100%',
                    padding: '0.85rem 1rem',
                    backgroundColor: '#141416',
                    border: nameError ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontFamily: 'var(--font-dm-mono), monospace',
                    fontSize: '0.82rem',
                    letterSpacing: '0.03em',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s ease',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#ffffff';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = nameError ? '#ef4444' : 'rgba(255, 255, 255, 0.2)';
                  }}
                />
                {nameError && (
                  <p style={{ color: '#ef4444', fontSize: '0.7rem', marginTop: '0.35rem', margin: '0.35rem 0 0 0' }}>
                    {nameError}
                  </p>
                )}
                <span
                  style={{
                    display: 'block',
                    fontSize: '0.68rem',
                    color: 'var(--base-500, #7d807a)',
                    marginTop: '0.4rem',
                  }}
                >
                  Recipients will see: &quot;{guestName.trim() || 'Your Name'}&apos;s Shared Bag&quot;
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginTop: '1.5rem',
                  paddingTop: '1.15rem',
                  borderTop: '1px dashed rgba(255, 255, 255, 0.15)',
                }}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                  }}
                  style={{
                    flex: 1,
                    padding: '0.85rem 1rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(255, 255, 255, 0.16)',
                    backgroundColor: 'transparent',
                    color: 'var(--base-300, #afb3ab)',
                    fontFamily: 'var(--font-dm-mono), monospace',
                    fontSize: '0.76rem',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    pointerEvents: 'auto',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#ffffff';
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'var(--base-300, #afb3ab)';
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    flex: 2,
                    padding: '0.85rem 1.25rem',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: '#ffffff',
                    color: '#000000',
                    fontFamily: 'var(--font-dm-mono), monospace',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 15px rgba(255, 255, 255, 0.15)',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSubmitting) e.currentTarget.style.backgroundColor = '#d7dbd2';
                  }}
                  onMouseLeave={(e) => {
                    if (!isSubmitting) e.currentTarget.style.backgroundColor = '#ffffff';
                  }}
                >
                  <span>Continue & Share</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ================= STEP 3: SHARE LINK READY ================= */}
        {step === 'ready' && shareData && (
          <div>
            {/* Header */}
            <div>
              <span
                style={{
                  display: 'block',
                  fontFamily: 'var(--font-dm-mono), monospace',
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  color: 'var(--base-400, #969992)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  marginBottom: '0.25rem',
                }}
              >
                [ ATELIER PROTOCOL // LINK READY ]
              </span>
              <h2
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-koulen), sans-serif',
                  fontSize: '1.85rem',
                  fontWeight: 400,
                  letterSpacing: '0.04em',
                  color: '#ffffff',
                  textTransform: 'uppercase',
                  lineHeight: 1,
                }}
              >
                BAG LINK GENERATED
              </h2>
            </div>

            {/* Curator & Bag Meta Box */}
            <div
              style={{
                marginTop: '1rem',
                marginBottom: '1.25rem',
                padding: '0.85rem 1rem',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.75rem',
              }}
            >
              <div>
                <span
                  style={{
                    display: 'block',
                    fontSize: '0.64rem',
                    color: 'var(--base-400, #969992)',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    marginBottom: '0.2rem',
                  }}
                >
                  Curator
                </span>
                <span
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: '#ffffff',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  {shareData.sharerName}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span
                  style={{
                    display: 'block',
                    fontSize: '0.64rem',
                    color: 'var(--base-400, #969992)',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    marginBottom: '0.2rem',
                  }}
                >
                  Selection
                </span>
                <span
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: '#ffffff',
                    letterSpacing: '0.03em',
                  }}
                >
                  {shareData.totalCount} {shareData.totalCount === 1 ? 'PC' : 'PCS'} • ₹{shareData.totalAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* URL Input Box with Copy Button */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: '#141416',
                border: '1px solid rgba(255, 255, 255, 0.22)',
                borderRadius: '8px',
                padding: '0.4rem 0.45rem 0.4rem 0.85rem',
                gap: '0.6rem',
                marginBottom: '1rem',
                boxSizing: 'border-box',
              }}
            >
              <input
                type="text"
                readOnly
                value={getFullShareUrl()}
                onFocus={(e) => e.target.select()}
                style={{
                  flex: 1,
                  backgroundColor: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#ffffff',
                  fontFamily: 'var(--font-dm-mono), monospace',
                  fontSize: '0.75rem',
                  letterSpacing: '0.02em',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                }}
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyLink();
                }}
                style={{
                  backgroundColor: copied ? '#25d366' : '#ffffff',
                  color: copied ? '#ffffff' : '#000000',
                  fontFamily: 'var(--font-dm-mono), monospace',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  padding: '0.55rem 1rem',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  pointerEvents: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease',
                  flexShrink: 0,
                  boxSizing: 'border-box',
                  whiteSpace: 'nowrap',
                }}
              >
                {copied ? <Check size={13} color="#ffffff" strokeWidth={2.5} /> : <Copy size={13} color="#000000" strokeWidth={2} />}
                <span style={{ color: copied ? '#ffffff' : '#000000', fontWeight: 700 }}>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* WhatsApp Share Button - Direct Link with High-Contrast Green & Fixed Icon Size */}
            <a
              href={getWhatsAppShareUrl()}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                e.stopPropagation();
                if (!getWhatsAppShareUrl()) {
                  e.preventDefault();
                  handleCopyLink();
                }
              }}
              style={{
                width: '100%',
                height: '3rem',
                padding: '0 1rem',
                boxSizing: 'border-box',
                backgroundColor: '#25D366',
                border: 'none',
                borderRadius: '8px',
                color: '#ffffff',
                fontFamily: 'var(--font-dm-mono), monospace',
                fontSize: '0.78rem',
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.55rem',
                cursor: 'pointer',
                pointerEvents: 'auto',
                textDecoration: 'none',
                boxShadow: '0 4px 18px rgba(37, 211, 102, 0.35)',
                transition: 'all 0.2s ease',
                marginBottom: '0.85rem',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1ebd5a';
                e.currentTarget.style.boxShadow = '0 6px 22px rgba(37, 211, 102, 0.5)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#25D366';
                e.currentTarget.style.boxShadow = '0 4px 18px rgba(37, 211, 102, 0.35)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '18px',
                  height: '18px',
                  minWidth: '18px',
                  minHeight: '18px',
                  maxWidth: '18px',
                  maxHeight: '18px',
                  flexShrink: 0,
                  pointerEvents: 'none',
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="#ffffff"
                  width="18"
                  height="18"
                  style={{
                    width: '18px',
                    height: '18px',
                    minWidth: '18px',
                    minHeight: '18px',
                    maxWidth: '18px',
                    maxHeight: '18px',
                    flexShrink: 0,
                    display: 'block',
                    pointerEvents: 'none',
                  }}
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </span>
              <span
                style={{
                  color: '#ffffff',
                  fontFamily: 'var(--font-dm-mono), monospace',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                }}
              >
                Share via WhatsApp
              </span>
            </a>

            {/* Secondary Actions Grid - High Contrast */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNativeShare();
                }}
                style={{
                  height: '2.75rem',
                  padding: '0 0.85rem',
                  boxSizing: 'border-box',
                  backgroundColor: moreOptionsCopied ? 'rgba(37, 211, 102, 0.18)' : 'rgba(255, 255, 255, 0.08)',
                  border: moreOptionsCopied ? '1px solid rgba(37, 211, 102, 0.65)' : '1px solid rgba(255, 255, 255, 0.22)',
                  borderRadius: '8px',
                  color: moreOptionsCopied ? '#25d366' : '#ffffff',
                  fontFamily: 'var(--font-dm-mono), monospace',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '7px',
                  cursor: 'pointer',
                  pointerEvents: 'auto',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  if (!moreOptionsCopied) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!moreOptionsCopied) {
                    e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.22)';
                  }
                }}
              >
                {moreOptionsCopied ? (
                  <>
                    <Check size={14} color="#25d366" strokeWidth={2.5} />
                    <span style={{ color: '#25d366', fontWeight: 700 }}>Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 size={14} color="#ffffff" strokeWidth={2} />
                    <span style={{ color: '#ffffff', fontWeight: 700 }}>More Options</span>
                  </>
                )}
              </button>

              <a
                href={getFullShareUrl()}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  e.stopPropagation();
                }}
                style={{
                  height: '2.75rem',
                  padding: '0 0.85rem',
                  boxSizing: 'border-box',
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.22)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontFamily: 'var(--font-dm-mono), monospace',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '7px',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  pointerEvents: 'auto',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.22)';
                }}
              >
                <span style={{ color: '#ffffff', fontWeight: 700 }}>Preview Page</span>
                <ExternalLink size={14} color="#ffffff" strokeWidth={2} />
              </a>
            </div>

            {/* Footer Divider & Notice */}
            <div
              style={{
                marginTop: '1.25rem',
                paddingTop: '0.85rem',
                borderTop: '1px dashed rgba(255, 255, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.68rem',
              }}
            >
              <span style={{ color: 'rgba(255, 255, 255, 0.55)', letterSpacing: '0.04em' }}>[ LINK VALID FOR 30 DAYS ]</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  color: '#ffffff',
                  cursor: 'pointer',
                  pointerEvents: 'auto',
                  fontFamily: 'var(--font-dm-mono), monospace',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  padding: '0.35rem 0.85rem',
                  borderRadius: '4px',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.18)';
                  e.currentTarget.style.borderColor = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.18)';
                }}
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* Error Fallback */}
        {step === 'error' && (
          <div style={{ padding: '1.5rem 0', textAlign: 'center' }}>
            <p style={{ color: '#ef4444', fontSize: '0.78rem', marginBottom: '1rem' }}>
              {apiError || 'Failed to create share link.'}
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setStep('prompt');
              }}
              style={{
                padding: '0.6rem 1.2rem',
                borderRadius: '6px',
                backgroundColor: '#ffffff',
                color: '#000000',
                fontFamily: 'var(--font-dm-mono), monospace',
                fontSize: '0.74rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                pointerEvents: 'auto',
              }}
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalJSX, document.body);
};
