'use client';

import React from 'react';
import { TextMotion } from './TextMotion';
import { ProductCard } from './drapza/ProductCard';

/**
 * 1:1 Modular Featured Products Section — Responsive Grid
 * Mobile (<640px): 1 card per row (full-width stacked, showing all cards)
 * Tablet (640px-1023px): 2 cards per row
 * Desktop (>=1024px): 4 cards per row
 */
export function FeaturedProducts({
  products = [],
  navigate = null,
  addToCart = null,
  className = '',
  style = {},
}) {
  const handleNav = (path, e) => {
    if (e) e.preventDefault();
    if (navigate) navigate(path);
  };

  return (
    <section className={`featured-products ${className}`.trim()} style={style}>
      <div className="container">
        {/* Header */}
        <div className="featured-products-header">
          <TextMotion type="flicker">
            <p>Featured Units</p>
          </TextMotion>
          <TextMotion type="slide" delay={0.2}>
            <h3>
              Selected <br /> Garments
            </h3>
          </TextMotion>
        </div>

        {/* Separator */}
        <div className="featured-products-separator">
          <div className="featured-products-divider"></div>
          <div className="featured-products-labels">
            <p>Primary Set</p>
            <a
              href="/wardrobe"
              onClick={(e) => handleNav('/wardrobe', e)}
            >
              View Archive
            </a>
          </div>
        </div>

        {/* Responsive Product Grid */}
        <div className="featured-products-list">
          {products
            .filter((prod) => prod.inStock !== false && (typeof prod.stock !== 'number' || prod.stock > 0))
            .map((prod, idx) => {
            const slug =
              prod.slug ||
              prod.name
                .toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^a-z0-9-]/g, '');
            const imgUrl =
              (prod.images && prod.images[0]) ||
              prod.image_url ||
              prod.image ||
              `/products/product_${prod.local_index || idx + 1}.png`;
            const price = prod.price || prod.numericPrice || 1200;

            return (
              <ProductCard
                key={prod._id || prod.name || idx}
                id={prod._id || prod.id}
                name={prod.name}
                price={price}
                imageUrl={imgUrl}
                slug={slug}
                className="h-full w-full"
                product={prod}
                discountTagActive={prod.discountTagActive}
                discountPercentage={prod.discountPercentage}
                discountPrice={prod.discountPrice}
                offerTag={prod.offerTag}
                originalPrice={prod.numericPrice || prod.price}
                onNavigate={(path) => handleNav(path)}
                onAddToCart={
                  addToCart
                    ? (cartPayload) =>
                      addToCart(
                        cartPayload || {
                          ...prod,
                          price,
                          image_url: imgUrl,
                          local_index: prod.local_index || idx + 1,
                          slug,
                        }
                      )
                    : undefined
                }
              />
            );
          })}
        </div>
      </div>

      <style jsx>{`
        /* Responsive Grid: 1 column on mobile, 2 on tablet, 4 on desktop */
        .featured-products-list {
          display: grid !important;
          grid-template-columns: minmax(0, 1fr) !important;
          gap: 1.5rem !important;
          margin-top: 1.75rem !important;
          width: 100% !important;
          align-items: stretch;
        }

        @media (min-width: 640px) {
          .featured-products-list {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 1.5rem !important;
          }
        }

        @media (min-width: 1024px) {
          .featured-products-list {
            grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
            gap: 2rem !important;
          }
        }
      `}</style>
    </section>
  );
}

export default FeaturedProducts;
