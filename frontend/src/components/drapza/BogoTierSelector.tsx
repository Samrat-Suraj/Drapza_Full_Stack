'use client';

import React, { useState, useEffect } from 'react';
import { Tag, Shirt } from 'lucide-react';
import { bogoConfigApi, BogoConfigData, DEFAULT_BOGO_CONFIG, BogoTierData } from '@/lib/api';
import { audioSystem } from './AudioSystem';

interface BogoTierSelectorProps {
  product: {
    name?: string;
    price?: number | string;
    numericPrice?: number;
    sizes?: string[];
    allowBogo?: boolean;
    disableBogo?: boolean;
  };
  selectedTier: BogoTierData | null;
  onSelectTier: (tier: BogoTierData | null) => void;
  garmentSizes?: string[];
  onChangeGarmentSize?: (index: number, size: string) => void;
}

// Pixel-perfect folded linen garment SVG illustration matching user reference
const FoldedShirt = ({
  color,
  collarColor,
  width = 24,
  height = 30,
  style = {},
}: {
  color: string;
  collarColor: string;
  width?: number;
  height?: number;
  style?: React.CSSProperties;
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 38 46"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ filter: 'drop-shadow(0 1.2px 2.5px rgba(0,0,0,0.18))', ...style }}
  >
    {/* Folded Body */}
    <rect x="2" y="4" width="34" height="40" rx="3" fill={color} />
    {/* Fine Linen Texture Lines */}
    <line x1="5" y1="4" x2="5" y2="44" stroke="rgba(255,255,255,0.12)" strokeWidth="0.75" />
    <line x1="10" y1="4" x2="10" y2="44" stroke="rgba(0,0,0,0.06)" strokeWidth="0.75" />
    <line x1="28" y1="4" x2="28" y2="44" stroke="rgba(0,0,0,0.06)" strokeWidth="0.75" />
    <line x1="33" y1="4" x2="33" y2="44" stroke="rgba(255,255,255,0.12)" strokeWidth="0.75" />
    {/* Center Placket */}
    <rect x="16" y="8" width="6" height="24" fill="rgba(0,0,0,0.08)" rx="1" />
    {/* Buttons */}
    <circle cx="19" cy="14" r="1.2" fill="#ffffff" stroke="rgba(0,0,0,0.25)" strokeWidth="0.5" />
    <circle cx="19" cy="21" r="1.2" fill="#ffffff" stroke="rgba(0,0,0,0.25)" strokeWidth="0.5" />
    <circle cx="19" cy="28" r="1.2" fill="#ffffff" stroke="rgba(0,0,0,0.25)" strokeWidth="0.5" />
    {/* Brand Label Tag */}
    <rect x="17" y="10" width="4" height="5" fill="#f8fafc" rx="0.5" />
    <line x1="18" y1="12" x2="20" y2="12" stroke="#0f172a" strokeWidth="0.6" />
    {/* Left Collar Flap */}
    <path d="M12 4 L19 10 L15 13 L10 5 Z" fill={collarColor} stroke="rgba(0,0,0,0.15)" strokeWidth="0.5" />
    {/* Right Collar Flap */}
    <path d="M26 4 L19 10 L23 13 L28 5 Z" fill={collarColor} stroke="rgba(0,0,0,0.15)" strokeWidth="0.5" />
  </svg>
);

// Leaf Branch Accents matching mockup
const OliveBranch = () => (
  <svg
    width="11"
    height="14"
    viewBox="0 0 16 22"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ position: 'absolute', bottom: 1, right: 2, opacity: 0.75 }}
  >
    <path d="M2 20 Q 8 14 14 2" stroke="#3d4937" strokeWidth="1" fill="none" />
    <ellipse cx="6" cy="15" rx="3" ry="1.5" transform="rotate(-30 6 15)" fill="#4d5945" />
    <ellipse cx="10" cy="9" rx="3" ry="1.5" transform="rotate(35 10 9)" fill="#5c6a53" />
    <ellipse cx="13" cy="4" rx="2.5" ry="1.2" transform="rotate(-20 13 4)" fill="#4d5945" />
  </svg>
);

