"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import ReviewsSection, { ReviewItem } from "@/components/ReviewsSection";
import { WriteReviewModal } from "./WriteReviewModal";

interface ProductReviewsSectionProps {
  productId: string;
  productName: string;
  productImage?: string;
  productSlug?: string;
}

export const ProductReviewsSection: React.FC<ProductReviewsSectionProps> = ({
  productId,
  productName,
  productImage,
  productSlug,
}) => {
  const router = useRouter();
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);

  return (
    <div id="product-reviews-section">
      <ReviewsSection
        productId={productId || productSlug}
        productName={productName}
        onWriteReview={() => {
          setIsWriteModalOpen(true);
        }}
        onViewProduct={(review: ReviewItem) => {
          const targetSlug =
            review.productSlug ||
            productSlug ||
            (review.product === "Floral Printed Kurti"
              ? "unit-01"
              : review.product === "Lehenga Set"
              ? "phase-field"
              : "subzero");
          router.push(`/wardrobe/${targetSlug}`);
        }}
      />

      {isWriteModalOpen && (
        <WriteReviewModal
          isOpen={isWriteModalOpen}
          onClose={() => setIsWriteModalOpen(false)}
          productId={productId || productSlug || "6abf8f0d8a2b388b59afef78"}
          productName={productName || "DRAPZA Atelier Piece"}
          productImage={productImage || "/images/drapza/products/product_1.png"}
          onReviewSubmitted={() => {
            setIsWriteModalOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default ProductReviewsSection;
