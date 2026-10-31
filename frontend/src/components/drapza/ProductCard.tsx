"use client";

import React, { useState } from "react";
import { Heart } from "lucide-react";
import { ImageWithSkeleton } from "./skeletons";
import { useOptionalWishlist, WishlistItem } from "@/context/WishlistContext";

export interface ProductCardProps {
  id?: string | number;
  name: string;
  price: string | number;
  image?: string;
  imageUrl?: string;
  image_url?: string;
  slug?: string;
  onNavigate?: (path: string) => void;
  onAddToCart?: (product: any) => void;
  onToggleWishlist?: (product: any) => void;
  isWishlisted?: boolean;
  className?: string;
  buttonLabel?: string;
  // Admin discount controls
  discountTagActive?: boolean;
  discountPercentage?: number;
  discountPrice?: number;
  offerTag?: string;
  originalPrice?: string | number;
  product?: any;
}

/**
 * DRAPZA Product Card — Tailwind CSS rewrite of the original .product CSS.
 *
 * Matches Screenshot 1 (target design) exactly:
 *  - Card bg: var(--base-200) #d7dbd2 throughout
 *  - Image area: padding 2rem top, 1.5rem sides, 0 bottom (pt-8 px-6)
 *    so model floats inside with visible card-bg margin on top and sides
 *  - Top-left wishlist button
 *  - Top-right discount badge when admin enables discountTagActive
 *  - Image aligned to bottom (items-end) so sneakers sit at seam
 *  - info strip: bg same as card, padding 0 1rem 1rem (px-4 pb-4)
 *  - name/price row: padding 0.5rem (p-2), justify-between, DM Mono
 *  - Strikethrough original price if discounted
 *  - ADD TO CART: full-width, bg base-700, border-radius 0.5rem, py-3, DM Mono uppercase
 */