// Folded Garments Preview Box matching Drapza linen palette
const FoldedGarmentsVisual = ({ count, isDark }: { count: number; isDark?: boolean }) => {
  const shirtColors = {
    linenTan: { color: '#cfb597', collar: '#be9f80' },
    oliveGreen: { color: '#4d5945', collar: '#3d4736' },
    obsidianCharcoal: { color: '#222722', collar: '#171a17' },
    khakiBeige: { color: '#d6c3ad', collar: '#c2ad97' },
  };

  return (
    <div
      style={{
        width: count === 1 ? '48px' : count === 2 ? '66px' : count === 3 ? '78px' : '90px',
        height: '38px',
        backgroundColor: isDark ? '#1a1f18' : '#e4e9df',
        borderRadius: '6px',
        border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #d2d8cb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        flexShrink: 0,
        boxShadow: isDark ? 'inset 0 1px 2px rgba(0,0,0,0.35)' : 'inset 0 1px 2px rgba(0,0,0,0.04)',
      }}
    >
      {/* 1 Piece */}
      {count === 1 && (
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FoldedShirt
            color={shirtColors.linenTan.color}
            collarColor={shirtColors.linenTan.collar}
            width={23}
            height={28}
          />
          <OliveBranch />
        </div>
      )}

      {/* 2 Pieces */}
      {count === 2 && (
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px' }}>
          <FoldedShirt
            color={shirtColors.linenTan.color}
            collarColor={shirtColors.linenTan.collar}
            width={22}
            height={27}
            style={{ transform: 'rotate(-4deg)' }}
          />
          {/* Circular + badge */}
          <div
            style={{
              position: 'absolute',
              zIndex: 3,
              width: '13px',
              height: '13px',
              borderRadius: '50%',
              backgroundColor: '#edf1e8',
              boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '9px',
              fontWeight: 700,
              color: '#151813',
            }}
          >
            +
          </div>
          <FoldedShirt
            color={shirtColors.oliveGreen.color}
            collarColor={shirtColors.oliveGreen.collar}
            width={22}
            height={27}
            style={{ transform: 'rotate(4deg)' }}
          />
          <OliveBranch />
        </div>
      )}

      {/* 3 Pieces */}
      {count === 3 && (
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
          <FoldedShirt
            color={shirtColors.linenTan.color}
            collarColor={shirtColors.linenTan.collar}
            width={20}
            height={25}
            style={{ transform: 'rotate(-5deg)' }}
          />
          {/* Circular + badge */}
          <div
            style={{
              position: 'absolute',
              zIndex: 3,
              left: '42%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: '13px',
              height: '13px',
              borderRadius: '50%',
              backgroundColor: '#edf1e8',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '9px',
              fontWeight: 700,
              color: '#151813',
            }}
          >
            +
          </div>
          <FoldedShirt
            color={shirtColors.oliveGreen.color}
            collarColor={shirtColors.oliveGreen.collar}
            width={20}
            height={25}
          />
          <FoldedShirt
            color={shirtColors.obsidianCharcoal.color}
            collarColor={shirtColors.obsidianCharcoal.collar}
            width={20}
            height={25}
            style={{ transform: 'rotate(5deg)' }}
          />
          <OliveBranch />
        </div>
      )}

      {/* 4 Pieces */}
      {count === 4 && (
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
          <FoldedShirt
            color={shirtColors.linenTan.color}
            collarColor={shirtColors.linenTan.collar}
            width={19}
            height={24}
            style={{ transform: 'rotate(-4deg)' }}
          />
          <FoldedShirt
            color={shirtColors.oliveGreen.color}
            collarColor={shirtColors.oliveGreen.collar}
            width={19}
            height={24}
          />
          {/* Circular + badge */}
          <div
            style={{
              position: 'absolute',
              zIndex: 3,
              left: '52%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: '13px',
              height: '13px',
              borderRadius: '50%',
              backgroundColor: '#edf1e8',
              boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '9px',
              fontWeight: 700,
              color: '#151813',
            }}
          >
            +
          </div>
          <FoldedShirt
            color={shirtColors.obsidianCharcoal.color}
            collarColor={shirtColors.obsidianCharcoal.collar}
            width={19}
            height={24}
          />
          <FoldedShirt
            color={shirtColors.khakiBeige.color}
            collarColor={shirtColors.khakiBeige.collar}
            width={19}
            height={24}
            style={{ transform: 'rotate(4deg)' }}
          />
          <OliveBranch />
        </div>
      )}
    </div>
  );
};

