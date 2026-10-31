'use client';

import React, { useState, useMemo } from 'react';
import { Hero } from '../components/Hero';
import { AboutSection } from '../components/AboutSection';
import { FeaturedProducts } from '../components/FeaturedProducts';
import { MarqueeBanner } from '../components/MarqueeBanner';
import { TextBlock } from '../components/TextBlock';
import { PeelReveal } from '../components/PeelReveal';
import { CtaSection } from '../components/CtaSection';
import { ContactForm } from '../components/ContactForm';
import { Footer } from '../components/Footer';
import { useRouter } from 'next/navigation';
import { usePageTransition } from '../components/PageTransition';
import { useCart } from '../context/CartContext';
import productsData from '../data/products.json';
import { useGetProductsQuery } from '../redux/api/productApi';
import { getIsFirstLoad, markAsLoaded } from '../utils/loadState';
import { useHomePageCms } from '../hooks/useHomePageCms';

/**
 * HomePage View
 * Fully modular architecture: every single section is an isolated, reusable component.
 * Dynamic CMS data synchronized via the useHomePageCms hook.
 */
export const HomePage = ({ navigate: propNavigate }) => {
  const router = useRouter();
  const { navigate: transitionNavigate } = usePageTransition() || {};
  const navigate = propNavigate || transitionNavigate || ((path) => router.push(path));
  const { addToCart } = useCart();
  const [firstVisit] = useState(() => getIsFirstLoad());

  const {
    heroConfig,
    statementConfig,
    marqueeConfig,
    ctaConfig,
    textBlockConfig,
    peelRevealConfig,
    contactConfig,
    footerConfig,
  } = useHomePageCms();
  const { data: apiData } = useGetProductsQuery();
  const sourceProducts = apiData?.products && apiData.products.length > 0 ? apiData.products : productsData;
  const inStockProducts = useMemo(() => {
    const available = (sourceProducts || []).filter(
      (prod) => prod.inStock !== false && (typeof prod.stock !== 'number' || prod.stock > 0)
    );
    return available.length > 0 ? available : sourceProducts;
  }, [sourceProducts]);
  const featured = inStockProducts.slice(0, 4);

  return (
    <div className="page">
      {/* 1. Hero Section */}
      <Hero
        config={heroConfig}
        firstVisit={firstVisit}
        onLoaded={markAsLoaded}
      />

      {/* 2. About / Brand Statement Section */}
      <AboutSection config={statementConfig} />

      {/* 3. Featured Products Collection */}
      <FeaturedProducts
        products={featured}
        navigate={navigate}
        addToCart={addToCart}
      />

      {/* 4. Kinetic Marquee Banner Section */}
      <MarqueeBanner config={marqueeConfig} />

      {/* 5. Minimalist Text Block */}
      <TextBlock config={textBlockConfig} />

      {/* 6. Interactive Peel Reveal Mask */}
      <PeelReveal config={peelRevealConfig} />

      {/* 7. Lookbook CTA Section */}
      <CtaSection config={ctaConfig} navigate={navigate} />

      {/* 8. Footer Contact Form & Global Footer */}
      <ContactForm config={contactConfig} />
      <Footer config={footerConfig} navigate={navigate} />
    </div>
  );
};

export default HomePage;