export const ProductCard: React.FC<ProductCardProps> = ({
  id,
  name,
  price,
  image,
  imageUrl,
  image_url,
  slug,
  onNavigate,
  onAddToCart,
  onToggleWishlist,
  isWishlisted: propIsWishlisted,
  className = "",
  buttonLabel = "ADD TO CART",
  discountTagActive,
  discountPercentage,
  discountPrice,
  offerTag,
  originalPrice,
  product,
}) => {
  const activeImage =
    imageUrl || image_url || image || product?.image_url || product?.images?.[0] || "/products/product_1.png";

  const rawPrice = String(price).replace(/^₹/, "").trim();

  // Extract discount fields from explicit props or nested product object
  const isTagActive =
    discountTagActive !== undefined
      ? Boolean(discountTagActive)
      : product?.discountTagActive !== undefined
      ? Boolean(product.discountTagActive)
      : false;

  const discPercent =
    discountPercentage !== undefined
      ? Number(discountPercentage)
      : product?.discountPercentage !== undefined
      ? Number(product.discountPercentage)
      : 0;

  const tagLabel =
    offerTag !== undefined
      ? String(offerTag).trim()
      : product?.offerTag !== undefined
      ? String(product.offerTag).trim()
      : "";

  const discPriceNum =
    discountPrice !== undefined
      ? Number(discountPrice)
      : product?.discountPrice !== undefined
      ? Number(product.discountPrice)
      : 0;

  const basePriceNum =
    originalPrice !== undefined
      ? Number(String(originalPrice).replace(/[^\d.]/g, ""))
      : product?.numericPrice !== undefined
      ? Number(product.numericPrice)
      : Number(rawPrice.replace(/[^\d.]/g, "")) || 0;

  // Active discount determination from admin controls
  const isMemberActiveForBadge = Boolean(product?.isMember);
  const showDiscountBadge =
    (isTagActive && (discPercent > 0 || tagLabel.length > 0 || discPriceNum > 0)) || isMemberActiveForBadge;

  const badgeText = isMemberActiveForBadge
    ? `VIP ${product?.memberDiscountPercent || 15}% OFF`
    : tagLabel || (discPercent > 0 ? `${discPercent}% OFF` : "OFFER");

  let finalPriceVal = basePriceNum;
  if (isTagActive) {
    if (discPriceNum > 0 && discPriceNum < basePriceNum) {
      finalPriceVal = discPriceNum;
    } else if (discPercent > 0) {
      finalPriceVal = Math.round(basePriceNum * (1 - discPercent / 100));
    }
  }

  // Member Special Pricing logic
  const isMemberActive = Boolean(product?.isMember);
  const memberPriceNum = typeof product?.memberPrice === "number" && product.memberPrice > 0 ? product.memberPrice : 0;
  if (isMemberActive && memberPriceNum > 0 && memberPriceNum < finalPriceVal) {
    finalPriceVal = memberPriceNum;
  }

  const hasDiscountedPrice = (isTagActive || isMemberActive) && finalPriceVal > 0 && finalPriceVal < basePriceNum;

  const isOutOfStock =
    product?.inStock === false ||
    (product?.stock !== undefined && product?.stock !== null && Number(product.stock) <= 0);

  const wishlistContext = useOptionalWishlist();
  const productId = String(id || product?._id || product?.id || slug || name);
  const [localWishlisted, setLocalWishlisted] = useState<boolean>(() => {
    if (propIsWishlisted !== undefined) return Boolean(propIsWishlisted);
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("drapza_atelier_wishlist_v1");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            return parsed.some((it: any) => String(it.id) === productId);
          }
        }
      } catch (_) {}
    }
    return false;
  });

  const isItemWishlisted =
    propIsWishlisted !== undefined
      ? Boolean(propIsWishlisted)
      : wishlistContext
      ? wishlistContext.isWishlisted(productId)
      : localWishlisted;

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const wishlistItem: WishlistItem = {
      id: productId,
      slug: slug || "",
      name,
      price: hasDiscountedPrice ? `₹${finalPriceVal.toLocaleString("en-IN")}` : `₹${rawPrice}`,
      numericPrice: hasDiscountedPrice ? finalPriceVal : basePriceNum,
      image: activeImage,
      category: product?.category || "Apparel",
    };

    if (wishlistContext) {
      wishlistContext.toggleWishlist(wishlistItem);
    } else {
      setLocalWishlisted((prev) => !prev);
      if (typeof window !== "undefined") {
        try {
          const stored = localStorage.getItem("drapza_atelier_wishlist_v1");
          let list: any[] = stored ? JSON.parse(stored) : [];
          if (!Array.isArray(list)) list = [];
          const exists = list.some((it) => String(it.id) === productId);
          if (exists) {
            list = list.filter((it) => String(it.id) !== productId);
          } else {
            list.push(wishlistItem);
          }
          localStorage.setItem("drapza_atelier_wishlist_v1", JSON.stringify(list));
        } catch (_) {}
      }
    }

    if (onToggleWishlist) {
      onToggleWishlist(wishlistItem);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (onNavigate && slug) {
      e.preventDefault();
      onNavigate(`/wardrobe/${slug}`);
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    if (onAddToCart) {
      onAddToCart({
        ...(product || {}),
        id: id || product?._id || product?.id,
        name,
        price: hasDiscountedPrice ? finalPriceVal : (Number(rawPrice.replace(/[^\d.]/g, "")) || basePriceNum),
        numericPrice: hasDiscountedPrice ? finalPriceVal : basePriceNum,
        originalPrice: basePriceNum,
        discountTagActive: isTagActive,
        discountPercentage: isTagActive ? discPercent : 0,
        discountPrice: isTagActive ? discPriceNum : 0,
        offerTag: isTagActive ? tagLabel : "",
        slug,
        image_url: activeImage,
      });
    }
  };

  return (
    <div
      className={`product ${className}`.trim()}
      style={{
        minWidth: 0,
        width: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        height: "100%",
        backgroundColor: "var(--base-200, #d7dbd2)",
        borderRadius: "0.75rem",
        overflow: "hidden",
      }}
    >
      <div
        className="product-img relative"
        style={{
          position: "relative",
          cursor: "pointer",
          width: "100%",
          flex: "1 1 auto",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "1.5rem 1.5rem 1rem",
          backgroundColor: "var(--base-200, #d7dbd2)",
          overflow: "hidden",
        }}
        onClick={handleCardClick}
      >
        {/* Top-Left Wishlist Heart Button (User Requested Location) */}
        <button
          type="button"
          aria-label={isItemWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          title={isItemWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          onClick={handleWishlistToggle}
          className="product-wishlist-btn"
          style={{
            position: "absolute",
            top: "0.85rem",
            left: "0.85rem",
            zIndex: 15,
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            backgroundColor: "rgba(255, 255, 255, 0.85)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            border: "1px solid rgba(0, 0, 0, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
            padding: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#ffffff";
            e.currentTarget.style.transform = "scale(1.1)";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.12)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.85)";
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.08)";
          }}
        >
          <Heart
            style={{
              width: "17px",
              height: "17px",
              transition: "transform 0.15s ease, fill 0.2s ease, color 0.2s ease",
              fill: isItemWishlisted ? "#dc2626" : "none",
              color: isItemWishlisted ? "#dc2626" : "#18181b",
              strokeWidth: 2,
            }}
          />
        </button>

        {/* Top-Right Admin Discount Badge */}
        {showDiscountBadge && (
          <div
            className="product-discount-badge animate-fadeIn"
            style={{
              position: "absolute",
              top: "0.75rem",
              right: "0.75rem",
              zIndex: 10,
              backgroundColor: "#dc2626",
              color: "#ffffff",
              fontFamily: "var(--font-dm-mono, 'DM Mono'), monospace",
              fontSize: "9px",
              fontWeight: 600,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              padding: "4px 9px",
              borderRadius: "4px",
              boxShadow: "0 1px 4px rgba(0, 0, 0, 0.18)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              gap: "4px",
              lineHeight: 1,
              pointerEvents: "none",
            }}
          >
            <span
              style={{
                width: "4px",
                height: "4px",
                borderRadius: "50%",
                backgroundColor: "#ffffff",
                display: "inline-block",
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: "9px", lineHeight: 1, whiteSpace: "nowrap", textAlign: "center" }}>
              {badgeText}
            </span>
          </div>
        )}

        <ImageWithSkeleton src={activeImage} alt={name} />
      </div>

      <div
        className="product-info"
        style={{
          width: "100%",
          minWidth: 0,
          backgroundColor: "var(--base-200, #d7dbd2)",
        }}
      >
        <div
          className="product-info-wrapper"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
            minWidth: 0,
            gap: "0.5rem",
          }}
        >
          <p
            title={name}
            style={{
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              minWidth: 0,
              flex: "1 1 0%",
              margin: 0,
            }}
          >
            {name}
          </p>

          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: "0.45rem",
              flexShrink: 0,
              whiteSpace: "nowrap",
              margin: 0,
            }}
          >
            <p style={{ margin: 0, fontWeight: 700 }}>
              ₹{hasDiscountedPrice ? finalPriceVal.toLocaleString("en-IN") : rawPrice}
            </p>
            {hasDiscountedPrice && (
              <span
                style={{
                  fontSize: "0.75rem",
                  color: "var(--base-500, #7d807a)",
                  textDecoration: "line-through",
                  fontWeight: 500,
                }}
              >
                ₹{basePriceNum.toLocaleString("en-IN")}
              </span>
            )}
            {isMemberActive && (
              <span
                style={{
                  fontSize: "0.65rem",
                  backgroundColor: "#000",
                  color: "#fff",
                  padding: "0.1rem 0.35rem",
                  borderRadius: "0.25rem",
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                }}
              >
                VIP
              </span>
            )}
          </div>
        </div>

        {onAddToCart && (
          <button
            type="button"
            className="add-to-cart-btn"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            style={{
              cursor: isOutOfStock ? "not-allowed" : "pointer",
              opacity: isOutOfStock ? 0.6 : 1,
            }}
          >
            {isOutOfStock ? "OUT OF STOCK" : buttonLabel}
          </button>
        )}
      </div>
    </div>
  );
};

export default ProductCard;