export function BogoTierSelector({
  product,
  selectedTier,
  onSelectTier,
  garmentSizes = [],
  onChangeGarmentSize,
}: BogoTierSelectorProps) {
  const [config, setConfig] = useState<BogoConfigData>(DEFAULT_BOGO_CONFIG);

  useEffect(() => {
    let isMounted = true;

    const loadConfig = async () => {
      try {
        if (typeof window !== 'undefined') {
          const cached = localStorage.getItem('drapza_bogo_config');
          if (cached) {
            try {
              const parsed = JSON.parse(cached);
              if (parsed && typeof parsed.isEnabled === 'boolean') {
                if (isMounted) setConfig(parsed);
              }
            } catch (e) {}
          }
        }

        const res = await bogoConfigApi.getBogoConfig();
        if (isMounted && res && res.success && res.data) {
          setConfig(res.data);
          if (typeof window !== 'undefined') {
            localStorage.setItem('drapza_bogo_config', JSON.stringify(res.data));
          }
        }
      } catch (err) {
        // Fallback
      }
    };

    loadConfig();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'drapza_bogo_config' && e.newValue) {
        try {
          const updated = JSON.parse(e.newValue);
          if (updated && typeof updated.isEnabled === 'boolean') {
            setConfig(updated);
          }
        } catch (err) {}
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      isMounted = false;
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const isBogoEnabled = Boolean(
    config?.isEnabled &&
    product?.allowBogo !== false &&
    product?.disableBogo !== true
  );

  const activeTiers = isBogoEnabled ? (config.tiers || []).filter((t) => t.isActive) : [];

  useEffect(() => {
    // If BOGO is disabled in CMS or for this product, immediately reset tier to null
    if (!isBogoEnabled || activeTiers.length === 0) {
      if (selectedTier) {
        onSelectTier(null);
      }
      return;
    }

    if (!selectedTier && activeTiers.length > 0) {
      const popular = activeTiers.find((t) => t.popular);
      onSelectTier(popular || activeTiers[0]);
    }
  }, [isBogoEnabled, activeTiers, selectedTier, onSelectTier]);

  useEffect(() => {
    return () => {
      onSelectTier(null);
    };
  }, [onSelectTier]);

  if (!isBogoEnabled || activeTiers.length === 0) {
    return null;
  }

  const unitPrice =
    Number(product?.numericPrice) ||
    (typeof product?.price === 'number'
      ? product.price
      : parseFloat(String(product?.price || '1850').replace(/[^0-9.]/g, '')) || 1850);

  const availableSizes =
    product?.sizes && product.sizes.length > 0 ? product.sizes : ['S', 'M', 'L', 'XL'];

  return (
    <div
      style={{
        width: '100%',
        flexShrink: 0,
        boxSizing: 'border-box',
        margin: '0.65rem 0 0.95rem 0',
        padding: '0px',
        backgroundColor: 'transparent',
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >

      {/* 2. SPECIAL ATELIER OFFER NOTICE PILL (DRAPZA SAGE PALETTE) */}
      {config.bannerNotice && (
        <div
          style={{
            backgroundColor: '#e7ece2',
            border: '1px solid #d2d8cb',
            borderRadius: '6px',
            padding: '6px 11px',
            display: 'flex',
            alignItems: 'center',
            gap: '7px',
            marginBottom: '9px',
            boxSizing: 'border-box',
          }}
        >
          <Tag size={12} color="#3d4937" strokeWidth={1.8} style={{ flexShrink: 0 }} />
          <span
            style={{
              color: '#21271d',
              fontSize: '9px',
              fontWeight: 500,
              letterSpacing: '0.02em',
              textTransform: 'uppercase',
              lineHeight: 1.35,
              fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
            }}
          >
            {config.bannerNotice}
          </span>
        </div>
      )}

      {/* 3. SECTION DIVIDER: "4 TIERS AVAILABLE" */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginBottom: '8px',
        }}
      >
        <span
          style={{
            color: '#4d5945',
            fontSize: '11px',
            fontWeight: 650,
            fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
          }}
        >
          {activeTiers.length}
        </span>
        <span
          style={{
            color: '#1a1e17',
            fontSize: '10px',
            fontWeight: 650,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
          }}
        >
          TIERS AVAILABLE
        </span>
        <div style={{ flex: 1, height: '1px', backgroundColor: '#d5dad0', marginLeft: '6px' }} />
      </div>

      {/* 4. THE 4 TIER CARDS GRID (HARMONIZED DRAPZA PALETTE) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '9px',
          marginBottom: '12px',
        }}
      >
        {activeTiers.map((tier) => {
          const isSelected = selectedTier?.id === tier.id;
          const totalUnits = tier.totalQty || 1;
          const rawTotalPrice = unitPrice * totalUnits;
          const bundlePaidPrice = unitPrice * (tier.buyQty || 1);
          const savings = rawTotalPrice - bundlePaidPrice;
          const perUnitPrice = Math.round(bundlePaidPrice / totalUnits);

          // Format clean title
          const displayName = tier.name.replace(/\s*\(STANDARD\)\s*/i, '');

          // Badges harmonized with Drapza's theme:
          // Tier 1 (Standard): Deep Charcoal
          // Tier 3 (Most Popular): Antique Atelier Gold
          // Tier 2 & 4 (Savings/Value): Drapza Olive Green
          let badgeText = tier.badgeText;
          let badgeBg = '#2c3829';
          let badgeColor = '#edf1e8';

          if (totalUnits === 1) {
            badgeText = badgeText || 'STANDARD';
            badgeBg = isSelected ? '#252a22' : '#1a1f18';
            badgeColor = '#edf1e8';
          } else if (tier.popular || totalUnits === 3) {
            badgeText = badgeText || 'MOST POPULAR';
            badgeBg = isSelected ? '#d4b26f' : '#2d2619';
            badgeColor = isSelected ? '#121511' : '#ecd4a2';
          } else if (totalUnits === 4) {
            badgeText = badgeText || 'BEST VALUE';
            badgeBg = isSelected ? '#33442f' : '#273424';
            badgeColor = '#e3ece0';
          } else {
            badgeText = badgeText || `SAVE ${tier.discountPercentage}%`;
            badgeBg = isSelected ? '#33442f' : '#273424';
            badgeColor = '#e3ece0';
          }

          return (
            <button
              key={tier.id}
              type="button"
              onClick={() => {
                try {
                  audioSystem.playClick(600);
                } catch (e) {}
                onSelectTier(tier);
              }}
              style={{
                position: 'relative',
                textAlign: 'left',
                padding: '9px 12px',
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '7px',
                transition: 'all 0.15s ease',
                backgroundColor: isSelected ? '#141713' : '#f5f7f2',
                border: isSelected ? '1.5px solid #283025' : '1px solid #d5dad0',
                boxShadow: isSelected
                  ? '0 4px 14px rgba(18, 22, 17, 0.28)'
                  : '0 1px 3px rgba(0, 0, 0, 0.03)',
                boxSizing: 'border-box',
              }}
            >
              {/* Top Row: Radio + Title + Subtitle + Badge */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  width: '100%',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '7px' }}>
                  {/* Luxury Radio Circle */}
                  <div
                    style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      border: isSelected ? '1.5px solid #d4b26f' : '1px solid #9aa095',
                      backgroundColor: isSelected ? '#0d100c' : '#edf1e8',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '1px',
                    }}
                  >
                    {isSelected && (
                      <div
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: '#d4b26f',
                        }}
                      />
                    )}
                  </div>

                  <div>
                    <span
                      style={{
                        display: 'block',
                        fontSize: '11px',
                        fontWeight: 650,
                        letterSpacing: '0.02em',
                        textTransform: 'uppercase',
                        color: isSelected ? '#edf1e8' : '#141713',
                        fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
                        lineHeight: 1.25,
                      }}
                    >
                      {displayName}
                    </span>

                    <span
                      style={{
                        display: 'block',
                        fontSize: '9px',
                        color: isSelected ? '#9ea599' : '#6b7267',
                        marginTop: '2px',
                        fontWeight: 450,
                      }}
                    >
                      {totalUnits > 1
                        ? `${totalUnits} Pieces (${tier.getQty} Free)`
                        : 'Single Piece Standard'}
                    </span>
                  </div>
                </div>

                {/* Pill Badge on Top-Right */}
                <span
                  style={{
                    backgroundColor: badgeBg,
                    color: badgeColor,
                    fontSize: '8px',
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    padding: '2px 7px',
                    borderRadius: '16px',
                    fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
                    flexShrink: 0,
                  }}
                >
                  {badgeText}
                </span>
              </div>

              {/* Middle Row: Price on Left + Folded Garment Preview on Right */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  width: '100%',
                }}
              >
                {/* Price Display */}
                <div>
                  <span
                    style={{
                      fontSize: '15.5px',
                      fontWeight: 700,
                      color: isSelected ? '#edf1e8' : '#141713',
                      fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
                    }}
                  >
                    ₹{bundlePaidPrice.toLocaleString('en-IN')}
                  </span>
                  {savings > 0 && (
                    <span
                      style={{
                        fontSize: '10.5px',
                        textDecoration: 'line-through',
                        color: isSelected ? '#71786c' : '#8e9689',
                        marginLeft: '6px',
                        fontWeight: 450,
                        fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
                      }}
                    >
                      ₹{rawTotalPrice.toLocaleString('en-IN')}
                    </span>
                  )}
                </div>

                {/* Folded Shirts Visual Preview Box matching screenshot */}
                <FoldedGarmentsVisual count={totalUnits} isDark={isSelected} />
              </div>

              {/* Bottom Row: Savings Green Pill + Per-Piece Rate */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '3px',
                  width: '100%',
                }}
              >
                {savings > 0 ? (
                  <>
                    <span
                      style={{
                        backgroundColor: isSelected ? '#253422' : '#dbe3d8',
                        color: isSelected ? '#cde0c7' : '#263422',
                        fontSize: '8.5px',
                        fontWeight: 600,
                        letterSpacing: '0.02em',
                        padding: '2px 7px',
                        borderRadius: '16px',
                        fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
                      }}
                    >
                      SAVE ₹{savings.toLocaleString('en-IN')} ({tier.discountPercentage}%)
                    </span>
                    <span
                      style={{
                        fontSize: '9.5px',
                        color: isSelected ? '#9ea599' : '#5f675b',
                        fontWeight: 500,
                        fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
                      }}
                    >
                      ₹{perUnitPrice}/PC
                    </span>
                  </>
                ) : (
                  <span
                    style={{
                      fontSize: '8.5px',
                      color: isSelected ? '#9ea599' : '#6b7267',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      fontWeight: 500,
                      fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
                    }}
                  >
                    STANDARD ATELIER RELEASE
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* 5. "SELECT SIZES FOR EACH GARMENT" SECTION (HARMONIZED DRAPZA PALETTE) */}
      {selectedTier && selectedTier.totalQty > 1 && config.allowSizeMix && onChangeGarmentSize && (
        <div style={{ marginTop: '12px' }}>
          {/* Header with Shirt Icon */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: '8px',
            }}
          >
            <Shirt size={12} color="#1a1e17" strokeWidth={1.8} style={{ flexShrink: 0 }} />
            <span
              style={{
                color: '#1a1e17',
                fontSize: '10px',
                fontWeight: 650,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
              }}
            >
              SELECT SIZES FOR EACH GARMENT ({selectedTier.totalQty} PIECES PACK)
            </span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#d5dad0', marginLeft: '6px' }} />
          </div>

          {/* Piece Size Rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {Array.from({ length: selectedTier.totalQty }).map((_, gIdx) => {
              const currentGarmentSize = garmentSizes[gIdx] || availableSizes[0] || 'M';
              const isComplimentary = gIdx >= selectedTier.buyQty;

              return (
                <div
                  key={gIdx}
                  style={{
                    backgroundColor: '#f5f7f2',
                    border: '1px solid #d5dad0',
                    borderRadius: '8px',
                    padding: '6px 11px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
                    boxSizing: 'border-box',
                    gap: '10px',
                  }}
                >
                  {/* Left: PIECE #N + PAID / FREE GIFT badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      style={{
                        color: '#141713',
                        fontSize: '10.5px',
                        fontWeight: 650,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
                      }}
                    >
                      PIECE #{gIdx + 1}
                    </span>
                    <span
                      style={{
                        backgroundColor: isComplimentary ? '#273424' : '#dbe3d8',
                        color: isComplimentary ? '#edf1e8' : '#263422',
                        fontSize: '8px',
                        fontWeight: 600,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                        padding: '2px 7px',
                        borderRadius: '16px',
                        fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
                      }}
                    >
                      {isComplimentary ? 'FREE GIFT' : 'PAID'}
                    </span>
                  </div>

                  {/* Right: Size Buttons [ S ] [ M ] [ L ] [ XL ] */}
                  <div style={{ display: 'flex', gap: '5px' }}>
                    {availableSizes.map((sz) => {
                      const isSzActive = currentGarmentSize === sz;
                      return (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => onChangeGarmentSize(gIdx, sz)}
                          style={{
                            width: '29px',
                            height: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '10px',
                            fontWeight: isSzActive ? 650 : 500,
                            borderRadius: '5px',
                            cursor: 'pointer',
                            backgroundColor: isSzActive ? '#141713' : '#edf1e8',
                            color: isSzActive ? '#edf1e8' : '#141713',
                            border: isSzActive ? '1.5px solid #141713' : '1px solid #c8cfc3',
                            boxShadow: isSzActive ? '0 1px 3px rgba(0,0,0,0.2)' : 'none',
                            fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
                            transition: 'all 0.1s ease',
                          }}
                        >
                          {sz}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
