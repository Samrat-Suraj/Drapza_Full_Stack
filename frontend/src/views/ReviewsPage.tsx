"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import ReviewsSection, { ReviewItem } from "@/components/ReviewsSection";
import { WriteReviewModal } from "../components/drapza/WriteReviewModal";
import { Footer } from "../components/Footer";

export interface ReviewsPageProps {
  initialProductSlug?: string;
}

export const ReviewsPage: React.FC<ReviewsPageProps> = () => {
  const router = useRouter();
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8f7f1]">
      <main>
        <ReviewsSection
          onWriteReview={() => {
            setIsWriteModalOpen(true);
          }}
          onViewProduct={(review: ReviewItem) => {
            const slug =
              review.productSlug ||
              (review.product === "Floral Printed Kurti"
                ? "unit-01"
                : review.product === "Lehenga Set"
                ? "phase-field"
                : "subzero");
            router.push(`/wardrobe/${slug}`);
          }}
        />
      </main>

      {isWriteModalOpen && (
        <WriteReviewModal
          isOpen={isWriteModalOpen}
          onClose={() => setIsWriteModalOpen(false)}
          productId="6abf8f0d8a2b388b59afef78"
          productName="Atelier Signature Collection"
          productImage="/images/drapza/products/product_1.png"
          onReviewSubmitted={() => {
            setIsWriteModalOpen(false);
          }}
        />
      )}

      <Footer navigate={(path: string) => router.push(path)} />
    </div>
  );
};

export default ReviewsPage;
